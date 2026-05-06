from fastapi import APIRouter, Depends, Query

from app.core.auth import require_role
from app.models.user import (
    UserResponse,
    UserRoleUpdate,
    UserStatusUpdate,
    UserUpdate,
)
from app.services.firestore import get_db
from app.services.users import get_user_or_404, list_users, update_user


router = APIRouter(prefix="/users", tags=["Usuarios"])


@router.get("/", response_model=list[UserResponse])
async def get_users(
    activo: bool | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    _: dict = Depends(require_role("supervisor")),
):
    db = get_db()
    return list_users(db, activo=activo, limit=limit)


@router.get("/{uid}", response_model=UserResponse)
async def get_user(
    uid: str,
    _: dict = Depends(require_role("supervisor")),
):
    db = get_db()
    return get_user_or_404(db, uid)


@router.patch("/{uid}", response_model=UserResponse)
async def patch_user(
    uid: str,
    payload: UserUpdate,
    _: dict = Depends(require_role("admin")),
):
    db = get_db()
    return update_user(db, uid, payload.model_dump(exclude_unset=True))


@router.patch("/{uid}/role", response_model=UserResponse)
async def patch_user_role(
    uid: str,
    payload: UserRoleUpdate,
    _: dict = Depends(require_role("admin")),
):
    db = get_db()
    return update_user(db, uid, {"rol": payload.rol})


@router.patch("/{uid}/status", response_model=UserResponse)
async def patch_user_status(
    uid: str,
    payload: UserStatusUpdate,
    _: dict = Depends(require_role("admin")),
):
    db = get_db()
    return update_user(db, uid, {"activo": payload.activo})
