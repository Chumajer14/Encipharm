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


def test_document_search_degrades_when_semantic_index_is_unavailable(monkeypatch):
    def raise_index_unavailable():
        from fastapi import HTTPException

        raise HTTPException(status_code=503, detail="Indice semantico no disponible")

    monkeypatch.setattr(rag_service, "_get_collection", raise_index_unavailable)

    assert rag_service.search_similar_chunks("usuarios activos") == []
