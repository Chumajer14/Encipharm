from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.models.comercial import (
    InteractionCreate,
    normalize_opportunity_stage,
    normalize_proposal_status,
    OpportunityCreate,
    ProposalCreate,
)
from app.services.audit import record_audit_event


INTERACTIONS_COLLECTION = "interacciones"
OPPORTUNITIES_COLLECTION = "oportunidades"
PROPOSALS_COLLECTION = "propuestas"
MAX_RESPONSE = 500


def _safe_text(value: Any, fallback: str) -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _safe_stage(value: Any) -> str:
    return value if value in {"nuevo", "contactado", "cotizacion", "negociacion", "ganado", "perdido"} else "nuevo"


def _safe_proposal_status(value: Any) -> str:
    return value if value in {"borrador", "enviada", "aceptada", "rechazada"} else "borrador"


def _safe_interaction_type(value: Any) -> str:
    return value if value in {"llamada", "visita", "correo", "reunion"} else "visita"


def _safe_datetime(value: Any) -> Any:
    return value or _now()


def _safe_float(value: Any, fallback: float = 0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


def _safe_int(value: Any, fallback: int = 0) -> int:
    try:
        return int(value)
    except (TypeError, ValueError):
        return fallback


def normalize_interaction(document_id: str, data: dict[str, Any]) -> dict[str, Any]:
    return {
        **data,
        "id": data.get("id") or document_id,
        "clienteId": _safe_text(data.get("clienteId"), "legacy-cliente"),
        "tipo": _safe_interaction_type(data.get("tipo")),
        "fecha": _safe_datetime(data.get("fecha") or data.get("createdAt")),
        "resumen": _safe_text(data.get("resumen"), "Sin resumen"),
        "vendedorUid": _safe_text(data.get("vendedorUid"), "legacy-vendedor"),
    }


def normalize_opportunity(document_id: str, data: dict[str, Any]) -> dict[str, Any]:
    return {
        **data,
        "id": data.get("id") or document_id,
        "clienteId": _safe_text(data.get("clienteId"), "legacy-cliente"),
        "titulo": _safe_text(data.get("titulo"), "Oportunidad sin titulo"),
        "etapa": _safe_stage(data.get("etapa")),
        "valorEstimado": _safe_float(data.get("valorEstimado")),
        "probabilidad": _safe_int(data.get("probabilidad")),
        "vendedorUid": _safe_text(data.get("vendedorUid"), "legacy-vendedor"),
    }


def normalize_proposal(document_id: str, data: dict[str, Any]) -> dict[str, Any]:
    monto_neto = _safe_float(data.get("montoNeto"))
    descuento_pct = _safe_float(data.get("descuentoPct"))
    monto_descuento, monto_total = _proposal_amounts(monto_neto, descuento_pct)
    return {
        **data,
        "id": data.get("id") or document_id,
        "clienteId": _safe_text(data.get("clienteId"), "legacy-cliente"),
        "oportunidadId": _safe_text(data.get("oportunidadId"), "legacy-oportunidad"),
        "titulo": _safe_text(data.get("titulo"), "Propuesta sin titulo"),
        "montoNeto": monto_neto,
        "descuentoPct": descuento_pct,
        "estado": _safe_proposal_status(data.get("estado")),
        "vendedorUid": _safe_text(data.get("vendedorUid"), "legacy-vendedor"),
        "montoDescuento": _safe_float(data.get("montoDescuento"), monto_descuento),
        "montoTotal": _safe_float(data.get("montoTotal"), monto_total),
    }


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _limited(items: list[dict[str, Any]], limit: int = 100) -> list[dict[str, Any]]:
    return items[: min(max(limit, 1), MAX_RESPONSE)]


def _doc_or_404(db, collection: str, document_id: str, detail: str):
    doc = db.collection(collection).document(document_id).get()
    if not doc.exists or (doc.to_dict() or {}).get("deletedAt"):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)
    return doc


def assert_cliente_visible(db, cliente_id: str, user: dict) -> dict[str, Any]:
    doc = _doc_or_404(db, "clientes", cliente_id, "Cliente no encontrado")
    cliente = doc.to_dict()
    if user["rol"] == "vendedor":
        user_uid = user["uid"]
        if cliente.get("vendedorUid") != user_uid and cliente.get("ownerUid") != user_uid:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para este cliente",
            )
    return cliente


def _visible_by_user(item: dict[str, Any], user: dict) -> bool:
    return user["rol"] != "vendedor" or item.get("vendedorUid") == user["uid"]


def _can_write_owned_record(item: dict[str, Any], user: dict) -> bool:
    return user["rol"] == "admin" or item.get("vendedorUid") == user["uid"]


def _ensure_proposal_create_allowed(user: dict) -> None:
    if user["rol"] == "supervisor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor solo puede consultar y aprobar propuestas",
        )


def _ensure_proposal_update_allowed(data: dict[str, Any], changes: dict[str, Any], user: dict) -> None:
    if user["rol"] == "admin":
        return
    if user["rol"] == "supervisor":
        if set(changes.keys()) == {"estado"} and changes.get("estado") == "aceptada":
            return
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Supervisor solo puede aprobar propuestas",
        )
    if data.get("vendedorUid") != user["uid"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para esta propuesta",
        )


def _proposal_amounts(monto_neto: float, descuento_pct: float) -> tuple[float, float]:
    monto_descuento = round(monto_neto * (descuento_pct / 100), 2)
    monto_total = round(monto_neto - monto_descuento, 2)
    return monto_descuento, monto_total


def _sort_recent(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Return commercial records ordered by the newest known timestamp first."""
    def sort_key(item: dict[str, Any]) -> str:
        value = item.get("updatedAt") or item.get("createdAt") or item.get("fecha") or ""
        return value.isoformat() if hasattr(value, "isoformat") else str(value)

    return sorted(
        items,
        key=sort_key,
        reverse=True,
    )


def list_interactions(db, user: dict, cliente_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    """List interactions visible for the current user, optionally scoped to one cliente."""
    interactions = []
    for doc in db.collection(INTERACTIONS_COLLECTION).stream():
        data = normalize_interaction(doc.id, doc.to_dict() or {})
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if _visible_by_user(data, user):
            interactions.append(data)
    return _limited(_sort_recent(interactions), limit)


def create_interaction(db, payload: InteractionCreate, user: dict) -> dict[str, Any]:
    """Create an interaction after validating cliente ownership rules."""
    assert_cliente_visible(db, payload.clienteId, user)
    interaction_id = str(uuid4())
    now = _now()
    data = {
        **payload.model_dump(),
        "id": interaction_id,
        "vendedorUid": user["uid"],
        "createdAt": now,
        "updatedAt": now,
    }
    db.collection(INTERACTIONS_COLLECTION).document(interaction_id).set(data)
    record_audit_event(
        db,
        user=user,
        action="create",
        resource=INTERACTIONS_COLLECTION,
        resource_id=interaction_id,
    )
    return data


def list_opportunities(
    db,
    user: dict,
    cliente_id: str | None = None,
    etapa: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """List opportunities visible for the user with optional cliente and stage filters."""
    etapa = normalize_opportunity_stage(etapa)
    opportunities = []
    for doc in db.collection(OPPORTUNITIES_COLLECTION).stream():
        data = normalize_opportunity(doc.id, doc.to_dict() or {})
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if etapa and data.get("etapa") != etapa:
            continue
        if _visible_by_user(data, user):
            opportunities.append(data)
    return _limited(_sort_recent(opportunities), limit)


def create_opportunity(db, payload: OpportunityCreate, user: dict) -> dict[str, Any]:
    """Create an opportunity tied to a cliente visible to the user."""
    assert_cliente_visible(db, payload.clienteId, user)
    opportunity_id = str(uuid4())
    now = _now()
    data = {
        **payload.model_dump(),
        "id": opportunity_id,
        "vendedorUid": user["uid"],
        "createdAt": now,
        "updatedAt": now,
    }
    db.collection(OPPORTUNITIES_COLLECTION).document(opportunity_id).set(data)
    record_audit_event(
        db,
        user=user,
        action="create",
        resource=OPPORTUNITIES_COLLECTION,
        resource_id=opportunity_id,
    )
    return data


def update_opportunity(db, opportunity_id: str, changes: dict[str, Any], user: dict) -> dict[str, Any]:
    """Apply partial opportunity changes after record-level authorization."""
    doc = _doc_or_404(db, OPPORTUNITIES_COLLECTION, opportunity_id, "Oportunidad no encontrada")
    data = doc.to_dict()
    if not _can_write_owned_record(data, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para esta oportunidad")
    clean_changes = {key: value for key, value in changes.items() if value is not None}
    clean_changes["updatedAt"] = _now()
    db.collection(OPPORTUNITIES_COLLECTION).document(opportunity_id).update(clean_changes)
    record_audit_event(
        db,
        user=user,
        action="update",
        resource=OPPORTUNITIES_COLLECTION,
        resource_id=opportunity_id,
        metadata={"fields": sorted(clean_changes.keys())},
    )
    return {**data, **clean_changes, "id": opportunity_id}


def get_opportunity_detail(db, opportunity_id: str, user: dict) -> dict[str, Any]:
    """Return one opportunity with its cliente interactions and linked proposals."""
    doc = _doc_or_404(db, OPPORTUNITIES_COLLECTION, opportunity_id, "Oportunidad no encontrada")
    opportunity = normalize_opportunity(doc.id, doc.to_dict() or {})
    if not _visible_by_user(opportunity, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para esta oportunidad")

    cliente_id = opportunity["clienteId"]
    return {
        "oportunidad": opportunity,
        "interacciones": list_interactions(db, user=user, cliente_id=cliente_id, limit=25),
        "propuestas": [
            proposal
            for proposal in list_proposals(db, user=user, cliente_id=cliente_id, limit=100)
            if proposal.get("oportunidadId") == opportunity_id
        ],
    }


def list_proposals(
    db,
    user: dict,
    cliente_id: str | None = None,
    estado: str | None = None,
    oportunidad_id: str | None = None,
    limit: int = 100,
) -> list[dict[str, Any]]:
    """List proposals visible for the user with optional cliente, opportunity and status filters."""
    estado = normalize_proposal_status(estado)
    proposals = []
    for doc in db.collection(PROPOSALS_COLLECTION).stream():
        data = normalize_proposal(doc.id, doc.to_dict() or {})
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if estado and data.get("estado") != estado:
            continue
        if oportunidad_id and data.get("oportunidadId") != oportunidad_id:
            continue
        if _visible_by_user(data, user):
            proposals.append(data)
    return _limited(_sort_recent(proposals), limit)


def create_proposal(db, payload: ProposalCreate, user: dict) -> dict[str, Any]:
    """Create a proposal and calculate monetary totals server-side."""
    _ensure_proposal_create_allowed(user)
    assert_cliente_visible(db, payload.clienteId, user)
    opportunity = _doc_or_404(db, OPPORTUNITIES_COLLECTION, payload.oportunidadId, "Oportunidad no encontrada")
    opportunity_data = opportunity.to_dict()
    if not _visible_by_user(opportunity_data, user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para esta oportunidad",
        )
    if opportunity_data.get("clienteId") != payload.clienteId:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La oportunidad no pertenece al cliente indicado",
        )
    proposal_id = str(uuid4())
    monto_descuento, monto_total = _proposal_amounts(payload.montoNeto, payload.descuentoPct)
    now = _now()
    data = {
        **payload.model_dump(),
        "id": proposal_id,
        "vendedorUid": user["uid"],
        "montoDescuento": monto_descuento,
        "montoTotal": monto_total,
        "createdAt": now,
        "updatedAt": now,
    }
    db.collection(PROPOSALS_COLLECTION).document(proposal_id).set(data)
    record_audit_event(
        db,
        user=user,
        action="create",
        resource=PROPOSALS_COLLECTION,
        resource_id=proposal_id,
    )
    return data


def update_proposal(db, proposal_id: str, changes: dict[str, Any], user: dict) -> dict[str, Any]:
    """Apply proposal changes and recalculate monetary totals when needed."""
    doc = _doc_or_404(db, PROPOSALS_COLLECTION, proposal_id, "Propuesta no encontrada")
    data = doc.to_dict()
    clean_changes = {key: value for key, value in changes.items() if value is not None}
    _ensure_proposal_update_allowed(data, clean_changes, user)
    monto_neto = clean_changes.get("montoNeto", data["montoNeto"])
    descuento_pct = clean_changes.get("descuentoPct", data.get("descuentoPct", 0))
    monto_descuento, monto_total = _proposal_amounts(monto_neto, descuento_pct)
    clean_changes.update({
        "montoDescuento": monto_descuento,
        "montoTotal": monto_total,
        "updatedAt": _now(),
    })
    db.collection(PROPOSALS_COLLECTION).document(proposal_id).update(clean_changes)
    record_audit_event(
        db,
        user=user,
        action="update",
        resource=PROPOSALS_COLLECTION,
        resource_id=proposal_id,
        metadata={"fields": sorted(clean_changes.keys())},
    )
    return {**data, **clean_changes, "id": proposal_id}
