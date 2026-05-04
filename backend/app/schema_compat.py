"""Small startup-time schema compatibility helpers.

Alembic is still the preferred production migration path. These helpers cover
existing local or early deployed databases from before the current migration
history existed, where `Base.metadata.create_all()` cannot add missing columns.
"""
from __future__ import annotations

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


_DESIGNER_SESSION_COMPAT_COLUMNS = {
    "design_id": "INTEGER",
    "chassis_candidates_json": "JSON",
    "protein_candidates_json": "JSON",
    "edit_plan_candidates_json": "JSON",
}

_DESIGN_REPORT_COMPAT_COLUMNS = {
    "project_id": "INTEGER",
    "design_id": "INTEGER",
    "title": "VARCHAR",
    "status": "VARCHAR",
    "summary": "TEXT",
    "sections_json": "JSON",
    "user_edits_json": "JSON",
    "source_session_id": "INTEGER",
    "version": "INTEGER",
    "created_at": "DATETIME",
    "updated_at": "DATETIME",
    "published_at": "DATETIME",
}

_REPORT_EXPORT_COMPAT_COLUMNS = {
    "report_id": "INTEGER",
    "project_id": "INTEGER",
    "design_id": "INTEGER",
    "format": "VARCHAR",
    "status": "VARCHAR",
    "filename": "VARCHAR",
    "file_path_or_url": "TEXT",
    "content_snapshot": "TEXT",
    "report_version": "INTEGER",
    "error_message": "TEXT",
    "created_at": "DATETIME",
}


def ensure_designer_session_schema(engine: Engine) -> None:
    """Add missing DesignerSession columns to older databases.

    This is intentionally narrow and idempotent. It does not try to retrofit
    foreign key constraints because SQLite cannot add them with a simple ALTER,
    and the application already validates project/design ownership before use.
    """

    inspector = inspect(engine)
    if "designer_sessions" not in inspector.get_table_names():
        return

    existing_columns = {
        column["name"] for column in inspector.get_columns("designer_sessions")
    }
    missing_columns = [
        (name, column_type)
        for name, column_type in _DESIGNER_SESSION_COMPAT_COLUMNS.items()
        if name not in existing_columns
    ]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, column_type in missing_columns:
            connection.execute(
                text(f"ALTER TABLE designer_sessions ADD COLUMN {name} {column_type}")
            )


def ensure_design_report_schema(engine: Engine) -> None:
    """Create or patch first-round DesignReport tables for pre-migration DBs."""

    inspector = inspect(engine)
    tables = set(inspector.get_table_names())
    with engine.begin() as connection:
        if "design_reports" not in tables:
            connection.execute(
                text(
                    """
                    CREATE TABLE design_reports (
                        id INTEGER PRIMARY KEY,
                        project_id INTEGER NOT NULL,
                        design_id INTEGER NOT NULL,
                        title VARCHAR NOT NULL,
                        status VARCHAR NOT NULL DEFAULT 'draft',
                        summary TEXT,
                        sections_json JSON NOT NULL DEFAULT '{}',
                        user_edits_json JSON,
                        source_session_id INTEGER NOT NULL,
                        version INTEGER NOT NULL DEFAULT 1,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                        published_at DATETIME
                    )
                    """
                )
            )
        if "report_exports" not in tables:
            connection.execute(
                text(
                    """
                    CREATE TABLE report_exports (
                        id INTEGER PRIMARY KEY,
                        report_id INTEGER NOT NULL,
                        project_id INTEGER NOT NULL,
                        design_id INTEGER NOT NULL,
                        format VARCHAR NOT NULL,
                        status VARCHAR NOT NULL DEFAULT 'pending',
                        filename VARCHAR NOT NULL,
                        file_path_or_url TEXT,
                        content_snapshot TEXT NOT NULL,
                        report_version INTEGER NOT NULL DEFAULT 1,
                        error_message TEXT,
                        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                    )
                    """
                )
            )

    inspector = inspect(engine)
    _add_missing_columns(
        engine,
        "design_reports",
        _DESIGN_REPORT_COMPAT_COLUMNS,
        inspector,
    )
    inspector = inspect(engine)
    _add_missing_columns(
        engine,
        "report_exports",
        _REPORT_EXPORT_COMPAT_COLUMNS,
        inspector,
    )


def _add_missing_columns(
    engine: Engine,
    table_name: str,
    desired_columns: dict[str, str],
    inspector,
) -> None:
    if table_name not in inspector.get_table_names():
        return

    existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
    missing_columns = [
        (name, column_type)
        for name, column_type in desired_columns.items()
        if name not in existing_columns
    ]
    if not missing_columns:
        return

    with engine.begin() as connection:
        for name, column_type in missing_columns:
            connection.execute(
                text(f"ALTER TABLE {table_name} ADD COLUMN {name} {column_type}")
            )
