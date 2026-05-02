from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ClienteBase(BaseModel):
    nombre: str = Field(min_length=1)
    empresa: str = Field(min_length=1)
    email: EmailStr
    telefono: Optional[str] = None
    rubro: Optional[str] = None
    region: Optional[str] = None
    estado: str = "En proceso"
    vendedorUid: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1)
    empresa: Optional[str] = Field(default=None, min_length=1)
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    rubro: Optional[str] = None
    region: Optional[str] = None
    estado: Optional[str] = None
    vendedorUid: Optional[str] = None


class ClienteResponse(ClienteBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None


class CsvImportError(BaseModel):
    fila: int
    errores: list[str]


class CsvImportResult(BaseModel):
    totalFilas: int
    importados: int
    fallidos: int
    errores: list[CsvImportError]
