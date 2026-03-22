# Mars Design 后端开发流程 - Part 8: 测试与部署

## 8.1 单元测试

### 8.1.1 测试配置 (conftest.py)

```python
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db
from app.models import *

# 测试数据库
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()
```

### 8.1.2 Agent 测试 (app/tests/test_agents.py)

```python
import pytest
from app.agents.env_parse_agent import EnvParseAgent
from app.agents.extremophile_agent import ExtremophileAgent

@pytest.mark.asyncio
async def test_env_parse_agent():
    """测试环境解析 Agent"""
    agent = EnvParseAgent()
    input_data = {"location": "Jezero Crater"}

    result = await agent.execute(input_data)

    assert result["status"] == "completed"
    assert "constraints" in result
    assert "perchlorate_concentration" in result["constraints"]

@pytest.mark.asyncio
async def test_extremophile_agent():
    """测试极端微生物筛选 Agent"""
    agent = ExtremophileAgent()
    input_data = {
        "constraints": {
            "perchlorate_concentration": {"min": 0.5, "max": 1.0}
        }
    }

    result = await agent.execute(input_data)

    assert result["status"] == "completed"
    assert len(result["candidate_organisms"]) > 0
    assert result["screening_confidence"] > 0.8
```

### 8.1.3 API 测试 (app/tests/test_api.py)

```python
import pytest
from app.services.auth_service import create_access_token

def test_register_user(client):
    """测试用户注册"""
    response = client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123"
    })
    assert response.status_code == 201
    assert response.json()["email"] == "test@example.com"

def test_create_project(client, db):
    """测试创建项目"""
    # 创建测试用户并获取 token
    token = create_access_token({"sub": "test@example.com"})

    response = client.post(
        "/api/v1/projects/",
        json={
            "name": "Test Project",
            "description": "Test description"
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Project"
```

---

## 8.2 部署配置

### 8.2.1 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 8.2.2 完整 docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mars_design
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mars_design
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=your-secret-key-change-in-production
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./app:/app/app
      - ./exports:/app/exports

  celery_worker:
    build: .
    command: celery -A celery_app worker --loglevel=info --concurrency=4
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mars_design
      - REDIS_URL=redis://redis:6379/0
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/1
    depends_on:
      - postgres
      - redis
    volumes:
      - ./app:/app/app

volumes:
  postgres_data:
  redis_data:
```

---

## 8.3 启动与运行

### 8.3.1 本地开发启动

```bash
# 1. 启动基础设施
docker-compose up -d postgres redis

# 2. 运行数据库迁移
alembic upgrade head

# 3. 启动 FastAPI 服务
uvicorn app.main:app --reload --port 8000

# 4. 启动 Celery Worker (新终端)
celery -A celery_app worker --loglevel=info
```

### 8.3.2 生产环境部署

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 运行迁移
docker-compose exec backend alembic upgrade head
```

---

## 8.4 API 文档访问

启动后访问：
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

---

## 8.5 前端对接示例

### 8.5.1 TypeScript API 客户端

```typescript
// api/client.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 添加认证拦截器
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Agent 编排
export const orchestrateAgents = async (projectId: number, config: any) => {
  const response = await apiClient.post('/agents/orchestrate', {
    project_id: projectId,
    config,
  });
  return response.data;
};

// WebSocket 连接
export const connectWebSocket = (projectId: number) => {
  const ws = new WebSocket(`ws://localhost:8000/ws/projects/${projectId}`);

  ws.onopen = () => {
    console.log('WebSocket 已连接');
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('收到消息:', data);
  };

  return ws;
};
```

---

**Part 8 完成**

最后输出开发流程总结。
