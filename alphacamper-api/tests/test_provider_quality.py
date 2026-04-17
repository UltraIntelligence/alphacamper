from app.services.provider_quality import get_provider_quality


def test_live_regional_provider_quality_is_inferred_live_polling() -> None:
    quality = get_provider_quality(
        base_url="https://longpoint.goingtocamp.com",
        provider_name="Long Point Region Conservation Booking",
    )
    assert quality.availability_mode == "live_polling"
    assert quality.confidence == "inferred"


def test_seed_only_provider_quality_is_directory_only() -> None:
    quality = get_provider_quality(
        base_url="https://saugeen.goingtocamp.com",
        provider_name="Saugeen Valley Booking",
    )
    assert quality.availability_mode == "directory_only"
    assert quality.confidence == "seeded"


def test_official_metadata_provider_quality_is_metadata_only() -> None:
    quality = get_provider_quality(
        base_url="https://ridb.recreation.gov/api/v1",
        provider_name="RIDB",
    )
    assert quality.availability_mode == "metadata_only"
    assert quality.confidence == "verified"
