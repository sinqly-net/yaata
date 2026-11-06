import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

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


if __name__ == "__main__":
    unittest.main()
