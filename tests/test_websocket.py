
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