from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class DesignReport(Base):
    __tablename__ = "design_reports"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False, index=True)
    title = Column(String, nullable=False)
    status = Column(String, nullable=False, default="draft")
    summary = Column(Text)
    sections_json = Column(JSON, nullable=False, default=dict)
    user_edits_json = Column(JSON, nullable=True)
    source_session_id = Column(
        Integer,
        ForeignKey("designer_sessions.id"),
        nullable=False,
        index=True,
    )
    version = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="design_reports")
    design = relationship("Design", back_populates="design_reports")
    source_session = relationship("DesignerSession", back_populates="design_reports")
    exports = relationship(
        "ReportExport",
        back_populates="report",
        cascade="all, delete-orphan",
    )


class ReportExport(Base):
    __tablename__ = "report_exports"

    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("design_reports.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False, index=True)
    design_id = Column(Integer, ForeignKey("designs.id"), nullable=False, index=True)
    format = Column(String, nullable=False)
    status = Column(String, nullable=False, default="pending")
    filename = Column(String, nullable=False)
    file_path_or_url = Column(Text, nullable=True)
    content_snapshot = Column(Text, nullable=False)
    report_version = Column(Integer, nullable=False, default=1)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    report = relationship("DesignReport", back_populates="exports")
