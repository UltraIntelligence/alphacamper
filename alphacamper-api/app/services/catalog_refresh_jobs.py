from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Select, select

from app.core.config import settings
from app.core.database import SessionLocal
from app.models.entities import CatalogRefreshJob
from app.services.catalog_refresh import promote_catalog


def serialize_catalog_refresh_job(job: CatalogRefreshJob) -> dict:
    return {
        "id": job.id,
        "mode": job.mode,
        "status": job.status,
        "requested_by": job.requested_by,
        "trigger_source": job.trigger_source,
        "requested_at": job.requested_at,
        "started_at": job.started_at,
        "finished_at": job.finished_at,
        "summary_json": job.summary_json,
        "metadata_json": job.metadata_json,
        "error_message": job.error_message,
    }


def claim_next_catalog_refresh_job() -> CatalogRefreshJob | None:
    with SessionLocal() as session:
        stmt: Select[tuple[CatalogRefreshJob]] = (
            select(CatalogRefreshJob)
            .where(CatalogRefreshJob.status == "queued")
            .order_by(CatalogRefreshJob.requested_at.asc())
            .with_for_update(skip_locked=True)
        )
        job = session.execute(stmt).scalar_one_or_none()
        if job is None:
            return None

        job.status = "running"
        job.started_at = datetime.now(timezone.utc)
        job.finished_at = None
        job.error_message = None
        session.commit()
        session.refresh(job)
        return job


def mark_catalog_refresh_job_succeeded(job_id: str, summary: dict[str, int]) -> CatalogRefreshJob:
    with SessionLocal() as session:
        job = session.get(CatalogRefreshJob, job_id)
        if job is None:
            raise RuntimeError(f"Catalog refresh job {job_id} not found")
        job.status = "succeeded"
        job.summary_json = summary
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = None
        session.commit()
        session.refresh(job)
        return job


def mark_catalog_refresh_job_failed(job_id: str, error_message: str) -> CatalogRefreshJob:
    with SessionLocal() as session:
        job = session.get(CatalogRefreshJob, job_id)
        if job is None:
            raise RuntimeError(f"Catalog refresh job {job_id} not found")
        job.status = "failed"
        job.finished_at = datetime.now(timezone.utc)
        job.error_message = error_message
        session.commit()
        session.refresh(job)
        return job


def process_catalog_refresh_job(
    *,
    job_id: str,
    source_database_url: str | None,
) -> CatalogRefreshJob:
    with SessionLocal() as session:
        job = session.get(CatalogRefreshJob, job_id)
        if job is None:
            raise RuntimeError(f"Catalog refresh job {job_id} not found")
        mode = job.mode

    if mode != "promote_local_catalog":
        return mark_catalog_refresh_job_failed(job_id, f"Unsupported catalog refresh mode: {mode}")

    if not source_database_url:
        return mark_catalog_refresh_job_failed(
            job_id,
            "SOURCE_DATABASE_URL is required for promote_local_catalog jobs.",
        )

    try:
        summary = promote_catalog(
            source_database_url=source_database_url.replace("+psycopg", ""),
            target_database_url=settings.database_url.replace("+psycopg", ""),
        )
    except Exception as exc:  # pragma: no cover - defensive runner path
        return mark_catalog_refresh_job_failed(job_id, str(exc))

    return mark_catalog_refresh_job_succeeded(job_id, summary)


def process_next_catalog_refresh_job(*, source_database_url: str | None) -> CatalogRefreshJob | None:
    job = claim_next_catalog_refresh_job()
    if job is None:
        return None
    return process_catalog_refresh_job(job_id=job.id, source_database_url=source_database_url)
