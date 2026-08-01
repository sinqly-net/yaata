from datetime import datetime

from fastapi import Request, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from config import config
from models.db import get_db
from models.session import Session as DBSession
from models.user import User
from .token_refresh import ensure_fresh_token


async def get_current_user(
        request: Request, db: AsyncSession = Depends(get_db)
) -> User:
    session_id = request.cookies.get(config.session.cookie_name)
    if not session_id:
        raise HTTPException(401, "Not authenticated")

    result = await db.execute(
        select(DBSession)
        .where(DBSession.id == session_id)
        .options(selectinload(DBSession.user))
    )
    db_sess = result.scalar_one_or_none()
    if not db_sess or db_sess.expires_at < datetime.now():
        raise HTTPException(401, "Session expired")

    user_id = db_sess.user.id

    try:
        await ensure_fresh_token(session_id)
    except ValueError:
        raise HTTPException(401, "Session expired, please log in again")

    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(401, "User not found")
    return user
