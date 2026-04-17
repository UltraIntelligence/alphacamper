from __future__ import annotations

import asyncio
from datetime import date

from sqlalchemy import select

from app.core.database import SessionLocal
from app.ingestion.jobs.availability_polling import poll_campground_and_persist
from app.ingestion.jobs.ontario_parks_sync import sync_ontario_parks_directory
from app.models.entities import Campground, Provider


async def main() -> None:
    session = SessionLocal()
    try:
        sync_result = await sync_ontario_parks_directory(session)
        provider = session.scalar(
            select(Provider).where(Provider.name == "Ontario Parks Reservation Service")
        )
        if not provider:
            raise RuntimeError("Ontario Parks provider not found after sync")

        campground = session.scalar(
            select(Campground).where(
                Campground.provider_id == provider.id,
                Campground.name.ilike("%Canisbay%"),
            )
        )
        if not campground:
            campground = session.scalar(
                select(Campground)
                .where(Campground.provider_id == provider.id)
                .order_by(Campground.name.asc())
            )
        if not campground:
            raise RuntimeError("No Ontario Parks campground found after sync")

        target_year = date.today().year
        result = await poll_campground_and_persist(
            session,
            campground_id=campground.id,
            start_date=date(target_year, 7, 15),
            end_date=date(target_year, 7, 31),
        )
        print(
            {
                "sync_result": sync_result,
                "campground_name": campground.name,
                "campground_id": campground.id,
                "provider_name": result.provider_name,
                "snapshot_count": result.snapshot_count,
                "new_matches": result.new_matches,
            }
        )
    finally:
        session.close()


if __name__ == "__main__":
    asyncio.run(main())
