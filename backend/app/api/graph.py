"""Graph Dependency and Causal Explanation API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from backend.app.services.hospital_service import get_state_engine, HospitalStateEngine

router = APIRouter(tags=["Knowledge Graph & Explainability"])

@router.get("/dependencies")
def get_dependency_graph(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Returns full dependency knowledge graph nodes and edges."""
    return {
        "nodes": engine.topology_builder.get_nodes_dict(),
        "edges": engine.topology_builder.get_edges_dict()
    }

@router.get("/graph/bottlenecks")
def get_bottlenecks(engine: HospitalStateEngine = Depends(get_state_engine)):
    """Returns identified single points of failure and vulnerability rankings."""
    return engine.explanation_engine.traversals.find_critical_bottlenecks()

@router.get("/explanations/{service_id}")
def get_service_explanation(
    service_id: str,
    failed_asset_id: str = "GRID_MAIN",
    engine: HospitalStateEngine = Depends(get_state_engine)
):
    """Returns causal dependency explanation for why a service is at risk."""
    if service_id not in engine.services:
        raise HTTPException(status_code=404, detail=f"Service '{service_id}' not found.")
    
    explanation = engine.explanation_engine.explain_service_risk(
        service_id=service_id,
        failed_asset_id=failed_asset_id
    )
    return explanation
