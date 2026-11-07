import uuid
from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.collection import Collection
from models.db import get_db
from models.folder import Folder
from models.request import Request
from models.request_history import RequestHistory
from models.user import User
from schemas.folder import FolderDTO, FolderCreateDTO, FolderUpdateDTO
from utils.current_user import get_current_user

router = APIRouter(prefix="/folder", tags=["FOLDER"])


@router.post("", response_model=FolderDTO)
async def create_folder(
    data: FolderCreateDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new folder either at the collection root or as a child of another folder.
    """
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    if not data.collection_id and not data.parent_id:
        raise HTTPException(status_code=400, detail="Either collection_id or parent_id must be provided")

    parent_folder = None
    if data.parent_id:
        parent_folder = await db.get(Folder, data.parent_id)
        if not parent_folder:
            raise HTTPException(status_code=404, detail="Parent folder not found")

    if data.collection_id:
        collection = await db.get(Collection, data.collection_id)
        if not collection:
            raise HTTPException(status_code=404, detail="Collection not found")

    folder = Folder(
        id=uuid.uuid4(),
        name=name,
        collection_id=data.collection_id if not data.parent_id else None,
        parent_id=data.parent_id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(folder)
    await db.commit()

    res = await db.execute(
        select(Folder)
        .where(Folder.id == folder.id)
        .options(
            selectinload(Folder.folders),
            selectinload(Folder.requests)
        )
    )
    created = res.scalar_one()
    return created


@router.put("/{folder_id}", response_model=FolderDTO)
async def update_folder(
    folder_id: UUID,
    data: FolderUpdateDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates a folder's name.
    """
    name = data.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    folder.name = name
    folder.updated_at = datetime.now()
    await db.commit()
    await db.refresh(folder)
    return folder


async def _delete_folder_recursive(folder: Folder, db: AsyncSession):
    """
    Recursively deletes a folder, all its child folders, requests, and history.
    """
    # Load children
    child_folders_res = await db.execute(select(Folder).where(Folder.parent_id == folder.id))
    child_folders = child_folders_res.scalars().all()
    for child in child_folders:
        await _delete_folder_recursive(child, db)

    # Load and delete requests
    requests_res = await db.execute(select(Request).where(Request.folder_id == folder.id))
    requests = requests_res.scalars().all()
    for req in requests:
        # Delete history
        histories_res = await db.execute(select(RequestHistory).where(RequestHistory.request_id == req.id))
        for hist in histories_res.scalars().all():
            await db.delete(hist)
        await db.delete(req)

    await db.delete(folder)


@router.delete("/{folder_id}")
async def delete_folder(
    folder_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a folder and all its contents (requests and subfolders).
    """
    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    await _delete_folder_recursive(folder, db)
    await db.commit()
    return {"message": "Folder deleted successfully", "id": folder_id}


@router.post("/{folder_id}/dissolve")
async def dissolve_folder(
    folder_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Dissolves a folder by moving its child requests and subfolders up to the parent level,
    then deleting the folder.
    """
    folder = await db.get(Folder, folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    # Fetch child folders and requests
    child_folders_res = await db.execute(select(Folder).where(Folder.parent_id == folder.id))
    child_folders = child_folders_res.scalars().all()

    requests_res = await db.execute(select(Request).where(Request.folder_id == folder.id))
    requests = requests_res.scalars().all()

    if folder.parent_id:
        target_folder_id = folder.parent_id
        for req in requests:
            req.folder_id = target_folder_id
        for child in child_folders:
            child.parent_id = target_folder_id
    elif folder.collection_id:
        # It's a root folder in collection
        target_collection_id = folder.collection_id
        for child in child_folders:
            child.parent_id = None
            child.collection_id = target_collection_id

        if requests:
            if child_folders:
                # Move requests to the first child folder which now becomes root
                for req in requests:
                    req.folder_id = child_folders[0].id
            else:
                # Find another sibling root folder in the same collection
                sibling_res = await db.execute(
                    select(Folder).where(
                        and_(
                            Folder.collection_id == target_collection_id,
                            Folder.id != folder.id
                        )
                    )
                )
                sibling = sibling_res.scalars().first()
                if sibling:
                    for req in requests:
                        req.folder_id = sibling.id
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Cannot dissolve the only folder with requests. Delete it or create another folder first."
                    )

    await db.delete(folder)
    await db.commit()
    return {"message": "Folder dissolved successfully", "id": folder_id}
