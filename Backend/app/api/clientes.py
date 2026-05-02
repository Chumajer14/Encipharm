from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query

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


def _can_access_cliente(user: dict, cliente: dict) -> bool:
    role = user.get("role", "vendedor")
    if role in ["admin", "supervisor"]:
        return True
    return cliente.get("vendedorId") == user.get("uid")


@router.get("/", response_model=list[ClienteResponse])
async def get_clientes(
    search: Optional[str] = Query(
        default=None,
        description="Búsqueda por nombre, empresa, industria o localidad",
    ),
    user: dict = Depends(get_current_user),
):
    return listar_clientes(user=user, search=search)


@router.post("/", response_model=ClienteResponse)
async def post_cliente(
    data: ClienteCreate,
    user: dict = Depends(get_current_user),
):
    payload = data.model_dump()
    payload["vendedorId"] = user.get("uid")
    return crear_cliente(payload)


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: str,
    user: dict = Depends(get_current_user),
):
    cliente = obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not _can_access_cliente(user, cliente):
        raise HTTPException(status_code=403, detail="No autorizado")

    return cliente


@router.put("/{cliente_id}", response_model=ClienteResponse)
async def put_cliente(
    cliente_id: str,
    data: ClienteUpdate,
    user: dict = Depends(get_current_user),
):
    cliente = obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not _can_access_cliente(user, cliente):
        raise HTTPException(status_code=403, detail="No autorizado")

    updated = actualizar_cliente(cliente_id, data.model_dump(exclude_unset=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return updated


@router.delete("/{cliente_id}")
async def delete_cliente(
    cliente_id: str,
    user: dict = Depends(get_current_user),
):
    cliente = obtener_cliente(cliente_id)
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if not _can_access_cliente(user, cliente):
        raise HTTPException(status_code=403, detail="No autorizado")

    eliminado = eliminar_cliente(cliente_id)
    if eliminado is False:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    return {"message": "Cliente eliminado correctamente"}