from app.ingestion.jobs.goingtocamp_sync import _campground_name_matches, _normalize_name
from app.models.enums import AvailabilityStatus
from app.providers.camis_client import CamisClient
from app.providers.goingtocamp_registry import is_live_camis_goingtocamp_domain


def test_registry_marks_only_live_ontario_regional_hosts() -> None:
    assert is_live_camis_goingtocamp_domain("longpoint.goingtocamp.com") is True
    assert is_live_camis_goingtocamp_domain("maitlandvalley.goingtocamp.com") is True
    assert is_live_camis_goingtocamp_domain("stclair.goingtocamp.com") is True
    assert is_live_camis_goingtocamp_domain("saugeen.goingtocamp.com") is False
    assert is_live_camis_goingtocamp_domain("algonquinhighlands.goingtocamp.com") is False


def test_normalize_name_removes_generic_booking_words() -> None:
    assert _normalize_name("Backus Heritage Campground") == "backus heritage"
    assert _normalize_name("Backus Heritage Conservation Area") == "backus heritage"


def test_campground_name_matching_upgrades_seed_rows() -> None:
    assert _campground_name_matches(
        "Backus Heritage Campground",
        full_name="Backus Heritage Conservation Area",
        short_name="Backus Heritage",
    )
    assert _campground_name_matches(
        "A.W. Campbell Campground",
        full_name="A.W. Campbell Conservation Area",
        short_name="A.W. Campbell",
    )
    assert not _campground_name_matches(
        "Norfolk Campground",
        full_name="Waterford North Conservation Area",
        short_name="Waterford North",
    )


def test_camis_status_code_5_maps_to_closed() -> None:
    assert CamisClient._map_status(5) == AvailabilityStatus.CLOSED


def test_camis_status_code_2_maps_to_not_yet_released() -> None:
    assert CamisClient._map_status(2) == AvailabilityStatus.NOT_YET_RELEASED


def test_camis_status_code_3_maps_to_first_come_first_serve() -> None:
    assert CamisClient._map_status(3) == AvailabilityStatus.FIRST_COME_FIRST_SERVE
