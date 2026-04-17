from fastapi import APIRouter, Depends, HTTPException, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.availability import AvailabilityRepository
from app.repositories.campgrounds import CampgroundRepository
from app.repositories.notices import NoticeRepository
from app.schemas.availability import (
    AvailabilityCampsite,
    AvailabilityNight,
    BulkAvailabilityRequest,
    BulkAvailabilityResponse,
    BulkCampgroundAvailability,
)
from app.schemas.campgrounds import CampgroundDetail, CampgroundListResponse, CampgroundSummary
from app.schemas.common import PageMeta

router = APIRouter()


@router.get("", response_model=CampgroundListResponse)
def list_campgrounds(
    response: Response,
    country: str | None = Query(default=None),
    state_province: str | None = Query(default=None),
    park_id: str | None = Query(default=None),
    provider_id: str | None = Query(default=None),
    keyword: str | None = Query(default=None),
    has_electric: bool | None = Query(default=None),
    max_vehicle_length: float | None = Query(default=None),
    waterfront: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> CampgroundListResponse:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=900"
    repo = CampgroundRepository(db)
    result = repo.list_campgrounds(
        country=country,
        state_province=state_province,
        park_id=park_id,
        provider_id=provider_id,
        keyword=keyword,
        has_electric=has_electric,
        max_vehicle_length=max_vehicle_length,
        waterfront=waterfront,
        page=page,
        size=size,
    )
    return CampgroundListResponse(
        items=[CampgroundSummary.model_validate(item) for item in result.items],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )


@router.get("/search", response_model=CampgroundListResponse)
def search_campgrounds(
    response: Response,
    q: str = Query(..., min_length=2),
    country: str | None = Query(default=None),
    state_province: str | None = Query(default=None),
    provider_id: str | None = Query(default=None),
    has_electric: bool | None = Query(default=None),
    waterfront: bool | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> CampgroundListResponse:
    return list_campgrounds(
        response=response,
        country=country,
        state_province=state_province,
        park_id=None,
        provider_id=provider_id,
        keyword=q,
        has_electric=has_electric,
        max_vehicle_length=None,
        waterfront=waterfront,
        page=page,
        size=size,
        db=db,
    )


@router.get("/{campground_id}", response_model=CampgroundDetail)
def get_campground(
    campground_id: str,
    response: Response,
    db: Session = Depends(get_db),
) -> CampgroundDetail:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=1800"
    campground_repo = CampgroundRepository(db)
    availability_repo = AvailabilityRepository(db)
    notice_repo = NoticeRepository(db)
    campground = campground_repo.get_campground_with_related(campground_id)
    if not campground:
        raise HTTPException(status_code=404, detail="Campground not found")
    detail = CampgroundDetail.model_validate(campground)
    return detail.model_copy(
        update={
            "latest_availability_fetched_at": availability_repo.latest_fetched_at_for_campground(
                campground_id
            ),
            "active_notice_count": notice_repo.count_active_for_targets(
                park_id=campground.park_id,
                campground_id=campground.id,
            ),
            "source_attribution": _build_campground_sources(campground),
        }
    )


@router.post("/availability", response_model=BulkAvailabilityResponse)
def bulk_availability(
    payload: BulkAvailabilityRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> BulkAvailabilityResponse:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    repo = AvailabilityRepository(db)

    campgrounds: list[BulkCampgroundAvailability] = []
    for campground_id in payload.campground_ids:
        rows = repo.list_latest_for_campground(
            campground_id=campground_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            equipment_type=payload.equipment_type,
        )

        campsite_map: dict[str, AvailabilityCampsite] = {}
        for snapshot, campsite in rows:
            campsite_key = snapshot.campsite_id or f"unknown:{snapshot.date.isoformat()}"
            campsite_entry = campsite_map.setdefault(
                campsite_key,
                AvailabilityCampsite(
                    campsite_id=snapshot.campsite_id,
                    site_number=campsite.site_number if campsite else None,
                    site_name=(campsite.site_name or campsite.site_number) if campsite else None,
                    equipment_types=campsite.equipment_types if campsite else None,
                    nights=[],
                ),
            )
            campsite_entry.nights.append(
                AvailabilityNight(
                    date=snapshot.date,
                    fetched_at=snapshot.fetched_at,
                    status=snapshot.status.value,
                    min_nights=snapshot.min_nights,
                    max_nights=snapshot.max_nights,
                    price=snapshot.price,
                    currency=snapshot.currency,
                    provider_hint=snapshot.raw_payload,
                )
            )

        campgrounds.append(
            BulkCampgroundAvailability(
                campground_id=campground_id,
                campsite_availability=list(campsite_map.values()),
            )
        )

    return BulkAvailabilityResponse(campgrounds=campgrounds)


def _build_campground_sources(campground) -> list[str]:
    sources: list[str] = []
    if campground.provider and campground.provider.name:
        sources.append(campground.provider.name)
    if campground.park and campground.park.metadata_json:
        if "statscan_odrsf" in campground.park.metadata_json:
            sources.append("Statistics Canada ODRSF")
        for key in campground.park.metadata_json.keys():
            if key not in {"statscan_odrsf", "source"} and key.endswith(("geohub", "geobc", "open_data")):
                sources.append(key)
    amenities = campground.amenities or {}
    open_data = amenities.get("open_data") or {}
    if "statscan_odrsf" in open_data:
        sources.append("Statistics Canada ODRSF")
    return list(dict.fromkeys(sources))
