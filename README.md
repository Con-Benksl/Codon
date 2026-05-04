# Codon

**中文** | [English](#english)

合成生物学 AI 辅助设计平台：用 6 步点选式流程，为火星表面、木卫二冰下海洋、切尔诺贝利反应堆等极端环境生成可解释的工程微生物概念方案。

Codon 将“为一个极端环境设计一株能生存并执行生态修复任务的工程微生物”拆成一条可操作流水线：环境定义、任务选择、底盘推荐、功能蛋白选择、基因编辑方案生成、ODE 动态仿真。平台结合本地知识库、真实生物数据库查询、LLM 解释与科学计算模拟，面向教学、科研原型和演示场景。

> 安全说明：本项目输出为概念设计与教学级模拟，不应直接作为湿实验、环境释放、临床、生物安全审批或生产部署依据。

## 目录

- [核心能力](#核心能力)
- [Designer 六步流程](#designer-六步流程)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [环境变量](#环境变量)
- [验证命令](#验证命令)
- [部署](#部署)
- [数据与数据库](#数据与数据库)
- [文档](#文档)
- [许可](#许可)
- [English](#english)

## 核心能力

- **极端环境建模**：内置 11 个极端环境预设，并支持 9 维环境向量自定义。
- **生态修复任务选择**：内置 10 类任务，包括产氧固碳、固氮造土、重金属吸收、放射核素固定、酸中和、塑料降解、溢油修复、有机氯降解、磷酸盐释放和生物膜固土。
- **可解释底盘推荐**：基于耐受度、可工程化等级和任务相关性进行 Pareto 多目标排序，输出 Top 候选底盘。
- **蛋白与数据库支撑**：维护 46 种功能蛋白记录，并接入 UniProt、NCBI E-utils、KEGG REST 查询与本地 SQLite 缓存。
- **LLM 编辑方案生成**：生成含载体、启动子、密码子优化、代谢负担、参考文献和 Kill Switch 的工程化编辑方案。
- **ODE 动态仿真**：使用 `scipy.solve_ivp` 求解种群、环境目标和限制性养分的耦合动态，并通过 SSE 推送 200 步轨迹。
- **项目化 Designer**：裸 `/designer` 可直接开始设计；首次有效输入后自动保存为草稿 Project / Design / DesignerSession。
- **持续方案报告**：每一步确认后持续更新 `DesignReport`，支持 Markdown 快照导出。
- **沉浸式前端体验**：React + Three.js DNA 粒子背景、动效路由、项目绑定 Designer 会话和中英文界面。

## Designer 六步流程

| 步骤 | 前端组件 | 后端路由 | 核心逻辑 |
|---|---|---|---|
| 1. 环境定义 | `EnvironmentStep.tsx` | `POST /designer/sessions/{sid}/environment` | 9 维环境向量；从后端加载 11 个环境预设，失败时使用本地 fallback |
| 2. 任务选择 | `MissionStep.tsx` | `POST /designer/sessions/{sid}/mission` | 从后端加载 10 类任务，提交后返回 Top-6 底盘候选 |
| 3. 底盘筛选 | `ChassisStep.tsx` | `POST /designer/sessions/{sid}/chassis` | `biotype_service.recommend_chassis()` Pareto 排序 |
| 4. 蛋白选择 | `ProteinStep.tsx` | `POST /designer/sessions/{sid}/protein` | `protein_service.recommend_proteins()` + UniProt/BRENDA 链接 + LLM 解释 |
| 5. 编辑方案 | `GeneEditStep.tsx` | `POST /designer/sessions/{sid}/edit-plan` | `edit_plan_service.generate_edit_plans()` 生成 3-5 个候选方案 |
| 6. 动态仿真 | `SimulationStep.tsx` | `POST /designer/sessions/{sid}/simulate` | `simulation_service.simulate()` 生成 ODE 轨迹并通过 SSE 推送 |
| 方案报告 | `DesignReportPreview.tsx` | `GET /designer/sessions/{sid}/report` / `POST /designer/sessions/{sid}/report/exports/markdown` | 持续生成报告章节并导出 Markdown 快照 |
| Copilot 对话 | `CopilotPanel.tsx` | `POST /designer/sessions/{sid}/copilot` | OpenAI-compatible LLM 生成结构化 action；未配置 key 时使用本地规则兜底 |

每一步支持回滚；回滚会同步清理下游旧选择、候选快照和报告章节。

项目恢复链路是 `Project -> Design -> DesignerSession`：

- 裸 `/designer` 是主入口，不要求用户先创建项目。
- 项目卡片打开 `/projects/:projectId/designer`，后端恢复该项目默认或最新 `Design` 的 `DesignerSession`。
- `DesignerSessionState` 会返回 `project_id`、`design_id`、项目名、方案名、候选快照、仿真结果和报告状态所需字段。
- `DesignReport` 从设计过程开始持续记录，不等六步全部完成后才生成。

## 项目结构

```text
Codon/
├── frontend/                         # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx                   # 路由、鉴权、全局 DNA 背景
│   │   ├── api/                      # auth / projects / designer API 客户端
│   │   ├── auth/                     # 登录态与 token 处理
│   │   ├── components/               # 通用组件与 Designer step 组件
│   │   ├── i18n/                     # zh / en 本地化
│   │   ├── lib/                      # motion、DNA 场景和滚动辅助
│   │   └── views/                    # Home、Projects、Designer、Chat、Analysis、Login
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                          # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/                  # auth、projects、designer、agents、chat
│   │   ├── services/                # 推荐、蛋白、编辑方案、仿真、方案报告、数据库查询、LLM
│   │   ├── models/                  # SQLAlchemy ORM
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── data/                    # 环境、任务、底盘、蛋白知识库 JSON
│   │   ├── main.py                  # FastAPI app 与路由注册
│   │   └── config.py                # Settings 与 CORS 配置
│   ├── alembic/                     # 数据库迁移
│   ├── Dockerfile
│   ├── render-start.sh
│   └── requirements.txt
│
├── render.yaml                       # Render Blueprint
├── docker-compose.yml                # 本地 PostgreSQL / Redis
├── CONTRIBUTING.md                   # 贡献指南
├── NOTICE                            # 第三方资源署名
├── LICENSE                           # MIT License
└── README.md
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19、TypeScript 5.8、Vite 6、React Router 7、Tailwind CSS 4、motion、Three.js、Axios |
| 后端 | Python 3.9+、FastAPI 0.109、SQLAlchemy 2.0、Alembic、Pydantic 2、Uvicorn |
| 认证 | JWT、`python-jose`、bcrypt、HTTP-only cookie / Bearer token |
| 数据与任务 | SQLite / PostgreSQL、Redis、Celery |
| 科学计算 | scipy、Biopython、cobra |
| 外部数据 | UniProt REST、NCBI E-utils、KEGG REST |
| LLM | OpenAI-compatible client，可配置中转 API |
| 部署 | Vercel 前端、Render 后端、Supabase PostgreSQL |

## 快速开始

### 1. 后端

推荐使用 Python 3.12 或项目目标范围内的 Python 3.9+。下面以 `uv` 为例：

```bash
cd backend
uv venv venv --python python3.12
uv pip install -r requirements.txt --python venv/bin/python
cp .env.example .env
venv/bin/python -m uvicorn app.main:app --reload
```

如果不使用 `uv`：

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

后端默认地址：

- Health check: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/api/docs`

### 2. 前端

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

前端默认地址：`http://127.0.0.1:3000`

### 3. Docker 可选

```bash
docker-compose up --build
```

## 环境变量

### 前端

`frontend/.env`：

```bash
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

生产环境必须包含 `/api/v1` 前缀，例如：

```bash
VITE_API_URL=https://<your-backend-domain>/api/v1
```

### 后端

`backend/.env` 最少需要：

```bash
DATABASE_URL=sqlite:///./codon.db
SECRET_KEY=replace-with-a-long-random-secret
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
CORS_ORIGINS=["http://127.0.0.1:3000","http://localhost:3000"]
```

`LLM_API_KEY` 可留空；Copilot 会使用本地规则兜底。生产部署时建议使用 PostgreSQL，并将 `SECRET_KEY`、`LLM_API_KEY`、数据库连接串放在平台环境变量中。

## 验证命令

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd backend && venv/bin/python -c "from app.main import app; print(app.title)"
curl -fsS http://127.0.0.1:8000/health
```

一次最小 Designer API smoke test 应覆盖：

1. 注册 / 登录用户。
2. 获取环境预设：`GET /api/v1/designer/presets/environments`，应返回 11 条。
3. 获取任务预设：`GET /api/v1/designer/presets/missions`，应返回 10 条。
4. 创建 Designer session。
5. 提交环境向量。
6. 提交任务并获取底盘候选。
7. 读取持续方案报告，确认已生成对应章节。
8. 从项目路由恢复 Designer session，确认候选和已选状态不丢失。

## 部署

| 目标 | 推荐平台 | 说明 |
|---|---|---|
| 前端 | Vercel | 设置 `VITE_API_URL=https://<backend>/api/v1` 后重新部署 |
| 后端 | Render | 使用根目录 `render.yaml` Blueprint 或手动 Web Service |
| 数据库 | Supabase PostgreSQL | Render 生产环境使用 Supabase Session Pooler 连接串 |
| CORS | 后端环境变量 | `CORS_ORIGINS=["https://<your-vercel-domain>"]` |

详细步骤见 [backend/RENDER_DEPLOY.md](./backend/RENDER_DEPLOY.md)。

旧 Railway / Sealos 部署文件已从开源树移除；当前推荐生产路径是 Render + Supabase。

## 数据与数据库

| 表 / 数据源 | 说明 |
|---|---|
| `users` | 用户、密码哈希、登录态 |
| `projects` | 用户项目 |
| `designs` | 项目下可命名、可恢复的设计方案 |
| `designer_sessions` | 归属到 Design 的 Designer 六步流程状态与候选快照 |
| `design_reports` | 随 Designer 步骤持续更新的方案文稿 |
| `report_exports` | 方案报告的导出快照记录 |
| `agent_runs` | Legacy agent 编排记录 |
| `project_artifacts` / `project_datasets` / `project_jobs` / `project_view_snapshots` | 项目运行时资源 |
| `gene_modules` / `simulations` / `exports` | 设计与仿真产物 |
| `backend/app/data/*.json` | 环境、任务、底盘、蛋白知识库 |
| `backend/gene_query_cache.db` | UniProt / NCBI / KEGG 查询缓存，TTL 7 天 |

## 文档

- [CONTRIBUTING.md](./CONTRIBUTING.md)：贡献、开发与验证指南
- [SECURITY.md](./SECURITY.md)：安全报告与密钥处理说明
- [backend/RENDER_DEPLOY.md](./backend/RENDER_DEPLOY.md)：Render + Supabase 部署指南
- [NOTICE](./NOTICE)：第三方资源署名
- [LICENSE](./LICENSE)：MIT License

## 许可

本项目代码以 [MIT License](./LICENSE) 开源。第三方视觉资源署名见 [NOTICE](./NOTICE)。

---

## English

[中文](#codon) | **English**

Codon is an AI-assisted synthetic biology design platform that turns extreme-environment microbe design into a guided six-step workflow. It helps users define an environment, choose an ecological mission, rank chassis organisms, select functional proteins, generate gene-editing plans, and run an educational ODE simulation.

The platform is intended for education, research prototyping, and product demonstrations. It combines curated local knowledge bases, real biological database lookups, LLM-generated explanations, and numerical simulation.

> Safety note: Codon produces conceptual designs and simplified simulations. It must not be used directly as wet-lab instructions, environmental release guidance, clinical advice, biosafety approval material, or production deployment evidence.

## Table of Contents

- [Key Capabilities](#key-capabilities)
- [Designer Six-Step Workflow](#designer-six-step-workflow)
- [Project Structure](#project-structure)
- [Technology Stack](#technology-stack)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Verification](#verification)
- [Deployment](#deployment)
- [Data and Database](#data-and-database)
- [Documentation](#documentation)
- [License](#license)

## Key Capabilities

- **Extreme-environment modeling**: 11 built-in presets plus a custom 9-dimensional environment vector.
- **Ecological mission selection**: 10 mission classes, including oxygen and carbon fixation, nitrogen fixation, heavy-metal uptake, radionuclide immobilization, acid neutralization, plastic degradation, oil-spill remediation, organochlorine degradation, phosphate release, and biofilm-based soil stabilization.
- **Explainable chassis recommendation**: Pareto-style ranking based on environmental tolerance, genetic tractability, and mission relevance.
- **Functional protein support**: 46 curated protein records with UniProt, NCBI E-utils, KEGG REST integrations and local SQLite caching.
- **LLM-generated edit plans**: Candidate plans include vectors, promoters, codon optimization notes, metabolic burden, references, and Kill Switch status.
- **ODE simulation**: `scipy.solve_ivp` models population, environment target, and nutrient dynamics, streaming a 200-step trajectory over SSE.
- **Project-backed Designer**: Bare `/designer` can start immediately; the first valid input auto-saves a draft Project / Design / DesignerSession.
- **Live design reports**: Each confirmed step updates a `DesignReport`, with Markdown snapshot export support.
- **Interactive frontend**: React, Three.js DNA particle background, animated routes, project-bound Designer sessions, and bilingual UI.

## Designer Six-Step Workflow

| Step | Frontend Component | Backend Route | Core Logic |
|---|---|---|---|
| 1. Environment | `EnvironmentStep.tsx` | `POST /designer/sessions/{sid}/environment` | 9-dimensional vector; loads 11 environment presets from the backend with local fallback |
| 2. Mission | `MissionStep.tsx` | `POST /designer/sessions/{sid}/mission` | Loads 10 mission presets and returns Top-6 chassis candidates |
| 3. Chassis | `ChassisStep.tsx` | `POST /designer/sessions/{sid}/chassis` | `biotype_service.recommend_chassis()` Pareto ranking |
| 4. Protein | `ProteinStep.tsx` | `POST /designer/sessions/{sid}/protein` | `protein_service.recommend_proteins()` with UniProt/BRENDA links and LLM explanation |
| 5. Edit Plan | `GeneEditStep.tsx` | `POST /designer/sessions/{sid}/edit-plan` | `edit_plan_service.generate_edit_plans()` generates 3-5 candidate plans |
| 6. Simulation | `SimulationStep.tsx` | `POST /designer/sessions/{sid}/simulate` | `simulation_service.simulate()` streams an ODE trajectory over SSE |
| Design Report | `DesignReportPreview.tsx` | `GET /designer/sessions/{sid}/report` / `POST /designer/sessions/{sid}/report/exports/markdown` | Keeps report sections current and exports Markdown snapshots |
| Copilot Chat | `CopilotPanel.tsx` | `POST /designer/sessions/{sid}/copilot` | OpenAI-compatible LLM returns structured actions, with local-rule fallback when no key is configured |

Each step supports rollback. Rollback clears downstream selections, candidate snapshots, and report sections.

The project restore chain is `Project -> Design -> DesignerSession`:

- Bare `/designer` is the primary entry and does not require users to create a project first.
- Project cards open `/projects/:projectId/designer`; the backend restores the default or latest `Design` and its `DesignerSession`.
- `DesignerSessionState` returns `project_id`, `design_id`, project name, design name, candidate snapshots, simulation result, and fields needed by report state.
- `DesignReport` starts during the design process instead of waiting for all six steps to finish.

## Project Structure

```text
Codon/
├── frontend/                         # React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx                   # Routing, auth guard, global DNA background
│   │   ├── api/                      # auth / projects / designer API clients
│   │   ├── auth/                     # Auth state and token handling
│   │   ├── components/               # Shared components and Designer step components
│   │   ├── i18n/                     # zh / en localization
│   │   ├── lib/                      # motion, DNA scenes, scroll helpers
│   │   └── views/                    # Home, Projects, Designer, Chat, Analysis, Login
│   ├── vite.config.ts
│   └── package.json
│
├── backend/                          # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/                  # auth, projects, designer, agents, chat
│   │   ├── services/                # recommendation, proteins, edit plans, simulation, design reports, DB lookup, LLM
│   │   ├── models/                  # SQLAlchemy ORM
│   │   ├── schemas/                 # Pydantic schemas
│   │   ├── data/                    # environment, mission, chassis, protein JSON knowledge bases
│   │   ├── main.py                  # FastAPI app and route registration
│   │   └── config.py                # Settings and CORS
│   ├── alembic/                     # Database migrations
│   ├── Dockerfile
│   ├── render-start.sh
│   └── requirements.txt
│
├── render.yaml                       # Render Blueprint
├── docker-compose.yml                # Local PostgreSQL / Redis
├── CONTRIBUTING.md                   # Contribution guide
├── NOTICE                            # Third-party asset attributions
├── LICENSE                           # MIT License
└── README.md
```

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React 19, TypeScript 5.8, Vite 6, React Router 7, Tailwind CSS 4, motion, Three.js, Axios |
| Backend | Python 3.9+, FastAPI 0.109, SQLAlchemy 2.0, Alembic, Pydantic 2, Uvicorn |
| Auth | JWT, `python-jose`, bcrypt, HTTP-only cookie / Bearer token |
| Data and jobs | SQLite / PostgreSQL, Redis, Celery |
| Scientific computing | scipy, Biopython, cobra |
| External data | UniProt REST, NCBI E-utils, KEGG REST |
| LLM | OpenAI-compatible client with configurable gateway |
| Deployment | Vercel frontend, Render backend, Supabase PostgreSQL |

## Quick Start

### 1. Backend

Python 3.9+ is supported. Python 3.12 is recommended for local development.

```bash
cd backend
uv venv venv --python python3.12
uv pip install -r requirements.txt --python venv/bin/python
cp .env.example .env
venv/bin/python -m uvicorn app.main:app --reload
```

Without `uv`:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Default backend URLs:

- Health check: `http://127.0.0.1:8000/health`
- API docs: `http://127.0.0.1:8000/api/docs`

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Default frontend URL: `http://127.0.0.1:3000`

### 3. Optional Docker

```bash
docker-compose up --build
```

## Environment Variables

### Frontend

`frontend/.env`:

```bash
VITE_API_URL=http://127.0.0.1:8000/api/v1
```

Production values must include the `/api/v1` prefix:

```bash
VITE_API_URL=https://<your-backend-domain>/api/v1
```

### Backend

Minimum `backend/.env`:

```bash
DATABASE_URL=sqlite:///./codon.db
SECRET_KEY=replace-with-a-long-random-secret
LLM_API_KEY=
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o
CORS_ORIGINS=["http://127.0.0.1:3000","http://localhost:3000"]
```

`LLM_API_KEY` can be left empty; the Copilot falls back to local rules. For production, use PostgreSQL and store `SECRET_KEY`, `LLM_API_KEY`, and the database URL in the deployment platform environment.

## Verification

```bash
cd frontend && npm run lint
cd frontend && npm run build
cd backend && venv/bin/python -c "from app.main import app; print(app.title)"
curl -fsS http://127.0.0.1:8000/health
```

A minimal Designer API smoke test should cover:

1. Register / log in a user.
2. Fetch environment presets: `GET /api/v1/designer/presets/environments`, expected count: 11.
3. Fetch mission presets: `GET /api/v1/designer/presets/missions`, expected count: 10.
4. Create a Designer session.
5. Submit an environment vector.
6. Submit a mission and receive chassis candidates.
7. Read the live design report and confirm matching sections exist.
8. Restore the Designer from a project route and confirm candidates and selections persist.

## Deployment

| Target | Recommended Platform | Notes |
|---|---|---|
| Frontend | Vercel | Set `VITE_API_URL=https://<backend>/api/v1` and redeploy |
| Backend | Render | Use the root `render.yaml` Blueprint or create a Web Service manually |
| Database | Supabase PostgreSQL | Use the Supabase Session Pooler URL for Render |
| CORS | Backend environment variable | `CORS_ORIGINS=["https://<your-vercel-domain>"]` |

See [backend/RENDER_DEPLOY.md](./backend/RENDER_DEPLOY.md) for detailed deployment steps.

Legacy Railway and Sealos deployment files have been removed from the open-source tree. The currently recommended production path is Render + Supabase.

## Data and Database

| Table / Source | Description |
|---|---|
| `users` | Users, password hashes, auth state |
| `projects` | User projects |
| `designs` | Named, restorable design variants under projects |
| `designer_sessions` | Design-owned six-step Designer state and candidate snapshots |
| `design_reports` | Live design documents updated as Designer steps complete |
| `report_exports` | Export snapshots for design reports |
| `agent_runs` | Legacy agent orchestration records |
| `project_artifacts` / `project_datasets` / `project_jobs` / `project_view_snapshots` | Project runtime resources |
| `gene_modules` / `simulations` / `exports` | Design and simulation artifacts |
| `backend/app/data/*.json` | Environment, mission, chassis, protein knowledge bases |
| `backend/gene_query_cache.db` | UniProt / NCBI / KEGG query cache, 7-day TTL |

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md): contribution, development, and verification guide
- [SECURITY.md](./SECURITY.md): security reporting and secret-handling notes
- [backend/RENDER_DEPLOY.md](./backend/RENDER_DEPLOY.md): Render + Supabase deployment guide
- [NOTICE](./NOTICE): third-party asset attributions
- [LICENSE](./LICENSE): MIT License

## License

Code is released under the [MIT License](./LICENSE). Third-party visual asset attributions are listed in [NOTICE](./NOTICE).
