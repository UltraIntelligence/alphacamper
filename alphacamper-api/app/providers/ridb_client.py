from __future__ import annotations

from typing import Any

from app.core.config import settings
from app.providers.base import BaseHTTPClient


class RidbClient(BaseHTTPClient):
    """
    Official Recreation Information Database metadata client.

    RIDB is where we pull structural metadata first: recreation areas, facilities,
    and campsites. Live availability is handled separately.
    """

    def __init__(self, api_key: str | None = None) -> None:
        super().__init__(
            provider_name="ridb",
            base_url="https://ridb.recreation.gov/api/v1",
            default_headers={"apikey": api_key or settings.ridb_api_key or ""},
        )

    async def list_recareas(
        self,
        *,
        state: str | None = None,
        keyword: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "offset": offset}
        if state:
            params["state"] = state
        if keyword:
            params["query"] = keyword
        return await self._request("GET", "/recareas", params=params)

    async def list_facilities(
        self,
        *,
        state: str | None = None,
        activity: str | None = None,
        keyword: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "offset": offset}
        if state:
            params["state"] = state
        if activity:
            params["activity"] = activity
        if keyword:
            params["query"] = keyword
        return await self._request("GET", "/facilities", params=params)

    async def list_campgrounds(
        self,
        *,
        state: str | None = None,
        keyword: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        # RIDB generally models campgrounds as facilities. This method keeps the
        # user-facing interface clean while we map through the official facility feed.
        return await self.list_facilities(
            state=state,
            keyword=keyword,
            activity="CAMPING",
            limit=limit,
            offset=offset,
        )

    async def get_facility(self, facility_id: str | int) -> dict[str, Any]:
        return await self._request("GET", f"/facilities/{facility_id}")

    async def list_campsites(
        self,
        facility_id: str | int,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> dict[str, Any]:
        params = {"limit": limit, "offset": offset}
        return await self._request("GET", f"/facilities/{facility_id}/campsites", params=params)

    async def get_campsite(self, campsite_id: str | int) -> dict[str, Any]:
        return await self._request("GET", f"/campsites/{campsite_id}")

