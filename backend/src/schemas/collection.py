from typing import List

from pydantic import ConfigDict

from schemas.base_schema import BaseSchema
from schemas.folder import FolderDTO


class CollectionDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    folders: List[FolderDTO]
