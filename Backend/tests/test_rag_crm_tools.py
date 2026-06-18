from app.services import rag_service


def test_detects_sellers_question():
    assert rag_service.is_sellers_question("cuales son los vendedores?")
    assert rag_service.is_sellers_question("quienes son los vendedores activos")
    assert rag_service.is_sellers_question("muestra el equipo de ventas")


def test_ignores_documental_questions():
    assert not rag_service.is_sellers_question("cual es la dosificacion del producto x")


def test_answer_sellers_question_requires_supervisor_role():
    response, sources, tokens, sin_contexto = rag_service.answer_sellers_question(None, {"rol": "vendedor"})

    assert "No tienes permisos" in response
    assert sources[0]["documento"] == "CRM usuarios"
    assert tokens == 0
    assert sin_contexto is False


def test_answer_sellers_question_lists_active_web_sellers(monkeypatch):
    monkeypatch.setattr(
        rag_service,
        "list_users",
        lambda _db, activo, limit: [
            {
                "nombre": "Maria Soto",
                "email": "maria@enci.cl",
                "rol": "vendedor",
                "zona": "Zona sur",
                "cargo": "Vendedor",
                "webApp": True,
            },
            {
                "nombre": "Admin Uno",
                "email": "admin@enci.cl",
                "rol": "admin",
                "zona": "Zona centro",
                "cargo": "Administrador",
                "webApp": True,
            },
            {
                "nombre": "Sin Web",
                "email": "sinweb@enci.cl",
                "rol": "vendedor",
                "zona": "Zona norte",
                "cargo": "Vendedor",
                "webApp": False,
            },
        ],
    )

    response, sources, tokens, sin_contexto = rag_service.answer_sellers_question(None, {"rol": "supervisor"})

    assert "Maria Soto" in response
    assert "Admin Uno" not in response
    assert "Sin Web" not in response
    assert sources[0]["fragmento"] == "1 vendedores activos con acceso web."
    assert tokens == 0
    assert sin_contexto is False
