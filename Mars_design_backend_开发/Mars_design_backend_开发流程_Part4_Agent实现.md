# Mars Design 后端开发流程 - Part 4: Agent 实现与 Celery 编排

## 4.1 Celery 配置

### 4.1.1 Celery 应用配置 (celery_app.py)

```python
from celery import Celery
from app.config import get_settings

settings = get_settings()

celery_app = Celery(
    "mars_design",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks.agent_tasks", "app.tasks.simulation_tasks", "app.tasks.export_tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=3600,  # 1小时超时
    task_soft_time_limit=3300,  # 55分钟软超时
    worker_prefetch_multiplier=1,
    worker_max_tasks_per_child=50,
)

@celery_app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

---

## 4.2 Base Agent 抽象类

### 4.2.1 基础 Agent (app/agents/base_agent.py)

```python
from abc import ABC, abstractmethod
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Agent 基类"""

    def __init__(self, agent_id: str, agent_name: str):
        self.agent_id = agent_id
        self.agent_name = agent_name
        self.logger = logging.getLogger(f"agent.{agent_id}")

    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        执行 Agent 逻辑

        Args:
            input_data: 输入数据

        Returns:
            输出数据字典
        """
        pass

    def validate_input(self, input_data: Dict[str, Any], required_fields: List[str]) -> None:
        """验证输入数据"""
        missing_fields = [field for field in required_fields if field not in input_data]
        if missing_fields:
            raise ValueError(f"缺少必需字段: {', '.join(missing_fields)}")

    def log_progress(self, message: str, level: str = "info"):
        """记录进度日志"""
        log_entry = {
            "time": datetime.utcnow().isoformat(),
            "message": message,
            "level": level
        }
        self.logger.info(f"[{self.agent_id}] {message}")
        return log_entry
```

---

## 4.3 六个 Agent 实现

### 4.3.1 环境解析 Agent (app/agents/env_parse_agent.py)

```python
from typing import Dict, Any
from app.agents.base_agent import BaseAgent

class EnvParseAgent(BaseAgent):
    """环境解析 Agent - 解析火星环境数据"""

    def __init__(self):
        super().__init__("env-parse", "环境解析")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        解析火星环境参数

        输入:
            - location: 火星位置 (如 "Jezero Crater")
            - data_sources: 数据源列表

        输出:
            - constraints: 环境约束参数
            - toxicity_gradient: 毒性梯度
            - thermal_cycles: 热震荡周期
        """
        self.validate_input(input_data, ["location"])

        location = input_data.get("location", "Jezero Crater")

        # 模拟环境数据解析
        constraints = {
            "perchlorate_concentration": {"min": 0.5, "max": 1.0, "unit": "wt%"},
            "temperature_range": {"min": -73, "max": -3, "unit": "°C"},
            "uv_flux": {"value": 3.6, "unit": "W/m²"},
            "co2_pressure": {"value": 0.6, "unit": "kPa"},
            "soil_ph": {"min": 7.5, "max": 8.5},
            "iron_oxide_content": {"value": 18, "unit": "%"}
        }

        findings = [
            f"{location} 高氯酸盐浓度 0.5-1.0 wt%",
            "日温差可达 70°C",
            "表面 UV-C 通量约 3.6 W/m²",
            "土壤含铁氧化物约 18%"
        ]

        return {
            "status": "completed",
            "constraints": constraints,
            "findings": findings,
            "metrics": {
                "datasets_parsed": 2847,
                "constraint_parameters": 186,
                "toxicity_coverage": 0.75
            }
        }
```

---

### 4.3.2 极端微生物筛选 Agent (app/agents/extremophile_agent.py)

```python
from typing import Dict, Any
from app.agents.base_agent import BaseAgent

class ExtremophileAgent(BaseAgent):
    """极端微生物筛选 Agent"""

    def __init__(self):
        super().__init__("extremophile", "极端微生物")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        筛选耐受极端环境的微生物底盘

        输入:
            - constraints: 环境约束 (来自 env-parse)
            - tolerance_requirements: 耐受性要求

        输出:
            - candidate_organisms: 候选生物列表
            - screening_confidence: 筛选置信度
        """
        self.validate_input(input_data, ["constraints"])

        constraints = input_data["constraints"]

        # 模拟微生物筛选
        candidates = [
            {
                "name": "Deinococcus radiodurans R1",
                "radiation_tolerance": "5000 Gy",
                "key_features": ["DNA修复", "Mn(II)抗氧化"],
                "score": 0.97
            },
            {
                "name": "Chroococcidiopsis sp.",
                "desiccation_tolerance": "4 years",
                "key_features": ["光合作用", "UV耐受"],
                "score": 0.89
            }
        ]

        findings = [
            "D. radiodurans 可耐受 5,000 Gy 辐照",
            "推荐双菌共生系统: D. radiodurans × Synechocystis PCC 6803"
        ]

        return {
            "status": "completed",
            "candidate_organisms": candidates,
            "screening_confidence": 0.947,
            "findings": findings,
            "metrics": {
                "candidates_count": 34,
                "genome_coverage": 0.982
            }
        }
```

---

### 4.3.3 基因功能映射 Agent (app/agents/gene_func_agent.py)

```python
from typing import Dict, Any
from app.agents.base_agent import BaseAgent

class GeneFuncAgent(BaseAgent):
    """基因功能映射 Agent"""

    def __init__(self):
        super().__init__("gene-func", "基因功能映射")

    async def execute(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        映射功能基因与操纵子

        输入:
            - candidate_organisms: 候选生物 (来自 extremophile)
            - target_functions: 目标功能列表

        输出:
            - gene_clusters: 基因簇映射
            - operons: 操纵子网络
        """
        self.validate_input(input_data, ["candidate_organisms"])

        # 模拟基因功能映射
        gene_clusters = [
            {
                "name": "pcrABCD",
                "function": "高氯酸盐还原",
                "genes": ["pcrA", "pcrB", "pcrC", "pcrD"],
                "source": "Dechloromonas aromatica"
            },
            {
                "name": "crtBIYEP",
                "function": "类胡萝卜素合成",
                "genes": ["crtB", "crtI", "crtY", "crtE", "crtP"],
                "source": "Pantoea ananatis"
            },
            {
                "name": "nifHDK",
                "function": "固氮",
                "genes": ["nifH", "nifD", "nifK"],
                "source": "Azotobacter vinelandii"
            }
        ]

        findings = [
            "pcrABCD 操纵子可水平转移",
            "crtBIYEP 提供 UV-B/C 防护",
            "建议模块化基因盒: [pcrABCD]-[crtBIYEP]-[cspA]-[recA]"
        ]

        return {
            "status": "completed",
            "gene_clusters": gene_clusters,
            "findings": findings,
            "metrics": {
                "mapped_clusters": 428,
                "annotation_rate": 0.92,
                "operon_networks": 67
            }
        }
```

---

## 4.4 Celery 任务定义

### 4.4.1 Agent 任务 (app/tasks/agent_tasks.py)

```python
from celery import chord, chain
from celery_app import celery_app
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import SessionLocal
from app.models.agent_run import AgentRun
from app.agents.env_parse_agent import EnvParseAgent
from app.agents.extremophile_agent import ExtremophileAgent
from app.agents.gene_func_agent import GeneFuncAgent
# ... 导入其他 agents

@celery_app.task(bind=True)
def run_env_parse_agent(self, agent_run_id: int, input_data: dict):
    """执行环境解析 Agent"""
    db = SessionLocal()
    try:
        agent_run = db.query(AgentRun).filter(AgentRun.id == agent_run_id).first()
        agent_run.status = "running"
        agent_run.started_at = datetime.utcnow()
        db.commit()

        # 执行 Agent
        agent = EnvParseAgent()
        import asyncio
        output = asyncio.run(agent.execute(input_data))

        # 更新结果
        agent_run.status = "completed"
        agent_run.output_data = output
        agent_run.completed_at = datetime.utcnow()
        agent_run.duration_seconds = (agent_run.completed_at - agent_run.started_at).total_seconds()
        db.commit()

        return output

    except Exception as e:
        agent_run.status = "failed"
        agent_run.error_message = str(e)
        db.commit()
        raise
    finally:
        db.close()

@celery_app.task(bind=True)
def run_extremophile_agent(self, agent_run_id: int, input_data: dict):
    """执行极端微生物筛选 Agent"""
    # 类似实现...
    pass

# ... 其他 agent 任务
```

---

**Part 4 完成**

下一部分将讲解 Agent 编排流程与 WebSocket 实时推送。
