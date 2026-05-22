from fastapi import APIRouter, Depends, File, HTTPException, Query, Response, UploadFile, status

from app.core.auth import require_role
from app.models.cliente import (
    ClienteCreate,
    ClienteResponse,
    ClienteUpdate,
    CsvImportResult,
)
from app.services.clientes import (
    create_cliente,
    delete_cliente,
    get_cliente_or_404,
    import_clientes_csv,
    list_clientes,
    update_cliente,
)
from app.services.firestore import get_db

router = APIRouter(prefix="/clientes", tags=["Clientes"])


def _ensure_cliente_access(cliente: dict, user: dict) -> None:
    """Restrict vendedores to clientes assigned to their own UID."""
    if user["rol"] != "vendedor":
        return

    user_uid = user["uid"]
    if cliente.get("vendedorUid") == user_uid or cliente.get("ownerUid") == user_uid:
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para este cliente",
    )


async def _get_clientes_impl(
    search: str | None,
    estado: str | None,
    vendedor_uid: str | None,
    limit: int,
    user: dict,
):
    db = get_db()
    if user["rol"] == "vendedor":
        vendedor_uid = user["uid"]
    return list_clientes(
        db,
        search=search,
        estado=estado,
        vendedor_uid=vendedor_uid,
        limit=limit,
    )


@router.get("", response_model=list[ClienteResponse])
@router.get("/", response_model=list[ClienteResponse])
async def get_clientes(
    search: str | None = Query(default=None, max_length=80),
    estado: str | None = Query(default=None, max_length=32),
    vendedor_uid: str | None = Query(default=None, alias="vendedorUid", max_length=128),
    limit: int = Query(default=100, ge=1, le=500),
    user: dict = Depends(require_role("vendedor")),
):
    return await _get_clientes_impl(search, estado, vendedor_uid, limit, user)


@router.get("/{cliente_id}", response_model=ClienteResponse)
async def get_cliente(
    cliente_id: str,
    user: dict = Depends(require_role("vendedor")),
):
    db = get_db()
    cliente = get_cliente_or_404(db, cliente_id)
    _ensure_cliente_access(cliente, user)
    return cliente


@router.post("", response_model=ClienteResponse)
@router.post("/", response_model=ClienteResponse)
async def post_cliente(
    payload: ClienteCreate,
    user: dict = Depends(require_role("vendedor")),
):
    db = get_db()
    if user["rol"] == "vendedor" or payload.vendedorUid is None:
        payload = payload.model_copy(update={"vendedorUid": user["uid"]})
    return create_cliente(db, payload, user=user)


@router.patch("/{cliente_id}", response_model=ClienteResponse)
async def patch_cliente(
    cliente_id: str,
    payload: ClienteUpdate,
    user: dict = Depends(require_role("vendedor")),
):
    db = get_db()
    cliente = get_cliente_or_404(db, cliente_id)
    _ensure_cliente_access(cliente, user)
    if user["rol"] == "vendedor":
        payload = payload.model_copy(
            update={"vendedorUid": user["uid"], "ownerUid": user["uid"]}
        )
    changes = payload.model_dump(exclude_unset=True)
    if user["rol"] != "admin":
        changes.pop("vendedorUid", None)
        changes.pop("ownerUid", None)
    return update_cliente(db, cliente_id, changes, user=user)


@router.delete("/{cliente_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_cliente(
    cliente_id: str,
    user: dict = Depends(require_role("vendedor")),
):
    db = get_db()
    cliente = get_cliente_or_404(db, cliente_id)
    _ensure_cliente_access(cliente, user)
    delete_cliente(db, cliente_id, user=user)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/import-csv", response_model=CsvImportResult)
async def post_import_clientes_csv(
    file: UploadFile = File(...),
    user: dict = Depends(require_role("admin")),
):
    content = await file.read()
    db = get_db()
    return import_clientes_csv(db, content, user=user)
