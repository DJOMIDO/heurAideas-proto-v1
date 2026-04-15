# backend/app/database.py

from sqlalchemy import create_engine # pyright: ignore[reportMissingImports]
from sqlalchemy.ext.declarative import declarative_base # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import sessionmaker # pyright: ignore[reportMissingImports]
import os

# 从环境变量读取
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not set, using local fallback (development only)")
    DATABASE_URL = "postgresql://user:password@localhost:5432/aideas_db"

# 检测是否为 Supabase，如果是则强制 SSL
connect_args = {}
if "supabase" in DATABASE_URL:
    connect_args["sslmode"] = "require"
    print("🔒 Detected Supabase URL, enforcing SSL mode.")

# 添加 pool_pre_ping 提高连接稳定性
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args  # 传入 SSL 参数
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
