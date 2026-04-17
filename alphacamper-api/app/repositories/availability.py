from __future__ import annotations

from datetime import date

from sqlalchemy import and_, func, select
from sqlalchemy.orm import Session

from app.models.entities import AvailabilitySnapshot, Campsite


class AvailabilityRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def list_latest_for_campground(
        self,
        *,
        campground_id: str,
        start_date: date,
        end_date: date,
        equipment_type: str | None = None,
    ) -> list[tuple[AvailabilitySnapshot, Campsite | None]]:
        latest_snapshot = (
            select(
                AvailabilitySnapshot.campsite_id.label("campsite_id"),
                AvailabilitySnapshot.date.label("stay_date"),
                func.max(AvailabilitySnapshot.fetched_at).label("max_fetched_at"),
            )
            .where(
                AvailabilitySnapshot.campground_id == campground_id,
                AvailabilitySnapshot.date >= start_date,
                AvailabilitySnapshot.date <= end_date,
            )
            .group_by(AvailabilitySnapshot.campsite_id, AvailabilitySnapshot.date)
            .subquery()
        )

        stmt = (
            select(AvailabilitySnapshot, Campsite)
            .join(
                latest_snapshot,
                and_(
                    AvailabilitySnapshot.campsite_id == latest_snapshot.c.campsite_id,
                    AvailabilitySnapshot.date == latest_snapshot.c.stay_date,
                    AvailabilitySnapshot.fetched_at == latest_snapshot.c.max_fetched_at,
                ),
            )
            .join(Campsite, Campsite.id == AvailabilitySnapshot.campsite_id, isouter=True)
            .order_by(Campsite.site_number.asc().nullslast(), AvailabilitySnapshot.date.asc())
        )

        if equipment_type:
            stmt = stmt.where(Campsite.equipment_types.contains([equipment_type]))

        return list(self.session.execute(stmt).all())

    def latest_fetched_at_for_campground(self, campground_id: str):
        return self.session.scalar(
            select(func.max(AvailabilitySnapshot.fetched_at)).where(
                AvailabilitySnapshot.campground_id == campground_id
            )
        )

    def latest_fetched_at_for_park(self, park_id: str):
        return self.session.scalar(
            select(func.max(AvailabilitySnapshot.fetched_at))
            .join(Campsite, Campsite.id == AvailabilitySnapshot.campsite_id, isouter=True)
            .join(Campground, Campground.id == AvailabilitySnapshot.campground_id)
            .where(Campground.park_id == park_id)
        )
