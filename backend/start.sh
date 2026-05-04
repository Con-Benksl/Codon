#!/bin/bash

echo "=== Codon Backend 启动脚本 ==="

# 激活虚拟环境
if [ -d "venv" ]; then
    source venv/bin/activate  # Linux/Mac
    # Windows: venv\Scripts\activate
else
    echo "虚拟环境不存在，请先运行: python -m venv venv"
    exit 1
fi

# 安装依赖
echo "安装依赖..."
pip install -r requirements.txt

# 启动服务
echo "启动 FastAPI 服务..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
