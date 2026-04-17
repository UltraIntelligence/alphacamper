from __future__ import annotations

import os

from app.services.catalog_refresh import promote_catalog


def _required_env(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def main() -> None:
    source_database_url = _required_env("SOURCE_DATABASE_URL").replace("+psycopg", "")
    target_database_url = _required_env("TARGET_DATABASE_URL").replace("+psycopg", "")
    print(
        promote_catalog(
            source_database_url=source_database_url,
            target_database_url=target_database_url,
        )
    )


if __name__ == "__main__":
    main()
