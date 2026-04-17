from __future__ import annotations

from dateutil import parser as date_parser
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ingestion.jobs.helpers import (
    get_or_create_provider,
    upsert_campground,
    upsert_notice,
    upsert_park,
)
from app.models.entities import Park
from app.models.enums import ProviderKind
from app.providers.nps_client import NpsClient


async def enrich_from_nps(session: Session, *, states: list[str]) -> dict[str, int]:
    client = NpsClient()
    provider = get_or_create_provider(
        session,
        name="National Park Service",
        kind=ProviderKind.FEDERAL,
        base_url="https://developer.nps.gov/api/v1",
        country="US",
        notes="Official NPS metadata and alert enrichment",
    )

    enriched = {"parks": 0, "campgrounds": 0, "notices": 0}
    try:
        for state in states:
            parks = await client.list_parks(state_code=state, limit=100)
            for park_row in parks.get("data", []):
                park = upsert_park(
                    session,
                    provider_id=provider.id,
                    external_park_id=park_row.get("id"),
                    defaults={
                        "name": park_row.get("fullName") or park_row.get("name"),
                        "country": "US",
                        "state_province": state,
                        "lat": park_row.get("latitude"),
                        "lon": park_row.get("longitude"),
                        "nps_park_code": park_row.get("parkCode"),
                        "metadata_json": park_row,
                    },
                )
                enriched["parks"] += 1 if park else 0

            campgrounds = await client.list_campgrounds(state_code=state, limit=100)
            for cg_row in campgrounds.get("data", []):
                linked_park = session.scalar(
                    select(Park).where(Park.nps_park_code == cg_row.get("parkCode"))
                )
                campground = upsert_campground(
                    session,
                    provider_id=provider.id,
                    external_facility_id=cg_row.get("id"),
                    defaults={
                        "park_id": linked_park.id if linked_park else None,
                        "name": cg_row.get("name"),
                        "description": cg_row.get("description"),
                        "lat": cg_row.get("latitude"),
                        "lon": cg_row.get("longitude"),
                        "booking_url": None,
                        "photos": cg_row.get("images"),
                        "amenities": cg_row.get("amenities"),
                        "accessibility": cg_row.get("accessibility"),
                    },
                )
                enriched["campgrounds"] += 1 if campground else 0

            alerts = await client.list_alerts(state_code=state, limit=100)
            for alert_row in alerts.get("data", []):
                linked_park = session.scalar(
                    select(Park).where(Park.nps_park_code == alert_row.get("parkCode"))
                )
                upsert_notice(
                    session,
                    provider_id=provider.id,
                    external_notice_id=alert_row.get("id"),
                    defaults={
                        "park_id": linked_park.id if linked_park else None,
                        "campground_id": None,
                        "title": alert_row.get("title") or "Park notice",
                        "summary": alert_row.get("description"),
                        "body": alert_row.get("description"),
                        "severity": alert_row.get("severity"),
                        "status": alert_row.get("category"),
                        "url": alert_row.get("url"),
                        "effective_at": (
                            date_parser.isoparse(alert_row["lastIndexedDate"])
                            if alert_row.get("lastIndexedDate")
                            else None
                        ),
                        "expires_at": None,
                        "metadata_json": alert_row,
                    },
                )
                enriched["notices"] += 1

            session.commit()
    finally:
        await client.aclose()
    return enriched
