from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.clientes import router as clientes_router
from app.api.dashboard import router as dashboard_router
from app.api.users import router as users_router
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.services.firebase import init_firebase

settings = get_settings()

init_firebase()

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(clientes_router)
app.include_router(dashboard_router)
app.include_router(users_router)


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
        "rol": user.get("rol"),
        "message": "Token valido",
    }
