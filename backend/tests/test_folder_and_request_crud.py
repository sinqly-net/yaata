import unittest
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from models.folder import Folder
from models.request import Request
from models.user import User
from schemas.folder import FolderCreateDTO, FolderUpdateDTO
from schemas.methode import HttpMethod
from schemas.request import RequestCreateDTO, RequestUpdateDTO
from router.folder import create_folder, update_folder, delete_folder, dissolve_folder
from router.request import create_request, update_request, duplicate_request, delete_request


class TestFolderAndRequestCRUD(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.user = User(
            id=uuid.uuid4(),
            email="test@example.com",
            name="Test User",
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
        self.mock_db = AsyncMock()
        self.mock_db.add = MagicMock()
        self.mock_db.delete = AsyncMock()

    async def test_create_folder(self):
        dto = FolderCreateDTO(name="New Folder", collection_id=uuid.uuid4())
        self.mock_db.get.return_value = MagicMock()
        mock_result = MagicMock()
        mock_result.scalar_one.return_value = Folder(
            id=uuid.uuid4(),
            name="New Folder",
            created_at=datetime.now()
        )
        self.mock_db.execute.return_value = mock_result

        result = await create_folder(dto, self.user, self.mock_db)
        self.assertEqual(result.name, "New Folder")
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    async def test_update_folder(self):
        folder_id = uuid.uuid4()
        folder = Folder(id=folder_id, name="Old Name", created_at=datetime.now())
        self.mock_db.get.return_value = folder

        dto = FolderUpdateDTO(name="Renamed Folder")
        result = await update_folder(folder_id, dto, self.user, self.mock_db)
        self.assertEqual(result.name, "Renamed Folder")
        self.mock_db.commit.assert_called_once()

    async def test_delete_folder(self):
        folder_id = uuid.uuid4()
        folder = Folder(id=folder_id, name="To Delete", created_at=datetime.now())
        self.mock_db.get.return_value = folder

        # Mock child queries returning empty lists
        mock_res = MagicMock()
        mock_res.scalars().all.return_value = []
        self.mock_db.execute.return_value = mock_res

        result = await delete_folder(folder_id, self.user, self.mock_db)
        self.assertEqual(result["id"], folder_id)
        self.mock_db.delete.assert_called_with(folder)
        self.mock_db.commit.assert_called_once()

    async def test_create_request(self):
        folder_id = uuid.uuid4()
        self.mock_db.get.return_value = Folder(id=folder_id, name="Target Folder", created_at=datetime.now())

        dto = RequestCreateDTO(
            name="New Request",
            folder_id=folder_id,
            url="https://api.example.com",
            method=HttpMethod.POST
        )
        result = await create_request(dto, self.user, self.mock_db)
        self.assertEqual(result.name, "New Request")
        self.assertEqual(result.method, "POST")
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    async def test_duplicate_request(self):
        req_id = uuid.uuid4()
        folder_id = uuid.uuid4()
        orig = Request(
            id=req_id,
            name="Original Req",
            url="https://api.example.com",
            method="GET",
            folder_id=folder_id,
            created_at=datetime.now()
        )
        self.mock_db.get.return_value = orig

        result = await duplicate_request(req_id, self.user, self.mock_db)
        self.assertEqual(result.name, "Original Req (Kopie)")
        self.assertEqual(result.folder_id, folder_id)
        self.mock_db.add.assert_called_once()
        self.mock_db.commit.assert_called_once()

    async def test_delete_request(self):
        req_id = uuid.uuid4()
        req = Request(id=req_id, name="To Delete", folder_id=uuid.uuid4(), method="GET", created_at=datetime.now())
        self.mock_db.get.return_value = req

        mock_hist_res = MagicMock()
        mock_hist_res.scalars().all.return_value = []
        self.mock_db.execute.return_value = mock_hist_res

        result = await delete_request(req_id, self.user, self.mock_db)
        self.assertEqual(result["id"], req_id)
        self.mock_db.delete.assert_called_with(req)
        self.mock_db.commit.assert_called_once()


if __name__ == "__main__":
    unittest.main()
