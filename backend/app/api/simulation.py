
"""Simulation and Failure Injection API endpoints."""

from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.event_bus import event_bus
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
from models.risk import (
    AssetRiskAssessment,
    ServiceRiskAssessment,
    IncidentRiskSummary,
)
from models.resilience import ResilienceIndexBreakdown



router = APIRouter(tags=["Simulation & What-If"])


@router.post(
    "/failures/inject",
    response_model=FailureInjectionResponse,
)
async def inject_failure(
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

    await event_bus.publish(
        "twin",
        {
            "type": "failure_injected",
            "target_node_id": request.asset_id,
            "payload": {
                "incident": incident.model_dump(mode="json"),
                "resilience_index": resilience.model_dump(mode="json"),
                "source_asset_id": request.asset_id,
                "affected_asset_ids": incident.affected_asset_ids,
                "affected_service_ids": incident.affected_service_ids,
            },
        },
    )

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
    "/simulation/report",
)
def get_simulation_report(
    format: str = "markdown",
    scenario_title: Optional[str] = None,
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Generates and returns comprehensive incident audit and What-If comparison report in Markdown or JSON."""
    report = engine.generate_simulation_report(format=format, scenario_title=scenario_title)
    if format.lower() == "markdown":
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=report, media_type="text/markdown")
    return report


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
async def apply_strategy(
    request: ApplyStrategyRequest,
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Applies selected response strategy and publishes a twin event."""

    result = engine.apply_strategy(request.strategy_id)

    # Publish event only when the strategy is successfully applied.
    if result.get("status") == "applied":
        await event_bus.publish(
            "twin",
            {
                "type": "strategy_applied",
                "target_node_id": None,
                "payload": {
                    "strategy_id": request.strategy_id,
                    "strategy": result.get("strategy"),
                    "message": result.get("message"),
                    "new_resilience_score": result.get(
                        "new_resilience_score"
                    ),
                    "status": result.get("status"),
                },
            },
        )

    return result


@router.get(
    "/risk/summary",
    response_model=IncidentRiskSummary,
)
def get_risk_summary(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns campus-wide risk summary, threshold violations, and service vulnerabilities."""

    return engine.get_incident_risk()


@router.get(
    "/risk/assets/{asset_id}",
    response_model=AssetRiskAssessment,
)
def get_asset_risk(
    asset_id: str,
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns risk assessment for an individual asset."""

    assessment = engine.get_asset_risk(asset_id)

    if assessment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Asset '{asset_id}' not found in hospital topology.",
        )

    return assessment


@router.get(
    "/risk/services/{service_id}",
    response_model=ServiceRiskAssessment,
)
def get_service_risk(
    service_id: str,
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns risk assessment for an individual healthcare service."""

    assessment = engine.get_service_risk(service_id)

    if assessment is None:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{service_id}' not found in hospital catalog.",
        )

    return assessment


@router.get(
    "/resilience/breakdown",
    response_model=ResilienceIndexBreakdown,
)
def get_resilience_breakdown(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns canonical composite Resilience Index breakdown and normalized subcomponents."""
    return engine.get_resilience_breakdown()


@router.get(
    "/scenarios",
)
def list_available_scenarios():
    """Lists all available disaster and stress scenarios in the catalog."""
    import json
    from pathlib import Path
    scenarios_dir = Path(__file__).resolve().parent.parent.parent.parent / "scenarios"
    scenarios = []
    if scenarios_dir.exists():
        for file in sorted(scenarios_dir.glob("*.json")):
            try:
                with open(file, "r", encoding="utf-8") as f:
                    scenarios.append(json.load(f))
            except Exception:
                continue
    return {"total": len(scenarios), "scenarios": scenarios}