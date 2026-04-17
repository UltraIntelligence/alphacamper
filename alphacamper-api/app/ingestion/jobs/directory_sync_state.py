from __future__ import annotations

from datetime import datetime, timedelta, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Campground, Park, ProviderRateLimitState

DIRECTORY_SYNC_KEY = "directory_sync"


def get_directory_sync_state(session: Session, *, provider_id: str) -> ProviderRateLimitState | None:
    return session.scalar(
        select(ProviderRateLimitState).where(ProviderRateLimitState.provider_id == provider_id)
    )


def get_directory_counts(session: Session, *, provider_id: str) -> dict[str, int]:
    parks = session.scalar(select(func.count()).select_from(Park).where(Park.provider_id == provider_id)) or 0
    campgrounds = (
        session.scalar(
            select(func.count()).select_from(Campground).where(Campground.provider_id == provider_id)
        )
        or 0
    )
    return {"parks": int(parks), "campgrounds": int(campgrounds)}


def is_directory_sync_fresh(
    last_completed_at: datetime | None,
    *,
    now: datetime | None = None,
    max_age_hours: int,
) -> bool:
    if last_completed_at is None:
        return False
    now = now or datetime.now(timezone.utc)
    if last_completed_at.tzinfo is None:
        last_completed_at = last_completed_at.replace(tzinfo=timezone.utc)
    return now - last_completed_at <= timedelta(hours=max_age_hours)


def should_skip_directory_sync(
    session: Session,
    *,
    provider_id: str,
    max_age_hours: int,
) -> bool:
    counts = get_directory_counts(session, provider_id=provider_id)
    if counts["campgrounds"] == 0:
        return False

    state = get_directory_sync_state(session, provider_id=provider_id)
    metadata = (state.metadata_json or {}) if state else {}
    sync_state = metadata.get(DIRECTORY_SYNC_KEY) or {}
    last_completed_at_raw = sync_state.get("last_completed_at")
    if not last_completed_at_raw:
        return False

    try:
        last_completed_at = datetime.fromisoformat(last_completed_at_raw)
    except ValueError:
        return False
    return is_directory_sync_fresh(last_completed_at, max_age_hours=max_age_hours)


def mark_directory_sync_completed(
    session: Session,
    *,
    provider_id: str,
    source: str,
    parks: int,
    campgrounds: int,
) -> None:
    state = get_directory_sync_state(session, provider_id=provider_id)
    if not state:
        state = ProviderRateLimitState(provider_id=provider_id, metadata_json={})
        session.add(state)

    metadata = dict(state.metadata_json or {})
    metadata[DIRECTORY_SYNC_KEY] = {
        "source": source,
        "last_completed_at": datetime.now(timezone.utc).isoformat(),
        "parks": parks,
        "campgrounds": campgrounds,
    }
    state.metadata_json = metadata
    session.flush()
