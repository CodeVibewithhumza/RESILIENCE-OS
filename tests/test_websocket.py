import json

from fastapi.testclient import TestClient

from backend.app.main import app


def test_websocket():
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
