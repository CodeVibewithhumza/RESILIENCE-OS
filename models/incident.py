"""Incident and Failure Injection data models."""
from enum import Enum
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class IncidentSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CATASTROPHIC = "catastrophic"

class FailureInjectionRequest(BaseModel):
    asset_id: str = Field(..., description="Target asset ID to inject failure into, e.g. GRID-MAIN or TRANSFORMER-01")
    failure_type: str = Field(default="complete_outage", description="e.g. complete_outage, overload_trip, fuel_line_block, pipe_rupture")
    severity: IncidentSeverity = Field(default=IncidentSeverity.HIGH)
    duration_minutes: int = Field(default=60)
    
    # Compound Scenario Modifiers
    compound_heatwave: bool = Field(default=False, description="Simulates elevated HVAC load and higher transformer heat")
    generator_delay_seconds: int = Field(default=15, description="Delay before automatic transfer switch starts backup generator")
    ambient_temp_c: float = Field(default=35.0)

class TimelineEvent(BaseModel):
    t_offset_min: int = Field(..., description="Minutes from incident start (0, 5, 10, 20, etc.)")
    title: str
    description: str
    affected_node_ids: List[str] = Field(default_factory=list)
    system_resilience_score: float = Field(..., ge=0.0, le=100.0)
    service_impact_summary: str

class IncidentState(BaseModel):
    incident_id: str
    is_active: bool = Field(default=False)
    source_asset_id: Optional[str] = None
    severity: IncidentSeverity = Field(default=IncidentSeverity.HIGH)
    started_at: Optional[datetime] = None
    current_time_offset_min: int = Field(default=0)
    
    # Cascade propagation
    affected_asset_ids: List[str] = Field(default_factory=list)
    affected_service_ids: List[str] = Field(default_factory=list)
    cascade_path: List[Dict[str, Any]] = Field(default_factory=list)
    
    # Timeline
    timeline: List[TimelineEvent] = Field(default_factory=list)
    estimated_unmitigated_blackout_min: Optional[float] = Field(default=18.0)
    active_mitigation_strategy: Optional[str] = None
