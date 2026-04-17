from hmac import compare_digest

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.admin import AdminRepository
from app.schemas.admin import (
    AdminOverviewResponse,
    CatalogRefreshJobCreateRequest,
    CatalogRefreshJobResponse,
)
from app.services.catalog_refresh_jobs import serialize_catalog_refresh_job

router = APIRouter()


def require_admin_access(x_admin_key: str | None = Header(default=None)) -> None:
    if settings.environment == "development" and not settings.admin_api_key:
        return
    if not settings.admin_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin API key is not configured.",
        )
    if not x_admin_key or not compare_digest(x_admin_key, settings.admin_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin API key.",
        )


@router.get("/overview", response_model=AdminOverviewResponse)
def get_admin_overview(
    response: Response,
    db: Session = Depends(get_db),
) -> AdminOverviewResponse:
    response.headers["Cache-Control"] = "no-store"
    repo = AdminRepository(db)
    return AdminOverviewResponse(
        providers=repo.provider_health_rows(),
        provider_quality=repo.provider_quality_summary(),
        alert_delivery=repo.alert_delivery_summary(),
    )


@router.post(
    "/catalog-refresh-jobs",
    response_model=CatalogRefreshJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def create_catalog_refresh_job(
    payload: CatalogRefreshJobCreateRequest,
    response: Response,
    _: None = Depends(require_admin_access),
    db: Session = Depends(get_db),
) -> CatalogRefreshJobResponse:
    response.headers["Cache-Control"] = "no-store"
    repo = AdminRepository(db)
    job = repo.create_catalog_refresh_job(
        mode=payload.mode,
        requested_by=payload.requested_by,
        trigger_source="api",
        metadata_json={
            "source_label": payload.source_label,
            "notes": payload.notes,
        },
    )
    db.commit()
    db.refresh(job)
    return CatalogRefreshJobResponse(**serialize_catalog_refresh_job(job))


@router.get("/catalog-refresh-jobs", response_model=list[CatalogRefreshJobResponse])
def list_catalog_refresh_jobs(
    response: Response,
    _: None = Depends(require_admin_access),
    db: Session = Depends(get_db),
) -> list[CatalogRefreshJobResponse]:
    response.headers["Cache-Control"] = "no-store"
    repo = AdminRepository(db)
    jobs = repo.list_catalog_refresh_jobs()
    return [CatalogRefreshJobResponse(**serialize_catalog_refresh_job(job)) for job in jobs]


@router.get("/catalog-refresh-jobs/{job_id}", response_model=CatalogRefreshJobResponse)
def get_catalog_refresh_job(
    job_id: str,
    response: Response,
    _: None = Depends(require_admin_access),
    db: Session = Depends(get_db),
) -> CatalogRefreshJobResponse:
    response.headers["Cache-Control"] = "no-store"
    repo = AdminRepository(db)
    job = repo.get_catalog_refresh_job(job_id)
    if job is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Catalog refresh job not found.")
    return CatalogRefreshJobResponse(**serialize_catalog_refresh_job(job))
