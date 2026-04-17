from __future__ import annotations

import asyncio
import sys

from app.core.database import SessionLocal
from app.ingestion.jobs.goingtocamp_sync import sync_known_goingtocamp_providers


async def main() -> None:
    seed_directory = sys.argv[1] if len(sys.argv) > 1 else None
    session = SessionLocal()
    try:
        result = await sync_known_goingtocamp_providers(
            session,
            seed_directory=seed_directory,
        )
        print(result)
    finally:
        session.close()


if __name__ == "__main__":
    asyncio.run(main())
