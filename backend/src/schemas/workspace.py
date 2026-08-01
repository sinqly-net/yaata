from typing import Optional, List

from schemas.base_schema import BaseSchema
from schemas.workspace_access import WorkspaceAccessRights


class WorkspaceDTO(BaseSchema):
    name: str
    created_by: Optional[object]
    collections: List
    access: List


class WorkspaceAccessDTO(BaseSchema):
    workspace_id: WorkspaceDTO
    user_id: object
    permissions: WorkspaceAccessRights
