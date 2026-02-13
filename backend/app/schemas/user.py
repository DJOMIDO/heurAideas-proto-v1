from pydantic import BaseModel, EmailStr, Field # pyright: ignore[reportMissingImports]
from typing import Optional
from datetime import datetime

# 用户创建（注册）
class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

# 用户响应（不包含密码）
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    username: str
    created_at: datetime

    class Config:
        from_attributes = True

# 用户登录
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Token 响应
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None