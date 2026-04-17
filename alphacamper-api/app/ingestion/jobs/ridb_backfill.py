from __future__ import annotations

from sqlalchemy.orm import Session

from app.ingestion.jobs.helpers import (
    get_or_create_provider,
    upsert_campground,
    upsert_campsite,
    upsert_park,
)
from app.models.enums import ProviderKind
from app.providers.ridb_client import RidbClient


async def backfill_ridb_metadata(session: Session, *, states: list[str]) -> dict[str, int]:
    client = RidbClient()
    provider = get_or_create_provider(
        session,
        name="RIDB",
        kind=ProviderKind.FEDERAL,
        base_url="https://ridb.recreation.gov/api/v1",
        country="US",
        notes="Official federal recreation metadata feed",
    )

    created = {"parks": 0, "campgrounds": 0, "campsites": 0}
    try:
        for state in states:
            recareas = await client.list_recareas(state=state, limit=200, offset=0)
            for recarea in recareas.get("RECDATA", []):
                park = upsert_park(
                    session,
                    provider_id=provider.id,
                    external_park_id=str(recarea.get("RecAreaID")),
                    defaults={
                        "name": recarea.get("RecAreaName"),
                        "country": "US",
                        "state_province": state,
                        "lat": recarea.get("RecAreaLatitude"),
                        "lon": recarea.get("RecAreaLongitude"),
                        "metadata_json": recarea,
                    },
                )
                created["parks"] += 1 if park else 0

            facilities = await client.list_campgrounds(state=state, limit=200, offset=0)
            for facility in facilities.get("RECDATA", []):
                campground = upsert_campground(
                    session,
                    provider_id=provider.id,
                    external_facility_id=str(facility.get("FacilityID")),
                    defaults={
                        "park_id": None,
                        "name": facility.get("FacilityName"),
                        "description": facility.get("FacilityDescription"),
                        "lat": facility.get("FacilityLatitude"),
                        "lon": facility.get("FacilityLongitude"),
                        "booking_url": facility.get("FacilityReservationURL"),
                        "address": facility.get("FacilityAddress"),
                        "amenities": {"ridb_facility_type": facility.get("FacilityTypeDescription")},
                    },
                )
                created["campgrounds"] += 1 if campground else 0

                campsites = await client.list_campsites(facility.get("FacilityID"), limit=200, offset=0)
                for campsite in campsites.get("RECDATA", []):
                    upsert_campsite(
                        session,
                        provider_id=provider.id,
                        campground_id=campground.id,
                        external_campsite_id=str(campsite.get("CampsiteID")),
                        defaults={
                            "site_number": campsite.get("CampsiteName"),
                            "site_name": campsite.get("CampsiteName"),
                            "equipment_types": [campsite.get("TypeOfUse")] if campsite.get("TypeOfUse") else None,
                            "attributes": campsite,
                        },
                    )
                    created["campsites"] += 1

            session.commit()
    finally:
        await client.aclose()
    return created
