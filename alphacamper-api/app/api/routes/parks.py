from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.availability import AvailabilityRepository
from app.repositories.notices import NoticeRepository
from app.repositories.parks import ParkRepository
from app.schemas.common import PageMeta
from app.schemas.parks import ParkDetail, ParkListResponse, ParkSummary

router = APIRouter()


@router.get("", response_model=ParkListResponse)
def list_parks(
    response: Response,
    country: str | None = Query(default=None),
    state_province: str | None = Query(default=None),
    provider_id: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> ParkListResponse:
    response.headers["Cache-Control"] = "public, max-age=900, stale-while-revalidate=3600"
    repo = ParkRepository(db)
    result = repo.list_parks(
        country=country,
        state_province=state_province,
        provider_id=provider_id,
        keyword=keyword,
        page=page,
        size=size,
    )
    return ParkListResponse(
        items=[ParkSummary.model_validate(item) for item in result.items],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )


@router.get("/{park_id}", response_model=ParkDetail)
def get_park(
    park_id: str,
    response: Response,
    db: Session = Depends(get_db),
) -> ParkDetail:
    response.headers["Cache-Control"] = "public, max-age=900, stale-while-revalidate=3600"
    park_repo = ParkRepository(db)
    availability_repo = AvailabilityRepository(db)
    notice_repo = NoticeRepository(db)
    park = park_repo.get_park_with_related(park_id)
    if not park:
        raise HTTPException(status_code=404, detail="Park not found")
    detail = ParkDetail.model_validate(park)
    return detail.model_copy(
        update={
            "latest_availability_fetched_at": availability_repo.latest_fetched_at_for_park(park_id),
            "active_notice_count": notice_repo.count_active_for_targets(park_id=park.id),
            "source_attribution": _build_park_sources(park),
        }
    )


def _build_park_sources(park) -> list[str]:
    sources: list[str] = []
    if park.provider and park.provider.name:
        sources.append(park.provider.name)
    metadata = park.metadata_json or {}
    if "statscan_odrsf" in metadata:
        sources.append("Statistics Canada ODRSF")
    for key in metadata.keys():
        if key not in {"statscan_odrsf", "source"}:
            sources.append(key.replace("_", " "))
    return list(dict.fromkeys(sources))
