import asyncio

from app.services import llm_service
from app.services.llm_service import build_system_prompt, build_user_prompt


def test_system_prompt_requires_concise_responses_without_sensitive_identifiers():
    """Mantiene respuestas acotadas y evita exponer metadatos internos."""

    prompt = build_system_prompt()

    assert "entre 2 y 5 oraciones" in prompt
    assert "No expongas IDs, UIDs" in prompt
    assert "No vuelques todos los campos" in prompt
    assert "Usa texto plano" in prompt


def test_user_prompt_requests_only_relevant_evidence():
    """Evita que el modelo convierta todo el contexto recuperado en respuesta."""

    prompt = build_user_prompt(
        "Que es la pecuaria?",
        [{"documento": "Manual pecuario", "pagina": 2, "texto": "Definicion interna."}],
    )

    assert "Selecciona solo la evidencia pertinente" in prompt
    assert "No repitas metadatos" in prompt


def test_generated_conversation_title_is_short_and_normalized(monkeypatch):
    """Usa DeepSeek y limpia prefijos o Markdown antes de persistir el titulo."""

    async def fake_call(system_prompt, user_prompt, max_tokens=None):
        assert "arreglo JSON" in system_prompt
        assert "reglas para ingreso de productos" in user_prompt
        assert max_tokens == 24
        return {"texto": '["Ingreso sanitario de productos"]', "tokens": 8}

    monkeypatch.setattr(llm_service, "call_deepseek", fake_call)

    title = asyncio.run(llm_service.generate_conversation_title("reglas para ingreso de productos"))

    assert title == "Ingreso sanitario de productos"


def test_batch_title_generation_preserves_conversation_order(monkeypatch):
    """Asigna cada titulo de IA a la pregunta correspondiente durante el backfill."""

    async def fake_call(_system_prompt, _user_prompt, max_tokens=None):
        assert max_tokens == 48
        return {"texto": '```json\n["Sanidad porcina nacional", "Seguimiento cliente Plantel Sur"]\n```', "tokens": 15}

    monkeypatch.setattr(llm_service, "call_deepseek", fake_call)

    titles = asyncio.run(llm_service.generate_conversation_titles([
        "Que es la peste porcina?",
        "Cual fue la ultima visita a Plantel Sur?",
    ]))

    assert titles == ["Sanidad porcina nacional", "Seguimiento cliente Plantel Sur"]
