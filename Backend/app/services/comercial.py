from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fastapi import HTTPException, status

from app.models.comercial import (
    InteractionCreate,
    OpportunityCreate,
    ProposalCreate,
)


INTERACTIONS_COLLECTION = "interacciones"
OPPORTUNITIES_COLLECTION = "oportunidades"
PROPOSALS_COLLECTION = "propuestas"
MAX_RESPONSE = 500


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


def _proposal_amounts(monto_neto: float, descuento_pct: float) -> tuple[float, float]:
    monto_descuento = round(monto_neto * (descuento_pct / 100), 2)
    monto_total = round(monto_neto - monto_descuento, 2)
    return monto_descuento, monto_total


def list_interactions(db, user: dict, cliente_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    interactions = []
    for doc in db.collection(INTERACTIONS_COLLECTION).stream():
        data = {"id": doc.id, **doc.to_dict()}
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if _visible_by_user(data, user):
            interactions.append(data)
    return _limited(interactions, limit)


def create_interaction(db, payload: InteractionCreate, user: dict) -> dict[str, Any]:
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
    return data


def list_opportunities(db, user: dict, cliente_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    opportunities = []
    for doc in db.collection(OPPORTUNITIES_COLLECTION).stream():
        data = {"id": doc.id, **doc.to_dict()}
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if _visible_by_user(data, user):
            opportunities.append(data)
    return _limited(opportunities, limit)


def create_opportunity(db, payload: OpportunityCreate, user: dict) -> dict[str, Any]:
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
    return data


def update_opportunity(db, opportunity_id: str, changes: dict[str, Any], user: dict) -> dict[str, Any]:
    doc = _doc_or_404(db, OPPORTUNITIES_COLLECTION, opportunity_id, "Oportunidad no encontrada")
    data = doc.to_dict()
    if not _visible_by_user(data, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para esta oportunidad")
    clean_changes = {key: value for key, value in changes.items() if value is not None}
    clean_changes["updatedAt"] = _now()
    db.collection(OPPORTUNITIES_COLLECTION).document(opportunity_id).update(clean_changes)
    return {**data, **clean_changes, "id": opportunity_id}


def list_proposals(db, user: dict, cliente_id: str | None = None, limit: int = 100) -> list[dict[str, Any]]:
    proposals = []
    for doc in db.collection(PROPOSALS_COLLECTION).stream():
        data = {"id": doc.id, **doc.to_dict()}
        if cliente_id and data.get("clienteId") != cliente_id:
            continue
        if _visible_by_user(data, user):
            proposals.append(data)
    return _limited(proposals, limit)


def create_proposal(db, payload: ProposalCreate, user: dict) -> dict[str, Any]:
    assert_cliente_visible(db, payload.clienteId, user)
    if payload.oportunidadId:
        opportunity = _doc_or_404(db, OPPORTUNITIES_COLLECTION, payload.oportunidadId, "Oportunidad no encontrada")
        if opportunity.to_dict().get("clienteId") != payload.clienteId:
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
    return data


def update_proposal(db, proposal_id: str, changes: dict[str, Any], user: dict) -> dict[str, Any]:
    doc = _doc_or_404(db, PROPOSALS_COLLECTION, proposal_id, "Propuesta no encontrada")
    data = doc.to_dict()
    if not _visible_by_user(data, user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para esta propuesta")
    clean_changes = {key: value for key, value in changes.items() if value is not None}
    monto_neto = clean_changes.get("montoNeto", data["montoNeto"])
    descuento_pct = clean_changes.get("descuentoPct", data.get("descuentoPct", 0))
    monto_descuento, monto_total = _proposal_amounts(monto_neto, descuento_pct)
    clean_changes.update({
        "montoDescuento": monto_descuento,
        "montoTotal": monto_total,
        "updatedAt": _now(),
    })
    db.collection(PROPOSALS_COLLECTION).document(proposal_id).update(clean_changes)
    return {**data, **clean_changes, "id": proposal_id}
