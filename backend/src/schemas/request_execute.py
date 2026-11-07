from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from pydantic import BaseModel, Field

from schemas.methode import HttpMethod


class KeyValueDTO(BaseModel):
    key: Optional[str] = ""
    value: Optional[str] = ""
    active: Optional[bool] = True


class RequestExecuteDTO(BaseModel):
    id: Optional[UUID] = None
    name: Optional[str] = None
    url: str
    method: str = "GET"
    headers: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    query_params: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    body: Optional[Any] = None
