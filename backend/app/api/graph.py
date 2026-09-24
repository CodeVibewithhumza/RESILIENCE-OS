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

    if id not in engine.services:
        raise HTTPException(
            status_code=404,
            detail=f"Service '{id}' not found.",
        )

    explanation = engine.explanation_engine.explain_service_risk(
        service_id=id,
        failed_asset_id=failed_asset_id,
    )

    return explanation
