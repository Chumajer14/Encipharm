from pathlib import Path

from app.core.config import Settings
from app.core.readiness import build_readiness_report


def _settings(**overrides) -> Settings:
    values = {
        "APP_ENV": "uat",
        "APP_VERSION": "1.0.0",
        "CORS_ORIGINS": "https://uat.enci.cl",
        "FIREBASE_PROJECT_ID": "enci-uat",
        "GOOGLE_APPLICATION_CREDENTIALS": __file__,
    }
    values.update(overrides)
    return Settings(**values)


def test_readiness_report_is_ready_for_valid_uat_settings():
    report = build_readiness_report(_settings())

    assert report.status == "ready"
    assert report.env == "uat"
    assert {check.estado for check in report.checks} == {"ok"}


def test_readiness_report_flags_placeholder_firebase_project():
    report = build_readiness_report(_settings(FIREBASE_PROJECT_ID="your-project-id"))

    assert report.status == "not_ready"
    assert any(
        check.nombre == "firebase_project_id" and check.estado == "fail"
        for check in report.checks
    )


def test_readiness_report_flags_missing_credentials_file():
    missing_file = Path(__file__).with_name("missing-service-account.json")

    report = build_readiness_report(_settings(GOOGLE_APPLICATION_CREDENTIALS=str(missing_file)))

    assert report.status == "not_ready"
    assert any(
        check.nombre == "google_application_credentials" and check.estado == "fail"
        for check in report.checks
    )


def test_readiness_report_flags_localhost_cors_in_deployed_env():
    report = build_readiness_report(_settings(CORS_ORIGINS="http://localhost:5173"))

    assert report.status == "not_ready"
    assert any(
        check.nombre == "cors_deployed_origins" and check.estado == "fail"
        for check in report.checks
    )
