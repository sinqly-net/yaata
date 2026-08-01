from typing import Optional

from pydantic import ConfigDict

from schemas.base_schema import BaseSchema
from schemas.methode import HttpMethod


class RequestDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    url: Optional[str]
    body: Optional[dict]
    query_params: Optional[dict]
    headers: Optional[dict]
    method: HttpMethod
