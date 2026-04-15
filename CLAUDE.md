# Codon — 为极端环境设计一个生命

合成生物学 AI 辅助设计平台 | 前后端分离 | Vercel + Railway | TypeScript（前端）+ Python（后端）

产品主线：**6 步引导式 Designer**（环境 → 任务 → 底盘 → 蛋白 → 编辑方案 → 仿真），全程点选、零打字，由真实生物数据库 + LLM + ODE 求解器共同驱动。**不是只针对火星**，`extreme_environments.json` 覆盖火星表面、木卫二冰下海洋、金星云层、深海热泉、南极干谷、切尔诺贝利等 11 个极端环境。

## 验证规则

- 前端变更后运行 `cd frontend && npm run lint` 确认无类型错误
- 视觉/布局变更后运行 `cd frontend && npm run build` 确认构建通过
- 后端变更后运行 `cd backend && python -c "from app.main import app"` 确认导入正常
- **不要在未验证的情况下报告完成**

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
- `HomeLayout`（全屏沉浸 + DnaParticles 背景）→ `/`
- `AppLayout`（Sidebar + 主内容区）→ `/projects`、`/designer`、`/chat`、`/analysis`
- `LoginView` → `/login`

**Designer 6 步流程**（`views/DesignerView.tsx` + `components/designer/`）：
1. `EnvironmentStep` — 9 维环境向量（温度 / 电离辐射 / UV 通量 / 压力 / pH / 盐度 / 水活度 / 氧含量 / 温度日变化）+ 11 个 Preset
2. `MissionStep` — 10 类任务（碳固定、固氮、重金属吸收、放射核素固定、酸中和、塑料降解、溢油修复、有机氯降解、磷酸盐释放、生物膜固土）
3. `ChassisStep` — Pareto 排序的底盘候选（30 种，按耐受度 0.5 + 可工程化 0.3 + 任务相关性 0.2 加权）
4. `ProteinStep` — 任务关键词过滤的功能蛋白候选（46 种，带 LLM 80 字解释）
5. `GeneEditStep` — LLM 生成 3–5 个工程化方案（真实质粒 + 启动子 + 密码子优化 + Kill Switch）
6. `SimulationStep` — scipy ODE 三状态变量实时仿真，SSE 推送 200 步轨迹

支持每一步 `RollbackButton` 回滚 + `AgentThinking` 思考动效。

**其它页面**：HomeView（产品落地页）、ProjectsView（项目管理）、ChatView（对话）、AnalysisView（占位）、LoginView。

**设计系统**：深蓝黑底，主色 `--color-primary: #38bdf8`，字体 Instrument Sans / Inter / JetBrains Mono / Noto Sans SC。

**新增 View 必须**：
1. `motion.div` + `viewTransition` 包裹
2. `App.tsx` 注册路由 + Sidebar / TopNav 注册导航
3. `i18n/locales/zh.ts` + `en.ts` 同步 key
4. `components/index.ts` 更新 barrel exports

## 后端（`backend/app/`）

Python 3.9+ + FastAPI 0.109 + SQLAlchemy 2.0 + Alembic + Pydantic 2.x + Celery + Redis + python-jose + bcrypt + **scipy + biopython + cobra + httpx + openai (兼容中转 API)**

**路由**（`app/main.py`）：
- `/api/v1/auth` — 注册 / 登录 / JWT
- `/api/v1/projects` — 项目 CRUD
- `/api/v1/projects/{id}/runtime` — 项目运行时
- `/api/v1/agents` — 旧版 6-Agent 编排入口（legacy，保留兼容）
- `/api/v1/chat` — 对话
- `/api/v1/designer` — **主力流程**：Designer 6-step 流水线

**Designer 流程核心服务**（`services/`）：
| Service | 作用 | 关键算法 |
|---------|------|---------|
| `biotype_service.py` | 底盘推荐 | 30 条 chassis 三维加权 Pareto 排序（0.5/0.3/0.2） |
| `protein_service.py` | 蛋白推荐 | 46 条 protein 按任务关键词打分 + UniProt 实时描述 + LLM 解释 |
| `edit_plan_service.py` | 编辑方案生成 | LLM 产出 3–5 个方案，含真实质粒（pBBR1MCS-2/pET28a/pSEVA251/pHT01）与真实启动子（J23119/Plac/PrhaB/T7），默认启用 Kill Switch |
| `effect_prediction_service.py` | 效应预测 | 高斯环境衰减 × 表达量 × kcat，给 simulation 供参 |
| `simulation_service.py` | ODE 仿真 | scipy `solve_ivp` RK45，三状态 `dN/dE/dS`，0–48h 取 200 点，Euler 兜底 |
| `gene_db_client.py` | 外部数据库客户端 | UniProt REST + NCBI E-utils + KEGG REST，SQLite 缓存 TTL 7d，NCBI 3 req/s 限速 |
| `llm_client.py` | LLM 客户端 | OpenAI 兼容中转 API |
| `auth_service.py` | 认证 | bcrypt + python-jose JWT |

**数据字典**（`app/data/`，模块启动时一次性加载）：
- `extreme_environments.json` — 11 个极端环境预设（含 9 维向量）
- `missions.json` — 10 个任务目标（含 name_zh/en、category、goal_substance）
- `extremophile_chassis.json` — 30 种底盘（含 tolerance 9 维、genetic_tractability、metabolic_traits、NCBI taxid）
- `function_proteins.json` — 46 种功能蛋白（含 kcat/Km、UniProt ID、expected_effect_vector）

**数据库**：
- 业务数据：开发 SQLite（`mars_design.db`），生产 PostgreSQL（`DATABASE_URL`）
- 外部查询缓存：独立 SQLite（`backend/gene_query_cache.db`）

**认证**：受保护路由用 `get_current_active_user`，查询带 `owner_id == current_user.id`，返回 404 防枚举。

**Legacy 6-Agent 编排**（`agents/` + `services/agent_orchestrator.py`）：  
保留 env_parse / extremophile / gene_func / circuit_design / metab_compat / struct_predict 6 个 BaseAgent 实现，供 `/api/v1/agents` 路由串行调用，用于项目级整链推理。DAG 编排会把上游 `findings` 累积注入下游 context，两次 LLM 调用间隔 5 秒规避中转 API 限流。**新功能优先走 Designer，不在这条链路上扩展。**

## 文件联动

| 修改 | 必须同步 |
|------|---------|
| `services/biotype_service.py` / `protein_service.py` / `edit_plan_service.py` / `simulation_service.py` | `api/v1/designer.py` + `schemas/designer.py` + `frontend/src/api/designer.ts` |
| `app/data/*.json` | 影响的 service + 前端 Preset 文案 |
| `services/auth_service.py` | `api/v1/auth.py` + `frontend/src/api/auth.ts` |
| `agents/*.py` | `services/agent_orchestrator.py`（legacy 链路） |
| 新增 `*View.tsx` | `App.tsx` + 导航组件 + `zh.ts` + `en.ts` |
| `i18n/locales/zh.ts` | `en.ts` |
| `components/*.tsx` | `components/index.ts` |

## 部署

- **前端**：Vercel，`VITE_API_URL` 控制 API 地址
- **后端**：Railway，`railway.toml` + `railway-start.sh`
- **CORS**：变更需同步 `backend/app/config.py` 的 `CORS_ORIGINS` / `CORS_ORIGIN_REGEX` 和 Vercel 配置

## 详细规范

`rules/` 目录：AGENTS.md、API_TEST_GUIDE.md、BACKEND_WORKFLOW_SUMMARY.md、DEPLOYMENT.md、FRONTEND_BACKEND_CONNECTION.md、PROJECT_STRUCTURE.md
