from __future__ import annotations

from datetime import date
from typing import Any

from app.providers.base import SessionBootstrapper
from app.providers.camis_client import CamisClient


class ParksCanadaClient(CamisClient):
    """
    Parks Canada reservation client.

    The booking site currently behaves like the CAMIS-style APIs already used in
    Alphacamper's worker. We keep this as its own class because product-wise it is
    a first-tier provider with its own ingestion and alert priority.
    """

    def __init__(self, session_bootstrapper: SessionBootstrapper | None = None) -> None:
        super().__init__(
            provider_name="parks_canada",
            domain="reservation.pc.gc.ca",
            session_bootstrapper=session_bootstrapper,
        )

    @staticmethod
    def _map_status(code: int | None) -> Any:
        # Parks Canada uses code 2 for off-season / not operating responses where
        # BC and Ontario currently tend to use 6. We normalize that to "closed".
        if code == 2:
            from app.models.enums import AvailabilityStatus

            return AvailabilityStatus.CLOSED
        return CamisClient._map_status(code)

    async def list_parks(self) -> list[dict[str, Any]]:
        campgrounds = await self.list_resource_locations()
        parks: dict[str, dict[str, Any]] = {}
        for item in campgrounds:
            localized = (item.get("localizedValues") or [{}])[0]
            full_name = localized.get("fullName") or localized.get("shortName") or ""
            park_name = full_name.split(" - ")[0].strip() if " - " in full_name else full_name.strip()
            if not park_name:
                continue
            parks.setdefault(
                park_name,
                {
                    "name": park_name,
                    "country": "CA",
                    "source": "parks_canada_resource_location",
                },
            )
        return list(parks.values())

    async def list_campgrounds(self) -> list[dict[str, Any]]:
        rows = await self.list_resource_locations()
        items: list[dict[str, Any]] = []
        for row in rows:
            localized = (row.get("localizedValues") or [{}])[0]
            items.append(
                {
                    "external_facility_id": str(row.get("resourceLocationId")),
                    "root_map_id": row.get("rootMapId"),
                    "name": localized.get("fullName") or localized.get("shortName"),
                    "short_name": localized.get("shortName"),
                    "booking_url": (
                        "https://reservation.pc.gc.ca/create-booking/results"
                        f"?resourceLocationId={row.get('resourceLocationId')}"
                    ),
                    "raw_payload": row,
                }
            )
        return items

    async def list_campsites(
        self,
        *,
        resource_location_id: int,
        root_map_id: int,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        # TODO: enrich with site names from a verified map metadata endpoint once we confirm
        # the exact public JSON contract after session bootstrap is in place.
        snapshots = await self.get_availability(
            resource_location_id=resource_location_id,
            root_map_id=root_map_id,
            start_date=start_date,
            end_date=end_date,
        )
        seen: dict[str, dict[str, Any]] = {}
        for item in snapshots:
            seen.setdefault(
                item["external_campsite_id"],
                {
                    "external_campsite_id": item["external_campsite_id"],
                    "site_name": item["external_campsite_id"],
                    "site_number": item["external_campsite_id"],
                },
            )
        return list(seen.values())
