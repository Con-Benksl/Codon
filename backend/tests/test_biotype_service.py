import unittest
from unittest.mock import patch

from app.services import biotype_service


class BiotypeCacheTests(unittest.TestCase):
    def setUp(self):
        biotype_service._CHASSIS_CACHE.clear()

    def tearDown(self):
        biotype_service._CHASSIS_CACHE.clear()

    def test_recommend_chassis_returns_copy_from_cache_for_stable_input_key(self):
        chassis_data = [
            {
                "id": "c1",
                "scientific_name": "Example one",
                "common_name": "one",
                "ncbi_taxid": "1",
                "tolerance": {"temperature": {"min": 0, "max": 100}},
                "genetic_tractability": "high",
                "metabolic_traits": ["photosynthesis", "carbon", "oxygenic"],
            },
            {
                "id": "c2",
                "scientific_name": "Example two",
                "common_name": "two",
                "ncbi_taxid": "2",
                "tolerance": {"temperature": {"min": -100, "max": -50}},
                "genetic_tractability": "low",
                "metabolic_traits": [],
            },
        ]
        env = {"temperature": 25.0, "ph": 7.0}

        with patch.object(biotype_service, "CHASSIS_DATA", chassis_data):
            first = biotype_service.recommend_chassis(dict(env), "mission_oxygen_carbon_fixation", top_n=1)
            first[0]["id"] = "mutated"
            second = biotype_service.recommend_chassis(dict(reversed(env.items())), "mission_oxygen_carbon_fixation", top_n=1)

        self.assertEqual(second[0]["id"], "c1")
        self.assertIsNot(first, second)


if __name__ == "__main__":
    unittest.main()
