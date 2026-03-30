from fastapi import FastAPI, Depends  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import CORSMiddleware  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import text  # pyright: ignore[reportMissingImports]
from app.database import engine, Base, get_db
from app.core.config import settings

# 导入所有模型（确保表被创建）- noqa: F401 告诉 linter 这些导入是故意的
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
    Stakeholder,  # noqa: F401
)

# 导入路由
from app.api import auth, users, projects, comments

# 创建数据库表
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="HeurAIDEAS API",
    description="Backend API for HeurAideas project management platform",
    version="1.0.0"
)

# CORS 配置（允许前端访问）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(comments.router)

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
    import uvicorn  # pyright: ignore[reportMissingImports]
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    )
