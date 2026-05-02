from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.auth import get_current_user

settings = get_settings()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

from app.routers import clientes, usuarios
app.include_router(clientes.router)
app.include_router(usuarios.router)

@app.get("/health", tags=["Sistema"])
def health():
    return {"status": "ok", "version": settings.APP_VERSION}

@app.get("/me", tags=["Auth"])
async def me(current_user: dict = Depends(get_current_user)):
    return {"uid": current_user["uid"], "email": current_user.get("email"),
            "rol": current_user.get("rol"), "nombre": current_user.get("nombre"), "message": "Token válido ✅"}

@app.post("/setup/admin", tags=["Setup"], include_in_schema=False)
async def setup_admin():
    """Endpoint de bootstrap - ELIMINAR después del primer uso"""
    from firebase_admin import firestore
    from datetime import datetime, timezone
    db = firestore.client()
    uid = "ZhmZvERTwPdQGWlZ2gnSSXhT1A72"
    ref = db.collection("users").document(uid)
    ref.set({
        "uid": uid,
        "email": "admin@encipharm.cl",
        "nombre": "Admin Encipharm",
        "rol": "admin",
        "activo": True,
        "createdAt": datetime.now(timezone.utc),
    })
    return {"ok": True, "mensaje": "Usuario admin creado en Firestore"}