from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.auth import get_current_user, require_rol
from app.models.usuario import UsuarioCreate, UsuarioUpdate, UsuarioOut
from app.services import usuarios as svc

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

@router.get("/", response_model=list[UsuarioOut])
async def listar(rol: str | None = Query(None), current_user: dict = Depends(require_rol("admin", "supervisor"))):
    return svc.listar_usuarios(rol)

@router.get("/{uid}", response_model=UsuarioOut)
async def obtener(uid: str, current_user: dict = Depends(require_rol("admin"))):
    u = svc.obtener_usuario(uid)
    if not u:
        raise HTTPException(404, "Usuario no encontrado")
    return u

@router.patch("/{uid}", response_model=UsuarioOut)
async def actualizar(uid: str, data: UsuarioUpdate, current_user: dict = Depends(require_rol("admin"))):
    return svc.actualizar_usuario(uid, data)