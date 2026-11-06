import importlib
import os
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from requests import HTTPError

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
    discovery_module = importlib.import_module("utils.discovery")


class DiscoveryCacheTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.cache = discovery_module.DiscoveryCache(ttl_seconds=10)

    @staticmethod
    def response(data):
        response = Mock()
        response.json.return_value = data
        return response

    async def test_get_fetches_once_and_returns_cached_document(self):
        document = {"authorization_endpoint": "https://identity.example/auth"}
        with patch.object(
            discovery_module.requests, "get", return_value=self.response(document)
        ) as get:
            first = await self.cache.get()
            second = await self.cache.get()

        self.assertIs(first, second)
        self.assertEqual(first, document)
        get.assert_called_once_with(
            "https://identity.example/.well-known/openid-configuration", timeout=10
        )

    async def test_expired_cache_fetches_updated_document(self):
        old_document = {"authorization_endpoint": "https://identity.example/old"}
        new_document = {"authorization_endpoint": "https://identity.example/new"}
        self.cache._data = old_document
        self.cache._fetched_at = time.monotonic() - 11
        with patch.object(
            discovery_module.requests,
            "get",
            return_value=self.response(new_document),
        ) as get:
            updated = await self.cache.get()

        self.assertEqual(updated, new_document)
        get.assert_called_once()

    async def test_refresh_now_discards_cached_document(self):
        documents = [
            {"authorization_endpoint": "https://identity.example/old"},
            {"authorization_endpoint": "https://identity.example/new"},
        ]
        responses = [self.response(document) for document in documents]
        with patch.object(
            discovery_module.requests, "get", side_effect=responses
        ) as get:
            first = await self.cache.get()
            refreshed = await self.cache.refresh_now()

        self.assertEqual(first, documents[0])
        self.assertEqual(refreshed, documents[1])
        self.assertEqual(get.call_count, 2)

    async def test_fetch_error_propagates_without_caching_failure(self):
        error_response = self.response({})
        error_response.raise_for_status.side_effect = HTTPError("unavailable")
        valid_document = {"authorization_endpoint": "https://identity.example/auth"}
        with patch.object(
            discovery_module.requests,
            "get",
            side_effect=[error_response, self.response(valid_document)],
        ) as get:
            with self.assertRaises(HTTPError):
                await self.cache.get()
            recovered = await self.cache.get()

        self.assertEqual(recovered, valid_document)
        self.assertEqual(get.call_count, 2)


if __name__ == "__main__":
    unittest.main()
