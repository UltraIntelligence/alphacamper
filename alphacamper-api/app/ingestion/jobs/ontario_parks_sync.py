from __future__ import annotations

from sqlalchemy.orm import Session

from app.core.config import settings
from app.ingestion.jobs.directory_sync_state import (
    get_directory_counts,
    mark_directory_sync_completed,
    should_skip_directory_sync,
)
from app.ingestion.jobs.helpers import get_or_create_provider, upsert_campground, upsert_park
from app.models.enums import ProviderKind
from app.providers.base import SessionBootstrapper
from app.providers.browser_camis_client import BrowserBackedCamisClient
from app.providers.camis_client import CamisClient


async def sync_ontario_parks_directory(
    session: Session,
    *,
    session_bootstrapper: SessionBootstrapper | None = None,
    force: bool = False,
    max_age_hours: int = 12,
) -> dict[str, int]:
    provider = get_or_create_provider(
        session,
        name="Ontario Parks Reservation Service",
        kind=ProviderKind.PROVINCIAL,
        base_url="https://reservations.ontarioparks.ca",
        country="CA",
        notes="Ontario Parks public reservation metadata and availability via CAMIS booking site",
    )

    if not force and should_skip_directory_sync(
        session,
        provider_id=provider.id,
        max_age_hours=max_age_hours,
    ):
        counts = get_directory_counts(session, provider_id=provider.id)
        session.commit()
        return {**counts, "skipped": 1}

    if settings.resolved_provider_browser_fetch_command:
        client = BrowserBackedCamisClient(
            provider_name="ontario_parks",
            domain="reservations.ontarioparks.ca",
            browser_fetch_command=settings.resolved_provider_browser_fetch_command,
            session_bootstrapper=session_bootstrapper,
        )
    else:
        client = CamisClient(
            provider_name="ontario_parks",
            domain="reservations.ontarioparks.ca",
            session_bootstrapper=session_bootstrapper,
        )

    counts = {"parks": 0, "campgrounds": 0}
    try:
        rows = await client.list_resource_locations()
        for row in rows:
            localized = (row.get("localizedValues") or [{}])[0]
            full_name = localized.get("fullName") or localized.get("shortName")
            if not full_name:
                continue

            park_name = full_name.split(" - ")[0].strip() if " - " in full_name else full_name.strip()
            park = upsert_park(
                session,
                provider_id=provider.id,
                external_park_id=park_name,
                defaults={
                    "name": park_name,
                    "country": "CA",
                    "state_province": "ON",
                    "region": row.get("region"),
                    "metadata_json": {
                        "source": "ontario_parks_resource_location",
                        "region_code": row.get("regionCode"),
                    },
                },
            )
            counts["parks"] += 1

            upsert_campground(
                session,
                provider_id=provider.id,
                external_facility_id=str(row.get("resourceLocationId")),
                defaults={
                    "park_id": park.id,
                    "name": full_name,
                    "booking_url": (
                        "https://reservations.ontarioparks.ca/create-booking/results"
                        f"?resourceLocationId={row.get('resourceLocationId')}"
                    ),
                    "description": None,
                    "amenities": {"source": "ontario_parks", "root_map_id": row.get("rootMapId")},
                    "photos": row.get("photos"),
                },
            )
            counts["campgrounds"] += 1

        persisted_counts = get_directory_counts(session, provider_id=provider.id)
        mark_directory_sync_completed(
            session,
            provider_id=provider.id,
            source="ontario_parks_directory_sync",
            parks=persisted_counts["parks"],
            campgrounds=persisted_counts["campgrounds"],
        )
        session.commit()
    finally:
        await client.aclose()
    return get_directory_counts(session, provider_id=provider.id)
