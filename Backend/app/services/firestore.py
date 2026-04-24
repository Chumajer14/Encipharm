from google.cloud import firestore
from app.services.firebase import init_firebase

init_firebase()

def get_db() -> firestore.Client:
    return firestore.Client()