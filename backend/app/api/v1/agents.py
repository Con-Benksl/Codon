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
    # 多用户场景：必须限制为当前用户拥有的项目
    project = (
        db.query(Project)
        .filter(Project.id == request.project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在或无权限访问")

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

    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="项目不存在或无权限访问")

    runs = (
        db.query(AgentRun)
        .filter(AgentRun.project_id == project_id)
        .order_by(AgentRun.created_at.desc(), AgentRun.id.desc())
        .all()
    )
    return runs
