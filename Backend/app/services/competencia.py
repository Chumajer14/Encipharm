from typing import Any


COMPETITOR_COMPANIES_COLLECTION = "competition_companies"
COMPETITION_FAMILIES_COLLECTION = "competition_product_families"
COMPETITION_PRICES_COLLECTION = "competition_price_points"
COMPETITION_COMPOSITIONS_COLLECTION = "competition_compositions"


def _document_list(db, collection: str) -> list[dict[str, Any]]:
    records = []
    for doc in db.collection(collection).stream():
        data = doc.to_dict() or {}
        records.append({"id": data.get("id", doc.id), **data})
    return records


def get_competition_repository(db) -> dict[str, Any]:
    return {
        "companies": _document_list(db, COMPETITOR_COMPANIES_COLLECTION),
        "families": _document_list(db, COMPETITION_FAMILIES_COLLECTION),
        "prices": _document_list(db, COMPETITION_PRICES_COLLECTION),
        "compositions": _document_list(db, COMPETITION_COMPOSITIONS_COLLECTION),
        "writableFromUi": False,
        "note": "Repositorio preparado para carga futura; ingreso de datos competitivo pendiente de definicion.",
    }
