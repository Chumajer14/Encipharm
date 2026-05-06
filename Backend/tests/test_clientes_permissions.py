import pytest
from fastapi import HTTPException

from app.api.clientes import _ensure_cliente_access
from app.models.cliente import ClienteCreate
from app.services.clientes import create_cliente, delete_cliente, get_cliente_or_404


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


class FakeDb:
    def __init__(self):
        self.collections = {"clientes": FakeCollection()}

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


def test_delete_cliente_removes_existing_document():
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
