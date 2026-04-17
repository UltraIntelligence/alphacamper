from datetime import date

from app.models.enums import AvailabilityStatus
from app.providers.browser_camis_client import BrowserBackedCamisClient


def test_parse_browser_availability_payload_builds_night_rows() -> None:
    payload = {
        "sitePayloads": [
            {
                "mapId": 99,
                "payload": {
                    "resourceAvailabilities": {
                        "site-1": [
                            {"availability": 0},
                            {"availability": 1},
                        ]
                    }
                },
            }
        ]
    }

    rows = BrowserBackedCamisClient._parse_browser_availability_payload(
        payload=payload,
        resource_location_id=123,
        start_date=date(2026, 7, 1),
        end_date=date(2026, 7, 2),
        status_mapper=lambda code: AvailabilityStatus.AVAILABLE if code == 0 else AvailabilityStatus.RESERVED,
    )

    assert rows == [
        {
            "external_campsite_id": "site-1",
            "resource_location_id": 123,
            "map_id": 99,
            "date": date(2026, 7, 1),
            "status": AvailabilityStatus.AVAILABLE,
            "raw_payload": {"availability": 0},
        },
        {
            "external_campsite_id": "site-1",
            "resource_location_id": 123,
            "map_id": 99,
            "date": date(2026, 7, 2),
            "status": AvailabilityStatus.RESERVED,
            "raw_payload": {"availability": 1},
        },
    ]
