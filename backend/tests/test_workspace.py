import unittest
from datetime import datetime
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock

from fastapi import HTTPException
from models.user import User
from models.workspace import Workspace
from models.workspace_access import WorkspaceAccess
from schemas.workspace import WorkspaceCreateDTO, WorkspaceUpdateDTO
from schemas.workspace_access import ShareWorkspaceRequest, WorkspaceAccessRights
from router.workspace import (
    create_workspace,
    update_workspace,
    get_workspaces_with_access,
    share_workspace,
    list_workspace_access,
    revoke_workspace_access
)


class TestWorkspaceRouter(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.user = User(
            id=uuid4(),
            email="developer@example.com",
            name="Developer",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

    async def test_create_workspace_success(self):
        db = AsyncMock()
        db.add = MagicMock()
        data = WorkspaceCreateDTO(name="Production APIs")

        mock_access = WorkspaceAccess(
            id=uuid4(),
            user_id=self.user.id,
            workspace_id=uuid4(),
            permissions="write",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        mock_access.workspace = Workspace(
            id=mock_access.workspace_id,
            name="Production APIs",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        res_mock = MagicMock()
        res_mock.scalar_one.return_value = mock_access
        db.execute.return_value = res_mock

        result = await create_workspace(data=data, user=self.user, db=db)
        self.assertEqual(result.workspace.name, "Production APIs")
        db.add.assert_called()
        db.commit.assert_awaited()

    async def test_create_workspace_empty_name(self):
        db = AsyncMock()
        data = WorkspaceCreateDTO(name="   ")

        with self.assertRaises(HTTPException) as ctx:
            await create_workspace(data=data, user=self.user, db=db)
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_update_workspace_success(self):
        db = AsyncMock()
        ws_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Old Name",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        access = WorkspaceAccess(
            id=uuid4(),
            user_id=self.user.id,
            workspace_id=ws_id,
            permissions="write",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        ws_res = MagicMock()
        ws_res.scalar_one_or_none.return_value = workspace

        access_res = MagicMock()
        access_res.scalar_one_or_none.return_value = access

        db.execute.side_effect = [ws_res, access_res]

        data = WorkspaceUpdateDTO(name="New Staging Workspace")
        result = await update_workspace(workspace_id=ws_id, data=data, user=self.user, db=db)

        self.assertEqual(result.name, "New Staging Workspace")
        db.commit.assert_awaited()

    async def test_update_workspace_forbidden(self):
        db = AsyncMock()
        ws_id = uuid4()
        other_user_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Protected Name",
            created_by=other_user_id,
            creation_user=None,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        access = WorkspaceAccess(
            id=uuid4(),
            user_id=self.user.id,
            workspace_id=ws_id,
            permissions="read",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        ws_res = MagicMock()
        ws_res.scalar_one_or_none.return_value = workspace

        access_res = MagicMock()
        access_res.scalar_one_or_none.return_value = access

        db.execute.side_effect = [ws_res, access_res]

        data = WorkspaceUpdateDTO(name="Unauthorized Edit")
        with self.assertRaises(HTTPException) as ctx:
            await update_workspace(workspace_id=ws_id, data=data, user=self.user, db=db)
        self.assertEqual(ctx.exception.status_code, 403)

    async def test_share_workspace_success(self):
        db = AsyncMock()
        ws_id = uuid4()
        target_user_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Team Workspace",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        target_user = User(
            id=target_user_id,
            email="colleague@example.com",
            name="Colleague",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )

        db.get.return_value = workspace
        access_res = MagicMock()
        access_res.scalar_one_or_none.return_value = None

        target_user_res = MagicMock()
        target_user_res.scalar_one_or_none.return_value = target_user

        target_access_res = MagicMock()
        target_access_res.scalar_one_or_none.return_value = None

        db.execute.side_effect = [access_res, target_user_res, target_access_res]
        db.add = MagicMock()

        req = ShareWorkspaceRequest(email="colleague@example.com", permissions=WorkspaceAccessRights.WRITE)
        result = await share_workspace(workspace_id=ws_id, req=req, user=self.user, db=db)

        self.assertEqual(result.user.email, "colleague@example.com")
        self.assertEqual(result.permissions, WorkspaceAccessRights.WRITE)
        db.add.assert_called()
        db.commit.assert_awaited()

    async def test_share_workspace_self_forbidden(self):
        db = AsyncMock()
        ws_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Personal Workspace",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.get.return_value = workspace

        access_res = MagicMock()
        access_res.scalar_one_or_none.return_value = None

        target_user_res = MagicMock()
        target_user_res.scalar_one_or_none.return_value = self.user

        db.execute.side_effect = [access_res, target_user_res]

        req = ShareWorkspaceRequest(email="developer@example.com")
        with self.assertRaises(HTTPException) as ctx:
            await share_workspace(workspace_id=ws_id, req=req, user=self.user, db=db)
        self.assertEqual(ctx.exception.status_code, 400)

    async def test_list_workspace_access(self):
        db = AsyncMock()
        ws_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Shared Workspace",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.get.return_value = workspace

        access_check_res = MagicMock()
        access_check_res.scalar_one_or_none.return_value = None

        mock_item = WorkspaceAccess(
            id=uuid4(),
            user_id=self.user.id,
            workspace_id=ws_id,
            permissions="write",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        mock_item.user = self.user

        access_list_res = MagicMock()
        access_list_res.scalars.return_value.all.return_value = [mock_item]

        db.execute.side_effect = [access_check_res, access_list_res]

        result = await list_workspace_access(workspace_id=ws_id, user=self.user, db=db)
        self.assertEqual(len(result), 1)
        self.assertEqual(result[0].user.email, "developer@example.com")

    async def test_revoke_workspace_access_success(self):
        db = AsyncMock()
        ws_id = uuid4()
        target_user_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Shared Workspace",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.get.return_value = workspace

        user_access_res = MagicMock()
        user_access_res.scalar_one_or_none.return_value = None

        target_access = WorkspaceAccess(
            id=uuid4(),
            user_id=target_user_id,
            workspace_id=ws_id,
            permissions="read",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        target_access_res = MagicMock()
        target_access_res.scalar_one_or_none.return_value = target_access

        db.execute.side_effect = [user_access_res, target_access_res]

        result = await revoke_workspace_access(workspace_id=ws_id, user_id=target_user_id, user=self.user, db=db)
        self.assertEqual(result["message"], "Access revoked successfully")
        db.delete.assert_called_with(target_access)
        db.commit.assert_awaited()

    async def test_revoke_workspace_access_cannot_revoke_owner(self):
        db = AsyncMock()
        ws_id = uuid4()
        workspace = Workspace(
            id=ws_id,
            name="Shared Workspace",
            created_by=self.user.id,
            creation_user=self.user,
            collections=[],
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        db.get.return_value = workspace

        user_access_res = MagicMock()
        user_access_res.scalar_one_or_none.return_value = None
        db.execute.return_value = user_access_res

        with self.assertRaises(HTTPException) as ctx:
            await revoke_workspace_access(workspace_id=ws_id, user_id=self.user.id, user=self.user, db=db)
        self.assertEqual(ctx.exception.status_code, 400)


if __name__ == '__main__':
    unittest.main()
