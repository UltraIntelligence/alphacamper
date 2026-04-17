from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.entities import Campground, Campsite, Notice, Park, Provider
from app.services.provider_quality import get_provider_quality


class CoverageRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def overall_summary(self) -> dict:
        return {
            "providers": self.session.scalar(select(func.count()).select_from(Provider)) or 0,
            "parks": self.session.scalar(select(func.count()).select_from(Park)) or 0,
            "campgrounds": self.session.scalar(select(func.count()).select_from(Campground)) or 0,
            "campsites": self.session.scalar(select(func.count()).select_from(Campsite)) or 0,
            "notices": self.session.scalar(select(func.count()).select_from(Notice)) or 0,
        }

    def provider_rows(self) -> list[dict]:
        stmt = (
            select(
                Provider.id,
                Provider.name,
                Provider.base_url,
                Provider.country,
                Provider.kind,
                func.count(func.distinct(Park.id)).label("parks"),
                func.count(func.distinct(Campground.id)).label("campgrounds"),
                func.count(func.distinct(Campsite.id)).label("campsites"),
            )
            .join(Park, Park.provider_id == Provider.id, isouter=True)
            .join(Campground, Campground.provider_id == Provider.id, isouter=True)
            .join(Campsite, Campsite.provider_id == Provider.id, isouter=True)
            .group_by(Provider.id)
            .order_by(Provider.name.asc())
        )
        return [
            {
                "provider_id": row.id,
                "provider_name": row.name,
                "country": row.country,
                "kind": row.kind.value if hasattr(row.kind, "value") else str(row.kind),
                "parks": int(row.parks or 0),
                "campgrounds": int(row.campgrounds or 0),
                "campsites": int(row.campsites or 0),
                "availability_mode": quality.availability_mode,
                "confidence": quality.confidence,
                "verification_note": quality.verification_note,
            }
            for row in self.session.execute(stmt)
            for quality in [get_provider_quality(base_url=getattr(row, "base_url", None), provider_name=row.name)]
        ]

    def region_rows(self) -> list[dict]:
        stmt = (
            select(
                Park.country,
                Park.state_province,
                func.count(func.distinct(Park.id)).label("parks"),
                func.count(func.distinct(Campground.id)).label("campgrounds"),
            )
            .join(Campground, Campground.park_id == Park.id, isouter=True)
            .group_by(Park.country, Park.state_province)
            .order_by(Park.country.asc(), Park.state_province.asc())
        )
        return [
            {
                "country": row.country,
                "state_province": row.state_province,
                "parks": int(row.parks or 0),
                "campgrounds": int(row.campgrounds or 0),
            }
            for row in self.session.execute(stmt)
        ]
