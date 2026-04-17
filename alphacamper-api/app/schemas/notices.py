from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import OrmModel, PageMeta


class NoticeRead(OrmModel):
    id: str
    provider_id: str
    park_id: str | None = None
    campground_id: str | None = None
    external_notice_id: str | None = None
    title: str
    summary: str | None = None
    body: str | None = None
    severity: str | None = None
    status: str | None = None
    url: str | None = None
    effective_at: datetime | None = None
    expires_at: datetime | None = None
    metadata_json: dict | None = None


class NoticeListResponse(BaseModel):
    items: list[NoticeRead]
    meta: PageMeta
