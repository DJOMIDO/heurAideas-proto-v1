# backend/app/main.py
from fastapi import FastAPI, Depends # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session # pyright: ignore[reportMissingImports]
from sqlalchemy import text # pyright: ignore[reportMissingImports]
from contextlib import asynccontextmanager
import subprocess
import os
import sys

from app.database import engine, Base, get_db, SessionLocal
from app.core.config import settings

# 导入所有模型（确保表被注册）
from app.models import (
    User, ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask,
    Project, ProjectStep, ProjectSubstep, ProjectSubtask,
    SubstepContent, Attachment, Stakeholder, ProjectMember,
)

# 导入路由
from app.api import auth, users, projects, comments, members, websocket


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # ========== STARTUP ==========
    print("🔄 Initializing database...")
    
    # 1. 创建所有表（幂等操作）
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables ready")
    
    # 2. 导入模板（用 subprocess 执行脚本，避免导入路径问题）
    try:
        result = subprocess.run(
            [sys.executable, "/app/scripts/import_template.py"],
            capture_output=True,
            text=True,
            env={**os.environ}  # 传递 DATABASE_URL 等环境变量
        )
        if result.returncode == 0:
            print("✅ Template initialization complete")
            if result.stdout:
                print(result.stdout[-500:])  # 打印最后 500 字符
        else:
            print(f"⚠️ Template import warning: {result.stderr[:200]}")
    except Exception as e:
        print(f"⚠️ Template import failed: {e}, but app will continue")
    
    yield  # ← 应用在此处运行
    
    # ========== SHUTDOWN ==========
    print("🔄 Shutting down...")
    engine.dispose()


app = FastAPI(
    title="HeurAIDEAS API",
    description="Backend API for HeurAideas project management platform",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://*.netlify.app",
        "https://*.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(comments.router)
app.include_router(members.router)
app.include_router(websocket.router)


@app.get("/")
async def root():
    return {"message": "Welcome to HeurAIDEAS API", "status": "healthy"}


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


if __name__ == "__main__":
    import uvicorn # pyright: ignore[reportMissingImports]
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False,
    )
    