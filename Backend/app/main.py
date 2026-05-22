from fastapi import Depends, FastAPI
from fastapi.exceptions import RequestValidationError
from google.api_core import exceptions as google_exceptions
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.auth import router as auth_router
from app.api.clientes import router as clientes_router
from app.api.comercial import router as comercial_router
from app.api.competencia import router as competencia_router
from app.api.dashboard import router as dashboard_router
from app.api.users import router as users_router
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.errors import (
    http_exception_handler,
    google_api_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.core.rate_limit import InMemoryRateLimitMiddleware, RequestSizeLimitMiddleware
from app.core.readiness import ReadinessReport, build_readiness_report
from app.docs import router as docs_router
from app.services.firebase import init_firebase

settings = get_settings()

init_firebase()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url=None,
    openapi_url=None if settings.APP_ENV == "production" else "/openapi.json",
    redoc_url=None,
)

app.add_middleware(InMemoryRateLimitMiddleware, requests_per_minute=120)
app.add_middleware(RequestSizeLimitMiddleware, max_body_bytes=1_000_000)
app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(google_exceptions.GoogleAPICallError, google_api_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    response.headers.setdefault("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
    if request.url.path.startswith("/docs"):
        response.headers.setdefault(
            "Content-Security-Policy",
            "default-src 'self' https://unpkg.com https://www.gstatic.com; "
            "script-src 'self' 'unsafe-inline' https://unpkg.com https://www.gstatic.com; "
            "style-src 'self' 'unsafe-inline' https://unpkg.com; "
            "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://securetoken.googleapis.com; "
            "frame-ancestors 'none'",
        )
    else:
        response.headers.setdefault("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'")
    return response

app.include_router(auth_router)
app.include_router(clientes_router)
app.include_router(comercial_router)
app.include_router(competencia_router)
app.include_router(dashboard_router)
app.include_router(users_router)
app.include_router(docs_router)


@app.get("/")
def root():
    return {"message": "Enci API funcionando"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/readiness", response_model=ReadinessReport)
def readiness():
    return build_readiness_report(settings)


@app.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {
        "uid": user.get("uid"),
        "email": user.get("email"),
        "rol": user.get("rol"),
        "activo": user.get("activo", True),
        "message": "Token valido",
    }
