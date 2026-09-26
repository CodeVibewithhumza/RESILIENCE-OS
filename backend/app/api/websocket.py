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



async def _telemetry_broadcaster():
    """Single application-level background task to broadcast telemetry to all clients."""
    engine = get_state_engine()
    last_state_version = -1
    cached_resilience = None
    while True:
        try:
            # Only perform duplicate CPU work if there are actual subscribers!
            if len(event_bus._subscribers.get("telemetry", set())) > 0:
                current_version = getattr(engine, "state_version", 0)
                if current_version > last_state_version or cached_resilience is None:
                    cached_resilience = engine.get_resilience_breakdown()
                    last_state_version = current_version

                telemetry = engine.get_telemetry_snapshot()
                resilience = cached_resilience
                sub_scores_dump = (
                    resilience.sub_scores.model_dump(mode="json")
                    if hasattr(resilience.sub_scores, "model_dump")
                    else {}
                )

                payload = {
                    "type": "telemetry_tick",
                    "target_node_id": None,
                    "payload": {
                        "telemetry": telemetry.model_dump(mode="json"),
                        "resilience_score": resilience.overall_score,
                        "status_label": resilience.status_label,
                        "delta_from_baseline": getattr(resilience, "delta_from_baseline", 0.0),
                        "sub_scores": sub_scores_dump,
                    },
                    "telemetry": telemetry.model_dump(mode="json"),
                    "resilience_score": resilience.overall_score,
                    "status_label": resilience.status_label,
                    "delta_from_baseline": getattr(resilience, "delta_from_baseline", 0.0),
                    "sub_scores": sub_scores_dump,
                }
                await event_bus.publish("telemetry", payload)
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.exception("Telemetry broadcaster error")

        await asyncio.sleep(1.0)

async def stream_telemetry(websocket: WebSocket):
    """Stream telemetry snapshots every second."""
    queue = event_bus.subscribe("telemetry")
    try:
        while True:
            event = await queue.get()
            await manager.send_message(websocket, event)
    except WebSocketDisconnect as e:
        logger.info("Telemetry WebSocket client disconnected | code=%s", e.code)
    except asyncio.CancelledError:
        logger.info("Telemetry WebSocket task cancelled")
        raise
    except RuntimeError as e:
        if "Unexpected ASGI message" in str(e) or "Cannot call" in str(e):
            logger.info("Telemetry WebSocket client disconnected abruptly (RuntimeError)")
        else:
            logger.exception("Telemetry WebSocket error")
            raise
    except Exception:
        logger.exception("Telemetry WebSocket error")
    finally:
        event_bus.unsubscribe("telemetry", queue)
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
        sub_scores_dump = (
            resilience.sub_scores.model_dump(mode="json")
            if hasattr(resilience.sub_scores, "model_dump")
            else {}
        )

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
                    "delta_from_baseline": getattr(resilience, "delta_from_baseline", 0.0),
                    "sub_scores": sub_scores_dump,
                },
            },
        )

        # Wait for state-change events published by the backend.
        while True:
            event = await queue.get()
            await manager.send_message(websocket, event)
    except WebSocketDisconnect as e:
        logger.info("Twin WebSocket client disconnected | code=%s", e.code)

    except asyncio.CancelledError:
        logger.info("Twin WebSocket task cancelled")
        raise

    except RuntimeError as e:
        if "Unexpected ASGI message" in str(e) or "Cannot call" in str(e):
            logger.info("Twin WebSocket client disconnected abruptly (RuntimeError)")
        else:
            logger.exception("Twin WebSocket error")
            raise

    except Exception:
        logger.exception("Twin WebSocket error")


    finally:
        event_bus.unsubscribe("twin", queue)
        manager.disconnect(websocket)
