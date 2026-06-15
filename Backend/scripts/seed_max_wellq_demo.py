"""Seed demo commercial data for max@wellq.co.uk.

Run from Backend with:
    uv run python scripts/seed_max_wellq_demo.py --apply

The script is idempotent: it writes deterministic document IDs tagged with
``max-wellq-demo-20260615`` and keeps existing unrelated data untouched.
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


TARGET_EMAIL = "max@wellq.co.uk"
SEED_TAG = "max-wellq-demo-20260615"


CLIENTS = [
    ("max-wellq-cliente-01", "Carolina Medina", "Agrovet Los Andes", "carolina.medina@agrovetandes.cl", "22334455", "Avicola", "Region Metropolitana", "En proceso", "nuevo", "Prospeccion nutricional broilers", 18_500_000, 20, "enviada"),
    ("max-wellq-cliente-02", "Ignacio Fuentes", "Planteles BioSur", "ignacio.fuentes@biosur.cl", "22334456", "Porcino", "Biobio", "En proceso", "contactado", "Validacion sanitaria reproductoras", 27_000_000, 35, "borrador"),
    ("max-wellq-cliente-03", "Valentina Rojas", "Clinica Veterinaria Andes", "valentina.rojas@vetandes.cl", "22334457", "Clinica", "Valparaiso", "Completado", "cotizacion", "Programa anual farmacos clinicos", 9_800_000, 55, "enviada"),
    ("max-wellq-cliente-04", "Pablo Araya", "Lecheria Santa Clara", "pablo.araya@santaclara.cl", "22334458", "Bovino", "Los Lagos", "En proceso", "negociacion", "Tratamiento metabolico temporada alta", 34_200_000, 72, "enviada"),
    ("max-wellq-cliente-05", "Francisca Soto", "AquaGen Patagonia", "francisca.soto@aquagen.cl", "22334459", "Acuicola", "Magallanes", "Completado", "ganado", "Abastecimiento preventivo centros marinos", 41_000_000, 100, "aceptada"),
    ("max-wellq-cliente-06", "Matias Vera", "Ganadera El Roble", "matias.vera@elroble.cl", "22334460", "Bovino", "Maule", "En proceso", "contactado", "Plan antiparasitario rodeo premium", 16_700_000, 40, "borrador"),
    ("max-wellq-cliente-07", "Daniela Morales", "Avicola Horizonte", "daniela.morales@horizonte.cl", "22334461", "Avicola", "Coquimbo", "En proceso", "cotizacion", "Suplementacion ponedoras fase invierno", 22_400_000, 60, "enviada"),
    ("max-wellq-cliente-08", "Sebastian Pino", "Porcinos San Rafael", "sebastian.pino@sanrafael.cl", "22334462", "Porcino", "O'Higgins", "Inactivo", "perdido", "Recuperacion de cuenta bioseguridad", 12_900_000, 10, "rechazada"),
    ("max-wellq-cliente-09", "Camila Torres", "Equisalud Centro", "camila.torres@equisalud.cl", "22334463", "Equino", "Region Metropolitana", "En proceso", "nuevo", "Linea premium medicina deportiva", 7_600_000, 15, "borrador"),
    ("max-wellq-cliente-10", "Rodrigo Salinas", "Distribuidora VetNorte", "rodrigo.salinas@vetnorte.cl", "22334464", "Distribucion", "Antofagasta", "En proceso", "negociacion", "Acuerdo marco zona norte", 58_000_000, 68, "enviada"),
]


def init_firestore():
    """Initialize Firebase Admin using the configured service account."""
    if firebase_admin._apps:
        return firestore.client()

    credential_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")
    if not Path(credential_path).is_absolute():
        credential_path = str(Path.cwd() / credential_path)
    firebase_admin.initialize_app(credentials.Certificate(credential_path))
    return firestore.client()


def find_target_user(db) -> dict[str, Any]:
    """Resolve the seller UID by Firestore user email or Firebase Auth email."""
    for doc in db.collection("users").stream():
        data = doc.to_dict() or {}
        if str(data.get("email", "")).lower() == TARGET_EMAIL:
            return {"uid": doc.id, **data}

    firebase_user = firebase_auth.get_user_by_email(TARGET_EMAIL)
    now = datetime.now(timezone.utc)
    user_data = {
        "uid": firebase_user.uid,
        "email": TARGET_EMAIL,
        "nombre": firebase_user.display_name or "Max Wellq",
        "rol": "vendedor",
        "cargo": "Vendedor",
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
    return user_data


def build_documents(user: dict[str, Any]) -> list[tuple[str, str, dict[str, Any]]]:
    """Build cliente, oportunidad, propuesta and interaction documents."""
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
        ) = row
        created_at = now - timedelta(days=32 - index * 2)
        opportunity_id = f"max-wellq-oportunidad-{index:02d}"
        proposal_id = f"max-wellq-propuesta-{index:02d}"
        interaction_id = f"max-wellq-interaccion-{index:02d}"
        discount = 4 if propuesta_estado == "aceptada" else 7 if propuesta_estado == "rechazada" else 0
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
            "descripcion": f"Oportunidad seed para {empresa} asociada a {TARGET_EMAIL}.",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(days=1),
            "updatedAt": now,
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
            "notas": "Registro demo para dashboard, pipeline y proyecciones.",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(days=2),
            "updatedAt": now,
            "seedTag": SEED_TAG,
        }))
        docs.append(("interacciones", interaction_id, {
            "id": interaction_id,
            "clienteId": client_id,
            "tipo": "reunion" if index % 3 == 0 else "llamada",
            "fecha": created_at + timedelta(days=3),
            "resumen": f"Seguimiento comercial con {empresa} para revisar avance de {titulo}.",
            "resultado": "Pendiente de siguiente accion" if etapa not in {"ganado", "perdido"} else "Ciclo cerrado",
            "proximaAccion": "Agendar revision de propuesta" if etapa in {"cotizacion", "negociacion"} else "Actualizar estado CRM",
            "vendedorUid": uid,
            "createdAt": created_at + timedelta(days=3),
            "updatedAt": now,
            "seedTag": SEED_TAG,
        }))

    docs.append(("users", uid, {
        **user,
        "rol": user.get("rol") if user.get("rol") != "sin_acceso" else "vendedor",
        "cargo": user.get("cargo") if user.get("cargo") != "Sin acceso" else "Vendedor",
        "rango": user.get("rango") if user.get("rango") != "Sin acceso" else "Vendedor",
        "appMovil": True,
        "webApp": True,
        "activo": True,
        "updatedAt": now,
    }))
    return docs


def main() -> None:
    parser = argparse.ArgumentParser(description="Seed Max Wellq demo commercial data.")
    parser.add_argument("--apply", action="store_true", help="Write documents to Firestore.")
    args = parser.parse_args()

    db = init_firestore()
    user = find_target_user(db)
    docs = build_documents(user)

    print(f"Target: {TARGET_EMAIL} ({user['uid']})")
    print(f"Documents prepared: {len(docs)}")
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
