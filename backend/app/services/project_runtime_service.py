from __future__ import annotations

import csv
import json
import re
import uuid
import zipfile
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Sequence
from xml.etree import ElementTree

from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import SessionLocal
from app.models.agent_run import AgentRun
from app.models.project import Project
from app.models.project_artifact import ProjectArtifact
from app.models.project_dataset import ProjectDataset
from app.models.project_job import ProjectJob
from app.models.project_view_snapshot import ProjectViewSnapshot

settings = get_settings()

VIEW_KEYS = [
    "orchestrator",
    "environment",
    "synthesis",
    "simulation",
    "output",
    "diagnostics",
]
TERMINAL_JOB_STATUSES = {"completed", "failed"}
SUPPORTED_BLOCK_TYPES = {
    "metric_grid",
    "status_banner",
    "constraint_list",
    "entity_table",
    "timeline",
    "chart_line",
    "chart_bar",
    "agent_pipeline",
    "record_list",
    "detail_panel",
    "cta_group",
    "text_block",
}


def utcnow() -> datetime:
    return datetime.utcnow()


def get_artifact_storage_root() -> Path:
    root = Path(settings.ARTIFACT_STORAGE_DIR)
    if not root.is_absolute():
        root = Path(__file__).resolve().parents[2] / root
    root.mkdir(parents=True, exist_ok=True)
    return root


def get_project_storage_dir(project_id: int) -> Path:
    path = get_artifact_storage_root() / str(project_id)
    path.mkdir(parents=True, exist_ok=True)
    return path


def create_project_job(
    db: Session,
    *,
    project_id: int,
    created_by: int,
    job_type: str,
    payload_json: Optional[Dict[str, Any]] = None,
) -> ProjectJob:
    job = ProjectJob(
        project_id=project_id,
        created_by=created_by,
        job_type=job_type,
        payload_json=payload_json or {},
        result_json={},
        events_json=[],
    )
    db.add(job)
    db.flush()
    append_job_event(db, job, "queued", f"{job_type} queued")
    return job


def append_job_event(
    db: Session,
    job: ProjectJob,
    stage: str,
    message: str,
    payload: Optional[Dict[str, Any]] = None,
) -> None:
    events = list(job.events_json or [])
    events.append(
        {
            "index": len(events),
            "stage": stage,
            "message": message,
            "timestamp": utcnow().isoformat() + "Z",
            "payload": payload or {},
        }
    )
    job.events_json = events
    job.updated_at = utcnow()
    db.add(job)
    db.commit()
    db.refresh(job)


def set_job_status(
    db: Session,
    job: ProjectJob,
    *,
    status: str,
    error_message: Optional[str] = None,
    result_json: Optional[Dict[str, Any]] = None,
) -> None:
    if job.started_at is None and status != "queued":
        job.started_at = utcnow()
    job.status = status
    if error_message is not None:
        job.error_message = error_message
    if result_json is not None:
        job.result_json = result_json
    if status in TERMINAL_JOB_STATUSES:
        job.completed_at = utcnow()
    job.updated_at = utcnow()
    db.add(job)
    db.commit()
    db.refresh(job)


def ensure_project_access(db: Session, project_id: int, owner_id: int) -> Project:
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == owner_id)
        .first()
    )
    if not project:
        raise ValueError("project not found")
    return project


def update_project_runtime_config(db: Session, project: Project, **updates: Any) -> None:
    config = dict(project.config_json or {})
    runtime = dict(config.get("runtime") or {})
    runtime.update(updates)
    config["runtime"] = runtime
    project.config_json = config
    db.add(project)
    db.commit()
    db.refresh(project)


def save_artifact_bytes(project_id: int, filename: str, raw_bytes: bytes) -> str:
    ext = Path(filename).suffix.lower() or ".bin"
    safe_name = f"{uuid.uuid4().hex}{ext}"
    destination = get_project_storage_dir(project_id) / safe_name
    destination.write_bytes(raw_bytes)
    return str(destination)


def guess_parser_type(filename: str) -> str:
    ext = Path(filename).suffix.lower()
    if ext == ".json":
        return "json"
    if ext == ".csv":
        return "csv"
    if ext in {".xlsx", ".xls"}:
        return "excel"
    if ext == ".pdf":
        return "pdf"
    if ext in {".docx", ".doc"}:
        return "word"
    if ext in {".txt", ".md"}:
        return "text"
    return "binary"


def build_empty_dataset(project: Project, version: int) -> Dict[str, Any]:
    return {
        "schema_version": settings.VIEW_SCHEMA_VERSION,
        "dataset_version": version,
        "project": {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
        },
        "environment": {
            "constraints": [],
            "locations": [],
            "measurements": [],
            "sources": [],
            "notes": [],
        },
        "organisms": [],
        "genes": [],
        "pathways": [],
        "simulations": {
            "parameters": [],
            "species": [],
            "runs": [],
        },
        "outputs": {
            "exports": [],
            "traceability": [],
            "bioprint_queue": [],
        },
        "diagnostics": {
            "status_cards": [],
            "sensors": [],
            "pipeline": [],
            "logs": [],
        },
        "references": [],
        "raw_summaries": [],
        "ui_hints": {
            "preferred_view": "orchestrator",
            "active_location": "Jezero Crater",
        },
        "derived_metrics": {},
    }


def get_latest_dataset(db: Session, project_id: int) -> Optional[ProjectDataset]:
    return (
        db.query(ProjectDataset)
        .filter(ProjectDataset.project_id == project_id)
        .order_by(ProjectDataset.version.desc(), ProjectDataset.id.desc())
        .first()
    )


def ensure_latest_dataset(db: Session, project: Project) -> ProjectDataset:
    dataset = get_latest_dataset(db, project.id)
    if dataset:
        return dataset

    dataset = ProjectDataset(
        project_id=project.id,
        version=1,
        status="completed",
        source_artifact_ids=[],
        canonical_json=build_empty_dataset(project, 1),
        summary_json={"artifacts": 0, "notes": ["Bootstrapped project dataset"]},
    )
    db.add(dataset)
    db.commit()
    db.refresh(dataset)
    update_project_runtime_config(db, project, active_dataset_version=dataset.version)
    return dataset


def parse_artifact(artifact: ProjectArtifact) -> Dict[str, Any]:
    path = Path(artifact.storage_path)
    parser_type = artifact.parser_type or guess_parser_type(artifact.filename)
    ext = artifact.file_ext.lower()

    if parser_type == "json":
        structured = json.loads(path.read_text(encoding="utf-8"))
        return {
            "parser_type": "json",
            "parse_status": "completed",
            "structured_json": structured,
            "extracted_text": json.dumps(structured, ensure_ascii=False, indent=2),
            "parse_summary_json": {
                "kind": "json",
                "top_level_keys": list(structured.keys()) if isinstance(structured, dict) else [],
            },
        }

    if parser_type == "csv":
        rows = list(csv.DictReader(path.read_text(encoding="utf-8-sig").splitlines()))
        columns = list(rows[0].keys()) if rows else []
        return {
            "parser_type": "csv",
            "parse_status": "completed",
            "structured_json": {"rows": rows, "columns": columns},
            "extracted_text": "\n".join(
                [",".join(columns)] + [",".join(str(row.get(column, "")) for column in columns) for row in rows[:20]]
            ) if columns else "",
            "parse_summary_json": {
                "kind": "table",
                "rows": len(rows),
                "columns": columns,
            },
        }

    if parser_type == "excel":
        structured = parse_excel_file(path, ext)
        return {
            "parser_type": "excel",
            "parse_status": "completed",
            "structured_json": structured,
            "extracted_text": json.dumps(structured.get("sheets", []), ensure_ascii=False)[:4000],
            "parse_summary_json": {
                "kind": "excel",
                "sheet_count": len(structured.get("sheets", [])),
                "rows": sum(len(sheet.get("rows", [])) for sheet in structured.get("sheets", [])),
            },
        }

    if parser_type == "word":
        text = parse_word_file(path, ext)
        return {
            "parser_type": "word",
            "parse_status": "completed",
            "structured_json": {"text": text},
            "extracted_text": text,
            "parse_summary_json": {"kind": "document", "characters": len(text)},
        }

    if parser_type == "pdf":
        text = parse_pdf_file(path)
        status = "completed" if text else "needs_review"
        return {
            "parser_type": "pdf",
            "parse_status": status,
            "structured_json": {"text": text},
            "extracted_text": text,
            "parse_summary_json": {
                "kind": "pdf",
                "characters": len(text),
                "confidence": 0.8 if text else 0.2,
            },
        }

    if parser_type == "text":
        text = path.read_text(encoding="utf-8", errors="ignore")
        return {
            "parser_type": "text",
            "parse_status": "completed",
            "structured_json": {"text": text},
            "extracted_text": text,
            "parse_summary_json": {"kind": "text", "characters": len(text)},
        }

    return {
        "parser_type": parser_type,
        "parse_status": "needs_review",
        "structured_json": {},
        "extracted_text": "",
        "parse_summary_json": {"kind": "binary", "message": f"Unsupported format: {ext or 'unknown'}"},
    }


def parse_excel_file(path: Path, ext: str) -> Dict[str, Any]:
    if ext == ".xls":
        text = path.read_bytes().decode("latin-1", errors="ignore")
        return {
            "sheets": [
                {
                    "name": "Sheet1",
                    "rows": [{"text": line.strip()} for line in text.splitlines() if line.strip()][:200],
                }
            ]
        }

    with zipfile.ZipFile(path) as archive:
        shared_strings = parse_xlsx_shared_strings(archive)
        workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
        namespace = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
        sheets: List[Dict[str, Any]] = []
        for index, sheet in enumerate(workbook.findall("a:sheets/a:sheet", namespace), start=1):
            name = sheet.attrib.get("name", f"Sheet{index}")
            sheet_path = f"xl/worksheets/sheet{index}.xml"
            if sheet_path not in archive.namelist():
                continue
            rows = parse_xlsx_sheet_rows(archive.read(sheet_path), shared_strings)
            sheets.append({"name": name, "rows": rows})
        return {"sheets": sheets}


def parse_xlsx_shared_strings(archive: zipfile.ZipFile) -> List[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    namespace = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    values: List[str] = []
    for item in root.findall("a:si", namespace):
        texts = [node.text or "" for node in item.findall(".//a:t", namespace)]
        values.append("".join(texts))
    return values


def parse_xlsx_sheet_rows(xml_bytes: bytes, shared_strings: Sequence[str]) -> List[Dict[str, Any]]:
    root = ElementTree.fromstring(xml_bytes)
    namespace = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    raw_rows: List[List[str]] = []
    for row in root.findall(".//a:sheetData/a:row", namespace):
        row_values: List[str] = []
        for cell in row.findall("a:c", namespace):
            cell_type = cell.attrib.get("t")
            value_node = cell.find("a:v", namespace)
            raw_value = value_node.text if value_node is not None and value_node.text else ""
            if cell_type == "s" and raw_value.isdigit():
                idx = int(raw_value)
                row_values.append(shared_strings[idx] if idx < len(shared_strings) else "")
            else:
                row_values.append(raw_value)
        raw_rows.append(row_values)

    if not raw_rows:
        return []
    header = raw_rows[0]
    data_rows: List[Dict[str, Any]] = []
    for row in raw_rows[1:]:
        padded = list(row) + [""] * max(0, len(header) - len(row))
        data_rows.append({header[idx] or f"column_{idx+1}": padded[idx] for idx in range(len(header))})
    return data_rows


def parse_word_file(path: Path, ext: str) -> str:
    if ext == ".doc":
        return path.read_bytes().decode("latin-1", errors="ignore")
    with zipfile.ZipFile(path) as archive:
        content = archive.read("word/document.xml")
    root = ElementTree.fromstring(content)
    texts = [node.text or "" for node in root.iter() if node.tag.endswith("}t")]
    return " ".join(part.strip() for part in texts if part and part.strip())


def parse_pdf_file(path: Path) -> str:
    raw = path.read_bytes().decode("latin-1", errors="ignore")
    literal_strings = re.findall(r"\(([^()]*)\)", raw)
    chunks = [chunk.strip() for chunk in literal_strings if len(chunk.strip()) > 2]
    text = " ".join(chunks)
    if text:
        return text
    plain_chunks = re.findall(r"[A-Za-z0-9][A-Za-z0-9 ,.;:_/\-\(\)]{10,}", raw)
    return " ".join(plain_chunks[:200])


def merge_dataset_payload(dataset: Dict[str, Any], artifact: ProjectArtifact) -> Dict[str, Any]:
    merged = deepcopy(dataset)
    structured = artifact.structured_json or {}
    merged["raw_summaries"] = list(merged.get("raw_summaries") or [])
    merged["raw_summaries"].append(
        {
            "artifact_id": artifact.id,
            "filename": artifact.filename,
            "parser_type": artifact.parser_type,
            "parse_status": artifact.parse_status,
        }
    )
    merged["references"] = list(merged.get("references") or [])
    merged["references"].append(
        {
            "label": artifact.filename,
            "type": artifact.parser_type,
            "artifact_id": artifact.id,
        }
    )

    if artifact.parser_type in {"json", "csv", "excel"}:
        rows = extract_rows(structured)
        integrate_structured_payload(merged, artifact.filename, structured, rows)
    elif artifact.extracted_text:
        integrate_text_payload(merged, artifact.filename, artifact.extracted_text)

    merged["derived_metrics"] = build_derived_metrics(merged)
    return merged


def extract_rows(structured: Dict[str, Any]) -> List[Dict[str, Any]]:
    if isinstance(structured, dict) and "rows" in structured and isinstance(structured.get("rows"), list):
        return [row for row in structured.get("rows", []) if isinstance(row, dict)]
    if isinstance(structured, dict) and isinstance(structured.get("sheets"), list):
        rows: List[Dict[str, Any]] = []
        for sheet in structured.get("sheets", []):
            rows.extend([row for row in sheet.get("rows", []) if isinstance(row, dict)])
        return rows
    return []


def integrate_structured_payload(
    dataset: Dict[str, Any],
    filename: str,
    structured: Dict[str, Any],
    rows: List[Dict[str, Any]],
) -> None:
    if isinstance(structured, dict):
        for key in ("environment", "organisms", "genes", "pathways", "simulations", "outputs", "diagnostics", "references"):
            if key in structured:
                dataset[key] = merge_values(dataset.get(key), structured[key])

    if not rows:
        return

    bucket = infer_bucket(filename, rows)
    if bucket == "constraints":
        environment = dict(dataset.get("environment") or {})
        constraints = list(environment.get("constraints") or [])
        for row in rows:
            label = first_value(row, ("name", "label", "constraint", "metric")) or "Constraint"
            constraints.append(
                {
                    "label": label,
                    "value": first_value(row, ("value", "amount", "score", "range")) or "",
                    "unit": first_value(row, ("unit",)),
                    "source": filename,
                }
            )
        environment["constraints"] = constraints
        dataset["environment"] = environment
        return

    if bucket == "organisms":
        organisms = list(dataset.get("organisms") or [])
        for row in rows:
            organisms.append(
                {
                    "name": first_value(row, ("name", "organism", "species")) or "Unknown organism",
                    "score": to_number(first_value(row, ("score", "survival", "fitness", "confidence"))),
                    "traits": stringify_dict(row),
                    "source": filename,
                }
            )
        dataset["organisms"] = organisms
        return

    if bucket == "genes":
        genes = list(dataset.get("genes") or [])
        for row in rows:
            genes.append(
                {
                    "name": first_value(row, ("name", "gene", "module")) or "Gene module",
                    "function": first_value(row, ("function", "description", "target")) or "",
                    "score": to_number(first_value(row, ("score", "expression", "confidence"))),
                    "source": filename,
                }
            )
        dataset["genes"] = genes
        return

    if bucket == "simulation":
        simulations = dict(dataset.get("simulations") or {})
        species = list(simulations.get("species") or [])
        for row in rows:
            species.append(
                {
                    "name": first_value(row, ("name", "species", "organism")) or "Simulation entity",
                    "survival": to_number(first_value(row, ("survival", "score", "value"))),
                    "traits": stringify_dict(row),
                }
            )
        simulations["species"] = species
        dataset["simulations"] = simulations
        return

    environment = dict(dataset.get("environment") or {})
    measurements = list(environment.get("measurements") or [])
    for row in rows:
        measurements.append({"source": filename, "values": row})
    environment["measurements"] = measurements
    dataset["environment"] = environment


def integrate_text_payload(dataset: Dict[str, Any], filename: str, text: str) -> None:
    lines = [line.strip(" -\t") for line in text.splitlines() if line.strip()]
    environment = dict(dataset.get("environment") or {})
    notes = list(environment.get("notes") or [])
    notes.extend(lines[:12])
    environment["notes"] = notes
    environment["sources"] = list(environment.get("sources") or [])
    environment["sources"].append({"label": filename, "type": "document"})
    dataset["environment"] = environment


def infer_bucket(filename: str, rows: Sequence[Dict[str, Any]]) -> str:
    filename_l = filename.lower()
    if any(token in filename_l for token in ("gene", "cassette", "pathway", "module")):
        return "genes"
    if any(token in filename_l for token in ("organism", "microbe", "species", "strain")):
        return "organisms"
    if any(token in filename_l for token in ("sim", "survival", "fitness")):
        return "simulation"
    keys = {str(key).lower() for row in rows[:5] for key in row.keys()}
    if {"gene", "module", "function"} & keys:
        return "genes"
    if {"species", "organism", "strain"} & keys:
        return "organisms"
    if {"survival", "fitness"} & keys:
        return "simulation"
    if {"constraint", "unit", "metric"} & keys:
        return "constraints"
    return "measurements"


def merge_values(existing: Any, incoming: Any) -> Any:
    if existing is None:
        return deepcopy(incoming)
    if isinstance(existing, dict) and isinstance(incoming, dict):
        merged = deepcopy(existing)
        for key, value in incoming.items():
            merged[key] = merge_values(merged.get(key), value)
        return merged
    if isinstance(existing, list) and isinstance(incoming, list):
        return list(existing) + list(incoming)
    return deepcopy(incoming)


def build_derived_metrics(dataset: Dict[str, Any]) -> Dict[str, Any]:
    constraints = dataset.get("environment", {}).get("constraints", [])
    organisms = dataset.get("organisms", [])
    genes = dataset.get("genes", [])
    species = dataset.get("simulations", {}).get("species", [])
    scores = [item.get("score") for item in organisms if isinstance(item.get("score"), (int, float))]
    survival_scores = [item.get("survival") for item in species if isinstance(item.get("survival"), (int, float))]
    return {
        "constraint_count": len(constraints),
        "organism_count": len(organisms),
        "gene_count": len(genes),
        "simulation_species_count": len(species),
        "avg_candidate_score": round(sum(scores) / len(scores), 2) if scores else None,
        "avg_survival_score": round(sum(survival_scores) / len(survival_scores), 2) if survival_scores else None,
        "source_count": len(dataset.get("references", [])),
    }


def first_value(row: Dict[str, Any], candidates: Iterable[str]) -> Optional[str]:
    lowered = {str(key).lower(): value for key, value in row.items()}
    for candidate in candidates:
        if candidate in lowered and lowered[candidate] not in (None, ""):
            return str(lowered[candidate])
    return None


def stringify_dict(row: Dict[str, Any]) -> Dict[str, Any]:
    return {str(key): value for key, value in row.items()}


def to_number(value: Optional[str]) -> Optional[float]:
    if value in (None, ""):
        return None
    cleaned = re.sub(r"[^0-9.+-]", "", str(value))
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def summarize_agent_runs(agent_runs: Sequence[AgentRun]) -> List[Dict[str, Any]]:
    # 按 agent_id 去重，保留最新一次运行（查询已按 id desc 排序）
    seen: set = set()
    summary: List[Dict[str, Any]] = []
    for run in agent_runs:
        if run.agent_id in seen:
            continue
        seen.add(run.agent_id)
        output = run.output_data or {}
        summary.append(
            {
                "id": run.id,
                "agent_id": run.agent_id,
                "agent_name": run.agent_name,
                "status": run.status,
                "error_message": run.error_message,
                "findings": output.get("findings", [])[:5] if isinstance(output, dict) else [],
                "metrics": output.get("metrics", {}) if isinstance(output, dict) else {},
                "updated_at": (run.completed_at or run.created_at).isoformat() + "Z",
            }
        )
    return summary


def build_view_data(project: Project, dataset: ProjectDataset, agent_runs: Sequence[AgentRun], view_key: str) -> Dict[str, Any]:
    canonical = deepcopy(dataset.canonical_json or {})
    canonical["project"] = canonical.get("project") or {}
    canonical["project"].update(
        {
            "id": project.id,
            "name": project.name,
            "description": project.description,
            "status": project.status,
        }
    )
    canonical["derived_metrics"] = merge_values(canonical.get("derived_metrics"), build_derived_metrics(canonical))
    agents = summarize_agent_runs(agent_runs)
    latest_findings = [finding for run in agents for finding in run.get("findings", [])][:8]

    project_name = project.name or f"Project {project.id}"

    # 已知英文默认描述 → 双语映射（兼容旧数据库存量数据）
    _KNOWN_DESC_MAP: Dict[str, Dict[str, str]] = {
        "auto-created for agent orchestration": {"zh": "自动创建 · Agent 编排项目", "en": "Auto-created for agent orchestration"},
        "dynamic project workspace": {"zh": "动态项目工作区", "en": "Dynamic project workspace"},
    }
    _raw_desc = (project.description or "").strip()
    subtitle = (
        _KNOWN_DESC_MAP.get(_raw_desc.lower())
        or (_raw_desc if _raw_desc else None)
        or {"zh": "动态项目工作区", "en": "Dynamic project workspace"}
    )

    def i18n(zh: str, en: str) -> Dict[str, str]:
        return {"zh": zh, "en": en}

    if view_key == "orchestrator":
        constraints = canonical.get("environment", {}).get("constraints", [])
        completed = sum(1 for run in agents if run["status"] == "completed")
        return {
            "hero": {
                "eyebrow": i18n("动态编排器", "Dynamic Orchestrator"),
                "title": project_name,
                "subtitle": subtitle,
                "status": i18n("已连接实时数据集与受控布局运行时", "Live dataset linked to controlled layout runtime"),
            },
            "metrics": [
                {"label": i18n("数据集版本", "Dataset Version"), "value": str(dataset.version), "tone": "primary"},
                {"label": i18n("约束条件", "Constraints"), "value": str(len(constraints)), "tone": "secondary"},
                {"label": i18n("Agent 运行", "Agent Runs"), "value": str(len(agents)), "tone": "tertiary"},
                {"label": i18n("参考文献", "References"), "value": str(canonical["derived_metrics"].get("source_count", 0)), "tone": "muted"},
            ],
            "constraints": constraints,
            "pipeline": agents,
            "records": [{"title": run["agent_name"], "meta": ", ".join(run.get("findings", [])[:2]) or run["status"]} for run in agents],
            "summary": {
                "title": i18n("流水线状态", "Pipeline state"),
                "description": i18n(
                    "上传文件、标准数据集、Agent 运行与视图快照共用同一项目级流水线。",
                    "Uploads, canonical dataset, agent runs, and view snapshots now share one project-scoped pipeline.",
                ),
                "details": [
                    f"Active dataset version: {dataset.version}",
                    f"Rendered view: {view_key}",
                    f"Completed agents: {completed}/{len(agents)}",
                ],
            },
        }

    if view_key == "environment":
        environment = canonical.get("environment", {})
        measurements = environment.get("measurements", [])
        return {
            "hero": {
                "eyebrow": i18n("环境模型", "Environment Model"),
                "title": project_name,
                "subtitle": subtitle,
                "status": i18n("Schema 驱动的环境上下文", "Schema-driven environmental context"),
            },
            "metrics": [
                {"label": i18n("约束条件", "Constraints"), "value": str(len(environment.get("constraints", []))), "tone": "primary"},
                {"label": i18n("测量值", "Measurements"), "value": str(len(measurements)), "tone": "secondary"},
                {"label": i18n("备注", "Notes"), "value": str(len(environment.get("notes", []))), "tone": "tertiary"},
                {"label": i18n("数据来源", "Sources"), "value": str(len(environment.get("sources", []))), "tone": "muted"},
            ],
            "constraints": environment.get("constraints", []),
            "records": [{"title": note, "meta": i18n("导入备注", "Imported note")} for note in environment.get("notes", [])[:12]],
            "table": measurements[:30],
            "summary": {
                "title": i18n("环境溯源", "Environment traceability"),
                "description": i18n(
                    "此处展示的每个值均可追溯到上传的文件或提取的文档。",
                    "Each value shown here can be traced back to uploaded artifacts or extracted documents.",
                ),
                "details": [src.get("label", "Source") for src in environment.get("sources", [])[:6]],
            },
        }

    if view_key == "synthesis":
        genes = canonical.get("genes", [])
        pathways = canonical.get("pathways", [])
        return {
            "hero": {
                "eyebrow": i18n("合成设计", "Synthesis Design"),
                "title": project_name,
                "subtitle": subtitle,
                "status": i18n("仅使用受控 Schema 块", "Controlled schema blocks only"),
            },
            "metrics": [
                {"label": i18n("基因模块", "Gene Modules"), "value": str(len(genes)), "tone": "primary"},
                {"label": i18n("代谢通路", "Pathways"), "value": str(len(pathways)), "tone": "secondary"},
                {"label": i18n("候选物种", "Candidates"), "value": str(len(canonical.get("organisms", []))), "tone": "tertiary"},
                {"label": i18n("参考文献", "References"), "value": str(canonical["derived_metrics"].get("source_count", 0)), "tone": "muted"},
            ],
            "table": genes[:30],
            "records": [{"title": item.get("name", "Pathway"), "meta": item.get("function") or item.get("notes") or ""} for item in pathways[:12]],
            "summary": {
                "title": i18n("设计组装指导", "Design assembly guidance"),
                "description": i18n(
                    "使用上传的模块库与 Agent 发现来构建可复用的合成组装体。",
                    "Use uploaded module libraries and agent findings to build reusable synthesis assemblies.",
                ),
                "details": latest_findings[:6],
            },
        }

    if view_key == "simulation":
        species = canonical.get("simulations", {}).get("species", [])
        parameters = canonical.get("simulations", {}).get("parameters", [])
        return {
            "hero": {
                "eyebrow": i18n("仿真工作区", "Simulation Workspace"),
                "title": project_name,
                "subtitle": subtitle,
                "status": i18n("已就绪，可接入实时模型", "Ready for live model wiring"),
            },
            "metrics": [
                {"label": i18n("物种", "Species"), "value": str(len(species)), "tone": "primary"},
                {"label": i18n("参数", "Parameters"), "value": str(len(parameters)), "tone": "secondary"},
                {"label": i18n("平均存活率", "Avg Survival"), "value": str(canonical["derived_metrics"].get("avg_survival_score") or "-"), "tone": "tertiary"},
                {"label": i18n("数据集版本", "Dataset Version"), "value": str(dataset.version), "tone": "muted"},
            ],
            "chart": [{"label": item.get("name", "Entity"), "value": item.get("survival") or item.get("score") or 0} for item in species[:10]],
            "records": [{"title": item.get("name", "Species"), "meta": f"Survival {item.get('survival') or item.get('score') or '-'}"} for item in species[:12]],
            "table": parameters[:25],
            "summary": {
                "title": i18n("仿真状态", "Simulation posture"),
                "description": i18n(
                    "此页面现由上传的输入数据和派生存活率数据驱动，不再使用本地常量。",
                    "This page is now driven by uploaded inputs and derived survival data instead of local constants.",
                ),
                "details": latest_findings[:6],
            },
        }

    if view_key == "output":
        outputs = canonical.get("outputs", {})
        records = outputs.get("traceability") or canonical.get("references", [])
        return {
            "hero": {
                "eyebrow": i18n("输出中心", "Output Hub"),
                "title": project_name,
                "subtitle": subtitle,
                "status": i18n("从标准记录生成", "Generated from canonical records"),
            },
            "metrics": [
                {"label": i18n("溯源条目", "Traceability Items"), "value": str(len(canonical.get("references", []))), "tone": "primary"},
                {"label": i18n("导出", "Exports"), "value": str(len(outputs.get("exports", []))), "tone": "secondary"},
                {"label": i18n("生物打印队列", "Bioprint Queue"), "value": str(len(outputs.get("bioprint_queue", []))), "tone": "tertiary"},
                {"label": i18n("视图数", "Views"), "value": str(len(VIEW_KEYS)), "tone": "muted"},
            ],
            "records": [{"title": item.get("label", "Reference"), "meta": item.get("type", "source")} for item in records[:12]],
            "table": outputs.get("exports", [])[:20],
            "summary": {
                "title": i18n("导出就绪状态", "Export readiness"),
                "description": i18n(
                    "导出状态现由项目快照和参考文献计算得出，不再使用硬编码卡片。",
                    "Export state is now computed from project snapshots and references, not hardcoded cards.",
                ),
                "details": [
                    "SBOL / JSON / PDF can be attached to future export workers",
                    f"Current snapshot schema: {settings.VIEW_SCHEMA_VERSION}",
                    f"Active dataset version: {dataset.version}",
                ],
            },
        }

    diagnostics = canonical.get("diagnostics", {})
    logs = diagnostics.get("logs", [])
    if not logs:
        logs = [{"message": finding, "type": "INFO"} for finding in latest_findings[:8]]
    return {
        "hero": {
            "eyebrow": i18n("诊断", "Diagnostics"),
            "title": project_name,
            "subtitle": subtitle,
            "status": i18n("运行时遥测", "Runtime telemetry"),
        },
        "metrics": [
            {"label": i18n("Agent 流水线", "Agent Pipeline"), "value": str(len(agents)), "tone": "primary"},
            {"label": i18n("传感器", "Sensors"), "value": str(len(diagnostics.get("sensors", []))), "tone": "secondary"},
            {"label": i18n("日志", "Logs"), "value": str(len(logs)), "tone": "tertiary"},
            {"label": i18n("数据集版本", "Dataset Version"), "value": str(dataset.version), "tone": "muted"},
        ],
        "pipeline": agents,
        "records": [{"title": item.get("message", "Log item"), "meta": item.get("type", "INFO")} for item in logs[:12]],
        "summary": {
            "title": i18n("诊断状态", "Diagnostics posture"),
            "description": i18n(
                "此面板现在反映实际数据集和任务状态，不再使用本地模拟数组。",
                "This panel now reflects actual dataset and job state instead of local mock arrays.",
            ),
            "details": [
                f"Latest job-ready dataset version: {dataset.version}",
                f"References tracked: {canonical['derived_metrics'].get('source_count', 0)}",
                f"Agent findings captured: {len(latest_findings)}",
            ],
        },
    }


def compose_layout(view_key: str) -> Dict[str, Any]:
    page_titles = {
        "orchestrator": ({"zh": "编排器", "en": "Orchestrator"}, {"zh": "项目级流水线视图", "en": "Project-wide pipeline view"}),
        "environment": ({"zh": "环境", "en": "Environment"}, {"zh": "规范化环境模型", "en": "Normalized environment model"}),
        "synthesis": ({"zh": "合成", "en": "Synthesis"}, {"zh": "基因与代谢通路模块", "en": "Genes and pathway modules"}),
        "simulation": ({"zh": "仿真", "en": "Simulation"}, {"zh": "派生仿真输入", "en": "Derived simulation inputs"}),
        "output": ({"zh": "输出", "en": "Output"}, {"zh": "溯源与导出就绪", "en": "Traceability and export readiness"}),
        "diagnostics": ({"zh": "诊断", "en": "Diagnostics"}, {"zh": "运行时数据集健康状态", "en": "Operational dataset health"}),
    }
    title, subtitle = page_titles.get(view_key, ({"zh": "视图", "en": "View"}, {"zh": "动态项目视图", "en": "Dynamic project view"}))
    layout = {"page": {"title": title, "subtitle": subtitle}, "sections": []}
    layout["sections"].append(
        {
            "id": "hero",
            "layout": "stack",
            "blocks": [
                {"id": "banner", "type": "status_banner", "binding": "$.hero"},
                {"id": "metrics", "type": "metric_grid", "binding": "$.metrics"},
            ],
        }
    )
    if view_key in {"orchestrator", "diagnostics"}:
        layout["sections"].append(
            {
                "id": "pipeline",
                "layout": "stack",
                "blocks": [
                    {"id": "pipeline", "type": "agent_pipeline", "binding": "$.pipeline"},
                    {"id": "records", "type": "record_list", "binding": "$.records"},
                    {"id": "summary", "type": "detail_panel", "binding": "$.summary"},
                ],
            }
        )
    elif view_key in {"environment", "synthesis", "output"}:
        layout["sections"].append(
            {
                "id": "content",
                "layout": "grid",
                "blocks": [
                    {"id": "constraints", "type": "constraint_list", "binding": "$.constraints"},
                    {"id": "records", "type": "record_list", "binding": "$.records"},
                    {"id": "table", "type": "entity_table", "binding": "$.table"},
                    {"id": "summary", "type": "detail_panel", "binding": "$.summary"},
                ],
            }
        )
    else:
        layout["sections"].append(
            {
                "id": "simulation",
                "layout": "grid",
                "blocks": [
                    {"id": "chart", "type": "chart_bar", "binding": "$.chart"},
                    {"id": "records", "type": "record_list", "binding": "$.records"},
                    {"id": "table", "type": "entity_table", "binding": "$.table"},
                    {"id": "summary", "type": "detail_panel", "binding": "$.summary"},
                ],
            }
        )
    layout["bindings_manifest"] = validate_layout(layout)
    return layout


def validate_layout(layout: Dict[str, Any]) -> List[str]:
    bindings: List[str] = []
    sections = layout.get("sections", [])
    if not isinstance(sections, list):
        raise ValueError("layout.sections must be a list")
    for section in sections:
        if section.get("layout") not in {"stack", "grid", "split"}:
            raise ValueError("unsupported section layout")
        for block in section.get("blocks", []):
            if block.get("type") not in SUPPORTED_BLOCK_TYPES:
                raise ValueError(f"unsupported block type: {block.get('type')}")
            binding = block.get("binding")
            if binding:
                if not isinstance(binding, str) or not binding.startswith("$."):
                    raise ValueError(f"invalid binding path: {binding}")
                bindings.append(binding)
    return bindings


def refresh_view_snapshots(
    db: Session,
    project: Project,
    *,
    view_keys: Optional[Sequence[str]] = None,
    created_by_job_id: Optional[int] = None,
) -> List[ProjectViewSnapshot]:
    dataset = ensure_latest_dataset(db, project)
    agent_runs = (
        db.query(AgentRun)
        .filter(AgentRun.project_id == project.id)
        .order_by(AgentRun.created_at.desc(), AgentRun.id.desc())
        .all()
    )
    snapshots: List[ProjectViewSnapshot] = []
    for view_key in list(view_keys or VIEW_KEYS):
        layout = compose_layout(view_key)
        snapshot = ProjectViewSnapshot(
            project_id=project.id,
            view_key=view_key,
            schema_version=settings.VIEW_SCHEMA_VERSION,
            dataset_version=dataset.version,
            generation_status="completed",
            layout_json={"page": layout["page"], "sections": layout["sections"]},
            bindings_manifest=layout["bindings_manifest"],
            resolved_meta={
                "project_name": project.name,
                "agent_runs": len(agent_runs),
                "dataset_version": dataset.version,
            },
            created_by_job_id=created_by_job_id,
        )
        db.add(snapshot)
        db.flush()
        snapshots.append(snapshot)
    db.commit()
    for snapshot in snapshots:
        db.refresh(snapshot)
    return snapshots


def get_latest_snapshot(db: Session, project_id: int, view_key: str) -> Optional[ProjectViewSnapshot]:
    return (
        db.query(ProjectViewSnapshot)
        .filter(ProjectViewSnapshot.project_id == project_id, ProjectViewSnapshot.view_key == view_key)
        .order_by(ProjectViewSnapshot.dataset_version.desc(), ProjectViewSnapshot.id.desc())
        .first()
    )


def build_view_response(db: Session, project: Project, view_key: str) -> Dict[str, Any]:
    dataset = ensure_latest_dataset(db, project)
    snapshot = get_latest_snapshot(db, project.id, view_key)
    if not snapshot or snapshot.dataset_version != dataset.version:
        snapshot = refresh_view_snapshots(db, project, view_keys=[view_key])[0]

    agent_runs = (
        db.query(AgentRun)
        .filter(AgentRun.project_id == project.id)
        .order_by(AgentRun.created_at.desc(), AgentRun.id.desc())
        .all()
    )
    return {
        "snapshot_id": snapshot.id,
        "project_id": project.id,
        "view_key": view_key,
        "schema_version": snapshot.schema_version,
        "dataset_version": snapshot.dataset_version,
        "generation_status": snapshot.generation_status,
        "layout": snapshot.layout_json,
        "bindings_manifest": snapshot.bindings_manifest or [],
        "resolved_meta": snapshot.resolved_meta or {},
        "data": build_view_data(project, dataset, agent_runs, view_key),
    }


def run_artifact_job(job_id: int) -> None:
    db = SessionLocal()
    try:
        job = db.query(ProjectJob).filter(ProjectJob.id == job_id).first()
        if not job:
            return
        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project:
            raise ValueError("project not found")
        artifact_ids = list(job.payload_json.get("artifact_ids") or [])
        artifacts = (
            db.query(ProjectArtifact)
            .filter(ProjectArtifact.project_id == project.id, ProjectArtifact.id.in_(artifact_ids))
            .order_by(ProjectArtifact.id.asc())
            .all()
        )

        set_job_status(db, job, status="running")
        append_job_event(db, job, "parsing", "Parsing uploaded artifacts", {"artifact_ids": artifact_ids})

        latest_dataset = get_latest_dataset(db, project.id)
        next_version = (latest_dataset.version if latest_dataset else 0) + 1
        dataset_payload = deepcopy(latest_dataset.canonical_json) if latest_dataset else build_empty_dataset(project, next_version)
        dataset_payload["dataset_version"] = next_version

        for artifact in artifacts:
            parsed = parse_artifact(artifact)
            artifact.parser_type = parsed["parser_type"]
            artifact.parse_status = parsed["parse_status"]
            artifact.parse_summary_json = parsed["parse_summary_json"]
            artifact.structured_json = parsed["structured_json"]
            artifact.extracted_text = parsed["extracted_text"]
            db.add(artifact)
            db.commit()
            db.refresh(artifact)
            append_job_event(db, job, "parsed", f"Parsed {artifact.filename}", {"artifact_id": artifact.id, "status": artifact.parse_status})
            dataset_payload = merge_dataset_payload(dataset_payload, artifact)

        append_job_event(db, job, "normalizing", "Writing canonical dataset", {"version": next_version})
        dataset = ProjectDataset(
            project_id=project.id,
            version=next_version,
            status="completed",
            source_artifact_ids=artifact_ids,
            canonical_json=dataset_payload,
            summary_json={
                "artifact_count": len(artifacts),
                "source_count": dataset_payload.get("derived_metrics", {}).get("source_count", 0),
            },
            created_by_job_id=job.id,
        )
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        update_project_runtime_config(db, project, active_dataset_version=dataset.version)

        append_job_event(db, job, "generating", "Refreshing project views", {"views": VIEW_KEYS})
        snapshots = refresh_view_snapshots(db, project, view_keys=VIEW_KEYS, created_by_job_id=job.id)
        append_job_event(db, job, "completed", "Artifacts normalized and views refreshed", {"dataset_id": dataset.id, "snapshot_count": len(snapshots)})
        set_job_status(
            db,
            job,
            status="completed",
            result_json={
                "dataset_id": dataset.id,
                "dataset_version": dataset.version,
                "snapshot_ids": [snapshot.id for snapshot in snapshots],
            },
        )
    except Exception as exc:
        job = db.query(ProjectJob).filter(ProjectJob.id == job_id).first()
        if job:
            append_job_event(db, job, "failed", "Artifact processing failed", {"error": str(exc)})
            set_job_status(db, job, status="failed", error_message=str(exc))
    finally:
        db.close()


def run_view_regeneration_job(job_id: int, view_keys: Optional[Sequence[str]] = None) -> None:
    db = SessionLocal()
    try:
        job = db.query(ProjectJob).filter(ProjectJob.id == job_id).first()
        if not job:
            return
        project = db.query(Project).filter(Project.id == job.project_id).first()
        if not project:
            raise ValueError("project not found")
        keys = list(view_keys or job.payload_json.get("view_keys") or VIEW_KEYS)
        set_job_status(db, job, status="running")
        append_job_event(db, job, "generating", "Refreshing view snapshots", {"views": keys})
        ensure_latest_dataset(db, project)
        snapshots = refresh_view_snapshots(db, project, view_keys=keys, created_by_job_id=job.id)
        append_job_event(db, job, "completed", "View snapshots refreshed", {"views": keys})
        set_job_status(
            db,
            job,
            status="completed",
            result_json={"snapshot_ids": [snapshot.id for snapshot in snapshots], "view_keys": keys},
        )
    except Exception as exc:
        job = db.query(ProjectJob).filter(ProjectJob.id == job_id).first()
        if job:
            append_job_event(db, job, "failed", "View regeneration failed", {"error": str(exc)})
            set_job_status(db, job, status="failed", error_message=str(exc))
    finally:
        db.close()
