from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import get_settings
from app.services.firebase import verify_token
from app.services.firestore import get_db

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> dict:
    token = credentials.credentials
    try:
        decoded = await verify_token(token)
    except ValueError as error:
        settings = get_settings()
        detail = "Token invalido o expirado"
        if settings.APP_ENV == "development":
            detail = str(error)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        ) from error

    db = get_db()
    user_doc = db.collection("users").document(decoded["uid"]).get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        if not user_data.get("activo", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo en el sistema",
            )
        decoded["rol"] = user_data.get("rol", "vendedor")
        decoded["nombre"] = user_data.get("nombre", "")
        decoded["activo"] = user_data.get("activo", True)
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
                detail="Usuario no registrado en el sistema",
            )
        user_data = user_doc.to_dict()
        if not user_data.get("activo", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo en el sistema",
            )
        roles_permitidos = {
            "admin": ["admin"],
            "supervisor": ["admin", "supervisor"],
            "vendedor": ["admin", "supervisor", "vendedor"],
        }
        if user_data.get("rol") not in roles_permitidos.get(required_role, []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta accion",
            )
        return {**user, **user_data}

    return role_checker
