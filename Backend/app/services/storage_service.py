from pathlib import Path
import json

from fastapi import HTTPException, status
from google.oauth2 import service_account

from app.core.config import get_settings


def _get_bucket():
    """Obtiene el bucket de documentos RAG configurado para el backend."""

    settings = get_settings()
    if not settings.GCS_BUCKET_DOCUMENTS:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage de documentos no configurado",
        )

    try:
        from google.cloud import storage
    except ImportError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Storage de documentos no disponible",
        ) from error

    client_kwargs = {"project": settings.FIREBASE_PROJECT_ID}
    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        client_kwargs["credentials"] = service_account.Credentials.from_service_account_info(
            json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        )

    return storage.Client(**client_kwargs).bucket(settings.GCS_BUCKET_DOCUMENTS)


def _get_local_storage_root() -> Path:
    """Obtiene el directorio local permitido para documentos de desarrollo."""

    settings = get_settings()
    return Path(settings.LOCAL_DOCUMENT_STORAGE_DIR).resolve()


def _resolve_local_document_path(document_path: str) -> Path:
    """Resuelve una ruta dentro del storage local y bloquea escapes del directorio."""

    storage_root = _get_local_storage_root()
    resolved_path = (storage_root / document_path).resolve()
    try:
        resolved_path.relative_to(storage_root)
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ruta de documento no valida",
        ) from error
    return resolved_path


def upload_document_bytes(file_name: str, content: bytes, content_type: str) -> str:
    """Guarda un documento en GCS o en disco durante desarrollo local."""

    blob_name = f"rag/{file_name}"
    settings = get_settings()
    if not settings.GCS_BUCKET_DOCUMENTS and settings.APP_ENV != "production":
        local_path = _resolve_local_document_path(blob_name)
        local_path.parent.mkdir(parents=True, exist_ok=True)
        local_path.write_bytes(content)
        return blob_name

    blob = _get_bucket().blob(blob_name)
    blob.upload_from_string(content, content_type=content_type)
    return blob_name


def download_document_bytes(gcs_path: str) -> bytes:
    """Recupera un documento desde GCS o desde el storage local de desarrollo."""

    settings = get_settings()
    if not settings.GCS_BUCKET_DOCUMENTS and settings.APP_ENV != "production":
        local_path = _resolve_local_document_path(gcs_path)
        if not local_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Documento local no encontrado",
            )
        return local_path.read_bytes()
    return _get_bucket().blob(gcs_path).download_as_bytes()


def get_extension(file_name: str) -> str:
    """Retorna la extension normalizada del archivo recibido."""

    return Path(file_name or "").suffix.lower()
