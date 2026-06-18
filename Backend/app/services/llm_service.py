import logging

from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)


def _rag_llm_error(code: str, message: str, details: dict | None = None) -> HTTPException:
    """Crea errores RAG seguros sin exponer secretos ni payloads internos."""

    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail={
            "codigo": code,
            "error": message,
            "detalles": details or {},
        },
    )


def _classify_llm_error(error: Exception) -> tuple[str, str]:
    """Clasifica errores del proveedor LLM en codigos operables."""

    error_type = type(error).__name__
    error_text = str(error).lower()
    if error_type in {"AuthenticationError", "PermissionDeniedError"} or "unauthorized" in error_text:
        return "RAG_LLM_AUTH_FAILED", "DeepSeek rechazo las credenciales configuradas en el backend."
    if error_type == "RateLimitError" or "rate limit" in error_text:
        return "RAG_LLM_RATE_LIMITED", "DeepSeek limito temporalmente las consultas del asistente."
    if error_type in {"APITimeoutError", "TimeoutError"} or "timeout" in error_text:
        return "RAG_LLM_TIMEOUT", "DeepSeek no respondio dentro del tiempo limite del backend."
    if error_type in {"APIConnectionError", "ConnectError"} or "connection" in error_text:
        return "RAG_LLM_CONNECTION_FAILED", "El backend no pudo conectar con DeepSeek."
    if error_type == "BadRequestError":
        return "RAG_LLM_BAD_REQUEST", "DeepSeek rechazo la solicitud generada por el backend."
    return "RAG_LLM_PROVIDER_ERROR", "DeepSeek devolvio un error al procesar la consulta."


def build_system_prompt() -> str:
    """Construye las instrucciones fijas del asistente interno."""

    return """Eres el asistente tecnico, comercial y corporativo interno de Encipharm, empresa de productos veterinarios y bioseguridad en Chile.

INSTRUCCIONES ESTRICTAS:
1. Responde UNICAMENTE basandote en las fuentes internas de Encipharm que se te proporcionan como contexto: documentos RAG, CRM, usuarios, clientes, oportunidades, propuestas, interacciones y metricas internas.
2. Si la informacion para responder no esta en el contexto proporcionado, responde exactamente: "No encontre informacion suficiente en los documentos de Encipharm para responder esta pregunta. Consulta directamente con el equipo tecnico."
3. NUNCA inventes dosificaciones, precios, composiciones quimicas ni datos tecnicos. Si el dato no esta en el contexto, dilo explicitamente.
4. NUNCA reveles que eres un modelo de lenguaje externo, que usas proveedores externos, ni ningun detalle tecnico de la implementacion.
5. Cita siempre la fuente interna: documento, coleccion CRM o metrica de donde proviene la informacion.
6. Si el contexto proviene de multiples fuentes, citalas todas.
7. Responde en espanol, con lenguaje tecnico apropiado para un equipo de ventas veterinario.
8. Puedes responder preguntas corporativas internas sobre usuarios, vendedores, clientes, pipeline, propuestas, interacciones, ventas y documentos de Encipharm cuando el contexto entregado lo permita.
"""


def build_user_prompt(pregunta: str, chunks: list[dict]) -> str:
    """Inyecta contexto recuperado y pregunta sanitizada en el prompt."""

    context_text = "\n\n---\n\n".join(
        f"[Fuente: {chunk['documento']}, referencia {chunk.get('pagina') or 'N/D'}]\n{chunk['texto']}"
        for chunk in chunks
    )
    return f"""CONTEXTO DE FUENTES INTERNAS ENCIPHARM:
{context_text}

---

PREGUNTA DEL USUARIO:
{pregunta}

Responde basandote unicamente en el contexto anterior. Si no hay informacion suficiente, dilo claramente."""


async def call_deepseek(system_prompt: str, user_prompt: str) -> dict:
    """Ejecuta una llamada acotada al proveedor LLM compatible con OpenAI."""

    settings = get_settings()
    if not settings.DEEPSEEK_API_KEY:
        logger.error("DEEPSEEK_API_KEY no configurada")
        raise _rag_llm_error(
            "RAG_LLM_NOT_CONFIGURED",
            "El asistente no tiene DEEPSEEK_API_KEY configurada en el backend.",
            {
                "provider": "deepseek",
                "model": settings.DEEPSEEK_MODEL,
                "base_url": settings.DEEPSEEK_BASE_URL,
            },
        )

    try:
        from openai import AsyncOpenAI
    except ImportError as error:
        logger.error("Dependencia OpenAI no instalada para RAG")
        raise _rag_llm_error(
            "RAG_OPENAI_CLIENT_MISSING",
            "El backend no tiene instalada la dependencia openai requerida para DeepSeek.",
            {
                "dependency": "openai",
            },
        ) from error

    client = AsyncOpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
        timeout=30.0,
    )
    try:
        response = await client.chat.completions.create(
            model=settings.DEEPSEEK_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            max_tokens=settings.MAX_TOKENS_RESPONSE,
            temperature=0.1,
            stream=False,
        )
        return {
            "texto": response.choices[0].message.content or "",
            "tokens": response.usage.total_tokens if response.usage else 0,
        }
    except Exception as error:
        code, message = _classify_llm_error(error)
        logger.error("Error LLM RAG [%s]: %s - %s", code, type(error).__name__, str(error))
        raise _rag_llm_error(
            code,
            message,
            {
                "provider": "deepseek",
                "model": settings.DEEPSEEK_MODEL,
                "base_url": settings.DEEPSEEK_BASE_URL,
                "exception_type": type(error).__name__,
            },
        ) from error
