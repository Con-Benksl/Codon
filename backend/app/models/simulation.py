from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Simulation(Base):
    __tablename__ = "simulations"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=True)
    name = Column(String, nullable=False)
    simulation_type = Column(String, nullable=False)
    parameters = Column(JSON, nullable=False)
    results = Column(JSON)
    status = Column(String, default="pending")
    celery_task_id = Column(String, unique=True, index=True)
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    duration_seconds = Column(Float)
    error_message = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # 关系
    project = relationship("Project", back_populates="simulations")
    design = relationship("Design", back_populates="simulations")
