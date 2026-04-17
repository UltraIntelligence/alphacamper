from __future__ import annotations

import asyncio
import hashlib
import hmac
import json
from datetime import date, timedelta
from datetime import datetime, timezone

import httpx
from celery import Celery

from app.alerts.engine import build_webhook_payload
from app.core.config import settings
from app.core.database import SessionLocal
from app.models.entities import NotificationDelivery
from app.models.enums import NotificationChannel
from app.ingestion.jobs.availability_polling import poll_campground_and_persist, select_due_campgrounds

celery_app = Celery("alphacamper_api", broker=settings.redis_url, backend=settings.redis_url)


def build_webhook_signature(*, timestamp: str, payload_bytes: bytes) -> str | None:
    if not settings.webhook_signing_secret:
        return None
    signed = f"{timestamp}.".encode("utf-8") + payload_bytes
    digest = hmac.new(
        settings.webhook_signing_secret.encode("utf-8"),
        signed,
        hashlib.sha256,
    ).hexdigest()
    return f"t={timestamp},v1={digest}"


def build_alert_email_content(
    *,
    campground_name: str,
    campsite_name: str | None,
    available_dates: list[str],
    booking_url: str | None,
    price: float | None,
    currency: str | None,
) -> tuple[str, str]:
    site_line = f" at {campsite_name}" if campsite_name else ""
    subject = f"Campsite opening: {campground_name}{site_line}"
    date_lines = "\n".join(f"- {value}" for value in available_dates) or "- Dates not provided"
    price_line = f"{price} {currency}".strip() if price is not None else "Not provided"
    booking_line = booking_url or "Open Alphacamper to view this campground."
    body = (
        f"An Alphacamper alert matched for {campground_name}{site_line}.\n\n"
        f"Open dates:\n{date_lines}\n\n"
        f"Price: {price_line}\n"
        f"Booking link: {booking_line}\n\n"
        "We only alert and assist. Final booking stays with you."
    )
    return subject, body


def _create_delivery_record(
    *,
    alert_id: str,
    channel: NotificationChannel,
    destination: str | None,
    payload: dict,
    provider_name: str,
    signature: str | None = None,
) -> str:
    session = SessionLocal()
    try:
        delivery = NotificationDelivery(
            alert_subscription_id=alert_id,
            notification_channel=channel,
            destination=destination,
            status="pending",
            event_type=payload.get("event", "availability.alert.matched"),
            provider_name=provider_name,
            payload_json=payload,
            request_signature=signature,
            attempted_at=datetime.now(timezone.utc),
        )
        session.add(delivery)
        session.commit()
        return delivery.id
    finally:
        session.close()


def _finalize_delivery_record(
    *,
    delivery_id: str,
    status: str,
    response_status_code: int | None = None,
    response_body: str | None = None,
    external_delivery_id: str | None = None,
    error_message: str | None = None,
) -> None:
    session = SessionLocal()
    try:
        delivery = session.get(NotificationDelivery, delivery_id)
        if not delivery:
            return
        delivery.status = status
        delivery.response_status_code = response_status_code
        delivery.response_body = response_body
        delivery.external_delivery_id = external_delivery_id
        delivery.error_message = error_message
        if status == "delivered":
            delivery.delivered_at = datetime.now(timezone.utc)
        session.commit()
    finally:
        session.close()


@celery_app.task(name="alerts.dispatch_webhook")
def dispatch_webhook_notification(
    *,
    alert_id: str,
    webhook_url: str,
    provider_name: str,
    campground_name: str,
    campground_id: str,
    campsite_id: str | None,
    campsite_name: str | None,
    available_dates: list[str],
    booking_url: str | None,
    price: float | None = None,
    currency: str | None = None,
    metadata: dict | None = None,
) -> dict[str, str | int]:
    payload = build_webhook_payload(
        alert_id=alert_id,
        provider_name=provider_name,
        campground_name=campground_name,
        campground_id=campground_id,
        campsite_id=campsite_id,
        campsite_name=campsite_name,
        available_dates=[],
        booking_url=booking_url,
        price=price,
        currency=currency,
        metadata=metadata,
    )
    payload["data"]["dates"] = available_dates
    payload_bytes = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    timestamp = str(int(datetime.now(timezone.utc).timestamp()))
    signature = build_webhook_signature(timestamp=timestamp, payload_bytes=payload_bytes)
    delivery_id = _create_delivery_record(
        alert_id=alert_id,
        channel=NotificationChannel.WEBHOOK,
        destination=webhook_url,
        payload=payload,
        provider_name=provider_name,
        signature=signature,
    )

    headers = {
        "User-Agent": settings.user_agent,
        "Content-Type": "application/json",
        "X-Alphacamper-Event": payload["event"],
        "X-Alphacamper-Timestamp": timestamp,
    }
    if signature:
        headers["X-Alphacamper-Signature"] = signature

    last_error: str | None = None
    for attempt in range(1, settings.alert_delivery_max_attempts + 1):
        try:
            response = httpx.post(
                webhook_url,
                content=payload_bytes,
                timeout=settings.http_timeout_seconds,
                headers=headers,
            )
            if response.status_code < 400:
                _finalize_delivery_record(
                    delivery_id=delivery_id,
                    status="delivered",
                    response_status_code=response.status_code,
                    response_body=response.text[:2000],
                )
                return {"status_code": response.status_code, "webhook_url": webhook_url}
            last_error = f"Webhook returned {response.status_code}"
        except httpx.HTTPError as exc:
            last_error = str(exc)

        if attempt == settings.alert_delivery_max_attempts:
            break

    _finalize_delivery_record(
        delivery_id=delivery_id,
        status="failed",
        error_message=last_error,
    )
    return {"status_code": 0, "webhook_url": webhook_url}


@celery_app.task(name="alerts.dispatch_email")
def dispatch_email_notification(
    *,
    alert_id: str,
    email: str,
    provider_name: str,
    campground_name: str,
    campsite_name: str | None,
    available_dates: list[str],
    booking_url: str | None,
    price: float | None = None,
    currency: str | None = None,
    metadata: dict | None = None,
) -> dict[str, str | int]:
    payload = {
        "event": "availability.alert.matched",
        "data": {
            "alert_id": alert_id,
            "provider": provider_name,
            "campground_name": campground_name,
            "campsite_name": campsite_name,
            "dates": available_dates,
            "reservation_url": booking_url,
            "price": price,
            "currency": currency,
            "metadata": metadata or {},
        },
    }
    delivery_id = _create_delivery_record(
        alert_id=alert_id,
        channel=NotificationChannel.EMAIL,
        destination=email,
        payload=payload,
        provider_name=provider_name,
    )

    if not settings.resend_api_key:
        _finalize_delivery_record(
            delivery_id=delivery_id,
            status="failed",
            error_message="RESEND_API_KEY is not configured",
        )
        return {"status_code": 0, "email": email}

    subject, body = build_alert_email_content(
        campground_name=campground_name,
        campsite_name=campsite_name,
        available_dates=available_dates,
        booking_url=booking_url,
        price=price,
        currency=currency,
    )
    resend_payload = {
        "from": settings.resend_from_email or "alerts@alphacamper.com",
        "to": [email],
        "subject": subject,
        "text": body,
    }

    try:
        response = httpx.post(
            "https://api.resend.com/emails",
            json=resend_payload,
            timeout=settings.http_timeout_seconds,
            headers={
                "Authorization": f"Bearer {settings.resend_api_key}",
                "Content-Type": "application/json",
                "User-Agent": settings.user_agent,
            },
        )
        if response.status_code >= 400:
            _finalize_delivery_record(
                delivery_id=delivery_id,
                status="failed",
                response_status_code=response.status_code,
                response_body=response.text[:2000],
                error_message=f"Resend returned {response.status_code}",
            )
            return {"status_code": response.status_code, "email": email}

        response_json = response.json()
        _finalize_delivery_record(
            delivery_id=delivery_id,
            status="delivered",
            response_status_code=response.status_code,
            response_body=response.text[:2000],
            external_delivery_id=response_json.get("id"),
        )
        return {"status_code": response.status_code, "email": email}
    except httpx.HTTPError as exc:
        _finalize_delivery_record(
            delivery_id=delivery_id,
            status="failed",
            error_message=str(exc),
        )
        return {"status_code": 0, "email": email}


@celery_app.task(name="availability.poll_campground")
def poll_campground_availability(
    provider_slug: str,
    campground_id: str,
    start_date_iso: str | None = None,
    end_date_iso: str | None = None,
) -> dict[str, str | int]:
    start_date = date.fromisoformat(start_date_iso) if start_date_iso else date.today()
    end_date = date.fromisoformat(end_date_iso) if end_date_iso else (start_date + timedelta(days=30))

    session = SessionLocal()
    try:
        result = asyncio.run(
            poll_campground_and_persist(
                session,
                campground_id=campground_id,
                start_date=start_date,
                end_date=end_date,
            )
        )
        return {
            "provider": provider_slug,
            "campground_id": campground_id,
            "status": "completed",
            "snapshot_count": result.snapshot_count,
            "new_matches": result.new_matches,
        }
    finally:
        session.close()


@celery_app.task(name="availability.poll_due")
def poll_due_campgrounds_batch(
    start_date_iso: str | None = None,
    end_date_iso: str | None = None,
) -> dict[str, int | list[str]]:
    start_date = date.fromisoformat(start_date_iso) if start_date_iso else date.today()
    end_date = date.fromisoformat(end_date_iso) if end_date_iso else (start_date + timedelta(days=30))

    session = SessionLocal()
    queued: list[str] = []
    try:
        due = select_due_campgrounds(session, limit=settings.poll_batch_size)
        for target in due:
            poll_campground_availability.delay(
                provider_slug=target.provider_name,
                campground_id=target.campground_id,
                start_date_iso=start_date.isoformat(),
                end_date_iso=end_date.isoformat(),
            )
            queued.append(target.campground_id)
        return {"queued": len(queued), "campground_ids": queued}
    finally:
        session.close()
