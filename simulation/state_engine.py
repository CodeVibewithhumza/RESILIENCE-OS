"""Hospital State Engine: Central manager for state transitions, telemetry, and digital twin state."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import networkx as nx

from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus
from models.service import HospitalService, ServiceType, ServiceStatus
from models.telemetry import HospitalTelemetrySnapshot
from models.incident import FailureInjectionRequest, IncidentState, IncidentSeverity
from models.resilience import ResilienceIndexBreakdown
from models.strategy import WhatIfComparison

from graph.topology_builder import HospitalTopologyBuilder
from .cascade_engine import CascadePropagationEngine
from .resilience_index import ResilienceIndexCalculator
from .what_if_engine import WhatIfSimulationEngine
from .explanation_engine import CausalExplanationEngine

class HospitalStateEngine:
    def __init__(self):
        self.topology_builder = HospitalTopologyBuilder()
        self.graph: nx.DiGraph = self.topology_builder.graph
        
        self.calculator = ResilienceIndexCalculator()
        self.cascade_engine = CascadePropagationEngine(self.graph)
        self.what_if_engine = WhatIfSimulationEngine(self.calculator)
        self.explanation_engine = CausalExplanationEngine(self.graph)

        self.assets: Dict[str, InfrastructureAsset] = {}
        self.services: Dict[str, HospitalService] = {}
        self.active_incident: Optional[IncidentState] = None
        self.baseline_resilience: float = 94.5
        
        self.reset_to_baseline()

    def reset_to_baseline(self):
        """Resets the digital twin to 100% normal operational baseline."""
        self.graph = self.topology_builder.build_default_topology()
        self.cascade_engine = CascadePropagationEngine(self.graph)
        self.explanation_engine = CausalExplanationEngine(self.graph)

        # Build baseline assets from graph
        self.assets = {
            "GRID_MAIN": InfrastructureAsset(
                id="GRID_MAIN", name="City Utility 11kV Grid Feed", type=AssetType.GRID,
                nominal_capacity=1200.0, available_capacity=1200.0, current_load=750.0,
                status=OperationalStatus.NORMAL, health_score=100.0, redundancy_level=1, floor=0
            ),
            "TRANSFORMER_01": InfrastructureAsset(
                id="TRANSFORMER_01", name="Main Transformer T1", type=AssetType.TRANSFORMER,
                nominal_capacity=800.0, available_capacity=800.0, current_load=430.0,
                status=OperationalStatus.NORMAL, health_score=98.0, redundancy_level=2,
                temperature_c=48.5, floor=0
            ),
            "TRANSFORMER_02": InfrastructureAsset(
                id="TRANSFORMER_02", name="Emergency Transformer T2", type=AssetType.TRANSFORMER,
                nominal_capacity=800.0, available_capacity=800.0, current_load=320.0,
                status=OperationalStatus.NORMAL, health_score=99.0, redundancy_level=2,
                temperature_c=42.0, floor=0
            ),
            "MAIN_BUS": InfrastructureAsset(
                id="MAIN_BUS", name="Main Distribution Bus (MSB)", type=AssetType.MAIN_BUS,
                nominal_capacity=1000.0, available_capacity=1000.0, current_load=430.0,
                status=OperationalStatus.NORMAL, health_score=100.0, floor=0
            ),
            "EMERGENCY_BUS": InfrastructureAsset(
                id="EMERGENCY_BUS", name="Emergency Essential Bus (ESB)", type=AssetType.EMERGENCY_BUS,
                nominal_capacity=600.0, available_capacity=600.0, current_load=320.0,
                status=OperationalStatus.NORMAL, health_score=100.0, floor=0
            ),
            "GEN_01": InfrastructureAsset(
                id="GEN_01", name="Primary Diesel Generator 1", type=AssetType.GENERATOR,
                nominal_capacity=750.0, available_capacity=750.0, current_load=0.0,
                status=OperationalStatus.OFFLINE, health_score=100.0, fuel_level_pct=95.0, floor=0
            ),
            "GEN_02": InfrastructureAsset(
                id="GEN_02", name="Auxiliary Diesel Generator 2", type=AssetType.GENERATOR,
                nominal_capacity=500.0, available_capacity=500.0, current_load=0.0,
                status=OperationalStatus.OFFLINE, health_score=100.0, fuel_level_pct=90.0, floor=0
            ),
            "UPS_CRITICAL": InfrastructureAsset(
                id="UPS_CRITICAL", name="Static Double-Conversion UPS", type=AssetType.UPS,
                nominal_capacity=250.0, available_capacity=250.0, current_load=120.0,
                status=OperationalStatus.NORMAL, health_score=100.0, battery_level_pct=100.0,
                runtime_remaining_min=45.0, floor=0
            ),
            "CHILLER_PLANT": InfrastructureAsset(
                id="CHILLER_PLANT", name="HVAC Chiller & AHU Plant", type=AssetType.CHILLER_HVAC,
                nominal_capacity=400.0, available_capacity=400.0, current_load=280.0,
                status=OperationalStatus.NORMAL, health_score=96.0, temperature_c=7.2, floor=4
            ),
            "OXYGEN_MANIFOLD": InfrastructureAsset(
                id="OXYGEN_MANIFOLD", name="Central Oxygen Tank & Header", type=AssetType.OXYGEN_SYSTEM,
                nominal_capacity=100.0, available_capacity=100.0, current_load=45.0,
                status=OperationalStatus.NORMAL, health_score=100.0, pressure_psi=55.0,
                runtime_remaining_min=4320.0, floor=0 # 72 hours
            ),
            "WATER_PUMP_STATION": InfrastructureAsset(
                id="WATER_PUMP_STATION", name="Potable & Booster Water Pumps", type=AssetType.WATER_PUMP,
                nominal_capacity=100.0, available_capacity=100.0, current_load=35.0,
                status=OperationalStatus.NORMAL, health_score=100.0, pressure_psi=60.0, floor=0
            ),
        }

        # Build baseline services
        self.services = {
            "SERVICE_ICU": HospitalService(
                id="SERVICE_ICU", name="Intensive Care Unit (ICU)", type=ServiceType.ICU,
                criticality=5, service_continuity_pct=100.0, status=ServiceStatus.FULL_OPERATION,
                estimated_active_patients=24, required_power_kw=150.0, floor=3
            ),
            "SERVICE_OT": HospitalService(
                id="SERVICE_OT", name="Operating Theatres (OT 1-4)", type=ServiceType.OPERATING_THEATRE,
                criticality=5, service_continuity_pct=100.0, status=ServiceStatus.FULL_OPERATION,
                estimated_active_patients=4, required_power_kw=180.0, floor=2
            ),
            "SERVICE_ER": HospitalService(
                id="SERVICE_ER", name="Emergency Trauma Department", type=ServiceType.EMERGENCY_DEPT,
                criticality=5, service_continuity_pct=100.0, status=ServiceStatus.FULL_OPERATION,
                estimated_active_patients=32, required_power_kw=120.0, floor=1
            ),
            "SERVICE_WARD": HospitalService(
                id="SERVICE_WARD", name="General Inpatient Wards", type=ServiceType.GENERAL_WARD,
                criticality=3, service_continuity_pct=100.0, status=ServiceStatus.FULL_OPERATION,
                estimated_active_patients=94, required_power_kw=220.0, floor=2
            ),
            "SERVICE_ADMIN": HospitalService(
                id="SERVICE_ADMIN", name="Hospital Administration & Offices", type=ServiceType.ADMIN_FACILITY,
                criticality=1, service_continuity_pct=100.0, status=ServiceStatus.FULL_OPERATION,
                estimated_active_patients=0, required_power_kw=80.0, floor=1
            ),
        }

        self.active_incident = None

    def inject_failure(self, request: FailureInjectionRequest) -> IncidentState:
        """Executes a simulated failure injection and propagates cascading impact."""
        new_assets, new_services, incident_state = self.cascade_engine.simulate_failure_cascade(
            request=request,
            assets=self.assets,
            services=self.services
        )
        self.assets = new_assets
        self.services = new_services
        self.active_incident = incident_state
        return incident_state

    def apply_strategy(self, strategy_id: str) -> Dict[str, Any]:
        """Applies an intervention strategy and updates digital twin state towards recovery."""
        if not self.active_incident:
            return {"status": "error", "message": "No active incident to apply strategy to."}

        self.active_incident.active_mitigation_strategy = strategy_id

        if strategy_id in ("strat_c", "C_dynamic_rebalance_hvac_throttle"):
            # Recommended Strategy C: Full Recovery & Smart Rebalance
            self.assets["GEN_01"].status = OperationalStatus.NORMAL
            self.assets["GEN_01"].current_load = 520.0
            self.assets["GEN_02"].status = OperationalStatus.NORMAL
            self.assets["GEN_02"].current_load = 220.0
            
            self.assets["EMERGENCY_BUS"].status = OperationalStatus.NORMAL
            self.assets["EMERGENCY_BUS"].available_capacity = 600.0
            self.assets["MAIN_BUS"].status = OperationalStatus.NORMAL
            self.assets["MAIN_BUS"].available_capacity = 500.0

            self.assets["CHILLER_PLANT"].status = OperationalStatus.NORMAL
            self.assets["CHILLER_PLANT"].current_load = 210.0
            self.assets["UPS_CRITICAL"].battery_level_pct = 95.0
            
            self.services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION
            self.services["SERVICE_ICU"].service_continuity_pct = 100.0
            self.services["SERVICE_ICU"].at_risk = False
            
            self.services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
            self.services["SERVICE_ER"].service_continuity_pct = 98.0
            self.services["SERVICE_ER"].at_risk = False
            
            self.services["SERVICE_OT"].status = ServiceStatus.FULL_OPERATION
            self.services["SERVICE_OT"].service_continuity_pct = 95.0
            self.services["SERVICE_OT"].at_risk = False
            
            self.services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
            self.services["SERVICE_WARD"].service_continuity_pct = 60.0
            self.services["SERVICE_WARD"].at_risk = False

            return {
                "status": "applied",
                "strategy": "Strategy C",
                "message": "Strategy C applied: ICU, OT, and ER fully restored. Non-critical loads shed.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }
        
        return {
            "status": "applied",
            "strategy": strategy_id,
            "message": f"Strategy {strategy_id} applied.",
            "new_resilience_score": self.get_resilience_breakdown().overall_score
        }

    def get_resilience_breakdown(self) -> ResilienceIndexBreakdown:
        """Calculates current Resilience Index breakdown."""
        return self.calculator.compute_resilience_breakdown(
            services=list(self.services.values()),
            assets=list(self.assets.values()),
            is_incident_active=(self.active_incident is not None),
            baseline_score=self.baseline_resilience
        )

    def get_what_if_comparison(self) -> WhatIfComparison:
        """Runs What-If analysis on current incident."""
        incident = self.active_incident or IncidentState(
            incident_id="INC-PREVIEW",
            is_active=False,
            source_asset_id="GRID_MAIN"
        )
        return self.what_if_engine.evaluate_strategies(
            incident=incident,
            current_assets=self.assets,
            current_services=self.services
        )

    def get_telemetry_snapshot(self) -> HospitalTelemetrySnapshot:
        """Returns live telemetry snapshot corresponding to current digital twin state."""
        grid_asset = self.assets.get("GRID_MAIN")
        is_grid_ok = (grid_asset and grid_asset.status == OperationalStatus.NORMAL)

        return HospitalTelemetrySnapshot(
            timestamp=datetime.now(timezone.utc),
            grid_voltage_v=415.0 if is_grid_ok else 0.0,
            grid_frequency_hz=50.0 if is_grid_ok else 0.0,
            grid_power_kw=grid_asset.current_load if is_grid_ok else 0.0,
            generator_1_kw=self.assets["GEN_01"].current_load,
            generator_1_fuel_pct=self.assets["GEN_01"].fuel_level_pct or 95.0,
            ups_load_kw=self.assets["UPS_CRITICAL"].current_load,
            ups_battery_pct=self.assets["UPS_CRITICAL"].battery_level_pct or 100.0,
            ups_estimated_runtime_min=self.assets["UPS_CRITICAL"].runtime_remaining_min or 45.0,
            chiller_temp_c=self.assets["CHILLER_PLANT"].temperature_c or 7.2,
            oxygen_manifold_psi=self.assets["OXYGEN_MANIFOLD"].pressure_psi or 55.0,
            water_pump_pressure_psi=self.assets["WATER_PUMP_STATION"].pressure_psi or 60.0,
            total_hospital_load_kw=sum(a.current_load for a in self.assets.values() if a.type in (AssetType.MAIN_BUS, AssetType.EMERGENCY_BUS)),
            critical_load_kw=self.assets["EMERGENCY_BUS"].current_load,
            non_critical_load_kw=self.assets["MAIN_BUS"].current_load
        )
