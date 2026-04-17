from __future__ import annotations

import sys

from app.core.database import SessionLocal
from app.ingestion.jobs.open_data_enrichment import enrich_from_statscan_odrsf_csv


def main() -> None:
    if len(sys.argv) < 2:
        raise SystemExit("usage: run_open_data_enrichment.py <statscan_csv_path> [province_code]")

    csv_path = sys.argv[1]
    province_code = sys.argv[2] if len(sys.argv) > 2 else None

    session = SessionLocal()
    try:
        result = enrich_from_statscan_odrsf_csv(
            session,
            csv_path=csv_path,
            province_code=province_code,
        )
        print(result)
    finally:
        session.close()


if __name__ == "__main__":
    main()
