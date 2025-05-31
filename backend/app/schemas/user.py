from pydantic import BaseModel, EmailStr, validator
from typing import Optional
from datetime import datetime
from app.models.user import UserRole


class UserBase(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str
    role: Optional[UserRole] = UserRole.CUSTOMER
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: Optional[bool] = None
    role: Optional[UserRole] = None


class UserResponse(UserBase):
    id: int
    role: UserRole
    avatar_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    last_active: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class UserSummary(BaseModel):
    """Lightweight user info for references"""
    id: int
    email: EmailStr
    first_name: str
    last_name: str
    role: UserRole
    
    class Config:
        from_attributes = True 