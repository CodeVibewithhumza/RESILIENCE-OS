"""Integration tests for FastAPI REST Endpoints."""
import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app, raise_server_exceptions=False)

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

def test_register_scenario_and_list():
    scenario_id = None
    file_path = None
    try:
        with TestClient(app) as test_client:
            new_scenario = {
                "name": "Test Scenario API",
                "target_asset": "TEST-01",
                "failure_type": "test_failure",
                "severity": "high",
                "duration_minutes": 30
            }

            post_resp = test_client.post("/api/scenarios", json=new_scenario)
            assert post_resp.status_code == 201
            post_data = post_resp.json()
            assert post_data["status"] == "success"

            scenario_id = post_data["scenario_id"]
            assert scenario_id is not None

            get_resp = test_client.get("/api/scenarios")
            assert get_resp.status_code == 200
            get_data = get_resp.json()

            # Verify the scenario is listed
            found = any(s.get("scenario_id") == scenario_id for s in get_data["scenarios"])
            assert found

            import os
            from pathlib import Path
            scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
            file_path = scenarios_dir / f"{scenario_id}.json"
    finally:
        if file_path and file_path.exists():
            file_path.unlink()

def test_retrieve_resilience_breakdown_by_id():
    with TestClient(app) as test_client:
        run_response = test_client.post(
            "/api/simulation/run",
            json={"strategy_id": "strat_c"},
        )
        assert run_response.status_code == 200
        simulation_id = run_response.json()["id"]

        resilience_response = test_client.get(
            f"/api/resilience/{simulation_id}"
        )
        assert resilience_response.status_code == 200
        resilience_data = resilience_response.json()
        assert "overall_score" in resilience_data
        assert "sub_scores" in resilience_data

def test_global_error_handler_validation():
    from fastapi.testclient import TestClient
    from backend.app.main import app
    client = TestClient(app, raise_server_exceptions=False)
    """Test 422 RequestValidationError is formatted correctly."""
    # Sending missing required fields
    response = client.post("/api/failures/inject", json={})
    assert response.status_code == 422
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "validation_error"
    assert "message" in data["error"]
    assert "details" in data["error"]
    assert isinstance(data["error"]["details"], list)

def test_global_error_handler_http_exception():
    from fastapi.testclient import TestClient
    from backend.app.main import app
    client = TestClient(app, raise_server_exceptions=False)
    """Test standard HTTPException is formatted correctly."""
    # Endpoint that should return 404
    response = client.get("/api/resilience/999999")
    assert response.status_code == 404
    data = response.json()
    assert "error" in data
    assert data["error"]["code"] == "http_404"
    assert data["error"]["message"] == "Simulation run '999999' not found."

def test_global_error_handler_unexpected_exception():
    from fastapi.testclient import TestClient
    from backend.app.main import app
    client = TestClient(app, raise_server_exceptions=False)
    """Test unexpected 500 exceptions are formatted correctly and don't leak stack traces."""
    # We can mock a route to throw a raw Exception
    from backend.app.main import app

    @app.get("/api/test-trigger-500")
    def trigger_500():
        raise RuntimeError("This is a secret database failure detail that must not leak")

    try:
        response = client.get("/api/test-trigger-500")
        assert response.status_code == 500
        data = response.json()

        assert "error" in data
        assert data["error"]["code"] == "internal_server_error"
        assert data["error"]["message"] == "An unexpected server error occurred."
        assert "This is a secret database failure detail that must not leak" not in response.text
    finally:
        app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/api/test-trigger-500"]

def test_invalid_asset_id_failure_injection():
    response = client.post(
        "/api/failures/inject",
        json={"asset_id": "FAKE_ASSET_123", "failure_type": "complete_outage"}
    )
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "http_404"
    assert "not found" in data["error"]["message"].lower()

def test_malformed_json_request():
    response = client.post(
        "/api/failures/inject",
        content="this is not valid json",
        headers={"Content-Type": "application/json"}
    )
    # FastAPI catches malformed JSON before validation handlers sometimes, or it drops to 400/422.
    assert response.status_code in [400, 422]
    data = response.json()
    assert "error" in data

def test_invalid_strategy_input():
    with TestClient(app) as test_client:
        response = test_client.post(
            "/api/simulation/run",
            json={"strategy_id": "UNKNOWN_STRAT_XYZ"},
        )
        assert response.status_code == 404
        data = response.json()
        assert data["error"]["code"] == "http_404"
        assert "not found" in data["error"]["message"].lower()
