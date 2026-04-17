from __future__ import annotations

from sqlalchemy import Select, func, select
from sqlalchemy.orm import Session

from app.models.entities import Notice
from app.repositories.base import BaseRepository, Page


class NoticeRepository(BaseRepository[Notice]):
    model = Notice

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_notices(
        self,
        *,
        provider_id: str | None = None,
        park_id: str | None = None,
        campground_id: str | None = None,
        severity: str | None = None,
        active_only: bool = True,
        page: int,
        size: int,
    ) -> Page:
        stmt: Select[tuple[Notice]] = select(Notice).order_by(Notice.effective_at.desc().nullslast())
        if provider_id:
            stmt = stmt.where(Notice.provider_id == provider_id)
        if park_id:
            stmt = stmt.where(Notice.park_id == park_id)
        if campground_id:
            stmt = stmt.where(Notice.campground_id == campground_id)
        if severity:
            stmt = stmt.where(Notice.severity == severity)
        if active_only:
            stmt = stmt.where((Notice.expires_at.is_(None)) | (Notice.expires_at > func.now()))
        return self.paginate(stmt, page=page, size=size)

    def count_active_for_targets(
        self,
        *,
        park_id: str | None = None,
        campground_id: str | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(Notice).where(
            (Notice.expires_at.is_(None)) | (Notice.expires_at > func.now())
        )
        if park_id:
            stmt = stmt.where(Notice.park_id == park_id)
        if campground_id:
            stmt = stmt.where(Notice.campground_id == campground_id)
        return int(self.session.scalar(stmt) or 0)
