from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field


class CompetitorCompany(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=160)
    icon: str = Field(default="", max_length=8)
    active: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)
    updatedAt: Optional[datetime] = None


class CompetitionProductFamily(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=128)
    label: str = Field(min_length=1, max_length=160)
    products: list[dict[str, Any]] = Field(default_factory=list)
    active: bool = True
    updatedAt: Optional[datetime] = None


class CompetitionPricePoint(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=128)
    productId: str = Field(min_length=1, max_length=128)
    companyId: str = Field(min_length=1, max_length=128)
    unit: str = Field(min_length=1, max_length=32)
    price: float = Field(ge=0)
    source: Optional[str] = Field(default=None, max_length=240)
    sourceDate: Optional[datetime] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    updatedAt: Optional[datetime] = None


class CompetitionComposition(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(min_length=1, max_length=128)
    productId: str = Field(min_length=1, max_length=128)
    companyId: str = Field(min_length=1, max_length=128)
    ingredients: list[dict[str, Any]] = Field(default_factory=list)
    source: Optional[str] = Field(default=None, max_length=240)
    sourceDate: Optional[datetime] = None
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    updatedAt: Optional[datetime] = None


class CompetitionRepositoryResponse(BaseModel):
    companies: list[CompetitorCompany]
    families: list[CompetitionProductFamily]
    prices: list[CompetitionPricePoint]
    compositions: list[CompetitionComposition]
    writableFromUi: bool = False
    note: str = "Repositorio preparado para carga futura; ingreso de datos competitivo pendiente de definicion."
