import unittest
from unittest.mock import patch

from app.services import edit_plan_service


class EditPlanCacheTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        edit_plan_service._EDIT_PLAN_CACHE.clear()

    def tearDown(self):
        edit_plan_service._EDIT_PLAN_CACHE.clear()

    async def test_generate_edit_plans_returns_copy_from_cache_without_recalling_llm(self):
        llm_calls = 0
        fetch_calls = 0

        async def fake_fetch(uniprot_id):
            nonlocal fetch_calls
            fetch_calls += 1
            return 101

        async def fake_chat_completion_json(**kwargs):
            nonlocal llm_calls
            llm_calls += 1
            return {
                "plans": [
                    {
                        "id": "plan_a",
                        "target_gene": "geneA",
                        "source": "proteinA",
                        "strategy": "异源过表达",
                        "delivery_vector": "pBBR1MCS-2",
                        "promoter": "J23119",
                        "codon_optimization_note": "按底盘优化",
                        "metabolic_burden": "medium",
                        "has_kill_switch": True,
                        "references": ["ref"],
                    }
                ]
            }

        chassis = {
            "id": "chassisA",
            "scientific_name": "Example chassis",
            "genetic_tractability": "high",
            "engineering_tools": ["toolA"],
        }
        protein = {
            "id": "proteinA",
            "name": "Protein A",
            "ec_number": "1.1.1.1",
            "source_organism": "Example organism",
            "uniprot_id": "P12345",
            "kinetics": {"km": "1 mM"},
        }

        with patch.object(edit_plan_service, "_fetch_sequence_length", side_effect=fake_fetch), patch.object(
            edit_plan_service.llm_client, "chat_completion_json", side_effect=fake_chat_completion_json
        ):
            first = await edit_plan_service.generate_edit_plans(dict(chassis), dict(protein))
            first[0]["id"] = "mutated"
            second = await edit_plan_service.generate_edit_plans(dict(reversed(chassis.items())), dict(reversed(protein.items())))

        self.assertEqual(llm_calls, 1)
        self.assertEqual(fetch_calls, 1)
        self.assertEqual(second[0]["id"], "plan_a")
        self.assertIsNot(first, second)


if __name__ == "__main__":
    unittest.main()
