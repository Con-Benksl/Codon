import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import Mock, patch

import httpx

from app.services import llm_client


class LlmClientTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        llm_client._client = None

    def tearDown(self):
        llm_client._client = None

    def _settings(self, **overrides):
        defaults = {
            "LLM_API_KEY": "test-key",
            "LLM_BASE_URL": "https://llm.example.test/v1",
            "LLM_MODEL": "test-model",
            "LLM_MAX_TOKENS": 100,
            "LLM_TEMPERATURE": 0.2,
            "LLM_REQUEST_TIMEOUT_SECONDS": 30,
            "LLM_RETRY_ATTEMPTS": 2,
            "LLM_RETRY_BASE_DELAY_SECONDS": 1.0,
        }
        defaults.update(overrides)
        return SimpleNamespace(**defaults)

    def test_get_llm_client_uses_configured_http_timeout_and_disables_sdk_retries(self):
        created = {}

        def fake_openai(**kwargs):
            created.update(kwargs)
            return Mock()

        with patch.object(llm_client, "get_settings", return_value=self._settings()), patch.object(
            llm_client, "AsyncOpenAI", side_effect=fake_openai
        ):
            llm_client.get_llm_client()

        timeout = created["timeout"]
        self.assertIsInstance(timeout, httpx.Timeout)
        self.assertEqual(timeout.read, 30)
        self.assertEqual(timeout.connect, 30)
        self.assertEqual(created["max_retries"], 0)

    async def test_chat_completion_wraps_each_attempt_in_wait_for_and_uses_exponential_backoff(self):
        calls = 0
        sleeps = []
        timeouts = []

        async def create(**kwargs):
            nonlocal calls
            calls += 1
            if calls < 3:
                raise RuntimeError(f"fail-{calls}")
            return SimpleNamespace(
                choices=[SimpleNamespace(message=SimpleNamespace(content="ok"))],
                usage={"total_tokens": 1},
            )

        async def fake_sleep(delay):
            sleeps.append(delay)

        async def fake_wait_for(awaitable, timeout):
            timeouts.append(timeout)
            return await awaitable

        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))

        with patch.object(llm_client, "get_settings", return_value=self._settings()), patch.object(
            llm_client, "get_llm_client", return_value=client
        ), patch.object(llm_client.asyncio, "sleep", side_effect=fake_sleep), patch.object(
            llm_client.asyncio, "wait_for", side_effect=fake_wait_for
        ):
            result = await llm_client.chat_completion("system", "user")

        self.assertEqual(result, "ok")
        self.assertEqual(calls, 3)
        self.assertEqual(sleeps, [1.0, 2.0])
        self.assertEqual(timeouts, [30, 30, 30])

    async def test_chat_completion_reraises_timeout_after_retry_budget_is_exhausted(self):
        async def create(**kwargs):
            return SimpleNamespace()

        async def fake_wait_for(awaitable, timeout):
            awaitable.close()
            raise asyncio.TimeoutError()

        async def fake_sleep(delay):
            return None

        client = SimpleNamespace(chat=SimpleNamespace(completions=SimpleNamespace(create=create)))

        with patch.object(llm_client, "get_settings", return_value=self._settings()), patch.object(
            llm_client, "get_llm_client", return_value=client
        ), patch.object(llm_client.asyncio, "sleep", side_effect=fake_sleep), patch.object(
            llm_client.asyncio, "wait_for", side_effect=fake_wait_for
        ):
            with self.assertRaises(asyncio.TimeoutError):
                await llm_client.chat_completion("system", "user")


if __name__ == "__main__":
    unittest.main()
