from datetime import date

from app.alerts.engine import choose_matching_date_run, compute_payload_hash, diff_newly_available
from app.alerts.tasks import build_alert_email_content
from app.models.enums import AvailabilityStatus


def test_compute_payload_hash_is_stable_for_same_data() -> None:
    payload_a = {"provider": "parks_canada", "dates": ["2026-07-01", "2026-07-02"]}
    payload_b = {"dates": ["2026-07-01", "2026-07-02"], "provider": "parks_canada"}
    assert compute_payload_hash(payload_a) == compute_payload_hash(payload_b)


def test_diff_newly_available_detects_fresh_openings() -> None:
    previous = {
        ("site-1", date(2026, 7, 1)): AvailabilityStatus.RESERVED,
        ("site-1", date(2026, 7, 2)): AvailabilityStatus.AVAILABLE,
    }
    current = {
        ("site-1", date(2026, 7, 1)): AvailabilityStatus.AVAILABLE,
        ("site-1", date(2026, 7, 2)): AvailabilityStatus.AVAILABLE,
    }
    assert diff_newly_available(previous, current) == [("site-1", date(2026, 7, 1))]


def test_choose_matching_date_run_respects_min_nights() -> None:
    run = choose_matching_date_run(
        available_dates=[
            date(2026, 7, 10),
            date(2026, 7, 11),
            date(2026, 7, 12),
        ],
        target_date=date(2026, 7, 11),
        date_start=date(2026, 7, 10),
        date_end=date(2026, 7, 13),
        min_nights=2,
        max_nights=3,
    )
    assert run == [date(2026, 7, 10), date(2026, 7, 11), date(2026, 7, 12)]


def test_build_alert_email_content_includes_booking_link() -> None:
    subject, body = build_alert_email_content(
        campground_name="Two Jack Lakeside",
        campsite_name="Site 12",
        available_dates=["2026-07-10", "2026-07-11"],
        booking_url="https://example.com/book",
        price=45.0,
        currency="CAD",
    )
    assert "Two Jack Lakeside" in subject
    assert "https://example.com/book" in body
