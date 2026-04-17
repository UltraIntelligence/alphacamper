from __future__ import annotations

from datetime import date, datetime
from datetime import timezone
from decimal import Decimal
from uuid import uuid4

from sqlalchemy import (
    ARRAY,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.enums import AvailabilityStatus, NotificationChannel, ProviderKind


def enum_values(enum_cls: type) -> list[str]:
    return [member.value for member in enum_cls]


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    kind: Mapped[ProviderKind] = mapped_column(
        Enum(ProviderKind, name="provider_kind", values_callable=enum_values),
        nullable=False,
    )
    base_url: Mapped[str | None] = mapped_column(String(512))
    country: Mapped[str | None] = mapped_column(String(2))
    notes: Mapped[str | None] = mapped_column(Text)

    parks: Mapped[list["Park"]] = relationship(back_populates="provider")
    campgrounds: Mapped[list["Campground"]] = relationship(back_populates="provider")
    campsites: Mapped[list["Campsite"]] = relationship(back_populates="provider")


class Park(Base):
    __tablename__ = "parks"
    __table_args__ = (
        UniqueConstraint("provider_id", "external_park_id", name="uq_park_provider_external"),
        Index("ix_parks_country_state", "country", "state_province"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_park_id: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country: Mapped[str] = mapped_column(String(2), nullable=False)
    region: Mapped[str | None] = mapped_column(String(255))
    state_province: Mapped[str | None] = mapped_column(String(64))
    lat: Mapped[float | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[float | None] = mapped_column(Numeric(9, 6))
    # Store boundary polygons as WKT text for broad database compatibility.
    boundary_geom: Mapped[str | None] = mapped_column(Text)
    nps_park_code: Mapped[str | None] = mapped_column(String(32))
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)

    provider: Mapped["Provider"] = relationship(back_populates="parks")
    campgrounds: Mapped[list["Campground"]] = relationship(back_populates="park")


class Campground(Base):
    __tablename__ = "campgrounds"
    __table_args__ = (
        UniqueConstraint(
            "provider_id", "external_facility_id", name="uq_campground_provider_external"
        ),
        Index("ix_campgrounds_park_id", "park_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    park_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("parks.id", ondelete="SET NULL")
    )
    external_facility_id: Mapped[str | None] = mapped_column(String(255))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    lat: Mapped[float | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[float | None] = mapped_column(Numeric(9, 6))
    elevation: Mapped[int | None] = mapped_column(Integer)
    timezone: Mapped[str | None] = mapped_column(String(64))
    address: Mapped[str | None] = mapped_column(Text)
    driving_directions: Mapped[str | None] = mapped_column(Text)
    season_open: Mapped[date | None] = mapped_column(Date)
    season_close: Mapped[date | None] = mapped_column(Date)
    booking_url: Mapped[str | None] = mapped_column(String(512))
    max_advance_reservation_days: Mapped[int | None] = mapped_column(Integer)
    amenities: Mapped[dict | None] = mapped_column(JSONB)
    accessibility: Mapped[dict | None] = mapped_column(JSONB)
    cell_coverage: Mapped[dict | None] = mapped_column(JSONB)
    photos: Mapped[list[dict] | None] = mapped_column(JSONB)

    provider: Mapped["Provider"] = relationship(back_populates="campgrounds")
    park: Mapped[Park | None] = relationship(back_populates="campgrounds")
    campsites: Mapped[list["Campsite"]] = relationship(back_populates="campground")


class Campsite(Base):
    __tablename__ = "campsites"
    __table_args__ = (
        UniqueConstraint("provider_id", "external_campsite_id", name="uq_campsite_provider_external"),
        Index("ix_campsites_campground_id", "campground_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    campground_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("campgrounds.id", ondelete="CASCADE"),
        nullable=False,
    )
    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    external_campsite_id: Mapped[str | None] = mapped_column(String(255))
    loop_name: Mapped[str | None] = mapped_column(String(255))
    site_number: Mapped[str | None] = mapped_column(String(64))
    site_name: Mapped[str | None] = mapped_column(String(255))
    lat: Mapped[float | None] = mapped_column(Numeric(9, 6))
    lon: Mapped[float | None] = mapped_column(Numeric(9, 6))
    equipment_types: Mapped[list[str] | None] = mapped_column(ARRAY(String(64)))
    max_occupancy: Mapped[int | None] = mapped_column(Integer)
    max_vehicle_length: Mapped[Decimal | None] = mapped_column(Numeric(6, 2))
    is_group_site: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_walk_in: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_electric: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_sewer: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    has_water: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_accessible: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    attributes: Mapped[dict | None] = mapped_column(JSONB)

    campground: Mapped["Campground"] = relationship(back_populates="campsites")
    provider: Mapped["Provider"] = relationship(back_populates="campsites")
    availability_snapshots: Mapped[list["AvailabilitySnapshot"]] = relationship(
        back_populates="campsite"
    )


class AvailabilitySnapshot(Base):
    __tablename__ = "availability_snapshots"
    __table_args__ = (
        Index("ix_availability_lookup", "campground_id", "date", "fetched_at"),
        Index("ix_availability_hash", "hash"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    campground_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("campgrounds.id", ondelete="CASCADE"),
        nullable=False,
    )
    campsite_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("campsites.id", ondelete="CASCADE")
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[AvailabilityStatus] = mapped_column(
        Enum(AvailabilityStatus, name="availability_status", values_callable=enum_values),
        nullable=False,
    )
    min_nights: Mapped[int | None] = mapped_column(Integer)
    max_nights: Mapped[int | None] = mapped_column(Integer)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    currency: Mapped[str | None] = mapped_column(String(3))
    raw_payload: Mapped[dict | None] = mapped_column(JSONB)
    hash: Mapped[str | None] = mapped_column(String(128))

    campsite: Mapped[Campsite | None] = relationship(back_populates="availability_snapshots")


class AlertSubscription(Base):
    __tablename__ = "alert_subscriptions"
    __table_args__ = (
        Index("ix_alert_subscription_window", "date_start", "date_end", "paused"),
        Index("ix_alert_subscription_location", "park_id", "campground_id", "campsite_id"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(String(255))
    email: Mapped[str | None] = mapped_column(String(255))
    phone: Mapped[str | None] = mapped_column(String(64))
    webhook_url: Mapped[str | None] = mapped_column(String(512))
    country: Mapped[str | None] = mapped_column(String(2))
    state_province: Mapped[str | None] = mapped_column(String(64))
    park_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("parks.id"))
    campground_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("campgrounds.id")
    )
    campsite_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("campsites.id")
    )
    date_start: Mapped[date] = mapped_column(Date, nullable=False)
    date_end: Mapped[date] = mapped_column(Date, nullable=False)
    min_nights: Mapped[int | None] = mapped_column(Integer)
    max_nights: Mapped[int | None] = mapped_column(Integer)
    equipment_type: Mapped[str | None] = mapped_column(String(64))
    max_price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    paused: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    last_notified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    notification_channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel", values_callable=enum_values),
        nullable=False,
    )
    deliveries: Mapped[list["NotificationDelivery"]] = relationship(
        back_populates="subscription",
        cascade="all, delete-orphan",
    )


class Notice(Base):
    __tablename__ = "notices"
    __table_args__ = (
        Index("ix_notices_lookup", "provider_id", "park_id", "campground_id", "effective_at"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        nullable=False,
    )
    park_id: Mapped[str | None] = mapped_column(UUID(as_uuid=False), ForeignKey("parks.id"))
    campground_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False), ForeignKey("campgrounds.id")
    )
    external_notice_id: Mapped[str | None] = mapped_column(String(255))
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str | None] = mapped_column(Text)
    body: Mapped[str | None] = mapped_column(Text)
    severity: Mapped[str | None] = mapped_column(String(64))
    status: Mapped[str | None] = mapped_column(String(64))
    url: Mapped[str | None] = mapped_column(String(512))
    effective_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)


class NotificationDelivery(Base):
    __tablename__ = "notification_deliveries"
    __table_args__ = (
        Index("ix_notification_deliveries_subscription", "alert_subscription_id", "attempted_at"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    alert_subscription_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("alert_subscriptions.id", ondelete="CASCADE"),
        nullable=False,
    )
    notification_channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel", values_callable=enum_values),
        nullable=False,
    )
    destination: Mapped[str | None] = mapped_column(String(512))
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False, default="availability.alert.matched")
    provider_name: Mapped[str | None] = mapped_column(String(255))
    payload_json: Mapped[dict | None] = mapped_column(JSONB)
    request_signature: Mapped[str | None] = mapped_column(String(255))
    response_status_code: Mapped[int | None] = mapped_column(Integer)
    response_body: Mapped[str | None] = mapped_column(Text)
    external_delivery_id: Mapped[str | None] = mapped_column(String(255))
    error_message: Mapped[str | None] = mapped_column(Text)
    attempted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    subscription: Mapped["AlertSubscription"] = relationship(back_populates="deliveries")


class ProviderRateLimitState(Base):
    __tablename__ = "provider_rate_limit_state"

    provider_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("providers.id", ondelete="CASCADE"),
        primary_key=True,
    )
    last_request_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_allowed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    current_backoff_seconds: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    consecutive_errors: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_error_code: Mapped[str | None] = mapped_column(String(64))
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)


class CatalogRefreshJob(Base):
    __tablename__ = "catalog_refresh_jobs"
    __table_args__ = (
        Index("ix_catalog_refresh_jobs_status_requested", "status", "requested_at"),
    )

    id: Mapped[str] = mapped_column(UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid4()))
    mode: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued")
    requested_by: Mapped[str | None] = mapped_column(String(255))
    trigger_source: Mapped[str | None] = mapped_column(String(64))
    requested_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    summary_json: Mapped[dict | None] = mapped_column(JSONB)
    metadata_json: Mapped[dict | None] = mapped_column(JSONB)
    error_message: Mapped[str | None] = mapped_column(Text)
