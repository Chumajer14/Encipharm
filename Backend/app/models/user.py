from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator
from typing import Optional
from typing import Literal
from datetime import datetime

UserRole = Literal["sin_acceso", "admin", "supervisor", "vendedor"]
UserRank = Literal["Sin acceso", "Solo lectura", "Vendedor", "Gerente", "Administrador"]
UserZone = Literal["Zona norte", "Zona centro", "Zona sur", "Zona oriente"]
UserTheme = Literal["dark", "light"]
UserLanguage = Literal["es", "en", "pt"]

ROLE_ALIASES = {
    "admin": "admin",
    "administrador": "admin",
    "administradora": "admin",
    "administrator": "admin",
    "supervisor": "supervisor",
    "vendedor": "vendedor",
    "seller": "vendedor",
    "sin acceso": "sin_acceso",
    "sin_acceso": "sin_acceso",
    "no_access": "sin_acceso",
    "no access": "sin_acceso",
}


def normalize_user_role(value: str | None) -> UserRole:
    normalized = str(value or "sin_acceso").strip().lower()
    return ROLE_ALIASES.get(normalized, "sin_acceso")


RANK_ALIASES = {
    "solo lectura": "Solo lectura",
    "viewer": "Solo lectura",
    "lectura": "Solo lectura",
    "vendedor": "Vendedor",
    "seller": "Vendedor",
    "gerente": "Gerente",
    "manager": "Gerente",
    "admin": "Administrador",
    "administrador": "Administrador",
    "sin acceso": "Sin acceso",
    "sin_acceso": "Sin acceso",
    "no_access": "Sin acceso",
}

ZONE_ALIASES = {
    "norte": "Zona norte",
    "zona norte": "Zona norte",
    "centro": "Zona centro",
    "zona centro": "Zona centro",
    "sur": "Zona sur",
    "zona sur": "Zona sur",
    "oriente": "Zona oriente",
    "zona oriente": "Zona oriente",
}


def normalize_user_rank(value: str | None, role: str | None = None) -> UserRank:
    if value:
        normalized = str(value).strip().lower()
        if normalized in RANK_ALIASES:
            return RANK_ALIASES[normalized]
    role_value = normalize_user_role(role)
    if role_value == "sin_acceso":
        return "Sin acceso"
    if role_value == "admin":
        return "Administrador"
    if role_value == "supervisor":
        return "Gerente"
    return "Vendedor"


def normalize_user_zone(value: str | None) -> UserZone:
    normalized = str(value or "Zona centro").strip().lower()
    return ZONE_ALIASES.get(normalized, "Zona centro")


def normalize_display_name(value: str | None, fallback: str | None = None) -> str:
    raw_value = str(value or fallback or "").strip()
    if not raw_value:
        return "Usuario Enci"

    local_part = raw_value.split("@", 1)[0] if "@" in raw_value else raw_value
    words = [
        word.capitalize()
        for word in local_part.replace(".", " ").replace("_", " ").replace("-", " ").split()
        if word
    ]
    return " ".join(words) or "Usuario Enci"


def normalize_user_theme(value: str | None) -> UserTheme:
    normalized = str(value or "dark").strip().lower()
    return "light" if normalized == "light" else "dark"


def normalize_user_language(value: str | None) -> UserLanguage:
    normalized = str(value or "es").strip().lower()
    return normalized if normalized in {"es", "en", "pt"} else "es"

class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(min_length=1)
    rol: UserRole = "sin_acceso"
    cargo: str = "Sin acceso"
    rango: UserRank = "Sin acceso"
    zona: UserZone = "Zona centro"
    appMovil: bool = False
    webApp: bool = False
    theme: UserTheme = "dark"
    language: UserLanguage = "es"
    activo: bool = True

    @field_validator("nombre", mode="before")
    @classmethod
    def normalize_name(cls, value: str | None) -> str:
        return normalize_display_name(value)

    @field_validator("rol", mode="before")
    @classmethod
    def normalize_role_aliases(cls, value: str | None) -> UserRole:
        return normalize_user_role(value)

    @field_validator("rango", mode="before")
    @classmethod
    def normalize_rank_aliases(cls, value: str | None) -> UserRank:
        return normalize_user_rank(value)

    @field_validator("zona", mode="before")
    @classmethod
    def normalize_zone_aliases(cls, value: str | None) -> UserZone:
        return normalize_user_zone(value)

    @field_validator("theme", mode="before")
    @classmethod
    def normalize_theme_aliases(cls, value: str | None) -> UserTheme:
        return normalize_user_theme(value)

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language_aliases(cls, value: str | None) -> UserLanguage:
        return normalize_user_language(value)

class UserCreate(UserBase):
    model_config = ConfigDict(extra="forbid")

    uid: str

class UserUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    nombre: Optional[str] = Field(default=None, min_length=1)
    lookupEmail: Optional[EmailStr] = None
    rol: Optional[UserRole] = None
    cargo: Optional[str] = Field(default=None, min_length=1, max_length=80)
    rango: Optional[UserRank] = None
    zona: Optional[UserZone] = None
    appMovil: Optional[bool] = None
    webApp: Optional[bool] = None
    theme: Optional[UserTheme] = None
    language: Optional[UserLanguage] = None
    activo: Optional[bool] = None

    @field_validator("nombre", mode="before")
    @classmethod
    def normalize_name(cls, value: str | None) -> str | None:
        return normalize_display_name(value) if value is not None else None

    @field_validator("rol", mode="before")
    @classmethod
    def normalize_role_aliases(cls, value: str | None) -> UserRole | None:
        return normalize_user_role(value) if value is not None else None

    @field_validator("rango", mode="before")
    @classmethod
    def normalize_rank_aliases(cls, value: str | None) -> UserRank | None:
        return normalize_user_rank(value) if value is not None else None

    @field_validator("zona", mode="before")
    @classmethod
    def normalize_zone_aliases(cls, value: str | None) -> UserZone | None:
        return normalize_user_zone(value) if value is not None else None

    @field_validator("theme", mode="before")
    @classmethod
    def normalize_theme_aliases(cls, value: str | None) -> UserTheme | None:
        return normalize_user_theme(value) if value is not None else None

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language_aliases(cls, value: str | None) -> UserLanguage | None:
        return normalize_user_language(value) if value is not None else None

class UserPreferencesUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    theme: Optional[UserTheme] = None
    language: Optional[UserLanguage] = None

    @field_validator("theme", mode="before")
    @classmethod
    def normalize_theme_aliases(cls, value: str | None) -> UserTheme | None:
        return normalize_user_theme(value) if value is not None else None

    @field_validator("language", mode="before")
    @classmethod
    def normalize_language_aliases(cls, value: str | None) -> UserLanguage | None:
        return normalize_user_language(value) if value is not None else None

class UserRoleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    rol: UserRole

    @field_validator("rol", mode="before")
    @classmethod
    def normalize_role_aliases(cls, value: str | None) -> UserRole:
        return normalize_user_role(value)

class UserStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    activo: bool

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    uid: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
