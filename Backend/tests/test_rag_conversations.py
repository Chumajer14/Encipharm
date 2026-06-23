from datetime import datetime, timezone

import pytest
from fastapi import HTTPException

from app.services.rag_service import list_conversations, save_conversation_turn


class FakeSnapshot:
    """Representa un documento Firestore minimo para pruebas de conversaciones."""

    def __init__(self, data=None):
        self.data = data
        self.exists = data is not None

    def to_dict(self):
        return self.data


class FakeDocumentReference:
    """Expone lectura y escritura de un documento simulado."""

    def __init__(self, snapshot):
        self.snapshot = snapshot
        self.saved = None

    def get(self):
        return self.snapshot

    def set(self, value):
        self.saved = value


class FakeQuery:
    """Filtra conversaciones simuladas por el UID solicitado."""

    def __init__(self, documents):
        self.documents = documents
        self.requested_uid = None

    def where(self, field, operator, value):
        assert field == "usuarioId"
        assert operator == "=="
        self.requested_uid = value
        return self

    def stream(self):
        return [
            FakeSnapshot(document)
            for document in self.documents
            if document["usuarioId"] == self.requested_uid
        ]


class FakeCollection:
    """Combina consultas y referencias de documentos para el repositorio simulado."""

    def __init__(self, documents=None, snapshot=None):
        self.query = FakeQuery(documents or [])
        self.reference = FakeDocumentReference(snapshot or FakeSnapshot())

    def where(self, field, operator, value):
        return self.query.where(field, operator, value)

    def document(self, _document_id):
        return self.reference


class FakeDb:
    """Entrega una unica coleccion simulada de conversaciones."""

    def __init__(self, collection):
        self.collection_value = collection

    def collection(self, name):
        assert name == "chatConversaciones"
        return self.collection_value


def test_list_conversations_returns_only_authenticated_account():
    collection = FakeCollection(documents=[
        {"id": "own-old", "usuarioId": "user-1", "updatedAt": datetime(2026, 1, 1, tzinfo=timezone.utc)},
        {"id": "other", "usuarioId": "user-2", "updatedAt": datetime(2026, 3, 1, tzinfo=timezone.utc)},
        {"id": "own-new", "usuarioId": "user-1", "updatedAt": datetime(2026, 2, 1, tzinfo=timezone.utc)},
    ])

    result = list_conversations(FakeDb(collection), {"uid": "user-1", "rol": "admin"})

    assert [conversation["id"] for conversation in result] == ["own-new", "own-old"]


def test_save_conversation_rejects_another_account_for_any_role():
    snapshot = FakeSnapshot({
        "usuarioId": "user-2",
        "mensajes": [],
        "createdAt": datetime.now(timezone.utc),
    })
    collection = FakeCollection(snapshot=snapshot)

    with pytest.raises(HTTPException) as error:
        save_conversation_turn(
            FakeDb(collection),
            {"uid": "user-1", "rol": "admin"},
            "Pregunta",
            "Respuesta",
            [],
            0,
            False,
            {"origen": "local"},
            "conversation-1",
        )

    assert error.value.status_code == 403


def test_save_new_conversation_persists_generated_title():
    collection = FakeCollection(snapshot=FakeSnapshot())

    save_conversation_turn(
        FakeDb(collection),
        {"uid": "user-1", "rol": "vendedor", "email": "user@enci.cl"},
        "Que reglas existen para productos?",
        "Respuesta",
        [],
        10,
        False,
        {"origen": "deepseek"},
        "conversation-1",
        "Ingreso sanitario de productos",
    )

    assert collection.reference.saved["titulo"] == "Ingreso sanitario de productos"
