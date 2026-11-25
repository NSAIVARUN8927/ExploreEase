from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

def test_root_returns_api_information():
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert body["docs"] == "/docs"
    assert body["health"] == "/health"

def test_health_is_liveness_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_openapi_schema_is_available():
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    assert "/api/v1/places" in schema["paths"]
    assert "/api/v1/trips/plan" in schema["paths"]
