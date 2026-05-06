from functools import lru_cache
from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Firebase web config for /docs testing console
    FIREBASE_WEB_API_KEY: Optional[str] = None
    FIREBASE_WEB_AUTH_DOMAIN: Optional[str] = None
    FIREBASE_WEB_STORAGE_BUCKET: Optional[str] = None
    FIREBASE_WEB_MESSAGING_SENDER_ID: Optional[str] = None
    FIREBASE_WEB_APP_ID: Optional[str] = None
    FIREBASE_WEB_MEASUREMENT_ID: Optional[str] = None

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.APP_ENV == "production" and "*" in self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS no puede incluir '*' en produccion")
        return self

@lru_cache()
def get_settings() -> Settings:
    return Settings()
