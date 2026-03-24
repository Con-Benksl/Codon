from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.schemas.agent import AgentOrchestrationRequest, AgentRunResponse
from app.services.auth_service import get_current_active_user
from app.services.agent_orchestrator import AgentOrchestrator

router = APIRouter()

@router.post("/orchestrate")
async def orchestrate_agents(
    request: AgentOrchestrationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """启动 Agent 编排"""
    # 确保项目存在，不存在则自动创建
    project = db.query(Project).filter(Project.id == request.project_id).first()
    if not project:
        project = Project(
            name="Mars Biolab Design",
            description="Auto-created for agent orchestration",
            owner_id=current_user.id,
            status="active",
        )
        db.add(project)
        db.commit()
        db.refresh(project)

    orchestrator = AgentOrchestrator(db)
    results = await orchestrator.orchestrate(project.id, request.config or {})

    return {
        "status": "completed",
        "project_id": project.id,
        "agent_runs": [
            {
                "id": r.id,
                "agent_id": r.agent_id,
                "agent_name": r.agent_name,
                "status": r.status,
            }
            for r in results
        ]
    }

@router.get("/runs/{project_id}", response_model=List[AgentRunResponse])
async def get_agent_runs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取项目的 Agent 执行记录"""
    from app.models.agent_run import AgentRun
    runs = db.query(AgentRun).filter(AgentRun.project_id == project_id).all()
    return runs
