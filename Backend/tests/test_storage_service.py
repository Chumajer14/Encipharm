from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.services import storage_service


def _settings(tmp_path, **overrides):
    """Construye configuracion minima para probar storage sin servicios externos."""

    values = {
        "APP_ENV": "development",
        "FIREBASE_PROJECT_ID": "enci-local",
        "FIREBASE_SERVICE_ACCOUNT_JSON": None,
        "GCS_BUCKET_DOCUMENTS": None,
        "LOCAL_DOCUMENT_STORAGE_DIR": str(tmp_path / "documents"),
    }
    values.update(overrides)
    return SimpleNamespace(**values)


def test_local_storage_uploads_and_downloads_document(tmp_path, monkeypatch):
    """Persiste documentos en disco cuando desarrollo no configura un bucket."""

    monkeypatch.setattr(storage_service, "get_settings", lambda: _settings(tmp_path))

    stored_path = storage_service.upload_document_bytes("manual.txt", b"contenido local", "text/plain")

    assert stored_path == "rag/manual.txt"
    assert storage_service.download_document_bytes(stored_path) == b"contenido local"
    assert (tmp_path / "documents" / "rag" / "manual.txt").read_bytes() == b"contenido local"


def test_local_storage_rejects_paths_outside_storage_root(tmp_path, monkeypatch):
    """Impide que metadatos alterados lean archivos externos al corpus local."""

    monkeypatch.setattr(storage_service, "get_settings", lambda: _settings(tmp_path))

    with pytest.raises(HTTPException) as error:
        storage_service.download_document_bytes("../secreto.txt")

    assert error.value.status_code == 400


def test_production_without_bucket_keeps_configuration_error(tmp_path, monkeypatch):
    """Exige GCS en produccion aunque exista un directorio local configurado."""

    monkeypatch.setattr(
        storage_service,
        "get_settings",
        lambda: _settings(tmp_path, APP_ENV="production"),
    )

    with pytest.raises(HTTPException) as error:
        storage_service.upload_document_bytes("manual.txt", b"contenido", "text/plain")

    assert error.value.status_code == 503
    assert error.value.detail == "Storage de documentos no configurado"
