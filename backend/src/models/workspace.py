from pony.orm import Required, Set

from .db import db, BaseTableEntity
from .user import User


class Workspace(db.Entity, metaclass=BaseTableEntity):
    name = Required(str)
    collections = Set('Collection')
    created_by = Required(User)
    access = Set('WorkspaceAccess')
