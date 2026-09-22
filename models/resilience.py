"""Resilience Index breakdown models, canonical components, and scoring weights."""
from typing import Dict, Any, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field


class CanonicalComponents(BaseModel):
    """Canonical normalized Resilience Index components bounded in [0.0, 1.0] per master spec."""

    # C: Critical-Service Continuity (0.0 - 1.0)
    c_continuity: float = Field(..., ge=0.0, le=1.0, description="Critical-service continuity C in [0, 1]")

    # A: Infrastructure Availability (0.0 - 1.0)
    a_availability: float = Field(..., ge=0.0, le=1.0, description="Infrastructure availability A in [0, 1]")

    # B: Backup Margin Remaining (0.0 - 1.0)
    b_backup_margin: float = Field(..., ge=0.0, le=1.0, description="Backup margin B in [0, 1]")

    # T_norm: Normalized Recovery-Time Penalty (0.0 - 1.0)
    t_recovery_penalty: float = Field(..., ge=0.0, le=1.0, description="Recovery-time penalty T_norm in [0, 1]")

    # U_norm: Normalized Resource-Use / Load Shed Penalty (0.0 - 1.0)
    u_resource_penalty: float = Field(..., ge=0.0, le=1.0, description="Resource-use / load shed penalty U_norm in [0, 1]")

    # Raw unclamped score
    raw_score: float = Field(..., description="Unclamped composite score before bounds clamping")


class SubScores(BaseModel):
    """Sub-scores exposed to UI (scaled 0-100 for gauge visualization) plus canonical [0, 1] terms."""

    # Critical Service Continuity (Sc = 100 * C): 0 - 100
    service_continuity: float = Field(..., ge=0.0, le=100.0, description="Critical service delivery index Sc (0-100)")

    # Infrastructure Backup Margin (Rb = 100 * B): 0 - 100
    backup_margin: float = Field(..., ge=0.0, le=100.0, description="Available backup energy and fuel margin Rb (0-100)")

    # Stability / Infrastructure Availability Factor (Ap = 100 * A): 0 - 100
    stability_factor: float = Field(..., ge=0.0, le=100.0, description="Grid & asset availability factor Ap (0-100)")

    # Recovery Readiness Factor (Lr = 100 * (1 - T_norm)): 0 - 100
    recovery_readiness: float = Field(..., ge=0.0, le=100.0, description="Recovery readiness factor Lr (0-100)")

    # Resource Conservation Factor (100 * (1 - U_norm)): 0 - 100
    resource_conservation: float = Field(default=100.0, ge=0.0, le=100.0, description="Resource conservation factor (0-100)")

    # Exact Canonical Components (C, A, B, T_norm, U_norm in [0, 1])
    canonical: Optional[CanonicalComponents] = Field(
        default=None,
        description="Exact normalized C, A, B, T_norm, U_norm components in [0.0, 1.0]"
    )


class ResilienceIndexBreakdown(BaseModel):
    """Composite Resilience Index Breakdown with subscores and canonical component formulation."""

    overall_score: float = Field(..., ge=0.0, le=100.0, description="Composite Resilience Index bounded strictly in [0-100]")
    status_label: str = Field(..., description="OPTIMAL (85-100), STABLE (70-84), DEGRADED (50-69), AT RISK (30-49), CRITICAL (<30)")
    status_color: str = Field(default="#10B981", description="Hex color code for UI visualization")

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
    mathematical_formula: str = Field(
        default="R = 100 * (w1*C + w2*A + w3*B - w4*T_norm - w5*U_norm)",
        description="Project-defined prototype formula"
    )
