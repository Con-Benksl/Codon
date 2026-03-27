# Mars Design 项目结构说明

## 目录结构

```
Mars_design/
├── frontend/                           # 前端应用
│   ├── src/
│   │   ├── components/                # UI 组件
│   │   │   ├── AmbientGlow.tsx
│   │   │   ├── AnalysisCard.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── DesignCard.tsx
│   │   │   └── ...
│   │   ├── views/                     # 页面视图
│   │   │   ├── OrchestratorView.tsx
│   │   │   ├── EnvironmentView.tsx
│   │   │   ├── SynthesisView.tsx
│   │   │   ├── SimulationView.tsx
│   │   │   └── OutputView.tsx
│   │   ├── data/                      # Mock 数据
│   │   │   └── agentDetails.ts
│   │   ├── lib/                       # 工具库
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                            # 后端应用
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI 入口
│   │   ├── config.py                  # 配置管理
│   │   ├── database.py                # 数据库连接
│   │   │
│   │   ├── models/                    # SQLAlchemy 模型
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   ├── gene_module.py
│   │   │   ├── agent_run.py
│   │   │   ├── simulation.py
│   │   │   └── design.py
│   │   │
│   │   ├── schemas/                   # Pydantic schemas
│   │   │   ├── user.py
│   │   │   ├── project.py
│   │   │   └── agent.py
│   │   │
│   │   ├── api/v1/                    # API 路由
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   ├── agents.py
│   │   │   └── simulations.py
│   │   │
│   │   ├── services/                  # 业务逻辑
│   │   │   ├── auth_service.py
│   │   │   ├── agent_orchestrator.py
│   │   │   └── simulation_engine.py
│   │   │
│   │   ├── agents/                    # 6个 Agent
│   │   │   ├── base_agent.py
│   │   │   ├── env_parse_agent.py
│   │   │   ├── extremophile_agent.py
│   │   │   ├── gene_func_agent.py
│   │   │   ├── circuit_design_agent.py
│   │   │   ├── metab_compat_agent.py
│   │   │   └── struct_predict_agent.py
│   │   │
│   │   └── tasks/                     # Celery 任务
│   │       └── agent_tasks.py
│   │
│   ├── requirements.txt
│   └── .env.example
│
├── docker-compose.yml                  # Docker 编排
└── README.md                          # 项目说明
```

## 下一步

按照 `Mars_design_backend_开发流程_Part1-8.md` 文档逐步实现后端功能。
