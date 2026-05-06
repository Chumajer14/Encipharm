from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status


USERS_COLLECTION = "users"
MAX_USERS_RESPONSE = 500


def normalize_user(uid: str, data: dict[str, Any]) -> dict[str, Any]:
    return {
        "uid": data.get("uid", uid),
        "email": data.get("email"),
        "nombre": data.get("nombre"),
        "rol": data.get("rol", "vendedor"),
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
    for doc in db.collection(USERS_COLLECTION).stream():
        data = normalize_user(doc.id, doc.to_dict())
        if activo is None or data["activo"] == activo:
            users.append(data)

        if limit is not None and len(users) >= limit:
            break

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

    if not user_doc.exists:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    clean_changes = {
        key: value
        for key, value in changes.items()
        if value is not None
    }
    clean_changes["updatedAt"] = datetime.now(timezone.utc)

    user_ref.update(clean_changes)
    updated_data = {**user_doc.to_dict(), **clean_changes}
    return normalize_user(uid, updated_data)
