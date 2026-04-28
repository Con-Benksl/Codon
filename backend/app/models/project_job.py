from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectJob(Base):
    __tablename__ = "project_jobs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    job_type = Column(String, nullable=False)
    status = Column(String, nullable=False, default="queued")
    payload_json = Column(JSON, default=dict)
    result_json = Column(JSON, default=dict)
    events_json = Column(JSON, default=list)
    error_message = Column(Text)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="jobs")
    datasets_created = relationship("ProjectDataset", back_populates="source_job")
    snapshots_created = relationship("ProjectViewSnapshot", back_populates="source_job")
