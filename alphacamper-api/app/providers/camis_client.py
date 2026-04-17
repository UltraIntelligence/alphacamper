from __future__ import annotations

from datetime import date
from typing import Any

from app.models.enums import AvailabilityStatus
from app.providers.base import BaseHTTPClient, ProviderClientError, SessionBootstrapper


class CamisClient(BaseHTTPClient):
    """
    Shared client for the CAMIS-style public booking APIs used by Parks Canada,
    BC Parks, and Ontario Parks in the current Alphacamper product.

    Important:
    - This is read-only. It only fetches metadata and availability.
    - WAF-backed domains need a session bootstrapper that can return working cookies.
    """

    def __init__(self, *, provider_name: str, domain: str, session_bootstrapper: SessionBootstrapper | None = None) -> None:
        super().__init__(
            provider_name=provider_name,
            base_url=f"https://{domain}",
            default_headers={
                "Accept": "application/json, text/plain, */*",
                "Content-Type": "application/json",
                "app-language": "en-CA",
                "app-version": "5.106.226",
            },
            session_bootstrapper=session_bootstrapper,
        )
        self.domain = domain

    async def list_resource_locations(self) -> list[dict[str, Any]]:
        payload = await self._request("GET", "/api/resourceLocation", require_session=True)
        if not isinstance(payload, list):
            raise ProviderClientError(f"{self.provider_name} resourceLocation payload was not a list")
        return payload

    async def get_cart(self) -> dict[str, Any]:
        return await self._request("GET", "/api/cart", require_session=True)

    async def get_map_availability(
        self,
        *,
        map_id: int,
        start_date: date,
        end_date: date,
        cart_uid: str,
        cart_transaction_uid: str,
    ) -> dict[str, Any]:
        params = {
            "mapId": map_id,
            "bookingCategoryId": 0,
            "equipmentCategoryId": -32768,
            "subEquipmentCategoryId": -32768,
            "cartUid": cart_uid,
            "cartTransactionUid": cart_transaction_uid,
            "bookingUid": "00000000-0000-0000-0000-000000000000",
            "groupHoldUid": "",
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "getDailyAvailability": "true",
            "isReserving": "true",
            "filterData": "[]",
            "boatLength": 0,
            "boatDraft": 0,
            "boatWidth": 0,
            "peopleCapacityCategoryCounts": "[]",
            "numEquipment": 0,
            "seed": f"{start_date.isoformat()}T00:00:00Z",
        }
        return await self._request(
            "GET",
            "/api/availability/map",
            params=params,
            require_session=True,
        )

    async def get_availability(
        self,
        *,
        resource_location_id: int,
        root_map_id: int,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        cart = await self.get_cart()
        cart_uid = cart.get("cartUid")
        transaction_uid = cart.get("createTransactionUid") or cart.get("cartTransactionUid")
        if not cart_uid or not transaction_uid:
            raise ProviderClientError(f"{self.provider_name} cart response missing required IDs")

        root = await self.get_map_availability(
            map_id=root_map_id,
            start_date=start_date,
            end_date=end_date,
            cart_uid=cart_uid,
            cart_transaction_uid=transaction_uid,
        )

        sub_map_ids = [int(map_id) for map_id in root.get("mapLinkAvailabilities", {}).keys()]
        if not sub_map_ids and root.get("resourceAvailabilities"):
            sub_map_ids = [root_map_id]

        snapshots: list[dict[str, Any]] = []
        for sub_map_id in sub_map_ids:
            site_payload = await self.get_map_availability(
                map_id=sub_map_id,
                start_date=start_date,
                end_date=end_date,
                cart_uid=cart_uid,
                cart_transaction_uid=transaction_uid,
            )
            for site_id, nights in site_payload.get("resourceAvailabilities", {}).items():
                current_date = start_date
                for entry in nights:
                    if current_date > end_date:
                        break
                    status_code = entry.get("availability")
                    snapshots.append(
                        {
                            "external_campsite_id": str(site_id),
                            "resource_location_id": resource_location_id,
                            "map_id": sub_map_id,
                            "date": current_date,
                            "status": self._map_status(status_code),
                            "raw_payload": entry,
                        }
                    )
                    current_date = date.fromordinal(current_date.toordinal() + 1)
        return snapshots

    @staticmethod
    def _map_status(code: int | None) -> AvailabilityStatus:
        if code == 0:
            return AvailabilityStatus.AVAILABLE
        if code == 1:
            return AvailabilityStatus.RESERVED
        # Ontario regional CAMIS hosts appear to use 2 for inventory that exists
        # on the map but is not yet released for online booking.
        if code == 2:
            return AvailabilityStatus.NOT_YET_RELEASED
        # Ontario regional CAMIS hosts appear to use 3 for inventory that is
        # shown on the map but not reservable through the booking flow.
        if code == 3:
            return AvailabilityStatus.FIRST_COME_FIRST_SERVE
        # Some Ontario regional CAMIS hosts return 5 at the site level when the
        # parent map is closed to booking for that date range.
        if code == 5:
            return AvailabilityStatus.CLOSED
        if code == 6:
            return AvailabilityStatus.CLOSED
        if code == 4:
            return AvailabilityStatus.UNAVAILABLE
        return AvailabilityStatus.UNKNOWN
