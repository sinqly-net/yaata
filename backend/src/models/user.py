from pony.orm import Optional, Set
from pony.orm import PrimaryKey

from models import db


class User(db.Entity):
    id = PrimaryKey(str)
    email = Optional(str)
    name = Optional(str)
    sessions = Set('Session')  # models/session.py
