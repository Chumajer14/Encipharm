from collections import Counter
from typing import Any

from app.services.clientes import list_clientes
from app.services.comercial import OPPORTUNITIES_COLLECTION, PROPOSALS_COLLECTION


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


def _commercial_records(db, collection: str, vendedor_uid: str | None = None) -> list[dict[str, Any]]:
    """Return commercial records optionally restricted to one seller."""
    records = _stream_collection(db, collection)
    if vendedor_uid:
        return [record for record in records if record.get("vendedorUid") == vendedor_uid]
    return records


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
        "valorPipeline": sum(float(item.get("valorEstimado") or 0) for item in oportunidades),
        "totalPropuestas": len(propuestas),
        "valorPropuestasAceptadas": sum(
            float(item.get("montoTotal") or 0)
            for item in propuestas
            if item.get("estado") == "aceptada"
        ),
        "oportunidadesPorEtapa": _counter_to_list(oportunidades_por_etapa),
        "propuestasPorEstado": _counter_to_list(propuestas_por_estado),
    }
