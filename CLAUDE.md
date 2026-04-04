# Codon — 合成生物学 AI 多智能体协作平台

V3.2 | 前后端分离 | Vercel + Railway

## 启动

```bash
cd frontend && npm run dev          # http://localhost:3000
cd frontend && npm run build        # 生产构建
cd frontend && npm run lint         # tsc --noEmit
cd backend && python -m uvicorn app.main:app --reload  # http://127.0.0.1:8000/api/docs
docker-compose up --build           # PostgreSQL 15 + Redis 7
```

## 前端（`frontend/src/`）

React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4 + motion 12 + Three.js 0.183 + React Router 7 + Axios

**双布局路由**（`App.tsx`）：
- `HomeLayout`（TopNav + 全屏沉浸）→ `/`
- `AppLayout`（Sidebar + 主内容区）→ `/projects`、`/designer`、`/chat`、`/analysis`
- `LoginView` → `/login`

**核心组件**：DnaParticles（Three.js DNA 粒子背景）、TopNav、Sidebar、Badge、Avatar、ProjectCard、ChatMessage

**设计系统**：深蓝黑底，主色 `--color-primary: #38bdf8`，字体 Instrument Sans / Inter / JetBrains Mono / Noto Sans SC

**新增 View 必须**：
1. `motion.div` + `viewTransition` 包裹
2. `App.tsx` 注册路由 + TopNav 或 Sidebar 注册导航
3. `zh.ts` + `en.ts` 同步 i18n key
4. `components/index.ts` 更新 barrel exports

## 后端（`backend/app/`）

Python 3 + FastAPI 0.109 + SQLAlchemy 2.0 + Alembic + Pydantic 2.x + Celery + Redis + python-jose

**6 Agent**（`agents/`）：env_parse、extremophile、gene_func、circuit_design、metab_compat、struct_predict，均继承 `BaseAgent`，实现 `build_user_prompt()`。

**编排**：`services/agent_orchestrator.py` → `tasks/agent_tasks.py`（Celery）

**数据库**：开发 SQLite（`mars_design.db`），生产 PostgreSQL（`DATABASE_URL`）

**认证**：受保护路由用 `get_current_active_user`，查询带 `owner_id == current_user.id`，返回 404 防枚举。

## 文件联动

| 修改 | 必须同步 |
|------|---------|
| `agents/*.py` | `services/agent_orchestrator.py` |
| `services/auth_service.py` | `api/v1/auth.py` + `frontend/src/api/auth.ts` |
| 新增 `*View.tsx` | `App.tsx` + 导航组件 + `zh.ts` + `en.ts` |
| `i18n/locales/zh.ts` | `en.ts` |
| `components/*.tsx` | `components/index.ts` |

## 部署

- **前端**：Vercel，`VITE_API_URL` 控制 API 地址
- **后端**：Railway，`railway.toml` + `railway-start.sh`
- **CORS**：变更需同步 `backend/app/config.py` 的 `CORS_ORIGINS` 和 Vercel 配置

## 详细规范

`rules/` 目录：AGENTS.md、API_TEST_GUIDE.md、BACKEND_WORKFLOW_SUMMARY.md、DEPLOYMENT.md、FRONTEND_BACKEND_CONNECTION.md、PROJECT_STRUCTURE.md
