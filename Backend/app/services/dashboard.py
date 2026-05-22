from collections import Counter, defaultdict
from datetime import datetime, timezone
from typing import Any

from app.services.clientes import list_clientes
from app.services.comercial import (
    normalize_opportunity,
    normalize_proposal,
    OPPORTUNITIES_COLLECTION,
    PROPOSALS_COLLECTION,
)


FUNNEL_STAGES = [
    ("nuevo", "Prospeccion"),
    ("contactado", "Calificacion"),
    ("cotizacion", "Propuesta Enviada"),
    ("negociacion", "En Negociacion"),
    ("ganado", "Cierre"),
]
OPEN_STAGES = {"nuevo", "contactado", "cotizacion", "negociacion"}


def _counter_to_list(counter: Counter) -> list[dict[str, Any]]:
    return [
        {"clave": key, "total": value}
        for key, value in sorted(counter.items())
    ]


def _stream_collection(db, collection: str) -> list[dict[str, Any]]:
    """Read all active documents from a Firestore-like collection."""
    try:
        return [
            {"id": doc.id, **doc.to_dict()}
            for doc in db.collection(collection).stream()
            if not (doc.to_dict() or {}).get("deletedAt")
        ]
    except KeyError:
        return []


def _normalize_commercial_record(collection: str, document_id: str, data: dict[str, Any]) -> dict[str, Any]:
    """Apply the same legacy-safe normalization used by commercial endpoints."""
    if collection == OPPORTUNITIES_COLLECTION:
        return normalize_opportunity(document_id, data)
    if collection == PROPOSALS_COLLECTION:
        return normalize_proposal(document_id, data)
    return {"id": document_id, **data}


def _commercial_records(db, collection: str, vendedor_uid: str | None = None) -> list[dict[str, Any]]:
    """Return commercial records optionally restricted to one seller."""
    records = [
        _normalize_commercial_record(collection, record["id"], record)
        for record in _stream_collection(db, collection)
    ]
    if vendedor_uid:
        return [record for record in records if record.get("vendedorUid") == vendedor_uid]
    return records


def _safe_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0


def _safe_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        return value
    if isinstance(value, str) and value:
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
    return None


def _record_datetime(record: dict[str, Any]) -> datetime:
    """Return the best available timestamp for month/week dashboard grouping."""
    for key in ("updatedAt", "createdAt", "fecha"):
        parsed = _safe_datetime(record.get(key))
        if parsed:
            return parsed
    return datetime.now(timezone.utc)


def _current_month_week(value: datetime, now: datetime) -> int | None:
    if value.year != now.year or value.month != now.month:
        return None
    return min(((value.day - 1) // 7) + 1, 5)


def _weighted_value(opportunity: dict[str, Any]) -> float:
    value = _safe_float(opportunity.get("valorEstimado"))
    probability = max(min(_safe_float(opportunity.get("probabilidad")), 100), 0)
    return round(value * (probability / 100), 2)


def _build_forecast(oportunidades: list[dict[str, Any]], propuestas: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Group weighted opportunity value and accepted sales by current-month week."""
    now = datetime.now(timezone.utc)
    projected_by_week: defaultdict[int, float] = defaultdict(float)
    real_by_week: defaultdict[int, float] = defaultdict(float)

    for opportunity in oportunidades:
        week = _current_month_week(_record_datetime(opportunity), now)
        if week:
            projected_by_week[week] += _weighted_value(opportunity)

    for proposal in propuestas:
        if proposal.get("estado") != "aceptada":
            continue
        week = _current_month_week(_record_datetime(proposal), now)
        if week:
            real_by_week[week] += _safe_float(proposal.get("montoTotal"))

    return [
        {
            "etiqueta": f"Sem {week}",
            "proyeccionPonderada": round(projected_by_week[week], 2),
            "ventaReal": round(real_by_week[week], 2),
        }
        for week in range(1, 6)
    ]


def _build_funnel(oportunidades: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build the dashboard funnel using persisted opportunity stages."""
    stage_totals = Counter(opportunity.get("etapa") or "nuevo" for opportunity in oportunidades)
    stage_values: defaultdict[str, float] = defaultdict(float)
    stage_weighted: defaultdict[str, float] = defaultdict(float)

    for opportunity in oportunidades:
        stage = opportunity.get("etapa") or "nuevo"
        stage_values[stage] += _safe_float(opportunity.get("valorEstimado"))
        stage_weighted[stage] += _weighted_value(opportunity)

    max_total = max([stage_totals.get(stage, 0) for stage, _label in FUNNEL_STAGES] or [1], default=1)
    previous_total = None
    funnel = []
    for stage, label in FUNNEL_STAGES:
        total = stage_totals.get(stage, 0)
        change_pct = 0
        if previous_total:
            change_pct = round(((total - previous_total) / previous_total) * 100, 1)
        fuga_pct = abs(change_pct) if change_pct < 0 else 0
        funnel.append({
            "clave": stage,
            "nombre": label,
            "total": total,
            "valorEstimado": round(stage_values[stage], 2),
            "valorPonderado": round(stage_weighted[stage], 2),
            "conversionPct": round((total / max_total) * 100, 1) if max_total else 0,
            "fugaPct": fuga_pct,
            "changePct": change_pct,
        })
        previous_total = total

    return funnel


def build_dashboard(db, vendedor_uid: str | None = None) -> dict[str, Any]:
    """Build customer and commercial KPIs for vendedor or supervisor dashboards."""
    clientes = list_clientes(db, vendedor_uid=vendedor_uid, limit=None)
    estados = Counter(cliente.get("estado") or "Sin estado" for cliente in clientes)
    rubros = Counter(cliente.get("rubro") or "Sin rubro" for cliente in clientes)
    regiones = Counter(cliente.get("region") or "Sin region" for cliente in clientes)
    oportunidades = _commercial_records(db, OPPORTUNITIES_COLLECTION, vendedor_uid=vendedor_uid)
    propuestas = _commercial_records(db, PROPOSALS_COLLECTION, vendedor_uid=vendedor_uid)
    oportunidades_por_etapa = Counter(item.get("etapa") or "Sin etapa" for item in oportunidades)
    propuestas_por_estado = Counter(item.get("estado") or "Sin estado" for item in propuestas)
    accepted_proposals = [item for item in propuestas if item.get("estado") == "aceptada"]
    open_opportunities = [
        item
        for item in oportunidades
        if item.get("etapa") in OPEN_STAGES
    ]
    valor_propuestas_aceptadas = sum(_safe_float(item.get("montoTotal")) for item in accepted_proposals)
    seller_uids = {
        record.get("vendedorUid")
        for record in [*clientes, *oportunidades, *propuestas]
        if record.get("vendedorUid")
    }

    return {
        "totalClientes": len(clientes),
        "clientesActivos": sum(
            1
            for cliente in clientes
            if (cliente.get("estado") or "").lower() != "inactivo"
        ),
        "clientesPorEstado": _counter_to_list(estados),
        "clientesPorRubro": _counter_to_list(rubros),
        "clientesPorRegion": _counter_to_list(regiones),
        "totalOportunidades": len(oportunidades),
        "valorPipeline": sum(_safe_float(item.get("valorEstimado")) for item in open_opportunities),
        "totalPropuestas": len(propuestas),
        "valorPropuestasAceptadas": valor_propuestas_aceptadas,
        "proyeccionPonderada": sum(_weighted_value(item) for item in open_opportunities),
        "ticketPromedio": (
            valor_propuestas_aceptadas / len(accepted_proposals)
            if accepted_proposals
            else 0
        ),
        "tasaConversionGlobal": (
            round((len(accepted_proposals) / len(propuestas)) * 100, 1)
            if propuestas
            else 0
        ),
        "vendedoresActivosHoy": len(seller_uids),
        "totalVendedores": len(seller_uids),
        "oportunidadesPorEtapa": _counter_to_list(oportunidades_por_etapa),
        "propuestasPorEstado": _counter_to_list(propuestas_por_estado),
        "forecastMensual": _build_forecast(oportunidades, propuestas),
        "embudoVentas": _build_funnel(oportunidades),
    }
