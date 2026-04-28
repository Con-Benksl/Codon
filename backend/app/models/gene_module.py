from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class GeneModule(Base):
    __tablename__ = "gene_modules"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    module_type = Column(String, nullable=False)
    sequence = Column(Text, nullable=False)
    length = Column(Integer)
    description = Column(Text)
    function = Column(String)
    source_organism = Column(String)
    source_database = Column(String)
    external_id = Column(String)
    properties = Column(JSON, default={})
    version = Column(Integer, default=1)
    parent_id = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
