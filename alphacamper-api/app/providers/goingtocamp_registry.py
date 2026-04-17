from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GoingToCampDomain:
    provider_name: str
    domain: str
    country: str = "CA"
    state_province: str | None = None
    notes: str | None = None
    live_camis_enabled: bool = False


KNOWN_GOINGTOCAMP_DOMAINS: tuple[GoingToCampDomain, ...] = (
    GoingToCampDomain(
        provider_name="Nova Scotia Parks Reservation Service",
        domain="novascotia.goingtocamp.com",
        state_province="NS",
        notes="Public white-label GoingToCamp domain for Nova Scotia provincial parks.",
    ),
    GoingToCampDomain(
        provider_name="Manitoba Parks Reservation Service",
        domain="manitoba.goingtocamp.com",
        state_province="MB",
        notes="Public white-label GoingToCamp domain for Manitoba Parks.",
    ),
    GoingToCampDomain(
        provider_name="New Brunswick Provincial Parks Reservation Service",
        domain="parcsnbparks.info",
        state_province="NB",
        notes="Public white-label GoingToCamp domain for New Brunswick provincial parks.",
    ),
    GoingToCampDomain(
        provider_name="Newfoundland and Labrador Parks Reservation Service",
        domain="nlcamping.ca",
        state_province="NL",
        notes="Public white-label GoingToCamp domain for Newfoundland and Labrador provincial parks.",
    ),
    GoingToCampDomain(
        provider_name="Long Point Region Conservation Booking",
        domain="longpoint.goingtocamp.com",
        state_province="ON",
        notes="Ontario regional GoingToCamp system with a live CAMIS directory.",
        live_camis_enabled=True,
    ),
    GoingToCampDomain(
        provider_name="Algonquin Highlands Booking",
        domain="algonquinhighlands.goingtocamp.com",
        state_province="ON",
        notes="Ontario regional GoingToCamp system. Currently kept as a curated seed because the public host is not resolving cleanly.",
    ),
    GoingToCampDomain(
        provider_name="Maitland Valley Booking",
        domain="maitlandvalley.goingtocamp.com",
        state_province="ON",
        notes="Ontario regional GoingToCamp system with a live CAMIS directory.",
        live_camis_enabled=True,
    ),
    GoingToCampDomain(
        provider_name="Saugeen Valley Booking",
        domain="saugeen.goingtocamp.com",
        state_province="ON",
        notes="Ontario regional GoingToCamp system. Currently kept as a curated seed because the public host is not resolving cleanly.",
    ),
    GoingToCampDomain(
        provider_name="St. Clair Region Booking",
        domain="stclair.goingtocamp.com",
        state_province="ON",
        notes="Ontario regional GoingToCamp system with a live CAMIS directory.",
        live_camis_enabled=True,
    ),
)


def list_known_goingtocamp_domains() -> list[GoingToCampDomain]:
    return list(KNOWN_GOINGTOCAMP_DOMAINS)


def get_goingtocamp_domain(domain: str) -> GoingToCampDomain | None:
    normalized = domain.lower().strip()
    for item in KNOWN_GOINGTOCAMP_DOMAINS:
        if item.domain == normalized:
            return item
    return None


def is_live_camis_goingtocamp_domain(domain: str) -> bool:
    item = get_goingtocamp_domain(domain)
    return bool(item and item.live_camis_enabled)


def camis_provider_name_for_domain(domain: str) -> str:
    return domain.lower().replace(".", "_").replace("-", "_")
