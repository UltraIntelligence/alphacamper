from fastapi import APIRouter

from app.api.routes import admin, alerts, availability, campgrounds, campsites, coverage, health, notices, parks, providers

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
api_router.include_router(campgrounds.router, prefix="/v1/campgrounds", tags=["campgrounds"])
api_router.include_router(parks.router, prefix="/v1/parks", tags=["parks"])
api_router.include_router(campsites.router, prefix="/v1/campsites", tags=["campsites"])
api_router.include_router(availability.router, prefix="/v1/availability", tags=["availability"])
api_router.include_router(alerts.router, prefix="/v1/alerts", tags=["alerts"])
api_router.include_router(notices.router, prefix="/v1/notices", tags=["notices"])
api_router.include_router(providers.router, prefix="/v1/providers", tags=["providers"])
api_router.include_router(coverage.router, prefix="/v1/coverage", tags=["coverage"])
api_router.include_router(admin.router, prefix="/v1/admin", tags=["admin"])
