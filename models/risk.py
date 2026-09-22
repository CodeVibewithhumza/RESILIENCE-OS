"""Risk Estimation data models, threshold violations, and assessment schemas."""
from datetime import datetime, timezone
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

from .infrastructure import AssetType, OperationalStatus
from .service import ServiceType, ServiceStatus


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

    @classmethod
    def from_score(cls, score: float) -> "RiskLevel":
        """Maps a 0.0 - 1.0 continuous risk score to a qualitative RiskLevel."""
        if score >= 0.75:
            return cls.CRITICAL
        elif score >= 0.50:
            return cls.HIGH
        elif score >= 0.25:
            return cls.MEDIUM
        return cls.LOW


class ViolationType(str, Enum):
    CAPACITY_OVERLOAD = "capacity_overload"
    VOLTAGE_FAULT = "voltage_fault"
    BATTERY_DEPLETED = "battery_depleted"
    FUEL_LOW = "fuel_low"
    TEMPERATURE_HIGH = "temperature_high"
    PRESSURE_LOW = "pressure_low"
    OFFLINE_STANDBY = "offline_standby"
    UPSTREAM_OUTAGE = "upstream_outage"


class ThresholdViolation(BaseModel):
    metric: str = Field(..., description="Name of the physical metric, e.g. current_load, battery_level_pct")
    current_value: float = Field(..., description="Observed or simulated value")
    threshold_limit: float = Field(..., description="Configured boundary limit")
    unit: str = Field(default="", description="Physical unit, e.g. kW, %, °C, PSI")
    violation_type: ViolationType
    severity: RiskLevel
    description: str = Field(..., description="Human-readable violation context")


class TimeToThresholdEstimate(BaseModel):
    asset_id: str
    metric_name: str = Field(..., description="e.g. battery_runtime, fuel_reserve, oxygen_pressure")
    current_reserve: float
    depletion_rate_per_min: float = Field(default=0.0, description="Depletion rate in units/minute")
    estimated_time_remaining_min: float = Field(..., description="Estimated minutes until depletion or cutoff")
    threshold_critical_min: float = Field(default=15.0, description="Emergency warning threshold in minutes")
    is_critical: bool = Field(default=False)
    is_exhausted: bool = Field(default=False)


class AssetRiskAssessment(BaseModel):
    asset_id: str
    asset_name: str
    asset_type: AssetType
    operational_status: OperationalStatus
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Normalized continuous risk in [0.0, 1.0]")
    risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Risk as 0-100% for UI displays")
    risk_level: RiskLevel
    capacity_utilization_pct: float = Field(default=0.0, description="Load / Capacity * 100")
    redundancy_level: int = Field(default=1, description="Configured redundancy (1 = single point of failure)")
    time_to_threshold: Optional[TimeToThresholdEstimate] = None
    violations: List[ThresholdViolation] = Field(default_factory=list)
    contributing_factors: List[str] = Field(default_factory=list)


class ServiceRiskAssessment(BaseModel):
    service_id: str
    service_name: str
    service_type: ServiceType
    criticality: int = Field(..., ge=1, le=5, description="1=Admin, 5=ICU/Life-support")
    service_status: ServiceStatus
    risk_score: float = Field(..., ge=0.0, le=1.0, description="Normalized continuous risk in [0.0, 1.0]")
    risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Risk as 0-100% for UI displays")
    risk_level: RiskLevel
    service_continuity_pct: float = Field(..., ge=0.0, le=100.0, description="Active delivery percentage")
    upstream_asset_risks: Dict[str, float] = Field(
        default_factory=dict,
        description="Mapping of upstream feeding asset IDs to their calculated risk scores"
    )
    primary_vulnerability: Optional[str] = None
    risk_reasons: List[str] = Field(default_factory=list)
    estimated_blackout_time_min: Optional[float] = None


class IncidentRiskSummary(BaseModel):
    incident_id: Optional[str] = None
    overall_risk_score: float = Field(..., ge=0.0, le=1.0, description="Campus composite risk in [0.0, 1.0]")
    overall_risk_percentage: float = Field(..., ge=0.0, le=100.0, description="Campus composite risk as 0-100%")
    overall_risk_level: RiskLevel
    asset_risks: Dict[str, AssetRiskAssessment] = Field(default_factory=dict)
    service_risks: Dict[str, ServiceRiskAssessment] = Field(default_factory=dict)
    highest_risk_service: Optional[str] = None
    highest_risk_asset: Optional[str] = None
    critical_services_at_risk: List[str] = Field(default_factory=list)
    imminent_threshold_crossings: List[TimeToThresholdEstimate] = Field(default_factory=list)
    summary_narrative: str = Field(..., description="Traceable natural-language explanation of overall risk")
    assessed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
