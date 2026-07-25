from pydantic import BaseModel


class SessionConfig(BaseModel):
    cookie_name: str = "session_id"
    cookie_secure: bool = True
    cookie_samesite: str = "lax"
    lifetime_seconds: int = 60 * 60 * 8
