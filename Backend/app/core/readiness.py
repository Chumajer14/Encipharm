from pathlib import Path

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
            Path(settings.GOOGLE_APPLICATION_CREDENTIALS).exists()
            and settings.GOOGLE_APPLICATION_CREDENTIALS not in PLACEHOLDER_VALUES,
            "GOOGLE_APPLICATION_CREDENTIALS debe existir y no usar el valor placeholder.",
        ),
        _check(
            "cors_origins",
            bool(settings.cors_origins_list),
            "CORS_ORIGINS debe declarar al menos un origen permitido.",
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
