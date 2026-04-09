#!/bin/bash
# backend/scripts/entrypoint.sh
# Entry script: Automatically initialize database + start application

set -e

echo "Starting HeurAIDEAS Backend..."

# Wait for database to be ready
echo "Waiting for database..."
for i in {1..30}; do
    if pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USER:-user}" -d "${DB_NAME:-aideas_db}" > /dev/null 2>&1; then
        echo "Database is ready!"
        break
    fi
    echo "Attempt $i/30..."
    sleep 2
done

# Step 1: Create all database tables (idempotent - safe if tables already exist)
echo "Ensuring database tables exist..."
python << 'PYTHON_EOF'
import sys
import os

# Add app to path
sys.path.insert(0, '/app')

# Set DATABASE_URL for container
os.environ['DATABASE_URL'] = os.getenv('DATABASE_URL', 'postgresql://user:password@db:5432/aideas_db')

from sqlalchemy import create_engine
from app.database import Base

# Import ALL models to register their tables with Base.metadata
# This is required for create_all() to work
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

# Create tables (idempotent: does nothing if tables already exist)
engine = create_engine(os.environ['DATABASE_URL'])
Base.metadata.create_all(bind=engine)
print("Database tables ready!")
PYTHON_EOF

# Step 2: Run template import (only if no template data exists)
echo "Checking template data..."
TEMPLATE_COUNT=$(python -c "
import sys
import os
sys.path.insert(0, '/app')
os.environ['DATABASE_URL'] = os.getenv('DATABASE_URL', 'postgresql://user:password@db:5432/aideas_db')
from app.database import SessionLocal
from app.models.template import TemplateStep
try:
    db = SessionLocal()
    count = db.query(TemplateStep).count()
    db.close()
    print(count)
except Exception as e:
    print('0')
" 2>/dev/null || echo "0")

if [ "$TEMPLATE_COUNT" = "0" ] || [ -z "$TEMPLATE_COUNT" ]; then
    echo "Template data not found, importing..."
    if python scripts/import_template.py 2>&1; then
        echo "Template import complete!"
    else
        echo "Template import failed, but starting backend anyway..."
        echo "Retry manually: docker-compose exec backend python scripts/import_template.py"
    fi
else
    echo "Template data already exists ($TEMPLATE_COUNT steps)"
fi

# Step 3: Start the application
echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload