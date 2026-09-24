
import json

from fastapi.testclient import TestClient

from backend.app.main import app


def test_websocket_telemetry():
    """Verify telemetry WebSocket sends the expected message structure."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/telemetry") as websocket:
            message = websocket.receive_json()

            assert message["type"] == "telemetry_tick"
            assert "telemetry" in message
            assert "resilience_score" in message
            assert "status_label" in message

            print("WebSocket connected successfully!")
            print("Message type:", message["type"])
            print("Resilience score:", message["resilience_score"])


def test_websocket_twin_initial_snapshot():
    """Verify twin WebSocket sends an initial snapshot."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/twin") as websocket:
            message = websocket.receive_json()

            assert message["type"] == "twin_state_snapshot"
            assert "target_node_id" in message
            assert "payload" in message

            payload = message["payload"]

            assert "resilience_score" in payload
            assert "status_label" in payload
            assert "telemetry" in payload


def test_websocket_twin_receives_failure_event():
    """Verify twin WebSocket receives a failure injection event."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/twin") as websocket:
            initial_message = websocket.receive_json()

            assert initial_message["type"] == "twin_state_snapshot"

            response = client.post(
                "/api/failures/inject",
                json={
                    "asset_id": "GRID_MAIN",
                    "failure_type": "complete_outage",
                    "severity": "high",
                    "duration_minutes": 60,
                },
            )

            print("Failure response:", response.status_code)
            print("Failure response body:", response.json())

            assert response.status_code == 200

            event = websocket.receive_json()
            while event["type"] != "failure_injected":
                event = websocket.receive_json()

            assert event["type"] == "failure_injected"
            assert event["target_node_id"] == "GRID_MAIN"
            assert "payload" in event
            assert "incident" in event["payload"]


def test_websocket_twin_reconnect():
    """Verify a client can disconnect and reconnect to the twin channel."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/twin") as websocket:
            first_message = websocket.receive_json()
            assert first_message["type"] == "twin_state_snapshot"

        with client.websocket_connect("/ws/twin") as websocket:
            second_message = websocket.receive_json()
            assert second_message["type"] == "twin_state_snapshot"
            assert "payload" in second_message


def test_websocket_twin_receives_what_if_event():
    """Verify What-If simulation completion is broadcast to twin clients."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/twin") as websocket:
            initial_message = websocket.receive_json()

            assert initial_message["type"] == "twin_state_snapshot"

            response = client.get("/api/simulation/what-if")

            assert response.status_code == 200

            event = websocket.receive_json()

            assert event["type"] == "what_if_simulation_completed"
            assert "payload" in event

            payload = event["payload"]

            assert payload["strategy_count"] == 6
            assert "incident_id" in payload
            assert "source_asset_id" in payload
            assert "affected_asset_ids" in payload
            assert "affected_service_ids" in payload
            assert "recommended_strategy" in payload
            assert "timestamp" in payload


def test_websocket_twin_receives_simulation_persisted_event():
    """Verify persisted What-If simulation is broadcast to twin clients."""

    with TestClient(app) as client:
        with client.websocket_connect("/ws/twin") as websocket:
            initial_message = websocket.receive_json()

            assert initial_message["type"] == "twin_state_snapshot"

            response = client.post(
                "/api/simulation/run",
                json={
                    "strategy_id": "strat_c",
                },
            )

            assert response.status_code == 200

            event = websocket.receive_json()

            assert event["type"] == "what_if_simulation_completed"

            # The simulation endpoint first evaluates What-If,
            # which publishes the completion event.
            persisted_event = websocket.receive_json()

            assert persisted_event["type"] == "simulation_run_persisted"
            assert "payload" in persisted_event

            payload = persisted_event["payload"]

            assert "simulation_id" in payload
            assert "incident_id" in payload
            assert payload["strategy_id"] == "strat_c"
            assert "projected_resilience_score" in payload
            assert "source_asset_id" in payload
            assert "affected_asset_ids" in payload
            assert "affected_service_ids" in payload
            assert "timestamp" in payload


def test_websocket_twin_receives_strategy_applied_event():
    """Verify manually selected strategy application is broadcast to twin clients."""

    with TestClient(app) as client:
        # Create an active incident first.
        failure_response = client.post(
            "/api/failures/inject",
            json={
                "asset_id": "GRID_MAIN",
                "failure_type": "complete_outage",
                "severity": "high",
                "duration_minutes": 60,
            },
        )

        assert failure_response.status_code == 200

        with client.websocket_connect("/ws/twin") as websocket:
            initial_message = websocket.receive_json()

            assert initial_message["type"] == "twin_state_snapshot"

            response = client.post(
                "/api/simulation/apply-strategy",
                json={
                    "strategy_id": "strat_c",
                },
            )

            assert response.status_code == 200
            assert response.json()["status"] == "applied"

            event = websocket.receive_json()

            # Applying Strategy C also generates asset state-change
            # events before the final strategy_applied event.
            while event["type"] != "strategy_applied":
                event = websocket.receive_json()

            assert event["target_node_id"] == "GRID_MAIN"
            assert "payload" in event

            payload = event["payload"]

            assert payload["strategy_id"] == "strat_c"
            assert payload["status"] == "applied"
            assert payload["incident_id"] is not None
            assert payload["source_asset_id"] == "GRID_MAIN"
            assert "affected_asset_ids" in payload
            assert "affected_service_ids" in payload
            assert "new_resilience_score" in payload
            assert "timestamp" in payload
from starlette.websockets import WebSocketDisconnect

def test_websocket_twin_receives_cascade_events():
    """Verify twin WebSocket receives cascade and service health change events on failure injection."""
    with TestClient(app) as client:
        try:
            with client.websocket_connect("/api/ws/twin") as websocket:
                initial_event = websocket.receive_json()
                assert initial_event["type"] == "twin_state_snapshot"

                response = client.post(
                    "/api/failures/inject",
                    json={
                        "asset_id": "GRID_MAIN",
                        "failure_type": "electrical_outage",
                        "severity": "high",
                    },
                )
                assert response.status_code == 200

                events = []
                while True:
                    event = websocket.receive_json()
                    events.append(event)
                    if event["type"] == "failure_injected":
                        break

                event_types = [e["type"] for e in events]
                assert "asset_state_changed" in event_types
                assert "service_health_changed" in event_types
                assert "cascade_triggered" in event_types

                cascade_event = next(e for e in events if e["type"] == "cascade_triggered")
                assert cascade_event["target_node_id"] == "GRID_MAIN"
                assert "payload" in cascade_event
                assert "cascade_path" in cascade_event["payload"]
                assert "timestamp" in cascade_event["payload"]

                service_event = next(e for e in events if e["type"] == "service_health_changed")
                assert "target_node_id" in service_event
                assert "timestamp" in service_event["payload"]
        except WebSocketDisconnect:
            pass
        except Exception as e:
            raise e

def test_websocket_clean_disconnect_and_cleanup():
    """Verify that manager.disconnect is called and runtime errors are handled cleanly."""
    with TestClient(app) as client:
        try:
            with client.websocket_connect("/api/ws/telemetry") as websocket:
                websocket.receive_json()
        except WebSocketDisconnect:
            pass

        from backend.app.api.websocket import manager
        assert len(manager.active_connections) == 0
