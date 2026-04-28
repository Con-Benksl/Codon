from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = {}

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config_json: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class ProjectResponse(ProjectBase):
    id: int
    owner_id: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True
