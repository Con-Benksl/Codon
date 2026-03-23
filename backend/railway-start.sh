#!/bin/bash
set -euo pipefail

echo "=== Railway deploy start ==="

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set"
  exit 1
fi

if [ -z "${SECRET_KEY:-}" ]; then
  echo "SECRET_KEY is not set"
  exit 1
fi

if [ -z "${REDIS_URL:-}" ]; then
  echo "REDIS_URL is not set"
  exit 1
fi

if [ -z "${CELERY_BROKER_URL:-}" ]; then
  export CELERY_BROKER_URL="${REDIS_URL}/0"
fi

if [ -z "${CELERY_RESULT_BACKEND:-}" ]; then
  export CELERY_RESULT_BACKEND="${REDIS_URL}/1"
fi

echo "Running database migrations..."
for i in $(seq 1 30); do
  if python -m alembic upgrade head; then
    echo "Database migrations completed"
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "Database migrations failed after 30 attempts"
    exit 1
  fi

  echo "Database not ready yet, retrying in 2 seconds..."
  sleep 2
done

echo "Starting FastAPI on port ${PORT:-8000}..."
exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
