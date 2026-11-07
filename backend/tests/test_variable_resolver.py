import unittest
from datetime import datetime
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

from models.request import Request as DBRequest
from models.request_history import RequestHistory
from services.variable_resolver import VariableResolver, _traverse_json, _traverse_xml


class TestVariableResolver(unittest.IsolatedAsyncioTestCase):
    def test_json_traversal(self):
        data = {
            "token": "secret123",
            "data": {
                "user": {
                    "id": 101,
                    "name": "Alice"
                },
                "items": [
                    {"name": "item1"},
                    {"name": "item2"}
                ]
            }
        }

        self.assertEqual(_traverse_json(data, ["token"]), "secret123")
        self.assertEqual(_traverse_json(data, ["data", "user", "name"]), "Alice")
        self.assertEqual(_traverse_json(data, ["data", "items", "1", "name"]), "item2")
        self.assertEqual(_traverse_json(data, ["data", "items[0]", "name"]), "item1")
        self.assertIsNone(_traverse_json(data, ["nonexistent"]))

    def test_xml_traversal(self):
        xml_str = """<?xml version="1.0" encoding="UTF-8"?>
        <response>
            <status>success</status>
            <auth_token>xml_token_789</auth_token>
            <user id="42">
                <name>Felix</name>
                <roles>
                    <role>admin</role>
                    <role>developer</role>
                </roles>
            </user>
        </response>
        """

        self.assertEqual(_traverse_xml(xml_str, ["auth_token"]), "xml_token_789")
        self.assertEqual(_traverse_xml(xml_str, ["response", "auth_token"]), "xml_token_789")
        self.assertEqual(_traverse_xml(xml_str, ["user", "name"]), "Felix")
        self.assertEqual(_traverse_xml(xml_str, ["user", "@id"]), "42")
        self.assertEqual(_traverse_xml(xml_str, ["user", "id"]), "42")
        self.assertEqual(_traverse_xml(xml_str, ["user", "roles", "role[1]"]), "developer")

    async def test_resolve_from_history_json(self):
        history = RequestHistory(
            id=uuid4(),
            ok=True,
            status=200,
            status_text="OK",
            headers={"Authorization": "Bearer abc", "Content-Type": "application/json"},
            body={"access_token": "jwt_token_123", "user": {"id": "usr_99"}},
            request_data={},
            duration_ms=45,
            request_id=uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "access_token"), "jwt_token_123")
        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "body.user.id"), "usr_99")
        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "status"), 200)
        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "headers.authorization"), "Bearer abc")
        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "duration_ms"), 45)

    async def test_resolve_from_history_xml(self):
        xml_str = "<auth><token>xml_secret_key</token></auth>"
        history = RequestHistory(
            id=uuid4(),
            ok=True,
            status=201,
            status_text="Created",
            headers={"Content-Type": "application/xml"},
            body=xml_str,
            request_data={},
            duration_ms=60,
            request_id=uuid4(),
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "token"), "xml_secret_key")
        self.assertEqual(await VariableResolver.resolve_value_from_history(history, "auth.token"), "xml_secret_key")


if __name__ == '__main__':
    unittest.main()
