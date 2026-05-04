import asyncio
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.agents import base_agent
from app.agents.base_agent import BaseAgent


class TestAgent(BaseAgent):
    def __init__(self):
        super().__init__("test_agent", "Test Agent")

    def build_user_prompt(self, input_data):
        return "prompt"


class BaseAgentTests(unittest.IsolatedAsyncioTestCase):
    async def test_execute_returns_failed_payload_when_agent_times_out(self):
        async def slow_chat_completion_json(**kwargs):
            await asyncio.sleep(0.05)
            return {"status": "completed"}

        settings = SimpleNamespace(AGENT_EXECUTE_TIMEOUT_SECONDS=0.01)

        with patch.object(base_agent, "get_settings", return_value=settings), patch.object(
            base_agent, "chat_completion_json", side_effect=slow_chat_completion_json
        ):
            result = await TestAgent().execute({"x": 1})

        self.assertEqual(result["status"], "failed")
        self.assertEqual(result["error"], "Agent timed out after 0.01 seconds")
        self.assertEqual(result["findings"], [])
        self.assertEqual(result["metrics"], {})


if __name__ == "__main__":
    unittest.main()
