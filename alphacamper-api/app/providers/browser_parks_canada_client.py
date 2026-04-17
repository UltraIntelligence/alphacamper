from __future__ import annotations

from app.providers.base import SessionBootstrapper
from app.providers.browser_camis_client import BrowserBackedCamisClient
from app.providers.parks_canada_client import ParksCanadaClient


class BrowserBackedParksCanadaClient(BrowserBackedCamisClient, ParksCanadaClient):
    def __init__(
        self,
        *,
        browser_fetch_command: str,
        session_bootstrapper: SessionBootstrapper | None = None,
    ) -> None:
        BrowserBackedCamisClient.__init__(
            self,
            provider_name="parks_canada",
            domain="reservation.pc.gc.ca",
            browser_fetch_command=browser_fetch_command,
            session_bootstrapper=session_bootstrapper,
        )
