from fastapi import APIRouter, Depends, HTTPException, Query
from app.core.auth import get_current_user
from app.models.cliente import ClienteCreate, ClienteUpdate, ClienteOut
from app.services import clientes as svc

router = APIRouter(prefix="/clientes", tags=["Clientes CRM"])

@router.post("/", response_model=ClienteOut, status_code=201)
async def crear_cliente(data: ClienteCreate, current_user: dict = Depends(get_current_user)):
    return svc.crear_cliente(current_user["uid"], data)

@router.get("/", response_model=list[ClienteOut])
async def listar_clientes(industria: str | None = Query(None), ciudad: str | None = Query(None), current_user: dict = Depends(get_current_user)):
    return svc.listar_clientes(uid=current_user["uid"], rol=current_user.get("rol", "vendedor"), industria=industria, ciudad=ciudad)

@router.get("/{cliente_id}", response_model=ClienteOut)
async def obtener_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    c = svc.obtener_cliente(cliente_id, current_user["uid"], current_user.get("rol", "vendedor"))
    if not c:
        raise HTTPException(404, "Cliente no encontrado o sin acceso")
    return c

@router.patch("/{cliente_id}", response_model=ClienteOut)
async def actualizar_cliente(cliente_id: str, data: ClienteUpdate, current_user: dict = Depends(get_current_user)):
    c = svc.actualizar_cliente(cliente_id, current_user["uid"], current_user.get("rol", "vendedor"), data)
    if not c:
        raise HTTPException(404, "Cliente no encontrado o sin acceso")
    return c

@router.delete("/{cliente_id}", status_code=204)
async def eliminar_cliente(cliente_id: str, current_user: dict = Depends(get_current_user)):
    if not svc.eliminar_cliente(cliente_id, current_user["uid"], current_user.get("rol", "vendedor")):
        raise HTTPException(404, "Cliente no encontrado o sin acceso")