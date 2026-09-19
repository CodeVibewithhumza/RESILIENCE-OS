"""What-If Strategy definitions and comparison schemas."""
from enum import Enum
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from .resilience import ResilienceIndexBreakdown

class StrategyType(str, Enum):
    A_BASELINE_NO_ACTION = "A_baseline_no_action"
    B_PRIORITY_ICU_LOAD_SHED = "B_priority_icu_load_shed"
    C_DYNAMIC_REBALANCE_HVAC_THROTTLE = "C_dynamic_rebalance_hvac_throttle"
    D_MOBILE_GEN_DISPATCH = "D_mobile_gen_dispatch"
    E_O2_CONSERVATION = "E_o2_conservation"
    F_PARTIAL_EVACUATION = "F_partial_evacuation"

class StrategyDefinition(BaseModel):
    id: str
    type: StrategyType
    name: str
    code: str = Field(..., description="e.g. 'Strategy C'")
    description: str
    actions_summary: List[str]
    implementation_time_min: int = Field(default=2)
    operator_role_required: str = Field(default="Facility Incident Commander")

class StrategyResult(BaseModel):
    strategy_id: str
    strategy_name: str
    strategy_code: str
    
    # Outcomes
    projected_resilience_score: float = Field(..., ge=0.0, le=100.0)
    resilience_breakdown: ResilienceIndexBreakdown
    
    # Key Continuity Metrics
    icu_continuity_pct: float = Field(..., ge=0.0, le=100.0)
    emergency_continuity_pct: float = Field(..., ge=0.0, le=100.0)
    operating_theatre_continuity_pct: float = Field(..., ge=0.0, le=100.0)
    general_ward_continuity_pct: float = Field(..., ge=0.0, le=100.0)
    
    # Resource & Operational Margins
    backup_runtime_remaining_hours: float
    non_critical_load_shed_kw: float
    estimated_recovery_time_min: float
    
    # Trade-offs & Evaluation
    pros: List[str]
    cons: List[str]
    risk_level: str = Field(default="Low") # Low, Medium, High, Extreme
    recommendation_rank: int = Field(default=1) # 1 = Top recommended
    is_recommended: bool = Field(default=False)

class WhatIfComparison(BaseModel):
    incident_id: str
    incident_source: str
    timestamp_evaluated: str
    unmitigated_baseline_score: float
    strategies: List[StrategyResult]
    recommended_strategy_id: str
    causal_explanation: str
