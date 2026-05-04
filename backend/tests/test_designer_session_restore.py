import unittest
from unittest.mock import patch

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
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


class DesignerSessionRestoreTests(unittest.TestCase):
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
        self.other_user = User(
            email="other@example.com",
            username="other",
            hashed_password="hashed",
        )
        self.db.add_all([self.user, self.other_user])
        self.db.commit()
        self.db.refresh(self.user)
        self.db.refresh(self.other_user)

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

    def _project(self, name, owner_id=None):
        project = Project(
            name=name,
            description="",
            owner_id=owner_id or self.user.id,
        )
        self.db.add(project)
        self.db.commit()
        self.db.refresh(project)
        return project

    def test_default_session_reuses_same_design_and_session_for_project(self):
        project = self._project("Mars")

        first = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/default/session"
        )
        second = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/default/session"
        )

        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertEqual(first.json()["project_id"], project.id)
        self.assertEqual(first.json()["design_id"], second.json()["design_id"])
        self.assertEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(
            self.db.query(Design).filter(Design.project_id == project.id).count(),
            1,
        )
        self.assertEqual(
            self.db.query(DesignerSession)
            .filter(DesignerSession.project_id == project.id)
            .count(),
            1,
        )

    def test_default_sessions_are_isolated_by_project(self):
        first_project = self._project("Mars")
        second_project = self._project("Europa")

        first = self.client.get(
            f"/api/v1/designer/projects/{first_project.id}/designs/default/session"
        )
        second = self.client.get(
            f"/api/v1/designer/projects/{second_project.id}/designs/default/session"
        )

        self.assertEqual(first.status_code, 200, first.text)
        self.assertEqual(second.status_code, 200, second.text)
        self.assertNotEqual(first.json()["design_id"], second.json()["design_id"])
        self.assertNotEqual(first.json()["id"], second.json()["id"])
        self.assertEqual(first.json()["project_id"], first_project.id)
        self.assertEqual(second.json()["project_id"], second_project.id)

    def test_existing_session_state_is_restored_for_design(self):
        project = self._project("Mars")
        design = Design(project_id=project.id, name="Habitat Design")
        self.db.add(design)
        self.db.commit()
        self.db.refresh(design)
        session = DesignerSession(
            user_id=self.user.id,
            project_id=project.id,
            design_id=design.id,
            current_step=3,
            environment_json=ENVIRONMENT,
            mission_id="mission-carbon",
        )
        self.db.add(session)
        self.db.commit()

        response = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/{design.id}/session"
        )

        self.assertEqual(response.status_code, 200, response.text)
        data = response.json()
        self.assertEqual(data["id"], session.id)
        self.assertEqual(data["project_id"], project.id)
        self.assertEqual(data["design_id"], design.id)
        self.assertEqual(data["project_name"], "Mars")
        self.assertEqual(data["design_name"], "Habitat Design")
        self.assertEqual(data["current_step"], 3)
        self.assertEqual(data["mission_id"], "mission-carbon")
        self.assertEqual(data["environment"]["temperature"], ENVIRONMENT["temperature"])

    def test_create_session_with_project_id_uses_default_design(self):
        project = self._project("Mars")

        created = self.client.post(
            "/api/v1/designer/sessions",
            json={"project_id": project.id},
        )

        self.assertEqual(created.status_code, 200, created.text)
        sid = created.json()["sid"]
        restored = self.client.get(f"/api/v1/designer/sessions/{sid}")
        self.assertEqual(restored.status_code, 200, restored.text)
        self.assertEqual(restored.json()["project_id"], project.id)
        self.assertIsNotNone(restored.json()["design_id"])
        self.assertEqual(
            self.db.query(DesignerSession).filter(DesignerSession.id == sid).one().design_id,
            restored.json()["design_id"],
        )

    def test_latest_default_design_uses_updated_at_when_available(self):
        project = self._project("Mars")
        old_design = Design(project_id=project.id, name="Old Design")
        new_design = Design(project_id=project.id, name="New Design")
        self.db.add_all([old_design, new_design])
        self.db.commit()
        self.db.refresh(old_design)
        self.db.refresh(new_design)

        with self.engine.begin() as connection:
            connection.execute(
                text(
                    "UPDATE designs SET created_at = '2026-01-01 00:00:00', updated_at = NULL WHERE id = :id"
                ),
                {"id": old_design.id},
            )
            connection.execute(
                text(
                    "UPDATE designs SET created_at = '2026-01-02 00:00:00', updated_at = '2026-02-01 00:00:00' WHERE id = :id"
                ),
                {"id": new_design.id},
            )

        response = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/default/session"
        )

        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["design_id"], new_design.id)

    def test_mission_candidates_are_persisted_and_returned_in_state(self):
        project = self._project("Mars")
        state = self.client.get(
            f"/api/v1/designer/projects/{project.id}/designs/default/session"
        )
        self.assertEqual(state.status_code, 200, state.text)
        sid = state.json()["id"]

        with patch.object(
            designer.biotype_service,
            "recommend_chassis",
            return_value=[CHASSIS_CANDIDATE],
        ):
            response = self.client.post(
                f"/api/v1/designer/sessions/{sid}/mission",
                json={"mission_id": "mission-carbon"},
            )

        self.assertEqual(response.status_code, 200, response.text)
        restored = self.client.get(f"/api/v1/designer/sessions/{sid}")
        self.assertEqual(restored.status_code, 200, restored.text)
        self.assertEqual(
            restored.json()["chassis_candidates"],
            [CHASSIS_CANDIDATE],
        )

    def test_design_must_belong_to_project_and_user(self):
        owned_project = self._project("Mars")
        other_project = self._project("Other", owner_id=self.other_user.id)
        other_design = Design(project_id=other_project.id, name="Other Design")
        self.db.add(other_design)
        self.db.commit()
        self.db.refresh(other_design)

        wrong_project = self.client.get(
            f"/api/v1/designer/projects/{owned_project.id}/designs/{other_design.id}/session"
        )
        wrong_user = self.client.get(
            f"/api/v1/designer/projects/{other_project.id}/designs/{other_design.id}/session"
        )

        self.assertEqual(wrong_project.status_code, 404)
        self.assertEqual(wrong_user.status_code, 404)


if __name__ == "__main__":
    unittest.main()
