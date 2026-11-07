from enum import Enum
from typing import Optional
from pydantic import ConfigDict

from schemas.base_schema import BaseSchema
from schemas.user import UserDTO


class CollectionAccessRights(str, Enum):
    READ = "read"
    WRITE = "write"
    ADMIN = "admin"


class CollectionAccessDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    user: Optional[UserDTO] = None
    permissions: CollectionAccessRights


class ShareCollectionRequest(BaseSchema):
    email: str
    permissions: CollectionAccessRights = CollectionAccessRights.READ
