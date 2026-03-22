# Mars Design 后端开发流程 - 方案B详细实施指南

## Part 1: 项目初始化与环境搭建

### 1.1 技术栈确认

**核心框架**
- Python 3.11+
- FastAPI 0.109+
- PostgreSQL 15+
- Redis 7+
- Celery 5.3+
- WebSocket (FastAPI内置)

**生物信息学库**
- BioPython 1.81+
- COBRApy 0.26+
- python-sbol2 1.4+
- NumPy 1.24+
- Pandas 2.0+

**其他依赖**
- SQLAlchemy 2.0+ (ORM)
- Alembic (数据库迁移)
- Pydantic 2.0+ (数据验证)
- python-jose (JWT认证)
- passlib (密码哈希)
- WeasyPrint (PDF导出)
- httpx (异步HTTP客户端)

---

### 1.2 项目结构设计

```
mars-design-backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI应用入口
│   ├── config.py                  # 配置管理
│   ├── database.py                # 数据库连接
│   ├── dependencies.py            # 依赖注入
│   │
│   ├── models/                    # SQLAlchemy模型
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── gene_module.py
│   │   ├── agent_run.py
│   │   ├── simulation.py
│   │   ├── design.py
│   │   └── export.py
│   │
│   ├── schemas/                   # Pydantic schemas
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── agent.py
│   │   ├── simulation.py
│   │   └── export.py
│   │
│   ├── api/                       # API路由
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── agents.py
│   │   │   ├── modules.py
│   │   │   ├── simulations.py
│   │   │   ├── designs.py
│   │   │   └── exports.py
│   │   └── websocket.py
│   │
│   ├── services/                  # 业务逻辑层
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── project_service.py
│   │   ├── agent_orchestrator.py
│   │   ├── simulation_engine.py
│   │   └── export_service.py
│   │
│   ├── agents/                    # 6个Agent实现
│   │   ├── __init__.py
│   │   ├── base_agent.py
│   │   ├── env_parse_agent.py
│   │   ├── extremophile_agent.py
│   │   ├── gene_func_agent.py
│   │   ├── circuit_design_agent.py
│   │   ├── metab_compat_agent.py
│   │   └── struct_predict_agent.py
│   │
│   ├── tasks/                     # Celery任务
│   │   ├── __init__.py
│   │   ├── agent_tasks.py
│   │   ├── simulation_tasks.py
│   │   └── export_tasks.py
│   │
│   ├── utils/                     # 工具函数
│   │   ├── __init__.py
│   │   ├── bio_tools.py          # 生物信息学工具封装
│   │   ├── redis_client.py
│   │   └── websocket_manager.py
│   │
│   └── tests/                     # 测试
│       ├── __init__.py
│       ├── test_agents.py
│       ├── test_api.py
│       └── test_simulation.py
│
├── alembic/                       # 数据库迁移
│   ├── versions/
│   └── env.py
│
├── celery_app.py                  # Celery配置
├── requirements.txt
├── .env.example
├── docker-compose.yml
└── README.md
```

---

### 1.3 环境搭建步骤

#### Step 1: 创建项目目录
```bash
mkdir mars-design-backend
cd mars-design-backend
```

#### Step 2: 初始化Python虚拟环境
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

#### Step 3: 创建 requirements.txt
```txt
# Web框架
fastapi==0.109.0
uvicorn[standard]==0.27.0
python-multipart==0.0.6

# 数据库
sqlalchemy==2.0.25
alembic==1.13.1
psycopg2-binary==2.9.9

# 任务队列
celery==5.3.6
redis==5.0.1

# 数据验证
pydantic==2.5.3
pydantic-settings==2.1.0

# 认证
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6

# 生物信息学
biopython==1.81
cobra==0.26.3
python-sbol2==1.4
numpy==1.24.4
pandas==2.0.3

# 导出
weasyprint==60.2

# HTTP客户端
httpx==0.26.0

# 测试
pytest==7.4.4
pytest-asyncio==0.23.3
```

#### Step 4: 安装依赖
```bash
pip install -r requirements.txt
```

#### Step 5: 创建 .env 文件
```bash
# .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mars_design
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1

# 外部API (可选)
ALPHAFOLD_API_KEY=your-api-key
NCBI_API_KEY=your-api-key
```

#### Step 6: Docker Compose 配置
```yaml
# docker-compose.yml
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

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  celery_worker:
    build: .
    command: celery -A celery_app worker --loglevel=info
    depends_on:
      - postgres
      - redis
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mars_design
      - REDIS_URL=redis://redis:6379/0

volumes:
  postgres_data:
  redis_data:
```

#### Step 7: 启动基础设施
```bash
docker-compose up -d postgres redis
```

---

### 1.4 配置管理 (app/config.py)

```python
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # 应用配置
    APP_NAME: str = "Mars Design Backend"
    VERSION: str = "1.0.0"
    DEBUG: bool = False

    # 数据库
    DATABASE_URL: str

    # Redis
    REDIS_URL: str

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Celery
    CELERY_BROKER_URL: str
    CELERY_RESULT_BACKEND: str

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings() -> Settings:
    return Settings()
```

---

### 1.5 数据库连接 (app/database.py)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """依赖注入：获取数据库会话"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

### 1.6 FastAPI 应用入口 (app/main.py)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.api.v1 import auth, projects, agents, modules, simulations, designs, exports
from app.api.websocket import router as ws_router

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(auth.router, prefix="/api/v1/auth", tags=["认证"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["项目"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["智能体"])
app.include_router(modules.router, prefix="/api/v1/modules", tags=["基因模块"])
app.include_router(simulations.router, prefix="/api/v1/simulations", tags=["仿真"])
app.include_router(designs.router, prefix="/api/v1/designs", tags=["设计"])
app.include_router(exports.router, prefix="/api/v1/exports", tags=["导出"])
app.include_router(ws_router, prefix="/ws", tags=["WebSocket"])

@app.get("/")
async def root():
    return {"message": "Mars Design Backend API", "version": settings.VERSION}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

---

**Part 1 完成**

下一部分将详细讲解数据库模型设计与迁移。
