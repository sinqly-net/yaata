import json
import re
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Tuple
from uuid import UUID
from sqlalchemy import select, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession

from models.request import Request as DBRequest
from models.request_history import RequestHistory


VAR_PATTERN = re.compile(r"\$\{([^}]+)\}")


def _traverse_json(data: Any, path_segments: List[str]) -> Optional[Any]:
    curr = data
    for seg in path_segments:
        if curr is None:
            return None
        # Handle array index like items[0] or items.0
        seg = seg.strip()
        if not seg:
            continue
        
        # Check if segment contains bracket index e.g. "users[0]"
        bracket_match = re.match(r"^([^\[]+)\[(\d+)\]$", seg)
        if bracket_match:
            prop_name, idx_str = bracket_match.groups()
            idx = int(idx_str)
            if isinstance(curr, dict) and prop_name in curr:
                curr = curr[prop_name]
            else:
                return None
            if isinstance(curr, list) and 0 <= idx < len(curr):
                curr = curr[idx]
            else:
                return None
            continue

        if isinstance(curr, dict):
            if seg in curr:
                curr = curr[seg]
            else:
                # Case-insensitive dict lookup fallback
                found = False
                for k, v in curr.items():
                    if k.lower() == seg.lower():
                        curr = v
                        found = True
                        break
                if not found:
                    return None
        elif isinstance(curr, list):
            try:
                idx = int(seg)
                if 0 <= idx < len(curr):
                    curr = curr[idx]
                else:
                    return None
            except ValueError:
                return None
        else:
            return None

    return curr


def _strip_ns(tag: str) -> str:
    if "}" in tag:
        return tag.split("}", 1)[1]
    return tag


def _traverse_xml(xml_str: str, path_segments: List[str]) -> Optional[str]:
    try:
        root = ET.fromstring(xml_str)
    except Exception:
        return None

    if not path_segments:
        return root.text.strip() if root.text else ""

    # If first segment matches root tag name (without namespace), skip it
    first_seg = path_segments[0].lower()
    root_tag = _strip_ns(root.tag).lower()
    if root_tag == first_seg and len(path_segments) > 1:
        path_segments = path_segments[1:]

    current_elements = [root]

    for i, seg in enumerate(path_segments):
        is_last = (i == len(path_segments) - 1)
        seg_lower = seg.lower()

        # Check for attribute access like @id or attr.id
        if seg_lower.startswith("@"):
            attr_name = seg[1:]
            for elem in current_elements:
                for k, v in elem.attrib.items():
                    if _strip_ns(k).lower() == attr_name.lower():
                        return v
            return None

        # Check for index like tag[0]
        bracket_match = re.match(r"^([^\[]+)\[(\d+)\]$", seg)
        if bracket_match:
            tag_name, idx_str = bracket_match.groups()
            idx = int(idx_str)
            next_elements = []
            for elem in current_elements:
                matching_children = [
                    child for child in elem
                    if _strip_ns(child.tag).lower() == tag_name.lower()
                ]
                if 0 <= idx < len(matching_children):
                    next_elements.append(matching_children[idx])
            current_elements = next_elements
        else:
            next_elements = []
            for elem in current_elements:
                # Check attributes if it's the last segment and attribute exists
                if is_last:
                    for k, v in elem.attrib.items():
                        if _strip_ns(k).lower() == seg_lower:
                            return v
                # Check child elements
                for child in elem:
                    if _strip_ns(child.tag).lower() == seg_lower:
                        next_elements.append(child)
            
            # If no direct child, search recursively for tag if not found
            if not next_elements and len(current_elements) == 1 and current_elements[0] is root:
                for child in root.iter():
                    if _strip_ns(child.tag).lower() == seg_lower:
                        next_elements.append(child)

            current_elements = next_elements

        if not current_elements:
            return None

    if current_elements:
        elem = current_elements[0]
        if elem.text:
            return elem.text.strip()
        # If element has no direct text but has children or is empty
        return ET.tostring(elem, encoding="unicode", method="text").strip()

    return None


class VariableResolver:
    @classmethod
    def extract_variable_expressions(cls, text: str) -> List[Tuple[str, str, str]]:
        """
        Returns list of tuples: (full_match, request_ref, path)
        E.g. "${login.data.token}" -> ("${login.data.token}", "login", "data.token")
        """
        results = []
        for match in VAR_PATTERN.finditer(text):
            full_match = match.group(0)
            inner = match.group(1).strip()
            if "." in inner:
                req_ref, path = inner.split(".", 1)
                results.append((full_match, req_ref.strip(), path.strip()))
            else:
                # Default path is 'body' or entire result
                results.append((full_match, inner.strip(), "body"))
        return results

    @classmethod
    async def resolve_value_from_history(
        cls,
        history: RequestHistory,
        path: str
    ) -> Optional[Any]:
        if not path or path in ["body", "response", "data"]:
            if isinstance(history.body, (dict, list)):
                return history.body
            return str(history.body) if history.body is not None else ""

        path_lower = path.lower()
        if path_lower in ["status", "status_code"]:
            return history.status
        if path_lower == "status_text":
            return history.status_text
        if path_lower == "duration_ms":
            return history.duration_ms
        if path_lower == "duration":
            return f"{history.duration_ms}ms"

        # Headers lookup
        if path_lower.startswith("headers."):
            header_key = path[len("headers."):].strip()
            if history.headers and isinstance(history.headers, dict):
                for k, v in history.headers.items():
                    if k.lower() == header_key.lower():
                        return v
            return None

        # Strip optional "body." prefix if present
        actual_path = path
        if actual_path.lower().startswith("body."):
            actual_path = actual_path[5:]

        # Split path by dot, accounting for brackets
        segments = actual_path.split(".")

        # 1. Try JSON / Dict body
        if isinstance(history.body, (dict, list)):
            val = _traverse_json(history.body, segments)
            if val is not None:
                return val

        # 2. Try JSON string body
        if isinstance(history.body, str):
            body_str = history.body.strip()
            if (body_str.startswith("{") and body_str.endswith("}")) or (body_str.startswith("[") and body_str.endswith("]")):
                try:
                    parsed_json = json.loads(body_str)
                    val = _traverse_json(parsed_json, segments)
                    if val is not None:
                        return val
                except Exception:
                    pass

            # 3. Try XML string body
            if body_str.startswith("<") and body_str.endswith(">"):
                xml_val = _traverse_xml(body_str, segments)
                if xml_val is not None:
                    return xml_val

        # 4. Fallback header lookup if not found in body
        if history.headers and isinstance(history.headers, dict):
            for k, v in history.headers.items():
                if k.lower() == path.lower():
                    return v

        return None

    @classmethod
    async def resolve_text(
        cls,
        text: str,
        db: AsyncSession,
        cache: Optional[Dict[str, Optional[RequestHistory]]] = None
    ) -> str:
        if not text or "${" not in text:
            return text

        if cache is None:
            cache = {}

        var_matches = cls.extract_variable_expressions(text)
        if not var_matches:
            return text

        result = text
        for full_expr, req_ref, path in var_matches:
            history = await cls._get_latest_history_for_ref(req_ref, db, cache)
            if not history:
                continue

            resolved_val = await cls.resolve_value_from_history(history, path)
            if resolved_val is not None:
                if isinstance(resolved_val, (dict, list)):
                    replacement = json.dumps(resolved_val)
                else:
                    replacement = str(resolved_val)
                result = result.replace(full_expr, replacement)

        return result

    @classmethod
    async def _get_latest_history_for_ref(
        cls,
        req_ref: str,
        db: AsyncSession,
        cache: Dict[str, Optional[RequestHistory]]
    ) -> Optional[RequestHistory]:
        cache_key = req_ref.lower().strip()
        if cache_key in cache:
            return cache[cache_key]

        history: Optional[RequestHistory] = None

        # Check if req_ref is a valid UUID
        target_uuid = None
        try:
            target_uuid = UUID(req_ref)
        except Exception:
            pass

        if target_uuid:
            # First check direct request_id on history
            stmt = (
                select(RequestHistory)
                .where(RequestHistory.request_id == target_uuid)
                .order_by(desc(RequestHistory.created_at))
                .limit(1)
            )
            res = await db.execute(stmt)
            history = res.scalar_one_or_none()

        if not history:
            # Search by DBRequest name (case-insensitive or exact, or replaced underscores/spaces)
            name_normalized = req_ref.replace("_", " ").strip()
            name_with_underscores = req_ref.replace(" ", "_").strip()

            stmt = (
                select(DBRequest)
                .where(
                    or_(
                        DBRequest.name.ilike(req_ref),
                        DBRequest.name.ilike(name_normalized),
                        DBRequest.name.ilike(name_with_underscores)
                    )
                )
                .limit(1)
            )
            res = await db.execute(stmt)
            db_req = res.scalar_one_or_none()

            if db_req:
                stmt_hist = (
                    select(RequestHistory)
                    .where(RequestHistory.request_id == db_req.id)
                    .order_by(desc(RequestHistory.created_at))
                    .limit(1)
                )
                res_hist = await db.execute(stmt_hist)
                history = res_hist.scalar_one_or_none()

        cache[cache_key] = history
        return history

    @classmethod
    async def resolve_structure(
        cls,
        data: Any,
        db: AsyncSession,
        cache: Optional[Dict[str, Optional[RequestHistory]]] = None
    ) -> Any:
        if cache is None:
            cache = {}

        if isinstance(data, str):
            # If the entire string is exactly a single ${...} expression, resolve directly (preserving types if dict/list/int)
            trimmed = data.strip()
            if trimmed.startswith("${") and trimmed.endswith("}") and trimmed.count("${") == 1:
                var_matches = cls.extract_variable_expressions(trimmed)
                if var_matches:
                    full_expr, req_ref, path = var_matches[0]
                    if full_expr == trimmed:
                        history = await cls._get_latest_history_for_ref(req_ref, db, cache)
                        if history:
                            resolved_val = await cls.resolve_value_from_history(history, path)
                            if resolved_val is not None:
                                return resolved_val
            return await cls.resolve_text(data, db, cache)

        elif isinstance(data, dict):
            new_dict = {}
            for k, v in data.items():
                resolved_key = await cls.resolve_text(str(k), db, cache) if isinstance(k, str) else k
                resolved_val = await cls.resolve_structure(v, db, cache)
                new_dict[resolved_key] = resolved_val
            return new_dict

        elif isinstance(data, list):
            return [await cls.resolve_structure(item, db, cache) for item in data]

        return data
