import unittest

from app.database import build_engine_kwargs


class DatabaseConfigTests(unittest.TestCase):
    def test_sqlite_uses_thread_check_override(self):
        self.assertEqual(
            build_engine_kwargs("sqlite:///./codon.db", 10),
            {"connect_args": {"check_same_thread": False}},
        )

    def test_postgres_uses_connect_timeout_and_pool_checks(self):
        self.assertEqual(
            build_engine_kwargs("postgresql://user:pass@example.com/db", 7),
            {
                "connect_args": {"connect_timeout": 7},
                "pool_pre_ping": True,
                "pool_recycle": 1800,
            },
        )
