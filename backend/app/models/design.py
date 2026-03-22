from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

# 多对多关联表
design_modules = Table(
    'design_modules',
    Base.metadata,
    Column('design_id', Integer, ForeignKey('designs.id'), primary_key=True),
    Column('module_id', Integer, ForeignKey('gene_modules.id'), primary_key=True),
    Column('position', Integer),
    Column('orientation', String, default='forward')
)

class Design(Base):
    __tablename__ = "designs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    canvas_data = Column(JSON)
    validation_status = Column(String, default="pending")
    validation_results = Column(JSON)
    version = Column(Integer, default=1)
    parent_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # 关系
    project = relationship("Project", back_populates="designs")
    simulations = relationship("Simulation", back_populates="design")
    exports = relationship("Export", back_populates="design")
