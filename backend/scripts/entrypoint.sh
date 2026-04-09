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

# Run template import (only on first startup)
echo "Checking template data..."
python -c "
from app.database import SessionLocal
from app.models.template import TemplateStep
db = SessionLocal()
count = db.query(TemplateStep).count()
db.close()
exit(0 if count > 0 else 1)
" 2>/dev/null || {
    echo "Template data not found, importing..."
    python scripts/import_template.py
    echo "Template import complete!"
}

# Start the application
echo "Starting Uvicorn server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload