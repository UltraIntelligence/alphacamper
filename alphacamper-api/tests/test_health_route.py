from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_route_is_available_without_version_prefix() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Alphacamper API"


def test_health_route_is_available_with_version_prefix() -> None:
    response = client.get("/v1/health")

    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["service"] == "Alphacamper API"
