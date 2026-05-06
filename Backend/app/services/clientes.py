import csv
import io
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from pydantic import ValidationError

from app.models.cliente import ClienteCreate


CLIENTES_COLLECTION = "clientes"
MAX_CSV_BYTES = 1_000_000
MAX_CSV_ROWS = 1_000
MAX_CLIENTES_RESPONSE = 500
CSV_FIELDS = {
    "nombre",
    "empresa",
    "email",
    "telefono",
    "rubro",
    "region",
    "estado",
    "vendedorUid",
    "ownerUid",
}


def normalize_cliente(cliente_id: str, data: dict[str, Any]) -> dict[str, Any]:
    vendedor_uid = data.get("vendedorUid") or data.get("ownerUid")
    return {
        "id": data.get("id", cliente_id),
        "nombre": data.get("nombre"),
        "empresa": data.get("empresa"),
        "email": data.get("email"),
        "telefono": data.get("telefono"),
        "rubro": data.get("rubro"),
        "region": data.get("region"),
        "estado": data.get("estado", "En proceso"),
        "vendedorUid": vendedor_uid,
        "ownerUid": data.get("ownerUid") or vendedor_uid,
        "createdAt": data.get("createdAt"),
        "updatedAt": data.get("updatedAt"),
    }


def list_clientes(
    db,
    search: str | None = None,
    estado: str | None = None,
    vendedor_uid: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    limit = min(max(limit, 1), MAX_CLIENTES_RESPONSE)
    clientes = [
        normalize_cliente(doc.id, doc.to_dict())
        for doc in db.collection(CLIENTES_COLLECTION).stream()
        if not doc.to_dict().get("deletedAt")
    ]

    if vendedor_uid:
        clientes = [
            cliente for cliente in clientes
            if (
                cliente.get("vendedorUid") == vendedor_uid
                or cliente.get("ownerUid") == vendedor_uid
            )
        ]

    if estado:
        clientes = [
            cliente for cliente in clientes
            if cliente.get("estado", "").lower() == estado.lower()
        ]

    if search:
        normalized_search = search.lower()
        search_fields = ("nombre", "empresa", "email", "rubro", "region")
        clientes = [
            cliente for cliente in clientes
            if any(
                normalized_search in str(cliente.get(field) or "").lower()
                for field in search_fields
            )
        ]

    return clientes[:limit]


def get_cliente_or_404(db, cliente_id: str) -> dict[str, Any]:
    """Return a normalized cliente or raise 404 when the document does not exist."""
    doc = db.collection(CLIENTES_COLLECTION).document(cliente_id).get()
    if not doc.exists or doc.to_dict().get("deletedAt"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )
    return normalize_cliente(cliente_id, doc.to_dict())


def create_cliente(db, payload: ClienteCreate) -> dict[str, Any]:
    """Create a cliente document with mirrored owner and vendedor identifiers."""
    now = datetime.now(timezone.utc)
    cliente_id = str(uuid4())
    data = {
        **payload.model_dump(),
        "id": cliente_id,
        "createdAt": now,
        "updatedAt": now,
    }
    if data.get("vendedorUid") and not data.get("ownerUid"):
        data["ownerUid"] = data["vendedorUid"]
    if data.get("ownerUid") and not data.get("vendedorUid"):
        data["vendedorUid"] = data["ownerUid"]
    db.collection(CLIENTES_COLLECTION).document(cliente_id).set(data)
    return normalize_cliente(cliente_id, data)


def update_cliente(db, cliente_id: str, changes: dict[str, Any]) -> dict[str, Any]:
    """Apply partial cliente changes while preserving existing values."""
    cliente_ref = db.collection(CLIENTES_COLLECTION).document(cliente_id)
    cliente_doc = cliente_ref.get()

    if not cliente_doc.exists or cliente_doc.to_dict().get("deletedAt"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )

    clean_changes = {
        key: value
        for key, value in changes.items()
        if value is not None
    }
    clean_changes["updatedAt"] = datetime.now(timezone.utc)

    cliente_ref.update(clean_changes)
    updated_data = {**cliente_doc.to_dict(), **clean_changes}
    return normalize_cliente(cliente_id, updated_data)


def delete_cliente(db, cliente_id: str) -> None:
    """Mark an existing cliente as deleted without losing historical data."""
    cliente_ref = db.collection(CLIENTES_COLLECTION).document(cliente_id)
    cliente_doc = cliente_ref.get()

    if not cliente_doc.exists or cliente_doc.to_dict().get("deletedAt"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )

    cliente_ref.update({
        "deletedAt": datetime.now(timezone.utc),
        "estado": "Inactivo",
        "updatedAt": datetime.now(timezone.utc),
    })


def parse_clientes_csv(raw_content: bytes) -> tuple[list[ClienteCreate], list[dict[str, Any]], int]:
    if len(raw_content) > MAX_CSV_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="El archivo CSV supera el tamano maximo de 1 MB",
        )

    try:
        text = raw_content.decode("utf-8-sig")
    except UnicodeDecodeError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo CSV debe estar codificado en UTF-8",
        ) from error

    reader = csv.DictReader(io.StringIO(text))

    if not reader.fieldnames:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo CSV no contiene encabezados",
        )

    unknown_fields = set(reader.fieldnames) - CSV_FIELDS
    if unknown_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Columnas no soportadas: {', '.join(sorted(unknown_fields))}",
        )

    clientes: list[ClienteCreate] = []
    errores: list[dict[str, Any]] = []
    total_rows = 0

    for row_number, row in enumerate(reader, start=2):
        total_rows += 1
        if total_rows > MAX_CSV_ROWS:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"El archivo CSV supera el maximo de {MAX_CSV_ROWS} filas",
            )
        clean_row = {
            key: (value.strip() if isinstance(value, str) else value)
            for key, value in row.items()
            if key in CSV_FIELDS
        }
        clean_row = {
            key: value
            for key, value in clean_row.items()
            if value not in (None, "")
        }

        try:
            clientes.append(ClienteCreate.model_validate(clean_row))
        except ValidationError as exc:
            errores.append({
                "fila": row_number,
                "errores": [
                    f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}"
                    for error in exc.errors()
                ],
            })

    return clientes, errores, total_rows


def import_clientes_csv(db, raw_content: bytes) -> dict[str, Any]:
    clientes, errores, total_rows = parse_clientes_csv(raw_content)

    imported_count = 0
    if not errores:
        for cliente in clientes:
            create_cliente(db, cliente)
            imported_count += 1

    return {
        "totalFilas": total_rows,
        "importados": imported_count,
        "fallidos": len(errores),
        "errores": errores,
    }
