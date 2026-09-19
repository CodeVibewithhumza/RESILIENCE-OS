"""Telemetry stream data models."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field

class TelemetryPoint(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    asset_id: str
    metric: str
    value: float
    unit: str
    is_anomaly: bool = Field(default=False)
    threshold_min: Optional[float] = None
    threshold_max: Optional[float] = None

class HospitalTelemetrySnapshot(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    grid_voltage_v: float = Field(default=415.0)
    grid_frequency_hz: float = Field(default=50.0)
    grid_power_kw: float = Field(default=650.0)
    
    # Backup Power Telemetry
    generator_1_kw: float = Field(default=0.0)
    generator_1_fuel_pct: float = Field(default=95.0)
    generator_2_kw: float = Field(default=0.0)
    generator_2_fuel_pct: float = Field(default=90.0)
    ups_load_kw: float = Field(default=120.0)
    ups_battery_pct: float = Field(default=100.0)
    ups_estimated_runtime_min: float = Field(default=45.0)
    
    # Climate & Environmental
    chiller_cooling_output_kw: float = Field(default=300.0)
    chiller_temp_c: float = Field(default=7.2)
    ambient_temp_c: float = Field(default=34.5)
    
    # Medical Systems
    oxygen_manifold_psi: float = Field(default=55.0)
    oxygen_reserve_hours: float = Field(default=72.0)
    water_pump_pressure_psi: float = Field(default=60.0)
    water_tank_level_pct: float = Field(default=88.0)
    
    # Aggregates
    total_hospital_load_kw: float = Field(default=750.0)
    critical_load_kw: float = Field(default=320.0)
    non_critical_load_kw: float = Field(default=430.0)
