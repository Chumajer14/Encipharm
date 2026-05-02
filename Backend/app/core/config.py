from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    APP_NAME: str = "Encipharm API"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    # Firebase
    FIREBASE_PROJECT_ID: str
    GOOGLE_APPLICATION_CREDENTIALS: str

@lru_cache()
def get_settings() -> Settings:
    return Settings()
