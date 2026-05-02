from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum
from datetime import datetime

class Rol(str, Enum):
    vendedor = "vendedor"
    supervisor = "supervisor"
    admin = "admin"

class UsuarioCreate(BaseModel):
    email: EmailStr
    nombre: str
    rol: Rol = Rol.vendedor

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    rol: Optional[Rol] = None
    activo: Optional[bool] = None

class UsuarioOut(BaseModel):
    uid: str
    email: str
    nombre: str
    rol: Rol
    activo: bool
    createdAt: Optional[datetime] = None