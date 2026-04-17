from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel


class BulkAvailabilityRequest(BaseModel):
    campground_ids: list[str]
    start_date: date
    end_date: date
    equipment_type: str | None = None


class AvailabilityNight(BaseModel):
    date: date
    fetched_at: datetime
    status: str
    min_nights: int | None = None
    max_nights: int | None = None
    price: Decimal | None = None
    currency: str | None = None
    provider_hint: dict | None = None


class AvailabilityCampsite(BaseModel):
    campsite_id: str | None = None
    site_number: str | None = None
    site_name: str | None = None
    equipment_types: list[str] | None = None
    nights: list[AvailabilityNight]


class AvailabilityResponse(BaseModel):
    campground_id: str
    start_date: date
    end_date: date
    campsites: list[AvailabilityCampsite]


class BulkCampgroundAvailability(BaseModel):
    campground_id: str
    campsite_availability: list[AvailabilityCampsite]


class BulkAvailabilityResponse(BaseModel):
    campgrounds: list[BulkCampgroundAvailability]
