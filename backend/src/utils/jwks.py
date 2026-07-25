import asyncio
import time

import requests

from discovery import discovery_cache


class JWKSCache:
    def __init__(self, ttl_seconds: int = 3600):
        self._ttl = ttl_seconds
        self._keys: dict | None = None
        self._fetched_at: float = 0.0
        self._lock = asyncio.Lock()

    def _fetch_sync(self, jwks_uri: str) -> dict:
        resp = requests.get(jwks_uri, timeout=10)
        resp.raise_for_status()
        return resp.json()

    async def get_keys(self) -> dict:
        now = time.monotonic()
        if self._keys is not None and (now - self._fetched_at) < self._ttl:
            return self._keys
        async with self._lock:
            now = time.monotonic()
            if self._keys is not None and (now - self._fetched_at) < self._ttl:
                return self._keys
            discovery = await discovery_cache.get()
            self._keys = await asyncio.to_thread(
                self._fetch_sync, discovery["jwks_uri"]
            )
            self._fetched_at = now
            return self._keys


jwks_cache = JWKSCache(ttl_seconds=3600)
