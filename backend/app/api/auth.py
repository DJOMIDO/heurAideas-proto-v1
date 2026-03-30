# backend/app/api/auth.py

from fastapi import APIRouter, Depends, HTTPException, status  # pyright: ignore[reportMissingImports]
from fastapi.security import OAuth2PasswordBearer  # pyright: ignore[reportMissingImports]
from fastapi.security import OAuth2PasswordRequestForm # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from datetime import timedelta

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, UserLogin, Token
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

# OAuth2 scheme，用于从 Header 中提取 Token 指向 OAuth2 专用端点
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/oauth2/login")


# ============================
# 获取当前用户依赖函数
# ============================
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """从 Token 中获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = decode_access_token(token)
        if payload is None:
            raise credentials_exception
        user_id: int = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
    except Exception:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    
    return user


# ============================
# 辅助函数：验证用户
# ============================
def _authenticate_user(db: Session, username_or_email: str, password: str) -> User:
    """验证用户的辅助函数"""
    # 用 username 或 email 查找用户
    user = db.query(User).filter(User.username == username_or_email).first()
    if not user:
        user = db.query(User).filter(User.email == username_or_email).first()
    
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


# ============================
# 辅助函数：创建 Token
# ============================
def _create_token(user: User) -> dict:
    """创建访问令牌的辅助函数"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "email": user.email,
            "user_id": user.id
        },
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ============================
# 注册
# ============================
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    # 检查用户名是否已存在
    existing_user = db.query(User).filter(User.username == user.username).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # 检查邮箱是否已存在
    existing_email = db.query(User).filter(User.email == user.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # 创建新用户（密码哈希）
    hashed_password = get_password_hash(user.password)
    db_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    # 保存到数据库
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user


# ============================
# 登录 - 前端使用（JSON）
# ============================
@router.post("/login", response_model=Token)
async def login_json(
    user_login: UserLogin,  # 只接受 JSON
    db: Session = Depends(get_db)
):
    """前端登录 - 使用 JSON"""
    username_or_email = user_login.email or user_login.username
    password = user_login.password
    
    user = _authenticate_user(db, username_or_email, password)
    return _create_token(user)


# ============================
# 登录 - Swagger OAuth2 使用（Form）
# ============================
@router.post("/oauth2/login", response_model=Token)
async def login_oauth2(
    form_data: OAuth2PasswordRequestForm = Depends(),  # 只接受 Form
    db: Session = Depends(get_db)
):
    """Swagger OAuth2 登录 - 使用 Form 数据"""
    user = _authenticate_user(db, form_data.username, form_data.password)
    return _create_token(user)