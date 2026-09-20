"""Simulation and Failure Injection API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from models.incident import FailureInjectionRequest
from models.api_responses import FailureInjectionResponse
from backend.app.services.hospital_service import get_state_engine, HospitalStateEngine
from models.strategy import (
    ApplyStrategyRequest,
    ApplyStrategyResponse,
    WhatIfComparison,
)


router = APIRouter(tags=["Simulation & What-If"])

@router.post(
    "/failures/inject",
    response_model=FailureInjectionResponse,
)
def inject_failure(
    request: FailureInjectionRequest,
    engine: HospitalStateEngine = Depends(get_state_engine)
) -> Dict[str, Any]:
    """Triggers failure injection into an asset and executes cascade propagation."""
    if request.asset_id not in engine.assets:
        raise HTTPException(status_code=404, detail=f"Asset '{request.asset_id}' not found in hospital topology.")
    
    incident = engine.inject_failure(request)
    resilience = engine.get_resilience_breakdown()

    return {
        "status": "failure_injected",
        "incident": incident.model_dump(),
        "resilience_index": resilience.model_dump(),
        "message": f"Failure successfully injected on {request.asset_id}. Downstream cascade computed."
    }

@router.get(
    "/simulation/what-if",
    response_model=WhatIfComparison,
)
def run_what_if_analysis(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Runs What-If strategy evaluation comparing Strategies A through F against active incident."""
    comparison = engine.get_what_if_comparison()
    return comparison.model_dump()

@router.post(
    "/simulation/apply-strategy",
    response_model=ApplyStrategyResponse
)
def apply_strategy(
    request: ApplyStrategyRequest,
    engine: HospitalStateEngine = Depends(get_state_engine)
):
    """Applies selected response strategy to simulate mitigation and recovery."""
    result = engine.apply_strategy(request.strategy_id)
    return result
