#!/bin/bash

set -e

echo "Starting HeurAIDEAS Backend..."

# 检查必要的环境变量
if [ -z "$DATABASE_URL" ]; then
    echo "ERROR: DATABASE_URL environment variable is not set!"
    exit 1
fi

echo "Environment variables checked."
echo "Starting Uvicorn server on port ${PORT:-8000}..."

# 直接启动应用，数据库初始化和模板导入将在 main.py 的 lifespan 中执行
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${PORT:-8000}" \
    --no-access-log \
    --workers 1