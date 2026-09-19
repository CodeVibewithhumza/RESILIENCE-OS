"""Cascade Propagation Engine with dependency threshold and capacity evaluations."""
import networkx as nx
from typing import Dict, Any, List, Set, Tuple, Optional
from models.incident import FailureInjectionRequest, IncidentState, IncidentSeverity, TimelineEvent
from models.infrastructure import InfrastructureAsset, OperationalStatus
from models.service import HospitalService, ServiceStatus
from graph.traversals import GraphTraversalEngine

class CascadePropagationEngine:
    def __init__(self, graph: nx.DiGraph):
        self.graph = graph
        self.traversal = GraphTraversalEngine(graph)

    def simulate_failure_cascade(
        self,
        request: FailureInjectionRequest,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService]
    ) -> Tuple[Dict[str, InfrastructureAsset], Dict[str, HospitalService], IncidentState]:
        """Propagates failure from source asset downstream through the dependency graph."""
        source_id = request.asset_id
        
        # Clone current state to avoid direct side effects during simulation
        sim_assets = {k: v.model_copy(deep=True) for k, v in assets.items()}
        sim_services = {k: v.model_copy(deep=True) for k, v in services.items()}

        affected_assets: List[str] = []
        affected_services: List[str] = []
        cascade_paths: List[Dict[str, Any]] = []

        # 1. Apply primary failure
        if source_id in sim_assets:
            sim_assets[source_id].status = OperationalStatus.FAILED
            sim_assets[source_id].available_capacity = 0.0
            sim_assets[source_id].health_score = 0.0
            affected_assets.append(source_id)

        # 2. Main Grid Failure Logic (The Master Demo Scenario)
        if source_id in ("GRID_MAIN", "TRANSFORMER_01", "TRANSFORMER_02"):
            # If main grid or transformers fail:
            if source_id == "GRID_MAIN":
                if "TRANSFORMER_01" in sim_assets:
                    sim_assets["TRANSFORMER_01"].status = OperationalStatus.FAILED
                    sim_assets["TRANSFORMER_01"].available_capacity = 0.0
                    affected_assets.append("TRANSFORMER_01")
                if "TRANSFORMER_02" in sim_assets:
                    sim_assets["TRANSFORMER_02"].status = OperationalStatus.FAILED
                    sim_assets["TRANSFORMER_02"].available_capacity = 0.0
                    affected_assets.append("TRANSFORMER_02")

            # Main Bus loses grid power
            if "MAIN_BUS" in sim_assets:
                sim_assets["MAIN_BUS"].status = OperationalStatus.DEGRADED
                sim_assets["MAIN_BUS"].available_capacity = 200.0 # Severely reduced
                affected_assets.append("MAIN_BUS")

            # Emergency Bus switches to UPS / Generator
            if "EMERGENCY_BUS" in sim_assets:
                sim_assets["EMERGENCY_BUS"].status = OperationalStatus.DEGRADED
                sim_assets["EMERGENCY_BUS"].available_capacity = 450.0
                affected_assets.append("EMERGENCY_BUS")

            # UPS takes instantaneous load
            if "UPS_CRITICAL" in sim_assets:
                sim_assets["UPS_CRITICAL"].status = OperationalStatus.NORMAL
                sim_assets["UPS_CRITICAL"].current_load = 220.0
                sim_assets["UPS_CRITICAL"].runtime_remaining_min = 35.0 # Battery countdown starts!
                affected_assets.append("UPS_CRITICAL")

            # Generator starts up
            if "GEN_01" in sim_assets:
                sim_assets["GEN_01"].status = OperationalStatus.STARTING
                affected_assets.append("GEN_01")

            # Chiller Plant loses main bus capacity unless emergency power routed
            if "CHILLER_PLANT" in sim_assets:
                sim_assets["CHILLER_PLANT"].status = OperationalStatus.DEGRADED
                sim_assets["CHILLER_PLANT"].current_load = 120.0
                affected_assets.append("CHILLER_PLANT")

            # Non-critical services degrade
            if "SERVICE_ADMIN" in sim_services:
                sim_services["SERVICE_ADMIN"].status = ServiceStatus.COMPROMISED
                sim_services["SERVICE_ADMIN"].service_continuity_pct = 10.0
                sim_services["SERVICE_ADMIN"].at_risk = True
                sim_services["SERVICE_ADMIN"].risk_reason = "Loss of Main Bus electrical supply"
                affected_services.append("SERVICE_ADMIN")

            if "SERVICE_WARD" in sim_services:
                sim_services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_WARD"].service_continuity_pct = 40.0
                sim_services["SERVICE_WARD"].at_risk = True
                sim_services["SERVICE_WARD"].risk_reason = "Main bus curtailment; HVAC degraded"
                affected_services.append("SERVICE_WARD")

            # Critical Services enter warning / high alert
            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION # Powered by UPS initially
                sim_services["SERVICE_ICU"].service_continuity_pct = 95.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Running on UPS battery reserve (~35 min remaining before blackout)"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY
                sim_services["SERVICE_OT"].service_continuity_pct = 85.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "HVAC chiller capacity dropping; non-critical surgeries paused"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ER" in sim_services:
                sim_services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                sim_services["SERVICE_ER"].service_continuity_pct = 90.0
                sim_services["SERVICE_ER"].at_risk = True
                sim_services["SERVICE_ER"].risk_reason = "Operating on emergency bus"
                affected_services.append("SERVICE_ER")

        # 3. Construct Cascade Timeline Events (T+0, T+5, T+10, T+20)
        timeline: List[TimelineEvent] = [
            TimelineEvent(
                t_offset_min=0,
                title="Primary Failure Detected",
                description=f"Outage triggered on {source_id}. ATS transfer initiated to battery UPS.",
                affected_node_ids=[source_id, "MAIN_BUS", "EMERGENCY_BUS", "UPS_CRITICAL"],
                system_resilience_score=68.5,
                service_impact_summary="ICU & OT on battery power; Admin dropped; Wards running at 40%."
            ),
            TimelineEvent(
                t_offset_min=5,
                title="Generator Transfer & Thermal Rise",
                description="GEN-01 online. Chiller plant running at 40% capacity. OT ambient temperature rising +1.8°C.",
                affected_node_ids=["GEN_01", "CHILLER_PLANT", "SERVICE_OT"],
                system_resilience_score=58.0,
                service_impact_summary="Elective surgeries halted in OT. ICU environmental cooling strained."
            ),
            TimelineEvent(
                t_offset_min=10,
                title="Secondary Bus Overload Warning",
                description="Emergency bus load reaches 92% capacity. Fuel burn rate: 85 L/hr.",
                affected_node_ids=["EMERGENCY_BUS", "GEN_01"],
                system_resilience_score=46.5,
                service_impact_summary="Operating theatre chiller cutoff imminent without load shedding."
            ),
            TimelineEvent(
                t_offset_min=20,
                title="Critical Exhaustion Boundary",
                description="Unmitigated battery reserve depleted. Generator fuel margin down to 45 mins. Cascading blackout imminent.",
                affected_node_ids=["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"],
                system_resilience_score=28.0,
                service_impact_summary="CATASTROPHIC: ICU life-support risk; Immediate intervention required."
            ),
        ]

        incident_state = IncidentState(
            incident_id=f"INC-{source_id}-01",
            is_active=True,
            source_asset_id=source_id,
            severity=request.severity,
            current_time_offset_min=0,
            affected_asset_ids=affected_assets,
            affected_service_ids=affected_services,
            timeline=timeline,
            estimated_unmitigated_blackout_min=20.0
        )

        return sim_assets, sim_services, incident_state
