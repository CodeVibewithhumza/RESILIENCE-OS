"""Integration tests for FastAPI REST Endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_hospital_state():
    response = client.get("/api/hospital/state")
    assert response.status_code == 200
    data = response.json()
    assert "resilience_index" in data
    assert "telemetry" in data
    assert "assets_summary" in data

def test_dependencies():
    response = client.get("/api/dependencies")
    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) > 0
    assert len(data["edges"]) > 0

def test_failure_injection_and_reset():
    # 1. Inject failure
    inject_resp = client.post(
        "/api/failures/inject",
        json={"asset_id": "GRID_MAIN", "failure_type": "complete_outage"}
    )
    assert inject_resp.status_code == 200
    assert inject_resp.json()["status"] == "failure_injected"
    
    # 2. Check What-If
    what_if_resp = client.get("/api/simulation/what-if")
    assert what_if_resp.status_code == 200
    assert len(what_if_resp.json()["strategies"]) == 6
    
    # 3. Reset
    reset_resp = client.post("/api/hospital/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"
