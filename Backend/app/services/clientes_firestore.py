from datetime import datetime, UTC
from google.cloud import firestore

db = firestore.Client()


def _now():
    return datetime.now(UTC)


def create_cliente(data: dict) -> dict:
    doc_ref = db.collection("clientes").document()
    now = _now()

    payload = {
        **data,
        "activo": True,
        "createdAt": now,
        "updatedAt": now,
    }

    doc_ref.set(payload)
    return {"id": doc_ref.id, **payload}


def get_cliente_by_id(cliente_id: str) -> dict | None:
    doc = db.collection("clientes").document(cliente_id).get()

    if not doc.exists:
        return None

    return {"id": doc.id, **doc.to_dict()}


def list_clientes(user: dict, search: str | None = None) -> list[dict]:
    role = user.get("role", "vendedor")
    uid = user.get("uid")

    collection = db.collection("clientes")

    if role in ["supervisor", "admin"]:
        docs = collection.stream()
    else:
        docs = collection.where("vendedorId", "==", uid).stream()

    clientes = []
    search_lower = search.lower().strip() if search else None

    for doc in docs:
        item = {"id": doc.id, **doc.to_dict()}

        if search_lower:
            searchable_fields = [
                str(item.get("nombre", "")),
                str(item.get("empresa", "")),
                str(item.get("industria", "")),
                str(item.get("ciudad", "")),
                str(item.get("comuna", "")),
                str(item.get("region", "")),
                str(item.get("rut", "")),
            ]
            hay_match = any(search_lower in field.lower() for field in searchable_fields)
            if not hay_match:
                continue

        clientes.append(item)

    clientes.sort(
        key=lambda x: x.get("updatedAt") or x.get("createdAt") or datetime.min,
        reverse=True,
    )
    return clientes


def update_cliente(cliente_id: str, data: dict) -> dict | None:
    doc_ref = db.collection("clientes").document(cliente_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        return None

    update_data = {
        **data,
        "updatedAt": _now(),
    }

    doc_ref.update(update_data)
    updated = doc_ref.get()
    return {"id": updated.id, **updated.to_dict()}


def delete_cliente(cliente_id: str) -> bool:
    doc_ref = db.collection("clientes").document(cliente_id)
    snapshot = doc_ref.get()

    if not snapshot.exists:
        return False

    doc_ref.delete()
    return True