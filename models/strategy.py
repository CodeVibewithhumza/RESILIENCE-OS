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

    # Comparative Trade-off Metrics (Member 4 - Evaluation Engine)
    clinical_safety_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Clinical safety preservation index (0-100)")
    infrastructure_stability_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Physical asset operational integrity (0-100)")
    resource_efficiency_score: Optional[float] = Field(default=None, ge=0.0, le=100.0, description="Conservation factor of critical reserves (0-100)")
    implementation_latency_min: Optional[float] = Field(default=None, ge=0.0, description="Time lag required to execute intervention (minutes)")
    delta_resilience: Optional[float] = Field(default=None, description="Score delta relative to unmitigated Strategy A")
    delta_icu: Optional[float] = Field(default=None, description="ICU continuity delta relative to Strategy A (%)")
    delta_runtime_hours: Optional[float] = Field(default=None, description="Runtime gain in hours relative to Strategy A")
    pareto_optimal: Optional[bool] = Field(default=None, description="Whether this strategy is on the Pareto frontier")
    topsis_score: Optional[float] = Field(default=None, ge=0.0, le=1.0, description="TOPSIS relative closeness to ideal solution (0.0 - 1.0)")
    pareto_rank: Optional[int] = Field(default=None, ge=1, description="Pareto non-domination rank (1 = first frontier)")
    dominated_by: Optional[List[str]] = Field(default=None, description="IDs of strategies that strictly dominate this strategy")
    dominates: Optional[List[str]] = Field(default=None, description="IDs of strategies strictly dominated by this strategy")

class MCDAProfile(str, Enum):
    BALANCED = "balanced"
    LIFE_SAFETY = "life_safety"
    RESOURCE_CONSERVATION = "resource_conservation"
    RAPID_STABILIZATION = "rapid_stabilization"

class PairwiseComparison(BaseModel):
    strategy_a_id: str
    strategy_b_id: str
    delta_resilience: float = Field(..., description="Resilience score diff (A - B)")
    delta_icu_pct: float = Field(..., description="ICU continuity diff (A - B)")
    delta_runtime_hours: float = Field(..., description="Runtime diff in hours (A - B)")
    delta_recovery_min: float = Field(..., description="Recovery horizon diff (A - B)")
    delta_load_shed_kw: float = Field(..., description="Load shed diff in kW (A - B)")
    advantage_summary: str = Field(..., description="Traceable summary of key trade-offs")
    winner_id: str = Field(..., description="Preferred strategy ID between the two")

class MultiObjectiveRankingResult(BaseModel):
    strategy_id: str
    strategy_name: str
    strategy_code: str
    pareto_rank: int = Field(default=1, ge=1)
    is_pareto_optimal: bool = Field(default=False)
    topsis_score: float = Field(..., ge=0.0, le=1.0)
    topsis_rank: int = Field(..., ge=1)
    weighted_utility_score: float = Field(..., ge=0.0, le=100.0)
    profile_scores: Dict[str, float] = Field(default_factory=dict)
    final_rank: int = Field(..., ge=1)
    trade_off_headline: str = Field(default="")

class StrategyComparisonMatrix(BaseModel):
    incident_id: str
    evaluated_at: str
    active_profile: MCDAProfile = Field(default=MCDAProfile.BALANCED)
    ranking_results: List[MultiObjectiveRankingResult] = Field(default_factory=list)
    pareto_frontier_ids: List[str] = Field(default_factory=list)
    pairwise_comparisons: List[PairwiseComparison] = Field(default_factory=list)
    top_recommended_strategy_id: str
    recommendation_rationale: str
    profile_sensitivity: Dict[str, str] = Field(
        default_factory=dict,
        description="Winning strategy mapped under each MCDA profile"
    )

class WhatIfComparison(BaseModel):
    incident_id: str
    incident_source: str
    timestamp_evaluated: str
    unmitigated_baseline_score: float
    strategies: List[StrategyResult]
    recommended_strategy_id: str
    causal_explanation: str

    # Comparative Evaluation Metadata (Member 4 - Evaluation Engine)
    incident_type: Optional[str] = Field(default=None, description="Classified incident type (e.g. electrical_outage, hvac_failure, o2_depletion)")
    decision_summary: Optional[Dict[str, Any]] = Field(default=None, description="Multi-attribute decision analysis and Pareto ranking summary")
    ranking_criteria: Optional[Dict[str, float]] = Field(default=None, description="Weighting criteria used for strategy ranking")
    comparison_matrix: Optional[StrategyComparisonMatrix] = Field(default=None, description="Full MCDA ranking and pairwise comparison matrix")

class ApplyStrategyRequest(BaseModel):
    strategy_id: str = Field(
        ...,
        min_length=1,
        description="Identifier of the strategy to apply, e.g. strat_c"
    )

class ApplyStrategyResponse(BaseModel):
    status: str
    strategy: Optional[str] = None
    message: str
    new_resilience_score: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=100.0
    )

class SimulationRunRequest(BaseModel):
    """Request to persist a selected What-If simulation result."""

    strategy_id: str = Field(
        ...,
        min_length=1,
        description="Strategy identifier, e.g. strat_c",
    )
