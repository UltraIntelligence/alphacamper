from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.repositories.notices import NoticeRepository
from app.schemas.common import PageMeta
from app.schemas.notices import NoticeListResponse, NoticeRead

router = APIRouter()


@router.get("", response_model=NoticeListResponse)
def list_notices(
    response: Response,
    provider_id: str | None = Query(default=None),
    park_id: str | None = Query(default=None),
    campground_id: str | None = Query(default=None),
    severity: str | None = Query(default=None),
    active_only: bool = Query(default=True),
    page: int = Query(default=1, ge=1),
    size: int = Query(default=settings.default_page_size, ge=1, le=settings.max_page_size),
    db: Session = Depends(get_db),
) -> NoticeListResponse:
    response.headers["Cache-Control"] = "public, max-age=300, stale-while-revalidate=900"
    repo = NoticeRepository(db)
    result = repo.list_notices(
        provider_id=provider_id,
        park_id=park_id,
        campground_id=campground_id,
        severity=severity,
        active_only=active_only,
        page=page,
        size=size,
    )
    return NoticeListResponse(
        items=[NoticeRead.model_validate(item) for item in result.items],
        meta=PageMeta(page=result.page, size=result.size, total=result.total, pages=result.pages),
    )
