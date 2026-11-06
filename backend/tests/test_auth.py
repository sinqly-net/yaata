import base64
import hashlib
import importlib
import os
import sys
import tempfile
import unittest
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock, patch
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from utils.token_endpoint import call_token_endpoint

SRC_PATH = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC_PATH))

STARTUP_CONFIG = """\
version: 1.0
host: http://localhost:5000
oidc:
  issuer: https://identity.example/
  client_id: startup-client
  client_secret: startup-secret
db:
  user: startup-user
  password: startup-password
  host: localhost
  port: 5432
  database: postgres
  schema: public
"""

_startup_directory = tempfile.TemporaryDirectory()
_startup_config_path = Path(_startup_directory.name) / "startup.yaml"
_startup_config_path.write_text(STARTUP_CONFIG)
with patch.dict(os.environ, {"CONFIG_PATH": str(_startup_config_path)}):
    auth_module = importlib.import_module("router.auth")
    current_user_module = importlib.import_module("utils.current_user")


class AuthRouteTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.db = Mock()
        self.db.get = AsyncMock()
        self.db.add = Mock()
        self.db.commit = AsyncMock()
        self.app = FastAPI()
        self.app.include_router(auth_module.router)

        async def override_get_db():
            yield self.db

        self.app.dependency_overrides[auth_module.get_db] = override_get_db
        auth_module._pending_flows.clear()

    async def asyncTearDown(self):
        auth_module._pending_flows.clear()

    async def request(self, method, url, **kwargs):
        cookies = kwargs.pop("cookies", None)
        async with AsyncClient(
            transport=ASGITransport(app=self.app),
            base_url="http://test",
            cookies=cookies,
        ) as client:
            return await client.request(method, url, **kwargs)

    async def test_login_redirect_contains_s256_pkce_challenge(self):
        discovery = {"authorization_endpoint": "https://identity.example/auth"}
        with patch.object(
            auth_module.discovery_cache, "get", new=AsyncMock(return_value=discovery)
        ):
            response = await self.request("GET", "/auth/login")

        self.assertEqual(response.status_code, 307)
        location = urlparse(response.headers["location"])
        params = parse_qs(location.query)
        state = params["state"][0]
        flow = auth_module._pending_flows[state]
        expected_challenge = (
            base64.urlsafe_b64encode(
                hashlib.sha256(flow["code_verifier"].encode()).digest()
            )
            .rstrip(b"=")
            .decode()
        )

        self.assertEqual(location.netloc, "identity.example")
        self.assertEqual(
            params["redirect_uri"], ["http://localhost:5000/api/auth/callback"]
        )
        self.assertEqual(params["code_challenge_method"], ["S256"])
        self.assertEqual(params["code_challenge"], [expected_challenge])
        self.assertGreaterEqual(len(flow["code_verifier"]), 43)

    async def test_callback_creates_session_and_sets_cookies(self):
        state = "valid-state"
        auth_module._pending_flows[state] = {
            "code_verifier": "test-code-verifier",
            "created_at": datetime.now(),
        }
        token = {
            "access_token": "access-token",
            "refresh_token": "refresh-token",
            "id_token": "id-token",
            "expires_in": 600,
        }
        token_response = Mock(status_code=200)
        token_response.json.return_value = token
        userinfo = {
            "sub": str(uuid.uuid4()),
            "email": "user@example.test",
            "name": "Test User",
        }
        userinfo_response = Mock()
        userinfo_response.json.return_value = userinfo
        discovery = {"userinfo_endpoint": "https://identity.example/userinfo"}

        with (
            patch.object(
                auth_module,
                "call_token_endpoint",
                new=AsyncMock(return_value=token_response),
            ) as token_call,
            patch.object(
                auth_module.requests, "get", return_value=userinfo_response
            ) as get,
            patch.object(
                auth_module.discovery_cache,
                "get",
                new=AsyncMock(return_value=discovery),
            ),
        ):
            response = await self.request(
                "GET", "/auth/callback", params={"code": "auth-code", "state": state}
            )

        self.assertEqual(response.status_code, 307)
        self.assertEqual(response.headers["location"], "http://localhost:5000/")
        self.assertNotIn(state, auth_module._pending_flows)
        token_call.assert_awaited_once_with(
            {
                "grant_type": "authorization_code",
                "code": "auth-code",
                "redirect_uri": "http://localhost:5000/api/auth/callback",
                "client_id": "startup-client",
                "client_secret": "startup-secret",
                "code_verifier": "test-code-verifier",
            }
        )
        get.assert_called_once_with(
            "https://identity.example/userinfo",
            headers={"Authorization": "Bearer access-token"},
            timeout=10,
        )
        self.db.get.assert_awaited_once()
        self.db.add.assert_called()
        self.db.commit.assert_awaited_once()
        cookie_header = response.headers.get_list("set-cookie")
        self.assertTrue(
            any(
                "session_id=" in cookie and "HttpOnly" in cookie
                for cookie in cookie_header
            )
        )
        self.assertTrue(any("csrf_token=" in cookie for cookie in cookie_header))

    async def test_invalid_state_is_rejected(self):
        response = await self.request(
            "GET", "/auth/callback", params={"code": "code", "state": "unknown"}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json()["detail"], "Invalid or expired state")

    async def test_token_exchange_failure_consumes_state_and_rejects_replay(self):
        state = "one-time-state"
        auth_module._pending_flows[state] = {"code_verifier": "verifier"}
        failed_response = Mock(status_code=401)
        with patch.object(
            auth_module,
            "call_token_endpoint",
            new=AsyncMock(return_value=failed_response),
        ):
            first = await self.request(
                "GET", "/auth/callback", params={"code": "code", "state": state}
            )
            replay = await self.request(
                "GET", "/auth/callback", params={"code": "code", "state": state}
            )

        self.assertEqual(first.status_code, 400)
        self.assertEqual(first.json()["detail"], "Token exchange failed")
        self.assertEqual(replay.status_code, 400)
        self.assertEqual(replay.json()["detail"], "Invalid or expired state")
        self.db.commit.assert_not_awaited()

    async def test_me_without_session_cookie_is_unauthorized(self):
        self.app.dependency_overrides[auth_module.get_current_user] = (
            current_user_module.get_current_user
        )

        with patch.object(current_user_module, "ensure_fresh_token", new=AsyncMock()):
            response = await self.request("GET", "/auth/me")

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Not authenticated")

    async def test_me_rejects_expired_session(self):
        expired_session = SimpleNamespace(
            expires_at=datetime.now() - timedelta(seconds=1)
        )
        result = Mock()
        result.scalar_one_or_none.return_value = expired_session
        self.db.execute = AsyncMock(return_value=result)
        self.app.dependency_overrides[auth_module.get_current_user] = (
            current_user_module.get_current_user
        )

        with patch.object(
            current_user_module, "ensure_fresh_token", new=AsyncMock()
        ) as refresh:
            response = await self.request(
                "GET", "/auth/me", cookies={"session_id": "expired-session"}
            )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()["detail"], "Session expired")
        refresh.assert_not_awaited()

    async def test_me_returns_authenticated_user(self):
        user_id = uuid.uuid4()
        user = SimpleNamespace(
            id=user_id,
            email="user@example.test",
            name="Test User",
            workspaces=[],
        )
        db_session = SimpleNamespace(
            expires_at=datetime.now() + timedelta(minutes=5), user=user
        )
        result = Mock()
        result.scalar_one_or_none.return_value = db_session
        self.db.execute = AsyncMock(return_value=result)
        self.db.get.return_value = user
        self.app.dependency_overrides[auth_module.get_current_user] = (
            current_user_module.get_current_user
        )

        with patch.object(
            current_user_module,
            "ensure_fresh_token",
            new=AsyncMock(return_value="access-token"),
        ) as refresh:
            response = await self.request(
                "GET", "/auth/me", cookies={"session_id": "active-session"}
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"id": str(user_id), "email": "user@example.test", "name": "Test User"},
        )
        refresh.assert_awaited_once_with("active-session")


if __name__ == "__main__":
    unittest.main()
