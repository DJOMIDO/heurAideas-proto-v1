# backend/app/api/users.py

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from typing import List
from jose import JWTError, jwt  # pyright: ignore[reportMissingModuleSource]
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.config import settings
from app.core.security import decode_access_token
from app.api.auth import get_current_user  # 使用现有的 auth 模块

router = APIRouter(prefix="/users", tags=["Users"])

# ==================== 获取所有用户列表 ====================
@router.get("/", response_model=List[UserResponse])
async def get_user_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取所有用户列表（用于团队成员选择）"""
    users = db.query(User).all()
    # 排除当前用户（不需要选择自己）
    return [u for u in users if u.id != current_user.id]

# ==================== 现有：获取当前用户信息 ====================
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(token: str, db: Session = Depends(get_db)):
    # 验证 Token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    username: str = payload.get("sub")
    if not username:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

    # 查找用户
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )

    return user
