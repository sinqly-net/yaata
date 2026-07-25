from pydantic import BaseModel, HttpUrl, SecretStr


class OIDCConfig(BaseModel):
    issuer: HttpUrl
    client_id: str
    client_secret: SecretStr
    scopes: list[str] = ["openid", "profile", "email"]
    post_logout_redirect_uri: HttpUrl | None = None
