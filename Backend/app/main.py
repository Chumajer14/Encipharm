from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.clientes import router as clientes_router
from app.api.dashboard import router as dashboard_router
from app.api.users import router as users_router
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.rate_limit import InMemoryRateLimitMiddleware, RequestSizeLimitMiddleware
from app.docs import router as docs_router
from app.services.firebase import init_firebase

settings = get_settings()

init_firebase()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url=None,
    redoc_url=None,
)

app.add_middleware(InMemoryRateLimitMiddleware, requests_per_minute=120)
app.add_middleware(RequestSizeLimitMiddleware, max_body_bytes=1_000_000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response

app.include_router(auth_router)
app.include_router(clientes_router)
app.include_router(dashboard_router)
app.include_router(users_router)
app.include_router(docs_router)


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
        "activo": user.get("activo", True),
        "message": "Token valido",
    }
