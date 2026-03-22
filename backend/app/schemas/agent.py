from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any, List

class AgentRunResponse(BaseModel):
    id: int
    project_id: int
    agent_id: str
    agent_name: str
    status: str
    output_data: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True

class AgentOrchestrationRequest(BaseModel):
    project_id: int
    config: Optional[Dict[str, Any]] = {}
