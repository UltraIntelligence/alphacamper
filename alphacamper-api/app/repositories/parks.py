from __future__ import annotations

from sqlalchemy import Select, case, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import Park, Provider
from app.repositories.base import BaseRepository, Page


class ParkRepository(BaseRepository[Park]):
    model = Park

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_parks(
        self,
        *,
        country: str | None = None,
        state_province: str | None = None,
        provider_id: str | None = None,
        keyword: str | None = None,
        page: int,
        size: int,
    ) -> Page:
        stmt: Select[tuple[Park]] = (
            select(Park)
            .options(
                selectinload(Park.provider),
                selectinload(Park.campgrounds),
            )
            .order_by(Park.name.asc())
        )
        if country:
            stmt = stmt.where(Park.country == country.upper())
        if state_province:
            stmt = stmt.where(Park.state_province == state_province.upper())
        if provider_id:
            stmt = stmt.where(Park.provider_id == provider_id)
        if keyword:
            normalized = keyword.strip().lower()
            like = f"%{normalized}%"
            prefix = f"{normalized}%"
            stmt = stmt.join(Provider, Provider.id == Park.provider_id, isouter=True)
            stmt = stmt.where(
                or_(
                    func.lower(Park.name).like(like),
                    func.lower(func.coalesce(Park.region, "")).like(like),
                    func.lower(func.coalesce(Park.state_province, "")).like(like),
                    func.lower(func.coalesce(Provider.name, "")).like(like),
                )
            )
            search_rank = case(
                (func.lower(Park.name) == normalized, 500),
                (func.lower(Park.name).like(prefix), 380),
                (func.lower(func.coalesce(Park.region, "")).like(prefix), 250),
                (func.lower(func.coalesce(Provider.name, "")).like(prefix), 180),
                else_=0,
            )
            stmt = stmt.order_by(search_rank.desc(), Park.name.asc())
        return self.paginate(stmt, page=page, size=size)

    def get_park_with_related(self, park_id: str) -> Park | None:
        stmt = (
            select(Park)
            .where(Park.id == park_id)
            .options(
                selectinload(Park.provider),
                selectinload(Park.campgrounds),
            )
        )
        return self.session.scalar(stmt)
