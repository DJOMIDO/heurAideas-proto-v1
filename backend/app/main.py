# backend/app/main.py

from fastapi import FastAPI, Depends  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import text  # pyright: ignore[reportMissingImports]
from contextlib import asynccontextmanager
import os
import sys
import subprocess

from app.database import engine, Base, get_db, SessionLocal
from app.core.config import settings

# 导入所有模型（确保表被注册）
from app.models import (
    User,
    ProjectTemplate,
    TemplateStep,
    TemplateSubstep,
    TemplateSubtask,
    Project,
    ProjectStep,
    ProjectSubstep,
    ProjectSubtask,
    SubstepContent,
    Attachment,
    Stakeholder,
    ProjectMember,
)

# 导入路由
from app.api import auth, users, projects, comments, members, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理：启动时初始化 DB 和模板"""
    print("🔄 [Startup] Initializing database tables...")
    
    # 1. 创建所有表（幂等操作）
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ [Startup] Database tables ready")
    except Exception as e:
        print(f"❌ [Startup] Table creation failed: {e}")
        # 不阻止启动，让健康检查去处理
    
    # 2. 导入模板数据（幂等：如果已存在则跳过）
    print("📝 [Startup] Checking template data...")
    try:
        # 使用 subprocess 运行脚本，避免导入路径和会话冲突问题
        result = subprocess.run(
            [sys.executable, "/app/scripts/import_template.py"],
            capture_output=True,
            text=True,
            env={**os.environ}  # 传递 DATABASE_URL 等环境变量
        )
        
        if result.returncode == 0:
            print("✅ [Startup] Template initialization complete")
            if result.stdout:
                # 只打印最后几行，避免日志过长
                lines = result.stdout.strip().split('\n')
                for line in lines[-5:]:
                    print(f"   {line}")
        else:
            print(f"⚠️ [Startup] Template import warning: {result.stderr[:200]}")
    except Exception as e:
        print(f"⚠️ [Startup] Template import script failed: {e}")
        print("   Continuing anyway (templates can be imported manually later)")
    
    yield  # ← 应用在此处运行
    
    # ========== SHUTDOWN ==========
    print("🔄 [Shutdown] Disposing database engine...")
    engine.dispose()

app = FastAPI(
    title="HeurAIDEAS API",
    description="Backend API for HeurAideas project management platform",
    version="1.0.0",
    lifespan=lifespan,
)

# ==================== CORS 配置 (动态读取环境变量) ====================
# 默认包含本地开发地址和你的两个生产地址
allow_origins_str = os.getenv(
    "CORS_ORIGINS", 
    "http://localhost:5173,https://heuraideas.netlify.app,https://heuraideas-proto-v1.onrender.com"
)

# 解析逗号分隔的字符串为列表
allow_origins = [origin.strip() for origin in allow_origins_str.split(",") if origin.strip()]

print(f"🌍 [CORS] Allowed origins: {allow_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== 注册路由 ====================
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(comments.router)
app.include_router(members.router)
app.include_router(websocket.router)

# ==================== 基础端点 ====================
@app.get("/")
async def root():
    return {
        "message": "Welcome to HeurAIDEAS API", 
        "status": "healthy",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """健康检查（Render 使用）"""
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}

@app.api_route("/ping", methods=["GET", "HEAD"])
async def ping():
    """
    心跳端点（防止 Render 免费层休眠）
    支持 GET (浏览器测试) 和 HEAD (UptimeRobot)
    """
    return {"pong": "alive"}

if __name__ == "__main__":
    import uvicorn # pyright: ignore[reportMissingImports]
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
    )
    