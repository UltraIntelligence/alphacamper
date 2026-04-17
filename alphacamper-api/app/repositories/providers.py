from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.entities import Provider
from app.repositories.base import BaseRepository, Page


class ProviderRepository(BaseRepository[Provider]):
    model = Provider

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_providers(
        self,
        *,
        country: str | None,
        kind: str | None,
        page: int,
        size: int,
    ) -> Page:
        stmt: Select[tuple[Provider]] = select(Provider).order_by(Provider.name.asc())
        if country:
            stmt = stmt.where(Provider.country == country.upper())
        if kind:
            stmt = stmt.where(Provider.kind == kind)
        return self.paginate(stmt, page=page, size=size)
