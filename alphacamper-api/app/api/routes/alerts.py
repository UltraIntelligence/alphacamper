from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.entities import AlertSubscription
from app.models.enums import NotificationChannel
from app.repositories.alerts import AlertSubscriptionRepository, NotificationDeliveryRepository
from app.schemas.alerts import (
    AlertSubscriptionCreate,
    AlertSubscriptionRead,
    AlertSubscriptionUpdate,
    NotificationDeliveryListResponse,
    NotificationDeliveryRead,
)
from app.schemas.common import PageMeta

router = APIRouter()


@router.post("", response_model=AlertSubscriptionRead, status_code=status.HTTP_201_CREATED)
def create_alert_subscription(
    payload: AlertSubscriptionCreate,
    db: Session = Depends(get_db),
) -> AlertSubscriptionRead:
    repo = AlertSubscriptionRepository(db)
    try:
        channel = NotificationChannel(payload.notification_channel)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail="Invalid notification_channel") from exc

    subscription = AlertSubscription(
        user_id=payload.user_id,
        email=payload.email,
        phone=payload.phone,
        webhook_url=str(payload.webhook_url) if payload.webhook_url else None,
        country=payload.country.upper() if payload.country else None,
        state_province=payload.state_province,
        park_id=payload.park_id,
        campground_id=payload.campground_id,
        campsite_id=payload.campsite_id,
        date_start=payload.date_start,
        date_end=payload.date_end,
        min_nights=payload.min_nights,
        max_nights=payload.max_nights,
        equipment_type=payload.equipment_type,
        max_price=payload.max_price,
        metadata_json=payload.metadata,
        created_at=datetime.now(timezone.utc),
        paused=False,
        notification_channel=channel,
    )
    repo.add(subscription)
    db.commit()
    db.refresh(subscription)
    return AlertSubscriptionRead.model_validate(subscription)


@router.get("/{subscription_id}", response_model=AlertSubscriptionRead)
def get_alert_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
) -> AlertSubscriptionRead:
    repo = AlertSubscriptionRepository(db)
    subscription = repo.get_subscription(subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Alert subscription not found")
    return AlertSubscriptionRead.model_validate(subscription)


@router.patch("/{subscription_id}", response_model=AlertSubscriptionRead)
def update_alert_subscription(
    subscription_id: str,
    payload: AlertSubscriptionUpdate,
    db: Session = Depends(get_db),
) -> AlertSubscriptionRead:
    repo = AlertSubscriptionRepository(db)
    subscription = repo.get_subscription(subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Alert subscription not found")

    if payload.notification_channel is not None:
        try:
            subscription.notification_channel = NotificationChannel(payload.notification_channel)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail="Invalid notification_channel") from exc

    if payload.email is not None:
        subscription.email = payload.email
    if payload.phone is not None:
        subscription.phone = payload.phone
    if payload.webhook_url is not None:
        subscription.webhook_url = str(payload.webhook_url)
    if payload.date_start is not None:
        subscription.date_start = payload.date_start
    if payload.date_end is not None:
        subscription.date_end = payload.date_end
    if payload.min_nights is not None:
        subscription.min_nights = payload.min_nights
    if payload.max_nights is not None:
        subscription.max_nights = payload.max_nights
    if payload.equipment_type is not None:
        subscription.equipment_type = payload.equipment_type
    if payload.max_price is not None:
        subscription.max_price = payload.max_price
    if payload.metadata is not None:
        subscription.metadata_json = payload.metadata
    if payload.paused is not None:
        subscription.paused = payload.paused

    db.commit()
    db.refresh(subscription)
    return AlertSubscriptionRead.model_validate(subscription)


@router.get("/{subscription_id}/deliveries", response_model=NotificationDeliveryListResponse)
def list_alert_deliveries(
    subscription_id: str,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
) -> NotificationDeliveryListResponse:
    subscription_repo = AlertSubscriptionRepository(db)
    if not subscription_repo.get_subscription(subscription_id):
        raise HTTPException(status_code=404, detail="Alert subscription not found")

    repo = NotificationDeliveryRepository(db)
    result = repo.list_for_subscription(subscription_id, page=page, size=size)
    return NotificationDeliveryListResponse(
        items=[NotificationDeliveryRead.model_validate(item) for item in result.items],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )


@router.delete("/{subscription_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_alert_subscription(
    subscription_id: str,
    db: Session = Depends(get_db),
) -> Response:
    repo = AlertSubscriptionRepository(db)
    deleted = repo.delete_subscription(subscription_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Alert subscription not found")
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
