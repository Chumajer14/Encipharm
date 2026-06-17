from fastapi import Depends, Header, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from google.api_core import exceptions as google_exceptions

from app.core.config import get_settings
from app.models.user import normalize_user_role
from app.services.firebase import verify_token
from app.services.firestore import get_db

security = HTTPBearer()


def normalize_client_platform(value: str | None) -> str:
    normalized = str(value or "web").strip().lower()
    if normalized in {"mobile", "movil", "app", "app_movil", "app-movil"}:
        return "mobile"
    return "web"


def ensure_platform_access(user_data: dict, platform: str | None) -> None:
    normalized_platform = normalize_client_platform(platform)
    access_field = "appMovil" if normalized_platform == "mobile" else "webApp"
    access_label = "app movil" if normalized_platform == "mobile" else "web app"

    user_role = normalize_user_role(user_data.get("rol"))
    if user_role == "sin_acceso":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usuario sin rol habilitado en el sistema",
        )

    if not user_data.get(access_field, user_role != "sin_acceso"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Usuario sin acceso a {access_label}",
        )


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    x_enci_client: str | None = Header(default="web"),
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
    try:
        user_doc = db.collection("users").document(decoded["uid"]).get()
    except google_exceptions.GoogleAPICallError as error:
        raise firestore_unavailable_http_exception(error) from error
    if user_doc.exists:
        user_data = user_doc.to_dict()
        if not user_data.get("activo", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo en el sistema",
            )
        ensure_platform_access(user_data, x_enci_client)
        decoded["rol"] = normalize_user_role(user_data.get("rol"))
        decoded["nombre"] = user_data.get("nombre", "")
        decoded["activo"] = user_data.get("activo", True)
        decoded["_firestore_user"] = user_data
        decoded["_firestore_user_exists"] = True
    else:
        decoded["rol"] = "sin_acceso"
        decoded["_firestore_user"] = None
        decoded["_firestore_user_exists"] = False
    return decoded


def require_role(required_role: str):
    async def role_checker(
        user: dict = Depends(get_current_user),
        x_enci_client: str | None = Header(default="web"),
    ) -> dict:
        db = get_db()
        try:
            user_doc = db.collection("users").document(user["uid"]).get()
        except google_exceptions.GoogleAPICallError as error:
            raise firestore_unavailable_http_exception(error) from error
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
        ensure_platform_access(user_data, x_enci_client)
        roles_permitidos = {
            "admin": ["admin"],
            "supervisor": ["admin", "supervisor"],
            "vendedor": ["admin", "supervisor", "vendedor"],
        }
        user_role = normalize_user_role(user_data.get("rol"))
        if user_role not in roles_permitidos.get(required_role, []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para esta accion",
            )
        return {**user, **user_data, "rol": user_role}

    return role_checker


def firestore_unavailable_http_exception(error: google_exceptions.GoogleAPICallError) -> HTTPException:
    if isinstance(error, google_exceptions.ResourceExhausted):
        return HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Cuota de Firestore excedida. Intenta nuevamente mas tarde.",
            headers={"Retry-After": "60"},
        )
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail="Servicio de datos temporalmente no disponible",
        headers={"Retry-After": "60"},
    )
