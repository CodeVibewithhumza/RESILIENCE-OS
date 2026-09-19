"""Hospital Service data models and criticality definitions."""
from enum import Enum
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field

class ServiceType(str, Enum):
    ICU = "icu"
    OPERATING_THEATRE = "operating_theatre"
    EMERGENCY_DEPT = "emergency_dept"
    GENERAL_WARD = "general_ward"
    RADIOLOGY = "radiology"
    ADMIN_FACILITY = "admin_facility"

class ServiceStatus(str, Enum):
    FULL_OPERATION = "full_operation"      # 100% services operating normally
    REDUCED_CAPACITY = "reduced_capacity"  # 60-90% services operating, minor deferrals
    CRITICAL_ONLY = "critical_only"        # Life-support & emergency cases only
    COMPROMISED = "compromised"            # Below safe operational threshold
    EVACUATING = "evacuating"              # Active emergency relocation protocol

class HospitalService(BaseModel):
    id: str = Field(..., description="Unique service ID, e.g. SERVICE-ICU")
    name: str = Field(..., description="Display name, e.g. Intensive Care Unit")
    type: ServiceType
    location: str = Field(default="Wing B, Level 3")
    floor: int = Field(default=3, description="Floor level for 3D representation")
    
    # Criticality & Thresholds (1-5 scale)
    criticality: int = Field(default=5, ge=1, le=5, description="1=Admin/Non-critical, 5=Life-Support/Critical")
    min_required_capacity_pct: float = Field(default=80.0, description="Minimum percentage required for full operation")
    
    # Live Status
    status: ServiceStatus = Field(default=ServiceStatus.FULL_OPERATION)
    service_continuity_pct: float = Field(default=100.0, ge=0.0, le=100.0, description="Delivered operational capacity")
    estimated_active_patients: int = Field(default=24)
    
    # Resource Demands
    required_power_kw: float = Field(default=150.0)
    requires_hvac_cooling: bool = Field(default=True)
    requires_medical_gas: bool = Field(default=True)
    requires_pressurized_water: bool = Field(default=True)
    
    # Risk & Warnings
    at_risk: bool = Field(default=False)
    risk_reason: Optional[str] = Field(default=None)
    backup_priority: int = Field(default=1, description="1 = Highest priority for emergency bus/generator")
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
