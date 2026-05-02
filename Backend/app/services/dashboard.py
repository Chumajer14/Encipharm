from collections import Counter
from typing import Any

from app.services.clientes import list_clientes


def _counter_to_list(counter: Counter) -> list[dict[str, Any]]:
    return [
        {"clave": key, "total": value}
        for key, value in sorted(counter.items())
    ]


def build_dashboard(db, vendedor_uid: str | None = None) -> dict[str, Any]:
    clientes = list_clientes(db, vendedor_uid=vendedor_uid)
    estados = Counter(cliente.get("estado") or "Sin estado" for cliente in clientes)
    rubros = Counter(cliente.get("rubro") or "Sin rubro" for cliente in clientes)
    regiones = Counter(cliente.get("region") or "Sin region" for cliente in clientes)

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
    }
