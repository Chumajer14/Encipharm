import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


class FakeDocumentSnapshot:
    def __init__(self, uid, data):
        self.id = uid
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data)


class FakeDocumentReference:
    def __init__(self, collection, uid):
        self.collection = collection
        self.uid = uid

    def get(self):
        return FakeDocumentSnapshot(
            self.uid,
            self.collection.records.get(self.uid),
        )

    def update(self, changes):
        self.collection.records[self.uid].update(changes)


class FakeCollection:
    def __init__(self, records):
        self.records = records

    def document(self, uid):
        return FakeDocumentReference(self, uid)

    def stream(self):
        return [
            FakeDocumentSnapshot(uid, data)
            for uid, data in self.records.items()
        ]


class FakeDb:
    def __init__(self, records):
        self.records = records

    def collection(self, name):
        assert name == "users"
        return FakeCollection(self.records)


def build_client(monkeypatch, fake_db, token_user):
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "encipharm-test")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

    firebase_service = importlib.import_module("app.services.firebase")
    monkeypatch.setattr(firebase_service, "init_firebase", lambda: None)

    sys.modules.pop("app.main", None)
    main = importlib.import_module("app.main")

    auth = importlib.import_module("app.core.auth")
    users_api = importlib.import_module("app.api.users")

    async def fake_verify_token(_):
        return token_user

    monkeypatch.setattr(auth, "verify_token", fake_verify_token)
    monkeypatch.setattr(auth, "get_db", lambda: fake_db)
    monkeypatch.setattr(users_api, "get_db", lambda: fake_db)

    return TestClient(main.app)


def test_supervisor_can_list_active_users(monkeypatch):
    records = {
        "admin-1": {
            "uid": "admin-1",
            "email": "admin@encipharm.cl",
            "nombre": "Admin",
            "rol": "admin",
            "activo": True,
        },
        "seller-1": {
            "uid": "seller-1",
            "email": "seller@encipharm.cl",
            "nombre": "Seller",
            "rol": "vendedor",
            "activo": False,
        },
    }
    client = build_client(
        monkeypatch,
        FakeDb(records),
        {"uid": "admin-1", "email": "admin@encipharm.cl"},
    )

    response = client.get(
        "/users/?activo=true",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    users = response.json()
    assert len(users) == 1
    assert users[0]["uid"] == "admin-1"


def test_admin_can_update_user_role(monkeypatch):
    records = {
        "admin-1": {
            "uid": "admin-1",
            "email": "admin@encipharm.cl",
            "nombre": "Admin",
            "rol": "admin",
            "activo": True,
        },
        "seller-1": {
            "uid": "seller-1",
            "email": "seller@encipharm.cl",
            "nombre": "Seller",
            "rol": "vendedor",
            "activo": True,
        },
    }
    client = build_client(
        monkeypatch,
        FakeDb(records),
        {"uid": "admin-1", "email": "admin@encipharm.cl"},
    )

    response = client.patch(
        "/users/seller-1/role",
        json={"rol": "supervisor"},
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert response.json()["rol"] == "supervisor"
    assert records["seller-1"]["rol"] == "supervisor"


def test_vendedor_cannot_update_roles(monkeypatch):
    records = {
        "seller-1": {
            "uid": "seller-1",
            "email": "seller@encipharm.cl",
            "nombre": "Seller",
            "rol": "vendedor",
            "activo": True,
        },
        "seller-2": {
            "uid": "seller-2",
            "email": "seller2@encipharm.cl",
            "nombre": "Seller 2",
            "rol": "vendedor",
            "activo": True,
        },
    }
    client = build_client(
        monkeypatch,
        FakeDb(records),
        {"uid": "seller-1", "email": "seller@encipharm.cl"},
    )

    response = client.patch(
        "/users/seller-2/role",
        json={"rol": "supervisor"},
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 403
    assert records["seller-2"]["rol"] == "vendedor"
