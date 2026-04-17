from collections import OrderedDict
from datetime import date

from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.availability import AvailabilityRepository
from app.schemas.availability import AvailabilityCampsite, AvailabilityNight, AvailabilityResponse

router = APIRouter()


@router.get("", response_model=AvailabilityResponse)
def get_availability(
    response: Response,
    campground_id: str = Query(...),
    start_date: date = Query(...),
    end_date: date = Query(...),
    equipment_type: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> AvailabilityResponse:
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
    repo = AvailabilityRepository(db)
    rows = repo.list_latest_for_campground(
        campground_id=campground_id,
        start_date=start_date,
        end_date=end_date,
        equipment_type=equipment_type,
    )

    grouped: OrderedDict[str, AvailabilityCampsite] = OrderedDict()
    for snapshot, campsite in rows:
        campsite_key = snapshot.campsite_id or f"unknown:{snapshot.date.isoformat()}"
        if campsite_key not in grouped:
            grouped[campsite_key] = AvailabilityCampsite(
                campsite_id=snapshot.campsite_id,
                site_number=campsite.site_number if campsite else None,
                site_name=(campsite.site_name or campsite.site_number) if campsite else None,
                equipment_types=campsite.equipment_types if campsite else None,
                nights=[],
            )

        grouped[campsite_key].nights.append(
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

    return AvailabilityResponse(
        campground_id=campground_id,
        start_date=start_date,
        end_date=end_date,
        campsites=list(grouped.values()),
    )
