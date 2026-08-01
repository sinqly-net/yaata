import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class BaseSchema(BaseModel):
    id: Optional[UUID]
    created_at: Optional[datetime.datetime]
    updated_at: Optional[datetime.datetime]
