from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.alerts.engine import (
    choose_matching_date_run,
    compute_payload_hash,
    diff_newly_available,
    find_matching_subscriptions,
    pick_poll_interval_seconds,
)
from app.models.entities import (
    AlertSubscription,
    AvailabilitySnapshot,
    Campground,
    Campsite,
    Provider,
    ProviderRateLimitState,
)
from app.models.enums import AvailabilityStatus
from app.providers.base import ProviderClientError
from app.providers.camis_client import CamisClient
from app.providers.parks_canada_client import ParksCanadaClient
from app.providers.recreation_gov_client import RecGovAvailabilityClient
from app.providers.registry import build_availability_client


@dataclass
class PollExecutionResult:
    campground_id: str
    provider_name: str
    snapshot_count: int
    new_matches: int


@dataclass
class ScheduledPollTarget:
    campground_id: str
    provider_name: str
    provider_id: str
    active_alert_count: int
    seconds_since_last_fetch: int | None
    poll_interval_seconds: int


def _lookup_or_create_campsite(
    session: Session,
    *,
    campground: Campground,
    external_campsite_id: str | None,
    site_name: str | None,
) -> Campsite | None:
    if not external_campsite_id:
        return None
    campsite = session.scalar(
        select(Campsite).where(
            Campsite.provider_id == campground.provider_id,
            Campsite.external_campsite_id == external_campsite_id,
        )
    )
    if campsite:
        if site_name and not campsite.site_name:
            campsite.site_name = site_name
        return campsite

    campsite = Campsite(
        campground_id=campground.id,
        provider_id=campground.provider_id,
        external_campsite_id=external_campsite_id,
        site_number=site_name,
        site_name=site_name,
        attributes={"discovered_from_polling": True},
    )
    session.add(campsite)
    session.flush()
    return campsite


async def poll_campground_and_persist(
    session: Session,
    *,
    campground_id: str,
    start_date: date,
    end_date: date,
) -> PollExecutionResult:
    campground = session.scalar(
        select(Campground).where(Campground.id == campground_id).join(Campground.provider)
    )
    if not campground or not campground.provider:
        raise ProviderClientError(f"Campground {campground_id} not found")

    client = build_availability_client(campground.provider)
    try:
        snapshots_raw = await _fetch_live_availability(
            client,
            campground=campground,
            start_date=start_date,
            end_date=end_date,
        )
        fetched_at = datetime.now(timezone.utc)
        previous = _latest_status_map(
            session,
            campground_id=campground.id,
            start_date=start_date,
            end_date=end_date,
        )
        current: dict[tuple[str | None, date], AvailabilityStatus] = {}

        for row in snapshots_raw:
            campsite = _lookup_or_create_campsite(
                session,
                campground=campground,
                external_campsite_id=row.get("external_campsite_id"),
                site_name=row.get("site_name"),
            )
            campsite_id = campsite.id if campsite else None
            hash_value = compute_payload_hash(
                {
                    "status": row["status"].value,
                    "date": row["date"],
                    "campground_id": campground.id,
                    "external_campsite_id": row.get("external_campsite_id"),
                    "raw_payload": row.get("raw_payload"),
                }
            )
            session.add(
                AvailabilitySnapshot(
                    provider_id=campground.provider_id,
                    campground_id=campground.id,
                    campsite_id=campsite_id,
                    date=row["date"],
                    fetched_at=fetched_at,
                    status=row["status"],
                    min_nights=row.get("min_nights"),
                    max_nights=row.get("max_nights"),
                    price=_as_decimal(row.get("price")),
                    currency=row.get("currency"),
                    raw_payload=row.get("raw_payload"),
                    hash=hash_value,
                )
            )
            current[(campsite_id, row["date"])] = row["status"]

        session.flush()
        newly_available = diff_newly_available(previous, current)
        matches_sent = _dispatch_matches(
            session,
            campground=campground,
            available_keys=newly_available,
            current_rows=snapshots_raw,
        )
        _mark_rate_limit_success(session, provider_id=campground.provider_id)
        session.commit()

        return PollExecutionResult(
            campground_id=campground.id,
            provider_name=campground.provider.name,
            snapshot_count=len(snapshots_raw),
            new_matches=matches_sent,
        )
    except ProviderClientError as exc:
        _mark_rate_limit_error(session, provider_id=campground.provider_id, error_message=str(exc))
        session.commit()
        raise
    finally:
        await client.aclose()


async def _fetch_live_availability(
    client,
    *,
    campground: Campground,
    start_date: date,
    end_date: date,
) -> list[dict]:
    if isinstance(client, RecGovAvailabilityClient):
        return await client.get_availability(
            campground.external_facility_id,
            start_date=start_date,
            end_date=end_date,
        )
    if isinstance(client, (ParksCanadaClient, CamisClient)):
        root_map_id = ((campground.amenities or {}).get("root_map_id"))
        if root_map_id is None:
            raise ProviderClientError(
                f"Campground {campground.id} is missing amenities.root_map_id for CAMIS polling"
            )
        return await client.get_availability(
            resource_location_id=int(campground.external_facility_id),
            root_map_id=int(root_map_id),
            start_date=start_date,
            end_date=end_date,
        )
    raise ProviderClientError(f"Unsupported client {client.__class__.__name__}")


def _latest_status_map(
    session: Session,
    *,
    campground_id: str,
    start_date: date,
    end_date: date,
) -> dict[tuple[str | None, date], AvailabilityStatus]:
    latest = (
        select(
            AvailabilitySnapshot.campsite_id,
            AvailabilitySnapshot.date,
            func.max(AvailabilitySnapshot.fetched_at).label("max_fetched_at"),
        )
        .where(
            AvailabilitySnapshot.campground_id == campground_id,
            AvailabilitySnapshot.date >= start_date,
            AvailabilitySnapshot.date <= end_date,
        )
        .group_by(AvailabilitySnapshot.campsite_id, AvailabilitySnapshot.date)
        .subquery()
    )
    rows = session.execute(
        select(AvailabilitySnapshot)
        .join(
            latest,
            and_(
                AvailabilitySnapshot.campsite_id == latest.c.campsite_id,
                AvailabilitySnapshot.date == latest.c.date,
                AvailabilitySnapshot.fetched_at == latest.c.max_fetched_at,
            ),
        )
    ).scalars()
    return {(row.campsite_id, row.date): row.status for row in rows}


def _dispatch_matches(
    session: Session,
    *,
    campground: Campground,
    available_keys: list[tuple[str | None, date]],
    current_rows: list[dict],
) -> int:
    if not available_keys:
        return 0

    from app.alerts.tasks import dispatch_email_notification, dispatch_webhook_notification

    rows_by_key = {
        (session.scalar(
            select(Campsite.id).where(
                Campsite.provider_id == campground.provider_id,
                Campsite.external_campsite_id == row.get("external_campsite_id"),
            )
        ), row["date"]): row
        for row in current_rows
        if row["status"] == AvailabilityStatus.AVAILABLE
    }
    available_dates_by_campsite: dict[str | None, list[date]] = {}
    for row in current_rows:
        if row["status"] != AvailabilityStatus.AVAILABLE:
            continue
        campsite_id = session.scalar(
            select(Campsite.id).where(
                Campsite.provider_id == campground.provider_id,
                Campsite.external_campsite_id == row.get("external_campsite_id"),
            )
        )
        available_dates_by_campsite.setdefault(campsite_id, []).append(row["date"])

    match_count = 0
    sent_keys: set[tuple[str, str | None, tuple[str, ...]]] = set()
    for campsite_id, available_date in available_keys:
        row = rows_by_key.get((campsite_id, available_date))
        if not row:
            continue
        subscriptions = find_matching_subscriptions(
            session,
            park_id=campground.park_id,
            campground_id=campground.id,
            campsite_id=campsite_id,
            country=campground.park.country if campground.park else None,
            state_province=campground.park.state_province if campground.park else None,
            available_dates=[available_date],
            price=float(row["price"]) if row.get("price") is not None else None,
            equipment_type=None,
        )
        for subscription in subscriptions:
            matching_run = choose_matching_date_run(
                available_dates=available_dates_by_campsite.get(campsite_id, []),
                target_date=available_date,
                date_start=subscription.date_start,
                date_end=subscription.date_end,
                min_nights=subscription.min_nights,
                max_nights=subscription.max_nights,
            )
            if not matching_run:
                continue
            dedupe_key = (
                subscription.id,
                campsite_id,
                tuple(value.isoformat() for value in matching_run),
            )
            if dedupe_key in sent_keys:
                continue

            if subscription.notification_channel.value == "webhook" and subscription.webhook_url:
                dispatch_webhook_notification.delay(
                    alert_id=subscription.id,
                    webhook_url=subscription.webhook_url,
                    provider_name=campground.provider.name,
                    campground_name=campground.name,
                    campground_id=campground.id,
                    campsite_id=campsite_id,
                    campsite_name=row.get("site_name"),
                    available_dates=[value.isoformat() for value in matching_run],
                    booking_url=campground.booking_url,
                    price=float(row["price"]) if row.get("price") is not None else None,
                    currency=row.get("currency"),
                    metadata=subscription.metadata_json,
                )
                match_count += 1
                subscription.last_notified_at = datetime.now(timezone.utc)
                sent_keys.add(dedupe_key)
            elif subscription.notification_channel.value == "email" and subscription.email:
                dispatch_email_notification.delay(
                    alert_id=subscription.id,
                    email=subscription.email,
                    provider_name=campground.provider.name,
                    campground_name=campground.name,
                    campsite_name=row.get("site_name"),
                    available_dates=[value.isoformat() for value in matching_run],
                    booking_url=campground.booking_url,
                    price=float(row["price"]) if row.get("price") is not None else None,
                    currency=row.get("currency"),
                    metadata=subscription.metadata_json,
                )
                match_count += 1
                subscription.last_notified_at = datetime.now(timezone.utc)
                sent_keys.add(dedupe_key)
    return match_count


def _as_decimal(value) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value))


def select_due_campgrounds(
    session: Session,
    *,
    as_of: datetime | None = None,
    limit: int = 25,
) -> list[ScheduledPollTarget]:
    as_of = as_of or datetime.now(timezone.utc)
    latest_snapshot = (
        select(
            AvailabilitySnapshot.campground_id.label("campground_id"),
            func.max(AvailabilitySnapshot.fetched_at).label("last_fetched_at"),
        )
        .group_by(AvailabilitySnapshot.campground_id)
        .subquery()
    )
    active_alerts = (
        select(
            AlertSubscription.campground_id.label("campground_id"),
            func.count(AlertSubscription.id).label("active_alert_count"),
        )
        .where(
            AlertSubscription.paused.is_(False),
            AlertSubscription.campground_id.is_not(None),
        )
        .group_by(AlertSubscription.campground_id)
        .subquery()
    )

    stmt = (
        select(
            Campground.id,
            Campground.name,
            Campground.provider_id,
            Provider.name.label("provider_name"),
            latest_snapshot.c.last_fetched_at,
            func.coalesce(active_alerts.c.active_alert_count, 0).label("active_alert_count"),
            ProviderRateLimitState.next_allowed_at,
        )
        .join(Provider, Provider.id == Campground.provider_id)
        .join(latest_snapshot, latest_snapshot.c.campground_id == Campground.id, isouter=True)
        .join(active_alerts, active_alerts.c.campground_id == Campground.id, isouter=True)
        .join(
            ProviderRateLimitState,
            ProviderRateLimitState.provider_id == Campground.provider_id,
            isouter=True,
        )
        .where(or_(ProviderRateLimitState.next_allowed_at.is_(None), ProviderRateLimitState.next_allowed_at <= as_of))
    )

    rows = session.execute(stmt).all()
    due: list[ScheduledPollTarget] = []
    for campground_id, name, provider_id, provider_name, last_fetched_at, active_alert_count, _next_allowed_at in rows:
        active_alert_count = int(active_alert_count or 0)
        poll_interval = pick_poll_interval_seconds(
            is_hot=_is_hot_campground(name),
            active_alert_count=active_alert_count,
        )
        if last_fetched_at is not None:
            seconds_since = int((as_of - last_fetched_at).total_seconds())
            if seconds_since < poll_interval:
                continue
        else:
            seconds_since = None

        due.append(
            ScheduledPollTarget(
                campground_id=campground_id,
                provider_name=provider_name,
                provider_id=provider_id,
                active_alert_count=active_alert_count,
                seconds_since_last_fetch=seconds_since,
                poll_interval_seconds=poll_interval,
            )
        )

    due.sort(
        key=lambda item: (
            -item.active_alert_count,
            -(item.seconds_since_last_fetch or 999999),
            (item.provider_name or "").lower(),
        )
    )
    return due[:limit]


def _is_hot_campground(name: str | None) -> bool:
    if not name:
        return False
    hot_terms = ("banff", "jasper", "yosemite", "zion", "joshua tree", "yellowstone")
    normalized = name.lower()
    return any(term in normalized for term in hot_terms)


def _get_or_create_rate_limit_state(session: Session, *, provider_id: str) -> ProviderRateLimitState:
    state = session.get(ProviderRateLimitState, provider_id)
    if state:
        return state
    state = ProviderRateLimitState(provider_id=provider_id)
    session.add(state)
    session.flush()
    return state


def _mark_rate_limit_success(session: Session, *, provider_id: str) -> None:
    state = _get_or_create_rate_limit_state(session, provider_id=provider_id)
    state.last_request_at = datetime.now(timezone.utc)
    state.next_allowed_at = None
    state.current_backoff_seconds = 0
    state.consecutive_errors = 0
    state.last_error_code = None
    state.metadata_json = {**(state.metadata_json or {}), "last_success_at": state.last_request_at.isoformat()}
    session.flush()


def _mark_rate_limit_error(session: Session, *, provider_id: str, error_message: str) -> None:
    state = _get_or_create_rate_limit_state(session, provider_id=provider_id)
    state.last_request_at = datetime.now(timezone.utc)
    state.consecutive_errors = (state.consecutive_errors or 0) + 1
    is_429 = "429" in error_message
    backoff_seconds = min(3600, max(30, 30 * (2 ** (state.consecutive_errors - 1))))
    if is_429:
        backoff_seconds = min(7200, max(120, backoff_seconds))
        state.last_error_code = "429"
    else:
        state.last_error_code = "provider_error"
    state.current_backoff_seconds = backoff_seconds
    state.next_allowed_at = datetime.fromtimestamp(
        state.last_request_at.timestamp() + backoff_seconds,
        tz=timezone.utc,
    )
    state.metadata_json = {
        **(state.metadata_json or {}),
        "last_error_at": state.last_request_at.isoformat(),
        "last_error_message": error_message[:500],
    }
    session.flush()
