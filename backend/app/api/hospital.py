"""Hospital Core Endpoints: State, Assets, Services, Telemetry, and Reset."""

from typing import Dict, Any, List

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.hospital_service import (
    get_state_engine,
    HospitalStateEngine,
)
from backend.app.services.telemetry_persistence import (
    persist_snapshot,
    get_recent_records,
)
from database.session import get_db

from models.api_responses import (
    ResetHospitalResponse,
    HospitalStateResponse,
    TelemetryPersistenceResponse,
    TelemetryHistoryResponse,
    TelemetryRecordResponse,
)
from models.infrastructure import InfrastructureAsset
from models.service import HospitalService
from models.telemetry import HospitalTelemetrySnapshot


router = APIRouter(tags=["Hospital State"])


@router.get(
    "/hospital/state",
    response_model=HospitalStateResponse,
)
def get_hospital_state(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns complete state snapshot of the hospital digital twin."""

    resilience = engine.get_resilience_breakdown()
    telemetry = engine.get_telemetry_snapshot()

    return {
        "timestamp": telemetry.timestamp.isoformat(),
        "resilience_index": resilience.model_dump(),
        "is_incident_active": engine.active_incident is not None,
        "active_incident": (
            engine.active_incident.model_dump()
            if engine.active_incident
            else None
        ),
        "assets_summary": {
            "total": len(engine.assets),
            "normal": sum(
                1 for a in engine.assets.values()
                if a.status.value == "normal"
            ),
            "degraded": sum(
                1 for a in engine.assets.values()
                if a.status.value == "degraded"
            ),
            "failed": sum(
                1 for a in engine.assets.values()
                if a.status.value == "failed"
            ),
        },
        "services_summary": {
            "total": len(engine.services),
            "full_operation": sum(
                1 for s in engine.services.values()
                if s.status.value == "full_operation"
            ),
            "compromised": sum(
                1 for s in engine.services.values()
                if s.status.value in ("compromised", "reduced_capacity")
            ),
        },
        "telemetry": telemetry.model_dump(),
    }


@router.get(
    "/assets",
    response_model=List[InfrastructureAsset],
)
def list_assets(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns all modeled infrastructure assets with real-time status."""

    return [a.model_dump() for a in engine.assets.values()]


@router.get(
    "/services",
    response_model=List[HospitalService],
)
def list_services(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns all hospital services with criticality and delivery percentages."""

    return [s.model_dump() for s in engine.services.values()]


@router.get(
    "/telemetry",
    response_model=HospitalTelemetrySnapshot,
)
def get_telemetry(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns current live telemetry snapshot."""

    return engine.get_telemetry_snapshot()


@router.post(
    "/telemetry/persist",
    response_model=TelemetryPersistenceResponse,
)
async def persist_current_telemetry(
    engine: HospitalStateEngine = Depends(get_state_engine),
    session: AsyncSession = Depends(get_db),
):
    """Persist the current live telemetry snapshot in PostgreSQL."""

    snapshot = engine.get_telemetry_snapshot()
    inserted_count = await persist_snapshot(session, snapshot)

    return {
        "status": "success",
        "message": "Current telemetry snapshot persisted.",
        "inserted_records": inserted_count,
        "timestamp": snapshot.timestamp,
    }


@router.get(
    "/telemetry/history",
    response_model=TelemetryHistoryResponse,
)
async def telemetry_history(
    limit: int = Query(default=100, ge=1, le=1000),
    session: AsyncSession = Depends(get_db),
):
    """Retrieve recent persisted telemetry records."""

    records = await get_recent_records(session, limit=limit)

    return {
        "count": len(records),
        "records": [
            {
                "id": record.id,
                "timestamp": record.timestamp,
                "asset_id": record.asset_id,
                "metric": record.metric,
                "value": record.value,
                "unit": record.unit,
                "is_anomaly": record.is_anomaly,
                "threshold_min": record.threshold_min,
                "threshold_max": record.threshold_max,
            }
            for record in records
        ],
    }


@router.post(
    "/hospital/reset",
    response_model=ResetHospitalResponse,
)
def reset_hospital(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Resets digital twin back to baseline normal operation."""

    engine.reset_to_baseline()

    return {
        "status": "success",
        "message": "Hospital digital twin reset to 100% normal baseline.",
        "resilience_index": engine.get_resilience_breakdown().overall_score,
    }
