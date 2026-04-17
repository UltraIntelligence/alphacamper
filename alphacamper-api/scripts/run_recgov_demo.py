from __future__ import annotations

import asyncio
from datetime import date

from sqlalchemy import select

from app.core.database import SessionLocal
from app.ingestion.jobs.availability_polling import poll_campground_and_persist
from app.models.entities import Campground, Provider


async def main() -> None:
    session = SessionLocal()
    try:
        provider = session.scalar(select(Provider).where(Provider.name == "Recreation.gov"))
        if not provider:
            raise RuntimeError("Recreation.gov provider not found. Run seed_recgov_demo.py first.")

        campground = session.scalar(
            select(Campground).where(
                Campground.provider_id == provider.id,
                Campground.external_facility_id == "232447",
            )
        )
        if not campground:
            raise RuntimeError("Upper Pines demo campground not found. Run seed_recgov_demo.py first.")

        today = date.today()
        result = await poll_campground_and_persist(
            session,
            campground_id=campground.id,
            start_date=today,
            end_date=date(today.year, min(today.month + 1, 12), 1) if today.month < 12 else date(today.year, 12, 31),
        )
        print(
            {
                "campground_id": result.campground_id,
                "provider_name": result.provider_name,
                "snapshot_count": result.snapshot_count,
                "new_matches": result.new_matches,
            }
        )
    finally:
        session.close()


if __name__ == "__main__":
    asyncio.run(main())

