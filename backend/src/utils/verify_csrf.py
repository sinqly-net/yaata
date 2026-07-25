from fastapi import Request, HTTPException
from pony.orm import db_session

from config import config
from models.session import Session as DBSession


def verify_csrf(request: Request):
    if request.method in ("GET", "HEAD", "OPTIONS"):
        return
    session_id = request.cookies.get(config.session.cookie_name)
    header_token = request.headers.get("x-csrf-token")
    with db_session:
        db_sess = DBSession.get(id=session_id)
        if not db_sess or db_sess.csrf_token != header_token:
            raise HTTPException(403, "CSRF check failed")
