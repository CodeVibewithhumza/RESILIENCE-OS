"""Hospital State Engine: Central manager for state transitions, telemetry, and digital twin state."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set, Tuple
from pathlib import Path
import yaml
import networkx as nx

from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus
from models.service import HospitalService, ServiceType, ServiceStatus
from models.telemetry import HospitalTelemetrySnapshot
from models.incident import FailureInjectionRequest, IncidentState, IncidentSeverity
from models.resilience import ResilienceIndexBreakdown
from models.strategy import WhatIfComparison
from models.risk import IncidentRiskSummary, AssetRiskAssessment, ServiceRiskAssessment

from graph.topology_builder import HospitalTopologyBuilder
from .cascade_engine import CascadePropagationEngine
from .resilience_index import ResilienceIndexCalculator
from .what_if_engine import WhatIfSimulationEngine
from .explanation_engine import CausalExplanationEngine
from .risk_engine import RiskEstimationEngine
from .report_generator import SimulationReportGenerator
from backend.app.services.event_bus import event_bus

# Explicit allowed state transitions map
VALID_STATE_TRANSITIONS: Dict[OperationalStatus, Set[OperationalStatus]] = {
    OperationalStatus.NORMAL: {
        OperationalStatus.DEGRADED,
        OperationalStatus.CRITICAL,
        OperationalStatus.FAILED,
        OperationalStatus.OFFLINE,
    },
    OperationalStatus.DEGRADED: {
        OperationalStatus.NORMAL,
        OperationalStatus.CRITICAL,
        OperationalStatus.FAILED,
        OperationalStatus.OFFLINE,
        OperationalStatus.RECOVERING,
    },
    OperationalStatus.CRITICAL: {
        OperationalStatus.NORMAL,
        OperationalStatus.DEGRADED,
        OperationalStatus.FAILED,
        OperationalStatus.OFFLINE,
        OperationalStatus.RECOVERING,
    },
    OperationalStatus.FAILED: {
        OperationalStatus.RECOVERING,
        OperationalStatus.OFFLINE,
    },
    OperationalStatus.OFFLINE: {
        OperationalStatus.STARTING,
        OperationalStatus.NORMAL,
    },
    OperationalStatus.STARTING: {
        OperationalStatus.NORMAL,
        OperationalStatus.DEGRADED,
        OperationalStatus.CRITICAL,
        OperationalStatus.FAILED,
        OperationalStatus.OFFLINE,
    },
    OperationalStatus.RECOVERING: {
        OperationalStatus.NORMAL,
        OperationalStatus.DEGRADED,
        OperationalStatus.CRITICAL,
        OperationalStatus.FAILED,
    },
}


class HospitalStateEngine:
    """Central orchestrator for asset and service state lifecycles, digital twin synchronization,
    telemetry updates, and incident response.
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.topology_builder = HospitalTopologyBuilder()
        self.graph: nx.DiGraph = self.topology_builder.graph
        self.config: Dict[str, Any] = self.topology_builder.config

        self.calculator = ResilienceIndexCalculator()
        self.cascade_engine = CascadePropagationEngine(self.graph)
        self.what_if_engine = WhatIfSimulationEngine(self.calculator)
        self.explanation_engine = CausalExplanationEngine(self.graph)
        self.risk_engine = RiskEstimationEngine(self.graph)

        self.assets: Dict[str, InfrastructureAsset] = {}
        self.services: Dict[str, HospitalService] = {}
        self.active_incident: Optional[IncidentState] = None
        self.baseline_resilience: float = 94.5

        # Audit and event log of state transitions
        self.transition_history: List[Dict[str, Any]] = []

        self.state_version = 0
        self.reset_to_baseline()

    def _load_assets_and_services_from_config(self) -> Tuple[Dict[str, InfrastructureAsset], Dict[str, HospitalService]]:
        """Parses canonical infrastructure assets and clinical services from YAML configuration."""
        raw_assets = self.config.get("infrastructure_assets", [])
        raw_services = self.config.get("services", [])

        assets: Dict[str, InfrastructureAsset] = {}
        for a in raw_assets:
            asset_type = AssetType(a.get("type", "grid"))
            status_val = a.get("status", "normal")
            try:
                op_status = OperationalStatus(status_val)
            except ValueError:
                op_status = OperationalStatus.NORMAL

            asset_obj = InfrastructureAsset(
                id=a["id"],
                name=a["name"],
                type=asset_type,
                location=a.get("location", "Utility Plant"),
                floor=int(a.get("floor", 0)),
                nominal_capacity=float(a.get("nominal_capacity", 100.0)),
                available_capacity=float(a.get("available_capacity", a.get("nominal_capacity", 100.0))),
                current_load=float(a.get("current_load", 0.0)),
                capacity_unit=a.get("capacity_unit", "kW"),
                status=op_status,
                health_score=float(a.get("health_score", 100.0)),
                redundancy_level=int(a.get("redundancy_level", 1)),
                fuel_level_pct=float(a["fuel_level_pct"]) if a.get("fuel_level_pct") is not None else None,
                battery_level_pct=float(a["battery_level_pct"]) if a.get("battery_level_pct") is not None else None,
                temperature_c=float(a["temperature_c"]) if a.get("temperature_c") is not None else None,
                pressure_psi=float(a["pressure_psi"]) if a.get("pressure_psi") is not None else None,
                runtime_remaining_min=float(a["runtime_remaining_min"]) if a.get("runtime_remaining_min") is not None else None,
                metadata={
                    "threshold": float(a.get("threshold", 0.70)),
                    **(a.get("metadata") or {})
                }
            )
            assets[asset_obj.id] = asset_obj

        services: Dict[str, HospitalService] = {}
        for s in raw_services:
            srv_type = ServiceType(s.get("type", "icu"))
            status_val = s.get("status", "full_operation")
            try:
                srv_status = ServiceStatus(status_val)
            except ValueError:
                srv_status = ServiceStatus.FULL_OPERATION

            metadata = dict(s.get("metadata") or {})
            service_obj = HospitalService(
                id=s["id"],
                name=s["name"],
                type=srv_type,
                location=s.get("location", "Clinical Wing"),
                floor=int(s.get("floor", 1)),
                criticality=int(s.get("criticality", 5)),
                min_required_capacity_pct=float(s.get("min_required_capacity_pct", 80.0)),
                status=srv_status,
                service_continuity_pct=float(s.get("service_continuity_pct", 100.0)),
                estimated_active_patients=int(metadata.get("estimated_active_patients", 24)),
                required_power_kw=float(metadata.get("required_power_kw", 100.0)),
                requires_hvac_cooling=bool(metadata.get("requires_hvac_cooling", True)),
                requires_medical_gas=bool(metadata.get("requires_medical_gas", True)),
                requires_pressurized_water=bool(metadata.get("requires_pressurized_water", True)),
                backup_priority=int(s.get("backup_priority", 1)),
                at_risk=False,
                risk_reason=None,
                metadata=metadata
            )
            services[service_obj.id] = service_obj

        return assets, services

    def reset_to_baseline(self):
        """Resets the digital twin to 100% normal operational baseline from configuration."""
        self.graph = self.topology_builder.build_default_topology()
        self.cascade_engine = CascadePropagationEngine(self.graph)
        self.explanation_engine = CausalExplanationEngine(self.graph)
        self.risk_engine.set_graph(self.graph)

        self.assets, self.services = self._load_assets_and_services_from_config()
        self.active_incident = None
        self.transition_history.clear()
        self.evaluate_services_health()

    def transition_asset_state(
        self,
        asset_id: str,
        new_status: OperationalStatus,
        reason: Optional[str] = None,
        bypass_validation: bool = False
    ) -> bool:
        """Formally transitions an infrastructure asset's operational state with validation,
        adjusts available capacities/health scores, and updates dependent clinical services.
        """
        asset = self.assets.get(asset_id)
        if not asset:
            return False

        old_status = asset.status
        if old_status == new_status:
            return True

        # Validate transition if not bypassed
        if not bypass_validation:
            allowed_next = VALID_STATE_TRANSITIONS.get(old_status, set())
            if new_status not in allowed_next:
                return False

        # Apply state transition
        asset.status = new_status
        timestamp_str = datetime.now(timezone.utc).isoformat()

        # Adjust capacity, health score and runtime characteristics based on new status
        if new_status == OperationalStatus.NORMAL:
            asset.health_score = 100.0
            asset.available_capacity = asset.nominal_capacity
        elif new_status == OperationalStatus.DEGRADED:
            asset.health_score = max(50.0, min(80.0, asset.health_score))
            asset.available_capacity = round(asset.nominal_capacity * 0.75, 1)
        elif new_status == OperationalStatus.CRITICAL:
            asset.health_score = max(20.0, min(50.0, asset.health_score))
            asset.available_capacity = round(asset.nominal_capacity * 0.40, 1)
        elif new_status == OperationalStatus.FAILED:
            asset.health_score = 0.0
            asset.available_capacity = 0.0
            asset.current_load = 0.0
        elif new_status == OperationalStatus.OFFLINE:
            asset.health_score = 100.0
            asset.current_load = 0.0
        elif new_status == OperationalStatus.STARTING:
            asset.health_score = 90.0
            asset.available_capacity = round(asset.nominal_capacity * 0.50, 1)
        elif new_status == OperationalStatus.RECOVERING:
            asset.health_score = 75.0
            asset.available_capacity = round(asset.nominal_capacity * 0.85, 1)

        # Sync with graph node properties if present
        if self.graph.has_node(asset_id):
            self.graph.nodes[asset_id]["status"] = new_status.value
            self.graph.nodes[asset_id]["health_score"] = asset.health_score
            self.graph.nodes[asset_id]["current_load"] = asset.current_load
            self.graph.nodes[asset_id]["capacity"] = asset.available_capacity

        # Record audit log
        self.transition_history.append({
            "timestamp": timestamp_str,
            "asset_id": asset_id,
            "old_status": old_status.value,
            "new_status": new_status.value,
            "reason": reason or "Operational state update"
        })

        # Re-evaluate dependent hospital services
        self.evaluate_services_health()

        # Publish real-time state change event to WebSocket clients
        self.state_version += 1
        event_bus.publish_nowait(
            "twin",
            {
                "type": "asset_state_changed",
                "target_node_id": asset_id,
                "payload": {
                    "asset_id": asset_id,
                    "old_status": old_status.value,
                    "new_status": new_status.value,
                    "reason": reason or "Operational state update",
                    "timestamp": timestamp_str,
                },
            },
        )

        return True

    def update_asset_telemetry(self, asset_id: str, metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Applies sensor readings to an asset, evaluates configured thresholds,
        and automatically triggers operational state transitions if thresholds are crossed.
        """
        asset = self.assets.get(asset_id)
        if not asset:
            return []

        transitions: List[Dict[str, Any]] = []

        # Update sensor values
        if "current_load" in metrics:
            asset.current_load = float(metrics["current_load"])
        if "fuel_level_pct" in metrics:
            asset.fuel_level_pct = float(metrics["fuel_level_pct"])
        if "battery_level_pct" in metrics:
            asset.battery_level_pct = float(metrics["battery_level_pct"])
        if "temperature_c" in metrics:
            asset.temperature_c = float(metrics["temperature_c"])
        if "pressure_psi" in metrics:
            asset.pressure_psi = float(metrics["pressure_psi"])
        if "runtime_remaining_min" in metrics:
            asset.runtime_remaining_min = float(metrics["runtime_remaining_min"])

        # Threshold rules evaluation
        threshold_ratio = float(asset.metadata.get("threshold", 0.70))

        # 1. Capacity & Load Evaluation
        if asset.nominal_capacity > 0 and asset.status != OperationalStatus.OFFLINE:
            load_ratio = asset.current_load / asset.nominal_capacity
            if load_ratio >= 1.2:
                self.transition_asset_state(asset_id, OperationalStatus.FAILED, "Overload trip: load exceeded 120% capacity", bypass_validation=True)
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.FAILED.value, "reason": "Overload trip"})
            elif load_ratio >= 0.95 and asset.status not in (OperationalStatus.CRITICAL, OperationalStatus.FAILED):
                self.transition_asset_state(asset_id, OperationalStatus.CRITICAL, "Critical load threshold exceeded (>95%)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.CRITICAL.value, "reason": "Critical load"})
            elif load_ratio >= threshold_ratio and asset.status == OperationalStatus.NORMAL:
                self.transition_asset_state(asset_id, OperationalStatus.DEGRADED, f"Load threshold exceeded (>{threshold_ratio*100:.0f}%)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.DEGRADED.value, "reason": "Degraded load threshold"})
            elif load_ratio < threshold_ratio and asset.status in (OperationalStatus.DEGRADED, OperationalStatus.CRITICAL):
                # If other metrics are normal, recover to NORMAL
                if (asset.temperature_c is None or asset.temperature_c < 55.0) and (asset.fuel_level_pct is None or asset.fuel_level_pct > 30.0):
                    self.transition_asset_state(asset_id, OperationalStatus.NORMAL, "Load returned to normal baseline")
                    transitions.append({"asset_id": asset_id, "status": OperationalStatus.NORMAL.value, "reason": "Load recovered"})

        # 2. Generator Fuel Thresholds
        if asset.type == AssetType.GENERATOR and asset.fuel_level_pct is not None:
            if asset.fuel_level_pct <= 0.0 and asset.status != OperationalStatus.OFFLINE:
                self.transition_asset_state(asset_id, OperationalStatus.FAILED, "Generator fuel exhausted", bypass_validation=True)
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.FAILED.value, "reason": "Fuel exhausted"})
            elif asset.fuel_level_pct <= 20.0 and asset.status in (OperationalStatus.NORMAL, OperationalStatus.STARTING):
                self.transition_asset_state(asset_id, OperationalStatus.CRITICAL, "Generator fuel reserve critical (<20%)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.CRITICAL.value, "reason": "Critical fuel reserve"})

        # 3. UPS / Battery Discharge Thresholds
        if asset.type in (AssetType.UPS, AssetType.BATTERY) and asset.battery_level_pct is not None:
            if asset.battery_level_pct <= 0.0:
                self.transition_asset_state(asset_id, OperationalStatus.FAILED, "UPS battery completely discharged", bypass_validation=True)
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.FAILED.value, "reason": "Battery depleted"})
            elif asset.battery_level_pct <= 20.0 and asset.status != OperationalStatus.CRITICAL:
                self.transition_asset_state(asset_id, OperationalStatus.CRITICAL, "UPS battery critical (<20%)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.CRITICAL.value, "reason": "Battery critical"})

        # 4. Temperature Thresholds (Transformers, Chiller)
        if asset.temperature_c is not None:
            if asset.temperature_c >= 85.0 and asset.status != OperationalStatus.FAILED:
                self.transition_asset_state(asset_id, OperationalStatus.FAILED, f"Thermal trip: temp at {asset.temperature_c}°C", bypass_validation=True)
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.FAILED.value, "reason": "Thermal trip"})
            elif asset.temperature_c >= 65.0 and asset.status not in (OperationalStatus.CRITICAL, OperationalStatus.FAILED):
                self.transition_asset_state(asset_id, OperationalStatus.CRITICAL, f"High temperature warning ({asset.temperature_c}°C)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.CRITICAL.value, "reason": "High temperature"})

        # 5. Pressure Thresholds (Medical Gas, Water)
        if asset.pressure_psi is not None:
            if asset.pressure_psi < 20.0 and asset.status != OperationalStatus.FAILED:
                self.transition_asset_state(asset_id, OperationalStatus.FAILED, f"Severe pressure drop ({asset.pressure_psi} PSI)", bypass_validation=True)
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.FAILED.value, "reason": "Pressure failure"})
            elif asset.pressure_psi < 35.0 and asset.status == OperationalStatus.NORMAL:
                self.transition_asset_state(asset_id, OperationalStatus.DEGRADED, f"Low pressure warning ({asset.pressure_psi} PSI)")
                transitions.append({"asset_id": asset_id, "status": OperationalStatus.DEGRADED.value, "reason": "Low pressure"})

        return transitions

    def evaluate_services_health(self) -> None:
        """Evaluates clinical service continuity based on the operational health of
        their upstream power, cooling, medical gas, and pressurized water suppliers.
        """
        # Determine upstream infrastructure health
        main_bus = self.assets.get("MAIN_BUS")
        emer_bus = self.assets.get("EMERGENCY_BUS")
        chiller = self.assets.get("CHILLER_PLANT")
        oxygen = self.assets.get("OXYGEN_MANIFOLD")
        water = self.assets.get("WATER_PUMP_STATION")

        is_main_bus_ok = (main_bus and main_bus.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED))
        is_emer_bus_ok = (emer_bus and emer_bus.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED, OperationalStatus.STARTING))
        is_chiller_ok = (chiller and chiller.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED))
        is_oxygen_ok = (oxygen and oxygen.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED))
        is_water_ok = (water and water.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED))

        # Check for active incident overrides or direct cascade engine impacts
        for service_id, service in self.services.items():
            old_continuity = service.service_continuity_pct
            old_at_risk = service.at_risk
            old_status = service.status

            continuity = 100.0
            at_risk = False
            risk_reasons = []

            # Clinical services relying on Emergency Bus (ICU, OT, ER)
            if service_id in ("SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"):
                if not is_emer_bus_ok:
                    continuity = min(continuity, 15.0)
                    at_risk = True
                    risk_reasons.append("Loss of Emergency Power Bus")
                elif emer_bus and emer_bus.status == OperationalStatus.DEGRADED:
                    continuity = min(continuity, 95.0)
                    at_risk = True
                    risk_reasons.append("Operating on backup / degraded emergency bus")

                if service.requires_hvac_cooling and not is_chiller_ok:
                    continuity = min(continuity, 70.0)
                    at_risk = True
                    risk_reasons.append("Loss of HVAC climate control / positive pressure")

                if service.requires_medical_gas and not is_oxygen_ok:
                    continuity = min(continuity, 40.0)
                    at_risk = True
                    risk_reasons.append("Oxygen manifold pressure critical")

                if service.requires_pressurized_water and not is_water_ok:
                    continuity = min(continuity, 80.0)
                    risk_reasons.append("Water booster pump degraded")

            # General Inpatient Ward relying on Main Bus
            elif service_id == "SERVICE_WARD":
                if not is_main_bus_ok:
                    continuity = min(continuity, 40.0)
                    at_risk = True
                    risk_reasons.append("Main Bus offline; ward power curtailed")
                elif main_bus and main_bus.status == OperationalStatus.DEGRADED:
                    continuity = min(continuity, 60.0)
                    at_risk = True
                    risk_reasons.append("Main Bus operating at reduced capacity")

                if not is_chiller_ok:
                    continuity = min(continuity, 60.0)
                    risk_reasons.append("HVAC airflow restricted")

            # Administrative Services
            elif service_id == "SERVICE_ADMIN":
                if not is_main_bus_ok:
                    continuity = 0.0
                    at_risk = True
                    risk_reasons.append("Administrative circuit shed")
                elif main_bus and main_bus.status == OperationalStatus.DEGRADED:
                    continuity = 20.0
                    risk_reasons.append("Administrative circuit restricted")

            # Map continuity percentage to ServiceStatus
            if continuity >= 95.0:
                service.status = ServiceStatus.FULL_OPERATION
            elif continuity >= 70.0:
                service.status = ServiceStatus.REDUCED_CAPACITY
            elif continuity >= 40.0:
                service.status = ServiceStatus.CRITICAL_ONLY
            elif continuity > 0.0:
                service.status = ServiceStatus.COMPROMISED
            else:
                service.status = ServiceStatus.EVACUATING

            # Update service state
            service.service_continuity_pct = round(continuity, 1)
            service.at_risk = at_risk
            service.risk_reason = "; ".join(risk_reasons) if risk_reasons else None

            if (old_continuity != service.service_continuity_pct or
                old_at_risk != service.at_risk or
                old_status != service.status):
                event_bus.publish_nowait(
                    "twin",
                    {
                        "type": "service_health_changed",
                        "target_node_id": service_id,
                        "payload": {
                            "service_id": service_id,
                            "service_continuity_pct": service.service_continuity_pct,
                            "at_risk": service.at_risk,
                            "status": service.status.value,
                            "risk_reason": service.risk_reason,
                            "timestamp": datetime.now(timezone.utc).isoformat()
                        }
                    }
                )

    def recover_asset(self, asset_id: str) -> bool:
        """Restores an asset from failed/degraded back to normal through the recovering state."""
        asset = self.assets.get(asset_id)
        if not asset:
            return False

        if asset.status in (OperationalStatus.FAILED, OperationalStatus.CRITICAL, OperationalStatus.DEGRADED):
            self.transition_asset_state(asset_id, OperationalStatus.RECOVERING, "Beginning maintenance recovery cycle")
            return self.transition_asset_state(asset_id, OperationalStatus.NORMAL, "Recovery completed; asset online")
        elif asset.status == OperationalStatus.OFFLINE:
            self.transition_asset_state(asset_id, OperationalStatus.STARTING, "Starting standby unit")
            return self.transition_asset_state(asset_id, OperationalStatus.NORMAL, "Unit synchronized online")
        return True

    def inject_failure(self, request: FailureInjectionRequest) -> IncidentState:
        """Executes a simulated failure injection and propagates cascading impact."""
        old_assets_dict = {k: v.status for k, v in self.assets.items()}
        old_services_dict = {k: (v.service_continuity_pct, v.at_risk, v.status) for k, v in self.services.items()}

        new_assets, new_services, incident_state = self.cascade_engine.simulate_failure_cascade(
            request=request,
            assets=self.assets,
            services=self.services
        )
        self.assets = new_assets
        self.services = new_services
        self.active_incident = incident_state

        # Emit asset_state_changed for changed assets
        timestamp_str = datetime.now(timezone.utc).isoformat()
        for asset_id, asset in self.assets.items():
            if asset_id in old_assets_dict and old_assets_dict[asset_id] != asset.status:
                event_bus.publish_nowait(
                    "twin",
                    {
                        "type": "asset_state_changed",
                        "target_node_id": asset_id,
                        "payload": {
                            "asset_id": asset_id,
                            "old_status": old_assets_dict[asset_id].value,
                            "new_status": asset.status.value,
                            "reason": "Cascading failure propagation",
                            "timestamp": timestamp_str,
                        },
                    },
                )

        # Emit service_health_changed for changed services
        for service_id, service in self.services.items():
            if service_id in old_services_dict:
                old_pct, old_risk, old_status = old_services_dict[service_id]
                if old_pct != service.service_continuity_pct or old_risk != service.at_risk or old_status != service.status:
                    event_bus.publish_nowait(
                        "twin",
                        {
                            "type": "service_health_changed",
                            "target_node_id": service_id,
                            "payload": {
                                "service_id": service_id,
                                "service_continuity_pct": service.service_continuity_pct,
                                "at_risk": service.at_risk,
                                "status": service.status.value,
                                "risk_reason": service.risk_reason,
                                "timestamp": timestamp_str
                            }
                        }
                    )

        # Emit cascade_triggered event
        self.state_version += 1
        event_bus.publish_nowait(
            "twin",
            {
                "type": "cascade_triggered",
                "target_node_id": request.asset_id,
                "payload": {
                    "incident_id": incident_state.incident_id,
                    "cascade_path": incident_state.model_dump(mode="json").get("cascade_path", []),
                    "timestamp": timestamp_str,
                },
            },
        )

        # Publish failure injection event to WebSocket clients
        self.state_version += 1
        event_bus.publish_nowait(
            "twin",
            {
                "type": "failure_injected",
                "target_node_id": request.asset_id,
                "payload": {
                    "asset_id": request.asset_id,
                    "failure_type": request.failure_type,
                    "severity": request.severity.value,
                    "incident_id": incident_state.incident_id,
                    "incident": incident_state.model_dump(mode="json"),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            },
        )

        # Log primary failure
        self.transition_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "asset_id": request.asset_id,
            "old_status": "normal",
            "new_status": OperationalStatus.FAILED.value,
            "reason": f"Simulated failure injection: {request.failure_type}"
        })

        return incident_state

    def apply_strategy(self, strategy_id: str) -> Dict[str, Any]:
        """Applies an intervention strategy and transitions digital twin state towards recovery."""
        if not self.active_incident:
            return {"status": "error", "message": "No active incident to apply strategy to."}

        self.active_incident.active_mitigation_strategy = strategy_id

        # Strategy A: Shed non-critical load (ADMIN shed, WARD reduced, ICU/OT/ER preserved)
        if strategy_id in ("strat_a", "A_shed_non_critical"):
            if "GEN_01" in self.assets:
                self.transition_asset_state("GEN_01", OperationalStatus.STARTING, "Strategy A: Dispatching backup generator", bypass_validation=True)
                self.transition_asset_state("GEN_01", OperationalStatus.NORMAL, "Strategy A: Generator 1 online", bypass_validation=True)
                self.assets["GEN_01"].current_load = 480.0

            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy A: Powered by Generator 1", bypass_validation=True)
                self.assets["EMERGENCY_BUS"].available_capacity = 600.0

            if "SERVICE_ADMIN" in self.services:
                self.services["SERVICE_ADMIN"].status = ServiceStatus.COMPROMISED
                self.services["SERVICE_ADMIN"].service_continuity_pct = 0.0

            self.evaluate_services_health()
            return {
                "status": "applied",
                "strategy": "Strategy A",
                "message": "Strategy A applied: Non-critical loads shed. Emergency bus energized via Gen 1.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }

        # Strategy B: Start all generators
        elif strategy_id in ("strat_b", "B_start_all_generators"):
            for gen_id, load in (("GEN_01", 600.0), ("GEN_02", 400.0)):
                if gen_id in self.assets:
                    self.transition_asset_state(gen_id, OperationalStatus.STARTING, "Strategy B: Fast startup", bypass_validation=True)
                    self.transition_asset_state(gen_id, OperationalStatus.NORMAL, "Strategy B: Online", bypass_validation=True)
                    self.assets[gen_id].current_load = load

            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy B: Energized", bypass_validation=True)
            if "MAIN_BUS" in self.assets:
                self.transition_asset_state("MAIN_BUS", OperationalStatus.NORMAL, "Strategy B: Energized", bypass_validation=True)

            self.evaluate_services_health()
            return {
                "status": "applied",
                "strategy": "Strategy B",
                "message": "Strategy B applied: Both generators online. All buses energized.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }

        # Strategy C: Smart Rebalance & HVAC Throttle (Recommended)
        elif strategy_id in ("strat_c", "C_dynamic_rebalance_hvac_throttle"):
            if "GEN_01" in self.assets:
                self.transition_asset_state("GEN_01", OperationalStatus.NORMAL, "Strategy C: Generator 1 online", bypass_validation=True)
                self.assets["GEN_01"].current_load = 520.0
            if "GEN_02" in self.assets:
                self.transition_asset_state("GEN_02", OperationalStatus.NORMAL, "Strategy C: Generator 2 online", bypass_validation=True)
                self.assets["GEN_02"].current_load = 220.0

            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy C: Stabilized", bypass_validation=True)
                self.assets["EMERGENCY_BUS"].available_capacity = 600.0
            if "MAIN_BUS" in self.assets:
                self.transition_asset_state("MAIN_BUS", OperationalStatus.NORMAL, "Strategy C: Rebalanced", bypass_validation=True)
                self.assets["MAIN_BUS"].available_capacity = 500.0

            if "CHILLER_PLANT" in self.assets:
                self.transition_asset_state("CHILLER_PLANT", OperationalStatus.NORMAL, "Strategy C: Throttled HVAC to 75%", bypass_validation=True)
                self.assets["CHILLER_PLANT"].current_load = 210.0

            if "UPS_CRITICAL" in self.assets:
                self.assets["UPS_CRITICAL"].battery_level_pct = 95.0

            if "SERVICE_ICU" in self.services:
                self.services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ICU"].service_continuity_pct = 100.0
                self.services["SERVICE_ICU"].at_risk = False

            if "SERVICE_ER" in self.services:
                self.services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ER"].service_continuity_pct = 98.0
                self.services["SERVICE_ER"].at_risk = False

            if "SERVICE_OT" in self.services:
                self.services["SERVICE_OT"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_OT"].service_continuity_pct = 95.0
                self.services["SERVICE_OT"].at_risk = False

            if "SERVICE_WARD" in self.services:
                self.services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                self.services["SERVICE_WARD"].service_continuity_pct = 60.0
                self.services["SERVICE_WARD"].at_risk = False

            return {
                "status": "applied",
                "strategy": "Strategy C",
                "message": "Strategy C applied: ICU, OT, and ER fully restored. Non-critical loads shed.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }

        # Strategy D: Redistribute Loads across buses & shift priorities
        elif strategy_id in ("strat_d", "D_redistribute_loads", "D_mobile_aux_generator"):
            if "GEN_01" in self.assets:
                self.transition_asset_state("GEN_01", OperationalStatus.NORMAL, "Strategy D: Generator 1 online", bypass_validation=True)
                self.assets["GEN_01"].current_load = 450.0
            if "GEN_02" in self.assets:
                self.transition_asset_state("GEN_02", OperationalStatus.NORMAL, "Strategy D: Generator 2 online", bypass_validation=True)
                self.assets["GEN_02"].current_load = 300.0

            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy D: Priority bus powered", bypass_validation=True)
                self.assets["EMERGENCY_BUS"].available_capacity = 600.0
            if "MAIN_BUS" in self.assets:
                self.transition_asset_state("MAIN_BUS", OperationalStatus.DEGRADED, "Strategy D: Main bus load constrained", bypass_validation=True)
                self.assets["MAIN_BUS"].available_capacity = 350.0

            if "SERVICE_ICU" in self.services:
                self.services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ICU"].service_continuity_pct = 100.0
                self.services["SERVICE_ICU"].at_risk = False
            if "SERVICE_ER" in self.services:
                self.services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ER"].service_continuity_pct = 95.0
                self.services["SERVICE_ER"].at_risk = False
            if "SERVICE_OT" in self.services:
                self.services["SERVICE_OT"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_OT"].service_continuity_pct = 92.0
                self.services["SERVICE_OT"].at_risk = False
            if "SERVICE_WARD" in self.services:
                self.services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                self.services["SERVICE_WARD"].service_continuity_pct = 65.0
                self.services["SERVICE_WARD"].at_risk = False
            if "SERVICE_ADMIN" in self.services:
                self.services["SERVICE_ADMIN"].status = ServiceStatus.REDUCED_CAPACITY
                self.services["SERVICE_ADMIN"].service_continuity_pct = 30.0

            self.evaluate_services_health()
            return {
                "status": "applied",
                "strategy": "Strategy D",
                "message": "Strategy D applied: Loads redistributed to protect critical services; General Ward throttled.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }

        # Strategy E: Prioritize Critical Services (Guaranteed ICU/OT/ER allocation)
        elif strategy_id in ("strat_e", "E_prioritize_critical", "E_oxygen_conservation"):
            if "GEN_01" in self.assets:
                self.transition_asset_state("GEN_01", OperationalStatus.NORMAL, "Strategy E: Dedicated generator dispatch", bypass_validation=True)
                self.assets["GEN_01"].current_load = 420.0
            if "UPS_CRITICAL" in self.assets:
                self.transition_asset_state("UPS_CRITICAL", OperationalStatus.NORMAL, "Strategy E: UPS dedicated to ICU", bypass_validation=True)
                self.assets["UPS_CRITICAL"].battery_level_pct = 98.0
            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy E: Emergency bus active", bypass_validation=True)

            if "SERVICE_ICU" in self.services:
                self.services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ICU"].service_continuity_pct = 100.0
                self.services["SERVICE_ICU"].at_risk = False
            if "SERVICE_ER" in self.services:
                self.services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_ER"].service_continuity_pct = 100.0
                self.services["SERVICE_ER"].at_risk = False
            if "SERVICE_OT" in self.services:
                self.services["SERVICE_OT"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_OT"].service_continuity_pct = 100.0
                self.services["SERVICE_OT"].at_risk = False
            if "SERVICE_WARD" in self.services:
                self.services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                self.services["SERVICE_WARD"].service_continuity_pct = 50.0
            if "SERVICE_ADMIN" in self.services:
                self.services["SERVICE_ADMIN"].status = ServiceStatus.COMPROMISED
                self.services["SERVICE_ADMIN"].service_continuity_pct = 0.0

            self.evaluate_services_health()
            return {
                "status": "applied",
                "strategy": "Strategy E",
                "message": "Strategy E applied: Critical life-support services prioritized at 100% capacity.",
                "new_resilience_score": self.get_resilience_breakdown().overall_score
            }

        # Strategy F: Combined Coordinated Strategy (Most aggressive response)
        elif strategy_id in ("strat_f", "F_combined_strategy", "F_ward_evacuation"):
            for gen_id, load in (("GEN_01", 480.0), ("GEN_02", 240.0)):
                if gen_id in self.assets:
                    self.transition_asset_state(gen_id, OperationalStatus.NORMAL, "Strategy F: Synchronized power dispatch", bypass_validation=True)
                    self.assets[gen_id].current_load = load

            if "EMERGENCY_BUS" in self.assets:
                self.transition_asset_state("EMERGENCY_BUS", OperationalStatus.NORMAL, "Strategy F: Synchronized", bypass_validation=True)
                self.assets["EMERGENCY_BUS"].available_capacity = 600.0
            if "MAIN_BUS" in self.assets:
                self.transition_asset_state("MAIN_BUS", OperationalStatus.NORMAL, "Strategy F: Rebalanced", bypass_validation=True)
                self.assets["MAIN_BUS"].available_capacity = 450.0

            if "CHILLER_PLANT" in self.assets:
                self.transition_asset_state("CHILLER_PLANT", OperationalStatus.NORMAL, "Strategy F: Intelligent thermal management", bypass_validation=True)
                self.assets["CHILLER_PLANT"].current_load = 220.0

            for s_id in ("SERVICE_ICU", "SERVICE_ER", "SERVICE_OT"):
                if s_id in self.services:
                    self.services[s_id].status = ServiceStatus.FULL_OPERATION
                    self.services[s_id].service_continuity_pct = 100.0
                    self.services[s_id].at_risk = False

            if "SERVICE_WARD" in self.services:
                self.services["SERVICE_WARD"].status = ServiceStatus.FULL_OPERATION
                self.services["SERVICE_WARD"].service_continuity_pct = 85.0
                self.services["SERVICE_WARD"].at_risk = False
            if "SERVICE_ADMIN" in self.services:
                self.services["SERVICE_ADMIN"].status = ServiceStatus.REDUCED_CAPACITY
                self.services["SERVICE_ADMIN"].service_continuity_pct = 25.0

            self.evaluate_services_health()
            return {
                "status": "applied",
                "strategy": "Strategy F",
                "message": "Strategy F applied: Coordinated generator sync, intelligent thermal throttling, and all clinical services stabilized.",
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
        service_risks = None
        recovery_time_min = None
        load_shed_kw = None
        if self.active_incident and self.active_incident.is_active:
            try:
                incident_risk = self.risk_engine.evaluate_incident_risk(
                    assets=self.assets,
                    services=self.services,
                    incident=self.active_incident,
                )
                service_risks = {sid: s.risk_score for sid, s in incident_risk.service_risks.items()}
            except Exception:
                service_risks = None
            if self.active_incident.active_mitigation_strategy:
                recovery_time_min = 5.0
                strat = self.active_incident.active_mitigation_strategy
                if strat in ("strat_c", "C_dynamic_rebalance_hvac_throttle"):
                    load_shed_kw = 120.0
                elif strat in ("strat_b", "B_start_all_generators"):
                    load_shed_kw = 380.0
                elif strat in ("strat_d", "D_redistribute_loads", "D_mobile_aux_generator"):
                    load_shed_kw = 160.0
                elif strat in ("strat_e", "E_prioritize_critical", "E_oxygen_conservation"):
                    load_shed_kw = 200.0
                elif strat in ("strat_f", "F_combined_strategy", "F_ward_evacuation"):
                    load_shed_kw = 80.0
            else:
                recovery_time_min = self.active_incident.estimated_unmitigated_blackout_min

        return self.calculator.compute_resilience_breakdown(
            services=list(self.services.values()),
            assets=list(self.assets.values()),
            is_incident_active=(self.active_incident is not None and self.active_incident.is_active),
            baseline_score=self.baseline_resilience,
            service_risks=service_risks,
            recovery_time_min=recovery_time_min,
            load_shed_kw=load_shed_kw,
        )


    def get_what_if_comparison(self) -> WhatIfComparison:
        """Runs What-If analysis and publishes a completion event."""
        incident = self.active_incident or IncidentState(
            incident_id="INC-PREVIEW",
            is_active=False,
            source_asset_id="GRID_MAIN"
        )

        comparison = self.what_if_engine.evaluate_strategies(
            incident=incident,
            current_assets=self.assets,
            current_services=self.services,
        )

        # Strategy A is the baseline / no-action scenario.
        baseline_strategy = next(
            (
                strategy
                for strategy in comparison.strategies
                if strategy.strategy_id == "strat_a"
            ),
            None,
        )

        baseline_resilience_score = (
            baseline_strategy.projected_resilience_score
            if baseline_strategy
            else None
        )

        self.state_version += 1
        event_bus.publish_nowait(
            "twin",
            {
                "type": "what_if_simulation_completed",
                "target_node_id": incident.source_asset_id,
                "payload": {
                    "incident_id": comparison.incident_id,
                    "incident_type": comparison.incident_type,
                    "source_asset_id": incident.source_asset_id,
                    "affected_asset_ids": incident.affected_asset_ids,
                    "affected_service_ids": incident.affected_service_ids,
                    "strategy_count": len(comparison.strategies),
                    "recommended_strategy": comparison.recommended_strategy_id,
                    "baseline_resilience_score": baseline_resilience_score,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            },
        )

        return comparison

    def get_telemetry_snapshot(self) -> HospitalTelemetrySnapshot:
        """Returns live telemetry snapshot corresponding to current digital twin state."""
        grid_asset = self.assets.get("GRID_MAIN")
        is_grid_ok = (grid_asset and grid_asset.status == OperationalStatus.NORMAL)

        gen1 = self.assets.get("GEN_01")
        ups = self.assets.get("UPS_CRITICAL")
        chiller = self.assets.get("CHILLER_PLANT")
        oxygen = self.assets.get("OXYGEN_MANIFOLD")
        water = self.assets.get("WATER_PUMP_STATION")
        main_bus = self.assets.get("MAIN_BUS")
        emer_bus = self.assets.get("EMERGENCY_BUS")

        return HospitalTelemetrySnapshot(
            timestamp=datetime.now(timezone.utc),
            grid_voltage_v=415.0 if is_grid_ok else 0.0,
            grid_frequency_hz=50.0 if is_grid_ok else 0.0,
            grid_power_kw=grid_asset.current_load if (grid_asset and is_grid_ok) else 0.0,
            generator_1_kw=gen1.current_load if gen1 else 0.0,
            generator_1_fuel_pct=gen1.fuel_level_pct or 95.0 if gen1 else 95.0,
            ups_load_kw=ups.current_load if ups else 0.0,
            ups_battery_pct=ups.battery_level_pct or 100.0 if ups else 100.0,
            ups_estimated_runtime_min=ups.runtime_remaining_min or 45.0 if ups else 45.0,
            chiller_temp_c=chiller.temperature_c or 7.2 if chiller else 7.2,
            oxygen_manifold_psi=oxygen.pressure_psi or 55.0 if oxygen else 55.0,
            water_pump_pressure_psi=water.pressure_psi or 60.0 if water else 60.0,
            total_hospital_load_kw=sum(a.current_load for a in self.assets.values() if a.type in (AssetType.MAIN_BUS, AssetType.EMERGENCY_BUS)),
            critical_load_kw=emer_bus.current_load if emer_bus else 0.0,
            non_critical_load_kw=main_bus.current_load if main_bus else 0.0
        )

    def get_incident_risk(self) -> IncidentRiskSummary:
        """Evaluates and returns comprehensive risk assessment across all campus assets and services."""
        return self.risk_engine.evaluate_incident_risk(
            assets=self.assets,
            services=self.services,
            incident=self.active_incident,
        )

    def get_asset_risk(self, asset_id: str) -> Optional[AssetRiskAssessment]:
        """Evaluates risk for a single asset."""
        asset = self.assets.get(asset_id)
        if not asset:
            return None
        return self.risk_engine.assess_asset_risk(asset)

    def get_service_risk(self, service_id: str) -> Optional[ServiceRiskAssessment]:
        """Evaluates risk for a single service."""
        service = self.services.get(service_id)
        if not service:
            return None
        return self.risk_engine.assess_service_risk(service, self.assets)

    def generate_simulation_report(
        self, format: str = "markdown", scenario_title: Optional[str] = None
    ) -> Any:
        """Generates a comprehensive simulation report in Markdown or structured JSON/Dict format."""
        resilience = self.get_resilience_breakdown()
        risk_summary = self.get_incident_risk()
        what_if = self.get_what_if_comparison() if self.active_incident else None

        if format.lower() == "json":
            return SimulationReportGenerator.generate_json_report(
                incident=self.active_incident,
                resilience=resilience,
                risk_summary=risk_summary,
                what_if=what_if,
                scenario_title=scenario_title,
            )
        return SimulationReportGenerator.generate_markdown_report(
            incident=self.active_incident,
            resilience=resilience,
            risk_summary=risk_summary,
            what_if=what_if,
            scenario_title=scenario_title,
        )
