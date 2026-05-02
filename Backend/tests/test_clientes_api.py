import importlib
import sys
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


class FakeDocumentSnapshot:
    def __init__(self, doc_id, data):
        self.id = doc_id
        self._data = data
        self.exists = data is not None

    def to_dict(self):
        return dict(self._data)


class FakeDocumentReference:
    def __init__(self, collection, doc_id):
        self.collection = collection
        self.doc_id = doc_id

    def get(self):
        return FakeDocumentSnapshot(
            self.doc_id,
            self.collection.records.get(self.doc_id),
        )

    def set(self, data):
        self.collection.records[self.doc_id] = dict(data)

    def update(self, changes):
        self.collection.records[self.doc_id].update(changes)


class FakeCollection:
    def __init__(self, records):
        self.records = records

    def document(self, doc_id):
        return FakeDocumentReference(self, doc_id)

    def stream(self):
        return [
            FakeDocumentSnapshot(doc_id, data)
            for doc_id, data in self.records.items()
        ]


class FakeDb:
    def __init__(self, collections):
        self.collections = collections

    def collection(self, name):
        self.collections.setdefault(name, {})
        return FakeCollection(self.collections[name])


def build_client(monkeypatch, fake_db, token_user):
    monkeypatch.setenv("APP_ENV", "testing")
    monkeypatch.setenv("FIREBASE_PROJECT_ID", "encipharm-test")
    monkeypatch.setenv("GOOGLE_APPLICATION_CREDENTIALS", "serviceAccountKey.json")

    firebase_service = importlib.import_module("app.services.firebase")
    monkeypatch.setattr(firebase_service, "init_firebase", lambda: None)

    sys.modules.pop("app.main", None)
    main = importlib.import_module("app.main")

    auth = importlib.import_module("app.core.auth")
    clientes_api = importlib.import_module("app.api.clientes")
    users_api = importlib.import_module("app.api.users")
    dashboard_api = importlib.import_module("app.api.dashboard")

    async def fake_verify_token(_):
        return token_user

    monkeypatch.setattr(auth, "verify_token", fake_verify_token)
    monkeypatch.setattr(auth, "get_db", lambda: fake_db)
    monkeypatch.setattr(clientes_api, "get_db", lambda: fake_db)
    monkeypatch.setattr(users_api, "get_db", lambda: fake_db)
    monkeypatch.setattr(dashboard_api, "get_db", lambda: fake_db)

    return TestClient(main.app)


def test_vendedor_can_create_cliente(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "seller-1": {
                "uid": "seller-1",
                "email": "seller@encipharm.cl",
                "nombre": "Seller",
                "rol": "vendedor",
                "activo": True,
            },
        },
        "clientes": {},
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "seller-1", "email": "seller@encipharm.cl"},
    )

    response = client.post(
        "/clientes/",
        json={
            "nombre": "Joshua Perez",
            "empresa": "Agricola del Sur",
            "email": "joshua@agricola.cl",
            "rubro": "Aves",
            "region": "Los Lagos",
        },
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["empresa"] == "Agricola del Sur"
    assert body["vendedorUid"] == "seller-1"
    assert len(fake_db.collections["clientes"]) == 1


def test_vendedor_list_is_limited_to_own_clientes(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "seller-1": {
                "uid": "seller-1",
                "email": "seller@encipharm.cl",
                "nombre": "Seller",
                "rol": "vendedor",
                "activo": True,
            },
        },
        "clientes": {
            "cli-1": {
                "id": "cli-1",
                "nombre": "Maria Soto",
                "empresa": "Granja Los Pinos",
                "email": "maria@lospinos.cl",
                "rubro": "Cerdos",
                "region": "Maule",
                "estado": "En proceso",
                "vendedorUid": "seller-1",
            },
            "cli-2": {
                "id": "cli-2",
                "nombre": "Carlos Ruiz",
                "empresa": "Rumiantes Sur",
                "email": "carlos@rumiantes.cl",
                "rubro": "Rumiantes",
                "region": "Biobio",
                "estado": "Completado",
                "vendedorUid": "seller-2",
            },
        },
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "seller-1", "email": "seller@encipharm.cl"},
    )

    response = client.get(
        "/clientes/?search=granja",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == "cli-1"


def test_supervisor_can_import_valid_csv(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "supervisor-1": {
                "uid": "supervisor-1",
                "email": "supervisor@encipharm.cl",
                "nombre": "Supervisor",
                "rol": "supervisor",
                "activo": True,
            },
        },
        "clientes": {},
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "supervisor-1", "email": "supervisor@encipharm.cl"},
    )

    csv_content = (
        "nombre,empresa,email,telefono,rubro,region\n"
        "Maria Soto,Granja Los Pinos,maria@lospinos.cl,+56911111111,Cerdos,Maule\n"
        "Carlos Ruiz,Rumiantes Sur,carlos@rumiantes.cl,+56922222222,Rumiantes,Biobio\n"
    )

    response = client.post(
        "/clientes/import-csv",
        files={"file": ("clientes.csv", csv_content, "text/csv")},
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    assert response.json() == {
        "totalFilas": 2,
        "importados": 2,
        "fallidos": 0,
        "errores": [],
    }
    assert len(fake_db.collections["clientes"]) == 2


def test_invalid_csv_reports_row_errors_and_imports_nothing(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "supervisor-1": {
                "uid": "supervisor-1",
                "email": "supervisor@encipharm.cl",
                "nombre": "Supervisor",
                "rol": "supervisor",
                "activo": True,
            },
        },
        "clientes": {},
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "supervisor-1", "email": "supervisor@encipharm.cl"},
    )

    csv_content = (
        "nombre,empresa,email\n"
        "Maria Soto,Granja Los Pinos,no-es-email\n"
    )

    response = client.post(
        "/clientes/import-csv",
        files={"file": ("clientes.csv", csv_content, "text/csv")},
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["totalFilas"] == 1
    assert body["importados"] == 0
    assert body["fallidos"] == 1
    assert body["errores"][0]["fila"] == 2
    assert fake_db.collections["clientes"] == {}


def test_vendedor_cannot_import_csv(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "seller-1": {
                "uid": "seller-1",
                "email": "seller@encipharm.cl",
                "nombre": "Seller",
                "rol": "vendedor",
                "activo": True,
            },
        },
        "clientes": {},
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "seller-1", "email": "seller@encipharm.cl"},
    )

    response = client.post(
        "/clientes/import-csv",
        files={"file": ("clientes.csv", "nombre,empresa,email\nA,B,a@b.cl\n", "text/csv")},
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 403
    assert fake_db.collections["clientes"] == {}


def test_dashboard_vendedor_counts_only_own_clientes(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "seller-1": {
                "uid": "seller-1",
                "email": "seller@encipharm.cl",
                "nombre": "Seller",
                "rol": "vendedor",
                "activo": True,
            },
        },
        "clientes": {
            "cli-1": {
                "id": "cli-1",
                "nombre": "Maria Soto",
                "empresa": "Granja Los Pinos",
                "email": "maria@lospinos.cl",
                "rubro": "Cerdos",
                "region": "Maule",
                "estado": "En proceso",
                "vendedorUid": "seller-1",
            },
            "cli-2": {
                "id": "cli-2",
                "nombre": "Carlos Ruiz",
                "empresa": "Rumiantes Sur",
                "email": "carlos@rumiantes.cl",
                "rubro": "Rumiantes",
                "region": "Biobio",
                "estado": "Completado",
                "vendedorUid": "seller-2",
            },
        },
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "seller-1", "email": "seller@encipharm.cl"},
    )

    response = client.get(
        "/dashboard/vendedor",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["totalClientes"] == 1
    assert body["clientesPorRubro"] == [{"clave": "Cerdos", "total": 1}]


def test_dashboard_supervisor_counts_all_clientes(monkeypatch):
    fake_db = FakeDb({
        "users": {
            "supervisor-1": {
                "uid": "supervisor-1",
                "email": "supervisor@encipharm.cl",
                "nombre": "Supervisor",
                "rol": "supervisor",
                "activo": True,
            },
        },
        "clientes": {
            "cli-1": {
                "id": "cli-1",
                "nombre": "Maria Soto",
                "empresa": "Granja Los Pinos",
                "email": "maria@lospinos.cl",
                "rubro": "Cerdos",
                "region": "Maule",
                "estado": "En proceso",
                "vendedorUid": "seller-1",
            },
            "cli-2": {
                "id": "cli-2",
                "nombre": "Carlos Ruiz",
                "empresa": "Rumiantes Sur",
                "email": "carlos@rumiantes.cl",
                "rubro": "Rumiantes",
                "region": "Biobio",
                "estado": "Completado",
                "vendedorUid": "seller-2",
            },
        },
    })
    client = build_client(
        monkeypatch,
        fake_db,
        {"uid": "supervisor-1", "email": "supervisor@encipharm.cl"},
    )

    response = client.get(
        "/dashboard/supervisor",
        headers={"Authorization": "Bearer valid-token"},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["totalClientes"] == 2
    assert body["clientesPorEstado"] == [
        {"clave": "Completado", "total": 1},
        {"clave": "En proceso", "total": 1},
    ]
