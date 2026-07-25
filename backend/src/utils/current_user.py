from datetime import datetime

from fastapi import Request, HTTPException
from pony.orm import db_session

from config import config
from models.session import Session as DBSession
from models.user import User
from schemas.current_user import CurrentUser
from .token_refresh import ensure_fresh_token


async def get_current_user(request: Request) -> CurrentUser:
    session_id = request.cookies.get(config.session.cookie_name)
    if not session_id:
        raise HTTPException(401, "Not authenticated")

    with db_session:
        db_sess = DBSession.get(id=session_id)
        if not db_sess or db_sess.expires_at < datetime.utcnow():
            raise HTTPException(401, "Session expired")
        user_id = db_sess.user.id

    try:
        await ensure_fresh_token(session_id)
    except ValueError:
        raise HTTPException(401, "Session expired, please log in again")

    with db_session:
        user = User.get(id=user_id)
        if not user:
            raise HTTPException(401, "User not found")
        return CurrentUser(id=user.id, email=user.email, name=user.name)
