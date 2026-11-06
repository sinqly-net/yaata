import importlib
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from pydantic import ValidationError

SRC_PATH = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_PATH))

STARTUP_CONFIG = """\
version: 1.0
host: https://startup.example/
oidc:
  issuer: https://identity.example/
  client_id: startup-client
  client_secret: startup-secret
db:
  user: startup-user
  password: startup-password
  host: localhost
  port: 5432
  database: yaata
  schema: public
"""

_startup_directory = tempfile.TemporaryDirectory()
_startup_config_path = Path(_startup_directory.name) / "startup.yaml"
_startup_config_path.write_text(STARTUP_CONFIG)
with patch.dict(os.environ, {"CONFIG_PATH": str(_startup_config_path)}):
    config_module = importlib.import_module("config")

VALID_CONFIG = """\
version: 1.0
host: https://yaata.example/
oidc:
  issuer: https://identity.example/
  client_id: client-id
  client_secret: secret
db:
  user: user
  password: password
  host: localhost
  port: 5432
  database: yaata
  schema: public
"""


class ConfigTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)

    def write_config(self, content: str, name: str = "config.yaml") -> Path:
        path = Path(self.directory.name) / name
        path.write_text(content)
        return path

    def test_loads_nested_yaml_and_uses_schema_defaults(self):
        config = config_module.load_config(str(self.write_config(VALID_CONFIG)))

        self.assertEqual(config.version, 1.0)
        self.assertEqual(str(config.host), "https://yaata.example/")
        self.assertEqual(config.oidc.client_id, "client-id")
        self.assertEqual(config.oidc.scopes, ["openid", "profile", "email"])
        self.assertEqual(config.db.options, "-c search-path=public")
        self.assertEqual(config.session.cookie_name, "session_id")
        self.assertEqual(config.session.lifetime_seconds, 8 * 60 * 60)
        self.assertEqual(config.debug.level.value, "DEBUG")

    def test_yaml_values_override_schema_defaults(self):
        custom_config = VALID_CONFIG + """\
session:
  cookie_name: custom-session
  cookie_secure: false
  lifetime_seconds: 900
debug:
  level: INFO
  format: "%(levelname)s %(message)s"
"""
        config = config_module.load_config(str(self.write_config(custom_config)))

        self.assertEqual(config.session.cookie_name, "custom-session")
        self.assertFalse(config.session.cookie_secure)
        self.assertEqual(config.session.lifetime_seconds, 900)
        self.assertEqual(config.debug.level.value, "INFO")
        self.assertEqual(config.debug.format, "%(levelname)s %(message)s")

    def test_invalid_settings_raise_validation_error(self):
        invalid_config = VALID_CONFIG.replace("port: 5432", "port: invalid")

        with self.assertRaises(ValidationError):
            config_module.load_config(str(self.write_config(invalid_config)))

    def test_empty_yaml_content_raises_config_error(self):
        from exceptions.config_error import ConfigError

        for content in ("", "{}\n", "null\n"):
            with self.subTest(content=content):
                path = self.write_config(content, f"empty-{len(content)}.yaml")
                with self.assertRaises(ConfigError):
                    config_module.load_config(str(path))

    def test_missing_file_raises_file_not_found_error(self):
        missing_path = Path(self.directory.name) / "missing.yaml"

        with self.assertRaises(FileNotFoundError):
            config_module.load_config(str(missing_path))

    def test_explicit_paths_are_independent(self):
        first_path = self.write_config(VALID_CONFIG, "first.yaml")
        second_config = VALID_CONFIG.replace(
            "host: https://yaata.example/", "host: https://second.example/"
        )
        second_path = self.write_config(second_config, "second.yaml")

        first = config_module.load_config(str(first_path))
        second = config_module.load_config(str(second_path))

        self.assertEqual(str(first.host), "https://yaata.example/")
        self.assertEqual(str(second.host), "https://second.example/")

    def test_environment_variables_do_not_override_yaml(self):
        path = self.write_config(VALID_CONFIG)

        with patch.dict(os.environ, {"VERSION": "2.0", "DB__PORT": "9999"}):
            config = config_module.load_config(str(path))

        self.assertEqual(config.version, 1.0)
        self.assertEqual(config.db.port, 5432)

    def test_environment_selects_startup_config_path(self):
        environment = os.environ.copy()
        environment["CONFIG_PATH"] = str(_startup_config_path)
        environment["PYTHONPATH"] = str(SRC_PATH)

        result = subprocess.run(
            [
                sys.executable,
                "-c",
                "import config; print(config.config.oidc.client_id)",
            ],
            check=True,
            capture_output=True,
            text=True,
            env=environment,
        )

        self.assertEqual(result.stdout.strip(), "startup-client")


if __name__ == "__main__":
    unittest.main()
