from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, HttpUrl

from app.schemas.common import OrmModel, PageMeta


class AlertSubscriptionCreate(BaseModel):
    user_id: str | None = None
    email: str | None = None
    phone: str | None = None
    webhook_url: HttpUrl | None = None
    country: str | None = Field(default=None, min_length=2, max_length=2)
    state_province: str | None = None
    park_id: str | None = None
    campground_id: str | None = None
    campsite_id: str | None = None
    date_start: date
    date_end: date
    min_nights: int | None = None
    max_nights: int | None = None
    equipment_type: str | None = None
    max_price: Decimal | None = None
    metadata: dict | None = None
    notification_channel: str


class AlertSubscriptionRead(OrmModel):
    id: str
    user_id: str | None = None
    email: str | None = None
    phone: str | None = None
    webhook_url: str | None = None
    country: str | None = None
    state_province: str | None = None
    park_id: str | None = None
    campground_id: str | None = None
    campsite_id: str | None = None
    date_start: date
    date_end: date
    min_nights: int | None = None
    max_nights: int | None = None
    equipment_type: str | None = None
    max_price: Decimal | None = None
    metadata_json: dict | None = None
    created_at: datetime
    paused: bool
    last_notified_at: datetime | None = None
    notification_channel: str


class AlertSubscriptionUpdate(BaseModel):
    email: str | None = None
    phone: str | None = None
    webhook_url: HttpUrl | None = None
    date_start: date | None = None
    date_end: date | None = None
    min_nights: int | None = None
    max_nights: int | None = None
    equipment_type: str | None = None
    max_price: Decimal | None = None
    metadata: dict | None = None
    paused: bool | None = None
    notification_channel: str | None = None


class NotificationDeliveryRead(OrmModel):
    id: str
    alert_subscription_id: str
    notification_channel: str
    destination: str | None = None
    status: str
    event_type: str
    provider_name: str | None = None
    payload_json: dict | None = None
    request_signature: str | None = None
    response_status_code: int | None = None
    response_body: str | None = None
    external_delivery_id: str | None = None
    error_message: str | None = None
    attempted_at: datetime
    delivered_at: datetime | None = None


class NotificationDeliveryListResponse(BaseModel):
    items: list[NotificationDeliveryRead]
    meta: PageMeta
