from datetime import datetime

from pydantic import BaseModel


class ProviderHealthRow(BaseModel):
    provider_id: str
    provider_name: str
    country: str | None = None
    kind: str
    status: str
    availability_mode: str
    confidence: str
    verification_note: str
    last_request_at: datetime | None = None
    next_allowed_at: datetime | None = None
    current_backoff_seconds: int
    consecutive_errors: int
    last_error_code: str | None = None


class AlertDeliverySummary(BaseModel):
    active_alerts: int
    total_deliveries: int
    delivered: int
    failed: int
    webhook_deliveries: int
    email_deliveries: int


class ProviderQualitySummary(BaseModel):
    total: int
    live_polling: int
    directory_only: int
    metadata_only: int
    verified: int
    inferred: int
    seeded: int
    unknown: int


class AdminOverviewResponse(BaseModel):
    providers: list[ProviderHealthRow]
    provider_quality: ProviderQualitySummary
    alert_delivery: AlertDeliverySummary


class CatalogRefreshJobCreateRequest(BaseModel):
    mode: str = "promote_local_catalog"
    requested_by: str | None = None
    source_label: str | None = None
    notes: str | None = None


class CatalogRefreshJobResponse(BaseModel):
    id: str
    mode: str
    status: str
    requested_by: str | None = None
    trigger_source: str | None = None
    requested_at: datetime
    started_at: datetime | None = None
    finished_at: datetime | None = None
    summary_json: dict | None = None
    metadata_json: dict | None = None
    error_message: str | None = None
