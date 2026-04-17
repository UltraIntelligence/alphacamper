from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Protocol

import httpx

from app.core.config import settings


class ProviderClientError(RuntimeError):
    """Raised when a provider call fails in a way the caller should see."""


@dataclass
class ProviderSessionContext:
    cookies: dict[str, str] = field(default_factory=dict)
    headers: dict[str, str] = field(default_factory=dict)


class SessionBootstrapper(Protocol):
    async def get_session(self, provider_name: str, base_url: str) -> ProviderSessionContext: ...


class NullSessionBootstrapper:
    async def get_session(self, provider_name: str, base_url: str) -> ProviderSessionContext:
        return ProviderSessionContext()


class BaseHTTPClient:
    def __init__(
        self,
        *,
        provider_name: str,
        base_url: str,
        default_headers: dict[str, str] | None = None,
        session_bootstrapper: SessionBootstrapper | None = None,
    ) -> None:
        self.provider_name = provider_name
        self.base_url = base_url.rstrip("/")
        self.default_headers = {
            "User-Agent": settings.user_agent,
            "Accept": "application/json",
            **(default_headers or {}),
        }
        self.session_bootstrapper = session_bootstrapper or NullSessionBootstrapper()
        self._client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=self.default_headers,
            timeout=settings.http_timeout_seconds,
            follow_redirects=True,
        )

    async def aclose(self) -> None:
        await self._client.aclose()

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
        request_headers = {**self.default_headers, **(headers or {})}
        cookies: dict[str, str] | None = None

        if require_session:
            session_ctx = await self.session_bootstrapper.get_session(
                self.provider_name,
                self.base_url,
            )
            request_headers.update(session_ctx.headers)
            cookies = session_ctx.cookies

        response = await self._client.request(
            method,
            path,
            params=params,
            json=json_body,
            headers=request_headers,
            cookies=cookies,
        )
        if response.status_code >= 400:
            body = response.text[:500]
            raise ProviderClientError(
                f"{self.provider_name} request failed ({response.status_code}): {body}"
            )
        content_type = response.headers.get("content-type", "")
        if "application/json" in content_type or content_type.endswith("+json") or "+json;" in content_type:
            return response.json()
        return response.text
