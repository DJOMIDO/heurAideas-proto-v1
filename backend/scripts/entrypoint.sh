#!/bin/bash
# backend/scripts/entrypoint.sh
# Simplified for Render deployment

set -e

echo "Starting HeurAIDEAS Backend..."

# Skip pg_isready check for cloud deployment (Supabase is external)
echo "Database connection will be handled by SQLAlchemy..."

# Create tables (idempotent)
echo "Ensuring database tables exist..."
python << 'PYTHON_EOF'
import sys
import os
sys.path.insert(0, '/app')

# Use DATABASE_URL from environment (Render injects this)
if not os.getenv('DATABASE_URL'):
    print("ERROR: DATABASE_URL not set!")
    sys.exit(1)

from sqlalchemy import create_engine
from app.database import Base

# Import ALL models
from app.models import (
    User, ProjectTemplate, TemplateStep, TemplateSubstep, TemplateSubtask,
    Project, ProjectStep, ProjectSubstep, ProjectSubtask,
    SubstepContent, Attachment, Stakeholder, ProjectMember,
)

engine = create_engine(os.environ['DATABASE_URL'])
Base.metadata.create_all(bind=engine)
print("Database tables ready!")
PYTHON_EOF

# Start the application (NO --reload for production!)
echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"