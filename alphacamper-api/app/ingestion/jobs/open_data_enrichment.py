from __future__ import annotations

import csv
import json
import math
import re
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entities import Campground, Park


def normalize_place_name(value: str | None) -> str:
    if not value:
        return ""
    normalized = value.lower()
    normalized = re.sub(r"[^a-z0-9]+", " ", normalized)
    normalized = normalized.replace("provincial park", "")
    normalized = normalized.replace("national park", "")
    normalized = normalized.replace("campground", "")
    normalized = normalized.replace("recreation area", "")
    normalized = re.sub(r"\s+", " ", normalized).strip()
    return normalized


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    radius_km = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)
    a = (
        math.sin(d_phi / 2) ** 2
        + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    )
    return 2 * radius_km * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def enrich_from_statscan_odrsf_csv(
    session: Session,
    *,
    csv_path: str,
    province_code: str | None = None,
    max_distance_km: float = 25.0,
) -> dict[str, int]:
    rows = list(_read_csv_rows(csv_path))
    updated = {"parks": 0, "campgrounds": 0}

    parks = list(session.scalars(select(Park)).all())
    campgrounds = list(session.scalars(select(Campground)).all())

    for row in rows:
        province = (
            row.get("PR_UID")
            or row.get("PRUID")
            or row.get("Prov_Terr")
            or row.get("province")
            or ""
        ).strip().upper()
        if province_code and province != province_code.upper():
            continue

        facility_type = (
            row.get("ODRSF_facility_type")
            or row.get("odrsf_facility_type")
            or row.get("facility_type")
            or ""
        ).strip().lower()
        if facility_type not in {"parks", "park", "miscellaneous", "trails", "beaches", "marinas"}:
            continue

        raw_name = (
            row.get("Facility_Name")
            or row.get("facility_name")
            or row.get("name")
            or row.get("FACILITY_NAME")
        )
        lat = _parse_float(row.get("Latitude") or row.get("latitude") or row.get("LATITUDE"))
        lon = _parse_float(row.get("Longitude") or row.get("longitude") or row.get("LONGITUDE"))
        if not raw_name:
            continue

        match = _find_best_campground_match(
            campgrounds,
            target_name=raw_name,
            target_lat=lat,
            target_lon=lon,
            province_code=province,
            max_distance_km=max_distance_km,
        )
        if match:
            if lat is not None and match.lat is None:
                match.lat = lat
            if lon is not None and match.lon is None:
                match.lon = lon
            match.amenities = {
                **(match.amenities or {}),
                "open_data": {
                    **((match.amenities or {}).get("open_data") or {}),
                    "statscan_odrsf": row,
                },
            }
            updated["campgrounds"] += 1
            continue

        park = _find_best_park_match(
            parks,
            target_name=raw_name,
            target_lat=lat,
            target_lon=lon,
            province_code=province,
            max_distance_km=max_distance_km,
        )
        if park:
            if lat is not None and park.lat is None:
                park.lat = lat
            if lon is not None and park.lon is None:
                park.lon = lon
            park.metadata_json = {
                **(park.metadata_json or {}),
                "statscan_odrsf": row,
            }
            updated["parks"] += 1

    session.commit()
    return updated


def _read_csv_rows(csv_path: str) -> list[dict[str, str]]:
    encodings = ("utf-8-sig", "cp1252", "latin1")
    last_error: Exception | None = None
    for encoding in encodings:
        try:
            with open(csv_path, newline="", encoding=encoding) as handle:
                return list(csv.DictReader(handle))
        except UnicodeDecodeError as exc:
            last_error = exc
            continue
    if last_error:
        raise last_error
    return []


def enrich_parks_from_geojson(
    session: Session,
    *,
    geojson_path: str,
    state_province: str,
    source_name: str,
    name_fields: tuple[str, ...] = ("name", "NAME", "park_name", "PARK_NAME"),
    store_geometry: bool = False,
) -> dict[str, int]:
    payload = json.loads(Path(geojson_path).read_text())
    features = payload.get("features") or []
    parks = list(
        session.scalars(
            select(Park).where(Park.state_province == state_province.upper())
        ).all()
    )
    updated = 0
    for feature in features:
        properties = feature.get("properties") or {}
        raw_name = next((properties.get(field) for field in name_fields if properties.get(field)), None)
        if not raw_name:
            continue
        match = _find_best_park_match(
            parks,
            target_name=raw_name,
            target_lat=None,
            target_lon=None,
            province_code=state_province.upper(),
            max_distance_km=1000,
        )
        if not match:
            continue
        if store_geometry and feature.get("geometry"):
            wkt = geometry_to_wkt(feature["geometry"])
            if wkt:
                match.boundary_geom = wkt
        match.metadata_json = {
            **(match.metadata_json or {}),
            source_name: {
                "properties": properties,
                "geometry_type": (feature.get("geometry") or {}).get("type"),
            },
        }
        updated += 1
    session.commit()
    return {"parks": updated}


def enrich_parks_from_csv(
    session: Session,
    *,
    csv_path: str,
    state_province: str,
    source_name: str,
    name_field: str,
    metadata_fields: tuple[str, ...] | None = None,
) -> dict[str, int]:
    rows = _read_csv_rows(csv_path)
    parks = list(
        session.scalars(select(Park).where(Park.state_province == state_province.upper())).all()
    )
    updated = 0
    for row in rows:
        raw_name = row.get(name_field)
        if not raw_name:
            continue
        match = _find_best_park_match(
            parks,
            target_name=raw_name,
            target_lat=None,
            target_lon=None,
            province_code=state_province.upper(),
            max_distance_km=1000,
        )
        if not match:
            continue
        metadata = {field: row.get(field) for field in metadata_fields} if metadata_fields else row
        match.metadata_json = {
            **(match.metadata_json or {}),
            source_name: metadata,
        }
        updated += 1
    session.commit()
    return {"parks": updated}


def _find_best_campground_match(
    campgrounds: list[Campground],
    *,
    target_name: str,
    target_lat: float | None,
    target_lon: float | None,
    province_code: str,
    max_distance_km: float,
) -> Campground | None:
    target_norm = normalize_place_name(target_name)
    best: tuple[float, Campground] | None = None
    for campground in campgrounds:
        park = campground.park
        if province_code and park and park.state_province and park.state_province.upper() != province_code:
            continue
        name_score = _name_score(target_norm, normalize_place_name(campground.name))
        if name_score <= 0:
            continue
        distance_penalty = _distance_penalty(
            target_lat,
            target_lon,
            _parse_float(campground.lat),
            _parse_float(campground.lon),
            max_distance_km=max_distance_km,
        )
        if distance_penalty is None:
            continue
        score = name_score - distance_penalty
        if best is None or score > best[0]:
            best = (score, campground)
    return best[1] if best and best[0] > 0.5 else None


def _find_best_park_match(
    parks: list[Park],
    *,
    target_name: str,
    target_lat: float | None,
    target_lon: float | None,
    province_code: str,
    max_distance_km: float,
) -> Park | None:
    target_norm = normalize_place_name(target_name)
    best: tuple[float, Park] | None = None
    for park in parks:
        if province_code and park.state_province and park.state_province.upper() != province_code:
            continue
        name_score = _name_score(target_norm, normalize_place_name(park.name))
        if name_score <= 0:
            continue
        distance_penalty = _distance_penalty(
            target_lat,
            target_lon,
            _parse_float(park.lat),
            _parse_float(park.lon),
            max_distance_km=max_distance_km,
        )
        if distance_penalty is None:
            continue
        score = name_score - distance_penalty
        if best is None or score > best[0]:
            best = (score, park)
    return best[1] if best and best[0] > 0.5 else None


def _name_score(left: str, right: str) -> float:
    if not left or not right:
        return 0.0
    if left == right:
        return 1.0
    if left in right or right in left:
        return 0.8
    left_tokens = set(left.split())
    right_tokens = set(right.split())
    if not left_tokens or not right_tokens:
        return 0.0
    overlap = len(left_tokens & right_tokens) / max(len(left_tokens), len(right_tokens))
    return overlap


def _distance_penalty(
    target_lat: float | None,
    target_lon: float | None,
    candidate_lat: float | None,
    candidate_lon: float | None,
    *,
    max_distance_km: float,
) -> float | None:
    if target_lat is None or target_lon is None or candidate_lat is None or candidate_lon is None:
        return 0.0
    distance = haversine_km(target_lat, target_lon, candidate_lat, candidate_lon)
    if distance > max_distance_km:
        return None
    return min(0.5, distance / max_distance_km)


def _parse_float(value: Any) -> float | None:
    if value is None or value == "":
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def geometry_to_wkt(geometry: dict[str, Any]) -> str | None:
    geometry_type = geometry.get("type")
    coordinates = geometry.get("coordinates")
    if not geometry_type or coordinates is None:
        return None
    if geometry_type == "Polygon":
        return "POLYGON(" + ",".join(_ring_to_wkt(ring) for ring in coordinates) + ")"
    if geometry_type == "MultiPolygon":
        polygons = []
        for polygon in coordinates:
            polygons.append("(" + ",".join(_ring_to_wkt(ring) for ring in polygon) + ")")
        return "MULTIPOLYGON(" + ",".join(polygons) + ")"
    return None


def _ring_to_wkt(ring: list[list[float]]) -> str:
    points = ", ".join(f"{point[0]} {point[1]}" for point in ring)
    return f"({points})"
