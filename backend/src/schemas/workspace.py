from typing import Optional, List

from pydantic import ConfigDict

from schemas.base_schema import BaseSchema
from schemas.collection import CollectionDTO
from schemas.user import UserDTO
from schemas.workspace_access import WorkspaceAccessRights


class WorkspaceDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    created_user: Optional[UserDTO]
    collections: List[CollectionDTO]


class WorkspaceAccessDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    workspace: WorkspaceDTO
    permissions: WorkspaceAccessRights
