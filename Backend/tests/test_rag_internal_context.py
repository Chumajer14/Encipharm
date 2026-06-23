from types import SimpleNamespace

from app.services import rag_service


def _patch_common_sources(monkeypatch):
    monkeypatch.setattr(
        rag_service,
        "list_clientes",
        lambda _db, vendedor_uid=None, limit=120: [
            {
                "id": "cliente-1",
                "nombre": "Plantel Sur",
                "empresa": "Plantel Sur SpA",
                "email": "contacto@plantel.cl",
                "telefono": "12345678",
                "rubro": "Porcino",
                "region": "Los Lagos",
                "estado": "En proceso",
                "vendedorUid": "seller-1",
                "ownerUid": "seller-1",
            }
        ],
    )
    monkeypatch.setattr(
        rag_service,
        "list_opportunities",
        lambda _db, user, limit=120: [
            {
                "id": "opp-1",
                "titulo": "Renovacion bioseguridad",
                "clienteId": "cliente-1",
                "etapa": "negociacion",
                "valorEstimado": 1500000,
                "probabilidad": 70,
                "vendedorUid": "seller-1",
            }
        ],
    )
    monkeypatch.setattr(
        rag_service,
        "list_proposals",
        lambda _db, user, limit=120: [
            {
                "id": "proposal-1",
                "titulo": "Propuesta bioseguridad anual",
                "clienteId": "cliente-1",
                "oportunidadId": "opp-1",
                "estado": "enviada",
                "montoNeto": 1000000,
                "montoTotal": 950000,
                "descuentoPct": 5,
                "vendedorUid": "seller-1",
            }
        ],
    )
    monkeypatch.setattr(
        rag_service,
        "list_interactions",
        lambda _db, user, limit=80: [
            {
                "id": "interaction-1",
                "tipo": "visita",
                "clienteId": "cliente-1",
                "fecha": "2026-06-18T12:00:00Z",
                "resumen": "Cliente solicita seguimiento de propuesta",
                "resultado": "Interesado",
                "proximaAccion": "Enviar ficha tecnica",
                "vendedorUid": "seller-1",
            }
        ],
    )
    monkeypatch.setattr(
        rag_service,
        "build_dashboard",
        lambda _db, vendedor_uid=None: {
            "totalClientes": 1,
            "totalOportunidades": 1,
            "valorPipeline": 1500000,
            "totalPropuestas": 1,
            "valorPropuestasAceptadas": 0,
        },
    )


def test_internal_context_includes_users_for_supervisor(monkeypatch):
    _patch_common_sources(monkeypatch)
    monkeypatch.setattr(
        rag_service,
        "list_users",
        lambda _db, activo=None, limit=500: [
            {
                "uid": "seller-1",
                "nombre": "Maria Soto",
                "email": "maria@enci.cl",
                "rol": "vendedor",
                "cargo": "Vendedor",
                "rango": "Vendedor",
                "zona": "Zona sur",
                "activo": True,
                "webApp": True,
                "appMovil": True,
            }
        ],
    )

    chunks = rag_service.build_internal_context_chunks(None, "dime todos los usuarios vendedores", {"rol": "supervisor"}, limit=8)

    assert any(chunk["documento"] == "CRM usuarios" and "Maria Soto" in chunk["texto"] for chunk in chunks)
    assert any(chunk["documento"] == "CRM usuarios" and "Por rol" in chunk["texto"] for chunk in chunks)


def test_internal_context_limits_users_for_seller(monkeypatch):
    _patch_common_sources(monkeypatch)
    monkeypatch.setattr(rag_service, "list_users", lambda *_args, **_kwargs: [])
    user = {
        "uid": "seller-1",
        "email": "maria@enci.cl",
        "nombre": "Maria Soto",
        "rol": "vendedor",
        "cargo": "Vendedor",
        "rango": "Vendedor",
        "zona": "Zona sur",
        "activo": True,
        "webApp": True,
        "appMovil": True,
    }

    chunks = rag_service.build_internal_context_chunks(None, "dime todos los usuarios", user, limit=8)

    assert any(chunk["documento"] == "CRM usuarios" and "Maria Soto" in chunk["texto"] for chunk in chunks)
    assert not any(chunk["documento"] == "CRM usuarios" and "Total usuarios registrados" in chunk["texto"] for chunk in chunks)


def test_internal_context_retrieves_commercial_records(monkeypatch):
    _patch_common_sources(monkeypatch)
    monkeypatch.setattr(rag_service, "list_users", lambda *_args, **_kwargs: [])

    chunks = rag_service.build_internal_context_chunks(None, "estado de propuesta bioseguridad plantel", {"rol": "admin"}, limit=10)

    assert any("Propuesta bioseguridad anual" in chunk["texto"] for chunk in chunks)
    assert any("Plantel Sur" in chunk["texto"] for chunk in chunks)


def test_general_question_does_not_match_client_by_single_word(monkeypatch):
    _patch_common_sources(monkeypatch)
    monkeypatch.setattr(rag_service, "list_users", lambda *_args, **_kwargs: [])

    chunks = rag_service.build_internal_context_chunks(
        None,
        "que es un plantel",
        {"rol": "admin"},
        limit=10,
    )

    assert chunks == []


def test_internal_context_omits_personal_and_technical_identifiers(monkeypatch):
    _patch_common_sources(monkeypatch)
    monkeypatch.setattr(rag_service, "list_users", lambda *_args, **_kwargs: [])

    chunks = rag_service.build_internal_context_chunks(
        None,
        "interacciones del cliente Plantel Sur",
        {"rol": "admin"},
        limit=10,
    )
    context = "\n".join(chunk["texto"] for chunk in chunks)

    assert "Plantel Sur" in context
    assert "contacto@plantel.cl" not in context
    assert "12345678" not in context
    assert "seller-1" not in context
    assert "cliente-1" not in context


def test_context_selection_prioritizes_corpus_for_conceptual_questions():
    internal = [{"documento": "CRM clientes", "texto": "Cliente Pecuaria Los Andes"}]
    documents = [{"documento": "Manual pecuario", "texto": "Definicion de pecuaria"}]

    selected = rag_service.select_context_chunks("que es la pecuaria", internal, documents, limit=5)

    assert selected == documents


def test_context_selection_combines_internal_data_and_corpus_for_commercial_questions():
    internal = [{"documento": "CRM interacciones", "texto": "Visita al cliente"}]
    documents = [{"documento": "Manual sanitario", "texto": "Recomendacion tecnica"}]

    selected = rag_service.select_context_chunks(
        "que interacciones tenemos con este cliente sobre sanidad",
        internal,
        documents,
        limit=5,
    )

    assert selected == [*internal, *documents]


def test_internal_intent_detection_normalizes_accents():
    assert rag_service.is_internal_data_question("ultima interacción y próxima reunión") is True


def test_document_search_degrades_when_semantic_index_is_unavailable(monkeypatch):
    def raise_index_unavailable():
        from fastapi import HTTPException

        raise HTTPException(status_code=503, detail="Indice semantico no disponible")

    monkeypatch.setattr(rag_service, "_get_collection", raise_index_unavailable)

    assert rag_service.search_similar_chunks("usuarios activos") == []


def test_document_search_uses_filename_to_rerank_spanish_results(monkeypatch):
    class FakeCollection:
        def count(self):
            return 4

        def query(self, **_kwargs):
            return {
                "documents": [[
                    "Contenido general sobre mascotas.",
                    "La Division de Proteccion Pecuaria protege la salud animal.",
                    "La Division de Proteccion Pecuaria protege la salud animal.",
                    "Contenido sobre alimentacion animal.",
                ]],
                "metadatas": [[
                    {"documento": "mascotas.txt", "pagina": 1},
                    {"documento": "04_SAG_pecuaria.txt", "pagina": 1},
                    {"documento": "04_SAG_pecuaria.txt", "pagina": 1},
                    {"documento": "alimentacion.txt", "pagina": 1},
                ]],
                "distances": [[0.58, 0.62, 0.62, 0.70]],
            }

    class FakeModel:
        def encode(self, _values):
            return SimpleNamespace(tolist=lambda: [[0.1, 0.2]])

    monkeypatch.setattr(rag_service, "_get_collection", lambda: FakeCollection())
    monkeypatch.setattr(rag_service, "_load_embedding_model", lambda: FakeModel())
    monkeypatch.setattr(
        rag_service,
        "get_settings",
        lambda: SimpleNamespace(SIMILARITY_THRESHOLD=0.30, MAX_CONTEXT_CHUNKS=5),
    )

    chunks = rag_service.search_similar_chunks("que es la pecuaria", 5)

    assert len(chunks) == 1
    assert chunks[0]["documento"] == "04_SAG_pecuaria.txt"


def test_local_fallback_answers_common_conversational_phrases():
    greeting, _, _, _ = rag_service.no_context_payload("hola")
    wellbeing, _, _, _ = rag_service.no_context_payload("Hola, como estas?")
    doubt, _, _, _ = rag_service.no_context_payload("tengo una duda")

    assert greeting.startswith("Hola. Soy el Asistente Enci")
    assert wellbeing.startswith("Estoy bien y listo para ayudarte")
    assert "escribe tu duda" in doubt


def test_conversational_detection_does_not_capture_domain_questions():
    assert rag_service.is_conversational_question("hola") is True
    assert rag_service.is_conversational_question("Hola, como estas?") is True
    assert rag_service.is_conversational_question("hola necesito informacion sobre pecuaria") is False
    assert rag_service.is_conversational_question("tengo una duda sobre PPA") is False


def test_local_fallback_explains_scope_for_unrelated_questions():
    response, sources, tokens, no_context = rag_service.no_context_payload("Quien gano el partido?")

    assert "enfocado en consultas tecnicas, comerciales, documentales" in response
    assert sources == []
    assert tokens == 0
    assert no_context is True
