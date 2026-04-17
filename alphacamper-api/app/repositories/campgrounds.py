from __future__ import annotations

from sqlalchemy import Select, case, distinct, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import Campground, Campsite, Park, Provider
from app.repositories.base import BaseRepository, Page


class CampgroundRepository(BaseRepository[Campground]):
    model = Campground

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_campgrounds(
        self,
        *,
        country: str | None = None,
        state_province: str | None = None,
        park_id: str | None = None,
        provider_id: str | None = None,
        keyword: str | None = None,
        has_electric: bool | None = None,
        max_vehicle_length: float | None = None,
        waterfront: bool | None = None,
        page: int,
        size: int,
    ) -> Page:
        stmt: Select[tuple[Campground]] = (
            select(Campground)
            .join(Park, Campground.park_id == Park.id, isouter=True)
            .join(Provider, Campground.provider_id == Provider.id, isouter=True)
            .options(
                selectinload(Campground.provider),
                selectinload(Campground.park),
            )
            .order_by(Campground.name.asc())
        )

        if country:
            stmt = stmt.where(Park.country == country.upper())
        if state_province:
            stmt = stmt.where(Park.state_province == state_province.upper())
        if park_id:
            stmt = stmt.where(Campground.park_id == park_id)
        if provider_id:
            stmt = stmt.where(Campground.provider_id == provider_id)
        if keyword:
            normalized = keyword.strip().lower()
            like = f"%{normalized}%"
            prefix = f"{normalized}%"
            stmt = stmt.where(
                or_(
                    func.lower(Campground.name).like(like),
                    func.lower(func.coalesce(Campground.description, "")).like(like),
                    func.lower(func.coalesce(Park.name, "")).like(like),
                    func.lower(func.coalesce(Provider.name, "")).like(like),
                )
            )
            search_rank = case(
                (func.lower(Campground.name) == normalized, 500),
                (func.lower(func.coalesce(Park.name, "")) == normalized, 420),
                (func.lower(Campground.name).like(prefix), 360),
                (func.lower(func.coalesce(Park.name, "")).like(prefix), 320),
                (func.lower(func.coalesce(Provider.name, "")).like(prefix), 240),
                (func.lower(func.coalesce(Campground.description, "")).like(like), 120),
                else_=0,
            )
            stmt = stmt.order_by(search_rank.desc(), Campground.name.asc())
        if has_electric is True:
            stmt = stmt.where(Campground.amenities.contains({"electric": True}))
        if waterfront is True:
            stmt = stmt.where(Campground.amenities.contains({"waterfront": True}))
        if max_vehicle_length is not None:
            stmt = (
                stmt.join(Campsite, Campsite.campground_id == Campground.id)
                .where(Campsite.max_vehicle_length >= max_vehicle_length)
                .distinct()
            )

        return self.paginate(stmt, page=page, size=size)

    def get_campground_with_related(self, campground_id: str) -> Campground | None:
        stmt = (
            select(Campground)
            .where(Campground.id == campground_id)
            .options(
                selectinload(Campground.provider),
                selectinload(Campground.park),
                selectinload(Campground.campsites),
            )
        )
        return self.session.scalar(stmt)
