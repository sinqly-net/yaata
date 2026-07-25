from datetime import datetime, timezone

from pony.orm import Optional, Required
from pony.orm import PrimaryKey

from models import db
from models.user import User


class Session(db.Entity):
    id = PrimaryKey(str)
    user = Required(User)
    access_token = Required(str)
    refresh_token = Optional(str)
    id_token = Optional(str)
    csrf_token = Required(str)
    access_token_expires_at = Required(datetime)
    expires_at = Required(datetime)
    created_at = Required(datetime, default=datetime.now(timezone.utc))
