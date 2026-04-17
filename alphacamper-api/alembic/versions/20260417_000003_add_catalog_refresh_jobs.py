"""add catalog refresh jobs

Revision ID: 20260417_000003
Revises: 20260417_000002
Create Date: 2026-04-17 22:10:00.000000
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "20260417_000003"
down_revision = "20260417_000002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "catalog_refresh_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column("mode", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=32), nullable=False),
        sa.Column("requested_by", sa.String(length=255), nullable=True),
        sa.Column("trigger_source", sa.String(length=64), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("summary_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("metadata_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "ix_catalog_refresh_jobs_status_requested",
        "catalog_refresh_jobs",
        ["status", "requested_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_catalog_refresh_jobs_status_requested", table_name="catalog_refresh_jobs")
    op.drop_table("catalog_refresh_jobs")
