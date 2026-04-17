from app.ingestion.jobs.open_data_enrichment import (
    geometry_to_wkt,
    haversine_km,
    normalize_place_name,
)
from app.providers.goingtocamp_registry import list_known_goingtocamp_domains


def test_normalize_place_name_removes_common_suffixes() -> None:
    assert normalize_place_name("Banff National Park Campground") == "banff"


def test_haversine_distance_is_zero_for_same_point() -> None:
    assert haversine_km(49.0, -123.0, 49.0, -123.0) == 0.0


def test_known_goingtocamp_domains_include_major_canadian_providers() -> None:
    domains = {item.domain for item in list_known_goingtocamp_domains()}
    assert "novascotia.goingtocamp.com" in domains
    assert "manitoba.goingtocamp.com" in domains


def test_geometry_to_wkt_handles_polygon() -> None:
    geometry = {
        "type": "Polygon",
        "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 0]]],
    }
    assert geometry_to_wkt(geometry) == "POLYGON((0 0, 1 0, 1 1, 0 0))"
