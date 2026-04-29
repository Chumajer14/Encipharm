from fastapi import Header, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.firebase import verify_token
from app.services import usuarios as svc_usuarios

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

def require_rol(*roles: str):
    async def checker(current_user: dict = Depends(get_current_user)):
        if current_user.get("rol") not in roles:
            raise HTTPException(status_code=403, detail=f"Se requiere rol: {', '.join(roles)}")
        return current_user
    return checker