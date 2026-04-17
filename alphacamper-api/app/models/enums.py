from enum import StrEnum


class ProviderKind(StrEnum):
    FEDERAL = "federal"
    STATE = "state"
    PROVINCIAL = "provincial"
    PRIVATE = "private"
    PLATFORM = "platform"


class AvailabilityStatus(StrEnum):
    AVAILABLE = "available"
    UNAVAILABLE = "unavailable"
    RESERVED = "reserved"
    CLOSED = "closed"
    FIRST_COME_FIRST_SERVE = "first-come-first-serve"
    NOT_YET_RELEASED = "not-yet-released"
    UNKNOWN = "unknown"


class NotificationChannel(StrEnum):
    EMAIL = "email"
    SMS = "sms"
    WEBHOOK = "webhook"
