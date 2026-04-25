from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class ClienteBase(BaseModel):
    nombre: str
    rut: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    cargo: Optional[str] = None
    region: Optional[str] = None
    comuna: Optional[str] = None
    direccion: Optional[str] = None
    segmento: Optional[str] = "cliente"  # cliente, prospecto, inactivo
    notas: Optional[str] = None


class ClienteCreate(ClienteBase):
    vendedor_uid: str


class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    empresa: Optional[str] = None
    cargo: Optional[str] = None
    region: Optional[str] = None
    comuna: Optional[str] = None
    direccion: Optional[str] = None
    segmento: Optional[str] = None
    notas: Optional[str] = None


class ClienteResponse(ClienteBase):
    id: str
    vendedor_uid: str
    createdAt: datetime
    updatedAt: datetime