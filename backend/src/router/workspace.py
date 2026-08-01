from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from models import User, get_db
from schemas.workspace import WorkspaceAccessDTO
from utils.current_user import get_current_user

router = APIRouter(prefix="/workspace", tags=["WORKSPACE"])


@router.get("/access", response_model=List[WorkspaceAccessDTO])
async def get_workspaces_with_access(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns a list of all workspaces the requesting user has access to.
    """
    print([col.folders for col in user.workspaces[0].workspace.collections])
    return user.workspaces
