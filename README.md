# MARTIAN BIOLAB AI

**火星定植生物体 多智能体设计系统**

一个面向火星生物定植任务的全栈应用，包含前端可视化界面和后端 Agent 编排系统，涵盖从环境分析、基因合成装配、环境仿真到最终输出验证的完整生物工程设计链路。

---

## 项目结构

```
Mars_design/
├── frontend/                 # 前端应用 (React + TypeScript)
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── views/           # 页面视图
│   │   ├── data/            # Mock 数据
│   │   └── lib/             # 工具库
│   ├── public/              # 静态资源
│   └── package.json
│
├── backend/                 # 后端应用 (Python FastAPI)
│   ├── app/
│   │   ├── models/         # 数据库模型
│   │   ├── schemas/        # Pydantic schemas
│   │   ├── api/            # API 路由
│   │   ├── services/       # 业务逻辑
│   │   ├── agents/         # 6个 Agent 实现
│   │   └── tasks/          # Celery 任务
│   └── requirements.txt
│
└── docker-compose.yml       # Docker 编排配置
```

---

## 技术栈

### 前端
- **React 19** + **TypeScript 5**
- **Vite 6** 构建工具
- **Tailwind CSS v4** + 自定义设计 Token
- **Framer Motion** 动画系统
- **React Router v7** 路由管理

### 后端
- **Python 3.9+** + **FastAPI**
- **SQLAlchemy** + **SQLite** (开发) / **PostgreSQL** (生产)
- **JWT** 认证
- **Pydantic** 数据验证

---

## 视图模块

| 路由 | 视图 | 功能 |
|------|------|------|
| `/orchestrator` | 协调者 | 多智能体任务编排、约束管理、系统状态监控 |
| `/environment` | 环境层 | 火星地点选择、环境参数分析 |
| `/synthesis` | 合成层 | 基因模块装配画布、SBOL 可视化 |
| `/simulation` | 仿真层 | 环境参数调节、多物种存活率仿真 |
| `/output` | 输出层 | 多层次设计验证、多格式导出 |

---

## 快速开始

### 1. 后端启动

```bash
cd backend
pip install -r requirements.txt

# 配置环境变量 (创建 .env 文件)
# 参考 DEPLOYMENT.md

# 初始化数据库
python -m app.database

# 启动服务
python -m uvicorn app.main:app --reload
```

访问 API 文档: http://127.0.0.1:8000/api/docs

### 2. 前端启动

```bash
cd frontend
npm install
npm run dev
```

访问: http://localhost:3003

### 3. 测试流程

1. 访问 http://localhost:3003/login
2. 在 API 文档注册用户: http://127.0.0.1:8000/api/docs
3. 使用注册账号登录前端
4. 测试项目管理和 Agent 编排功能

---

## 文档

- [API 测试指南](./API_TEST_GUIDE.md) - API 接口测试文档
- [部署指南](./DEPLOYMENT.md) - 生产环境部署说明
- [前后端连接报告](./FRONTEND_BACKEND_CONNECTION.md) - 集成完成状态

## 已实现功能

### 后端 API
- ✅ 用户认证 (注册/登录/JWT)
- ✅ 项目管理 (CRUD)
- ✅ Agent 编排系统 (6个智能体)
- ✅ 执行记录查询

### 前端页面
- ✅ 登录页面
- ✅ 项目列表页面
- ✅ Agent 编排界面
- ✅ 环境分析、合成、仿真、输出模块

## 数据库模型

- **users** - 用户表
- **projects** - 项目表
- **gene_modules** - 基因模块库
- **agent_runs** - Agent 执行记录
- **simulations** - 仿真记录
- **designs** - 设计数据
- **exports** - 导出记录
