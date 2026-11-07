from typing import Optional, List, Any
from uuid import UUID

from pydantic import ConfigDict, BaseModel

from schemas.base_schema import BaseSchema
from schemas.methode import HttpMethod


class RequestCreateDTO(BaseModel):
    name: str
    folder_id: UUID
    url: Optional[str] = ""
    body: Optional[Any] = None
    query_params: Optional[List[dict]] = None
    headers: Optional[List[dict]] = None
    method: Optional[HttpMethod] = HttpMethod.GET


class RequestUpdateDTO(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    body: Optional[Any] = None
    query_params: Optional[List[dict]] = None
    headers: Optional[List[dict]] = None
    method: Optional[HttpMethod] = None
    folder_id: Optional[UUID] = None


class RequestDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    name: str
    url: Optional[str] = None
    body: Optional[Any] = None
    query_params: Optional[List[dict]] = None
    headers: Optional[List[dict]] = None
    method: HttpMethod
    folder_id: Optional[UUID] = None
