from fastapi import APIRouter, Depends, HTTPException, status # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from jose import JWTError, jwt # pyright: ignore[reportMissingModuleSource]

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.config import settings
from app.core.security import decode_access_token

router = APIRouter(prefix="/users", tags=["Users"])

# ============================
# 获取当前用户信息
# ============================
@router.get("/me", response_model=UserResponse)
async def get_current_user(token: str, db: Session = Depends(get_db)):
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
