from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.campsites import CampsiteRepository
from app.schemas.campsites import CampsiteDetail, CampsiteListResponse, CampsiteSummary
from app.schemas.common import PageMeta

router = APIRouter()


@router.get("", response_model=CampsiteListResponse)
def list_campsites(
    response: Response,
    campground_id: str | None = Query(default=None),
    equipment_type: str | None = Query(default=None),
    is_group_site: bool | None = Query(default=None),
    is_accessible: bool | None = Query(default=None),
    waterfront: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> CampsiteListResponse:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=900"
    repo = CampsiteRepository(db)
    result = repo.list_campsites(
        campground_id=campground_id,
        equipment_type=equipment_type,
        is_group_site=is_group_site,
        is_accessible=is_accessible,
        waterfront=waterfront,
        page=page,
        size=size,
    )
    return CampsiteListResponse(
        items=[CampsiteSummary.model_validate(item) for item in result.items],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )


@router.get("/{campsite_id}", response_model=CampsiteDetail)
def get_campsite(
    campsite_id: str,
    response: Response,
    db: Session = Depends(get_db),
) -> CampsiteDetail:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=1800"
    repo = CampsiteRepository(db)
    campsite = repo.get_campsite_with_related(campsite_id)
    if not campsite:
        raise HTTPException(status_code=404, detail="Campsite not found")
    return CampsiteDetail.model_validate(campsite)
