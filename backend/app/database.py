# backend/app/database.py
from sqlalchemy import create_engine # pyright: ignore[reportMissingImports]
from sqlalchemy.ext.declarative import declarative_base # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import sessionmaker # pyright: ignore[reportMissingImports]
import os

# 从环境变量读取，不要硬编码回退值（避免本地配置污染生产）
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # 开发环境提示，但不阻止启动（Render 会注入）
    print("DATABASE_URL not set, using local fallback (development only)")
    DATABASE_URL = "postgresql://user:password@localhost:5432/aideas_db"

# 添加 pool_pre_ping 提高连接稳定性（尤其对 Supabase Pooler）
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # 连接前检查是否存活
    pool_size=5,         # 连接池大小
    max_overflow=10,     # 允许超额连接数
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        