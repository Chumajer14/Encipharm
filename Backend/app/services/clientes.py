from datetime import datetime, timezone
from app.services.firestore import get_db as get_firestore
from app.models.cliente import ClienteCreate, ClienteUpdate


def crear_cliente(vendedor_id: str, data: ClienteCreate) -> dict:
    db = get_firestore()
    ref = db.collection("clientes").document()
    now = datetime.now(timezone.utc)
    payload = data.model_dump()
    if payload.get("bant") and data.bant:
        payload["bant"] = data.bant.model_dump()
    cliente = {
        **payload,
        "id": ref.id,
        "vendedorId": vendedor_id,   # ← agrega el dueño
        "createdAt": now,
        "updatedAt": now,
    }
    ref.set(cliente)
    return cliente


def listar_clientes(uid: str, rol: str, industria: str | None = None,
                    ciudad: str | None = None, search: str | None = None) -> list:
    db = get_firestore()
    query = db.collection("clientes")

    if rol == "vendedor":
        query = query.where("vendedorId", "==", uid)
    if industria:
        query = query.where("industria", "==", industria)
    if ciudad:
        query = query.where("ciudad", "==", ciudad)

    clientes = [doc.to_dict() for doc in query.stream()]

    if search:
        term = search.strip().lower()
        clientes = [
            c for c in clientes
            if term in (c.get("nombre", "") or "").lower()
            or term in (c.get("empresa", "") or "").lower()
            or term in (c.get("industria", "") or "").lower()
            or term in (c.get("ciudad", "") or "").lower()
        ]
    return clientes


def obtener_cliente(cliente_id: str, uid: str, rol: str) -> dict | None:
    db = get_firestore()
    doc = db.collection("clientes").document(cliente_id).get()
    if not doc.exists:
        return None
    data = doc.to_dict()
    # Vendedor solo puede ver sus propios clientes
    if rol == "vendedor" and data.get("vendedorId") != uid:
        return None
    return data


def actualizar_cliente(cliente_id: str, uid: str, rol: str,
                       data: ClienteUpdate) -> dict | None:
    cliente = obtener_cliente(cliente_id, uid, rol)
    if not cliente:
        return None
    db = get_firestore()
    ref = db.collection("clientes").document(cliente_id)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    updates["updatedAt"] = datetime.now(timezone.utc)
    if "bant" in updates and data.bant:
        updates["bant"] = data.bant.model_dump()
    ref.update(updates)
    return ref.get().to_dict()


def eliminar_cliente(cliente_id: str, uid: str, rol: str) -> bool:
    cliente = obtener_cliente(cliente_id, uid, rol)
    if not cliente:
        return False
    get_firestore().collection("clientes").document(cliente_id).delete()
    return True