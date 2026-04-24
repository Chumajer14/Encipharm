from fastapi import APIRouter, Depends, HTTPException, status
from app.core.auth import get_current_user
from app.models.user import UserCreate, UserResponse
from app.services.firestore import get_db
from datetime import datetime, timezone

router = APIRouter(prefix="/auth", tags=["Autenticación"])

@router.post("/register", response_model=UserResponse)
async def register_user(user: dict = Depends(get_current_user)):
    db = get_db()
    uid = user.get("uid")
    email = user.get("email")
    nombre = user.get("name", email)

    user_ref = db.collection("users").document(uid)
    user_doc = user_ref.get()

    if user_doc.exists:
        return UserResponse(**user_doc.to_dict())

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