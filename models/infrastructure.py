"""Infrastructure Asset data models and enums."""
from enum import Enum
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class AssetType(str, Enum):
    GRID = "grid"
    TRANSFORMER = "transformer"
    GENERATOR = "generator"
    UPS = "ups"
    BATTERY = "battery"
    MAIN_BUS = "main_bus"
    EMERGENCY_BUS = "emergency_bus"
    CHILLER_HVAC = "chiller_hvac"
    WATER_PUMP = "water_pump"
    OXYGEN_SYSTEM = "oxygen_system"

class OperationalStatus(str, Enum):
    NORMAL = "normal"          # 100% healthy, primary source online
    DEGRADED = "degraded"      # Running at reduced capacity or high strain
    CRITICAL = "critical"      # Nearing threshold limits or imminent cutoff
    FAILED = "failed"          # Active outage or tripped
    OFFLINE = "offline"        # Idle standby or planned shutdown
    STARTING = "starting"      # Transitioning online (e.g. generator warmup)
    RECOVERING = "recovering"  # Restoring after failure / reconnecting

class InfrastructureAsset(BaseModel):
    id: str = Field(..., description="Unique asset identifier, e.g. TRANSFORMER-01")
    name: str = Field(..., description="Human readable name")
    type: AssetType
    location: str = Field(default="Substation / Utility Basement")
    floor: int = Field(default=0, description="Floor level for 3D positioning")
    
    # Capacity & Load
    nominal_capacity: float = Field(..., description="Nominal capacity in kW, L/min, or PSI")
    available_capacity: float = Field(..., description="Current available capacity")
    current_load: float = Field(default=0.0, description="Active load being drawn")
    capacity_unit: str = Field(default="kW")
    
    # Health & State
    status: OperationalStatus = Field(default=OperationalStatus.NORMAL)
    health_score: float = Field(default=100.0, ge=0.0, le=100.0, description="0-100 asset health index")
    redundancy_level: int = Field(default=1, description="Number of redundant backups (N+1, 2N)")
    threshold: float = Field(default=0.70,ge=0.0,le=1.0,description="Operational threshold as a fraction of nominal capacity")
    
    # Resource metrics (Optional depending on asset type)
    fuel_level_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    battery_level_pct: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    temperature_c: Optional[float] = Field(default=None)
    pressure_psi: Optional[float] = Field(default=None)
    runtime_remaining_min: Optional[float] = Field(default=None, description="Calculated minutes until resource exhaustion")
    
    metadata: Dict[str, Any] = Field(default_factory=dict)
