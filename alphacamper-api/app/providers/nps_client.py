from __future__ import annotations

from typing import Any

from app.core.config import settings
from app.providers.base import BaseHTTPClient


class NpsClient(BaseHTTPClient):
    """Official National Park Service API client for park, campground, and alert enrichment."""

    def __init__(self, api_key: str | None = None) -> None:
        super().__init__(
            provider_name="nps",
            base_url="https://developer.nps.gov/api/v1",
            default_headers={"X-Api-Key": api_key or settings.nps_api_key or ""},
        )

    async def list_parks(
        self,
        *,
        state_code: str | None = None,
        park_code: str | None = None,
        limit: int = 50,
        start: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "start": start}
        if state_code:
            params["stateCode"] = state_code
        if park_code:
            params["parkCode"] = park_code
        return await self._request("GET", "/parks", params=params)

    async def list_campgrounds(
        self,
        *,
        state_code: str | None = None,
        park_code: str | None = None,
        limit: int = 50,
        start: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "start": start}
        if state_code:
            params["stateCode"] = state_code
        if park_code:
            params["parkCode"] = park_code
        return await self._request("GET", "/campgrounds", params=params)

    async def list_alerts(
        self,
        *,
        park_code: str | None = None,
        state_code: str | None = None,
        limit: int = 50,
        start: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "start": start}
        if park_code:
            params["parkCode"] = park_code
        if state_code:
            params["stateCode"] = state_code
        return await self._request("GET", "/alerts", params=params)

