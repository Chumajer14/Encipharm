from pathlib import Path
from importlib.util import find_spec

from pydantic import BaseModel

from app.core.config import Settings


DEPLOYED_ENVS = {"production", "staging", "uat"}
PLACEHOLDER_VALUES = {
    "",
    "your-project-id",
    "serviceAccountKey.json",
}


class ReadinessCheck(BaseModel):
    """Single operational check used by the UAT and go-live readiness report."""

    nombre: str
    estado: str
    detalle: str


class ReadinessReport(BaseModel):
    """Backend readiness report for release gates and deployment smoke checks."""

    status: str
    env: str
    version: str
    checks: list[ReadinessCheck]


def _check(name: str, ok: bool, detail: str) -> ReadinessCheck:
    return ReadinessCheck(
        nombre=name,
        estado="ok" if ok else "fail",
        detalle=detail,
    )


def _has_firebase_credentials(settings: Settings) -> bool:
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        return True
    if not settings.GOOGLE_APPLICATION_CREDENTIALS:
        return False
    return (
        Path(settings.GOOGLE_APPLICATION_CREDENTIALS).exists()
        and settings.GOOGLE_APPLICATION_CREDENTIALS not in PLACEHOLDER_VALUES
    )


def build_readiness_report(settings: Settings) -> ReadinessReport:
    """Build a non-secret readiness report without connecting to Firebase."""

    checks = [
        _check(
            "firebase_project_id",
            settings.FIREBASE_PROJECT_ID not in PLACEHOLDER_VALUES,
            "FIREBASE_PROJECT_ID debe apuntar al proyecto Firebase del ambiente.",
        ),
        _check(
            "google_application_credentials",
            _has_firebase_credentials(settings),
            "Configura FIREBASE_SERVICE_ACCOUNT_JSON o un GOOGLE_APPLICATION_CREDENTIALS valido.",
        ),
        _check(
            "cors_origins",
            bool(settings.cors_origins_list),
            "CORS_ORIGINS debe declarar al menos un origen permitido.",
        ),
        _check(
            "rag_deepseek_api_key",
            bool(settings.DEEPSEEK_API_KEY and settings.DEEPSEEK_API_KEY.strip()),
            "DEEPSEEK_API_KEY debe estar configurada en el backend desplegado para habilitar /rag/chat.",
        ),
        _check(
            "rag_deepseek_base_url",
            settings.DEEPSEEK_BASE_URL.startswith("https://"),
            f"DEEPSEEK_BASE_URL activo: {settings.DEEPSEEK_BASE_URL}",
        ),
        _check(
            "rag_deepseek_model",
            bool(settings.DEEPSEEK_MODEL.strip()),
            f"DEEPSEEK_MODEL activo: {settings.DEEPSEEK_MODEL}",
        ),
        _check(
            "rag_openai_client",
            find_spec("openai") is not None,
            "La dependencia openai debe estar instalada para consumir DeepSeek.",
        ),
    ]

    if settings.APP_ENV in DEPLOYED_ENVS:
        checks.append(
            _check(
                "cors_deployed_origins",
                all("localhost" not in origin and "127.0.0.1" not in origin for origin in settings.cors_origins_list),
                "Ambientes desplegados no deben exponer origenes localhost.",
            )
        )

    status = "ready" if all(check.estado == "ok" for check in checks) else "not_ready"

    return ReadinessReport(
        status=status,
        env=settings.APP_ENV,
        version=settings.APP_VERSION,
        checks=checks,
    )
