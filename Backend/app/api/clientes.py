from fastapi import APIRouter, HTTPException, Depends
from app.models.cliente import ClienteCreate, ClienteUpdate, ClienteResponse
from app.services.clientes import (
    crear_cliente,
    listar_clientes,
    obtener_cliente,
    actualizar_cliente,
    eliminar_cliente,
)
from app.core.auth import get_current_user

router = APIRouter(prefix="/clientes", tags=["CRM Clientes"])


@router.get("/", response_model=list[ClienteResponse])
async def get_clientes(user: dict = Depends(get_current_user)):
    return listar_clientes()


@router.post("/", response_model=ClienteResponse)
async def post_cliente(
    data: ClienteCreate, user: dict = Depends(get_current_user)
):
    return crear_cliente(data)


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: str, user: dict = Depends(get_current_user)
):
    cliente = obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def put_cliente(
    cliente_id: str,
    data: ClienteUpdate,
    user: dict = Depends(get_current_user),
):
    cliente = actualizar_cliente(cliente_id, data)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


@router.delete("/{cliente_id}")
async def delete_cliente(
    cliente_id: str, user: dict = Depends(get_current_user)
):
    eliminar_cliente(cliente_id)
    return {"message": "Cliente eliminado correctamente"}