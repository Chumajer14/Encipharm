import csv
import io
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status
from pydantic import EmailStr, TypeAdapter, ValidationError

from app.models.cliente import ClienteCreate
from app.services.audit import record_audit_event


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

EMAIL_ADAPTER = TypeAdapter(EmailStr)


def _safe_text(value: Any, fallback: str, max_length: int | None = None) -> str:
    if isinstance(value, str) and value.strip():
        text = value.strip()
    else:
        text = fallback
    return text[:max_length] if max_length else text


def _safe_optional_text(value: Any, max_length: int) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    return value.strip()[:max_length]


def _safe_phone(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    digits = "".join(ch for ch in value if ch.isdigit())
    if not digits:
        return None
    if digits.startswith("569") and len(digits) >= 11:
        return digits[3:11]
    if digits.startswith("9") and len(digits) >= 9:
        return digits[1:9]
    return digits[:8] if len(digits) >= 8 else None


def _safe_optional_uid(value: Any) -> str | None:
    return _safe_optional_text(value, 128)


def _safe_email(value: Any, cliente_id: str) -> str:
    if isinstance(value, str):
        try:
            return str(EMAIL_ADAPTER.validate_python(value.strip()))
        except ValidationError:
            pass

    clean_id = "".join(ch for ch in str(cliente_id).lower() if ch.isalnum()) or "legacy"
    return f"sin-correo-{clean_id[:48]}@encipharm.cl"


def _safe_estado(value: Any) -> str:
    return value if value in {"En proceso", "Completado", "Inactivo"} else "En proceso"


def _safe_datetime(value: Any) -> Any:
    if isinstance(value, datetime):
        return value
    return None


def normalize_cliente(cliente_id: str, data: dict[str, Any]) -> dict[str, Any]:
    raw_id = data.get("id") if isinstance(data.get("id"), str) else cliente_id
    safe_id = _safe_text(raw_id, cliente_id)
    vendedor_uid = _safe_optional_uid(data.get("vendedorUid") or data.get("ownerUid"))
    owner_uid = _safe_optional_uid(data.get("ownerUid")) or vendedor_uid
    return {
        "id": safe_id,
        "nombre": _safe_text(data.get("nombre"), "Sin nombre", 120),
        "empresa": _safe_text(data.get("empresa"), "Sin empresa", 160),
        "email": _safe_email(data.get("email"), safe_id),
        "telefono": _safe_phone(data.get("telefono")),
        "rubro": _safe_optional_text(data.get("rubro"), 120),
        "region": _safe_optional_text(data.get("region"), 80),
        "estado": _safe_estado(data.get("estado")),
        "vendedorUid": vendedor_uid,
        "ownerUid": owner_uid,
        "createdAt": _safe_datetime(data.get("createdAt")),
        "updatedAt": _safe_datetime(data.get("updatedAt")),
    }


def list_clientes(
    db,
    search: str | None = None,
    estado: str | None = None,
    vendedor_uid: str | None = None,
    limit: int | None = None,
) -> list[dict[str, Any]]:
    if limit is not None:
        limit = min(max(limit, 1), MAX_CLIENTES_RESPONSE)
    clientes = []
    for doc in db.collection(CLIENTES_COLLECTION).stream():
        data = doc.to_dict() or {}
        if data.get("deletedAt"):
            continue
        clientes.append(normalize_cliente(doc.id, data))

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

    if limit is None:
        return clientes

    return clientes[:limit]


def get_cliente_or_404(db, cliente_id: str) -> dict[str, Any]:
    """Return a normalized cliente or raise 404 when the document does not exist."""
    doc = db.collection(CLIENTES_COLLECTION).document(cliente_id).get()
    data = doc.to_dict() or {}
    if not doc.exists or data.get("deletedAt"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Cliente no encontrado",
        )
    return normalize_cliente(cliente_id, data)


def create_cliente(db, payload: ClienteCreate, user: dict[str, Any] | None = None) -> dict[str, Any]:
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
    if user:
        record_audit_event(
            db,
            user=user,
            action="create",
            resource=CLIENTES_COLLECTION,
            resource_id=cliente_id,
        )
    return normalize_cliente(cliente_id, data)


def update_cliente(
    db,
    cliente_id: str,
    changes: dict[str, Any],
    user: dict[str, Any] | None = None,
) -> dict[str, Any]:
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
    if user:
        record_audit_event(
            db,
            user=user,
            action="update",
            resource=CLIENTES_COLLECTION,
            resource_id=cliente_id,
            metadata={"fields": sorted(clean_changes.keys())},
        )
    updated_data = {**cliente_doc.to_dict(), **clean_changes}
    return normalize_cliente(cliente_id, updated_data)


def delete_cliente(db, cliente_id: str, user: dict[str, Any] | None = None) -> None:
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
    if user:
        record_audit_event(
            db,
            user=user,
            action="delete",
            resource=CLIENTES_COLLECTION,
            resource_id=cliente_id,
        )


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


def import_clientes_csv(
    db,
    raw_content: bytes,
    user: dict[str, Any] | None = None,
) -> dict[str, Any]:
    clientes, errores, total_rows = parse_clientes_csv(raw_content)

    seen_emails: set[str] = set()
    existing_emails = {
        str(cliente.get("email") or "").strip().lower()
        for cliente in list_clientes(db, limit=None)
        if cliente.get("email")
    }

    for index, cliente in enumerate(clientes, start=2):
        email = cliente.email.strip().lower()
        row_errors = []
        if email in seen_emails:
            row_errors.append("email: correo duplicado dentro del archivo")
        if email in existing_emails:
            row_errors.append("email: cliente ya existe en el CRM")
        if row_errors:
            errores.append({
                "fila": index,
                "errores": row_errors,
            })
        seen_emails.add(email)

    imported_count = 0
    if not errores:
        for cliente in clientes:
            create_cliente(db, cliente, user=user)
            imported_count += 1

    if user:
        record_audit_event(
            db,
            user=user,
            action="import_csv",
            resource=CLIENTES_COLLECTION,
            resource_id=None,
            result="success" if not errores else "validation_error",
            metadata={"totalFilas": total_rows, "importados": imported_count, "fallidos": len(errores)},
        )

    return {
        "totalFilas": total_rows,
        "importados": imported_count,
        "fallidos": len(errores),
        "errores": errores,
    }
