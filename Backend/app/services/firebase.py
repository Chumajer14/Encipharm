import firebase_admin
from app.core.config import get_settings
from firebase_admin import auth, credentials

settings = get_settings()


def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID,
        })


async def verify_token(token: str) -> dict:
    try:
        return auth.verify_id_token(token, clock_skew_seconds=60)
    except Exception as error:
        raise ValueError(f"Token invalido: {error}") from error
