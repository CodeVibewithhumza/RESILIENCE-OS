"""API response models for ResilienceOS."""

from datetime import datetime
from typing import Dict, List, Optional

from models.infrastructure import InfrastructureAsset
from models.service import HospitalService
from models.telemetry import HospitalTelemetrySnapshot

from pydantic import BaseModel, Field

from graph.schema import GraphEdge, GraphNode
from models.incident import IncidentState
from models.resilience import ResilienceIndexBreakdown

class ResetHospitalResponse(BaseModel):
    status: str
    message: str
    resilience_index: float = Field(..., ge=0.0, le=100.0)


class FailureInjectionResponse(BaseModel):
    status: str
    incident: IncidentState
    resilience_index: ResilienceIndexBreakdown
    message: str


class DependencyGraphResponse(BaseModel):
    """Dependency graph nodes and relationships."""

    nodes: List[GraphNode]
    edges: List[GraphEdge]


class BottleneckResponse(BaseModel):
    """Critical infrastructure bottleneck analysis."""

    node_id: str
    label: str
    impacted_critical_services_count: int = Field(..., ge=0)
    total_critical_services: int = Field(..., ge=0)
    vulnerability_score: float = Field(..., ge=0.0, le=100.0)


class CausalExplanationResponse(BaseModel):
    """Causal explanation for a service risk."""

    service_id: str
    service_name: str
    failed_asset_id: str
    failed_asset_name: str
    dependency_path: List[str]
    causal_steps: List[str]
    summary: str


class TelemetryPersistenceResponse(BaseModel):
    status: str
    message: str
    inserted_records: int = Field(..., ge=0)
    timestamp: datetime


class TelemetryRecordResponse(BaseModel):
    id: int = Field(..., ge=1)
    timestamp: datetime
    asset_id: str
    metric: str
    value: float
    unit: str
    is_anomaly: bool
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None


class TelemetryHistoryResponse(BaseModel):
    count: int = Field(..., ge=0)
    records: List[TelemetryRecordResponse]


class HospitalStateResponse(BaseModel):
    """Complete hospital digital twin state snapshot."""

    timestamp: datetime
    resilience_index: ResilienceIndexBreakdown
    is_incident_active: bool
    active_incident: Optional[IncidentState] = None
    assets_summary: Dict[str, int]
    services_summary: Dict[str, int]
    telemetry: HospitalTelemetrySnapshot


class AssetListResponse(BaseModel):
    """Infrastructure asset collection response."""

    assets: List[InfrastructureAsset]


class ServiceListResponse(BaseModel):
    """Hospital service collection response."""

    services: List[HospitalService]


class SimulationRunResponse(BaseModel):
    """Persisted simulation run response."""

    id: int
    incident_id: str
    strategy_id: str
    executed_at: datetime
    projected_resilience_score: Optional[float] = None
    result_data: Dict
    status: str

    model_config = {"from_attributes": True}
