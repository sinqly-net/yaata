from typing import Optional, List

from pydantic import BaseModel, ConfigDict

from schemas.base_schema import BaseSchema
from schemas.collection import CollectionDTO
from schemas.user import UserDTO
from schemas.workspace_access import WorkspaceAccessRights


class WorkspaceCreateDTO(BaseModel):
    name: str


class WorkspaceUpdateDTO(BaseModel):
    name: str


class WorkspaceDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    creation_user: Optional[UserDTO] = None
    collections: List[CollectionDTO] = []


class WorkspaceAccessDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    workspace: WorkspaceDTO
    permissions: WorkspaceAccessRights
