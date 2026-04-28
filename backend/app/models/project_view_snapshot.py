from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectViewSnapshot(Base):
    __tablename__ = "project_view_snapshots"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    view_key = Column(String, nullable=False, index=True)
    schema_version = Column(String, nullable=False)
    dataset_version = Column(Integer, nullable=False)
    generation_status = Column(String, nullable=False, default="completed")
    layout_json = Column(JSON, default=dict)
    bindings_manifest = Column(JSON, default=list)
    resolved_meta = Column(JSON, default=dict)
    created_by_job_id = Column(Integer, ForeignKey("project_jobs.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="view_snapshots")
    source_job = relationship("ProjectJob", back_populates="snapshots_created")
