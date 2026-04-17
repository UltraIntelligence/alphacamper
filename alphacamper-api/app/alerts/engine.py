from __future__ import annotations

import hashlib
import json
from collections.abc import Iterable
from datetime import date
from typing import Any
from uuid import uuid4

from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models.entities import AlertSubscription
from app.models.enums import AvailabilityStatus


def compute_payload_hash(payload: Any) -> str:
    normalized = json.dumps(payload, sort_keys=True, separators=(",", ":"), default=str)
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def diff_newly_available(
    previous: dict[tuple[str | None, date], AvailabilityStatus],
    current: dict[tuple[str | None, date], AvailabilityStatus],
) -> list[tuple[str | None, date]]:
    new_hits: list[tuple[str | None, date]] = []
    for key, current_status in current.items():
        previous_status = previous.get(key)
        if current_status == AvailabilityStatus.AVAILABLE and previous_status != AvailabilityStatus.AVAILABLE:
            new_hits.append(key)
    return new_hits


def pick_poll_interval_seconds(*, is_hot: bool, active_alert_count: int) -> int:
    if is_hot or active_alert_count >= 25:
        return 60
    if active_alert_count >= 5:
        return 180
    return 600


def find_matching_subscriptions(
    session: Session,
    *,
    park_id: str | None,
    campground_id: str | None,
    campsite_id: str | None,
    country: str | None = None,
    state_province: str | None = None,
    available_dates: Iterable[date],
    price: float | None = None,
    equipment_type: str | None = None,
) -> list[AlertSubscription]:
    dates = sorted(set(available_dates))
    if not dates:
        return []

    stmt = select(AlertSubscription).where(
        AlertSubscription.paused.is_(False),
        AlertSubscription.date_start <= dates[-1],
        AlertSubscription.date_end >= dates[0],
        or_(AlertSubscription.park_id.is_(None), AlertSubscription.park_id == park_id),
        or_(AlertSubscription.campground_id.is_(None), AlertSubscription.campground_id == campground_id),
        or_(AlertSubscription.campsite_id.is_(None), AlertSubscription.campsite_id == campsite_id),
    )
    if country:
        stmt = stmt.where(or_(AlertSubscription.country.is_(None), AlertSubscription.country == country))
    if state_province:
        stmt = stmt.where(
            or_(
                AlertSubscription.state_province.is_(None),
                AlertSubscription.state_province == state_province,
            )
        )

    if price is not None:
        stmt = stmt.where(or_(AlertSubscription.max_price.is_(None), AlertSubscription.max_price >= price))
    if equipment_type:
        stmt = stmt.where(
            or_(
                AlertSubscription.equipment_type.is_(None),
                AlertSubscription.equipment_type == equipment_type,
            )
        )

    return list(session.scalars(stmt))


def choose_matching_date_run(
    *,
    available_dates: Iterable[date],
    target_date: date,
    date_start: date,
    date_end: date,
    min_nights: int | None,
    max_nights: int | None,
) -> list[date]:
    filtered = sorted({value for value in available_dates if date_start <= value <= date_end})
    if target_date not in filtered:
        return []

    runs: list[list[date]] = []
    current: list[date] = []
    for value in filtered:
        if not current or value.toordinal() == current[-1].toordinal() + 1:
            current.append(value)
        else:
            runs.append(current)
            current = [value]
    if current:
        runs.append(current)

    desired_min = max(1, min_nights or 1)
    desired_max = max_nights or 365
    for run in runs:
        if target_date not in run or len(run) < desired_min:
            continue
        target_index = run.index(target_date)
        start_index = max(0, target_index - desired_min + 1)
        end_index = min(len(run), start_index + desired_max)
        candidate = run[start_index:end_index]
        if len(candidate) >= desired_min and target_date in candidate:
            return candidate
    return []


def build_webhook_payload(
    *,
    alert_id: str,
    provider_name: str,
    campground_name: str,
    campground_id: str,
    campsite_id: str | None,
    campsite_name: str | None,
    available_dates: list[date],
    booking_url: str | None,
    price: float | None,
    currency: str | None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {
        "event": "availability.alert.matched",
        "data": {
            "alert_id": alert_id,
            "notification_id": str(uuid4()),
            "provider": provider_name,
            "campground_id": campground_id,
            "campground_name": campground_name,
            "campsite_id": campsite_id,
            "campsite_name": campsite_name,
            "reservation_url": booking_url,
            "dates": [value.isoformat() for value in available_dates],
            "price": price,
            "currency": currency,
            "metadata": metadata or {},
        },
    }
