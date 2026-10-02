"""Cascade Propagation Engine with dependency threshold and capacity evaluations."""
from typing import Dict, Any, List, Set, Tuple, Optional
import networkx as nx

from models.incident import FailureInjectionRequest, IncidentState, IncidentSeverity, TimelineEvent
from models.infrastructure import InfrastructureAsset, OperationalStatus, AssetType
from models.service import HospitalService, ServiceStatus
from graph.traversals import GraphTraversalEngine
import logging

logger = logging.getLogger(__name__)

class CascadePropagationEngine:
    """Dynamic graph-driven cascade propagation engine that traverses infrastructure dependencies,
    evaluates backup switchovers, and calculates multi-stage service impacts.
    """

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

        logger.info(
            "Cascade simulation started | event=failure_injection | "
            "source_asset_id=%s | severity=%s | failure_type=%s",
            source_id,
            request.severity,
            request.failure_type,
        )

        # Deep copy state dictionaries to avoid mutating baseline in-place
        sim_assets = {k: v.model_copy(deep=True) for k, v in assets.items()}
        sim_services = {k: v.model_copy(deep=True) for k, v in services.items()}

        affected_assets: List[str] = []
        affected_services: List[str] = []
        cascade_paths: List[Dict[str, Any]] = []

        # 1. Apply primary failure to target asset
        if source_id in sim_assets:
            sim_assets[source_id].status = OperationalStatus.FAILED
            sim_assets[source_id].available_capacity = 0.0
            sim_assets[source_id].health_score = 0.0
            affected_assets.append(source_id)

        # 2. Extract downstream dependencies via graph traversal
        downstream_nodes = self.traversal.get_downstream_subgraph(source_id)
        for entry in downstream_nodes:
            cascade_paths.append({
                "node_id": entry["node_id"],
                "depth": entry["depth"],
                "path": entry["path"],
                "category": entry["category"]
            })

            logger.info(
                "Cascade propagation step | source_asset_id=%s | "
                "target_node_id=%s | depth=%s | category=%s | path=%s",
                source_id,
                entry["node_id"],
                entry["depth"],
                entry["category"],
                entry["path"],
            )

        # 3. Domain-Specific Dynamic Cascading Logic

        # --- A. ELECTRICAL GRID / TRANSFORMER FAILURES ---
        if source_id in ("GRID_MAIN", "TRANSFORMER_01", "TRANSFORMER_02"):
            if source_id == "GRID_MAIN":
                for tf_id in ("TRANSFORMER_01", "TRANSFORMER_02"):
                    if tf_id in sim_assets:
                        sim_assets[tf_id].status = OperationalStatus.FAILED
                        sim_assets[tf_id].available_capacity = 0.0
                        sim_assets[tf_id].health_score = 0.0
                        sim_assets[tf_id].current_load = 0.0
                        if tf_id not in affected_assets:
                            affected_assets.append(tf_id)
                if "MAIN_BUS" in sim_assets:
                    sim_assets["MAIN_BUS"].status = OperationalStatus.DEGRADED
                    sim_assets["MAIN_BUS"].available_capacity = 0.0
                    sim_assets["MAIN_BUS"].current_load = 0.0
                    if "MAIN_BUS" not in affected_assets:
                        affected_assets.append("MAIN_BUS")
                if "EMERGENCY_BUS" in sim_assets:
                    sim_assets["EMERGENCY_BUS"].status = OperationalStatus.DEGRADED
                    sim_assets["EMERGENCY_BUS"].available_capacity = 450.0
                    if "EMERGENCY_BUS" not in affected_assets:
                        affected_assets.append("EMERGENCY_BUS")
                
                # If compound heatwave + DG failure, generator is locked out
                if request.compound_heatwave:
                    if "GEN_01" in sim_assets:
                        sim_assets["GEN_01"].status = OperationalStatus.FAILED
                        sim_assets["GEN_01"].available_capacity = 0.0
                        sim_assets["GEN_01"].health_score = 0.0
                        sim_assets["GEN_01"].current_load = 0.0
                        if "GEN_01" not in affected_assets:
                            affected_assets.append("GEN_01")
                else:
                    if "GEN_01" in sim_assets:
                        sim_assets["GEN_01"].status = OperationalStatus.STARTING
                        if "GEN_01" not in affected_assets:
                            affected_assets.append("GEN_01")

            elif source_id == "TRANSFORMER_01":
                sim_assets["TRANSFORMER_01"].current_load = 0.0
                if "MAIN_BUS" in sim_assets:
                    sim_assets["MAIN_BUS"].status = OperationalStatus.DEGRADED
                    sim_assets["MAIN_BUS"].available_capacity = 0.0
                    sim_assets["MAIN_BUS"].current_load = 0.0
                    if "MAIN_BUS" not in affected_assets:
                        affected_assets.append("MAIN_BUS")
                if "EMERGENCY_BUS" in sim_assets:
                    sim_assets["EMERGENCY_BUS"].status = OperationalStatus.NORMAL
                    sim_assets["EMERGENCY_BUS"].available_capacity = 320.0
            elif source_id == "TRANSFORMER_02":
                sim_assets["TRANSFORMER_02"].current_load = 0.0
                if "EMERGENCY_BUS" in sim_assets:
                    sim_assets["EMERGENCY_BUS"].status = OperationalStatus.DEGRADED
                    sim_assets["EMERGENCY_BUS"].available_capacity = 0.0
                    if "EMERGENCY_BUS" not in affected_assets:
                        affected_assets.append("EMERGENCY_BUS")

            # UPS takes instantaneous critical load
            if "UPS_CRITICAL" in sim_assets:
                sim_assets["UPS_CRITICAL"].status = OperationalStatus.NORMAL
                sim_assets["UPS_CRITICAL"].current_load = 220.0
                battery_runtime = 14.0 if request.compound_heatwave else 35.0
                sim_assets["UPS_CRITICAL"].runtime_remaining_min = battery_runtime
                if "UPS_CRITICAL" not in affected_assets:
                    affected_assets.append("UPS_CRITICAL")

            # Chiller Plant power curtailed
            if "CHILLER_PLANT" in sim_assets:
                sim_assets["CHILLER_PLANT"].status = OperationalStatus.DEGRADED
                sim_assets["CHILLER_PLANT"].current_load = 120.0
                if "CHILLER_PLANT" not in affected_assets:
                    affected_assets.append("CHILLER_PLANT")

            # Service Impacts
            if "SERVICE_ADMIN" in sim_services:
                sim_services["SERVICE_ADMIN"].status = ServiceStatus.COMPROMISED
                sim_services["SERVICE_ADMIN"].service_continuity_pct = 10.0
                sim_services["SERVICE_ADMIN"].at_risk = True
                sim_services["SERVICE_ADMIN"].risk_reason = "Loss of Main Bus electrical supply"
                if "SERVICE_ADMIN" not in affected_services:
                    affected_services.append("SERVICE_ADMIN")

            if "SERVICE_WARD" in sim_services:
                sim_services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_WARD"].service_continuity_pct = 40.0
                sim_services["SERVICE_WARD"].at_risk = True
                sim_services["SERVICE_WARD"].risk_reason = "Main bus curtailment; non-essential circuits shed"
                if "SERVICE_WARD" not in affected_services:
                    affected_services.append("SERVICE_WARD")

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.FULL_OPERATION
                sim_services["SERVICE_ICU"].service_continuity_pct = 95.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Running on UPS battery reserve (~35 min margin)"
                if "SERVICE_ICU" not in affected_services:
                    affected_services.append("SERVICE_ICU")

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY
                sim_services["SERVICE_OT"].service_continuity_pct = 85.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "HVAC chiller capacity constrained; elective surgeries paused"
                if "SERVICE_OT" not in affected_services:
                    affected_services.append("SERVICE_OT")

            if "SERVICE_ER" in sim_services:
                sim_services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                sim_services["SERVICE_ER"].service_continuity_pct = 90.0
                sim_services["SERVICE_ER"].at_risk = True
                sim_services["SERVICE_ER"].risk_reason = "Operating on emergency power bus"
                if "SERVICE_ER" not in affected_services:
                    affected_services.append("SERVICE_ER")

        # --- B. GENERATOR FAILURE ---
        elif source_id in ("GEN_01", "GEN_02"):
            if source_id in sim_assets:
                sim_assets[source_id].status = OperationalStatus.FAILED
                sim_assets[source_id].available_capacity = 0.0
                sim_assets[source_id].health_score = 0.0
                sim_assets[source_id].current_load = 0.0

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_ICU"].service_continuity_pct = 85.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Backup generator unavailable; high vulnerability to grid transients"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY
                sim_services["SERVICE_OT"].service_continuity_pct = 75.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "Elective procedures restricted due to absence of secondary generation"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ER" in sim_services:
                sim_services["SERVICE_ER"].status = ServiceStatus.FULL_OPERATION
                sim_services["SERVICE_ER"].service_continuity_pct = 85.0
                sim_services["SERVICE_ER"].at_risk = True
                sim_services["SERVICE_ER"].risk_reason = "Generator offline; emergency triage buffering"
                affected_services.append("SERVICE_ER")

        # --- C. UPS BATTERY DEPLETION / FAILURE ---
        elif source_id in ("UPS_CRITICAL", "BATTERY"):
            if "UPS_CRITICAL" in sim_assets:
                sim_assets["UPS_CRITICAL"].status = OperationalStatus.FAILED
                sim_assets["UPS_CRITICAL"].available_capacity = 0.0
                sim_assets["UPS_CRITICAL"].health_score = 0.0
                sim_assets["UPS_CRITICAL"].current_load = 0.0
                sim_assets["UPS_CRITICAL"].runtime_remaining_min = 0.0

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.COMPROMISED
                sim_services["SERVICE_ICU"].service_continuity_pct = 50.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Loss of static UPS battery buffer; zero ride-through for life-support ventilators"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.COMPROMISED
                sim_services["SERVICE_OT"].service_continuity_pct = 45.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "Loss of uninterrupted power supply to anesthesia & monitoring racks"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ER" in sim_services:
                sim_services["SERVICE_ER"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_ER"].service_continuity_pct = 65.0
                sim_services["SERVICE_ER"].at_risk = True
                sim_services["SERVICE_ER"].risk_reason = "Unprotected from power quality disturbances"
                affected_services.append("SERVICE_ER")

        # --- D. CHILLER / HVAC SYSTEM FAILURE ---
        elif source_id == "CHILLER_PLANT":
            if "CHILLER_PLANT" in sim_assets:
                sim_assets["CHILLER_PLANT"].status = OperationalStatus.FAILED
                sim_assets["CHILLER_PLANT"].available_capacity = 0.0
                sim_assets["CHILLER_PLANT"].health_score = 0.0
                sim_assets["CHILLER_PLANT"].current_load = 0.0

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY
                sim_services["SERVICE_OT"].service_continuity_pct = 45.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "Loss of positive pressure & sterile HVAC cooling; surgeries halted"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_ICU"].service_continuity_pct = 65.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Ambient temperature rise; emergency spot-coolers deployed"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_WARD" in sim_services:
                sim_services["SERVICE_WARD"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_WARD"].service_continuity_pct = 60.0
                sim_services["SERVICE_WARD"].at_risk = True
                sim_services["SERVICE_WARD"].risk_reason = "HVAC airflow curtailed across general inpatient wings"
                affected_services.append("SERVICE_WARD")

        # --- E. MEDICAL GAS / OXYGEN MANIFOLD FAILURE ---
        elif source_id == "OXYGEN_MANIFOLD":
            if "OXYGEN_MANIFOLD" in sim_assets:
                sim_assets["OXYGEN_MANIFOLD"].status = OperationalStatus.FAILED
                sim_assets["OXYGEN_MANIFOLD"].available_capacity = 0.0
                sim_assets["OXYGEN_MANIFOLD"].health_score = 0.0

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.COMPROMISED
                sim_services["SERVICE_ICU"].service_continuity_pct = 30.0
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Loss of pipeline oxygen pressure; switching to bedside E-cylinders"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY
                sim_services["SERVICE_OT"].service_continuity_pct = 35.0
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "Anaesthetic gas pipeline depressurized"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ER" in sim_services:
                sim_services["SERVICE_ER"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_ER"].service_continuity_pct = 50.0
                sim_services["SERVICE_ER"].at_risk = True
                sim_services["SERVICE_ER"].risk_reason = "Trauma oxygen header depleted"
                affected_services.append("SERVICE_ER")

        # --- F. WATER PUMP STATION FAILURE / CONTAMINATION ---
        elif source_id == "WATER_PUMP_STATION":
            if "WATER_PUMP_STATION" in sim_assets:
                sim_assets["WATER_PUMP_STATION"].status = OperationalStatus.FAILED
                sim_assets["WATER_PUMP_STATION"].available_capacity = 0.0
                sim_assets["WATER_PUMP_STATION"].health_score = 0.0

            is_contamination = (request.failure_type == "tank_contamination")
            ot_score = 35.0 if is_contamination else 60.0
            icu_score = 50.0 if is_contamination else 75.0
            ward_score = 30.0 if is_contamination else 50.0

            if "SERVICE_OT" in sim_services:
                sim_services["SERVICE_OT"].status = ServiceStatus.CRITICAL_ONLY if is_contamination else ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_OT"].service_continuity_pct = ot_score
                sim_services["SERVICE_OT"].at_risk = True
                sim_services["SERVICE_OT"].risk_reason = "Biohazard water lockout; autoclaves & sterile scrub offline" if is_contamination else "Autoclave & scrub water pressure lost"
                affected_services.append("SERVICE_OT")

            if "SERVICE_ICU" in sim_services:
                sim_services["SERVICE_ICU"].status = ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_ICU"].service_continuity_pct = icu_score
                sim_services["SERVICE_ICU"].at_risk = True
                sim_services["SERVICE_ICU"].risk_reason = "Dialysis water supply compromised" if is_contamination else "Sanitary & dialysis booster pressure loss"
                affected_services.append("SERVICE_ICU")

            if "SERVICE_WARD" in sim_services:
                sim_services["SERVICE_WARD"].status = ServiceStatus.COMPROMISED if is_contamination else ServiceStatus.REDUCED_CAPACITY
                sim_services["SERVICE_WARD"].service_continuity_pct = ward_score
                sim_services["SERVICE_WARD"].at_risk = True
                sim_services["SERVICE_WARD"].risk_reason = "Potable water supply quarantined" if is_contamination else "Potable & sanitary water flow ceased"
                affected_services.append("SERVICE_WARD")

        # --- G. GENERIC GRAPH FALLBACK FOR OTHER NODES ---
        else:
            for item in downstream_nodes:
                nid = item["node_id"]
                if item["category"] == "service" and nid in sim_services:
                    sim_services[nid].status = ServiceStatus.REDUCED_CAPACITY
                    sim_services[nid].service_continuity_pct = 60.0
                    sim_services[nid].at_risk = True
                    sim_services[nid].risk_reason = f"Upstream dependency failure on {source_id}"
                    if nid not in affected_services:
                        affected_services.append(nid)
                elif item["category"] == "infrastructure" and nid in sim_assets:
                    sim_assets[nid].status = OperationalStatus.DEGRADED
                    sim_assets[nid].health_score = 50.0
                    if nid not in affected_assets:
                        affected_assets.append(nid)

        # 4. Construct Dynamic Timeline Events customized for the scenario
        timeline: List[TimelineEvent] = []

        if request.compound_heatwave:
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Grid Blackout & Generator Lockout (Heatwave)",
                    description="Simultaneous 11kV grid collapse + DG thermal lockout in 42°C ambient heatwave.",
                    affected_node_ids=["GRID_MAIN", "GEN_01", "MAIN_BUS", "EMERGENCY_BUS", "UPS_CRITICAL"],
                    system_resilience_score=52.0,
                    service_impact_summary="Extreme crisis: No generation backup; full hospital on battery reserve in ambient heat."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Thermal Accelerated Battery Discharge",
                    description="Elevated substation temperature accelerates UPS chemical degradation. Chiller plant offline.",
                    affected_node_ids=["UPS_CRITICAL", "CHILLER_PLANT", "SERVICE_OT", "SERVICE_ICU"],
                    system_resilience_score=38.0,
                    service_impact_summary="OT positive pressure lost; ICU ambient temperature reaching 31°C."
                ),
                TimelineEvent(
                    t_offset_min=10,
                    title="Critical Life-Support Alarms",
                    description="UPS battery capacity below 20%. ICU ventilator emergency reserve depletion alarm.",
                    affected_node_ids=["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_ER"],
                    system_resilience_score=22.0,
                    service_impact_summary="Manual ventilation kits deployed; rapid patient evacuation recommended."
                ),
                TimelineEvent(
                    t_offset_min=14,
                    title="Unmitigated Blackout Horizon",
                    description="Total static battery exhaustion. Complete electrical blackout across all hospital floors.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_OT", "SERVICE_ER", "SERVICE_WARD", "SERVICE_ADMIN"],
                    system_resilience_score=8.0,
                    service_impact_summary="UNMITIGATED DEPLETION: Reserve exhaustion horizon reached; emergency response activation recommended."
                )
            ]
        elif source_id in ("GRID_MAIN", "TRANSFORMER_01", "TRANSFORMER_02"):
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Primary Power Outage Detected",
                    description=f"Outage triggered on {source_id}. Automatic Transfer Switch engaged UPS battery backup.",
                    affected_node_ids=[source_id, "MAIN_BUS", "EMERGENCY_BUS", "UPS_CRITICAL"],
                    system_resilience_score=68.5,
                    service_impact_summary="ICU & OT on battery power; Admin circuits shed; Inpatient wards curtailed."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Generator Transfer & Thermal Rise",
                    description=f"GEN-01 active ({request.generator_delay_seconds}s transfer). Chiller capacity constrained. OT ambient warming.",
                    affected_node_ids=["GEN_01", "CHILLER_PLANT", "SERVICE_OT"],
                    system_resilience_score=58.0,
                    service_impact_summary="Elective surgeries halted in OT. ICU environmental cooling under strain."
                ),
                TimelineEvent(
                    t_offset_min=10,
                    title="Secondary Bus Load Warning",
                    description="Emergency bus load reaches 92% capacity. Diesel burn rate: 85 L/hr.",
                    affected_node_ids=["EMERGENCY_BUS", "GEN_01"],
                    system_resilience_score=46.5,
                    service_impact_summary="OT chiller cutoff imminent without load shedding."
                ),
                TimelineEvent(
                    t_offset_min=20,
                    title="Critical Reserve Boundary",
                    description="Unmitigated battery reserve depleted. Generator fuel margin down. Cascading blackout imminent.",
                    affected_node_ids=["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"],
                    system_resilience_score=28.0,
                    service_impact_summary="Simulated reserve reaches the configured threshold for ICU-supporting infrastructure; human decision-support review is recommended."
                )
            ]
        elif source_id in ("GEN_01", "GEN_02"):
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Standby Generator Start Failure",
                    description="GEN-01 failed crank cycle during readiness transfer test. Starter solenoid fault.",
                    affected_node_ids=["GEN_01", "SERVICE_ICU", "SERVICE_OT"],
                    system_resilience_score=62.0,
                    service_impact_summary="Emergency power generation buffer lost; grid reliance without failover."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Secondary Generator GEN-02 Inspection",
                    description="Engineering crew manual dispatch to inspect GEN-02 secondary standby feeder.",
                    affected_node_ids=["GEN_02", "EMERGENCY_BUS"],
                    system_resilience_score=55.0,
                    service_impact_summary="Clinical elective operations paused as safety precaution."
                ),
                TimelineEvent(
                    t_offset_min=20,
                    title="Prolonged Vulnerability Horizon",
                    description="Substation operating without secondary emergency generation. UPS battery on heightened alert.",
                    affected_node_ids=["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_OT"],
                    system_resilience_score=42.0,
                    service_impact_summary="Single-point-of-failure risk on grid feeder."
                )
            ]
        elif source_id in ("UPS_CRITICAL", "BATTERY"):
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Static UPS Inverter / Battery Fault",
                    description="UPS battery bank disconnected from DC bus. Static bypass engaged.",
                    affected_node_ids=["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_OT"],
                    system_resilience_score=58.0,
                    service_impact_summary="Zero sub-cycle ride-through protection for ICU & OT critical circuits."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Bedside Internal Battery Verification",
                    description="Biomedical engineering verifying internal battery charges on all 24 ventilators.",
                    affected_node_ids=["SERVICE_ICU"],
                    system_resilience_score=50.0,
                    service_impact_summary="ICU mechanical ventilators on internal battery backup."
                ),
                TimelineEvent(
                    t_offset_min=20,
                    title="Critical Life-Support Alert",
                    description="Bedside internal device batteries depleting without central UPS conditioned line.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_OT"],
                    system_resilience_score=35.0,
                    service_impact_summary="Severe vulnerability to any voltage fluctuation."
                )
            ]
        elif source_id == "WATER_PUMP_STATION":
            is_contamination = (request.failure_type == "tank_contamination")
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Main Storage Tank Contamination Detected" if is_contamination else "Booster Water Pump Cavitation Trip",
                    description="Chemical biohazard lockout in central reservoir" if is_contamination else "Loss of header pressure across booster pump array (dropped to 8 PSI).",
                    affected_node_ids=["WATER_PUMP_STATION", "SERVICE_OT", "SERVICE_ICU"],
                    system_resilience_score=60.0 if not is_contamination else 48.0,
                    service_impact_summary="Autoclaves & sterile processing scrub sink water pressure lost."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Dialysis & Sanitary Isolation",
                    description="ICU dialysis reverse osmosis feeds switched to emergency bottled demineralized tanks.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_WARD"],
                    system_resilience_score=50.0 if not is_contamination else 38.0,
                    service_impact_summary="Inpatient sanitary flow ceases; scrub sinks offline."
                ),
                TimelineEvent(
                    t_offset_min=20,
                    title="Water Supply Exhaustion Horizon",
                    description="Sterile surgical supply depleted. Potable water tanker tender required.",
                    affected_node_ids=["SERVICE_OT", "SERVICE_WARD", "SERVICE_ICU"],
                    system_resilience_score=35.0 if not is_contamination else 22.0,
                    service_impact_summary="Hospital potable supply exhausted; sterile department operations halted."
                )
            ]
        elif source_id == "CHILLER_PLANT":
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="HVAC Chiller Plant Trip",
                    description="Compressor failure on central chiller plant. Airflow temperature increasing.",
                    affected_node_ids=["CHILLER_PLANT", "SERVICE_OT", "SERVICE_ICU"],
                    system_resilience_score=72.0,
                    service_impact_summary="Operating Theatre positive pressure lost. Non-emergency surgeries paused."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="OT Thermal Exceedance",
                    description="Operating Theatre temperature reaches 24.5°C (+3.5°C above surgical limit).",
                    affected_node_ids=["SERVICE_OT"],
                    system_resilience_score=62.0,
                    service_impact_summary="OT sterile field compromised; active operations transitioning to emergency wrap."
                ),
                TimelineEvent(
                    t_offset_min=15,
                    title="ICU Thermal Stress Warning",
                    description="ICU ward ambient temperature exceeds 27°C. Patient monitoring systems thermal throttling.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_WARD"],
                    system_resilience_score=49.0,
                    service_impact_summary="ICU patient heat stress; mobile chilling units requested."
                ),
            ]
        elif source_id == "OXYGEN_MANIFOLD":
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title="Central Oxygen Header Pressure Drop",
                    description="Header pressure dropped from 55 PSI to 18 PSI. Low pressure telemetry alarms triggered.",
                    affected_node_ids=["OXYGEN_MANIFOLD", "SERVICE_ICU", "SERVICE_OT"],
                    system_resilience_score=64.0,
                    service_impact_summary="ICU ventilators alarming; clinical staff alerted."
                ),
                TimelineEvent(
                    t_offset_min=5,
                    title="Bedside Backup Cylinder Switchover",
                    description="Clinical teams manual transfer of 24 ICU patients to mobile E-cylinders.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_ER"],
                    system_resilience_score=52.0,
                    service_impact_summary="Cylinder reserve limited to 120 minutes per patient."
                ),
                TimelineEvent(
                    t_offset_min=20,
                    title="Hospital Cylinder Reserve Depletion",
                    description="Local mobile oxygen reserve at 40%. Bulk tanker replenishment required.",
                    affected_node_ids=["SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"],
                    system_resilience_score=31.0,
                    service_impact_summary="Critical gas supply exhaustion boundary; external emergency transfer needed."
                ),
            ]
        else:
            timeline = [
                TimelineEvent(
                    t_offset_min=0,
                    title=f"Outage Injected on {source_id}",
                    description=f"Primary failure detected on {source_id}. Downstream cascading triggered.",
                    affected_node_ids=affected_assets + affected_services,
                    system_resilience_score=65.0,
                    service_impact_summary="Downstream circuits and clinical departments impacted."
                ),
                TimelineEvent(
                    t_offset_min=10,
                    title="Secondary Cascade Propagation",
                    description="Connected services operating at reduced continuity capacity.",
                    affected_node_ids=affected_services,
                    system_resilience_score=50.0,
                    service_impact_summary="Clinical buffering engaged; mitigation strategy recommended."
                ),
            ]

        # Calculate estimated blackout / failure horizon
        blackout_horizon = 20.0
        if request.compound_heatwave:
            blackout_horizon = 14.0
        elif source_id == "OXYGEN_MANIFOLD":
            blackout_horizon = 45.0
        elif source_id == "CHILLER_PLANT":
            blackout_horizon = 60.0

        incident_state = IncidentState(
            incident_id=f"INC-{source_id}-01",
            is_active=True,
            source_asset_id=source_id,
            severity=request.severity,
            current_time_offset_min=0,
            affected_asset_ids=affected_assets,
            affected_service_ids=affected_services,
            cascade_path=cascade_paths,
            timeline=timeline,
            estimated_unmitigated_blackout_min=blackout_horizon
        )

        logger.info(
            "Cascade simulation completed | incident_id=%s | "
            "source_asset_id=%s | affected_asset_count=%d | "
            "affected_service_count=%d",
            incident_state.incident_id,
            source_id,
            len(affected_assets),
            len(affected_services),
        )

        return sim_assets, sim_services, incident_state

