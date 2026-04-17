from __future__ import annotations

import json
import shlex
from asyncio.subprocess import PIPE, create_subprocess_exec

from app.core.config import settings
from app.providers.base import ProviderClientError, ProviderSessionContext, SessionBootstrapper


class CommandSessionBootstrapper(SessionBootstrapper):
    """
    Runs an external helper that returns JSON with cookies/headers for WAF-backed providers.

    Expected stdout JSON shape:
    {
      "cookies": {"name": "value"},
      "headers": {"Header-Name": "value"}
    }
    """

    async def get_session(self, provider_name: str, base_url: str) -> ProviderSessionContext:
        if not settings.provider_session_bootstrap_command:
            return ProviderSessionContext()

        parts = shlex.split(settings.provider_session_bootstrap_command)
        process = await create_subprocess_exec(
            *parts,
            provider_name,
            base_url,
            stdout=PIPE,
            stderr=PIPE,
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise ProviderClientError(
                f"session bootstrap failed for {provider_name}: {stderr.decode().strip()}"
            )

        try:
            payload = json.loads(stdout.decode().strip() or "{}")
        except json.JSONDecodeError as exc:
            raise ProviderClientError(
                f"session bootstrap returned invalid JSON for {provider_name}"
            ) from exc

        return ProviderSessionContext(
            cookies=payload.get("cookies", {}) or {},
            headers=payload.get("headers", {}) or {},
        )

