from __future__ import annotations

import base64
import binascii
import json
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from models.user import User

header_key = "Authorization"

bearer_scheme = HTTPBearer(
    scheme_name="BearerAuth",
    description="JWT Access Token",
    auto_error=True,
)


def _decode_jwt_payload(token: str) -> dict:
    parts = token.split(".")
    if len(parts) != 3:
        raise ValueError("Not a valid JWT-format (header.payload.signature)")

    payload_b64 = parts[1]
    padding = "=" * (-len(payload_b64) % 4)
    try:
        payload_bytes = base64.urlsafe_b64decode(payload_b64 + padding)
        return json.loads(payload_bytes)
    except (binascii.Error, json.JSONDecodeError) as exc:
        raise ValueError("Error while decoding jwt token!") from exc


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer_scheme)],
) -> User:
    try:
        claims = _decode_jwt_payload(credentials.credentials)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(exc),
            headers={header_key: "Bearer"},
        ) from exc

    sub: str | None = claims.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token doesn't have a 'sub'-Claim",
            headers={header_key: "Bearer"},
        )

    return User(
        id=sub,
        email=claims.get("email"),
        roles=claims.get("aud", []),
        raw_claims=claims,
        email_verified=claims.get("email_verified"),
        name=claims.get("name"),
        preferred_username=claims.get("preferred_username"),
        given_name=claims.get("given_name"),
        family_name=claims.get("family_name"),
    )


CurrentUser = Annotated[User, Depends(get_current_user)]
