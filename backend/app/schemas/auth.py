from pydantic import BaseModel
from typing import Optional
from .user import UserResponse


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


class TokenRefresh(BaseModel):
    refresh_token: str 