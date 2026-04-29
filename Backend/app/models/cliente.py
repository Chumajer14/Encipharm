from pydantic import BaseModel, EmailStr
from typing import Optional, Literal
from datetime import datetime

Industria = Literal["aves", "cerdos", "rumiantes", "acua", "otros"]

class BANT(BaseModel):
    budget: int = 0
    authority: int = 0
    need: int = 0
    timing: int = 0

class ClienteCreate(BaseModel):
    nombre: str
    empresa: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    industria: Industria
    rut: Optional[str] = None
    ciudad: Optional[str] = None
    bant: Optional[BANT] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    empresa: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    industria: Optional[Industria] = None
    rut: Optional[str] = None
    ciudad: Optional[str] = None
    bant: Optional[BANT] = None

class ClienteOut(BaseModel):
    id: str
    nombre: str
    empresa: str
    email: Optional[str] = None
    telefono: Optional[str] = None
    industria: str
    rut: Optional[str] = None
    ciudad: Optional[str] = None
    vendedorId: str
    bant: Optional[BANT] = None
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None