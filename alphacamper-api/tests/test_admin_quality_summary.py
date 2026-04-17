from app.repositories.admin import AdminRepository


def test_admin_provider_quality_summary_counts_modes_and_confidence() -> None:
    repo = AdminRepository(session=None)  # type: ignore[arg-type]
    repo.provider_health_rows = lambda: [  # type: ignore[method-assign]
        {
            "provider_id": "1",
            "provider_name": "Ontario Parks Reservation Service",
            "availability_mode": "live_polling",
            "confidence": "verified",
        },
        {
            "provider_id": "2",
            "provider_name": "Long Point Region Conservation Booking",
            "availability_mode": "live_polling",
            "confidence": "inferred",
        },
        {
            "provider_id": "3",
            "provider_name": "Saugeen Valley Booking",
            "availability_mode": "directory_only",
            "confidence": "seeded",
        },
    ]

    summary = repo.provider_quality_summary()

    assert summary["total"] == 3
    assert summary["live_polling"] == 2
    assert summary["directory_only"] == 1
    assert summary["metadata_only"] == 0
    assert summary["verified"] == 1
    assert summary["inferred"] == 1
    assert summary["seeded"] == 1
    assert summary["unknown"] == 0
