from typing import List

from pydantic import ConfigDict

from schemas.base_schema import BaseSchema
from schemas.request import RequestDTO


class FolderDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    folders: List['FolderDTO']
    requests: List[RequestDTO]
