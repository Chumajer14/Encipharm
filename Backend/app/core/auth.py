from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.firebase import verify_token
from app.services.firestore import get_db

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    try:
        decoded = await verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    uid = decoded["uid"]
    perfil = svc_usuarios.obtener_usuario(uid)
    if perfil:
        decoded["rol"] = perfil.get("rol", "vendedor")
        decoded["nombre"] = perfil.get("nombre", "")
    else:
        decoded["rol"] = "vendedor"
    return decoded

def require_role(required_role: str):
    async def role_checker(user: dict = Depends(get_current_user)) -> dict:
        db = get_db()
        user_doc = db.collection("users").document(user["uid"]).get()
        if not user_doc.exists:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario no registrado en el sistema"
            )
        user_data = user_doc.to_dict()
        roles_permitidos = {
            "admin": ["admin"],
            "supervisor": ["admin", "supervisor"],
            "vendedor": ["admin", "supervisor", "vendedor"],
        }
        if user_data.get("rol") not in roles_permitidos.get(required_role, []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta acción"
            )
        return {**user, **user_data}
    return role_checker
