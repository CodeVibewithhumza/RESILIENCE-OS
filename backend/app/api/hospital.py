"""Hospital Core Endpoints: State, Assets, Services, Telemetry, and Reset."""
from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from models.api_responses import ResetHospitalResponse
from backend.app.services.hospital_service import get_state_engine, HospitalStateEngine

router = APIRouter(tags=["Hospital State"])

@router.get("/hospital/state")
def get_hospital_state(engine: HospitalStateEngine = Depends(get_state_engine)) -> Dict[str, Any]:
    """Returns complete state snapshot of the hospital digital twin."""
    resilience = engine.get_resilience_breakdown()
    telemetry = engine.get_telemetry_snapshot()
    
    return {
        "timestamp": telemetry.timestamp.isoformat(),
        "resilience_index": resilience.model_dump(),
        "is_incident_active": (engine.active_incident is not None),
        "active_incident": engine.active_incident.model_dump() if engine.active_incident else None,
        "assets_summary": {
            "total": len(engine.assets),
            "normal": sum(1 for a in engine.assets.values() if a.status.value == "normal"),
            "degraded": sum(1 for a in engine.assets.values() if a.status.value == "degraded"),
            "failed": sum(1 for a in engine.assets.values() if a.status.value == "failed"),
        },
        "services_summary": {
            "total": len(engine.services),
            "full_operation": sum(1 for s in engine.services.values() if s.status.value == "full_operation"),
            "compromised": sum(1 for s in engine.services.values() if s.status.value in ("compromised", "reduced_capacity")),
        },
        "telemetry": telemetry.model_dump()
    }

@router.get("/assets")
def list_assets(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Returns all modeled infrastructure assets with real-time status."""
    return [a.model_dump() for a in engine.assets.values()]

@router.get("/services")
def list_services(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Returns all hospital services with criticality and delivery percentages."""
    return [s.model_dump() for s in engine.services.values()]

@router.get("/telemetry")
def get_telemetry(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Returns current live telemetry snapshot."""
    return engine.get_telemetry_snapshot().model_dump()

@router.post(
    "/hospital/reset",
    response_model=ResetHospitalResponse,
)
def reset_hospital(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Resets digital twin back to baseline normal operation."""
    engine.reset_to_baseline()
    return {
        "status": "success",
        "message": "Hospital digital twin reset to 100% normal baseline.",
        "resilience_index": engine.get_resilience_breakdown().overall_score
    }
