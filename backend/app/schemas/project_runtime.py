from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class ProjectArtifactResponse(BaseModel):
    id: int
    project_id: int
    filename: str
    content_type: Optional[str]
    file_ext: str
    size_bytes: int
    parser_type: str
    parse_status: str
    parse_summary_json: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectJobEvent(BaseModel):
    index: int
    stage: str
    message: str
    timestamp: str
    payload: Dict[str, Any] = Field(default_factory=dict)


class ProjectJobResponse(BaseModel):
    id: int
    project_id: int
    job_type: str
    status: str
    payload_json: Dict[str, Any] = Field(default_factory=dict)
    result_json: Dict[str, Any] = Field(default_factory=dict)
    events_json: List[Dict[str, Any]] = Field(default_factory=list)
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectViewResponse(BaseModel):
    snapshot_id: int
    project_id: int
    view_key: str
    schema_version: str
    dataset_version: int
    generation_status: str
    layout: Dict[str, Any]
    bindings_manifest: List[str] = Field(default_factory=list)
    resolved_meta: Dict[str, Any] = Field(default_factory=dict)
    data: Dict[str, Any] = Field(default_factory=dict)


class ViewRegenerateRequest(BaseModel):
    view_keys: List[str] = Field(default_factory=list)


class ArtifactUploadResponse(BaseModel):
    job: ProjectJobResponse
    artifacts: List[ProjectArtifactResponse]
