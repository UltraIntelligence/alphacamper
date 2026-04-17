from __future__ import annotations

import asyncio
from pathlib import Path
from typing import Awaitable, Callable

from app.core.database import SessionLocal
from app.ingestion.jobs.bc_parks_sync import sync_bc_parks_directory
from app.ingestion.jobs.goingtocamp_sync import sync_goingtocamp_provider
from app.ingestion.jobs.helpers import get_or_create_provider
from app.ingestion.jobs.ontario_parks_sync import sync_ontario_parks_directory
from app.ingestion.jobs.parks_canada_sync import sync_parks_canada_directory
from app.models.enums import ProviderKind


SEED_DOMAINS = (
    (
        "novascotia.goingtocamp.com",
        "Nova Scotia Parks Reservation Service",
        "NS",
    ),
    (
        "manitoba.goingtocamp.com",
        "Manitoba Parks Reservation Service",
        "MB",
    ),
    (
        "parcsnbparks.info",
        "New Brunswick Provincial Parks Reservation Service",
        "NB",
    ),
    (
        "nlcamping.ca",
        "Newfoundland and Labrador Parks Reservation Service",
        "NL",
    ),
)

CORE_US_PROVIDERS = (
    (
        "Recreation.gov",
        ProviderKind.FEDERAL,
        "https://www.recreation.gov",
        "US",
        "Retail availability polling for federal campgrounds.",
    ),
    (
        "RIDB",
        ProviderKind.FEDERAL,
        "https://ridb.recreation.gov/api/v1",
        "US",
        "Official federal metadata feed.",
    ),
    (
        "National Park Service",
        ProviderKind.FEDERAL,
        "https://www.nps.gov",
        "US",
        "Official park metadata and notices.",
    ),
    (
        "National Weather Service",
        ProviderKind.FEDERAL,
        "https://api.weather.gov",
        "US",
        "Official weather alerts enrichment.",
    ),
)


async def _run_step(
    label: str,
    step: Callable[[], Awaitable[dict[str, int]]],
    *,
    timeout_seconds: int = 240,
) -> dict[str, object]:
    print(f"[start] {label}", flush=True)
    try:
        result = await asyncio.wait_for(step(), timeout=timeout_seconds)
    except TimeoutError:
        print(f"[timeout] {label} exceeded {timeout_seconds}s", flush=True)
        return {"status": "timeout", "timeout_seconds": timeout_seconds}
    except Exception as exc:  # pragma: no cover - defensive production script
        print(f"[error] {label}: {exc}", flush=True)
        return {"status": "error", "error": str(exc)}

    print(f"[done] {label}: {result}", flush=True)
    return {"status": "ok", "result": result}


async def main() -> None:
    repo_root = Path(__file__).resolve().parents[1]
    seed_root = repo_root / "examples" / "goingtocamp-seeds"

    session = SessionLocal()
    try:
        for name, kind, base_url, country, notes in CORE_US_PROVIDERS:
            get_or_create_provider(
                session,
                name=name,
                kind=kind,
                base_url=base_url,
                country=country,
                notes=notes,
            )
        session.commit()

        results: dict[str, object] = {
            "core_us_providers": len(CORE_US_PROVIDERS),
        }

        results["parks_canada"] = await _run_step(
            "Parks Canada directory",
            lambda: sync_parks_canada_directory(session),
        )
        results["bc_parks"] = await _run_step(
            "BC Parks directory",
            lambda: sync_bc_parks_directory(session),
        )
        results["ontario_parks"] = await _run_step(
            "Ontario Parks directory",
            lambda: sync_ontario_parks_directory(session),
        )

        seed_results: dict[str, object] = {}
        for domain, provider_name, state_province in SEED_DOMAINS:
            seed_results[domain] = await _run_step(
                f"{provider_name} seed sync",
                lambda domain=domain, provider_name=provider_name, state_province=state_province: sync_goingtocamp_provider(
                    session,
                    domain=domain,
                    provider_name=provider_name,
                    country="CA",
                    state_province=state_province,
                    catalog_seed_path=str(seed_root / f"{domain}.json"),
                ),
            )
        results["goingtocamp_seeds"] = seed_results

        print(results)
    finally:
        session.close()


if __name__ == "__main__":
    asyncio.run(main())
