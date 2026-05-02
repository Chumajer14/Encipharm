from firebase_admin import firestore

from app.services.firebase import init_firebase


def get_db():
    init_firebase()
    return firestore.client()
