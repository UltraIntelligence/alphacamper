from __future__ import annotations

import sys

from app.core.database import SessionLocal
from app.ingestion.jobs.open_data_enrichment import enrich_parks_from_csv, enrich_parks_from_geojson


def main() -> None:
    if len(sys.argv) < 4:
        raise SystemExit(
            "usage: run_boundary_enrichment.py <bc_geojson_path> <ontario_csv_path> <province_code>"
        )

    bc_geojson_path = sys.argv[1]
    ontario_csv_path = sys.argv[2]
    province_code = sys.argv[3].upper()

    session = SessionLocal()
    try:
        if province_code == "BC":
            result = enrich_parks_from_geojson(
                session,
                geojson_path=bc_geojson_path,
                state_province="BC",
                source_name="bc_protected_areas",
                name_fields=("PROTECTED_LANDS_NAME",),
                store_geometry=True,
            )
        elif province_code == "ON":
            result = enrich_parks_from_csv(
                session,
                csv_path=ontario_csv_path,
                state_province="ON",
                source_name="ontario_regulated_parks",
                name_field="PROTECTED_AREA_NAME_ENG",
                metadata_fields=(
                    "TYPE_ENG",
                    "STATUS_ENG",
                    "COMMON_SHORT_NAME",
                    "REGULATION_DATE",
                    "REGULATION_NUMBER",
                    "OPERATING_STATUS_IND",
                    "PROVINCIAL_PARK_CLASS_ENG",
                    "URL",
                    "OWNER_ENG",
                    "MANAGEMENT_ENG",
                ),
            )
        else:
            raise SystemExit("province_code must be BC or ON")
        print(result)
    finally:
        session.close()


if __name__ == "__main__":
    main()
