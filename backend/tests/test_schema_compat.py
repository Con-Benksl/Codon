import unittest

from sqlalchemy import create_engine, inspect, text

from app.schema_compat import ensure_designer_session_schema, ensure_design_report_schema


class DesignerSessionSchemaCompatTests(unittest.TestCase):
    def test_ensure_designer_session_schema_adds_missing_linkage_columns(self):
        engine = create_engine("sqlite:///:memory:")
        with engine.begin() as connection:
            connection.execute(
                text(
                    """
                    CREATE TABLE designer_sessions (
                        id INTEGER PRIMARY KEY,
                        user_id INTEGER NOT NULL,
                        project_id INTEGER,
                        current_step INTEGER NOT NULL
                    )
                    """
                )
            )

        ensure_designer_session_schema(engine)
        ensure_designer_session_schema(engine)

        columns = {column["name"] for column in inspect(engine).get_columns("designer_sessions")}
        self.assertIn("design_id", columns)
        self.assertIn("chassis_candidates_json", columns)
        self.assertIn("protein_candidates_json", columns)
        self.assertIn("edit_plan_candidates_json", columns)

    def test_ensure_design_report_schema_creates_missing_report_tables(self):
        engine = create_engine("sqlite:///:memory:")

        ensure_design_report_schema(engine)
        ensure_design_report_schema(engine)

        tables = set(inspect(engine).get_table_names())
        self.assertIn("design_reports", tables)
        self.assertIn("report_exports", tables)

        report_columns = {
            column["name"] for column in inspect(engine).get_columns("design_reports")
        }
        export_columns = {
            column["name"] for column in inspect(engine).get_columns("report_exports")
        }
        self.assertIn("sections_json", report_columns)
        self.assertIn("source_session_id", report_columns)
        self.assertIn("content_snapshot", export_columns)


if __name__ == "__main__":
    unittest.main()
