import uuid
from datetime import datetime
from typing import List, Union
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.db import get_db
from models.folder import Folder
from models.request import Request as DBRequest
from models.request_history import RequestHistory
from models.user import User
from schemas.request import RequestDTO, RequestCreateDTO, RequestUpdateDTO
from schemas.request_execute import RequestExecuteDTO
from schemas.request_history import RequestHistoryDTO
from services.request_execution_service import RequestExecutionService
from utils.current_user import get_current_user

router = APIRouter(prefix="/request", tags=["REQUEST"])


@router.post("", response_model=RequestDTO)
async def create_request(
    dto: RequestCreateDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a new HTTP request in a designated folder.
    """
    name = dto.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Request name cannot be empty")

    folder = await db.get(Folder, dto.folder_id)
    if not folder:
        raise HTTPException(status_code=404, detail="Target folder not found")

    method_val = dto.method.value if hasattr(dto.method, 'value') else (dto.method or "GET")

    new_req = DBRequest(
        id=uuid.uuid4(),
        name=name,
        url=dto.url or "",
        method=method_val.upper(),
        headers=dto.headers,
        query_params=dto.query_params,
        body=dto.body,
        folder_id=dto.folder_id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(new_req)
    await db.commit()
    await db.refresh(new_req)
    return new_req


@router.post("/execute", response_model=RequestHistoryDTO)
async def execute_request(
    dto: RequestExecuteDTO,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Executes an HTTP request securely from the backend and persists results & snapshot in DB.
    """
    return await RequestExecutionService.execute_request(dto, db, user.id)


@router.get("/{request_id}/history", response_model=List[RequestHistoryDTO])
async def get_request_history(
    request_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches execution history for a given request.
    """
    return await RequestExecutionService.get_history_for_request(request_id, db)


@router.get("/history/{history_id}", response_model=RequestHistoryDTO)
async def get_history_detail(
    history_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetches a specific execution history record.
    """
    item = await RequestExecutionService.get_history_by_id(history_id, db)
    if not item:
        raise HTTPException(status_code=404, detail="History record not found")
    return item


@router.put("/{request_id}", response_model=RequestDTO)
async def update_request(
    request_id: UUID,
    dto: Union[RequestUpdateDTO, RequestExecuteDTO],
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Updates request parameters (name, method, url, headers, query_params, body, folder_id).
    """
    db_req = await db.get(DBRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")

    if dto.name is not None:
        db_req.name = dto.name.strip()
    if dto.url is not None:
        db_req.url = dto.url
    if dto.method is not None:
        method_str = dto.method.value if hasattr(dto.method, 'value') else str(dto.method)
        db_req.method = method_str.upper()
    if dto.headers is not None:
        db_req.headers = dto.headers
    if dto.query_params is not None:
        db_req.query_params = dto.query_params
    if dto.body is not None:
        db_req.body = dto.body
    if hasattr(dto, 'folder_id') and dto.folder_id is not None:
        folder = await db.get(Folder, dto.folder_id)
        if not folder:
            raise HTTPException(status_code=404, detail="Target folder not found")
        db_req.folder_id = dto.folder_id

    db_req.updated_at = datetime.now()
    await db.commit()
    await db.refresh(db_req)
    return db_req


@router.post("/{request_id}/duplicate", response_model=RequestDTO)
async def duplicate_request(
    request_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Duplicates an existing request within the same folder.
    """
    orig = await db.get(DBRequest, request_id)
    if not orig:
        raise HTTPException(status_code=404, detail="Request not found")

    clone = DBRequest(
        id=uuid.uuid4(),
        name=f"{orig.name} (Kopie)",
        url=orig.url,
        method=orig.method,
        headers=orig.headers,
        query_params=orig.query_params,
        body=orig.body,
        folder_id=orig.folder_id,
        created_at=datetime.now(),
        updated_at=datetime.now()
    )
    db.add(clone)
    await db.commit()
    await db.refresh(clone)
    return clone


@router.delete("/{request_id}")
async def delete_request(
    request_id: UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Deletes a request and its execution history.
    """
    db_req = await db.get(DBRequest, request_id)
    if not db_req:
        raise HTTPException(status_code=404, detail="Request not found")

    histories_res = await db.execute(select(RequestHistory).where(RequestHistory.request_id == request_id))
    for hist in histories_res.scalars().all():
        await db.delete(hist)

    await db.delete(db_req)
    await db.commit()
    return {"message": "Request deleted successfully", "id": request_id}
