from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from google.api_core import exceptions as google_exceptions

from app.core.auth import firestore_unavailable_http_exception, get_current_user
from app.core.config import get_settings
from app.models.user import UserResponse, UserRoleUpdate
from app.models.user import normalize_display_name, normalize_user_language, normalize_user_rank, normalize_user_theme, normalize_user_zone
from app.services.firestore import get_db
from app.services.audit import record_audit_event
from app.services.users import update_user

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


def _display_name_from_firebase_user(user: dict) -> str:
    return user.get("name") or user.get("displayName") or user.get("email", "")


async def upsert_authenticated_user(user: dict) -> UserResponse:
    db = get_db()
    uid = user.get("uid")
    email = user.get("email")
    nombre = normalize_display_name(_display_name_from_firebase_user(user), email)

    user_ref = db.collection("users").document(uid)
    cached_user_exists = user.get("_firestore_user_exists")
    if cached_user_exists is True:
        user_exists = True
        user_data = user.get("_firestore_user") or {}
    elif cached_user_exists is False:
        user_exists = False
        user_data = {}
    else:
        try:
            user_doc = user_ref.get()
        except google_exceptions.GoogleAPICallError as error:
            raise firestore_unavailable_http_exception(error) from error
        user_exists = user_doc.exists
        user_data = user_doc.to_dict() if user_doc.exists else {}

    if user_exists:
        if not user_data.get("activo", True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Usuario inactivo en el sistema",
            )
        updated_user = {
            "email": email,
            "nombre": nombre or user_data.get("nombre", email),
            "cargo": user_data.get("cargo") or normalize_user_rank(user_data.get("rango"), user_data.get("rol")),
            "rango": user_data.get("rango") or normalize_user_rank(user_data.get("cargo"), user_data.get("rol")),
            "zona": user_data.get("zona") or normalize_user_zone(None),
            "appMovil": user_data.get("appMovil", True),
            "webApp": user_data.get("webApp", True),
            "theme": normalize_user_theme(user_data.get("theme")),
            "language": normalize_user_language(user_data.get("language")),
            "updatedAt": datetime.now(timezone.utc),
        }
        try:
            user_ref.update(updated_user)
        except google_exceptions.GoogleAPICallError as error:
            raise firestore_unavailable_http_exception(error) from error
        user_data.update(updated_user)
        return UserResponse(**user_data)

    new_user = {
        "uid": uid,
        "email": email,
        "nombre": nombre,
        "rol": "sin_acceso",
        "cargo": "Sin acceso",
        "rango": "Sin acceso",
        "zona": "Zona centro",
        "appMovil": False,
        "webApp": False,
        "theme": "dark",
        "language": "es",
        "activo": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }

    try:
        user_ref.set(new_user)
    except google_exceptions.GoogleAPICallError as error:
        raise firestore_unavailable_http_exception(error) from error
    return UserResponse(**new_user)


@router.post("/login", response_model=UserResponse)
async def login_user(user: dict = Depends(get_current_user)):
    return await upsert_authenticated_user(user)


@router.post("/register", response_model=UserResponse)
async def register_user(user: dict = Depends(get_current_user)):
    return await upsert_authenticated_user(user)


@router.patch("/temporary-role", response_model=UserResponse)
async def patch_temporary_own_role(
    payload: UserRoleUpdate,
    user: dict = Depends(get_current_user),
):
    """Control temporal de desarrollo: cambia solo el rol de la cuenta autenticada.

    Control operativo temporal. No acepta UID, email, activo ni otros campos
    sensibles en el payload.
    """
    db = get_db()
    updated = update_user(db, user["uid"], {"rol": payload.rol})
    record_audit_event(
        db,
        user={**user, "rol": updated["rol"]},
        action="temporary_role_change",
        resource="users",
        resource_id=user["uid"],
        metadata={"newRole": payload.rol},
    )
    return UserResponse(**updated)
