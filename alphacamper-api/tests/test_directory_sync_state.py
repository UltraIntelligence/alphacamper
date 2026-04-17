from datetime import datetime, timedelta, timezone

from app.ingestion.jobs.directory_sync_state import is_directory_sync_fresh


def test_directory_sync_is_fresh_with_recent_timestamp() -> None:
    now = datetime(2026, 4, 16, 12, 0, tzinfo=timezone.utc)
    recent = now - timedelta(hours=2)
    assert is_directory_sync_fresh(recent, now=now, max_age_hours=12) is True


def test_directory_sync_is_stale_when_older_than_threshold() -> None:
    now = datetime(2026, 4, 16, 12, 0, tzinfo=timezone.utc)
    old = now - timedelta(hours=13)
    assert is_directory_sync_fresh(old, now=now, max_age_hours=12) is False
