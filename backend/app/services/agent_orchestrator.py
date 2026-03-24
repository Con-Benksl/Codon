from typing import Any, Dict, List
from sqlalchemy.orm import Session
from datetime import datetime
import asyncio
import logging

from app.models.agent_run import AgentRun
from app.agents.env_parse_agent import EnvParseAgent
from app.agents.extremophile_agent import ExtremophileAgent
from app.agents.gene_func_agent import GeneFuncAgent
from app.agents.circuit_design_agent import CircuitDesignAgent
from app.agents.metab_compat_agent import MetabCompatAgent
from app.agents.struct_predict_agent import StructPredictAgent

logger = logging.getLogger(__name__)

# 两次 LLM 请求之间的间隔（秒），避免触发中转 API 频率限制
AGENT_INTERVAL = 5


class AgentOrchestrator:
    """Agent 编排器 — 串行执行 6 个 Agent，上游输出自动注入下游输入"""

    def __init__(self, db: Session):
        self.db = db

    async def orchestrate(self, project_id: int, config: Dict[str, Any]) -> list:
        """DAG 编排：每个 Agent 的输出会累积到共享上下文中，传给下游 Agent"""
        agents = [
            EnvParseAgent(),
            ExtremophileAgent(),
            GeneFuncAgent(),
            CircuitDesignAgent(),
            MetabCompatAgent(),
            StructPredictAgent(),
        ]

        results = []
        # 共享上下文：累积所有上游 Agent 的输出
        context: Dict[str, Any] = {**config}
        # 累积所有 findings
        all_findings: List[str] = []

        for agent in agents:
            # 将累积的 findings 注入上下文
            context["upstream_findings"] = all_findings.copy()

            # 创建执行记录
            agent_run = AgentRun(
                project_id=project_id,
                agent_id=agent.agent_id,
                agent_name=agent.agent_name,
                status="running",
                input_data=_safe_json(context),
                started_at=datetime.utcnow(),
            )
            self.db.add(agent_run)
            self.db.flush()

            logger.info("执行 Agent: %s (project=%d)", agent.agent_id, project_id)

            # 执行 Agent
            try:
                output = await agent.execute(context)
            except Exception as e:
                logger.error("Agent %s 执行异常: %s", agent.agent_id, e)
                output = {
                    "status": "failed",
                    "error": str(e),
                    "findings": [],
                    "metrics": {},
                }

            # 更新执行记录
            completed_at = datetime.utcnow()
            agent_run.status = output.get("status", "completed")
            agent_run.output_data = output
            agent_run.completed_at = completed_at
            if agent_run.started_at:
                agent_run.duration_seconds = (completed_at - agent_run.started_at).total_seconds()
            agent_run.error_message = output.get("error")
            self.db.commit()

            results.append(agent_run)

            # 将本 Agent 的输出合并到共享上下文（供下游使用）
            _merge_output_to_context(context, output, agent.agent_id)
            all_findings.extend(output.get("findings", []))

            # 如果 Agent 失败，记录但继续执行后续 Agent
            if output.get("status") == "failed":
                logger.warning("Agent %s 失败，继续执行后续 Agent", agent.agent_id)

            # 请求间隔，避免触发中转 API 频率限制
            if agent is not agents[-1]:
                await asyncio.sleep(AGENT_INTERVAL)

        return results


def _merge_output_to_context(context: dict, output: dict, agent_id: str) -> None:
    """将 Agent 输出的关键字段合并到共享上下文"""
    # 每个 Agent 输出的特征字段直接提升到上下文顶层
    passthrough_keys = [
        "constraints", "location",                           # EnvParse
        "candidate_organisms", "recommended_chassis",        # Extremophile
        "gene_clusters", "recommended_gene_cassette",        # GeneFunc
        "logic_gates", "kill_switch",                        # CircuitDesign
        "fba_results", "toxic_intermediates",                # MetabCompat
        "predicted_structures", "overall_assessment",        # StructPredict
    ]
    for key in passthrough_keys:
        if key in output:
            context[key] = output[key]


def _safe_json(data: dict) -> dict:
    """确保数据可序列化为 JSON（截断过大的字段）"""
    import json
    try:
        json.dumps(data, ensure_ascii=False)
        return data
    except (TypeError, ValueError):
        return {"note": "input_data serialization failed"}
