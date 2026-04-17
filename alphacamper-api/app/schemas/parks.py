from datetime import datetime

from pydantic import BaseModel

from app.schemas.campgrounds import CampgroundSummary, ProviderSummary
from app.schemas.common import OrmModel, PageMeta


class ParkSummary(OrmModel):
    id: str
    name: str
    country: str
    region: str | None = None
    state_province: str | None = None
    lat: float | None = None
    lon: float | None = None
    nps_park_code: str | None = None
    provider: ProviderSummary


class ParkDetail(ParkSummary):
    metadata_json: dict | None = None
    campgrounds: list[CampgroundSummary] = []
    latest_availability_fetched_at: datetime | None = None
    active_notice_count: int = 0
    source_attribution: list[str] = []


class ParkListResponse(BaseModel):
    items: list[ParkSummary]
    meta: PageMeta
