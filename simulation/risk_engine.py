"""Risk Estimation Engine: Quantifies asset, service, and incident risks grounded in physics and graph topology."""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Set
import networkx as nx

from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus
from models.service import HospitalService, ServiceType, ServiceStatus
from models.incident import IncidentState
from models.risk import (
    RiskLevel,
    ViolationType,
    ThresholdViolation,
    TimeToThresholdEstimate,
    AssetRiskAssessment,
    ServiceRiskAssessment,
    IncidentRiskSummary,
)


class RiskEstimationEngine:
    """Evaluates multi-criteria infrastructure and service risk for ResilienceOS."""

    def __init__(self, graph: Optional[nx.DiGraph] = None):
        self.graph = graph

    def set_graph(self, graph: nx.DiGraph) -> None:
        """Sets or updates the internal dependency graph."""
        self.graph = graph

    # =========================================================================
    # 1. Asset-Level Risk Estimation
    # =========================================================================
    def assess_asset_risk(
        self,
        asset: InfrastructureAsset,
        observed_depletion_rate: Optional[float] = None
    ) -> AssetRiskAssessment:
        """Computes deterministic risk score, threshold violations, and time-to-threshold for an asset."""
        violations: List[ThresholdViolation] = []
        factors: List[str] = []

        # 1.1 Base Operational Status Penalty
        status_penalty_map = {
            OperationalStatus.FAILED: 1.0,
            OperationalStatus.CRITICAL: 0.85,
            OperationalStatus.DEGRADED: 0.50,
            OperationalStatus.STARTING: 0.30,
            OperationalStatus.OFFLINE: 0.15,
            OperationalStatus.NORMAL: 0.0,
        }
        base_status_risk = status_penalty_map.get(asset.status, 0.0)
        if base_status_risk > 0.0:
            factors.append(f"Operational status is {asset.status.value.upper()} (base risk: {base_status_risk:.2f})")

        # 1.2 Capacity Utilization Risk
        utilization_pct = 0.0
        utilization_risk = 0.0
        nominal_cap = asset.nominal_capacity if asset.nominal_capacity > 0 else 1.0

        if asset.available_capacity > 0:
            utilization_pct = round((asset.current_load / asset.available_capacity) * 100.0, 1)
        elif asset.current_load > 0:
            utilization_pct = 100.0

        if asset.current_load > asset.available_capacity and asset.available_capacity > 0:
            overload_kw = asset.current_load - asset.available_capacity
            violations.append(
                ThresholdViolation(
                    metric="current_load",
                    current_value=asset.current_load,
                    threshold_limit=asset.available_capacity,
                    unit=asset.capacity_unit,
                    violation_type=ViolationType.CAPACITY_OVERLOAD,
                    severity=RiskLevel.CRITICAL,
                    description=f"Load exceeds available capacity by {overload_kw:.1f} {asset.capacity_unit} ({utilization_pct}%)",
                )
            )
            utilization_risk = 1.0
            factors.append(f"Critical capacity overload: {utilization_pct}% utilization")
        elif utilization_pct >= 90.0:
            violations.append(
                ThresholdViolation(
                    metric="current_load",
                    current_value=asset.current_load,
                    threshold_limit=asset.available_capacity * 0.90,
                    unit=asset.capacity_unit,
                    violation_type=ViolationType.CAPACITY_OVERLOAD,
                    severity=RiskLevel.HIGH,
                    description=f"Near-capacity stress: operating at {utilization_pct}% load",
                )
            )
            utilization_risk = 0.65
            factors.append(f"High capacity strain: {utilization_pct}% utilization")
        elif utilization_pct >= 80.0:
            utilization_risk = 0.35

        # 1.3 Resource Depletion & Physical Thresholds
        time_estimate: Optional[TimeToThresholdEstimate] = None

        # Battery (UPS)
        if asset.battery_level_pct is not None:
            if asset.battery_level_pct <= 15.0:
                violations.append(
                    ThresholdViolation(
                        metric="battery_level_pct",
                        current_value=asset.battery_level_pct,
                        threshold_limit=15.0,
                        unit="%",
                        violation_type=ViolationType.BATTERY_DEPLETED,
                        severity=RiskLevel.CRITICAL,
                        description=f"Emergency battery reserve exhausted: {asset.battery_level_pct:.1f}%",
                    )
                )
                factors.append("Battery reserve critically depleted")
            elif asset.battery_level_pct <= 35.0:
                violations.append(
                    ThresholdViolation(
                        metric="battery_level_pct",
                        current_value=asset.battery_level_pct,
                        threshold_limit=35.0,
                        unit="%",
                        violation_type=ViolationType.BATTERY_DEPLETED,
                        severity=RiskLevel.HIGH,
                        description=f"Battery reserve running low: {asset.battery_level_pct:.1f}%",
                    )
                )
                factors.append("Battery discharging rapidly")

        # Fuel (Generators)
        if asset.fuel_level_pct is not None:
            if asset.fuel_level_pct <= 15.0:
                violations.append(
                    ThresholdViolation(
                        metric="fuel_level_pct",
                        current_value=asset.fuel_level_pct,
                        threshold_limit=15.0,
                        unit="%",
                        violation_type=ViolationType.FUEL_LOW,
                        severity=RiskLevel.CRITICAL,
                        description=f"Generator diesel fuel critically low: {asset.fuel_level_pct:.1f}%",
                    )
                )
                factors.append("Fuel supply exhaustion imminent")
            elif asset.fuel_level_pct <= 30.0:
                violations.append(
                    ThresholdViolation(
                        metric="fuel_level_pct",
                        current_value=asset.fuel_level_pct,
                        threshold_limit=30.0,
                        unit="%",
                        violation_type=ViolationType.FUEL_LOW,
                        severity=RiskLevel.MEDIUM,
                        description=f"Generator fuel below reserve standard: {asset.fuel_level_pct:.1f}%",
                    )
                )

        # Chiller / HVAC Temperature
        if asset.temperature_c is not None and asset.type == AssetType.CHILLER_HVAC:
            if asset.temperature_c >= 14.0:
                violations.append(
                    ThresholdViolation(
                        metric="temperature_c",
                        current_value=asset.temperature_c,
                        threshold_limit=14.0,
                        unit="°C",
                        violation_type=ViolationType.TEMPERATURE_HIGH,
                        severity=RiskLevel.CRITICAL,
                        description=f"Chiller chilled water loop exceeding safe cooling threshold: {asset.temperature_c:.1f}°C",
                    )
                )
                factors.append("Chilled water temperature critical; loss of environmental cooling")
            elif asset.temperature_c >= 10.0:
                violations.append(
                    ThresholdViolation(
                        metric="temperature_c",
                        current_value=asset.temperature_c,
                        threshold_limit=10.0,
                        unit="°C",
                        violation_type=ViolationType.TEMPERATURE_HIGH,
                        severity=RiskLevel.HIGH,
                        description=f"Chiller supply temperature elevated: {asset.temperature_c:.1f}°C (Normal ~7°C)",
                    )
                )
                factors.append("Chilled water temperature elevated")

        # Medical Oxygen Line Pressure
        if asset.pressure_psi is not None and asset.type == AssetType.OXYGEN_SYSTEM:
            if asset.pressure_psi <= 35.0:
                violations.append(
                    ThresholdViolation(
                        metric="pressure_psi",
                        current_value=asset.pressure_psi,
                        threshold_limit=35.0,
                        unit="PSI",
                        violation_type=ViolationType.PRESSURE_LOW,
                        severity=RiskLevel.CRITICAL,
                        description=f"Medical oxygen header pressure critically low: {asset.pressure_psi:.1f} PSI (Nominal 55 PSI)",
                    )
                )
                factors.append("Oxygen pipeline pressure collapse threatening ventilators")
            elif asset.pressure_psi <= 45.0:
                violations.append(
                    ThresholdViolation(
                        metric="pressure_psi",
                        current_value=asset.pressure_psi,
                        threshold_limit=45.0,
                        unit="PSI",
                        violation_type=ViolationType.PRESSURE_LOW,
                        severity=RiskLevel.HIGH,
                        description=f"Oxygen header pressure degraded: {asset.pressure_psi:.1f} PSI",
                    )
                )

        # 1.4 Linear Time-to-Threshold Estimation
        runtime_min = asset.runtime_remaining_min
        if runtime_min is None and observed_depletion_rate and observed_depletion_rate > 0:
            reserve = asset.battery_level_pct or asset.fuel_level_pct or 0.0
            runtime_min = round(reserve / observed_depletion_rate, 1)

        if runtime_min is not None:
            is_crit = runtime_min <= 15.0
            is_exhausted = runtime_min <= 0.0
            time_estimate = TimeToThresholdEstimate(
                asset_id=asset.id,
                metric_name="runtime_remaining_min",
                current_reserve=asset.battery_level_pct or asset.fuel_level_pct or runtime_min,
                depletion_rate_per_min=observed_depletion_rate or 0.0,
                estimated_time_remaining_min=max(0.0, runtime_min),
                threshold_critical_min=15.0,
                is_critical=is_crit,
                is_exhausted=is_exhausted,
            )
            if is_exhausted:
                factors.append("Runtime completely exhausted (0 min remaining)")
            elif is_crit:
                factors.append(f"Emergency exhaustion imminent: {runtime_min:.1f} min remaining (<15 min cutoff)")

        # Runtime penalty applies when asset is discharging, depleted, or in non-normal status
        runtime_penalty = 0.0
        is_discharging_or_depleted = (
            asset.status != OperationalStatus.NORMAL or
            (asset.battery_level_pct is not None and asset.battery_level_pct < 80.0) or
            (asset.fuel_level_pct is not None and asset.fuel_level_pct < 50.0)
        )
        if time_estimate and is_discharging_or_depleted:
            if time_estimate.is_exhausted:
                runtime_penalty = 1.0
            elif time_estimate.is_critical:
                runtime_penalty = 0.85
            elif time_estimate.estimated_time_remaining_min <= 45.0:
                runtime_penalty = 0.50
            elif time_estimate.estimated_time_remaining_min <= 90.0:
                runtime_penalty = 0.25

        violation_severity_weights = {
            RiskLevel.CRITICAL: 0.90,
            RiskLevel.HIGH: 0.60,
            RiskLevel.MEDIUM: 0.30,
            RiskLevel.LOW: 0.10,
        }
        max_violation_risk = max(
            [violation_severity_weights[v.severity] for v in violations],
            default=0.0
        )

        # 1.5 Composite Asset Risk Score Calculation
        weighted_operational = (
            0.45 * base_status_risk +
            0.35 * utilization_risk +
            0.20 * runtime_penalty
        )
        raw_risk = max(weighted_operational, max_violation_risk)

        # If asset has directly failed, risk is unconditionally pegged to 1.0
        if asset.status == OperationalStatus.FAILED:
            raw_risk = 1.0

        # 1.6 Redundancy Mitigation (N+1, 2N)
        if asset.redundancy_level >= 2 and asset.status != OperationalStatus.FAILED:
            redundancy_discount = min(0.30, 0.15 * (asset.redundancy_level - 1))
            raw_risk = max(0.0, raw_risk * (1.0 - redundancy_discount))
            factors.append(f"Risk mitigated by redundancy level {asset.redundancy_level}")

        final_score = round(max(0.0, min(1.0, raw_risk)), 3)
        risk_pct = round(final_score * 100.0, 1)

        return AssetRiskAssessment(
            asset_id=asset.id,
            asset_name=asset.name,
            asset_type=asset.type,
            operational_status=asset.status,
            risk_score=final_score,
            risk_percentage=risk_pct,
            risk_level=RiskLevel.from_score(final_score),
            capacity_utilization_pct=utilization_pct,
            redundancy_level=asset.redundancy_level,
            time_to_threshold=time_estimate,
            violations=violations,
            contributing_factors=factors,
        )

    # =========================================================================
    # 2. Service-Level Risk Estimation
    # =========================================================================
    def assess_service_risk(
        self,
        service: HospitalService,
        assets: Dict[str, InfrastructureAsset],
        asset_risks: Optional[Dict[str, AssetRiskAssessment]] = None
    ) -> ServiceRiskAssessment:
        """Evaluates service risk based on upstream asset status, physical delivery, and criticality."""
        if asset_risks is None:
            asset_risks = {aid: self.assess_asset_risk(a) for aid, a in assets.items()}

        reasons: List[str] = []
        upstream_risk_map: Dict[str, float] = {}

        # 2.1 Identify Upstream Feeding Assets from Graph or Config Heuristics
        upstream_asset_ids = self._get_upstream_assets_for_service(service.id, assets)

        for aid in upstream_asset_ids:
            if aid in asset_risks:
                upstream_risk_map[aid] = asset_risks[aid].risk_score

        # 2.2 Subsystem Vulnerability Breakdown
        # Power Vulnerability
        power_assets = [aid for aid in upstream_asset_ids if aid in assets and assets[aid].type in (
            AssetType.GRID, AssetType.TRANSFORMER, AssetType.MAIN_BUS,
            AssetType.EMERGENCY_BUS, AssetType.UPS, AssetType.GENERATOR
        )]
        max_power_risk = max([asset_risks[a].risk_score for a in power_assets if a in asset_risks], default=0.0)

        # Cooling Vulnerability
        cooling_risk = 0.0
        if service.requires_hvac_cooling and "CHILLER_PLANT" in asset_risks:
            cooling_risk = asset_risks["CHILLER_PLANT"].risk_score
            if cooling_risk > 0.40:
                reasons.append(f"HVAC Chiller Plant risk is elevated ({cooling_risk:.2f}), risking climate control")

        # Medical Gas Vulnerability
        gas_risk = 0.0
        if service.requires_medical_gas and "OXYGEN_MANIFOLD" in asset_risks:
            gas_risk = asset_risks["OXYGEN_MANIFOLD"].risk_score
            if gas_risk > 0.40:
                reasons.append(f"Central Oxygen manifold at risk ({gas_risk:.2f})")

        # Water Vulnerability
        water_risk = 0.0
        if service.requires_pressurized_water and "WATER_PUMP_STATION" in asset_risks:
            water_risk = asset_risks["WATER_PUMP_STATION"].risk_score

        # Direct Service Continuity Deficit
        continuity_deficit = max(0.0, (100.0 - service.service_continuity_pct) / 100.0)
        if continuity_deficit > 0.0:
            reasons.append(f"Service continuity curtailed to {service.service_continuity_pct:.1f}%")

        # 2.3 Check UPS / Power Exhaustion Timeline (only active if upstream grid/buses are impaired or UPS discharging)
        upstream_impaired = any(
            assets[aid].status in (OperationalStatus.FAILED, OperationalStatus.CRITICAL, OperationalStatus.DEGRADED)
            for aid in power_assets if aid in assets and assets[aid].type in (AssetType.GRID, AssetType.TRANSFORMER, AssetType.MAIN_BUS)
        )
        ups_discharging = any(
            assets[aid].status in (OperationalStatus.DEGRADED, OperationalStatus.CRITICAL) or
            (assets[aid].battery_level_pct is not None and assets[aid].battery_level_pct < 80.0)
            for aid in power_assets if aid in assets and assets[aid].type == AssetType.UPS
        )
        blackout_time_min: Optional[float] = None
        if upstream_impaired or ups_discharging:
            for aid in power_assets:
                a = assets.get(aid)
                if a and a.runtime_remaining_min is not None:
                    if blackout_time_min is None or a.runtime_remaining_min < blackout_time_min:
                        blackout_time_min = a.runtime_remaining_min

            if blackout_time_min is not None and blackout_time_min <= 60.0:
                reasons.append(f"Running on finite backup reserve with ~{blackout_time_min:.1f} minutes remaining before outage")

        # 2.4 Composite Weighted Service Risk
        # Power dominates (0.50), Continuity deficit (0.30), Cooling (0.10), Gas/Water (0.10)
        infrastructure_strain = (
            0.50 * max_power_risk +
            0.20 * cooling_risk +
            0.15 * gas_risk +
            0.15 * water_risk
        )

        raw_service_risk = max(continuity_deficit, 0.70 * infrastructure_strain + 0.30 * continuity_deficit)

        # Criticality Scaling:
        # Criticality 5 (ICU, OT, ER) is more vulnerable to partial deficits than Criticality 1 (Admin)
        crit_factor = 0.70 + (0.06 * service.criticality) # 1.0 at crit=5, 0.76 at crit=1
        scaled_risk = raw_service_risk * crit_factor

        # If continuity is severely reduced (< 50%), risk is high regardless of causes
        if service.service_continuity_pct <= 20.0:
            scaled_risk = max(scaled_risk, 0.85)
        elif service.service_continuity_pct <= 50.0:
            scaled_risk = max(scaled_risk, 0.65)

        # If status is compromised or evacuating
        if service.status in (ServiceStatus.COMPROMISED, ServiceStatus.EVACUATING):
            scaled_risk = max(scaled_risk, 0.80)

        # Blackout countdown impact on critical life-support services
        if blackout_time_min is not None and service.criticality >= 4:
            if blackout_time_min <= 15.0:
                scaled_risk = max(scaled_risk, 0.85)
            elif blackout_time_min <= 45.0:
                scaled_risk = max(scaled_risk, 0.60)
            elif blackout_time_min <= 60.0:
                scaled_risk = max(scaled_risk, 0.45)

        final_service_score = round(max(0.0, min(1.0, scaled_risk)), 3)
        risk_pct = round(final_service_score * 100.0, 1)

        # Primary vulnerability identification
        vulnerability = None
        if continuity_deficit >= 0.50:
            vulnerability = "Critical operational delivery loss"
        elif max_power_risk >= 0.60:
            vulnerability = "Upstream electrical supply compromise"
        elif cooling_risk >= 0.60:
            vulnerability = "Environmental temperature & chiller cutoff"
        elif gas_risk >= 0.60:
            vulnerability = "Medical gas delivery loss"
        elif final_service_score < 0.25:
            vulnerability = "Nominal stable operation"
        else:
            vulnerability = "Multi-system infrastructure strain"

        if not reasons and final_service_score < 0.25:
            reasons.append("All upstream infrastructure feeding this service is operating nominally")

        return ServiceRiskAssessment(
            service_id=service.id,
            service_name=service.name,
            service_type=service.type,
            criticality=service.criticality,
            service_status=service.status,
            risk_score=final_service_score,
            risk_percentage=risk_pct,
            risk_level=RiskLevel.from_score(final_service_score),
            service_continuity_pct=service.service_continuity_pct,
            upstream_asset_risks=upstream_risk_map,
            primary_vulnerability=vulnerability,
            risk_reasons=reasons,
            estimated_blackout_time_min=blackout_time_min,
        )

    # =========================================================================
    # 3. Overall Incident Risk Evaluation
    # =========================================================================
    def evaluate_incident_risk(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: Optional[IncidentState] = None,
    ) -> IncidentRiskSummary:
        """Computes comprehensive incident risk across all assets and services."""
        # Assess all individual assets
        asset_risks = {aid: self.assess_asset_risk(a) for aid, a in assets.items()}

        # Assess all individual services
        service_risks = {
            sid: self.assess_service_risk(s, assets, asset_risks)
            for sid, s in services.items()
        }

        # 3.1 Identify Imminent Threshold Crossings (< 60 min)
        imminent_crossings: List[TimeToThresholdEstimate] = []
        for a_risk in asset_risks.values():
            if a_risk.time_to_threshold and a_risk.time_to_threshold.estimated_time_remaining_min <= 60.0:
                imminent_crossings.append(a_risk.time_to_threshold)

        imminent_crossings.sort(key=lambda x: x.estimated_time_remaining_min)

        # 3.2 Find Highest-Risk Entities
        highest_asset_id: Optional[str] = None
        max_a_score = -1.0
        for aid, a_eval in asset_risks.items():
            if a_eval.risk_score > max_a_score:
                max_a_score = a_eval.risk_score
                highest_asset_id = aid

        highest_service_id: Optional[str] = None
        max_s_score = -1.0
        for sid, s_eval in service_risks.items():
            if s_eval.risk_score > max_s_score:
                max_s_score = s_eval.risk_score
                highest_service_id = sid

        # Critical services at risk (criticality >= 4 and risk >= 0.25)
        critical_at_risk = [
            s_eval.service_name
            for s_eval in service_risks.values()
            if s_eval.criticality >= 4 and s_eval.risk_score >= 0.25
        ]

        # 3.3 Aggregate Campus Overall Risk
        # 60% Critical Services (weighted by criticality squared) + 40% Infrastructure Assets
        total_service_weight = sum(s.criticality ** 2 for s in services.values())
        if total_service_weight > 0:
            weighted_service_risk = sum(
                service_risks[sid].risk_score * (s.criticality ** 2)
                for sid, s in services.items()
            ) / total_service_weight
        else:
            weighted_service_risk = 0.0

        avg_asset_risk = sum(a.risk_score for a in asset_risks.values()) / len(asset_risks) if asset_risks else 0.0

        composite_risk = round(0.65 * weighted_service_risk + 0.35 * avg_asset_risk, 3)
        if incident and incident.is_active and critical_at_risk:
            composite_risk = max(composite_risk, 0.50)

        composite_risk = max(0.0, min(1.0, composite_risk))
        composite_risk_pct = round(composite_risk * 100.0, 1)

        # 3.4 Generate Traceable Narrative Explanation
        narrative = self._generate_narrative(
            composite_risk=composite_risk,
            highest_service=services.get(highest_service_id) if highest_service_id else None,
            highest_asset=assets.get(highest_asset_id) if highest_asset_id else None,
            critical_services_at_risk=critical_at_risk,
            imminent_crossings=imminent_crossings,
            incident=incident,
        )

        return IncidentRiskSummary(
            incident_id=incident.incident_id if incident else None,
            overall_risk_score=composite_risk,
            overall_risk_percentage=composite_risk_pct,
            overall_risk_level=RiskLevel.from_score(composite_risk),
            asset_risks=asset_risks,
            service_risks=service_risks,
            highest_risk_service=highest_service_id,
            highest_risk_asset=highest_asset_id,
            critical_services_at_risk=critical_at_risk,
            imminent_threshold_crossings=imminent_crossings,
            summary_narrative=narrative,
            assessed_at=datetime.now(timezone.utc),
        )

    # =========================================================================
    # Internal Helper Methods
    # =========================================================================
    def _get_upstream_assets_for_service(
        self,
        service_id: str,
        assets: Dict[str, InfrastructureAsset]
    ) -> List[str]:
        """Finds all upstream assets feeding a service using graph traversal or domain topology defaults."""
        if self.graph and service_id in self.graph:
            # Look for all nodes that have paths to this service node
            upstream_nodes: Set[str] = set()
            for node in self.graph.nodes:
                if node in assets and nx.has_path(self.graph, node, service_id):
                    # Only include if path length is reasonably direct (<= 4 hops)
                    shortest = nx.shortest_path_length(self.graph, node, service_id)
                    if shortest <= 4:
                        upstream_nodes.add(node)
            if upstream_nodes:
                return list(upstream_nodes)

        # Fallback to standard canonical topology mapping
        if service_id in ("SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"):
            return ["EMERGENCY_BUS", "UPS_CRITICAL", "GEN_01", "GEN_02", "CHILLER_PLANT", "OXYGEN_MANIFOLD"]
        elif service_id == "SERVICE_WARD":
            return ["MAIN_BUS", "TRANSFORMER_01", "TRANSFORMER_02", "GRID_MAIN", "CHILLER_PLANT", "WATER_PUMP_STATION"]
        else: # SERVICE_ADMIN
            return ["MAIN_BUS", "TRANSFORMER_01", "GRID_MAIN"]

    def _generate_narrative(
        self,
        composite_risk: float,
        highest_service: Optional[HospitalService],
        highest_asset: Optional[InfrastructureAsset],
        critical_services_at_risk: List[str],
        imminent_crossings: List[TimeToThresholdEstimate],
        incident: Optional[IncidentState],
    ) -> str:
        """Synthesizes human-in-the-loop narrative explaining the risk landscape."""
        if composite_risk < 0.20:
            return "Hospital campus is operating under NOMINAL STABILITY. All critical services and backup reserves are fully available."

        parts: List[str] = []
        level = RiskLevel.from_score(composite_risk).value.upper()
        parts.append(f"Campus risk level is {level} ({composite_risk * 100:.1f}%).")

        if incident and incident.is_active:
            parts.append(f"Active incident triggered on source asset '{incident.source_asset_id}'.")

        if highest_asset:
            parts.append(f"Primary infrastructure point of failure is {highest_asset.name} (status: {highest_asset.status.value.upper()}).")

        if critical_services_at_risk:
            parts.append(f"Critical life-support services threatened: {', '.join(critical_services_at_risk)}.")

        if imminent_crossings:
            first = imminent_crossings[0]
            parts.append(f"Earliest threshold exhaustion warning: {first.asset_id} has ~{first.estimated_time_remaining_min:.1f} minutes of runtime remaining.")

        return " ".join(parts)
