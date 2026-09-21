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


def test_telemetry_persistence_and_history():
    with TestClient(app) as test_client:
        persist_response = test_client.post("/api/telemetry/persist")

        assert persist_response.status_code == 200
        assert persist_response.json()["status"] == "success"
        assert persist_response.json()["inserted_records"] == 18

        history_response = test_client.get("/api/telemetry/history?limit=5")

        assert history_response.status_code == 200
        data = history_response.json()
        assert data["count"] == 5
        assert len(data["records"]) == 5


def test_simulation_persistence_and_retrieval():
    with TestClient(app) as test_client:
        run_response = test_client.post(
            "/api/simulation/run",
            json={"strategy_id": "strat_c"},
        )

        assert run_response.status_code == 200
        run_data = run_response.json()
        assert run_data["strategy_id"] == "strat_c"
        assert run_data["status"] == "completed"
        assert run_data["id"] > 0

        simulation_id = run_data["id"]

        retrieve_response = test_client.get(
            f"/api/simulation/{simulation_id}"
        )

        assert retrieve_response.status_code == 200
        retrieved_data = retrieve_response.json()
        assert retrieved_data["id"] == simulation_id
        assert retrieved_data["strategy_id"] == "strat_c"
