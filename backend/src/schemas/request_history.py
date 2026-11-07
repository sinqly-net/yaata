from typing import Optional, Any, Dict
from uuid import UUID

from pydantic import ConfigDict

from schemas.base_schema import BaseSchema


class RequestHistoryDTO(BaseSchema):
    model_config = ConfigDict(extra="ignore")
    ok: bool
    status: int
    status_text: str
    headers: Optional[Dict[str, Any]] = None
    body: Optional[Any] = None
    error: Optional[Any] = None
    request_data: Optional[Dict[str, Any]] = None
    duration_ms: Optional[int] = None
    request_id: UUID
