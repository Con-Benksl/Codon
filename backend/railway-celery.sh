#!/bin/bash
set -e

echo "=== 启动 Celery Worker ==="

exec celery -A celery_app worker --loglevel=info --concurrency=2
