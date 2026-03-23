#!/bin/bash
set -e

echo "=== Railway 部署启动 ==="

# 等待数据库就绪
echo "等待 PostgreSQL 就绪..."
until pg_isready -h $(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p') > /dev/null 2>&1; do
  echo "PostgreSQL 未就绪，等待中..."
  sleep 2
done
echo "PostgreSQL 已就绪"

# 执行数据库迁移
echo "执行数据库迁移..."
alembic upgrade head

# 启动 FastAPI
echo "启动 FastAPI 服务..."
exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 2
