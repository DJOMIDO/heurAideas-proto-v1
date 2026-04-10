#!/bin/bash
# backend/scripts/entrypoint.sh
set -e

echo "🚀 Starting HeurAIDEAS Backend..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --no-access-log