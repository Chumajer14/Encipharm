from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    nombre: str
    rol: str = "vendedor"
    activo: bool = True

class UserCreate(UserBase):
    uid: str

class UserResponse(UserBase):
    uid: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True