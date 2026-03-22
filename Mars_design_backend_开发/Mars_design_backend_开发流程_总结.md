# Mars Design 后端开发流程 - 总结与路线图

## 开发流程总结

### 完整开发周期：3-5 周

---

## 第 1 周：基础架构搭建

### Day 1-2: 项目初始化
- ✅ 创建项目结构
- ✅ 配置 Python 虚拟环境
- ✅ 安装核心依赖 (FastAPI, SQLAlchemy, Celery)
- ✅ 配置 Docker Compose (PostgreSQL + Redis)
- ✅ 编写配置管理 (config.py)

### Day 3-4: 数据库设计
- ✅ 设计 7 张核心表 (users, projects, gene_modules, agent_runs, simulations, designs, exports)
- ✅ 实现 SQLAlchemy 模型
- ✅ 配置 Alembic 迁移
- ✅ 运行初始迁移

### Day 5: 认证系统
- ✅ 实现 JWT 认证
- ✅ 用户注册/登录 API
- ✅ 密码哈希与验证

---

## 第 2 周：Agent 实现

### Day 6-7: Base Agent 与前 3 个 Agent
- ✅ 实现 BaseAgent 抽象类
- ✅ 环境解析 Agent (env-parse)
- ✅ 极端微生物筛选 Agent (extremophile)
- ✅ 基因功能映射 Agent (gene-func)

### Day 8-9: 后 3 个 Agent
- ✅ 回路设计 Agent (circuit-design)
- ✅ 代谢兼容性 Agent (metab-compat)
- ✅ 结构预测 Agent (struct-predict)

### Day 10: Celery 任务编排
- ✅ 配置 Celery
- ✅ 实现 6 个 Agent 的 Celery 任务
- ✅ 实现 DAG 编排逻辑 (chord + chain)

---

## 第 3 周：核心服务

### Day 11-12: Agent 编排服务
- ✅ 实现 AgentOrchestrator
- ✅ DAG 执行流程
- ✅ Redis 状态管理

### Day 13-14: WebSocket 实时通信
- ✅ 实现 ConnectionManager
- ✅ WebSocket 路由
- ✅ Redis PubSub 集成
- ✅ 实时状态推送

### Day 15: 仿真引擎
- ✅ 实现 SimulationEngine
- ✅ FBA 仿真 (COBRApy)
- ✅ 动力学仿真

---

## 第 4 周：导出与 API

### Day 16-17: 导出服务
- ✅ SBOL 格式导出 (python-sbol2)
- ✅ GenBank 格式导出 (BioPython)
- ✅ PDF 报告生成 (WeasyPrint)

### Day 18-19: 完整 API 路由
- ✅ 项目管理 API
- ✅ 基因模块 API
- ✅ Agent 编排 API
- ✅ 仿真管理 API
- ✅ 导出 API

### Day 20: API 文档与测试
- ✅ Swagger/ReDoc 自动生成
- ✅ 编写单元测试
- ✅ 集成测试

---

## 第 5 周：优化与部署

### Day 21-22: 性能优化
- 数据库查询优化
- Redis 缓存策略
- Celery 任务优化

### Day 23-24: 部署配置
- ✅ Dockerfile 编写
- ✅ docker-compose.yml 完善
- 环境变量管理
- 日志配置

### Day 25: 前后端联调
- 前端 API 对接
- WebSocket 连接测试
- 端到端测试

---

## 技术栈总结

### 后端框架
- **FastAPI**: 高性能异步 Web 框架
- **SQLAlchemy**: ORM 数据库操作
- **Alembic**: 数据库迁移工具

### 任务队列
- **Celery**: 分布式任务队列
- **Redis**: 消息代理 + 缓存

### 生物信息学
- **BioPython**: 序列处理与 GenBank 导出
- **COBRApy**: 代谢通量平衡分析
- **python-sbol2**: SBOL 格式支持

### 数据库
- **PostgreSQL**: 主数据库
- **Redis**: 缓存 + PubSub

---

## 关键设计决策

### 1. Agent 编排采用 Celery DAG
**原因**:
- 原生支持任务依赖 (chord, chain)
- 自动重试机制
- 分布式执行

### 2. WebSocket + Redis PubSub
**原因**:
- 实时双向通信
- 多实例支持 (通过 Redis 广播)
- 低延迟状态推送

### 3. PostgreSQL JSONB 存储 Agent 输出
**原因**:
- Agent 输出结构灵活
- 支持 JSON 查询
- 避免频繁 schema 变更

### 4. Python 作为主语言
**原因**:
- 生物信息学生态无可替代
- BioPython, COBRApy, AlphaFold API 原生支持
- 科学计算库丰富 (NumPy, Pandas)

---

## API 端点总览

### 认证
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `GET /api/v1/auth/me` - 获取当前用户

### 项目
- `POST /api/v1/projects/` - 创建项目
- `GET /api/v1/projects/` - 项目列表
- `GET /api/v1/projects/{id}` - 项目详情
- `PUT /api/v1/projects/{id}` - 更新项目
- `DELETE /api/v1/projects/{id}` - 删除项目

### Agent
- `POST /api/v1/agents/orchestrate` - 启动编排
- `GET /api/v1/agents/orchestration/{id}` - 编排状态
- `GET /api/v1/agents/runs/{project_id}` - Agent 执行记录

### 基因模块
- `POST /api/v1/modules/` - 创建模块
- `GET /api/v1/modules/` - 模块列表
- `GET /api/v1/modules/{id}` - 模块详情

### 仿真
- `POST /api/v1/simulations/` - 创建仿真
- `GET /api/v1/simulations/{project_id}` - 仿真列表

### 导出
- `POST /api/v1/exports/sbol` - 导出 SBOL
- `POST /api/v1/exports/genbank` - 导出 GenBank
- `POST /api/v1/exports/pdf` - 导出 PDF

### WebSocket
- `WS /ws/projects/{project_id}` - 实时状态推送

---

## 下一步优化方向

### 短期 (1-2 个月)
1. **Agent 智能化**: 集成真实的 NCBI API、AlphaFold API
2. **缓存优化**: Redis 缓存常用查询结果
3. **监控告警**: Prometheus + Grafana
4. **日志聚合**: ELK Stack

### 中期 (3-6 个月)
1. **服务拆分**: 仿真服务独立部署 (GPU 支持)
2. **多租户支持**: 组织/团队管理
3. **权限系统**: RBAC 细粒度权限控制
4. **审计日志**: 完整操作记录

### 长期 (6-12 个月)
1. **微服务架构**: 完全拆分为方案 C
2. **事件溯源**: NATS JetStream
3. **工作流引擎**: Temporal.io
4. **Kubernetes 部署**: 自动扩缩容

---

## 团队配置建议

### 1-2 人团队 (推荐)
- **全栈工程师 × 1**: 负责后端 + 前端对接
- **生物信息学工程师 × 1**: 负责 Agent 算法优化

### 2-4 人团队 (加速开发)
- **后端工程师 × 2**: 核心服务 + Agent 实现
- **前端工程师 × 1**: React 前端开发
- **DevOps 工程师 × 1**: 部署 + 监控

---

## 成本估算

### 开发成本
- **人力**: 1-2 人 × 3-5 周 = 3-10 人周
- **基础设施**:
  - 开发环境: 本地 Docker (免费)
  - 测试环境: AWS t3.medium × 2 (~$100/月)

### 生产环境 (100-500 并发)
- **计算**:
  - FastAPI 服务: 2 × t3.large (~$150/月)
  - Celery Worker: 4 × t3.medium (~$200/月)
- **数据库**: RDS PostgreSQL db.t3.medium (~$100/月)
- **缓存**: ElastiCache Redis (~$50/月)
- **总计**: ~$500/月

---

## 文档清单

已生成的开发文档：
1. ✅ Part 1: 项目初始化与环境搭建
2. ✅ Part 2: 数据库设计
3. ✅ Part 3: Pydantic Schemas 与认证
4. ✅ Part 4: Agent 实现与 Celery 编排
5. ✅ Part 5: Agent 编排与 WebSocket
6. ✅ Part 6: 仿真引擎与导出服务
7. ✅ Part 7: 完整 API 路由实现
8. ✅ Part 8: 测试与部署
9. ✅ 总结与路线图 (本文档)

---

## 快速启动命令

```bash
# 克隆项目
git clone <repo-url>
cd mars-design-backend

# 安装依赖
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 启动基础设施
docker-compose up -d postgres redis

# 运行迁移
alembic upgrade head

# 启动服务
uvicorn app.main:app --reload &
celery -A celery_app worker --loglevel=info &

# 访问 API 文档
open http://localhost:8000/api/docs
```

---

**方案 B 完整开发流程文档已完成！**
