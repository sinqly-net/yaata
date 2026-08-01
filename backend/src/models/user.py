from pony.orm import Optional, Set
from pony.orm import PrimaryKey

from .db import db


class User(db.Entity):
    id = PrimaryKey(str)
    email = Optional(str)
    name = Optional(str)
    sessions = Set('Session')  # models/session.py
    workspaces = Set('WorkspaceAccess')
    workspaces_created = Set('Workspace')
