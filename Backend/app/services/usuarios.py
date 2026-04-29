from firebase_admin import firestore
from app.models.usuario import UsuarioCreate, UsuarioUpdate
from datetime import datetime, timezone

def _db():
    return firestore.client()

def crear_o_actualizar_usuario(uid: str, data: UsuarioCreate) -> dict:
    ref = _db().collection("users").document(uid)
    if not ref.get().exists:
        ref.set({**data.model_dump(), "uid": uid, "activo": True, "createdAt": datetime.now(timezone.utc)})
    return ref.get().to_dict()

def obtener_usuario(uid: str) -> dict | None:
    doc = _db().collection("users").document(uid).get()
    return doc.to_dict() if doc.exists else None

def listar_usuarios(rol: str | None = None) -> list[dict]:
    ref = _db().collection("users")
    if rol:
        ref = ref.where("rol", "==", rol)
    return [d.to_dict() for d in ref.stream()]

def actualizar_usuario(uid: str, data: UsuarioUpdate) -> dict | None:
    ref = _db().collection("users").document(uid)
    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if updates:
        ref.update(updates)
    return ref.get().to_dict()