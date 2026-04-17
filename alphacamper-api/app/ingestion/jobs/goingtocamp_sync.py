from __future__ import annotations

import json
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.ingestion.jobs.helpers import get_or_create_provider, upsert_campground, upsert_park
from app.models.entities import Campground, Park
from app.models.enums import ProviderKind
from app.providers.base import ProviderClientError, SessionBootstrapper
from app.providers.browser_camis_client import BrowserBackedCamisClient
from app.providers.camis_client import CamisClient
from app.providers.goingtocamp_client import GoingToCampClient
from app.providers.goingtocamp_registry import (
    GoingToCampDomain,
    camis_provider_name_for_domain,
    is_live_camis_goingtocamp_domain,
    list_known_goingtocamp_domains,
)
from app.providers.session_bootstrap import CommandSessionBootstrapper


async def sync_goingtocamp_provider(
    session: Session,
    *,
    domain: str,
    provider_name: str,
    country: str = "CA",
    state_province: str | None = None,
    catalog_seed_path: str | None = None,
    session_bootstrapper: SessionBootstrapper | None = None,
) -> dict[str, int]:
    session_bootstrapper = session_bootstrapper or CommandSessionBootstrapper()
    client = GoingToCampClient(domain)
    provider = get_or_create_provider(
        session,
        name=provider_name,
        kind=ProviderKind.PROVINCIAL,
        base_url=f"https://{domain}",
        country=country,
        notes=(
            "Public white-label GoingToCamp provider. Live availability is wired when campground map IDs "
            "are known. Directory discovery can come from provider JSON or a curated seed catalog."
        ),
    )
    counts = {"providers": 1, "parks": 0, "campgrounds": 0}
    try:
        if is_live_camis_goingtocamp_domain(domain):
            try:
                counts = await _sync_live_camis_catalog(
                    session,
                    provider_id=provider.id,
                    provider_name=provider_name,
                    domain=domain,
                    country=country,
                    state_province=state_province,
                    session_bootstrapper=session_bootstrapper,
                )
            except ProviderClientError:
                if not catalog_seed_path:
                    raise
                counts = _sync_seed_catalog(
                    session,
                    provider_id=provider.id,
                    country=country,
                    state_province=state_province,
                    catalog_seed_path=catalog_seed_path,
                )
        elif catalog_seed_path:
            counts = _sync_seed_catalog(
                session,
                provider_id=provider.id,
                country=country,
                state_province=state_province,
                catalog_seed_path=catalog_seed_path,
            )
        session.commit()
    finally:
        await client.aclose()
    return counts


async def sync_known_goingtocamp_providers(
    session: Session,
    *,
    seed_directory: str | None = None,
) -> dict[str, int]:
    total = {"providers": 0, "parks": 0, "campgrounds": 0}
    for config in list_known_goingtocamp_domains():
        seed_path = None
        if seed_directory:
            candidate = Path(seed_directory) / f"{config.domain}.json"
            if candidate.exists():
                seed_path = str(candidate)
        result = await sync_goingtocamp_provider(
            session,
            domain=config.domain,
            provider_name=config.provider_name,
            country=config.country,
            state_province=config.state_province,
            catalog_seed_path=seed_path,
        )
        total["providers"] += result.get("providers", 0)
        total["parks"] += result.get("parks", 0)
        total["campgrounds"] += result.get("campgrounds", 0)
    return total


async def _sync_live_camis_catalog(
    session: Session,
    *,
    provider_id: str,
    provider_name: str,
    domain: str,
    country: str,
    state_province: str | None,
    session_bootstrapper: SessionBootstrapper | None,
) -> dict[str, int]:
    if settings.resolved_provider_browser_fetch_command:
        client = BrowserBackedCamisClient(
            provider_name=camis_provider_name_for_domain(domain),
            domain=domain,
            browser_fetch_command=settings.resolved_provider_browser_fetch_command,
            session_bootstrapper=session_bootstrapper,
        )
    else:
        client = CamisClient(
            provider_name=camis_provider_name_for_domain(domain),
            domain=domain,
            session_bootstrapper=session_bootstrapper,
        )

    counts = {"providers": 1, "parks": 0, "campgrounds": 0}
    try:
        rows = await client.list_resource_locations()
        for row in rows:
            localized = (row.get("localizedValues") or [{}])[0]
            short_name = (localized.get("shortName") or "").strip()
            full_name = (localized.get("fullName") or short_name).strip()
            root_map_id = row.get("rootMapId")
            if not full_name or full_name.lower() == "internet":
                continue

            park = _upsert_live_park(
                session,
                provider_id=provider_id,
                park_name=full_name,
                country=country,
                state_province=state_province,
                region=row.get("region"),
                source_name=provider_name,
            )
            counts["parks"] += 1

            _upsert_live_campground(
                session,
                provider_id=provider_id,
                park_id=park.id,
                full_name=full_name,
                short_name=short_name or full_name,
                resource_location_id=row.get("resourceLocationId"),
                root_map_id=root_map_id,
                booking_base_url=f"https://{domain}",
                localized=localized,
                row=row,
                source_name=provider_name,
            )
            counts["campgrounds"] += 1
    finally:
        await client.aclose()
    return counts


def _sync_seed_catalog(
    session: Session,
    *,
    provider_id: str,
    country: str,
    state_province: str | None,
    catalog_seed_path: str,
) -> dict[str, int]:
    payload = json.loads(Path(catalog_seed_path).read_text())
    parks = payload.get("parks") or []
    campgrounds = payload.get("campgrounds") or []
    park_by_key: dict[str, str] = {}
    counts = {"providers": 1, "parks": 0, "campgrounds": 0}

    for row in parks:
        park = upsert_park(
            session,
            provider_id=provider_id,
            external_park_id=str(row.get("external_park_id") or row.get("name")),
            defaults={
                "name": row.get("name"),
                "country": country,
                "state_province": row.get("state_province") or state_province,
                "region": row.get("region"),
                "lat": row.get("lat"),
                "lon": row.get("lon"),
                "metadata_json": row.get("metadata_json") or {"source": "goingtocamp_seed_catalog"},
            },
        )
        park_by_key[str(row.get("external_park_id") or row.get("name"))] = park.id
        counts["parks"] += 1

    for row in campgrounds:
        park_key = str(row.get("park_external_id") or row.get("park_name") or "")
        upsert_campground(
            session,
            provider_id=provider_id,
            external_facility_id=str(row.get("external_facility_id")),
            defaults={
                "park_id": park_by_key.get(park_key),
                "name": row.get("name"),
                "description": row.get("description"),
                "lat": row.get("lat"),
                "lon": row.get("lon"),
                "booking_url": row.get("booking_url"),
                "amenities": row.get("amenities"),
                "photos": row.get("photos"),
            },
        )
        counts["campgrounds"] += 1

    return counts


def _normalize_name(value: str | None) -> str:
    if not value:
        return ""
    normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
    words = [
        word
        for word in normalized.split()
        if word
        not in {
            "campground",
            "campgrounds",
            "conservation",
            "area",
            "reservation",
            "service",
            "booking",
            "sites",
            "site",
            "campsites",
        }
    ]
    return " ".join(words)


def _campground_name_matches(existing_name: str | None, *, full_name: str, short_name: str) -> bool:
    campground_norm = _normalize_name(existing_name)
    short_norm = _normalize_name(short_name)
    full_norm = _normalize_name(full_name)
    if campground_norm in {short_norm, full_norm}:
        return True
    if short_norm and campground_norm.startswith(short_norm):
        return True
    return False


def _upsert_live_park(
    session: Session,
    *,
    provider_id: str,
    park_name: str,
    country: str,
    state_province: str | None,
    region: str | None,
    source_name: str,
) -> Park:
    normalized_target = _normalize_name(park_name)
    existing = session.scalar(
        select(Park).where(
            Park.provider_id == provider_id,
            Park.external_park_id == park_name,
        )
    )
    if existing is None:
        for park in session.scalars(select(Park).where(Park.provider_id == provider_id)):
            if _normalize_name(park.name) == normalized_target:
                existing = park
                break

    defaults = {
        "name": park_name,
        "country": country,
        "state_province": state_province,
        "region": region,
        "metadata_json": {
            "source": "goingtocamp_live_camis",
            "provider_name": source_name,
        },
    }
    if existing:
        existing.external_park_id = park_name
        for key, value in defaults.items():
            setattr(existing, key, value)
        session.flush()
        return existing

    return upsert_park(
        session,
        provider_id=provider_id,
        external_park_id=park_name,
        defaults=defaults,
    )


def _upsert_live_campground(
    session: Session,
    *,
    provider_id: str,
    park_id: str,
    full_name: str,
    short_name: str,
    resource_location_id: int | None,
    root_map_id: int | None,
    booking_base_url: str,
    localized: dict,
    row: dict,
    source_name: str,
) -> Campground:
    external_facility_id = str(resource_location_id) if resource_location_id is not None else None
    existing = None
    if external_facility_id is not None:
        existing = session.scalar(
            select(Campground).where(
                Campground.provider_id == provider_id,
                Campground.external_facility_id == external_facility_id,
            )
        )

    if existing is None:
        for campground in session.scalars(
            select(Campground).where(Campground.provider_id == provider_id)
        ):
            if _campground_name_matches(
                campground.name,
                full_name=full_name,
                short_name=short_name,
            ):
                existing = campground
                break

    amenities = dict(existing.amenities or {}) if existing and existing.amenities else {}
    amenities.update(
        {
            "source": "goingtocamp_live_camis",
            "provider_name": source_name,
            "root_map_id": root_map_id,
        }
    )

    defaults = {
        "park_id": park_id,
        "name": full_name,
        "description": localized.get("description"),
        "booking_url": f"{booking_base_url}/create-booking/results?resourceLocationId={resource_location_id}",
        "driving_directions": localized.get("drivingDirections"),
        "address": ", ".join(
            part for part in [localized.get("streetAddress"), localized.get("city")] if part
        )
        or None,
        "amenities": amenities,
        "photos": row.get("photos"),
    }

    if existing:
        existing.external_facility_id = external_facility_id
        for key, value in defaults.items():
            setattr(existing, key, value)
        session.flush()
        return existing

    return upsert_campground(
        session,
        provider_id=provider_id,
        external_facility_id=external_facility_id,
        defaults=defaults,
    )
