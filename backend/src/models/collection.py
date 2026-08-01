from pony.orm import Required, Set

from models.workspace import Workspace
from .db import db, BaseTableEntity


class Collection(db.Entity, metaclass=BaseTableEntity):
    name = Required(str)
    folders = Set('Folder')
    workspace_id = Required(Workspace)
