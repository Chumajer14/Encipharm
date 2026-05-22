from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


InteractionType = Literal["llamada", "visita", "correo", "reunion"]
OpportunityStage = Literal["nuevo", "contactado", "cotizacion", "negociacion", "ganado", "perdido"]
ProposalStatus = Literal["borrador", "enviada", "aceptada", "rechazada"]

FORMULA_PREFIXES = ("=", "+", "-", "@")


def _reject_formula_injection(value: str | None) -> str | None:
    if value and value.strip().startswith(FORMULA_PREFIXES):
        raise ValueError("El valor no puede iniciar con caracteres de formula")
    return value


def normalize_opportunity_stage(value: str | None) -> str | None:
    if value is None:
        return value
    normalized = value.strip().lower()
    aliases = {
        "prospecto": "nuevo",
        "prospeccion": "nuevo",
        "calificado": "contactado",
        "calificacion": "contactado",
        "propuesta": "cotizacion",
        "propuesta enviada": "cotizacion",
        "cotización": "cotizacion",
        "negociación": "negociacion",
        "cerrado ganado": "ganado",
        "cerrado perdido": "perdido",
    }
    return aliases.get(normalized, normalized)


def normalize_proposal_status(value: str | None) -> str | None:
    if value is None:
        return value
    normalized = value.strip().lower()
    aliases = {
        "en negociación": "enviada",
        "en negociacion": "enviada",
        "ganada": "aceptada",
        "perdida": "rechazada",
    }
    return aliases.get(normalized, normalized)


class InteractionCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clienteId: str = Field(min_length=1, max_length=128)
    tipo: InteractionType
    fecha: datetime
    resumen: str = Field(min_length=1, max_length=1000)
    resultado: Optional[str] = Field(default=None, max_length=500)
    proximaAccion: Optional[str] = Field(default=None, max_length=500)

    @field_validator("clienteId", "resumen", "resultado", "proximaAccion")
    @classmethod
    def reject_formula_values(cls, value: str | None) -> str | None:
        return _reject_formula_injection(value)


class InteractionResponse(InteractionCreate):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str
    vendedorUid: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class OpportunityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clienteId: str = Field(min_length=1, max_length=128)
    titulo: str = Field(min_length=1, max_length=160)
    etapa: OpportunityStage = "nuevo"
    valorEstimado: float = Field(default=0, ge=0, le=1_000_000_000)
    probabilidad: int = Field(default=0, ge=0, le=100)
    descripcion: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("clienteId", "titulo", "descripcion")
    @classmethod
    def reject_formula_values(cls, value: str | None) -> str | None:
        return _reject_formula_injection(value)

    @field_validator("etapa", mode="before")
    @classmethod
    def normalize_stage_aliases(cls, value: str | None) -> str | None:
        return normalize_opportunity_stage(value)


class OpportunityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    titulo: Optional[str] = Field(default=None, min_length=1, max_length=160)
    etapa: Optional[OpportunityStage] = None
    valorEstimado: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    probabilidad: Optional[int] = Field(default=None, ge=0, le=100)
    descripcion: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("titulo", "descripcion")
    @classmethod
    def reject_formula_values(cls, value: str | None) -> str | None:
        return _reject_formula_injection(value)

    @field_validator("etapa", mode="before")
    @classmethod
    def normalize_stage_aliases(cls, value: str | None) -> str | None:
        return normalize_opportunity_stage(value)


class OpportunityResponse(OpportunityCreate):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str
    vendedorUid: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class OpportunityDetailResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    oportunidad: OpportunityResponse
    interacciones: list[InteractionResponse]
    propuestas: list["ProposalResponse"]


class ProposalCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    clienteId: str = Field(min_length=1, max_length=128)
    oportunidadId: str = Field(min_length=1, max_length=128)
    titulo: str = Field(min_length=1, max_length=160)
    montoNeto: float = Field(ge=0, le=1_000_000_000)
    descuentoPct: float = Field(default=0, ge=0, le=100)
    estado: ProposalStatus = "borrador"
    notas: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("clienteId", "oportunidadId", "titulo", "notas")
    @classmethod
    def reject_formula_values(cls, value: str | None) -> str | None:
        return _reject_formula_injection(value)

    @field_validator("estado", mode="before")
    @classmethod
    def normalize_status_aliases(cls, value: str | None) -> str | None:
        return normalize_proposal_status(value)


class ProposalUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    titulo: Optional[str] = Field(default=None, min_length=1, max_length=160)
    montoNeto: Optional[float] = Field(default=None, ge=0, le=1_000_000_000)
    descuentoPct: Optional[float] = Field(default=None, ge=0, le=100)
    estado: Optional[ProposalStatus] = None
    notas: Optional[str] = Field(default=None, max_length=1000)

    @field_validator("titulo", "notas")
    @classmethod
    def reject_formula_values(cls, value: str | None) -> str | None:
        return _reject_formula_injection(value)

    @field_validator("estado", mode="before")
    @classmethod
    def normalize_status_aliases(cls, value: str | None) -> str | None:
        return normalize_proposal_status(value)


class ProposalResponse(ProposalCreate):
    model_config = ConfigDict(from_attributes=True, extra="ignore")

    id: str
    vendedorUid: str
    montoDescuento: float
    montoTotal: float
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
