from datetime import datetime, timezone

from app.models.entities import CatalogRefreshJob
from app.services.catalog_refresh_jobs import serialize_catalog_refresh_job


def test_serialize_catalog_refresh_job_includes_operator_fields() -> None:
    requested_at = datetime(2026, 4, 17, 12, 0, tzinfo=timezone.utc)
    job = CatalogRefreshJob(
        id="job-123",
        mode="promote_local_catalog",
        status="queued",
        requested_by="ryan",
        trigger_source="api",
        requested_at=requested_at,
        metadata_json={"source_label": "local-postgis"},
    )

    payload = serialize_catalog_refresh_job(job)

    assert payload["id"] == "job-123"
    assert payload["mode"] == "promote_local_catalog"
    assert payload["status"] == "queued"
    assert payload["requested_by"] == "ryan"
    assert payload["trigger_source"] == "api"
    assert payload["requested_at"] == requested_at
    assert payload["metadata_json"] == {"source_label": "local-postgis"}
