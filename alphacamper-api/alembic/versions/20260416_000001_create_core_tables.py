"""create core tables

Revision ID: 20260416_000001
Revises:
Create Date: 2026-04-16 22:35:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260416_000001"
down_revision = None
branch_labels = None
depends_on = None


provider_kind = postgresql.ENUM(
    "federal",
    "state",
    "provincial",
    "private",
    "platform",
    name="provider_kind",
    create_type=False,
)
availability_status = postgresql.ENUM(
    "available",
    "unavailable",
    "reserved",
    "closed",
    "first-come-first-serve",
    "not-yet-released",
    "unknown",
    name="availability_status",
    create_type=False,
)
notification_channel = postgresql.ENUM(
    "email",
    "sms",
    "webhook",
    name="notification_channel",
    create_type=False,
)


def upgrade() -> None:
    provider_kind.create(op.get_bind(), checkfirst=True)
    availability_status.create(op.get_bind(), checkfirst=True)
    notification_channel.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "providers",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("kind", provider_kind, nullable=False),
        sa.Column("base_url", sa.String(length=512), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "parks",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("external_park_id", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("country", sa.String(length=2), nullable=False),
        sa.Column("region", sa.String(length=255), nullable=True),
        sa.Column("state_province", sa.String(length=64), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("boundary_geom", sa.Text(), nullable=True),
        sa.Column("nps_park_code", sa.String(length=32), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_id", "external_park_id", name="uq_park_provider_external"),
    )
    op.create_index("ix_parks_country_state", "parks", ["country", "state_province"])

    op.create_table(
        "campgrounds",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("park_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("external_facility_id", sa.String(length=255), nullable=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("elevation", sa.Integer(), nullable=True),
        sa.Column("timezone", sa.String(length=64), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("driving_directions", sa.Text(), nullable=True),
        sa.Column("season_open", sa.Date(), nullable=True),
        sa.Column("season_close", sa.Date(), nullable=True),
        sa.Column("booking_url", sa.String(length=512), nullable=True),
        sa.Column("max_advance_reservation_days", sa.Integer(), nullable=True),
        sa.Column("amenities", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("accessibility", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("cell_coverage", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("photos", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["park_id"], ["parks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider_id",
            "external_facility_id",
            name="uq_campground_provider_external",
        ),
    )
    op.create_index("ix_campgrounds_park_id", "campgrounds", ["park_id"])

    op.create_table(
        "campsites",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campground_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("external_campsite_id", sa.String(length=255), nullable=True),
        sa.Column("loop_name", sa.String(length=255), nullable=True),
        sa.Column("site_number", sa.String(length=64), nullable=True),
        sa.Column("site_name", sa.String(length=255), nullable=True),
        sa.Column("lat", sa.Numeric(9, 6), nullable=True),
        sa.Column("lon", sa.Numeric(9, 6), nullable=True),
        sa.Column("equipment_types", postgresql.ARRAY(sa.String(length=64)), nullable=True),
        sa.Column("max_occupancy", sa.Integer(), nullable=True),
        sa.Column("max_vehicle_length", sa.Numeric(6, 2), nullable=True),
        sa.Column("is_group_site", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_walk_in", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("has_electric", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("has_sewer", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("has_water", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("is_accessible", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("attributes", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["campground_id"], ["campgrounds.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "provider_id",
            "external_campsite_id",
            name="uq_campsite_provider_external",
        ),
    )
    op.create_index("ix_campsites_campground_id", "campsites", ["campground_id"])

    op.create_table(
        "availability_snapshots",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campground_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("campsite_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("fetched_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", availability_status, nullable=False),
        sa.Column("min_nights", sa.Integer(), nullable=True),
        sa.Column("max_nights", sa.Integer(), nullable=True),
        sa.Column("price", sa.Numeric(10, 2), nullable=True),
        sa.Column("currency", sa.String(length=3), nullable=True),
        sa.Column("raw_payload", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("hash", sa.String(length=128), nullable=True),
        sa.ForeignKeyConstraint(["campground_id"], ["campgrounds.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["campsite_id"], ["campsites.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_availability_lookup",
        "availability_snapshots",
        ["campground_id", "date", "fetched_at"],
    )
    op.create_index("ix_availability_hash", "availability_snapshots", ["hash"])

    op.create_table(
        "alert_subscriptions",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("user_id", sa.String(length=255), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("phone", sa.String(length=64), nullable=True),
        sa.Column("webhook_url", sa.String(length=512), nullable=True),
        sa.Column("country", sa.String(length=2), nullable=True),
        sa.Column("state_province", sa.String(length=64), nullable=True),
        sa.Column("park_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("campground_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("campsite_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("date_start", sa.Date(), nullable=False),
        sa.Column("date_end", sa.Date(), nullable=False),
        sa.Column("min_nights", sa.Integer(), nullable=True),
        sa.Column("max_nights", sa.Integer(), nullable=True),
        sa.Column("equipment_type", sa.String(length=64), nullable=True),
        sa.Column("max_price", sa.Numeric(10, 2), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("paused", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("last_notified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notification_channel", notification_channel, nullable=False),
        sa.ForeignKeyConstraint(["campground_id"], ["campgrounds.id"]),
        sa.ForeignKeyConstraint(["campsite_id"], ["campsites.id"]),
        sa.ForeignKeyConstraint(["park_id"], ["parks.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_alert_subscription_window",
        "alert_subscriptions",
        ["date_start", "date_end", "paused"],
    )
    op.create_index(
        "ix_alert_subscription_location",
        "alert_subscriptions",
        ["park_id", "campground_id", "campsite_id"],
    )

    op.create_table(
        "provider_rate_limit_state",
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("last_request_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("next_allowed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("current_backoff_seconds", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("consecutive_errors", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_error_code", sa.String(length=64), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("provider_id"),
    )

    op.create_table(
        "notices",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("provider_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("park_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("campground_id", postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column("external_notice_id", sa.String(length=255), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("body", sa.Text(), nullable=True),
        sa.Column("severity", sa.String(length=64), nullable=True),
        sa.Column("status", sa.String(length=64), nullable=True),
        sa.Column("url", sa.String(length=512), nullable=True),
        sa.Column("effective_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(["campground_id"], ["campgrounds.id"]),
        sa.ForeignKeyConstraint(["park_id"], ["parks.id"]),
        sa.ForeignKeyConstraint(["provider_id"], ["providers.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notices_lookup",
        "notices",
        ["provider_id", "park_id", "campground_id", "effective_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_notices_lookup", table_name="notices")
    op.drop_table("notices")
    op.drop_table("provider_rate_limit_state")
    op.drop_index("ix_alert_subscription_location", table_name="alert_subscriptions")
    op.drop_index("ix_alert_subscription_window", table_name="alert_subscriptions")
    op.drop_table("alert_subscriptions")
    op.drop_index("ix_availability_hash", table_name="availability_snapshots")
    op.drop_index("ix_availability_lookup", table_name="availability_snapshots")
    op.drop_table("availability_snapshots")
    op.drop_index("ix_campsites_campground_id", table_name="campsites")
    op.drop_table("campsites")
    op.drop_index("ix_campgrounds_park_id", table_name="campgrounds")
    op.drop_table("campgrounds")
    op.drop_index("ix_parks_country_state", table_name="parks")
    op.drop_table("parks")
    op.drop_table("providers")

    notification_channel.drop(op.get_bind(), checkfirst=True)
    availability_status.drop(op.get_bind(), checkfirst=True)
    provider_kind.drop(op.get_bind(), checkfirst=True)
