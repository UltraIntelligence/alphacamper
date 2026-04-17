from __future__ import annotations

from sqlalchemy import Select, select
from sqlalchemy.orm import Session, selectinload

from app.models.entities import Campsite
from app.repositories.base import BaseRepository, Page


class CampsiteRepository(BaseRepository[Campsite]):
    model = Campsite

    def __init__(self, session: Session) -> None:
        super().__init__(session)

    def list_campsites(
        self,
        *,
        campground_id: str | None = None,
        equipment_type: str | None = None,
        is_group_site: bool | None = None,
        is_accessible: bool | None = None,
        waterfront: bool | None = None,
        page: int,
        size: int,
    ) -> Page:
        stmt: Select[tuple[Campsite]] = (
            select(Campsite)
            .options(
                selectinload(Campsite.campground),
                selectinload(Campsite.provider),
            )
            .order_by(Campsite.site_number.asc().nullslast(), Campsite.site_name.asc().nullslast())
        )

        if campground_id:
            stmt = stmt.where(Campsite.campground_id == campground_id)
        if equipment_type:
            stmt = stmt.where(Campsite.equipment_types.contains([equipment_type]))
        if is_group_site is not None:
            stmt = stmt.where(Campsite.is_group_site == is_group_site)
        if is_accessible is not None:
            stmt = stmt.where(Campsite.is_accessible == is_accessible)
        if waterfront is True:
            stmt = stmt.where(Campsite.attributes.contains({"waterfront": True}))

        return self.paginate(stmt, page=page, size=size)

    def get_campsite_with_related(self, campsite_id: str) -> Campsite | None:
        stmt = (
            select(Campsite)
            .where(Campsite.id == campsite_id)
            .options(
                selectinload(Campsite.campground),
                selectinload(Campsite.provider),
            )
        )
        return self.session.scalar(stmt)

