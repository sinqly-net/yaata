from pydantic import BaseModel, Field


class User(BaseModel):
    id: str = Field(..., description="User-ID from Bearer Token")
    email: str | None = None
    roles: list[str] = Field(default_factory=list)
    raw_claims: dict = Field(default_factory=dict, exclude=True)
    email_verified: bool | None = None
    name: str | None = None
    preferred_username: str | None = None
    given_name: str | None = None
    family_name: str | None = None
