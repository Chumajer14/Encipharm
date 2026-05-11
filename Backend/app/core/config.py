import json
from functools import lru_cache
from typing import Optional

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    APP_NAME: str = "Enci API"
    APP_ENV: str = "development"
    APP_VERSION: str = "1.0.0"

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]
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

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, value):
        """Accept JSON arrays or comma-separated values from hosting panels."""
        if isinstance(value, str):
            raw_value = value.strip()
            if not raw_value:
                return []
            if raw_value.startswith("["):
                value = json.loads(raw_value)
            else:
                value = raw_value.split(",")

        if isinstance(value, list):
            return [
                origin.strip().rstrip("/")
                for origin in value
                if isinstance(origin, str) and origin.strip()
            ]

        return value

    @model_validator(mode="after")
    def validate_security_settings(self):
        if self.APP_ENV == "production" and "*" in self.CORS_ORIGINS:
            raise ValueError("CORS_ORIGINS no puede incluir '*' en produccion")
        if self.APP_ENV == "production" and self.CORS_ORIGIN_REGEX in {".*", "^.*$"}:
            raise ValueError("CORS_ORIGIN_REGEX no puede permitir todos los origenes en produccion")
        return self

@lru_cache()
def get_settings() -> Settings:
    return Settings()
