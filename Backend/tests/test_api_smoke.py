import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


def build_client(monkeypatch):
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "encipharm-test")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

    firebase_service = importlib.import_module("app.services.firebase")
    monkeypatch.setattr(firebase_service, "init_firebase", lambda: None)

    sys.modules.pop("app.main", None)
    main = importlib.import_module("app.main")
    return TestClient(main.app)


def test_health_endpoint(monkeypatch):
    client = build_client(monkeypatch)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "env": "testing"}


def test_auth_endpoints_require_bearer_token(monkeypatch):
    client = build_client(monkeypatch)

    me_response = client.get("/me")
    register_response = client.post("/auth/register")

    assert me_response.status_code in (401, 403)
    assert register_response.status_code in (401, 403)


def test_clientes_module_requires_bearer_token(monkeypatch):
    client = build_client(monkeypatch)

    response = client.get("/clientes")

    assert response.status_code in (401, 403)
