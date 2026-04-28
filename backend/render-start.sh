#!/bin/bash
# Render 部署启动脚本
# Render 会自动注入 PORT 环境变量

set -euo pipefail

echo "=== Render deploy start ==="

: "${DATABASE_URL:?DATABASE_URL 未设置}"
: "${SECRET_KEY:?SECRET_KEY 未设置}"

# Render 默认 PORT=10000
PORT="${PORT:-10000}"

echo "Running database migrations..."
# 注意：不再重试 30 次。
# Supabase Pooler 对认证失败有熔断保护——重试只会让熔断永远不解除。
# alembic 自身会做合理的连接重试；如果连不上就立刻失败，让用户先修密码。
if ! python -m alembic upgrade head; then
  echo "Database migrations failed — likely a wrong DATABASE_URL or network issue."
  echo "Verify DATABASE_URL in Render → Environment, then redeploy."
  exit 1
fi
echo "Database migrations completed"

echo "Starting FastAPI on port ${PORT}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT}"
