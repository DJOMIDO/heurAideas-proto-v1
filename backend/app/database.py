# backend/app/database.py

from sqlalchemy import create_engine # pyright: ignore[reportMissingImports]
from sqlalchemy.ext.declarative import declarative_base # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import sessionmaker # pyright: ignore[reportMissingImports]
import os

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("DATABASE_URL not set, using local fallback (development only)")
    DATABASE_URL = "postgresql://user:password@localhost:5432/aideas_db"

connect_args = {}
if "supabase" in DATABASE_URL:
    connect_args["sslmode"] = "require"
    print("Detected Supabase URL, enforcing SSL mode.")

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=connect_args
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
