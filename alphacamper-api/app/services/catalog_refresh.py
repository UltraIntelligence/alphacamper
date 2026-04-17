from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb


def _jsonb(value: object) -> object:
    if value is None:
        return None
    return Jsonb(value)


@dataclass(slots=True)
class CatalogPromotionSummary:
    providers: int = 0
    parks: int = 0
    campgrounds: int = 0
    campsites: int = 0
    notices: int = 0
    provider_states: int = 0

    def as_dict(self) -> dict[str, int]:
        return {
            "providers": self.providers,
            "parks": self.parks,
            "campgrounds": self.campgrounds,
            "campsites": self.campsites,
            "notices": self.notices,
            "provider_states": self.provider_states,
        }


def _fetch_rows(conn: psycopg.Connection, query: str) -> list[dict]:
    with conn.cursor(row_factory=dict_row) as cur:
        cur.execute(query)
        return list(cur.fetchall())


def _delete_provider_children(dest: psycopg.Connection, provider_ids: Iterable[str]) -> None:
    provider_ids = list(provider_ids)
    if not provider_ids:
        return

    with dest.cursor() as cur:
        cur.execute("DELETE FROM notices WHERE provider_id = ANY(%s)", (provider_ids,))
        cur.execute("DELETE FROM provider_rate_limit_state WHERE provider_id = ANY(%s)", (provider_ids,))


def promote_catalog(*, source_database_url: str, target_database_url: str) -> dict[str, int]:
    summary = CatalogPromotionSummary()

    with psycopg.connect(source_database_url, row_factory=dict_row) as source, psycopg.connect(
        target_database_url,
        row_factory=dict_row,
    ) as dest:
        source.autocommit = False
        dest.autocommit = False

        source_providers = _fetch_rows(
            source,
            """
            SELECT id, name, kind::text AS kind, base_url, country, notes
            FROM providers
            ORDER BY name
            """,
        )

        provider_id_map: dict[str, str] = {}
        provider_ids_in_dest: list[str] = []
        with dest.cursor() as cur:
            for row in source_providers:
                cur.execute(
                    """
                    INSERT INTO providers (id, name, kind, base_url, country, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON CONFLICT (name) DO UPDATE
                    SET kind = EXCLUDED.kind,
                        base_url = EXCLUDED.base_url,
                        country = EXCLUDED.country,
                        notes = EXCLUDED.notes
                    RETURNING id
                    """,
                    (
                        row["id"],
                        row["name"],
                        row["kind"],
                        row["base_url"],
                        row["country"],
                        row["notes"],
                    ),
                )
                dest_id = cur.fetchone()["id"]
                provider_id_map[row["id"]] = dest_id
                provider_ids_in_dest.append(dest_id)
                summary.providers += 1

        source_parks = _fetch_rows(
            source,
            """
            SELECT
                id,
                provider_id,
                external_park_id,
                name,
                country,
                region,
                state_province,
                lat,
                lon,
                CASE
                    WHEN boundary_geom IS NULL THEN NULL
                    ELSE ST_AsText(boundary_geom)
                END AS boundary_geom,
                nps_park_code,
                metadata_json
            FROM parks
            ORDER BY name
            """,
        )

        park_id_map: dict[str, str] = {}
        with dest.cursor() as cur:
            for row in source_parks:
                dest_provider_id = provider_id_map[row["provider_id"]]
                external_park_id = row["external_park_id"] or row["name"]
                cur.execute(
                    """
                    INSERT INTO parks (
                        id,
                        provider_id,
                        external_park_id,
                        name,
                        country,
                        region,
                        state_province,
                        lat,
                        lon,
                        boundary_geom,
                        nps_park_code,
                        metadata_json
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (provider_id, external_park_id) DO UPDATE
                    SET name = EXCLUDED.name,
                        country = EXCLUDED.country,
                        region = EXCLUDED.region,
                        state_province = EXCLUDED.state_province,
                        lat = EXCLUDED.lat,
                        lon = EXCLUDED.lon,
                        boundary_geom = EXCLUDED.boundary_geom,
                        nps_park_code = EXCLUDED.nps_park_code,
                        metadata_json = EXCLUDED.metadata_json
                    RETURNING id
                    """,
                    (
                        row["id"],
                        dest_provider_id,
                        external_park_id,
                        row["name"],
                        row["country"],
                        row["region"],
                        row["state_province"],
                        row["lat"],
                        row["lon"],
                        row["boundary_geom"],
                        row["nps_park_code"],
                        _jsonb(row["metadata_json"]),
                    ),
                )
                park_id_map[row["id"]] = cur.fetchone()["id"]
                summary.parks += 1

        source_campgrounds = _fetch_rows(
            source,
            """
            SELECT
                id,
                provider_id,
                park_id,
                external_facility_id,
                name,
                description,
                lat,
                lon,
                elevation,
                timezone,
                address,
                driving_directions,
                season_open,
                season_close,
                booking_url,
                max_advance_reservation_days,
                amenities,
                accessibility,
                cell_coverage,
                photos
            FROM campgrounds
            ORDER BY name
            """,
        )

        campground_id_map: dict[str, str] = {}
        with dest.cursor() as cur:
            for row in source_campgrounds:
                dest_provider_id = provider_id_map[row["provider_id"]]
                external_facility_id = row["external_facility_id"] or row["name"]
                dest_park_id = park_id_map.get(row["park_id"])
                cur.execute(
                    """
                    INSERT INTO campgrounds (
                        id,
                        provider_id,
                        park_id,
                        external_facility_id,
                        name,
                        description,
                        lat,
                        lon,
                        elevation,
                        timezone,
                        address,
                        driving_directions,
                        season_open,
                        season_close,
                        booking_url,
                        max_advance_reservation_days,
                        amenities,
                        accessibility,
                        cell_coverage,
                        photos
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (provider_id, external_facility_id) DO UPDATE
                    SET park_id = EXCLUDED.park_id,
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        lat = EXCLUDED.lat,
                        lon = EXCLUDED.lon,
                        elevation = EXCLUDED.elevation,
                        timezone = EXCLUDED.timezone,
                        address = EXCLUDED.address,
                        driving_directions = EXCLUDED.driving_directions,
                        season_open = EXCLUDED.season_open,
                        season_close = EXCLUDED.season_close,
                        booking_url = EXCLUDED.booking_url,
                        max_advance_reservation_days = EXCLUDED.max_advance_reservation_days,
                        amenities = EXCLUDED.amenities,
                        accessibility = EXCLUDED.accessibility,
                        cell_coverage = EXCLUDED.cell_coverage,
                        photos = EXCLUDED.photos
                    RETURNING id
                    """,
                    (
                        row["id"],
                        dest_provider_id,
                        dest_park_id,
                        external_facility_id,
                        row["name"],
                        row["description"],
                        row["lat"],
                        row["lon"],
                        row["elevation"],
                        row["timezone"],
                        row["address"],
                        row["driving_directions"],
                        row["season_open"],
                        row["season_close"],
                        row["booking_url"],
                        row["max_advance_reservation_days"],
                        _jsonb(row["amenities"]),
                        _jsonb(row["accessibility"]),
                        _jsonb(row["cell_coverage"]),
                        _jsonb(row["photos"]),
                    ),
                )
                campground_id_map[row["id"]] = cur.fetchone()["id"]
                summary.campgrounds += 1

        source_campsites = _fetch_rows(
            source,
            """
            SELECT
                id,
                campground_id,
                provider_id,
                external_campsite_id,
                loop_name,
                site_number,
                site_name,
                lat,
                lon,
                equipment_types,
                max_occupancy,
                max_vehicle_length,
                is_group_site,
                is_walk_in,
                has_electric,
                has_sewer,
                has_water,
                is_accessible,
                attributes
            FROM campsites
            ORDER BY id
            """,
        )

        with dest.cursor() as cur:
            for row in source_campsites:
                dest_provider_id = provider_id_map[row["provider_id"]]
                dest_campground_id = campground_id_map.get(row["campground_id"])
                if not dest_campground_id:
                    continue
                external_campsite_id = row["external_campsite_id"] or row["id"]
                cur.execute(
                    """
                    INSERT INTO campsites (
                        id,
                        campground_id,
                        provider_id,
                        external_campsite_id,
                        loop_name,
                        site_number,
                        site_name,
                        lat,
                        lon,
                        equipment_types,
                        max_occupancy,
                        max_vehicle_length,
                        is_group_site,
                        is_walk_in,
                        has_electric,
                        has_sewer,
                        has_water,
                        is_accessible,
                        attributes
                    )
                    VALUES (
                        %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                    )
                    ON CONFLICT (provider_id, external_campsite_id) DO UPDATE
                    SET campground_id = EXCLUDED.campground_id,
                        loop_name = EXCLUDED.loop_name,
                        site_number = EXCLUDED.site_number,
                        site_name = EXCLUDED.site_name,
                        lat = EXCLUDED.lat,
                        lon = EXCLUDED.lon,
                        equipment_types = EXCLUDED.equipment_types,
                        max_occupancy = EXCLUDED.max_occupancy,
                        max_vehicle_length = EXCLUDED.max_vehicle_length,
                        is_group_site = EXCLUDED.is_group_site,
                        is_walk_in = EXCLUDED.is_walk_in,
                        has_electric = EXCLUDED.has_electric,
                        has_sewer = EXCLUDED.has_sewer,
                        has_water = EXCLUDED.has_water,
                        is_accessible = EXCLUDED.is_accessible,
                        attributes = EXCLUDED.attributes
                    """,
                    (
                        row["id"],
                        dest_campground_id,
                        dest_provider_id,
                        external_campsite_id,
                        row["loop_name"],
                        row["site_number"],
                        row["site_name"],
                        row["lat"],
                        row["lon"],
                        row["equipment_types"],
                        row["max_occupancy"],
                        row["max_vehicle_length"],
                        row["is_group_site"],
                        row["is_walk_in"],
                        row["has_electric"],
                        row["has_sewer"],
                        row["has_water"],
                        row["is_accessible"],
                        _jsonb(row["attributes"]),
                    ),
                )
                summary.campsites += 1

        _delete_provider_children(dest, provider_ids_in_dest)

        source_states = _fetch_rows(
            source,
            """
            SELECT
                provider_id,
                last_request_at,
                next_allowed_at,
                current_backoff_seconds,
                consecutive_errors,
                last_error_code,
                metadata_json
            FROM provider_rate_limit_state
            """,
        )

        with dest.cursor() as cur:
            for row in source_states:
                dest_provider_id = provider_id_map.get(row["provider_id"])
                if not dest_provider_id:
                    continue
                cur.execute(
                    """
                    INSERT INTO provider_rate_limit_state (
                        provider_id,
                        last_request_at,
                        next_allowed_at,
                        current_backoff_seconds,
                        consecutive_errors,
                        last_error_code,
                        metadata_json
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (provider_id) DO UPDATE
                    SET last_request_at = EXCLUDED.last_request_at,
                        next_allowed_at = EXCLUDED.next_allowed_at,
                        current_backoff_seconds = EXCLUDED.current_backoff_seconds,
                        consecutive_errors = EXCLUDED.consecutive_errors,
                        last_error_code = EXCLUDED.last_error_code,
                        metadata_json = EXCLUDED.metadata_json
                    """,
                    (
                        dest_provider_id,
                        row["last_request_at"],
                        row["next_allowed_at"],
                        row["current_backoff_seconds"],
                        row["consecutive_errors"],
                        row["last_error_code"],
                        _jsonb(row["metadata_json"]),
                    ),
                )
                summary.provider_states += 1

        source_notices = _fetch_rows(
            source,
            """
            SELECT
                id,
                provider_id,
                park_id,
                campground_id,
                external_notice_id,
                title,
                summary,
                body,
                severity,
                status,
                url,
                effective_at,
                expires_at,
                metadata_json
            FROM notices
            ORDER BY effective_at DESC NULLS LAST, title
            """,
        )

        with dest.cursor() as cur:
            for row in source_notices:
                dest_provider_id = provider_id_map.get(row["provider_id"])
                if not dest_provider_id:
                    continue
                dest_park_id = park_id_map.get(row["park_id"])
                dest_campground_id = campground_id_map.get(row["campground_id"])
                cur.execute(
                    """
                    INSERT INTO notices (
                        id,
                        provider_id,
                        park_id,
                        campground_id,
                        external_notice_id,
                        title,
                        summary,
                        body,
                        severity,
                        status,
                        url,
                        effective_at,
                        expires_at,
                        metadata_json
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        row["id"],
                        dest_provider_id,
                        dest_park_id,
                        dest_campground_id,
                        row["external_notice_id"],
                        row["title"],
                        row["summary"],
                        row["body"],
                        row["severity"],
                        row["status"],
                        row["url"],
                        row["effective_at"],
                        row["expires_at"],
                        _jsonb(row["metadata_json"]),
                    ),
                )
                summary.notices += 1

        dest.commit()

    return summary.as_dict()
