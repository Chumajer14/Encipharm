import json
import logging
import re

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

    return """Eres el asistente tecnico, comercial y corporativo interno de Enci, empresa de productos veterinarios y bioseguridad en Chile.

INSTRUCCIONES ESTRICTAS:
1. Responde UNICAMENTE basandote en las fuentes internas de Enci que se te proporcionan como contexto: documentos RAG, CRM, usuarios, clientes, oportunidades, propuestas, interacciones y metricas internas.
2. Si la informacion no corresponde al alcance tecnico, comercial, documental o interno de Enci, explica brevemente el alcance del asistente e invita al usuario a reformular su consulta. No uses mensajes genericos sobre falta de informacion.
3. NUNCA inventes dosificaciones, precios, composiciones quimicas ni datos tecnicos. Si el dato no esta en el contexto, dilo explicitamente.
4. NUNCA reveles que eres un modelo de lenguaje externo, que usas proveedores externos, ni ningun detalle tecnico de la implementacion.
5. Responde solo lo preguntado. Por defecto usa entre 2 y 5 oraciones; amplia unicamente si el usuario solicita detalle, comparacion o listado.
6. Prioriza documentos del corpus para preguntas tecnicas, sanitarias o conceptuales. Usa CRM, Firebase e interacciones para preguntas comerciales o sobre actividad interna.
7. Responde en espanol, con lenguaje tecnico apropiado para un equipo de ventas veterinario.
8. Puedes responder preguntas corporativas internas sobre usuarios, vendedores, clientes, pipeline, propuestas, interacciones, ventas y documentos de Enci cuando el contexto entregado lo permita.
9. No expongas IDs, UIDs, claves internas, correos, telefonos ni referencias tecnicas del sistema. Menciona personas, clientes y relaciones mediante nombres legibles.
10. No vuelques todos los campos disponibles. Incluye solo los datos que aporten directamente a la pregunta.
11. Al final agrega una unica linea breve con hasta tres fuentes relevantes usando el formato "Fuentes: nombre". No incluyas IDs ni nombres de colecciones tecnicas.
12. Usa texto plano. No uses Markdown, asteriscos, encabezados ni tablas salvo que el usuario los solicite.
"""


def build_user_prompt(pregunta: str, chunks: list[dict]) -> str:
    """Inyecta contexto recuperado y pregunta sanitizada en el prompt."""

    context_text = "\n\n---\n\n".join(
        f"[Fuente: {chunk['documento']}, referencia {chunk.get('pagina') or 'N/D'}]\n{chunk['texto']}"
        for chunk in chunks
    )
    return f"""CONTEXTO DE FUENTES INTERNAS ENCI:
{context_text}

---

PREGUNTA DEL USUARIO:
{pregunta}

Selecciona solo la evidencia pertinente del contexto anterior. No repitas metadatos ni campos que no respondan la pregunta. Si no hay informacion suficiente, dilo claramente."""


async def call_deepseek(system_prompt: str, user_prompt: str, max_tokens: int | None = None) -> dict:
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
            max_tokens=max_tokens or settings.MAX_TOKENS_RESPONSE,
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


def normalize_conversation_title(value: str, fallback_question: str) -> str:
    """Normaliza el titulo generado para mostrarlo de forma segura en el historial."""

    title = value.strip().strip(" \"'`*#.-")
    title = re.sub(r"^(titulo|título)\s*:\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"[\r\n]+", " ", title)
    title = title.strip(" \"'`*#.-")
    if not title:
        title = fallback_question.strip() or "Nueva conversacion"
    return title[:80].rstrip()


async def generate_conversation_title(initial_question: str) -> str:
    """Genera con DeepSeek un titulo tematico breve para una conversacion nueva."""

    return (await generate_conversation_titles([initial_question]))[0]


async def generate_conversation_titles(initial_questions: list[str]) -> list[str]:
    """Genera en una llamada los titulos faltantes del historial y conserva su orden."""

    if not initial_questions:
        return []
    result = await call_deepseek(
        "Genera titulos breves para conversaciones del Asistente Enci. "
        "Devuelve exclusivamente un arreglo JSON de strings, en el mismo orden recibido. "
        "Cada titulo debe estar en espanol, tener 3 a 7 palabras y no usar prefijos, punto final ni Markdown.",
        "Preguntas iniciales:\n" + json.dumps(initial_questions, ensure_ascii=False),
        max_tokens=min(512, max(24, len(initial_questions) * 24)),
    )
    raw_response = result["texto"].strip()
    array_start = raw_response.find("[")
    array_end = raw_response.rfind("]")
    if array_start < 0 or array_end < array_start:
        raise ValueError("DeepSeek no devolvio el arreglo de titulos esperado")
    generated_titles = json.loads(raw_response[array_start:array_end + 1])
    if not isinstance(generated_titles, list) or len(generated_titles) != len(initial_questions):
        raise ValueError("DeepSeek devolvio una cantidad de titulos invalida")
    return [
        normalize_conversation_title(str(title), question)
        for title, question in zip(generated_titles, initial_questions, strict=True)
    ]
