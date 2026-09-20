import asyncio
import json
import pytest
import websockets


@pytest.mark.asyncio
async def test_websocket():
    uri = "ws://127.0.0.1:8000/ws/telemetry"

    async with websockets.connect(uri) as websocket:
        message = await websocket.recv()
        data = json.loads(message)

        print("WebSocket connected successfully!")
        print("Message type:", data.get("type"))
        print("Resilience score:", data.get("resilience_score"))


asyncio.run(test_websocket())
