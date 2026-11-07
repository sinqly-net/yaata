import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

SRC_PATH = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_PATH))

CONFIG = """\
version: 1.0
host: http://localhost:5000
oidc:
  issuer: https://identity.example/
  client_id: startup-test
  client_secret: startup-test-secret
db:
  user: postgres
  password: postgres
  host: localhost
  port: 5432
  database: postgres
  schema: public
"""


class BackendStartupTests(unittest.IsolatedAsyncioTestCase):
    @classmethod
    def setUpClass(cls):
        cls.config_directory = tempfile.TemporaryDirectory()
        cls.config_path = Path(cls.config_directory.name) / "config.yaml"
        cls.config_path.write_text(CONFIG)
        cls.config_environment = patch.dict(
            os.environ, {"CONFIG_PATH": str(cls.config_path)}
        )
        cls.config_environment.start()
        cls.main = importlib.import_module("main")

    @classmethod
    def tearDownClass(cls):
        cls.config_environment.stop()
        cls.config_directory.cleanup()

    async def test_app_startup_loads_router_and_asyncpg_engine(self):
        async with self.main.lifespan(self.main.app):
            db_module = importlib.import_module("models.db")
            self.assertEqual(db_module.engine.url.drivername, "postgresql+asyncpg")

    async def test_unauthenticated_routes_return_401_and_close_db_session(self):
        async with self.main.lifespan(self.main.app):
            async with AsyncClient(
                transport=ASGITransport(app=self.main.app), base_url="http://test"
            ) as client:
                auth_response = await client.get("/auth/me")
                workspace_response = await client.get("/workspace/access")

        self.assertEqual(auth_response.status_code, 401)
        self.assertEqual(workspace_response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
