import firebase_admin
from firebase_admin import credentials, auth
from app.core.config import get_settings

settings = get_settings()

def init_firebase():
    if not firebase_admin._apps:
        cred = credentials.Certificate(settings.GOOGLE_APPLICATION_CREDENTIALS)
        firebase_admin.initialize_app(cred, {
            "projectId": settings.FIREBASE_PROJECT_ID,
        })

# ← AGREGA ESTA LÍNEA: inicializa al importar el módulo
init_firebase()

async def verify_token(token: str) -> dict:
    try:
        decoded = auth.verify_id_token(token)
        return decoded
    except Exception as e:
        raise ValueError(f"Token inválido: {e}")