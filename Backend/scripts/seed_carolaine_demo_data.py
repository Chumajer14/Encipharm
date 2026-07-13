"""Seed demo commercial data for Carolaine Jennifer Palacios Cereceda.

Run from Backend with:
    uv run python scripts/seed_carolaine_demo_data.py --apply

The script is idempotent: it writes deterministic document IDs tagged with
``carolaine-palacios-demo-20260713`` and keeps unrelated Firestore data intact.
"""

from __future__ import annotations

import argparse
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore


TARGET_NAME = "Carolaine Jennifer Palacios Cereceda"
SEED_TAG = "carolaine-palacios-demo-20260713"


CLIENTS = [
    (
        "carolaine-cliente-01",
        "Marcela Tapia",
        "Avicola Valle Norte",
        "marcela.tapia@vallenorte.cl",
        "+56223441001",
        "Avicola",
        "Region Metropolitana",
        "En proceso",
        "nuevo",
        "Programa sanitario broilers Q3",
        24_800_000,
        22,
        "borrador",
        12,
    ),
    (
        "carolaine-cliente-02",
        "Hector Valdes",
        "Plantel Porcino Santa Emilia",
        "hector.valdes@santaemilia.cl",
        "+56223441002",
        "Porcino",
        "O'Higgins",
        "En proceso",
        "contactado",
        "Control respiratorio reproductoras",
        36_500_000,
        38,
        "enviada",
        11,
    ),
    (
        "carolaine-cliente-03",
        "Paula Contreras",
        "Lecheria Los Arrayanes",
        "paula.contreras@arrayanes.cl",
        "+56223441003",
        "Bovino",
        "Los Lagos",
        "En proceso",
        "cotizacion",
        "Plan metabolico preparto invierno",
        42_200_000,
        61,
        "enviada",
        10,
    ),
    (
        "carolaine-cliente-04",
        "Joaquin Ibarra",
        "Distribuidora VetSur",
        "joaquin.ibarra@vetsur.cl",
        "+56223441004",
        "Distribucion",
        "Biobio",
        "En proceso",
        "negociacion",
        "Acuerdo marco farmacos zona sur",
        68_000_000,
        74,
        "enviada",
        9,
    ),
    (
        "carolaine-cliente-05",
        "Sofia Munoz",
        "AquaHealth Patagonia",
        "sofia.munoz@aquahealth.cl",
        "+56223441005",
        "Acuicola",
        "Magallanes",
        "Completado",
        "ganado",
        "Abastecimiento preventivo centros marinos",
        51_600_000,
        100,
        "aceptada",
        8,
    ),
    (
        "carolaine-cliente-06",
        "Ignacio Perez",
        "Clinica Veterinaria Providencia",
        "ignacio.perez@vetprovidencia.cl",
        "+56223441006",
        "Clinica",
        "Region Metropolitana",
        "Completado",
        "ganado",
        "Linea anual analgesia y antibioticos",
        18_900_000,
        100,
        "aceptada",
        7,
    ),
    (
        "carolaine-cliente-07",
        "Daniela Riquelme",
        "Equisalud Premium",
        "daniela.riquelme@equisalud.cl",
        "+56223441007",
        "Equino",
        "Valparaiso",
        "En proceso",
        "cotizacion",
        "Medicina deportiva equina temporada alta",
        13_400_000,
        57,
        "enviada",
        6,
    ),
    (
        "carolaine-cliente-08",
        "Cristobal Navarro",
        "Ganadera El Trigal",
        "cristobal.navarro@eltrigal.cl",
        "+56223441008",
        "Bovino",
        "Maule",
        "En proceso",
        "negociacion",
        "Plan antiparasitario rodeo premium",
        29_700_000,
        69,
        "enviada",
        5,
    ),
    (
        "carolaine-cliente-09",
        "Camila Arancibia",
        "Avicola Horizonte Sur",
        "camila.arancibia@horizontesur.cl",
        "+56223441009",
        "Avicola",
        "La Araucania",
        "Inactivo",
        "perdido",
        "Recuperacion cuenta postura comercial",
        15_800_000,
        8,
        "rechazada",
        4,
    ),
    (
        "carolaine-cliente-10",
        "Rodrigo Mena",
        "Agrovet Cordillera",
        "rodrigo.mena@agrovetcordillera.cl",
        "+56223441010",
        "Distribucion",
        "Zona norte",
        "En proceso",
        "contactado",
        "Expansion mix farmaceutico zona norte",
        33_300_000,
        41,
        "borrador",
        3,
    ),
    (
        "carolaine-cliente-11",
        "Valentina Salazar",
        "Porcinos Las Lomas",
        "valentina.salazar@laslomas.cl",
        "+56223441011",
        "Porcino",
        "Nuble",
        "En proceso",
        "cotizacion",
        "Bioseguridad y soporte terapeutico",
        47_900_000,
        63,
        "enviada",
        2,
    ),
    (
        "carolaine-cliente-12",
        "Felipe Saavedra",
        "Centro Veterinario Austral",
        "felipe.saavedra@vetaustral.cl",
        "+56223441012",
        "Clinica",
        "Los Rios",
        "Completado",
        "ganado",
        "Renovacion convenio farmacia clinica",
        21_500_000,
        100,
        "aceptada",
        1,
    ),
]


def init_firestore():
    """Initialize Firebase Admin with the local service account configuration."""
    if firebase_admin._apps:
        return firestore.client()

    credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
    if not Path(credential_path).is_absolute():
        credential_path = str(Path.cwd() / credential_path)
    firebase_admin.initialize_app(credentials.Certificate(credential_path))
    return firestore.client()


def normalize_name(value: str | None) -> str:
    """Return a lowercase, whitespace-normalized name for exact matching."""
    return " ".join(str(value or "").strip().lower().split())


def find_target_user(db, fallback_email: str | None = None) -> dict[str, Any]:
    """Resolve Carolaine by Firestore name/email or Firebase Auth profile."""
    target_name = normalize_name(TARGET_NAME)
    fallback_email = fallback_email.lower().strip() if fallback_email else None

    for doc in db.collection("users").stream():
        data = doc.to_dict() or {}
        user_name = normalize_name(data.get("nombre") or data.get("displayName"))
        user_email = str(data.get("email", "")).lower()
        if user_name == target_name or (fallback_email and user_email == fallback_email):
            return {"uid": doc.id, **data}

    if fallback_email:
        firebase_user = firebase_auth.get_user_by_email(fallback_email)
        return build_user_data(firebase_user.uid, firebase_user.email or fallback_email, firebase_user.display_name)

    for page in firebase_auth.list_users().iterate_all():
        if normalize_name(page.display_name) == target_name:
            return build_user_data(page.uid, page.email or "", page.display_name)

    raise RuntimeError(
        f"No se encontro el usuario '{TARGET_NAME}' en Firestore ni Firebase Auth. "
        "Reintenta con --email para resolverlo por correo."
    )


def build_user_data(uid: str, email: str, display_name: str | None) -> dict[str, Any]:
    """Build the Firestore user profile required by dashboard authorization."""
    now = datetime.now(timezone.utc)
    return {
        "uid": uid,
        "email": email,
        "nombre": display_name or TARGET_NAME,
        "rol": "vendedor",
        "cargo": "Ejecutiva Comercial",
        "rango": "Vendedor",
        "zona": "Zona centro",
        "appMovil": True,
        "webApp": True,
        "activo": True,
        "theme": "dark",
        "language": "es",
        "createdAt": now,
        "updatedAt": now,
    }


def current_month_date(now: datetime, days_ago: int) -> datetime:
    """Return a timestamp inside the current month for visible forecast buckets."""
    first_day = now.replace(day=1, hour=10, minute=0, second=0, microsecond=0)
    candidate = now.replace(hour=10, minute=0, second=0, microsecond=0) - timedelta(days=days_ago)
    return candidate if candidate >= first_day else first_day + timedelta(days=days_ago % max(now.day, 1))


def build_documents(user: dict[str, Any]) -> list[tuple[str, str, dict[str, Any]]]:
    """Build cliente, opportunity, proposal and interaction documents for the seed."""
    now = datetime.now(timezone.utc)
    uid = user["uid"]
    docs: list[tuple[str, str, dict[str, Any]]] = []

    for index, row in enumerate(CLIENTS, start=1):
        (
            client_id,
            nombre,
            empresa,
            email,
            telefono,
            rubro,
            region,
            estado,
            etapa,
            titulo,
            valor,
            probabilidad,
            propuesta_estado,
            days_ago,
        ) = row
        created_at = current_month_date(now, days_ago)
        opportunity_id = f"carolaine-oportunidad-{index:02d}"
        proposal_id = f"carolaine-propuesta-{index:02d}"
        interaction_id = f"carolaine-interaccion-{index:02d}"
        discount = 5 if propuesta_estado == "aceptada" else 8 if propuesta_estado == "rechazada" else 3
        total = round(valor * (1 - discount / 100), 2)

        docs.append(("clientes", client_id, {
            "id": client_id,
            "nombre": nombre,
            "empresa": empresa,
            "email": email,
            "telefono": telefono,
            "rubro": rubro,
            "region": region,
            "estado": estado,
            "vendedorUid": uid,
            "ownerUid": uid,
            "createdAt": created_at,
            "updatedAt": now,
            "seedTag": SEED_TAG,
        }))
        docs.append(("oportunidades", opportunity_id, {
            "id": opportunity_id,
            "clienteId": client_id,
            "titulo": titulo,
            "etapa": etapa,
            "valorEstimado": valor,
            "probabilidad": probabilidad,
            "descripcion": f"Oportunidad demo para {empresa} asociada a {TARGET_NAME}.",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(hours=2),
            "updatedAt": created_at + timedelta(hours=3),
            "seedTag": SEED_TAG,
        }))
        docs.append(("propuestas", proposal_id, {
            "id": proposal_id,
            "clienteId": client_id,
            "oportunidadId": opportunity_id,
            "titulo": f"Propuesta comercial - {titulo}",
            "montoNeto": valor,
            "descuentoPct": discount,
            "montoDescuento": round(valor * discount / 100, 2),
            "montoTotal": total,
            "estado": propuesta_estado,
            "notas": "Registro demo para metricas de ventas, pipeline y proyecciones.",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(hours=4),
            "updatedAt": created_at + timedelta(hours=5),
            "seedTag": SEED_TAG,
        }))
        docs.append(("interacciones", interaction_id, {
            "id": interaction_id,
            "clienteId": client_id,
            "tipo": "reunion" if etapa in {"cotizacion", "negociacion", "ganado"} else "llamada",
            "fecha": created_at + timedelta(hours=6),
            "resumen": f"Seguimiento comercial con {empresa} para revisar avance de {titulo}.",
            "resultado": "Siguiente accion comercial definida" if etapa not in {"ganado", "perdido"} else "Ciclo comercial cerrado",
            "proximaAccion": "Actualizar forecast y preparar propuesta revisada" if etapa in {"cotizacion", "negociacion"} else "Mantener cadencia de seguimiento",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(hours=6),
            "updatedAt": now,
            "seedTag": SEED_TAG,
        }))

    docs.append(("users", uid, {
        **user,
        "nombre": user.get("nombre") or TARGET_NAME,
        "rol": "vendedor" if user.get("rol") in {None, "sin_acceso"} else user.get("rol"),
        "cargo": user.get("cargo") if user.get("cargo") not in {None, "Sin acceso"} else "Ejecutiva Comercial",
        "rango": user.get("rango") if user.get("rango") not in {None, "Sin acceso"} else "Vendedor",
        "zona": user.get("zona") or "Zona centro",
        "appMovil": True,
        "webApp": True,
        "activo": True,
        "updatedAt": now,
        "seedTag": SEED_TAG,
    }))
    return docs


def summarize_documents(docs: list[tuple[str, str, dict[str, Any]]]) -> dict[str, int]:
    """Count prepared writes by Firestore collection."""
    summary: dict[str, int] = {}
    for collection, _document_id, _data in docs:
        summary[collection] = summary.get(collection, 0) + 1
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Carolaine demo commercial data.")
    parser.add_argument("--apply", action="store_true", help="Write documents to Firestore.")
    parser.add_argument("--email", default=None, help="Optional email to resolve the target user.")
    args = parser.parse_args()

    db = init_firestore()
    user = find_target_user(db, fallback_email=args.email)
    docs = build_documents(user)
    summary = summarize_documents(docs)

    print(f"Target: {TARGET_NAME} ({user['uid']})")
    print(f"Email: {user.get('email') or 'sin correo'}")
    print(f"Documents prepared: {len(docs)}")
    for collection, total in sorted(summary.items()):
        print(f"- {collection}: {total}")

    if not args.apply:
        print("Dry run only. Re-run with --apply to write data.")
        return

    batch = db.batch()
    for collection, document_id, data in docs:
        batch.set(db.collection(collection).document(document_id), data, merge=True)
    batch.commit()
    print(f"Seed applied with tag {SEED_TAG}.")


if __name__ == "__main__":
    main()
