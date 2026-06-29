#!/bin/bash

set -e

echo "Starting HeurAIDEAS Backend..."

if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "Environment variables checked."
echo "Starting Uvicorn server on port ${PORT:-8000}..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --no-access-log \
    --workers 1