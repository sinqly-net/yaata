from pony.orm.core import Required

from schemas.workspace_access import WorkspaceAccessRights
from .db import db, BaseTableEntity
from .user import User
from .workspace import Workspace


class WorkspaceAccess(db.Entity, metaclass=BaseTableEntity):
    workspace_id = Required(Workspace)
    user_id = Required(User)
    permissions = Required(str, default=WorkspaceAccessRights.READ.value)  # enum WorkspaceAccessRights
