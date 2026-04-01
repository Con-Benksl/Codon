# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# 前端
cd frontend && npm run dev        # 启动开发服务器 http://localhost:3000
cd frontend && npm run build      # 生产构建 → frontend/dist/
cd frontend && npm run lint       # TypeScript 检查（tsc --noEmit）

# 后端
cd backend && pip install -r requirements.txt
cd backend && python -m uvicorn app.main:app --reload  # http://127.0.0.1:8000
# API 文档：http://127.0.0.1:8000/api/docs

# 本地全栈（需要 Docker）
docker-compose up --build  # 启动 PostgreSQL 15 + Redis 7
```

## Architecture Overview

**Codon** — 合成生物学 AI 多智能体协作平台，前后端分离部署。

### 前端（`frontend/src/`）

**路由层**（`App.tsx`）：React Router 7 SPA，双布局架构：
- `HomeLayout`（顶部导航 + 全屏沉浸式）→ `/`
- `AppLayout`（侧边栏 + 主内容区）→ `/projects`、`/designer`、`/chat`、`/analysis`
- `LoginView` 独立页面 → `/login`
- 其他路由重定向至 `/`

**视图层**（`views/`）：每个 `.tsx` 必须用 `motion.div` + `viewTransition` 包裹。新增视图需在对应 Layout 中注册路由，并同步 `TopNav.tsx` 或 `Sidebar.tsx` 中的导航项。

**组件层**（`components/`）：
- `DnaParticles.tsx` — Three.js DNA 双螺旋粒子背景（全局共享，通过 opacity/particleCount 控制不同页面表现）
- `TopNav.tsx` — 首页顶部横向导航栏
- `Sidebar.tsx` — 工作区可折叠侧边栏
- `Badge.tsx`、`Avatar.tsx`、`ProjectCard.tsx`、`ChatMessage.tsx` — 通用 UI 组件
- `index.ts` — Barrel exports，组件从此导入

**API 层**（`api/`）：所有请求统一走 `api/client.ts`（Axios，自动注入 JWT Token，401 时清除 `localStorage('access_token')` 并跳转登录）。禁止在组件中裸用 axios。

**动画**（`lib/motion.ts`）：仅使用预定义的 `fadeSlideUp`、`stagger`、`viewTransition`、`cardHover` 预设。禁止内联 variants 和 `filter:blur` 动画。

**国际化**（`i18n/`）：`useLocale()` hook，通过 `t("key.path")` 获取翻译。新增 i18n key 时必须同步 `locales/zh.ts` 和 `locales/en.ts`。

**设计系统**（`index.css`）：Tailwind CSS 4 + CSS 变量。深蓝黑底（Maze 风格），主色 `--color-primary: #38bdf8`（青蓝），字体 Instrument Sans / Inter / JetBrains Mono / Noto Sans SC。

### 后端（`backend/app/`）

**Agent 框架**（`agents/`）：6 个专业 Agent（环境解析、极端微生物、基因功能、电路设计、代谢兼容、结构预测），均继承 `base_agent.py` 的 `BaseAgent`，必须实现 `build_user_prompt()` 方法。修改任意 agent 时需同步更新 `services/agent_orchestrator.py`。

**编排层**（`services/agent_orchestrator.py`）：协调多 Agent 串/并行执行，对接 `tasks/agent_tasks.py` 的 Celery 异步任务。

**项目运行时**（`services/project_runtime_service.py` + `api/v1/project_runtime.py`）：管理项目生命周期、视图快照和工件存储。

**数据库**：
- 开发：SQLite（`backend/mars_design.db`，本地状态，勿提交）
- 生产：PostgreSQL（通过 `DATABASE_URL` 环境变量切换）
- 迁移：Alembic

**认证**：所有受保护路由必须使用 `get_current_active_user` 依赖（`dependencies.py`）。查询资源时必须带 `owner_id == current_user.id` 过滤条件，不存在或无权限一律返回 404（防止资源枚举）。

### 关键文件联动规则

| 修改 | 必须同步 |
|------|---------|
| `backend/app/agents/*.py` | `services/agent_orchestrator.py` |
| `backend/app/services/auth_service.py` | `api/v1/auth.py` + `frontend/src/api/auth.ts` |
| 新增 `*View.tsx` | `App.tsx` 路由 + `TopNav.tsx` 或 `Sidebar.tsx` 导航 + `en.ts` + `zh.ts` |
| `i18n/locales/zh.ts` | `i18n/locales/en.ts`（必须同步） |
| `components/*.tsx` | `components/index.ts` barrel exports |

## Deployment

- **前端**：Vercel，环境变量 `VITE_API_URL` 控制 API 基础地址。
- **后端**：Railway，配置见 `railway.toml` 和 `railway-start.sh`；改动影响启动、端口、迁移或环境变量时需同步 Railway 配置。
- **CORS**：跨域变更需同时更新 `backend/app/config.py` 中的 `CORS_ORIGINS` 和 Vercel 前端配置。

## Testing

目前无自动化测试套件，依赖手动验证：
- 提交前运行 `npm run lint`
- 后端端点通过 `http://127.0.0.1:8000/api/docs` 验证
- 新增测试：后端放 `backend/tests/test_*.py`，前端放 `*.test.ts(x)`
