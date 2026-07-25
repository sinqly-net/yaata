import asyncio
import secrets
from datetime import datetime, timedelta

import requests
from authlib.common.security import generate_token
from authlib.integrations.requests_client import OAuth2Session
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pony.orm import db_session

from config import config
from models.session import Session as DBSession
from models.user import User
from schemas.current_user import CurrentUser
from utils.current_user import get_current_user
from utils.discovery import discovery_cache
from utils.token_endpoint import call_token_endpoint

router = APIRouter(prefix="/auth")
_pending_flows: dict[str, dict] = {}


def redirect_uri() -> str:
    return f"{str(config.host).rstrip('/')}/api/auth/callback"


def _build_session() -> OAuth2Session:
    return OAuth2Session(
        client_id=config.oidc.client_id,
        client_secret=config.oidc.client_secret.get_secret_value(),
        scope=" ".join(config.oidc.scopes),
        redirect_uri=redirect_uri(),
        code_challenge_method="S256",
    )


@router.get("/login")
async def login():
    discovery = await discovery_cache.get()

    def _create_url():
        session = _build_session()
        verifier = generate_token(48)  # PKCE code_verifier selbst erzeugen
        uri, state = session.create_authorization_url(
            discovery["authorization_endpoint"], code_verifier=verifier
        )
        return uri, state, verifier

    uri, state, verifier = await asyncio.to_thread(_create_url)
    _pending_flows[state] = {"code_verifier": verifier, "created_at": datetime.utcnow()}
    return RedirectResponse(uri)


@router.get("/callback")
async def callback(code: str, state: str):
    flow = _pending_flows.pop(state, None)
    if not flow:
        raise HTTPException(400, "Invalid or expired state")

    resp = await call_token_endpoint(
        {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": redirect_uri(),
            "client_id": config.oidc.client_id,
            "client_secret": config.oidc.client_secret.get_secret_value(),
            "code_verifier": flow["code_verifier"],
        }
    )
    if resp.status_code != 200:
        raise HTTPException(400, "Token exchange failed")
    token = resp.json()

    discovery = await discovery_cache.get()

    def _get_userinfo():
        r = requests.get(
            discovery["userinfo_endpoint"],
            headers={"Authorization": f"Bearer {token['access_token']}"},
            timeout=10,
        )
        r.raise_for_status()
        return r.json()

    userinfo = await asyncio.to_thread(_get_userinfo)

    with db_session:
        user = User.get(id=userinfo["sub"]) or User(
            id=userinfo["sub"], email=userinfo.get("email"), name=userinfo.get("name")
        )
        session_id = secrets.token_urlsafe(32)
        csrf_token = secrets.token_urlsafe(32)
        DBSession(
            id=session_id,
            user=user,
            access_token=token["access_token"],
            refresh_token=token.get("refresh_token"),
            id_token=token.get("id_token"),
            csrf_token=csrf_token,
            access_token_expires_at=datetime.utcnow()
            + timedelta(seconds=token.get("expires_in", 300)),
            expires_at=datetime.utcnow()
            + timedelta(seconds=config.session.lifetime_seconds),
        )

    redirect = RedirectResponse(str(config.host))
    redirect.set_cookie(
        config.session.cookie_name,
        session_id,
        httponly=True,
        secure=config.session.cookie_secure,
        samesite=config.session.cookie_samesite,
        max_age=config.session.lifetime_seconds,
    )
    redirect.set_cookie(
        "csrf_token",
        csrf_token,
        httponly=False,
        secure=config.session.cookie_secure,
        samesite=config.session.cookie_samesite,
        max_age=config.session.lifetime_seconds,
    )
    return redirect


@router.get("/me")
def me(user: CurrentUser = Depends(get_current_user)):
    return {"id": user.id, "email": user.email, "name": user.name}
