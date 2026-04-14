from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON
from sqlalchemy.sql import func

from app.database import Base


class DesignerSession(Base):
    """Designer 6-step 流程会话（骨架，mock 数据为主）。"""

    __tablename__ = "designer_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)

    current_step = Column(Integer, nullable=False, default=1)

    environment_json = Column(JSON, nullable=True)
    mission_id = Column(String, nullable=True)
    chassis_id = Column(String, nullable=True)
    protein_id = Column(String, nullable=True)
    edit_plan_json = Column(JSON, nullable=True)
    simulation_result_json = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
