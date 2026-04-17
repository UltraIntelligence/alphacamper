from __future__ import annotations

import os

from app.services.catalog_refresh_jobs import process_next_catalog_refresh_job, serialize_catalog_refresh_job


def main() -> None:
    source_database_url = os.environ.get("SOURCE_DATABASE_URL")
    job = process_next_catalog_refresh_job(source_database_url=source_database_url)
    if job is None:
        print({"status": "idle", "message": "No queued catalog refresh jobs."})
        return
    print({"status": "processed", "job": serialize_catalog_refresh_job(job)})


if __name__ == "__main__":
    main()
