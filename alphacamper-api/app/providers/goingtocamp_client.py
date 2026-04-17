from __future__ import annotations

from datetime import date
from typing import Any

from app.models.enums import AvailabilityStatus
from app.providers.base import BaseHTTPClient

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def format_gtc_date(value: date) -> str:
    return f"{str(value.year)[2:]}-{MONTH_NAMES[value.month - 1]}-{value.day:02d}"


class GoingToCampClient(BaseHTTPClient):
    """
    Generic GoingToCamp-style availability client.

    This is aimed at the public JSON endpoints used by some provincial and regional
    park systems. We keep the interface generic so each domain can be plugged in
    with a provider record and a small domain config.
    """

    def __init__(self, domain: str) -> None:
        super().__init__(
            provider_name=f"goingtocamp:{domain}",
            base_url=f"https://{domain}",
            default_headers={
                "Accept-Language": "en-US",
                "Content-Type": "application/json",
            },
        )
        self.domain = domain

    async def list_recreation_areas(self) -> list[dict[str, Any]]:
        # TODO: add per-domain catalog feeds as we validate each white-label domain.
        return []

    async def list_campgrounds(self, recreation_area: str | None = None) -> list[dict[str, Any]]:
        # TODO: add per-domain catalog feeds as we validate each white-label domain.
        return []

    async def list_campsites(
        self,
        campground_map_id: int,
        *,
        start_date: date,
        end_date: date,
        party_size: int = 1,
    ) -> list[dict[str, Any]]:
        payload = await self._request(
            "POST",
            "/api/maps/mapdatabyid",
            json_body={
                "mapId": campground_map_id,
                "startDate": format_gtc_date(start_date),
                "endDate": format_gtc_date(end_date),
                "partySize": party_size,
            },
        )
        resources = payload.get("resourceAvailabilities", [])
        items: list[dict[str, Any]] = []
        for resource in resources:
            items.append(
                {
                    "external_campsite_id": str(resource.get("resourceId")),
                    "site_name": ((resource.get("site") or {}).get("name")),
                    "raw_payload": resource,
                }
            )
        return items

    async def get_availability(
        self,
        campground_map_id: int,
        *,
        start_date: date,
        end_date: date,
        equipment_type: str | None = None,
        party_size: int = 1,
    ) -> list[dict[str, Any]]:
        payload = await self._request(
            "POST",
            "/api/maps/mapdatabyid",
            json_body={
                "mapId": campground_map_id,
                "startDate": format_gtc_date(start_date),
                "endDate": format_gtc_date(end_date),
                "partySize": party_size,
                "equipmentType": equipment_type,
            },
        )
        resources = payload.get("resourceAvailabilities", [])
        snapshots: list[dict[str, Any]] = []
        for resource in resources:
            availabilities = resource.get("availabilities", {})
            for raw_date, raw_status in availabilities.items():
                stay_date = date.fromisoformat(raw_date[:10])
                if stay_date < start_date or stay_date > end_date:
                    continue
                snapshots.append(
                    {
                        "external_campsite_id": str(resource.get("resourceId")),
                        "site_name": ((resource.get("site") or {}).get("name")),
                        "date": stay_date,
                        "status": self._map_status(str(raw_status)),
                        "raw_payload": resource,
                    }
                )
        return snapshots

    @staticmethod
    def _map_status(raw_status: str) -> AvailabilityStatus:
        normalized = raw_status.upper()
        if normalized == "AVAILABLE":
            return AvailabilityStatus.AVAILABLE
        if normalized in {"RESERVED", "BOOKED"}:
            return AvailabilityStatus.RESERVED
        if normalized == "CLOSED":
            return AvailabilityStatus.CLOSED
        if normalized in {"UNAVAILABLE", "NOT_AVAILABLE"}:
            return AvailabilityStatus.UNAVAILABLE
        return AvailabilityStatus.UNKNOWN
