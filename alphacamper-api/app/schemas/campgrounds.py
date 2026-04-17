from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import OrmModel, PageMeta


class ProviderSummary(OrmModel):
    id: str
    name: str
    kind: str
    country: str | None = None


class ParkSummary(OrmModel):
    id: str
    name: str
    country: str
    state_province: str | None = None
    nps_park_code: str | None = None


class CampgroundSummary(OrmModel):
    id: str
    name: str
    description: str | None = None
    timezone: str | None = None
    booking_url: str | None = None
    amenities: dict | None = None
    accessibility: dict | None = None
    provider: ProviderSummary
    park: ParkSummary | None = None


class CampgroundDetail(CampgroundSummary):
    lat: float | None = None
    lon: float | None = None
    elevation: int | None = None
    address: str | None = None
    driving_directions: str | None = None
    cell_coverage: dict | None = None
    photos: list[dict] | None = None
    max_advance_reservation_days: int | None = None
    latest_availability_fetched_at: datetime | None = None
    active_notice_count: int = 0
    source_attribution: list[str] = []


class CampgroundListResponse(BaseModel):
    items: list[CampgroundSummary]
    meta: PageMeta
