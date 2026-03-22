from typing import Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio

from app.models.agent_run import AgentRun
from app.agents.env_parse_agent import EnvParseAgent
from app.agents.extremophile_agent import ExtremophileAgent
from app.agents.gene_func_agent import GeneFuncAgent
from app.agents.circuit_design_agent import CircuitDesignAgent
from app.agents.metab_compat_agent import MetabCompatAgent
from app.agents.struct_predict_agent import StructPredictAgent

class AgentOrchestrator:
    """Agent 编排器"""

    def __init__(self, db: Session):
        self.db = db

    async def orchestrate(self, project_id: int, config: Dict[str, Any]) -> list:
        """简化版编排：顺序执行6个Agent"""
        agents = [
            EnvParseAgent(),
            ExtremophileAgent(),
            GeneFuncAgent(),
            CircuitDesignAgent(),
            MetabCompatAgent(),
            StructPredictAgent()
        ]

        results = []
        for agent in agents:
            # 创建记录
            agent_run = AgentRun(
                project_id=project_id,
                agent_id=agent.agent_id,
                agent_name=agent.agent_name,
                status="running",
                started_at=datetime.utcnow()
            )
            self.db.add(agent_run)
            self.db.flush()

            # 执行Agent
            output = await agent.execute(config)

            # 更新结果
            agent_run.status = "completed"
            agent_run.output_data = output
            agent_run.completed_at = datetime.utcnow()
            self.db.commit()

            results.append(agent_run)

        return results
