from __future__ import annotations

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models.entities import Campground, Provider
from app.models.enums import ProviderKind


def main() -> None:
    session = SessionLocal()
    try:
        provider = session.scalar(select(Provider).where(Provider.name == "Recreation.gov"))
        if not provider:
            provider = Provider(
                name="Recreation.gov",
                kind=ProviderKind.FEDERAL,
                base_url="https://www.recreation.gov",
                country="US",
                notes="Public live availability endpoint for campgrounds",
            )
            session.add(provider)
            session.flush()

        campground = session.scalar(
            select(Campground).where(
                Campground.provider_id == provider.id,
                Campground.external_facility_id == "232447",
            )
        )
        if not campground:
            campground = Campground(
                provider_id=provider.id,
                external_facility_id="232447",
                name="Upper Pines",
                description="Demo seed campground for live Recreation.gov polling",
                booking_url="https://www.recreation.gov/camping/campgrounds/232447",
                timezone="America/Los_Angeles",
                amenities={"source": "seed_recgov_demo"},
            )
            session.add(campground)

        session.commit()
        print(f"seeded provider={provider.id} campground={campground.id}")
    finally:
        session.close()


if __name__ == "__main__":
    main()

