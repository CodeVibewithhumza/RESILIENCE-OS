"""Resilience Index breakdown models and scoring weights."""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

class SubScores(BaseModel):
    # Critical Service Continuity (Sc): 0 - 100 (Weighted heavily on ICU, OT, ER delivery)
    service_continuity: float = Field(..., ge=0.0, le=100.0, description="Critical service delivery index Sc")
    
    # Infrastructure Redundancy / Backup Margin (Rb): 0 - 100 (Battery, fuel, secondary bus headroom)
    backup_margin: float = Field(..., ge=0.0, le=100.0, description="Available backup energy and fuel margin Rb")
    
    # Anomaly / Cascade Penalty (Ap): 0 - 100 (100 = 0 penalty, 0 = severe cascading failure across nodes)
    stability_factor: float = Field(..., ge=0.0, le=100.0, description="Grid & asset stability score (100 - Anomaly Penalty)")
    
    # Recovery Readiness & Latency Factor (Lr): 0 - 100 (Time-to-switchover, crew dispatch, spare capacity)
    recovery_readiness: float = Field(..., ge=0.0, le=100.0, description="Recovery readiness and switchover speed Lr")

class ResilienceIndexBreakdown(BaseModel):
    overall_score: float = Field(..., ge=0.0, le=100.0, description="Composite Resilience Index (0-100)")
    status_label: str = Field(..., description="OPTIMAL (85-100), STABLE (70-84), DEGRADED (50-69), CRITICAL (<50)")
    status_color: str = Field(default="#10B981", description="Hex color code for UI")
    
    sub_scores: SubScores
    
    # Transparent Weights Used (Configurable)
    weights: Dict[str, float] = Field(
        default_factory=lambda: {
            "service_continuity": 0.40,
            "backup_margin": 0.25,
            "stability_factor": 0.20,
            "recovery_readiness": 0.15,
        }
    )
    
    delta_from_baseline: float = Field(default=0.0)
    calculated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
