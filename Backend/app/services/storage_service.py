from pathlib import Path

from fastapi import HTTPException, status

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

    return storage.Client(project=settings.FIREBASE_PROJECT_ID).bucket(settings.GCS_BUCKET_DOCUMENTS)


def upload_document_bytes(file_name: str, content: bytes, content_type: str) -> str:
    """Sube un documento validado a Google Cloud Storage."""

    blob_name = f"rag/{file_name}"
    blob = _get_bucket().blob(blob_name)
    blob.upload_from_string(content, content_type=content_type)
    return blob_name


def download_document_bytes(gcs_path: str) -> bytes:
    """Descarga un documento desde Google Cloud Storage."""

    return _get_bucket().blob(gcs_path).download_as_bytes()


def get_extension(file_name: str) -> str:
    """Retorna la extension normalizada del archivo recibido."""

    return Path(file_name or "").suffix.lower()
