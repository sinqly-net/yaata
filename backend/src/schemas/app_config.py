from typing import Optional

from pydantic import BaseModel, HttpUrl, field_validator

from schemas.db import DBConfig
from schemas.debug import DebugConfig, defaultDebugConfig
from schemas.oidc import OIDCConfig
from schemas.session_config import SessionConfig


class AppConfig(BaseModel):
    version: float
    host: HttpUrl
    oidc: OIDCConfig
    session: SessionConfig = SessionConfig()
    db: DBConfig
    debug: Optional[DebugConfig] = defaultDebugConfig

    @field_validator("host", mode="before")
    @classmethod
    def strip_trailing_slash(cls, v: str) -> str:
        return v.rstrip("/") if isinstance(v, str) else v
