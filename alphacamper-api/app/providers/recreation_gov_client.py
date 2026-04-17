from __future__ import annotations

from collections import defaultdict
from datetime import date
from typing import Any

from app.models.enums import AvailabilityStatus
from app.providers.base import BaseHTTPClient


class RecGovAvailabilityClient(BaseHTTPClient):
    """Public Recreation.gov availability reader. Read-only. Never book."""

    def __init__(self) -> None:
        super().__init__(
            provider_name="recreation_gov",
            base_url="https://www.recreation.gov/api/camps/availability",
        )

    async def get_month(self, facility_id: str | int, month_start: date) -> dict[str, Any]:
        start_date = month_start.strftime("%Y-%m-01T00:00:00.000Z")
        return await self._request(
            "GET",
            f"/campground/{facility_id}/month",
            params={"start_date": start_date},
        )

    async def get_availability(
        self,
        facility_id: str | int,
        *,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        months: list[date] = []
        cursor = date(start_date.year, start_date.month, 1)
        while cursor <= end_date:
            months.append(cursor)
            if cursor.month == 12:
                cursor = date(cursor.year + 1, 1, 1)
            else:
                cursor = date(cursor.year, cursor.month + 1, 1)

        snapshots: list[dict[str, Any]] = []
        for month_start in months:
            payload = await self.get_month(facility_id, month_start)
            campsites = payload.get("campsites", {})
            for campsite_id, campsite_data in campsites.items():
                site_name = campsite_data.get("site")
                availabilities = campsite_data.get("availabilities", {})
                for raw_date, raw_status in availabilities.items():
                    stay_date = date.fromisoformat(raw_date[:10])
                    if stay_date < start_date or stay_date > end_date:
                        continue
                    snapshots.append(
                        {
                            "external_campsite_id": str(campsite_id),
                            "site_name": site_name,
                            "date": stay_date,
                            "status": self._map_status(str(raw_status)),
                            "raw_payload": {
                                "availability": raw_status,
                                "facility_id": str(facility_id),
                            },
                        }
                    )
        return snapshots

    @staticmethod
    def _map_status(raw_status: str) -> AvailabilityStatus:
        normalized = raw_status.lower()
        if normalized == "available":
            return AvailabilityStatus.AVAILABLE
        if normalized == "reserved":
            return AvailabilityStatus.RESERVED
        if normalized == "closed":
            return AvailabilityStatus.CLOSED
        if normalized == "not available":
            return AvailabilityStatus.UNAVAILABLE
        return AvailabilityStatus.UNKNOWN
