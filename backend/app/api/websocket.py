"""WebSocket streaming endpoints for real-time telemetry and 3D twin synchronization."""
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
from backend.app.services.hospital_service import get_state_engine

router = APIRouter(tags=["WebSockets"])

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                pass

manager = ConnectionManager()

@router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    engine = get_state_engine()
    try:
        while True:
            # Stream live telemetry every 1 second
            telemetry = engine.get_telemetry_snapshot()
            resilience = engine.get_resilience_breakdown()
            
            await websocket.send_json({
                "type": "telemetry_tick",
                "telemetry": telemetry.model_dump(),
                "resilience_score": resilience.overall_score,
                "status_label": resilience.status_label
            })
            await asyncio.sleep(1.0)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
