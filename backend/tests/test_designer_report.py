import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app import models  # noqa: F401
from app.api.v1 import designer
from app.database import Base
from app.models.design import Design
from app.models.designer_session import DesignerSession
from app.models.project import Project
from app.models.user import User


ENVIRONMENT = {
    "temperature": 24.0,
    "ionizing_radiation": 1.0,
    "uv_flux": 2.0,
    "pressure": 101.0,
    "ph": 7.2,
    "salinity": 0.1,
    "water_activity": 0.98,
    "oxygen": 20.0,
    "temp_diurnal_range": 5.0,
}

CHASSIS_CANDIDATE = {
    "id": "chassis-a",
    "scientific_name": "Example chassis",
    "common_name": "example",
    "ncbi_taxid": "123",
    "tolerance": {
        "temperature": {"min": 0.0, "max": 60.0},
        "ionizing_radiation": {"min": 0.0, "max": 10.0},
        "uv_flux": {"min": 0.0, "max": 10.0},
        "pressure": {"min": 10.0, "max": 150.0},
        "ph": {"min": 4.0, "max": 9.0},
        "salinity": {"min": 0.0, "max": 5.0},
        "water_activity": {"min": 0.5, "max": 1.0},
        "oxygen": {"min": 0.0, "max": 30.0},
        "temp_diurnal_range": {"min": 0.0, "max": 20.0},
    },
    "chassis_status": "available",
    "genetic_tractability": "high",
    "match_score": 0.91,
    "recommendation_reason": "fits the environment",
}


class DesignerReportTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.SessionLocal = sessionmaker(
            autocommit=False,
            autoflush=False,
            bind=self.engine,
        )
        Base.metadata.create_all(bind=self.engine)

        self.db = self.SessionLocal()
        self.user = User(
            email="owner@example.com",
            username="owner",
            hashed_password="hashed",
        )
        self.db.add(self.user)
        self.db.commit()
        self.db.refresh(self.user)

        app = FastAPI()
        app.include_router(designer.router, prefix="/api/v1/designer")

        def override_db():
            db = self.SessionLocal()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[designer.get_db] = override_db
        app.dependency_overrides[designer.get_current_active_user] = lambda: self.user
        self.client = TestClient(app)

    def tearDown(self):
        self.db.close()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def _project(self, name):
        project = Project(
            name=name,
            description="",
            owner_id=self.user.id,
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def test_first_valid_bare_designer_input_creates_draft_project_design_session_and_report_once(self):
        created = self.client.post("/api/v1/designer/sessions", json={})
        self.assertEqual(created.status_code, 200, created.text)
        sid = created.json()["sid"]
        self.assertEqual(self.db.query(Project).count(), 0)
        self.assertEqual(self.db.query(Design).count(), 0)

        first = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": ENVIRONMENT},
        )
        second = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": {**ENVIRONMENT, "temperature": 30.0}},
        )

        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(self.db.query(Project).count(), 1)
        self.assertEqual(self.db.query(Design).count(), 1)
        self.assertEqual(self.db.query(DesignerSession).count(), 1)

        restored = self.client.get(f"/api/v1/designer/sessions/{sid}")
        self.assertEqual(restored.status_code, 200, restored.text)
        self.assertIsNotNone(restored.json()["project_id"])
        self.assertIsNotNone(restored.json()["design_id"])

        report = self.client.get(f"/api/v1/designer/sessions/{sid}/report")
        self.assertEqual(report.status_code, 200, report.text)
        report_data = report.json()
        self.assertEqual(report_data["project_id"], restored.json()["project_id"])
        self.assertEqual(report_data["design_id"], restored.json()["design_id"])
        self.assertEqual(report_data["source_session_id"], sid)
        self.assertEqual(report_data["status"], "draft")
        self.assertEqual(report_data["sections"]["environment"]["source_step"], 1)
        self.assertIn("30.0", report_data["sections"]["environment"]["content"])

    def test_existing_project_design_session_updates_report_without_creating_extra_drafts(self):
        project = self._project("Mars")
        state = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/default/session"
        )
        self.assertEqual(state.status_code, 200, state.text)
        sid = state.json()["id"]

        response = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": ENVIRONMENT},
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(self.db.query(Project).count(), 1)
        self.assertEqual(self.db.query(Design).count(), 1)
        report = self.client.get(f"/api/v1/designer/sessions/{sid}/report")
        self.assertEqual(report.status_code, 200, report.text)
        self.assertEqual(report.json()["project_id"], project.id)

    def test_design_report_sections_update_after_each_designer_submission(self):
        created = self.client.post("/api/v1/designer/sessions", json={})
        self.assertEqual(created.status_code, 200, created.text)
        sid = created.json()["sid"]

        env_response = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": ENVIRONMENT},
        )
        self.assertEqual(env_response.status_code, 200, env_response.text)
        report_after_env = self.client.get(f"/api/v1/designer/sessions/{sid}/report").json()
        self.assertIn("environment", report_after_env["sections"])
        self.assertNotIn("mission", report_after_env["sections"])

        with patch.object(
            designer.biotype_service,
            "recommend_chassis",
            return_value=[CHASSIS_CANDIDATE],
        ):
            mission_response = self.client.post(
                f"/api/v1/designer/sessions/{sid}/mission",
                json={"mission_id": "mission-carbon"},
            )

        self.assertEqual(mission_response.status_code, 200, mission_response.text)
        report_after_mission = self.client.get(f"/api/v1/designer/sessions/{sid}/report").json()
        self.assertIn("environment", report_after_mission["sections"])
        self.assertEqual(report_after_mission["sections"]["mission"]["source_step"], 2)
        self.assertIn("mission-carbon", report_after_mission["sections"]["mission"]["content"])
        self.assertIn(
            "chassis-a",
            report_after_mission["sections"]["chassis_candidates"]["content"],
        )

    def test_report_can_be_read_and_exported_as_markdown_snapshot(self):
        created = self.client.post("/api/v1/designer/sessions", json={})
        self.assertEqual(created.status_code, 200, created.text)
        sid = created.json()["sid"]
        env_response = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": ENVIRONMENT},
        )
        self.assertEqual(env_response.status_code, 200, env_response.text)

        report = self.client.get(f"/api/v1/designer/sessions/{sid}/report")
        self.assertEqual(report.status_code, 200, report.text)
        self.assertIn("#", report.json()["markdown"])
        self.assertIn("环境条件", report.json()["markdown"])

        exported = self.client.post(f"/api/v1/designer/sessions/{sid}/report/exports/markdown")

        self.assertEqual(exported.status_code, 200, exported.text)
        export_data = exported.json()
        self.assertEqual(export_data["report_id"], report.json()["id"])
        self.assertEqual(export_data["format"], "markdown")
        self.assertEqual(export_data["status"], "completed")
        self.assertTrue(export_data["filename"].endswith(".md"))
        self.assertEqual(export_data["content_snapshot"], report.json()["markdown"])

    def test_rollback_refreshes_report_sections_to_match_current_session_state(self):
        created = self.client.post("/api/v1/designer/sessions", json={})
        self.assertEqual(created.status_code, 200, created.text)
        sid = created.json()["sid"]
        env_response = self.client.post(
            f"/api/v1/designer/sessions/{sid}/environment",
            json={"environment": ENVIRONMENT},
        )
        self.assertEqual(env_response.status_code, 200, env_response.text)
        with patch.object(
            designer.biotype_service,
            "recommend_chassis",
            return_value=[CHASSIS_CANDIDATE],
        ):
            mission_response = self.client.post(
                f"/api/v1/designer/sessions/{sid}/mission",
                json={"mission_id": "mission-carbon"},
            )
        self.assertEqual(mission_response.status_code, 200, mission_response.text)
        before = self.client.get(f"/api/v1/designer/sessions/{sid}/report").json()
        self.assertIn("mission", before["sections"])

        rollback = self.client.post(
            f"/api/v1/designer/sessions/{sid}/rollback",
            json={"step": 2},
        )

        self.assertEqual(rollback.status_code, 200, rollback.text)
        after = self.client.get(f"/api/v1/designer/sessions/{sid}/report").json()
        self.assertIn("environment", after["sections"])
        self.assertNotIn("mission", after["sections"])
        self.assertNotIn("chassis_candidates", after["sections"])


if __name__ == "__main__":
    unittest.main()
