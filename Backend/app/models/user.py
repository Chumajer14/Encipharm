from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from typing import Literal
from datetime import datetime

UserRole = Literal["admin", "supervisor", "vendedor"]

class UserBase(BaseModel):
    email: EmailStr
    nombre: str = Field(min_length=1)
    rol: UserRole = "vendedor"
    activo: bool = True

class UserCreate(UserBase):
    uid: str

class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, min_length=1)
    rol: Optional[UserRole] = None
    activo: Optional[bool] = None

class UserRoleUpdate(BaseModel):
    rol: UserRole

class UserStatusUpdate(BaseModel):
    activo: bool

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    uid: str
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None
