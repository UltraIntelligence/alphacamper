"""add notification deliveries

Revision ID: 20260417_000002
Revises: 20260416_000001
Create Date: 2026-04-17 12:30:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = "20260417_000002"
down_revision = "20260416_000001"
branch_labels = None
depends_on = None


notification_channel = postgresql.ENUM(
    "email",
    "sms",
    "webhook",
    name="notification_channel",
    create_type=False,
)


def upgrade() -> None:
    notification_channel.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "notification_deliveries",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("alert_subscription_id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("notification_channel", notification_channel, nullable=False),
        sa.Column("destination", sa.String(length=512), nullable=True),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("provider_name", sa.String(length=255), nullable=True),
        sa.Column("payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("request_signature", sa.String(length=255), nullable=True),
        sa.Column("response_status_code", sa.Integer(), nullable=True),
        sa.Column("response_body", sa.Text(), nullable=True),
        sa.Column("external_delivery_id", sa.String(length=255), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("attempted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(
            ["alert_subscription_id"],
            ["alert_subscriptions.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_notification_deliveries_subscription",
        "notification_deliveries",
        ["alert_subscription_id", "attempted_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_notification_deliveries_subscription", table_name="notification_deliveries")
    op.drop_table("notification_deliveries")
