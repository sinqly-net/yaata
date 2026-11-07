from typing import List, Optional
from uuid import UUID

from pydantic import ConfigDict, BaseModel

from schemas.base_schema import BaseSchema
from schemas.request import RequestDTO


class FolderCreateDTO(BaseModel):
    name: str
    collection_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None


class FolderUpdateDTO(BaseModel):
    name: str


class FolderDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    collection_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    folders: List['FolderDTO'] = []
    requests: List[RequestDTO] = []
