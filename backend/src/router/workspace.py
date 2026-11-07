import uuid
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models import User, get_db
from models.workspace import Workspace
from models.workspace_access import WorkspaceAccess
from schemas.user import UserDTO
from schemas.workspace import WorkspaceAccessDTO, WorkspaceCreateDTO, WorkspaceUpdateDTO, WorkspaceDTO
from schemas.workspace_access import WorkspaceAccessRights, ShareWorkspaceRequest, WorkspaceMemberDTO
from utils.current_user import get_current_user

router = APIRouter(prefix="/workspace", tags=["WORKSPACE"])


@router.get("/access", response_model=List[WorkspaceAccessDTO])
async def get_workspaces_with_access(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Returns a list of all workspaces the requesting user has access to.
    """
    return user.workspaces


@router.post("", response_model=WorkspaceAccessDTO)
async def create_workspace(
    data: WorkspaceCreateDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new workspace and grants the creator write access.
    """
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name cannot be empty")

    workspace = Workspace(
        id=uuid.uuid4(),
        name=name,
        created_by=user.id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(workspace)
    await db.flush()

    access = WorkspaceAccess(
        id=uuid.uuid4(),
        user_id=user.id,
        workspace_id=workspace.id,
        permissions=WorkspaceAccessRights.WRITE.value,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(access)
    await db.commit()

    res = await db.execute(
        select(WorkspaceAccess)
        .where(WorkspaceAccess.id == access.id)
        .options(
            selectinload(WorkspaceAccess.workspace).selectinload(Workspace.creation_user),
            selectinload(WorkspaceAccess.workspace).selectinload(Workspace.collections)
        )
    )
    created_access = res.scalar_one()
    return created_access


@router.put("/{workspace_id}", response_model=WorkspaceDTO)
async def update_workspace(
    workspace_id: UUID,
    data: WorkspaceUpdateDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates a workspace's name if the user has write access or is the creator.
    """
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Workspace name cannot be empty")

    res = await db.execute(
        select(Workspace)
        .where(Workspace.id == workspace_id)
        .options(
            selectinload(Workspace.creation_user),
            selectinload(Workspace.collections)
        )
    )
    workspace = res.scalar_one_or_none()
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == user.id
            )
        )
    )
    access = access_res.scalar_one_or_none()
    is_owner = (workspace.created_by == user.id)
    has_write = (access is not None and access.permissions == WorkspaceAccessRights.WRITE.value)

    if not (is_owner or has_write):
        raise HTTPException(status_code=403, detail="Not authorized to edit this workspace")

    workspace.name = name
    workspace.updated_at = datetime.now()
    await db.commit()
    await db.refresh(workspace)
    return workspace


@router.post("/{workspace_id}/share", response_model=WorkspaceMemberDTO)
async def share_workspace(
    workspace_id: UUID,
    req: ShareWorkspaceRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Shares a workspace with another user by email.
    """
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check permission of requesting user (owner or write/admin access)
    access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == user.id
            )
        )
    )
    user_access = access_res.scalar_one_or_none()
    is_owner = (workspace.created_by == user.id)
    has_permission = is_owner or (
        user_access is not None and user_access.permissions in [WorkspaceAccessRights.WRITE.value, WorkspaceAccessRights.ADMIN.value]
    )
    if not has_permission:
        raise HTTPException(status_code=403, detail="Not authorized to share this workspace")

    target_user_res = await db.execute(
        select(User).where(User.email == req.email.strip())
    )
    target_user = target_user_res.scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail=f"User with email '{req.email}' not found")

    if target_user.id == user.id:
        raise HTTPException(status_code=400, detail="Cannot share workspace with yourself")

    # Check if access already exists
    target_access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == target_user.id
            )
        )
    )
    existing_access = target_access_res.scalar_one_or_none()

    if existing_access:
        existing_access.permissions = req.permissions.value
        existing_access.updated_at = datetime.now()
        access_entity = existing_access
    else:
        access_entity = WorkspaceAccess(
            id=uuid.uuid4(),
            user_id=target_user.id,
            workspace_id=workspace_id,
            permissions=req.permissions.value,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        db.add(access_entity)

    await db.commit()
    await db.refresh(access_entity)

    return WorkspaceMemberDTO(
        id=access_entity.id,
        permissions=WorkspaceAccessRights(access_entity.permissions),
        user=UserDTO(
            id=target_user.id,
            email=target_user.email,
            name=target_user.name,
            created_at=target_user.created_at,
            updated_at=target_user.updated_at
        ),
        created_at=access_entity.created_at,
        updated_at=access_entity.updated_at
    )


@router.get("/{workspace_id}/access", response_model=List[WorkspaceMemberDTO])
async def list_workspace_access(
    workspace_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Lists users who have access to this workspace.
    """
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Check if user has access to this workspace
    access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == user.id
            )
        )
    )
    is_owner = (workspace.created_by == user.id)
    if not (is_owner or access_res.scalar_one_or_none() is not None):
        raise HTTPException(status_code=403, detail="Not authorized to view access for this workspace")

    res = await db.execute(
        select(WorkspaceAccess)
        .where(WorkspaceAccess.workspace_id == workspace_id)
        .options(selectinload(WorkspaceAccess.user))
    )
    access_list = res.scalars().all()

    return [
        WorkspaceMemberDTO(
            id=item.id,
            permissions=WorkspaceAccessRights(item.permissions),
            user=UserDTO(
                id=item.user.id,
                email=item.user.email,
                name=item.user.name,
                created_at=item.user.created_at,
                updated_at=item.user.updated_at
            ) if item.user else None,
            created_at=item.created_at,
            updated_at=item.updated_at
        )
        for item in access_list
    ]


@router.delete("/{workspace_id}/access/{user_id}")
async def revoke_workspace_access(
    workspace_id: UUID,
    user_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Revokes workspace access for a user.
    """
    workspace = await db.get(Workspace, workspace_id)
    if not workspace:
        raise HTTPException(status_code=404, detail="Workspace not found")

    access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == user.id
            )
        )
    )
    user_access = access_res.scalar_one_or_none()
    is_owner = (workspace.created_by == user.id)
    has_permission = is_owner or (
        user_access is not None and user_access.permissions in [WorkspaceAccessRights.WRITE.value, WorkspaceAccessRights.ADMIN.value]
    )
    if not has_permission:
        raise HTTPException(status_code=403, detail="Not authorized to manage access for this workspace")

    if user_id == workspace.created_by:
        raise HTTPException(status_code=400, detail="Cannot revoke access of workspace owner")

    target_access_res = await db.execute(
        select(WorkspaceAccess).where(
            and_(
                WorkspaceAccess.workspace_id == workspace_id,
                WorkspaceAccess.user_id == user_id
            )
        )
    )
    access_item = target_access_res.scalar_one_or_none()
    if not access_item:
        raise HTTPException(status_code=404, detail="Access record not found")

    await db.delete(access_item)
    await db.commit()
    return {"message": "Access revoked successfully"}
