# backend/app/api/users.py

from fastapi import ( # pyright: ignore[reportMissingImports]
    APIRouter,
    Depends,
    HTTPException,
    status,
)  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from typing import List
from jose import JWTError, jwt  # pyright: ignore[reportMissingModuleSource]
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.config import settings
from app.core.security import decode_access_token
from app.api.auth import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/", response_model=List[UserResponse])
async def get_user_list(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    """Get all users (for team member selection)"""
    users = db.query(User).all()
    return [u for u in users if u.id != current_user.id]

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(token: str, db: Session = Depends(get_db)):

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
            detail="Invalid authentication credentials",
        )

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )

    return user

@router.get("/search")
async def search_users(
    query: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Search users by username or email (for inviting members when creating projects)"""
    if len(query) < 2:
        return []

    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            (User.username.ilike(f"%{query}%")) | (User.email.ilike(f"%{query}%")),
        )
        .limit(10)
        .all()
    )

    return [{"id": u.id, "username": u.username, "email": u.email} for u in users]
