from pydantic import BaseModel


class CoverageTotals(BaseModel):
    providers: int
    parks: int
    campgrounds: int
    campsites: int
    notices: int


class ProviderCoverageRow(BaseModel):
    provider_id: str
    provider_name: str
    country: str | None = None
    kind: str
    parks: int
    campgrounds: int
    campsites: int
    availability_mode: str
    confidence: str
    verification_note: str


class RegionCoverageRow(BaseModel):
    country: str
    state_province: str | None = None
    parks: int
    campgrounds: int


class CoverageSummaryResponse(BaseModel):
    totals: CoverageTotals
    providers: list[ProviderCoverageRow]
    regions: list[RegionCoverageRow]
