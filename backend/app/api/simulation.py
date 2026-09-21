"""Simulation and Failure Injection API endpoints."""

from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.hospital_service import (
    HospitalStateEngine,
    get_state_engine,
)
from database.session import get_db
from backend.app.services.simulation_persistence import (
    get_simulation_run,
    persist_simulation_run,
)
from models.api_responses import (
    FailureInjectionResponse,
    SimulationRunResponse,
)
from models.incident import FailureInjectionRequest
from models.strategy import (
    ApplyStrategyRequest,
    ApplyStrategyResponse,
    SimulationRunRequest,
    WhatIfComparison,
)


router = APIRouter(tags=["Simulation & What-If"])


@router.post(
    "/failures/inject",
    response_model=FailureInjectionResponse,
)
def inject_failure(
    request: FailureInjectionRequest,
    engine: HospitalStateEngine = Depends(get_state_engine),
) -> Dict[str, Any]:
    """Triggers failure injection into an asset and executes cascade propagation."""

    if request.asset_id not in engine.assets:
        raise HTTPException(
            status_code=404,
            detail=f"Asset '{request.asset_id}' not found in hospital topology.",
        )

    incident = engine.inject_failure(request)
    resilience = engine.get_resilience_breakdown()

    return {
        "status": "failure_injected",
        "incident": incident.model_dump(),
        "resilience_index": resilience.model_dump(),
        "message": (
            f"Failure successfully injected on {request.asset_id}. "
            "Downstream cascade computed."
        ),
    }


@router.get(
    "/simulation/what-if",
    response_model=WhatIfComparison,
)
def run_what_if_analysis(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Runs What-If strategy evaluation."""

    comparison = engine.get_what_if_comparison()
    return comparison.model_dump()


@router.post(
    "/simulation/run",
    response_model=SimulationRunResponse,
)
async def run_simulation(
    request: SimulationRunRequest,
    engine: HospitalStateEngine = Depends(get_state_engine),
    session: AsyncSession = Depends(get_db),
):
    """Evaluates and persists one selected simulation strategy."""

    comparison = engine.get_what_if_comparison()

    selected_strategy = next(
        (
            strategy
            for strategy in comparison.strategies
            if strategy.strategy_id == request.strategy_id
        ),
        None,
    )

    if selected_strategy is None:
        raise HTTPException(
            status_code=404,
            detail=f"Strategy '{request.strategy_id}' not found.",
        )

    incident_id = comparison.incident_id

    saved_run = await persist_simulation_run(
        session,
        incident_id=incident_id,
        strategy_id=selected_strategy.strategy_id,
        projected_resilience_score=(
            selected_strategy.projected_resilience_score
        ),
        result_data=selected_strategy.model_dump(mode="json"),
    )

    return saved_run


@router.get(
    "/simulation/{simulation_id}",
    response_model=SimulationRunResponse,
)
async def retrieve_simulation_run(
    simulation_id: int,
    session: AsyncSession = Depends(get_db),
):
    """Retrieves one persisted simulation run."""

    saved_run = await get_simulation_run(session, simulation_id)

    if saved_run is None:
        raise HTTPException(
            status_code=404,
            detail=f"Simulation run '{simulation_id}' not found.",
        )

    return saved_run


@router.post(
    "/simulation/apply-strategy",
    response_model=ApplyStrategyResponse,
)
def apply_strategy(
    request: ApplyStrategyRequest,
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Applies selected response strategy."""

    result = engine.apply_strategy(request.strategy_id)
    return result
