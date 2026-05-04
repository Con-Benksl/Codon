from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, Optional

from sqlalchemy.orm import Session

from app.models.design import Design
from app.models.design_report import DesignReport, ReportExport
from app.models.designer_session import DesignerSession
from app.models.project import Project
from app.models.user import User


SECTION_ORDER = [
    "summary",
    "environment",
    "mission",
    "chassis_candidates",
    "chassis",
    "protein_candidates",
    "protein",
    "edit_plan_candidates",
    "edit_plan",
    "simulation",
    "risks",
    "next_steps",
]

SECTION_TITLES = {
    "summary": "项目摘要",
    "environment": "环境条件与约束",
    "mission": "设计目标与任务定义",
    "chassis_candidates": "底盘候选",
    "chassis": "底盘选择",
    "protein_candidates": "功能蛋白/模块候选",
    "protein": "功能蛋白/模块选择",
    "edit_plan_candidates": "基因编辑方案候选",
    "edit_plan": "基因编辑方案",
    "simulation": "仿真设置与结果",
    "risks": "风险标记",
    "next_steps": "后续实验建议",
}


def ensure_session_draft_assets(
    db: Session,
    session: DesignerSession,
    user: User,
) -> None:
    """Attach a bare Designer session to an auto-created draft project/design."""

    project: Optional[Project] = None
    if session.project_id is not None:
        project = db.query(Project).filter(Project.id == session.project_id).first()

    if project is None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
        project = Project(
            name=f"未命名设计 {timestamp}",
            description="Auto-created draft from Designer.",
            owner_id=user.id,
            status="draft",
            config_json={"auto_created_from": "designer"},
        )
        db.add(project)
        db.flush()
        session.project_id = project.id

    design: Optional[Design] = None
    if session.design_id is not None:
        design = db.query(Design).filter(Design.id == session.design_id).first()

    if design is None:
        design = Design(
            project_id=project.id,
            name=f"{project.name} Design",
            description="Auto-created draft design from Designer.",
        )
        db.add(design)
        db.flush()
        session.design_id = design.id

    db.flush()


def get_report_for_session(
    db: Session,
    session: DesignerSession,
) -> Optional[DesignReport]:
    return (
        db.query(DesignReport)
        .filter(DesignReport.source_session_id == session.id)
        .order_by(DesignReport.version.desc(), DesignReport.id.desc())
        .first()
    )


def update_report_from_session(
    db: Session,
    session: DesignerSession,
    user: User,
) -> DesignReport:
    ensure_session_draft_assets(db, session, user)
    report = get_report_for_session(db, session)
    if report is None:
        report = DesignReport(
            project_id=session.project_id,
            design_id=session.design_id,
            title=_report_title(session),
            status="draft",
            source_session_id=session.id,
            version=1,
            sections_json={},
        )
        db.add(report)
        db.flush()

    report.project_id = session.project_id
    report.design_id = session.design_id
    report.title = _report_title(session)
    report.summary = _summary_text(session)
    report.sections_json = render_sections(session)
    report.status = "complete" if session.simulation_result_json else "draft"
    report.version = (report.version or 1) + 1
    db.flush()
    return report


def render_sections(session: DesignerSession) -> Dict[str, Dict[str, Any]]:
    sections: Dict[str, Dict[str, Any]] = {}
    now = datetime.now(timezone.utc).isoformat()

    summary = _summary_text(session)
    if summary:
        sections["summary"] = _section("summary", 1, summary, now)

    if session.environment_json:
        sections["environment"] = _section(
            "environment",
            1,
            _environment_content(session.environment_json),
            now,
        )

    if session.mission_id:
        sections["mission"] = _section(
            "mission",
            2,
            f"任务 ID：{session.mission_id}",
            now,
        )

    if session.chassis_candidates_json:
        sections["chassis_candidates"] = _section(
            "chassis_candidates",
            2,
            _candidate_list_content(session.chassis_candidates_json),
            now,
        )

    if session.chassis_id:
        sections["chassis"] = _section(
            "chassis",
            3,
            f"已选择底盘：{session.chassis_id}",
            now,
        )

    if session.protein_candidates_json:
        sections["protein_candidates"] = _section(
            "protein_candidates",
            3,
            _candidate_list_content(session.protein_candidates_json),
            now,
        )

    if session.protein_id:
        sections["protein"] = _section(
            "protein",
            4,
            f"已选择功能蛋白/模块：{session.protein_id}",
            now,
        )

    if session.edit_plan_candidates_json:
        sections["edit_plan_candidates"] = _section(
            "edit_plan_candidates",
            4,
            _candidate_list_content(session.edit_plan_candidates_json),
            now,
        )

    if session.edit_plan_json:
        sections["edit_plan"] = _section(
            "edit_plan",
            5,
            _dict_content(session.edit_plan_json),
            now,
        )

    if session.simulation_result_json:
        sections["simulation"] = _section(
            "simulation",
            6,
            _simulation_content(session.simulation_result_json),
            now,
        )
        sections["risks"] = _section(
            "risks",
            6,
            "风险标记待人工复核；当前版本基于结构化 Designer 状态生成。",
            now,
        )
        sections["next_steps"] = _section(
            "next_steps",
            6,
            "建议复核底盘耐受性、编辑载体可行性，并补充实验验证计划。",
            now,
        )

    return {key: sections[key] for key in SECTION_ORDER if key in sections}


def render_markdown(report: DesignReport) -> str:
    lines = [f"# {report.title}", ""]
    if report.summary:
        lines.extend([report.summary, ""])

    sections = report.sections_json or {}
    for key in SECTION_ORDER:
        section = sections.get(key)
        if not section:
            continue
        lines.extend(
            [
                f"## {section.get('title') or SECTION_TITLES.get(key, key)}",
                "",
                str(section.get("content") or ""),
                "",
            ]
        )
    return "\n".join(lines).strip() + "\n"


def create_markdown_export(db: Session, report: DesignReport) -> ReportExport:
    markdown = render_markdown(report)
    filename = f"design-report-{report.id}-v{report.version}.md"
    export = ReportExport(
        report_id=report.id,
        project_id=report.project_id,
        design_id=report.design_id,
        format="markdown",
        status="completed",
        filename=filename,
        content_snapshot=markdown,
        report_version=report.version,
    )
    db.add(export)
    db.flush()
    return export


def _section(section_id: str, source_step: int, content: str, updated_at: str) -> Dict[str, Any]:
    return {
        "title": SECTION_TITLES[section_id],
        "source_step": source_step,
        "content": content,
        "updated_at": updated_at,
    }


def _report_title(session: DesignerSession) -> str:
    if session.mission_id and session.chassis_id:
        return f"{session.mission_id} / {session.chassis_id} 设计报告"
    if session.mission_id:
        return f"{session.mission_id} 设计报告"
    return "未命名设计报告"


def _summary_text(session: DesignerSession) -> str:
    parts = []
    if session.mission_id:
        parts.append(f"任务：{session.mission_id}")
    if session.chassis_id:
        parts.append(f"底盘：{session.chassis_id}")
    if session.protein_id:
        parts.append(f"功能模块：{session.protein_id}")
    return "；".join(parts)


def _environment_content(environment: Dict[str, Any]) -> str:
    labels = {
        "temperature": "temperature",
        "ionizing_radiation": "ionizing_radiation",
        "uv_flux": "uv_flux",
        "pressure": "pressure",
        "ph": "ph",
        "salinity": "salinity",
        "water_activity": "water_activity",
        "oxygen": "oxygen",
        "temp_diurnal_range": "temp_diurnal_range",
    }
    return "\n".join(
        f"- {label}: {environment.get(key)}"
        for key, label in labels.items()
        if key in environment
    )


def _candidate_list_content(raw_candidates: Any) -> str:
    if not isinstance(raw_candidates, list):
        return str(raw_candidates)
    lines = []
    for index, candidate in enumerate(raw_candidates, start=1):
        if isinstance(candidate, dict):
            candidate_id = candidate.get("id") or candidate.get("name") or candidate.get("scientific_name")
            reason = candidate.get("recommendation_reason") or candidate.get("llm_explanation") or ""
            lines.append(f"{index}. {candidate_id}: {reason}".rstrip())
        else:
            lines.append(f"{index}. {candidate}")
    return "\n".join(lines)


def _dict_content(payload: Dict[str, Any]) -> str:
    return "\n".join(f"- {key}: {value}" for key, value in payload.items())


def _simulation_content(payload: Dict[str, Any]) -> str:
    steps = payload.get("steps") if isinstance(payload, dict) else None
    notes = payload.get("notes") if isinstance(payload, dict) else None
    step_count = len(steps) if isinstance(steps, list) else 0
    lines = [f"仿真步数：{step_count}"]
    if notes:
        lines.append(f"说明：{notes}")
    return "\n".join(lines)
