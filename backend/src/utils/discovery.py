import asyncio
import time

import requests

from config import config


class DiscoveryCache:
    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._data: dict | None = None
        self._fetched_at: float = 0.0
        self._lock = asyncio.Lock()

    def _fetch_sync(self) -> dict:
        resp = requests.get(
            f"{config.oidc.issuer}/.well-known/openid-configuration", timeout=10
        )
        resp.raise_for_status()
        return resp.json()

    async def get(self) -> dict:
        now = time.monotonic()
        if self._data is not None and (now - self._fetched_at) < self._ttl:
            return self._data

        async with self._lock:
            now = time.monotonic()
            if self._data is not None and (now - self._fetched_at) < self._ttl:
                return self._data

            self._data = await asyncio.to_thread(self._fetch_sync)
            self._fetched_at = now
            return self._data

    async def refresh_now(self) -> dict:
        self._data = None
        return await self.get()


discovery_cache = DiscoveryCache(ttl_seconds=3600)
