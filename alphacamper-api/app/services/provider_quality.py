from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlparse


@dataclass(frozen=True)
class ProviderQuality:
    availability_mode: str
    confidence: str
    verification_note: str


LIVE_POLLING_HOSTS = {
    "recreation.gov": ProviderQuality(
        availability_mode="live_polling",
        confidence="verified",
        verification_note="Live polling verified against Recreation.gov availability responses.",
    ),
    "reservation.pc.gc.ca": ProviderQuality(
        availability_mode="live_polling",
        confidence="verified",
        verification_note="Live polling verified through the browser-backed Parks Canada flow.",
    ),
    "camping.bcparks.ca": ProviderQuality(
        availability_mode="live_polling",
        confidence="verified",
        verification_note="Live polling verified through the browser-backed BC Parks flow.",
    ),
    "reservations.ontarioparks.ca": ProviderQuality(
        availability_mode="live_polling",
        confidence="verified",
        verification_note="Live polling verified through the browser-backed Ontario Parks flow.",
    ),
    "longpoint.goingtocamp.com": ProviderQuality(
        availability_mode="live_polling",
        confidence="inferred",
        verification_note="Live polling works. Status code meanings are behavior-confirmed, with a few labels still inferred from live provider behavior.",
    ),
    "stclair.goingtocamp.com": ProviderQuality(
        availability_mode="live_polling",
        confidence="inferred",
        verification_note="Live polling works. Status code meanings are behavior-confirmed, with a few labels still inferred from live provider behavior.",
    ),
    "maitlandvalley.goingtocamp.com": ProviderQuality(
        availability_mode="live_polling",
        confidence="inferred",
        verification_note="Live polling works. Status code meanings are behavior-confirmed, with a few labels still inferred from live provider behavior.",
    ),
}


DIRECTORY_ONLY_HOSTS = {
    "algonquinhighlands.goingtocamp.com": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Curated seed coverage only. Public host was not cleanly reachable during verification.",
    ),
    "saugeen.goingtocamp.com": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Curated seed coverage only. Public host was not cleanly reachable during verification.",
    ),
    "novascotia.goingtocamp.com": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Provider is present as curated directory coverage. Live polling is not verified yet.",
    ),
    "manitoba.goingtocamp.com": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Provider is present as curated directory coverage. Live polling is not verified yet.",
    ),
    "parcsnbparks.info": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Provider is present as curated directory coverage. Live polling is not verified yet.",
    ),
    "nlcamping.ca": ProviderQuality(
        availability_mode="directory_only",
        confidence="seeded",
        verification_note="Provider is present as curated directory coverage. Live polling is not verified yet.",
    ),
    "ridb.recreation.gov": ProviderQuality(
        availability_mode="metadata_only",
        confidence="verified",
        verification_note="Official RIDB metadata feed only. Live availability comes from separate booking-system polling.",
    ),
    "nps.gov": ProviderQuality(
        availability_mode="metadata_only",
        confidence="verified",
        verification_note="Official NPS metadata and notices only. No direct campsite-night availability polling here.",
    ),
}


DEFAULT_QUALITY = ProviderQuality(
    availability_mode="metadata_only",
    confidence="unknown",
    verification_note="Provider quality has not been classified yet.",
)


def get_provider_quality(*, base_url: str | None, provider_name: str | None = None) -> ProviderQuality:
    host = _host_from_url(base_url)
    if host in LIVE_POLLING_HOSTS:
        return LIVE_POLLING_HOSTS[host]
    if host in DIRECTORY_ONLY_HOSTS:
        return DIRECTORY_ONLY_HOSTS[host]

    normalized_name = (provider_name or "").lower()
    if "weather" in normalized_name or "nws" in normalized_name:
        return ProviderQuality(
            availability_mode="metadata_only",
            confidence="verified",
            verification_note="Official weather-alert enrichment only.",
        )
    return DEFAULT_QUALITY


def _host_from_url(base_url: str | None) -> str:
    if not base_url:
        return ""
    parsed = urlparse(base_url)
    return parsed.netloc.lower() or base_url.replace("https://", "").replace("http://", "").lower()
