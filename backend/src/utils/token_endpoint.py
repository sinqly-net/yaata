import asyncio

import requests

from .discovery import discovery_cache


def _post_sync(token_endpoint: str, data: dict) -> requests.Response:
    return requests.post(token_endpoint, data=data, timeout=10)


async def call_token_endpoint(data: dict) -> requests.Response:
    """POST an den Token-Endpoint, mit einmaligem Retry bei geändertem Endpoint (404)."""
    discovery = await discovery_cache.get()
    resp = await asyncio.to_thread(_post_sync, discovery["token_endpoint"], data)
    if resp.status_code == 404:
        discovery = await discovery_cache.refresh_now()
        resp = await asyncio.to_thread(_post_sync, discovery["token_endpoint"], data)
    return resp
