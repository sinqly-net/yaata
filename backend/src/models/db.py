import uuid
from datetime import datetime, timezone

from pony.orm import Database, PrimaryKey, Optional, core

db = Database()


class BaseTableEntity(core.EntityMeta):
    def __new__(metacls, name, bases, attrs):
        attrs["id"] = PrimaryKey(uuid.UUID, default=uuid.uuid4)
        attrs["created_at"] = Optional(datetime, default=datetime.now(timezone.utc))
        attrs["updated_at"] = Optional(datetime)
        return super().__new__(metacls, name, bases, attrs)
