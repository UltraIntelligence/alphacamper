from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.providers import ProviderRepository
from app.schemas.common import PageMeta
from app.schemas.providers import ProviderListResponse, ProviderQualityRead, ProviderRead
from app.services.provider_quality import get_provider_quality

router = APIRouter()


@router.get("", response_model=ProviderListResponse)
def list_providers(
    response: Response,
    country: str | None = Query(default=None),
    kind: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> ProviderListResponse:
    response.headers["Cache-Control"] = "public, max-age=3600, stale-while-revalidate=86400"
    repo = ProviderRepository(db)
    result = repo.list_providers(country=country, kind=kind, page=page, size=size)
    return ProviderListResponse(
        items=[
            ProviderRead(
                id=item.id,
                name=item.name,
                kind=item.kind.value if hasattr(item.kind, "value") else str(item.kind),
                base_url=item.base_url,
                country=item.country,
                notes=item.notes,
                quality=ProviderQualityRead(
                    **get_provider_quality(base_url=item.base_url, provider_name=item.name).__dict__
                ),
            )
            for item in result.items
        ],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )
