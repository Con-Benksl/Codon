# Codon

**为极端环境，设计一个生命** — 合成生物学 AI 辅助设计平台

Codon 把"为一个极端环境（火星表面、木卫二冰下海洋、切尔诺贝利反应堆……）设计一株能生存并工作的工程微生物"这件事，做成了**一条点选式流水线**：从 9 维环境定义 → 任务选择 → 底盘推荐 → 功能蛋白挑选 → LLM 生成工程化编辑方案 → ODE 动态仿真，只需 **6 步、零打字**，全程有真实生物数据库与可解释 AI 支撑。

---

## 核心特性

- 🌍 **11 个极端环境预设**：火星表面、木卫二冰下海洋、金星 50 km 云层、深海热泉黑烟囱、南极麦克默多干谷、切尔诺贝利反应堆、阿塔卡马沙漠、死海、大洋酸化带等，也支持 9 维自定义
- 🎯 **10 类生态修复任务**：产氧碳固定、土壤固氮、重金属吸收、放射核素固定、酸中和、塑料降解、溢油修复、有机氯降解、磷酸盐释放、生物膜固土
- 🧬 **30 种可工程化底盘 + 46 种功能蛋白**：每条记录附 NCBI Taxonomy ID / UniProt Accession / 文献 DOI，可追溯
- ⚖️ **Pareto 多目标底盘排序**：耐受度（0.5）+ 可工程化等级（0.3）+ 任务相关性（0.2）加权打分
- 🔬 **真实数据库实时查询**：UniProt REST + NCBI E-utils + KEGG REST，SQLite 缓存 TTL 7 天降低延迟
- 🧪 **LLM 真实工程方案生成**：pBBR1MCS-2 / pET28a / pSEVA251 / pHT01 等真实质粒 + J23119 / Plac / PrhaB / T7 等真实启动子 + 密码子优化 + 默认 Kill Switch
- 📈 **ODE 动态仿真**：scipy `solve_ivp` RK45 求解三状态变量耦合方程（种群 N、环境目标 E、限制性养分 S），48 小时 200 步，SSE 实时推送
- 🎨 **Three.js DNA 粒子 + motion 过渡**：为合成生物学主题打造的沉浸式产品体验

---

## 项目结构

```
Mars_design/
├── frontend/                       # React 19 + TypeScript 5.8 + Vite 6
│   └── src/
│       ├── App.tsx                 # 双布局路由（Home / App）
│       ├── views/
│       │   ├── HomeView.tsx        # 产品落地页
│       │   ├── DesignerView.tsx    # 6 步 Designer 主流程
│       │   ├── ProjectsView.tsx    # 项目管理
│       │   ├── ChatView.tsx        # 对话界面
│       │   ├── AnalysisView.tsx    # 分析占位
│       │   ├── LoginView.tsx
│       │   └── designer/
│       │       └── DesignerContext.tsx
│       ├── components/
│       │   ├── DnaParticles.tsx    # Three.js DNA 粒子背景
│       │   ├── AgentShowcase.tsx
│       │   ├── Sidebar.tsx / TopNav.tsx
│       │   └── designer/           # 6 个 Step 组件 + AgentThinking + RollbackButton
│       ├── api/                    # auth / projects / designer / client
│       └── i18n/                   # zh.ts / en.ts 双语
│
├── backend/                        # FastAPI 0.109 + SQLAlchemy 2.0
│   └── app/
│       ├── main.py                 # 路由注册 + CORS
│       ├── config.py               # Settings + CORS_ORIGINS
│       ├── api/v1/
│       │   ├── auth.py             # 注册 / 登录 / JWT
│       │   ├── projects.py
│       │   ├── project_runtime.py
│       │   ├── designer.py         # ⭐ Designer 6-step 主路由
│       │   ├── agents.py           # Legacy 6-Agent 编排入口
│       │   └── chat.py
│       ├── services/
│       │   ├── biotype_service.py          # 底盘 Pareto 排序
│       │   ├── protein_service.py          # 蛋白筛选 + LLM 解释
│       │   ├── edit_plan_service.py        # LLM 工程方案生成
│       │   ├── effect_prediction_service.py
│       │   ├── simulation_service.py       # scipy ODE 仿真
│       │   ├── gene_db_client.py           # UniProt / NCBI / KEGG + SQLite 缓存
│       │   ├── llm_client.py               # OpenAI 兼容中转 API
│       │   ├── auth_service.py
│       │   └── agent_orchestrator.py       # Legacy 6-Agent DAG 编排
│       ├── agents/                 # Legacy BaseAgent × 6
│       ├── models/                 # SQLAlchemy ORM
│       ├── schemas/                # Pydantic schemas
│       ├── tasks/                  # Celery tasks
│       └── data/
│           ├── extreme_environments.json    # 11 个极端环境预设
│           ├── missions.json                # 10 类任务
│           ├── extremophile_chassis.json    # 30 种底盘
│           └── function_proteins.json       # 46 种功能蛋白
│
├── docker-compose.yml              # PostgreSQL 15 + Redis 7
├── CLAUDE.md                       # Claude Code 开发规范
└── rules/                          # 详细架构与部署规范
```

---

## 技术栈

### 前端
- **React 19** + **TypeScript 5.8** + **Vite 6**
- **Tailwind CSS 4**（自定义 `--color-primary: #38bdf8`）
- **motion 12** 动画、**Three.js 0.183** DNA 粒子背景
- **React Router 7** 双布局路由
- **Axios** API 客户端
- 代码分割 + Suspense lazy-loading，ErrorBoundary 全局兜底

### 后端
- **Python 3.9+** + **FastAPI 0.109**
- **SQLAlchemy 2.0** + **Alembic**（开发 SQLite / 生产 PostgreSQL）
- **Pydantic 2.x** 数据校验
- **Celery + Redis** 异步任务
- **python-jose + bcrypt** JWT 认证
- **openai** 客户端（兼容 OpenAI 协议的中转 API）
- **scipy** `solve_ivp` ODE 求解 / **biopython** / **cobra**
- **httpx** 异步 HTTP，连接外部生物数据库

---

## Designer 6 步流程

| 步骤 | 前端组件 | 后端路由 | 核心逻辑 |
|-----|---------|---------|---------|
| 1. 环境定义 | `EnvironmentStep.tsx` | `POST /designer/sessions/{sid}/environment` | 9 维环境向量 + 11 个 Preset |
| 2. 任务选择 | `MissionStep.tsx` | `POST /designer/sessions/{sid}/mission` | 从 10 类任务中选择，返回 Top-6 底盘候选 |
| 3. 底盘筛选 | `ChassisStep.tsx` | `POST /designer/sessions/{sid}/chassis` | `biotype_service.recommend_chassis()` Pareto 排序 |
| 4. 蛋白选择 | `ProteinStep.tsx` | `POST /designer/sessions/{sid}/protein` | `protein_service.recommend_proteins()` + UniProt 描述 + LLM 解释 |
| 5. 编辑方案 | `GeneEditStep.tsx` | `POST /designer/sessions/{sid}/edit-plan` | `edit_plan_service.generate_edit_plans()` LLM 3–5 方案（含真实质粒 / 启动子 / Kill Switch） |
| 6. 动态仿真 | `SimulationStep.tsx` | `POST /designer/sessions/{sid}/simulate` (SSE) | `simulation_service.simulate()` scipy ODE 200 步推流 |

每一步都支持 `RollbackButton` 回滚；`AgentThinking` 在等待时展示 LLM 思考动效。

---

## 快速开始

### 1. 后端

```bash
cd backend
pip install -r requirements.txt

# 创建 .env 并至少配置 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL
# 参考 rules/DEPLOYMENT.md

python -m uvicorn app.main:app --reload
```

API 文档：http://127.0.0.1:8000/api/docs

### 2. 前端

```bash
cd frontend
npm install
npm run dev
```

浏览器打开：http://localhost:3000

### 3. Docker（可选，含 PostgreSQL + Redis）

```bash
docker-compose up --build
```

### 4. 验证命令

```bash
cd frontend && npm run lint            # tsc --noEmit
cd frontend && npm run build           # 生产构建
cd backend  && python -c "from app.main import app"  # 后端导入自检
```

---

## 数据库模型

| 表 | 说明 |
|---|---|
| `users` | 用户（bcrypt 密码 + JWT） |
| `projects` | 项目 + config_json |
| `project_artifacts` / `project_datasets` / `project_jobs` / `project_view_snapshots` | 项目运行时资源 |
| `designer_sessions` | Designer 6-step 会话（environment_json / mission_id / chassis_id / protein_id / edit_plan_json / simulation_result_json / current_step） |
| `agent_runs` | Legacy 6-Agent 执行记录 |
| `gene_modules` / `designs` / `simulations` / `exports` | 项目产物 |

另外有独立的 `backend/gene_query_cache.db`，用于缓存 UniProt / NCBI / KEGG 查询结果（TTL 7 天）。

---

## 部署

| 目标 | 平台 | 配置文件 |
|------|------|---------|
| 前端 | **Vercel** | `VITE_API_URL` 指向生产后端 |
| 后端 | **Railway** | `backend/railway.toml` + `backend/railway-start.sh` + `.env` |
| CORS | 两端对齐 | `backend/app/config.py` 的 `CORS_ORIGINS` + `CORS_ORIGIN_REGEX`（默认放行 `*.vercel.app`） |

---

## 文档

- [CLAUDE.md](./CLAUDE.md) — Claude Code 开发规范与代码地图
- [rules/AGENTS.md](./rules/AGENTS.md) — 代码风格与贡献指南
- [rules/API_TEST_GUIDE.md](./rules/API_TEST_GUIDE.md) — API 手动验证指南
- [rules/DEPLOYMENT.md](./rules/DEPLOYMENT.md) — Vercel + Railway 部署手册
- [rules/FRONTEND_BACKEND_CONNECTION.md](./rules/FRONTEND_BACKEND_CONNECTION.md) — 前后端联调状态
- [rules/PROJECT_STRUCTURE.md](./rules/PROJECT_STRUCTURE.md) — 完整项目结构
- [rules/BACKEND_WORKFLOW_SUMMARY.md](./rules/BACKEND_WORKFLOW_SUMMARY.md) — 后端工作流概览

---

## License

© 2026 Codon. Designed for life in extremes.
