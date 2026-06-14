import json
from functools import lru_cache
from typing import Optional

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    APP_NAME: str = "Enci API"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"
    ENABLE_TEMPORARY_ROLE_SWITCHER: bool = True

    # CORS
    CORS_ORIGINS: str = (
        "http://localhost:3000,"
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://localhost:5175,"
        "http://127.0.0.1:5173,"
        "http://127.0.0.1:5174,"
        "http://127.0.0.1:5175"
    )
    CORS_ORIGIN_REGEX: Optional[str] = None

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

    @property
    def cors_origins_list(self) -> list[str]:
        """Accept JSON arrays or comma-separated values from hosting panels."""
        raw_value = self.CORS_ORIGINS.strip()
        if not raw_value:
            return []

        if raw_value.startswith("["):
            value = json.loads(raw_value)
        else:
            value = raw_value.split(",")

        return [
            origin.strip().rstrip("/")
            for origin in value
            if isinstance(origin, str) and origin.strip()
        ]

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.APP_ENV == "production" and "*" in self.cors_origins_list:
            raise ValueError("CORS_ORIGINS no puede incluir '*' en produccion")
        if self.APP_ENV == "production" and self.CORS_ORIGIN_REGEX in {".*", "^.*$"}:
            raise ValueError("CORS_ORIGIN_REGEX no puede permitir todos los origenes en produccion")
        if self.APP_ENV == "production" and self.ENABLE_TEMPORARY_ROLE_SWITCHER:
            raise ValueError("ENABLE_TEMPORARY_ROLE_SWITCHER debe estar deshabilitado en produccion")
        return self

@lru_cache()
def get_settings() -> Settings:
    return Settings()
