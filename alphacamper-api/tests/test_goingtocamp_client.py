from datetime import date

from app.providers.goingtocamp_client import format_gtc_date


def test_format_gtc_date_matches_provider_format() -> None:
    assert format_gtc_date(date(2026, 7, 10)) == "26-Jul-10"
