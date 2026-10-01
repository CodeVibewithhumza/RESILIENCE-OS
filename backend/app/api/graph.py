"""Graph Dependency and Causal Explanation API endpoints."""

from typing import List

from fastapi import APIRouter, Depends, HTTPException

from backend.app.services.hospital_service import (
    HospitalStateEngine,
    get_state_engine,
)
from models.api_responses import (
    BottleneckResponse,
    CausalExplanationResponse,
    DependencyGraphResponse,
)

router = APIRouter(tags=["Knowledge Graph & Explainability"])


@router.get(
    "/dependencies",
    response_model=DependencyGraphResponse,
)
def get_dependency_graph(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns full dependency knowledge graph nodes and edges."""
    return {
        "nodes": engine.topology_builder.get_nodes_dict(),
        "edges": engine.topology_builder.get_edges_dict(),
    }


@router.get(
    "/topology",
    response_model=DependencyGraphResponse,
    include_in_schema=True,
)
def get_topology_alias(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Alias for /dependencies matching system architecture documentation."""
    return get_dependency_graph(engine)


@router.get(
    "/graph/bottlenecks",
    response_model=List[BottleneckResponse],
)
def get_bottlenecks(
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns identified single points of failure and vulnerability rankings."""
    return engine.explanation_engine.traversals.find_critical_bottlenecks()


@router.get(
    "/explanations/{id}",
    response_model=CausalExplanationResponse,
)
def get_service_explanation(
    id: str,
    failed_asset_id: str = "GRID_MAIN",
    engine: HospitalStateEngine = Depends(get_state_engine),
):
    """Returns causal dependency explanation for why a service is at risk."""
    resolved_id = None
    if id in engine.services:
        resolved_id = id
    else:
        # Check case-insensitive and SERVICE_ prefixes
        id_upper = id.upper()
        candidates = [id_upper, f"SERVICE_{id_upper}"]
        for cand in candidates:
            if cand in engine.services:
                resolved_id = cand
                break

    if not resolved_id:
        # If passed an integer or simulation ID, default to first critical service or ICU
        if id.isdigit() or id in ("1", "default"):
            resolved_id = "SERVICE_ICU" if "SERVICE_ICU" in engine.services else list(engine.services.keys())[0]
        else:
            raise HTTPException(
                status_code=404,
                detail=f"Service '{id}' not found. Available services: {list(engine.services.keys())}",
            )

    explanation = engine.explanation_engine.explain_service_risk(
        service_id=resolved_id,
        failed_asset_id=failed_asset_id,
    )

    return explanation
