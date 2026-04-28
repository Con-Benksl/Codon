from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class ProjectDataset(Base):
    __tablename__ = "project_datasets"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    version = Column(Integer, nullable=False)
    status = Column(String, nullable=False, default="pending")
    source_artifact_ids = Column(JSON, default=list)
    canonical_json = Column(JSON, default=dict)
    summary_json = Column(JSON, default=dict)
    created_by_job_id = Column(Integer, ForeignKey("project_jobs.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    project = relationship("Project", back_populates="datasets")
    source_job = relationship("ProjectJob", back_populates="datasets_created")
