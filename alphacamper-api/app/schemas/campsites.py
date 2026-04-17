from pydantic import BaseModel

from app.schemas.campgrounds import ProviderSummary
from app.schemas.common import OrmModel, PageMeta


class CampgroundMini(OrmModel):
    id: str
    name: str
    booking_url: str | None = None


class CampsiteSummary(OrmModel):
    id: str
    site_number: str | None = None
    site_name: str | None = None
    loop_name: str | None = None
    equipment_types: list[str] | None = None
    max_occupancy: int | None = None
    max_vehicle_length: float | None = None
    is_group_site: bool
    is_walk_in: bool
    has_electric: bool
    has_sewer: bool
    has_water: bool
    is_accessible: bool
    attributes: dict | None = None
    campground: CampgroundMini
    provider: ProviderSummary


class CampsiteDetail(CampsiteSummary):
    lat: float | None = None
    lon: float | None = None


class CampsiteListResponse(BaseModel):
    items: list[CampsiteSummary]
    meta: PageMeta

