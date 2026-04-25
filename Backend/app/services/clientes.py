from app.services.firestore import get_db as get_firestore
from app.models.cliente import ClienteCreate, ClienteUpdate
from datetime import datetime, timezone
from google.cloud.firestore_v1 import SERVER_TIMESTAMP


def crear_cliente(data: ClienteCreate) -> dict:
    db = get_firestore()
    ref = db.collection("clientes").document()
    cliente = {
        **data.model_dump(),
        "id": ref.id,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }
    ref.set(cliente)
    return cliente


def listar_clientes(vendedor_uid: str = None) -> list:
    db = get_firestore()
    query = db.collection("clientes")
    if vendedor_uid:
        query = query.where("vendedor_uid", "==", vendedor_uid)
    docs = query.stream()
    return [doc.to_dict() for doc in docs]


def obtener_cliente(cliente_id: str) -> dict | None:
    db = get_firestore()
    doc = db.collection("clientes").document(cliente_id).get()
    if doc.exists:
        return doc.to_dict()
    return None


def actualizar_cliente(cliente_id: str, data: ClienteUpdate) -> dict | None:
    db = get_firestore()
    ref = db.collection("clientes").document(cliente_id)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updatedAt"] = datetime.now(timezone.utc)
    ref.update(updates)
    return ref.get().to_dict()


def eliminar_cliente(cliente_id: str) -> bool:
    db = get_firestore()
    db.collection("clientes").document(cliente_id).delete()
    return True