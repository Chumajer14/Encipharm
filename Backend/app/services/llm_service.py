import logging

from fastapi import HTTPException, status

from app.core.config import get_settings

logger = logging.getLogger(__name__)


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
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El asistente no esta disponible en este momento. Intenta mas tarde.",
        )

    try:
        from openai import AsyncOpenAI
    except ImportError as error:
        logger.error("Dependencia OpenAI no instalada para RAG")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El asistente no esta disponible en este momento. Intenta mas tarde.",
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
        logger.error("Error LLM RAG: %s - %s", type(error).__name__, str(error))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El asistente no esta disponible en este momento. Intenta mas tarde.",
        ) from error
