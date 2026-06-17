from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from firebase_admin import auth as firebase_auth
from firebase_admin import exceptions as firebase_exceptions
from google.api_core import exceptions as google_exceptions

from app.models.user import (
    normalize_display_name,
    normalize_user_language,
    normalize_user_rank,
    normalize_user_role,
    normalize_user_theme,
    normalize_user_zone,
)


USERS_COLLECTION = "users"
MAX_USERS_RESPONSE = 500


def _auth_user_to_record(firebase_user) -> dict[str, Any]:
    email = getattr(firebase_user, "email", None)
    display_name = getattr(firebase_user, "display_name", None)
    disabled = getattr(firebase_user, "disabled", False)
    return normalize_user(
        firebase_user.uid,
        {
            "uid": firebase_user.uid,
            "email": email,
            "nombre": display_name or email,
            "activo": not disabled,
            "rol": "sin_acceso",
            "rango": "Sin acceso",
            "cargo": "Sin acceso",
        },
    )


def normalize_user(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    role = normalize_user_role(data.get("rol"))
    rank = normalize_user_rank(data.get("rango") or data.get("cargo"), role)
    default_access = role != "sin_acceso"
    return {
        "uid": data.get("uid", uid),
        "email": data.get("email"),
        "nombre": normalize_display_name(data.get("nombre"), data.get("email")),
        "rol": role,
        "cargo": data.get("cargo") or rank,
        "rango": rank,
        "zona": normalize_user_zone(data.get("zona")),
        "appMovil": data.get("appMovil", default_access),
        "webApp": data.get("webApp", default_access),
        "theme": normalize_user_theme(data.get("theme")),
        "language": normalize_user_language(data.get("language")),
        "activo": data.get("activo", True),
        "createdAt": data.get("createdAt"),
        "updatedAt": data.get("updatedAt"),
    }


def list_users(
    db,
    activo: bool | None = None,
    limit: int | None = 100,
) -> list[dict[str, Any]]:
    if limit is not None:
        limit = min(max(limit, 1), MAX_USERS_RESPONSE)

    users = []
    seen_uids = set()
    for doc in db.collection(USERS_COLLECTION).stream():
        data = normalize_user(doc.id, doc.to_dict())
        seen_uids.add(data["uid"])
        if activo is None or data["activo"] == activo:
            users.append(data)

        if limit is not None and len(users) >= limit:
            return users

    try:
        for firebase_user in firebase_auth.list_users().iterate_all():
            if firebase_user.uid in seen_uids:
                continue
            data = _auth_user_to_record(firebase_user)
            if activo is None or data["activo"] == activo:
                users.append(data)
            if limit is not None and len(users) >= limit:
                break
    except (ValueError, google_exceptions.GoogleAPICallError, firebase_exceptions.FirebaseError):
        pass

    return users


def get_user_or_404(db, uid: str) -> dict[str, Any]:
    doc = db.collection(USERS_COLLECTION).document(uid).get()
    if not doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )
    return normalize_user(uid, doc.to_dict())


def update_user(db, uid: str, changes: dict[str, Any]) -> dict[str, Any]:
    user_ref = db.collection(USERS_COLLECTION).document(uid)
    user_doc = user_ref.get()
    current_data = user_doc.to_dict() if user_doc.exists else None

    if current_data is None:
        try:
            firebase_user = firebase_auth.get_user(uid)
        except (ValueError, firebase_exceptions.FirebaseError) as error:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Usuario no encontrado",
            ) from error
        current_data = {
            **_auth_user_to_record(firebase_user),
            "createdAt": datetime.now(timezone.utc),
        }
        user_ref.set(current_data)

    clean_changes = {
        key: value
        for key, value in changes.items()
        if value is not None
    }
    if "nombre" in clean_changes:
        clean_changes["nombre"] = normalize_display_name(clean_changes["nombre"])
    if "rol" in clean_changes:
        clean_changes["rol"] = normalize_user_role(clean_changes["rol"])

    final_role = normalize_user_role(clean_changes.get("rol", current_data.get("rol")))
    if final_role == "sin_acceso":
        clean_changes["appMovil"] = False
        clean_changes["webApp"] = False
        clean_changes.setdefault("rango", "Sin acceso")
        clean_changes.setdefault("cargo", "Sin acceso")
    elif "rol" in clean_changes:
        clean_changes.setdefault("rango", normalize_user_rank(clean_changes.get("rango"), final_role))
        clean_changes.setdefault("cargo", clean_changes["rango"])

    clean_changes["updatedAt"] = datetime.now(timezone.utc)

    user_ref.update(clean_changes)
    updated_data = {**current_data, **clean_changes}
    return normalize_user(uid, updated_data)
