from __future__ import annotations

from dateutil import parser as date_parser

from app.ingestion.jobs.helpers import get_or_create_provider, upsert_notice
from app.models.enums import ProviderKind
from app.providers.nws_client import NwsClient


async def ingest_nws_alerts(session, *, states: list[str]) -> dict[str, int]:
    client = NwsClient()
    provider = get_or_create_provider(
        session,
        name="National Weather Service",
        kind=ProviderKind.FEDERAL,
        base_url="https://api.weather.gov",
        country="US",
        notes="Official NWS weather alerts for campground and park enrichment",
    )

    created = 0
    try:
        for state in states:
            payload = await client.list_active_alerts(area=state)
            for feature in payload.get("features", []):
                properties = feature.get("properties") or {}
                upsert_notice(
                    session,
                    provider_id=provider.id,
                    external_notice_id=properties.get("id") or feature.get("id"),
                    defaults={
                        "park_id": None,
                        "campground_id": None,
                        "title": properties.get("headline") or properties.get("event") or "Weather alert",
                        "summary": properties.get("event"),
                        "body": properties.get("description") or properties.get("instruction"),
                        "severity": properties.get("severity"),
                        "status": properties.get("status") or properties.get("messageType"),
                        "url": properties.get("@id") or properties.get("id"),
                        "effective_at": (
                            date_parser.isoparse(properties["effective"])
                            if properties.get("effective")
                            else None
                        ),
                        "expires_at": (
                            date_parser.isoparse(properties["expires"])
                            if properties.get("expires")
                            else None
                        ),
                        "metadata_json": {
                            "state": state,
                            "area_desc": properties.get("areaDesc"),
                            "geocode": properties.get("geocode"),
                            "raw_feature": feature,
                        },
                    },
                )
                created += 1
            session.commit()
    finally:
        await client.aclose()

    return {"notices": created}
