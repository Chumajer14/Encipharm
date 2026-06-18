import json

import firebase_admin
from app.core.config import get_settings
from firebase_admin import auth, credentials


def _build_firebase_credentials(settings):
    """Construye credenciales Firebase desde JSON de entorno o archivo local."""

    if settings.FIREBASE_SERVICE_ACCOUNT_JSON:
        service_account = json.loads(settings.FIREBASE_SERVICE_ACCOUNT_JSON)
        return credentials.Certificate(service_account)
    return credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)


def init_firebase():
    if not firebase_admin._apps:
        settings = get_settings()
        cred = _build_firebase_credentials(settings)
        firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID,
        })


async def verify_token(token: str) -> dict:
    try:
        return auth.verify_id_token(token, clock_skew_seconds=60)
    except Exception as error:
        raise ValueError(f"Token invalido: {error}") from error
