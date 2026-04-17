from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import case, func, select
from sqlalchemy.orm import Session

from app.models.entities import (
    AlertSubscription,
    CatalogRefreshJob,
    NotificationDelivery,
    Provider,
    ProviderRateLimitState,
)
from app.services.provider_quality import get_provider_quality


class AdminRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def provider_health_rows(self) -> list[dict]:
        stmt = (
            select(
                Provider.id,
                Provider.name,
                Provider.base_url,
                Provider.country,
                Provider.kind,
                ProviderRateLimitState.last_request_at,
                ProviderRateLimitState.next_allowed_at,
                ProviderRateLimitState.current_backoff_seconds,
                ProviderRateLimitState.consecutive_errors,
                ProviderRateLimitState.last_error_code,
            )
            .join(
                ProviderRateLimitState,
                ProviderRateLimitState.provider_id == Provider.id,
                isouter=True,
            )
            .order_by(Provider.name.asc())
        )
        rows = []
        for row in self.session.execute(stmt):
            quality = get_provider_quality(base_url=row.base_url, provider_name=row.name)
            if row.current_backoff_seconds and row.current_backoff_seconds > 0:
                status = "backing_off"
            elif row.consecutive_errors and row.consecutive_errors > 0:
                status = "degraded"
            elif row.last_request_at:
                status = "healthy"
            else:
                status = "idle"
            rows.append(
                {
                    "provider_id": row.id,
                    "provider_name": row.name,
                    "country": row.country,
                    "kind": row.kind.value if hasattr(row.kind, "value") else str(row.kind),
                    "status": status,
                    "availability_mode": quality.availability_mode,
                    "confidence": quality.confidence,
                    "verification_note": quality.verification_note,
                    "last_request_at": row.last_request_at,
                    "next_allowed_at": row.next_allowed_at,
                    "current_backoff_seconds": row.current_backoff_seconds or 0,
                    "consecutive_errors": row.consecutive_errors or 0,
                    "last_error_code": row.last_error_code,
                }
        )
        return rows

    def provider_quality_summary(self) -> dict:
        rows = self.provider_health_rows()
        counts = {
            "total": len(rows),
            "live_polling": 0,
            "directory_only": 0,
            "metadata_only": 0,
            "verified": 0,
            "inferred": 0,
            "seeded": 0,
            "unknown": 0,
        }
        for row in rows:
            availability_mode = row["availability_mode"]
            confidence = row["confidence"]
            if availability_mode in counts:
                counts[availability_mode] += 1
            if confidence in counts:
                counts[confidence] += 1
        return counts

    def alert_delivery_summary(self) -> dict:
        stmt = select(
            func.count().label("total"),
            func.sum(case((NotificationDelivery.status == "delivered", 1), else_=0)).label("delivered"),
            func.sum(case((NotificationDelivery.status == "failed", 1), else_=0)).label("failed"),
            func.sum(case((NotificationDelivery.notification_channel == "webhook", 1), else_=0)).label("webhook"),
            func.sum(case((NotificationDelivery.notification_channel == "email", 1), else_=0)).label("email"),
        )
        row = self.session.execute(stmt).one()
        active_alerts = self.session.scalar(
            select(func.count()).select_from(AlertSubscription).where(AlertSubscription.paused.is_(False))
        ) or 0
        return {
            "active_alerts": int(active_alerts),
            "total_deliveries": int(row.total or 0),
            "delivered": int(row.delivered or 0),
            "failed": int(row.failed or 0),
            "webhook_deliveries": int(row.webhook or 0),
            "email_deliveries": int(row.email or 0),
        }

    def create_catalog_refresh_job(
        self,
        *,
        mode: str,
        requested_by: str | None,
        trigger_source: str,
        metadata_json: dict | None,
    ) -> CatalogRefreshJob:
        job = CatalogRefreshJob(
            mode=mode,
            status="queued",
            requested_by=requested_by,
            trigger_source=trigger_source,
            requested_at=datetime.now(timezone.utc),
            metadata_json=metadata_json,
        )
        self.session.add(job)
        self.session.flush()
        return job

    def list_catalog_refresh_jobs(self, *, limit: int = 20) -> list[CatalogRefreshJob]:
        stmt = (
            select(CatalogRefreshJob)
            .order_by(CatalogRefreshJob.requested_at.desc())
            .limit(limit)
        )
        return list(self.session.scalars(stmt))

    def get_catalog_refresh_job(self, job_id: str) -> CatalogRefreshJob | None:
        return self.session.get(CatalogRefreshJob, job_id)
