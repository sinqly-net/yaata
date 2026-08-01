from typing import List

from fastapi import APIRouter, Depends
from pony.orm.core import db_session

from models import User
from schemas.workspace import WorkspaceAccessDTO
from utils.current_user import get_current_user

router = APIRouter(prefix="/me", tags=["ME"])


@router.get("/access", response_model=List[WorkspaceAccessDTO])
@db_session
def get_workspaces_with_access(user: User = Depends(get_current_user)):
    """
    Returns a list of all workspaces the requesting user has access to.
    """
    return []
