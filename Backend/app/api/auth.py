from datetime import datetime, timezone

from fastapi import APIRouter, Depends

from app.core.auth import get_current_user
from app.models.user import UserResponse
from app.services.firestore import get_db

router = APIRouter(prefix="/auth", tags=["Autenticacion"])


def _display_name_from_firebase_user(user: dict) -> str:
    return user.get("name") or user.get("displayName") or user.get("email", "")


async def upsert_authenticated_user(user: dict) -> UserResponse:
    db = get_db()
    uid = user.get("uid")
    email = user.get("email")
    nombre = _display_name_from_firebase_user(user)

    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if user_doc.exists:
        user_data = user_doc.to_dict()
        updated_user = {
            "email": email,
            "nombre": nombre or user_data.get("nombre", email),
            "updatedAt": datetime.now(timezone.utc),
        }
        user_ref.update(updated_user)
        user_data.update(updated_user)
        return UserResponse(**user_data)

    new_user = {
        "uid": uid,
        "email": email,
        "nombre": nombre,
        "rol": "vendedor",
        "activo": True,
        "createdAt": datetime.now(timezone.utc),
        "updatedAt": datetime.now(timezone.utc),
    }

    user_ref.set(new_user)
    return UserResponse(**new_user)


@router.post("/login", response_model=UserResponse)
async def login_user(user: dict = Depends(get_current_user)):
    return await upsert_authenticated_user(user)


@router.post("/register", response_model=UserResponse)
async def register_user(user: dict = Depends(get_current_user)):
    return await upsert_authenticated_user(user)
