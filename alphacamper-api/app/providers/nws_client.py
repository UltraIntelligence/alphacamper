from __future__ import annotations

from typing import Any

from app.providers.base import BaseHTTPClient


class NwsClient(BaseHTTPClient):
    """Official National Weather Service alerts client."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="nws",
            base_url="https://api.weather.gov",
            default_headers={
                "Accept": "application/geo+json",
            },
        )

    async def list_active_alerts(
        self,
        *,
        area: str | None = None,
        zone: str | None = None,
    ) -> dict[str, Any]:
        params: dict[str, str] = {}
        if area:
            params["area"] = area
        if zone:
            params["zone"] = zone
        return await self._request("GET", "/alerts/active", params=params)
