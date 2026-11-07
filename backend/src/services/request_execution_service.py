import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from uuid import UUID

import httpx
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession

from models.request import Request as DBRequest
from models.request_history import RequestHistory
from schemas.request_execute import RequestExecuteDTO
from schemas.request_history import RequestHistoryDTO
from services.variable_resolver import VariableResolver


class RequestExecutionService:
    @staticmethod
    def _normalize_headers(headers_input: Optional[Any]) -> Dict[str, str]:
        normalized: Dict[str, str] = {}
        if not headers_input:
            return normalized

        if isinstance(headers_input, list):
            for item in headers_input:
                if isinstance(item, dict):
                    # Check if disabled is True or active is False
                    if item.get("disabled", False) is True:
                        continue
                    if item.get("active", True) is False:
                        continue
                    key = str(item.get("key", "")).strip()
                    val = str(item.get("value", ""))
                    if key:
                        normalized[key] = val
        elif isinstance(headers_input, dict):
            for k, v in headers_input.items():
                if k:
                    normalized[str(k)] = str(v)
        return normalized

    @staticmethod
    def _normalize_query_params(params_input: Optional[Any]) -> List[tuple[str, str]]:
        normalized: List[tuple[str, str]] = []
        if not params_input:
            return normalized

        if isinstance(params_input, list):
            for item in params_input:
                if isinstance(item, dict):
                    if item.get("disabled", False) is True:
                        continue
                    if item.get("active", True) is False:
                        continue
                    key = str(item.get("key", "")).strip()
                    val = str(item.get("value", ""))
                    if key:
                        normalized.append((key, val))
        elif isinstance(params_input, dict):
            for k, v in params_input.items():
                if k:
                    normalized.append((str(k), str(v)))
        return normalized

    @classmethod
    async def execute_request(
        cls,
        dto: RequestExecuteDTO,
        db: AsyncSession,
        user_id: Optional[UUID] = None
    ) -> RequestHistoryDTO:
        # Dynamic variable resolution across other requests' results
        var_cache: Dict[str, Optional[RequestHistory]] = {}
        resolved_url = await VariableResolver.resolve_text(dto.url, db, var_cache)
        resolved_headers = await VariableResolver.resolve_structure(dto.headers, db, var_cache)
        resolved_params = await VariableResolver.resolve_structure(dto.query_params, db, var_cache)
        resolved_body = await VariableResolver.resolve_structure(dto.body, db, var_cache)

        url = resolved_url.strip()
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"http://{url}"

        method = dto.method.upper() if dto.method else "GET"
        headers = cls._normalize_headers(resolved_headers)
        params = cls._normalize_query_params(resolved_params)

        body_data = resolved_body
        json_payload = None
        content_payload = None

        if body_data is not None and method not in ["GET", "HEAD"]:
            if isinstance(body_data, (dict, list)):
                json_payload = body_data
            elif isinstance(body_data, str) and body_data.strip():
                try:
                    json_payload = json.loads(body_data)
                except Exception:
                    content_payload = body_data.encode("utf-8")

        start_time = time.perf_counter()
        duration_ms = 0

        ok = False
        status_code = 0
        status_text = ""
        res_headers: Dict[str, str] = {}
        res_body: Any = None
        res_error: Any = None

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
                req_kwargs: Dict[str, Any] = {
                    "headers": headers,
                    "params": params,
                }
                if json_payload is not None:
                    req_kwargs["json"] = json_payload
                elif content_payload is not None:
                    req_kwargs["content"] = content_payload

                response = await client.request(method, url, **req_kwargs)

                duration_ms = int((time.perf_counter() - start_time) * 1000)
                status_code = response.status_code
                status_text = response.reason_phrase or str(status_code)
                ok = 200 <= status_code < 400

                res_headers = dict(response.headers)

                # Try parsing body
                try:
                    res_body = response.json()
                except Exception:
                    try:
                        res_body = response.text
                    except Exception:
                        res_body = str(response.content[:1000])

        except Exception as ex:
            duration_ms = int((time.perf_counter() - start_time) * 1000)
            ok = False
            status_code = 0
            status_text = "Error"
            res_error = {
                "message": str(ex),
                "type": type(ex).__name__
            }

        # Snapshot of the request configuration
        request_snapshot = {
            "id": str(dto.id) if dto.id else None,
            "name": dto.name,
            "url": dto.url,
            "method": method,
            "headers": dto.headers,
            "query_params": dto.query_params,
            "body": dto.body,
        }

        # Find or link DB Request
        target_request_id = dto.id
        if target_request_id:
            db_req = await db.get(DBRequest, target_request_id)
            if db_req:
                # Update current request state with latest sent config
                db_req.url = dto.url
                db_req.method = method
                db_req.headers = dto.headers
                db_req.query_params = dto.query_params
                db_req.body = dto.body
                db_req.updated_at = datetime.now()
            else:
                target_request_id = None

        if not target_request_id:
            # Check if there is any request in DB or create a fallback request entity
            res = await db.execute(select(DBRequest).limit(1))
            fallback_req = res.scalar_one_or_none()
            if fallback_req:
                target_request_id = fallback_req.id
            else:
                # If no request exists at all, we don't fail, but let's check
                target_request_id = uuid.uuid4()

        history_entry = RequestHistory(
            id=uuid.uuid4(),
            ok=ok,
            status=status_code,
            status_text=status_text,
            headers=res_headers,
            body=res_body,
            error=res_error,
            request_data=request_snapshot,
            duration_ms=duration_ms,
            request_id=target_request_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )

        db.add(history_entry)
        await db.commit()
        await db.refresh(history_entry)

        return RequestHistoryDTO(
            id=history_entry.id,
            ok=history_entry.ok,
            status=history_entry.status,
            status_text=history_entry.status_text,
            headers=history_entry.headers,
            body=history_entry.body,
            error=history_entry.error,
            request_data=history_entry.request_data,
            duration_ms=history_entry.duration_ms,
            request_id=history_entry.request_id,
            created_at=history_entry.created_at,
            updated_at=history_entry.updated_at,
        )

    @staticmethod
    async def get_history_for_request(
        request_id: UUID,
        db: AsyncSession,
        limit: int = 50
    ) -> List[RequestHistoryDTO]:
        stmt = (
            select(RequestHistory)
            .where(RequestHistory.request_id == request_id)
            .order_by(desc(RequestHistory.created_at))
            .limit(limit)
        )
        res = await db.execute(stmt)
        entries = res.scalars().all()

        return [
            RequestHistoryDTO(
                id=item.id,
                ok=item.ok,
                status=item.status,
                status_text=item.status_text,
                headers=item.headers,
                body=item.body,
                error=item.error,
                request_data=item.request_data,
                duration_ms=item.duration_ms,
                request_id=item.request_id,
                created_at=item.created_at,
                updated_at=item.updated_at,
            )
            for item in entries
        ]

    @staticmethod
    async def get_history_by_id(
        history_id: UUID,
        db: AsyncSession
    ) -> Optional[RequestHistoryDTO]:
        item = await db.get(RequestHistory, history_id)
        if not item:
            return None

        return RequestHistoryDTO(
            id=item.id,
            ok=item.ok,
            status=item.status,
            status_text=item.status_text,
            headers=item.headers,
            body=item.body,
            error=item.error,
            request_data=item.request_data,
            duration_ms=item.duration_ms,
            request_id=item.request_id,
            created_at=item.created_at,
            updated_at=item.updated_at,
        )
