from pathlib import Path
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "Alphacamper API"
    environment: str = "development"
    api_prefix: str = "/v1"
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/alphacamper"
    )
    redis_url: str = Field(default="redis://localhost:6379/0")
    http_timeout_seconds: float = 30.0
    default_page_size: int = 25
    max_page_size: int = 100
    user_agent: str = "AlphacamperAPI/0.1 (+https://alphacamper.com)"

    ridb_api_key: str | None = None
    nps_api_key: str | None = None
    resend_api_key: str | None = None
    resend_from_email: str | None = None
    webhook_signing_secret: str | None = None
    admin_api_key: str | None = None

    # This is the future seam for WAF-backed providers. The backend can shell out
    # to a Playwright or browser helper that returns fresh cookies/headers.
    provider_session_bootstrap_command: str | None = None
    provider_browser_fetch_command: str | None = None
    provider_browser_availability_command: str | None = None

    poll_interval_hot_seconds: int = 60
    poll_interval_warm_seconds: int = 180
    poll_interval_cold_seconds: int = 600
    poll_batch_size: int = 25
    alert_delivery_max_attempts: int = 3

    @property
    def resolved_provider_browser_fetch_command(self) -> str | None:
        return self.provider_browser_fetch_command or _default_node_script_command(
            "camis_browser_fetch.cjs"
        )

    @property
    def resolved_provider_browser_availability_command(self) -> str | None:
        return self.provider_browser_availability_command or _default_node_script_command(
            "camis_availability_session.cjs"
        )


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()


def _default_node_script_command(script_name: str) -> str | None:
    repo_root = Path(__file__).resolve().parents[2]
    script_path = repo_root / "scripts" / script_name
    if script_path.exists():
        return f"node {script_path}"
    return None
