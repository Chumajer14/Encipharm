from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import get_settings
from app.core.auth import get_current_user
from app.services.firebase import init_firebase
from app.api.auth import router as auth_router

settings = get_settings()

init_firebase()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)

@app.get("/")
def root():
    return {"message": "Encipharm API funcionando"}

@app.get("/health")
def health():
    return {"status": "ok", "env": settings.APP_ENV}

@app.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "message": "Token válido ✅"
    }