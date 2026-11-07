from enum import Enum
from typing import Optional
from pydantic import BaseModel, ConfigDict

from schemas.base_schema import BaseSchema
from schemas.user import UserDTO


class WorkspaceAccessRights(str, Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"


class WorkspaceMemberDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    user: Optional[UserDTO] = None
    permissions: WorkspaceAccessRights


class ShareWorkspaceRequest(BaseModel):
    email: str
    permissions: WorkspaceAccessRights = WorkspaceAccessRights.READ
