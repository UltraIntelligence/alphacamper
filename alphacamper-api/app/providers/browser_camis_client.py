from __future__ import annotations

import json
import shlex
from asyncio.subprocess import PIPE, create_subprocess_exec
from datetime import date
from typing import Any

from app.core.config import settings
from app.providers.base import ProviderClientError, SessionBootstrapper
from app.providers.camis_client import CamisClient


class BrowserBackedCamisClient(CamisClient):
    """
    CAMIS client that executes protected API calls inside a real browser context.

    Use this when Azure WAF blocks raw server-side HTTP even after cookie bootstrap.
    """

    def __init__(
        self,
        *,
        provider_name: str,
        domain: str,
        browser_fetch_command: str,
        session_bootstrapper: SessionBootstrapper | None = None,
    ) -> None:
        CamisClient.__init__(
            self,
            provider_name=provider_name,
            domain=domain,
            session_bootstrapper=session_bootstrapper,
        )
        self.browser_fetch_command = browser_fetch_command

    @staticmethod
    def _parse_browser_availability_payload(
        *,
        payload: dict[str, Any],
        resource_location_id: int,
        start_date: date,
        end_date: date,
        status_mapper,
    ) -> list[dict[str, Any]]:
        snapshots: list[dict[str, Any]] = []
        for site_payload in payload.get("sitePayloads", []):
            map_id = site_payload.get("mapId")
            resources = (site_payload.get("payload") or {}).get("resourceAvailabilities", {})
            for site_id, nights in resources.items():
                current_date = start_date
                for entry in nights:
                    if current_date > end_date:
                        break
                    snapshots.append(
                        {
                            "external_campsite_id": str(site_id),
                            "resource_location_id": resource_location_id,
                            "map_id": map_id,
                            "date": current_date,
                            "status": status_mapper(entry.get("availability")),
                            "raw_payload": entry,
                        }
                    )
                    current_date = date.fromordinal(current_date.toordinal() + 1)
        return snapshots

    async def _request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        json_body: dict[str, Any] | list[Any] | None = None,
        headers: dict[str, str] | None = None,
        require_session: bool = False,
    ) -> Any:
        if not require_session:
            return await super()._request(
                method,
                path,
                params=params,
                json_body=json_body,
                headers=headers,
                require_session=require_session,
            )

        parts = shlex.split(self.browser_fetch_command)
        process = await create_subprocess_exec(
            *parts,
            self.provider_name,
            self.base_url,
            method,
            path,
            json.dumps(params or {}),
            json.dumps(json_body) if json_body is not None else "null",
            stdout=PIPE,
            stderr=PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise ProviderClientError(
                f"browser fetch failed for {self.provider_name}: {stderr.decode().strip()}"
            )

        payload = json.loads(stdout.decode() or "{}")
        status = payload.get("status")
        body_text = payload.get("body", "")
        if status and status >= 400:
            raise ProviderClientError(
                f"{self.provider_name} browser fetch failed ({status}): {body_text[:500]}"
            )
        content_type = (payload.get("headers") or {}).get("content-type", "")
        if "application/json" in content_type:
            return json.loads(body_text)
        return body_text

    async def get_availability(
        self,
        *,
        resource_location_id: int,
        root_map_id: int,
        start_date: date,
        end_date: date,
    ) -> list[dict[str, Any]]:
        if not settings.resolved_provider_browser_availability_command:
            return await super().get_availability(
                resource_location_id=resource_location_id,
                root_map_id=root_map_id,
                start_date=start_date,
                end_date=end_date,
            )

        parts = shlex.split(settings.resolved_provider_browser_availability_command)
        process = await create_subprocess_exec(
            *parts,
            self.provider_name,
            self.base_url,
            str(resource_location_id),
            str(root_map_id),
            start_date.isoformat(),
            end_date.isoformat(),
            stdout=PIPE,
            stderr=PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise ProviderClientError(
                f"browser availability session failed for {self.provider_name}: {stderr.decode().strip()}"
            )

        payload = json.loads(stdout.decode() or "{}")
        return self._parse_browser_availability_payload(
            payload=payload,
            resource_location_id=resource_location_id,
            start_date=start_date,
            end_date=end_date,
            status_mapper=self._map_status,
        )
