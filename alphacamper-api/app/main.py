from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description=(
            "Read-only campground metadata, availability, and alerts API for Canada-first "
            "camping coverage."
        ),
    )
    app.include_router(api_router)
    return app


app = create_app()
