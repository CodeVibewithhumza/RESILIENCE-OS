"""WebSocket streaming endpoints for real-time telemetry and twin synchronization."""

import asyncio
import logging
from typing import List

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from backend.app.services.event_bus import event_bus
from backend.app.services.hospital_service import get_state_engine


logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSockets"])


class ConnectionManager:
    """Manage active WebSocket connections."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

        logger.info(
            "WebSocket connected | active_connections=%d",
            len(self.active_connections),
        )

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

        logger.info(
            "WebSocket disconnected | active_connections=%d",
            len(self.active_connections),
        )

    async def send_message(self, websocket: WebSocket, message: dict):
        """Send a message to one client."""
        await websocket.send_json(message)


manager = ConnectionManager()


async def stream_telemetry(websocket: WebSocket):
    """Stream telemetry snapshots every second."""

    engine = get_state_engine()

    try:
        while True:
            telemetry = engine.get_telemetry_snapshot()
            resilience = engine.get_resilience_breakdown()

            await manager.send_message(
                websocket,
                {
                    "type": "telemetry_tick",
                    "target_node_id": None,
                    "payload": {
                        "telemetry": telemetry.model_dump(mode="json"),
                        "resilience_score": resilience.overall_score,
                        "status_label": resilience.status_label,
                    },
                    # Legacy fields preserved for existing clients/tests.
                    "telemetry": telemetry.model_dump(mode="json"),
                    "resilience_score": resilience.overall_score,
                    "status_label": resilience.status_label,
                },
            )

            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        logger.info("Telemetry WebSocket client disconnected")

    except Exception:
        logger.exception("Telemetry WebSocket error")

    finally:
        manager.disconnect(websocket)


@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Provide periodic telemetry updates."""

    await manager.connect(websocket)
    await stream_telemetry(websocket)


@router.websocket("/ws/twin")
async def websocket_twin_endpoint(websocket: WebSocket):
    """Provide initial twin snapshot and receive real-time twin events."""

    await manager.connect(websocket)

    engine = get_state_engine()
    queue = event_bus.subscribe("twin")

    try:
        resilience = engine.get_resilience_breakdown()

        # Send initial state snapshot.
        await manager.send_message(
            websocket,
            {
                "type": "twin_state_snapshot",
                "target_node_id": None,
                "payload": {
                    "telemetry": engine.get_telemetry_snapshot().model_dump(
                        mode="json"
                    ),
                    "resilience_score": resilience.overall_score,
                    "status_label": resilience.status_label,
                },
            },
        )

        # Wait for state-change events published by the backend.
        while True:
            event = await queue.get()
            await manager.send_message(websocket, event)

    except WebSocketDisconnect:
        logger.info("Twin WebSocket client disconnected")

    except asyncio.CancelledError:
        logger.info("Twin WebSocket task cancelled")
        raise

    except Exception:
        logger.exception("Twin WebSocket error")

    finally:
        event_bus.unsubscribe("twin", queue)
        manager.disconnect(websocket)