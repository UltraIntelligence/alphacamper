from __future__ import annotations

from urllib.parse import urlparse

from app.core.config import settings
from app.providers.browser_camis_client import BrowserBackedCamisClient
from app.providers.browser_parks_canada_client import BrowserBackedParksCanadaClient
from app.models.entities import Provider
from app.providers.base import ProviderClientError
from app.providers.camis_client import CamisClient
from app.providers.goingtocamp_registry import (
    camis_provider_name_for_domain,
    is_live_camis_goingtocamp_domain,
)
from app.providers.parks_canada_client import ParksCanadaClient
from app.providers.recreation_gov_client import RecGovAvailabilityClient
from app.providers.session_bootstrap import CommandSessionBootstrapper


def build_availability_client(provider: Provider):
    base_url = (provider.base_url or "").lower()
    host = urlparse(base_url).netloc or base_url.replace("https://", "").replace("http://", "")
    session_bootstrapper = CommandSessionBootstrapper()

    if "recreation.gov" in base_url:
        return RecGovAvailabilityClient()
    if "reservation.pc.gc.ca" in base_url:
        if settings.resolved_provider_browser_fetch_command:
            return BrowserBackedParksCanadaClient(
                browser_fetch_command=settings.resolved_provider_browser_fetch_command,
                session_bootstrapper=session_bootstrapper,
            )
        return ParksCanadaClient(session_bootstrapper=session_bootstrapper)
    if "camping.bcparks.ca" in base_url:
        if settings.resolved_provider_browser_fetch_command:
            return BrowserBackedCamisClient(
                provider_name="bc_parks",
                domain="camping.bcparks.ca",
                browser_fetch_command=settings.resolved_provider_browser_fetch_command,
                session_bootstrapper=session_bootstrapper,
            )
        return CamisClient(
            provider_name="bc_parks",
            domain="camping.bcparks.ca",
            session_bootstrapper=session_bootstrapper,
        )
    if "reservations.ontarioparks.ca" in base_url:
        if settings.resolved_provider_browser_fetch_command:
            return BrowserBackedCamisClient(
                provider_name="ontario_parks",
                domain="reservations.ontarioparks.ca",
                browser_fetch_command=settings.resolved_provider_browser_fetch_command,
                session_bootstrapper=session_bootstrapper,
            )
        return CamisClient(
            provider_name="ontario_parks",
            domain="reservations.ontarioparks.ca",
            session_bootstrapper=session_bootstrapper,
        )
    if is_live_camis_goingtocamp_domain(host):
        provider_name = camis_provider_name_for_domain(host)
        if settings.resolved_provider_browser_fetch_command:
            return BrowserBackedCamisClient(
                provider_name=provider_name,
                domain=host,
                browser_fetch_command=settings.resolved_provider_browser_fetch_command,
                session_bootstrapper=session_bootstrapper,
            )
        return CamisClient(
            provider_name=provider_name,
            domain=host,
            session_bootstrapper=session_bootstrapper,
        )
    raise ProviderClientError(f"No live availability client configured for provider {provider.name}")
