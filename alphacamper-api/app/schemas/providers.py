from app.schemas.common import OrmModel, PageMeta


class ProviderQualityRead(OrmModel):
    availability_mode: str
    confidence: str
    verification_note: str


class ProviderRead(OrmModel):
    id: str
    name: str
    kind: str
    base_url: str | None = None
    country: str | None = None
    notes: str | None = None
    quality: ProviderQualityRead


class ProviderListResponse(OrmModel):
    items: list[ProviderRead]
    meta: PageMeta
