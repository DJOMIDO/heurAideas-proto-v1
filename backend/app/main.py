# backend/app/main.py

from fastapi import FastAPI, Depends  # pyright: ignore[reportMissingImports]
from fastapi.middleware.cors import ( # pyright: ignore[reportMissingImports]
    CORSMiddleware,
)  # pyright: ignore[reportMissingImports]
from fastapi.staticfiles import StaticFiles  # pyright: ignore[reportMissingImports]
from fastapi.responses import FileResponse  # pyright: ignore[reportMissingImports]
from sqlalchemy.orm import Session  # pyright: ignore[reportMissingImports]
from sqlalchemy import text  # pyright: ignore[reportMissingImports]
from contextlib import asynccontextmanager
import os
import sys
import subprocess
from pathlib import Path
from app.database import engine, Base, get_db, SessionLocal
from app.core.config import settings

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
    Document,
)

from app.api import auth, users, projects, comments, members, websocket, documents


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Initializing database tables...")

    try:
        Base.metadata.create_all(bind=engine)
        print("[Startup] Database tables ready")
    except Exception as e:
        print(f"[Startup] Table creation failed: {e}")

    print("[Startup] Checking template data...")
    try:
        result = subprocess.run(
            [sys.executable, "/app/scripts/import_template.py"],
            capture_output=True,
            text=True,
            env={**os.environ},
        )

        if result.returncode == 0:
            print("[Startup] Template initialization complete")
            if result.stdout:
                lines = result.stdout.strip().split("\n")
                for line in lines[-5:]:
                    print(f"   {line}")
        else:
            print(f"[Startup] Template import warning: {result.stderr[:200]}")
    except Exception as e:
        print(f"[Startup] Template import script failed: {e}")
        print("Continuing anyway (templates can be imported manually later)")

    yield

    print("[Shutdown] Disposing database engine...")
    engine.dispose()


app = FastAPI(
    title="HeurAIDEAS API",
    description="Backend API for HeurAideas project management platform",
    version="1.0.0",
    lifespan=lifespan,
)

allow_origins_str = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,https://heuraideas.netlify.app,https://heuraideas-proto-v1.onrender.com",
)

allow_origins = [
    origin.strip() for origin in allow_origins_str.split(",") if origin.strip()
]

print(f"[CORS] Allowed origins: {allow_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(comments.router)
app.include_router(members.router)
app.include_router(websocket.router)
app.include_router(documents.router)

if not settings.SUPABASE_URL or not settings.SUPABASE_KEY:
    uploads_dir = Path("./uploads")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")
    print("[Static] Mounted /uploads for local file serving")

static_dir = Path("/app/static")
if static_dir.exists() and (static_dir / "index.html").exists():
    assets_dir = static_dir / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if not full_path:
            return FileResponse(static_dir / "index.html")
        file_path = static_dir / full_path
        if file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(static_dir / "index.html")

    print(f"[Static] Mounted frontend from {static_dir}")
else:
    @app.get("/")
    async def root():
        return {
            "message": "Welcome to HeurAIDEAS API",
            "status": "healthy",
            "version": "1.0.0",
        }

    print("[Static] Frontend not found at /app/static, serving API only")

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "ok", "database": "connected"}
    except Exception as e:
        return {"status": "error", "database": str(e)}


@app.get("/ping")
@app.head("/ping")
async def ping():
    return {"pong": "alive", "timestamp": "now"}


if __name__ == "__main__":
    import uvicorn  # pyright: ignore[reportMissingImports]

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False,
    )
