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
from app.providers.browser_parks_canada_client import BrowserBackedParksCanadaClient
from app.providers.base import SessionBootstrapper
from app.providers.parks_canada_client import ParksCanadaClient


async def sync_parks_canada_directory(
    session: Session,
    *,
    session_bootstrapper: SessionBootstrapper | None = None,
    force: bool = False,
    max_age_hours: int = 12,
) -> dict[str, int]:
    provider = get_or_create_provider(
        session,
        name="Parks Canada Reservation Service",
        kind=ProviderKind.FEDERAL,
        base_url="https://reservation.pc.gc.ca",
        country="CA",
        notes="Public reservation metadata and availability via Parks Canada booking site",
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
        client = BrowserBackedParksCanadaClient(
            browser_fetch_command=settings.resolved_provider_browser_fetch_command,
            session_bootstrapper=session_bootstrapper,
        )
    else:
        client = ParksCanadaClient(session_bootstrapper=session_bootstrapper)

    counts = {"parks": 0, "campgrounds": 0}
    try:
        parks = await client.list_parks()
        for park_row in parks:
            upsert_park(
                session,
                provider_id=provider.id,
                external_park_id=park_row["name"],
                defaults={
                    "name": park_row["name"],
                    "country": "CA",
                    "metadata_json": park_row,
                },
            )
            counts["parks"] += 1

        campgrounds = await client.list_campgrounds()
        for row in campgrounds:
            park_name = (row["name"] or "").split(" - ")[0].strip() if row.get("name") else None
            park = None
            if park_name:
                park = upsert_park(
                    session,
                    provider_id=provider.id,
                    external_park_id=park_name,
                    defaults={"name": park_name, "country": "CA"},
                )

            upsert_campground(
                session,
                provider_id=provider.id,
                external_facility_id=row.get("external_facility_id"),
                defaults={
                    "park_id": park.id if park else None,
                    "name": row.get("name"),
                    "booking_url": row.get("booking_url"),
                    "description": None,
                    "amenities": {"source": "parks_canada", "root_map_id": row.get("root_map_id")},
                    "photos": None,
                },
            )
            counts["campgrounds"] += 1
        persisted_counts = get_directory_counts(session, provider_id=provider.id)
        mark_directory_sync_completed(
            session,
            provider_id=provider.id,
            source="parks_canada_directory_sync",
            parks=persisted_counts["parks"],
            campgrounds=persisted_counts["campgrounds"],
        )
        session.commit()
    finally:
        await client.aclose()
    return get_directory_counts(session, provider_id=provider.id)
