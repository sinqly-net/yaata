import asyncio
from datetime import datetime, timedelta

import requests
from sqlalchemy import delete

from config import config
from models.db import async_session_factory
from models.session import Session as DBSession
from utils.token_endpoint import call_token_endpoint

_refresh_locks: dict[str, asyncio.Lock] = {}


def _lock_for(session_id: str) -> asyncio.Lock:
    return _refresh_locks.setdefault(session_id, asyncio.Lock())


def _refresh_request_sync(token_endpoint: str, refresh_token: str) -> requests.Response:
    return requests.post(
        token_endpoint,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": config.oidc.client_id,
            "client_secret": config.oidc.client_secret.get_secret_value(),
        },
        timeout=10,
    )


async def ensure_fresh_token(session_id: str) -> str:
    lock = _lock_for(session_id)
    async with lock:
        async with async_session_factory() as db:
            db_sess = await db.get(DBSession, session_id)
            if not db_sess:
                raise ValueError("Session not found")
            if db_sess.access_token_expires_at > datetime.now() + timedelta(
                    seconds=30
            ):
                return db_sess.access_token
            if not db_sess.refresh_token:
                raise ValueError("No refresh token available, re-login required")
            refresh_token = db_sess.refresh_token

        resp = await call_token_endpoint(
            {
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
                "client_id": config.oidc.client_id,
                "client_secret": config.oidc.client_secret.get_secret_value(),
            }
        )
        if resp.status_code != 200:
            async with async_session_factory() as db:
                await db.execute(delete(DBSession).where(DBSession.id == session_id))
                await db.commit()
            raise ValueError("Refresh failed, re-login required")

        token = resp.json()
        async with async_session_factory() as db:
            db_sess = await db.get(DBSession, session_id)
            if not db_sess:
                raise ValueError("Session disappeared during refresh")
            db_sess.access_token = token["access_token"]
            db_sess.refresh_token = token.get("refresh_token", refresh_token)
            if token.get("id_token"):
                db_sess.id_token = token["id_token"]
            db_sess.access_token_expires_at = datetime.now() + timedelta(
                seconds=token.get("expires_in", 300)
            )
            await db.commit()
            return db_sess.access_token
