# Mars Design 后端开发流程 - Part 5: Agent 编排与 WebSocket

## 5.1 Agent 编排服务

### 5.1.1 编排器实现 (app/services/agent_orchestrator.py)

```python
from typing import Dict, Any, List
from celery import chord, chain, group
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.models.agent_run import AgentRun
from app.models.project import Project
from app.tasks.agent_tasks import (
    run_env_parse_agent,
    run_extremophile_agent,
    run_gene_func_agent,
    run_circuit_design_agent,
    run_metab_compat_agent,
    run_struct_predict_agent
)
from app.utils.redis_client import get_redis_client

class AgentOrchestrator:
    """Agent 编排器 - 管理 6 个 Agent 的 DAG 执行流程"""

    def __init__(self, db: Session):
        self.db = db
        self.redis = get_redis_client()

    async def orchestrate(self, project_id: int, config: Dict[str, Any]) -> str:
        """
        编排 Agent 执行流程

        DAG 结构:
        chord([env-parse, extremophile]) → merge
          → gene-func
          → chord([circuit-design, metab-compat]) → merge
            → struct-predict

        Returns:
            orchestration_id: 编排任务ID
        """
        orchestration_id = str(uuid.uuid4())

        # 验证项目存在
        project = self.db.query(Project).filter(Project.id == project_id).first()
        if not project:
            raise ValueError(f"项目 {project_id} 不存在")

        # 阶段 1: 并行执行 env-parse 和 extremophile
        stage1_runs = []

        # 创建 env-parse agent run
        env_run = AgentRun(
            project_id=project_id,
            agent_id="env-parse",
            agent_name="环境解析",
            status="pending",
            input_data={"location": config.get("location", "Jezero Crater")}
        )
        self.db.add(env_run)
        self.db.flush()
        stage1_runs.append(env_run)

        # 创建 extremophile agent run
        ext_run = AgentRun(
            project_id=project_id,
            agent_id="extremophile",
            agent_name="极端微生物",
            status="pending",
            input_data={}
        )
        self.db.add(ext_run)
        self.db.flush()
        stage1_runs.append(ext_run)

        self.db.commit()

        # 构建 Celery workflow
        stage1_tasks = group(
            run_env_parse_agent.s(env_run.id, env_run.input_data),
            run_extremophile_agent.s(ext_run.id, ext_run.input_data)
        )

        # 阶段 2: gene-func (依赖 stage1 结果)
        gene_run = AgentRun(
            project_id=project_id,
            agent_id="gene-func",
            agent_name="基因功能映射",
            status="pending",
            input_data={}
        )
        self.db.add(gene_run)
        self.db.flush()
        self.db.commit()

        # 阶段 3: 并行执行 circuit-design 和 metab-compat
        circuit_run = AgentRun(
            project_id=project_id,
            agent_id="circuit-design",
            agent_name="回路设计",
            status="pending",
            input_data={}
        )
        metab_run = AgentRun(
            project_id=project_id,
            agent_id="metab-compat",
            agent_name="代谢兼容性",
            status="pending",
            input_data={}
        )
        self.db.add(circuit_run)
        self.db.add(metab_run)
        self.db.flush()
        self.db.commit()

        # 阶段 4: struct-predict
        struct_run = AgentRun(
            project_id=project_id,
            agent_id="struct-predict",
            agent_name="结构预测",
            status="pending",
            input_data={}
        )
        self.db.add(struct_run)
        self.db.flush()
        self.db.commit()

        # 构建完整 workflow
        workflow = chain(
            stage1_tasks,
            run_gene_func_agent.s(gene_run.id, {}),
            group(
                run_circuit_design_agent.s(circuit_run.id, {}),
                run_metab_compat_agent.s(metab_run.id, {})
            ),
            run_struct_predict_agent.s(struct_run.id, {})
        )

        # 异步执行
        result = workflow.apply_async()

        # 保存编排信息到 Redis
        orchestration_data = {
            "orchestration_id": orchestration_id,
            "project_id": project_id,
            "celery_task_id": result.id,
            "status": "running",
            "agent_runs": [
                env_run.id, ext_run.id, gene_run.id,
                circuit_run.id, metab_run.id, struct_run.id
            ]
        }
        self.redis.setex(
            f"orchestration:{orchestration_id}",
            3600,  # 1小时过期
            str(orchestration_data)
        )

        return orchestration_id

    async def get_status(self, orchestration_id: str) -> Dict[str, Any]:
        """获取编排状态"""
        data = self.redis.get(f"orchestration:{orchestration_id}")
        if not data:
            raise ValueError(f"编排任务 {orchestration_id} 不存在或已过期")

        orchestration_data = eval(data)
        agent_run_ids = orchestration_data["agent_runs"]

        # 查询所有 agent runs
        agent_runs = self.db.query(AgentRun).filter(
            AgentRun.id.in_(agent_run_ids)
        ).all()

        return {
            "orchestration_id": orchestration_id,
            "status": orchestration_data["status"],
            "agent_runs": [
                {
                    "id": run.id,
                    "agent_id": run.agent_id,
                    "agent_name": run.agent_name,
                    "status": run.status,
                    "started_at": run.started_at,
                    "completed_at": run.completed_at
                }
                for run in agent_runs
            ]
        }
```

---

## 5.2 WebSocket 管理器

### 5.2.1 WebSocket 连接管理 (app/utils/websocket_manager.py)

```python
from typing import Dict, List
from fastapi import WebSocket
import json
import asyncio

class ConnectionManager:
    """WebSocket 连接管理器"""

    def __init__(self):
        # project_id -> List[WebSocket]
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, project_id: int):
        """接受新连接"""
        await websocket.accept()
        if project_id not in self.active_connections:
            self.active_connections[project_id] = []
        self.active_connections[project_id].append(websocket)

    def disconnect(self, websocket: WebSocket, project_id: int):
        """断开连接"""
        if project_id in self.active_connections:
            self.active_connections[project_id].remove(websocket)
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """发送个人消息"""
        await websocket.send_json(message)

    async def broadcast_to_project(self, message: dict, project_id: int):
        """向项目的所有连接广播消息"""
        if project_id in self.active_connections:
            disconnected = []
            for connection in self.active_connections[project_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            # 清理断开的连接
            for conn in disconnected:
                self.disconnect(conn, project_id)

manager = ConnectionManager()
```

---

### 5.2.2 WebSocket 路由 (app/api/websocket.py)

```python
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
import asyncio

from app.database import get_db
from app.utils.websocket_manager import manager
from app.utils.redis_client import get_redis_client

router = APIRouter()

@router.websocket("/projects/{project_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    project_id: int,
    db: Session = Depends(get_db)
):
    """
    WebSocket 端点 - 实时推送 Agent 状态更新

    客户端连接: ws://localhost:8000/ws/projects/{project_id}
    """
    await manager.connect(websocket, project_id)
    redis = get_redis_client()

    try:
        # 发送欢迎消息
        await manager.send_personal_message({
            "type": "connection",
            "message": f"已连接到项目 {project_id}"
        }, websocket)

        # 订阅 Redis PubSub 频道
        pubsub = redis.pubsub()
        pubsub.subscribe(f"project:{project_id}:agents")

        # 监听消息
        while True:
            # 检查 Redis 消息
            message = pubsub.get_message(ignore_subscribe_messages=True)
            if message and message['type'] == 'message':
                data = eval(message['data'])
                await manager.send_personal_message(data, websocket)

            # 检查客户端消息
            try:
                client_data = await asyncio.wait_for(
                    websocket.receive_json(),
                    timeout=0.1
                )
                # 处理客户端消息 (如心跳)
                if client_data.get("type") == "ping":
                    await manager.send_personal_message(
                        {"type": "pong"},
                        websocket
                    )
            except asyncio.TimeoutError:
                pass

            await asyncio.sleep(0.1)

    except WebSocketDisconnect:
        manager.disconnect(websocket, project_id)
        pubsub.unsubscribe()
        pubsub.close()
```

---

## 5.3 Redis 客户端工具

### 5.3.1 Redis 工具 (app/utils/redis_client.py)

```python
import redis
from app.config import get_settings

settings = get_settings()

_redis_client = None

def get_redis_client() -> redis.Redis:
    """获取 Redis 客户端单例"""
    global _redis_client
    if _redis_client is None:
        _redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True
        )
    return _redis_client

async def publish_agent_update(project_id: int, agent_data: dict):
    """发布 Agent 状态更新到 Redis PubSub"""
    redis_client = get_redis_client()
    redis_client.publish(
        f"project:{project_id}:agents",
        str(agent_data)
    )
```

---

## 5.4 Agent API 路由

### 5.4.1 Agent 路由 (app/api/v1/agents.py)

```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.schemas.agent import (
    AgentOrchestrationRequest,
    AgentOrchestrationResponse,
    AgentRunResponse
)
from app.services.auth_service import get_current_active_user
from app.services.agent_orchestrator import AgentOrchestrator
from app.models.agent_run import AgentRun

router = APIRouter()

@router.post("/orchestrate", response_model=dict)
async def orchestrate_agents(
    request: AgentOrchestrationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """启动 Agent 编排流程"""
    orchestrator = AgentOrchestrator(db)
    orchestration_id = await orchestrator.orchestrate(
        request.project_id,
        request.config
    )

    return {
        "orchestration_id": orchestration_id,
        "status": "started",
        "message": "Agent 编排已启动"
    }

@router.get("/orchestration/{orchestration_id}", response_model=dict)
async def get_orchestration_status(
    orchestration_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取编排状态"""
    orchestrator = AgentOrchestrator(db)
    status = await orchestrator.get_status(orchestration_id)
    return status

@router.get("/runs/{project_id}", response_model=List[AgentRunResponse])
async def get_agent_runs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取项目的所有 Agent 执行记录"""
    runs = db.query(AgentRun).filter(
        AgentRun.project_id == project_id
    ).order_by(AgentRun.created_at.desc()).all()

    return runs
```

---

**Part 5 完成**

下一部分将讲解仿真引擎与导出服务。
