"""What-If Simulation Engine evaluating Strategies A through F with multi-criteria optimization."""
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime, timezone

from models.strategy import (
    StrategyType,
    StrategyResult,
    WhatIfComparison,
    StrategyDefinition,
    MCDAProfile,
    StrategyComparisonMatrix,
)
from models.infrastructure import InfrastructureAsset, OperationalStatus, AssetType
from models.service import HospitalService, ServiceStatus, ServiceType
from models.incident import IncidentState
from .resilience_index import ResilienceIndexCalculator
from .risk_engine import RiskEstimationEngine
from .strategy_ranking import MultiObjectiveRankingEngine

logger = logging.getLogger(__name__)


class WhatIfSimulationEngine:
    """Evaluates candidate response strategies against active hospital incidents,
    computes multi-criteria trade-offs, determines Pareto optimality, and ranks recommendations.
    """

    def __init__(
        self,
        calculator: ResilienceIndexCalculator,
        risk_engine: Optional[RiskEstimationEngine] = None,
        ranking_engine: Optional[MultiObjectiveRankingEngine] = None,
    ):
        self.calculator = calculator
        self.risk_engine = risk_engine or RiskEstimationEngine()
        self.ranking_engine = ranking_engine or MultiObjectiveRankingEngine()

    def evaluate_strategies(
        self,
        incident: IncidentState,
        current_assets: Dict[str, InfrastructureAsset],
        current_services: Dict[str, HospitalService],
    ) -> WhatIfComparison:
        """Runs simulations for all 6 response strategies, evaluates multi-criteria trade-offs,
        determines Pareto optimality, and ranks outcomes.
        """
        source_id = incident.source_asset_id or "GRID_MAIN"
        incident_type = self._classify_incident_type(source_id)

        evaluation_timestamp = datetime.now(timezone.utc).isoformat()

        logger.info(
            "What-if evaluation started | timestamp=%s | incident_id=%s | source=%s | "
            "type=%s | severity=%s | affected_asset_ids=%s | affected_service_ids=%s | "
            "triggering_event=%s | strategy_count=6",
            evaluation_timestamp,
            incident.incident_id,
            source_id,
            incident_type,
            incident.severity.value,
            incident.affected_asset_ids,
            incident.affected_service_ids,
            {
                "incident_id": incident.incident_id,
                "source_asset_id": source_id,
                "incident_type": incident_type,
                "severity": incident.severity.value,
            },
        )

        # 1. Simulate Strategy A: Do Nothing / Baseline
        strat_a = self._simulate_strategy_a(current_assets, current_services, incident, incident_type)

        # 2. Simulate Strategy B: Priority ICU + Full Non-Critical Shedding
        strat_b = self._simulate_strategy_b(current_assets, current_services, incident, incident_type)

        # 3. Simulate Strategy C: Dynamic Rebalance + Controlled HVAC Throttling
        strat_c = self._simulate_strategy_c(current_assets, current_services, incident, incident_type)

        # 4. Simulate Strategy D: Mobile Auxiliary Generator Dispatch
        strat_d = self._simulate_strategy_d(current_assets, current_services, incident, incident_type)

        # 5. Simulate Strategy E: Medical Gas / Oxygen Flow Conservation
        strat_e = self._simulate_strategy_e(current_assets, current_services, incident, incident_type)

        # 6. Simulate Strategy F: Partial Ward Evacuation Protocol
        strat_f = self._simulate_strategy_f(current_assets, current_services, incident, incident_type)

        candidate_strategies = [strat_c, strat_b, strat_d, strat_e, strat_f, strat_a]

        # Compute comparative deltas relative to Strategy A (Unmitigated Baseline)
        base_resilience = strat_a.projected_resilience_score
        base_icu = strat_a.icu_continuity_pct
        base_runtime = strat_a.backup_runtime_remaining_hours

        for s in candidate_strategies:
            s.delta_resilience = round(s.projected_resilience_score - base_resilience, 1)
            s.delta_icu = round(s.icu_continuity_pct - base_icu, 1)
            s.delta_runtime_hours = round(s.backup_runtime_remaining_hours - base_runtime, 1)

        # Multi-Objective MCDA Ranking (TOPSIS, Pareto Sorting, MAUT, Pairwise Matrix)
        comparison_matrix = self.ranking_engine.compare_and_rank_strategies(
            strategies=candidate_strategies,
            incident_id=incident.incident_id,
            incident_type=incident_type,
        )

        recommended = candidate_strategies[0]

        logger.info(
            "What-if evaluation completed | timestamp=%s | incident_id=%s | source=%s | "
            "type=%s | severity=%s | affected_asset_ids=%s | affected_service_ids=%s | "
            "triggering_event=%s | recommended=%s | score=%.1f | ranks=%s | topsis=%.3f",
            datetime.now(timezone.utc).isoformat(),
            incident.incident_id,
            source_id,
            incident_type,
            incident.severity.value,
            incident.affected_asset_ids,
            incident.affected_service_ids,
            {
                "incident_id": incident.incident_id,
                "source_asset_id": source_id,
                "incident_type": incident_type,
                "severity": incident.severity.value,
            },
            recommended.strategy_id,
            recommended.projected_resilience_score,
            {s.strategy_id: s.recommendation_rank for s in candidate_strategies},
            recommended.topsis_score or 0.0,
        )

        explanation = comparison_matrix.recommendation_rationale

        decision_summary = {
            "incident_type": incident_type,
            "recommended_strategy": recommended.strategy_id,
            "pareto_frontier": comparison_matrix.pareto_frontier_ids,
            "max_resilience_gain": max(s.delta_resilience or 0.0 for s in candidate_strategies),
            "max_runtime_hours": max(s.backup_runtime_remaining_hours for s in candidate_strategies),
            "profile_sensitivity": comparison_matrix.profile_sensitivity,
            "topsis_closeness": recommended.topsis_score,
            "trade_off_analysis": {
                "clinical_preservation": f"ICU maintained at {recommended.icu_continuity_pct:.1f}%",
                "fuel_endurance": f"Generator runtime extended to {recommended.backup_runtime_remaining_hours:.1f} hours",
                "load_shedding": f"{recommended.non_critical_load_shed_kw:.0f} kW non-critical load shed",
                "dispatch_delay": f"{recommended.implementation_latency_min or 0:.0f} min deployment latency",
            },
        }

        return WhatIfComparison(
            incident_id=incident.incident_id,
            incident_source=source_id,
            timestamp_evaluated="T+0 (Immediate Post-Incident)",
            unmitigated_baseline_score=strat_a.projected_resilience_score,
            strategies=candidate_strategies,
            recommended_strategy_id=recommended.strategy_id,
            causal_explanation=explanation,
            incident_type=incident_type,
            decision_summary=decision_summary,
            ranking_criteria={
                "resilience": 0.30,
                "icu_continuity": 0.25,
                "runtime_hours": 0.15,
                "ot_continuity": 0.10,
                "recovery_time": 0.10,
                "load_shed": 0.05,
                "latency": 0.05,
            },
            comparison_matrix=comparison_matrix,
        )

    # =========================================================================
    # Strategy Simulation Implementations (A through F)
    # =========================================================================

    def _simulate_strategy_a(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy A: Baseline / Status Quo (Unmitigated Outage Trajectory)."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        # Severe unmitigated degradation
        for s in mock_services:
            if s.criticality == 5:
                s.service_continuity_pct = 65.0
                s.status = ServiceStatus.REDUCED_CAPACITY
            elif s.criticality >= 4:
                s.service_continuity_pct = 40.0
                s.status = ServiceStatus.COMPROMISED
            else:
                s.service_continuity_pct = 10.0
                s.status = ServiceStatus.COMPROMISED

        for a in mock_assets:
            if a.battery_level_pct is not None:
                a.battery_level_pct = 15.0
            if a.type == AssetType.UPS:
                a.runtime_remaining_min = 12.0

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=180.0,
            load_shed_kw=0.0,
        )

        return StrategyResult(
            strategy_id="strat_a",
            strategy_name="Baseline / Unmitigated Trajectory",
            strategy_code="Strategy A",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=65.0,
            emergency_continuity_pct=60.0,
            operating_theatre_continuity_pct=40.0,
            general_ward_continuity_pct=10.0,
            backup_runtime_remaining_hours=0.4,
            non_critical_load_shed_kw=0.0,
            estimated_recovery_time_min=180.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=0.0,
            pros=["Zero operator deployment delay or procedural friction"],
            cons=[
                "High risk of catastrophic ICU blackout in <30 minutes",
                "Imminent battery exhaustion on critical life-support",
                "Uncontrolled cascading failure across clinical wings",
            ],
            risk_level="Critical",
        )

    def _simulate_strategy_b(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy B: Priority ICU Isolation & Hard Non-Critical Load Shedding."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        for s in mock_services:
            if s.id == "SERVICE_ICU":
                s.service_continuity_pct = 100.0
                s.status = ServiceStatus.FULL_OPERATION
            elif s.id == "SERVICE_ER":
                s.service_continuity_pct = 95.0
                s.status = ServiceStatus.FULL_OPERATION
            elif s.id == "SERVICE_OT":
                s.service_continuity_pct = 40.0
                s.status = ServiceStatus.REDUCED_CAPACITY
            else:
                s.service_continuity_pct = 0.0
                s.status = ServiceStatus.COMPROMISED

        for a in mock_assets:
            if a.type == AssetType.GENERATOR and "01" in a.id:
                a.status = OperationalStatus.NORMAL
                a.current_load = 400.0
            if a.type == AssetType.EMERGENCY_BUS:
                a.status = OperationalStatus.NORMAL

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=45.0,
            load_shed_kw=380.0,
        )

        return StrategyResult(
            strategy_id="strat_b",
            strategy_name="Priority ICU Isolation & Hard Load Shed",
            strategy_code="Strategy B",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=100.0,
            emergency_continuity_pct=95.0,
            operating_theatre_continuity_pct=40.0,
            general_ward_continuity_pct=0.0,
            backup_runtime_remaining_hours=4.8,
            non_critical_load_shed_kw=380.0,
            estimated_recovery_time_min=45.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=3.0,
            pros=[
                "Guarantees 100% continuous power to ICU life-support ventilators",
                "Extends emergency generator runtime to 4.8 hours by shedding all non-critical demand",
            ],
            cons=[
                "Shuts down active surgical suites in Operating Theatres (continuity 40%)",
                "Complete blackout in general wards and diagnostic suites",
            ],
            risk_level="Medium",
        )

    def _simulate_strategy_c(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy C: Dynamic Bus Rebalance & Controlled HVAC Throttling (Recommended)."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        for s in mock_services:
            if s.id in ("SERVICE_ICU", "SERVICE_ER"):
                s.service_continuity_pct = 100.0
                s.status = ServiceStatus.FULL_OPERATION
            elif s.id == "SERVICE_OT":
                s.service_continuity_pct = 95.0
                s.status = ServiceStatus.FULL_OPERATION
            elif s.id == "SERVICE_WARD":
                s.service_continuity_pct = 60.0
                s.status = ServiceStatus.REDUCED_CAPACITY
            else:
                s.service_continuity_pct = 30.0
                s.status = ServiceStatus.REDUCED_CAPACITY

        for a in mock_assets:
            if a.type == AssetType.GENERATOR:
                a.status = OperationalStatus.NORMAL
                if "01" in a.id:
                    a.current_load = 520.0
                elif "02" in a.id:
                    a.current_load = 220.0
            elif a.type in (AssetType.EMERGENCY_BUS, AssetType.MAIN_BUS):
                a.status = OperationalStatus.NORMAL
            elif a.type == AssetType.CHILLER_HVAC:
                a.status = OperationalStatus.NORMAL
                a.current_load = 210.0
            elif a.type == AssetType.UPS:
                a.status = OperationalStatus.NORMAL
                a.battery_level_pct = 95.0

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=5.0,
            load_shed_kw=120.0,
        )

        return StrategyResult(
            strategy_id="strat_c",
            strategy_name="Dynamic Bus Rebalance & Controlled HVAC Throttling",
            strategy_code="Strategy C",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=100.0,
            emergency_continuity_pct=98.0,
            operating_theatre_continuity_pct=95.0,
            general_ward_continuity_pct=60.0,
            backup_runtime_remaining_hours=6.2,
            non_critical_load_shed_kw=120.0,
            estimated_recovery_time_min=20.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=2.0,
            pros=[
                "Preserves 100% ICU and 98% Emergency Department life-support continuity",
                "Safeguards active surgical suites in Operating Theatres (95% continuity)",
                "Extends diesel generator runtime to >6 hours via intelligent secondary bus rebalancing",
                "Maintains general ward habitability and critical monitoring at 60%",
            ],
            cons=[
                "Controlled temperature elevation (+2.5°C) in non-critical administrative wings",
            ],
            risk_level="Low",
        )

    def _simulate_strategy_d(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy D: Mobile Auxiliary Generator Dispatch (Utility Reserve)."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        for s in mock_services:
            if s.criticality >= 4:
                s.service_continuity_pct = 95.0
                s.status = ServiceStatus.FULL_OPERATION
            elif s.criticality == 3:
                s.service_continuity_pct = 75.0
                s.status = ServiceStatus.REDUCED_CAPACITY
            else:
                s.service_continuity_pct = 50.0

        for a in mock_assets:
            if a.type == AssetType.GENERATOR:
                a.status = OperationalStatus.NORMAL
                a.available_capacity = 1250.0

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=40.0,
            load_shed_kw=50.0,
        )

        return StrategyResult(
            strategy_id="strat_d",
            strategy_name="Mobile Auxiliary Generator Dispatch (Utility Reserve)",
            strategy_code="Strategy D",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=95.0,
            emergency_continuity_pct=90.0,
            operating_theatre_continuity_pct=80.0,
            general_ward_continuity_pct=70.0,
            backup_runtime_remaining_hours=12.0,
            non_critical_load_shed_kw=50.0,
            estimated_recovery_time_min=40.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=35.0,
            pros=[
                "Injects 500 kW sustained secondary capacity from external utility reserve",
                "Provides massive long-term endurance (12+ hours)",
                "Minimizes load-shedding across general patient floors",
            ],
            cons=[
                "Significant physical deployment delay (30-45 minutes transit and intertie setup)",
                "Facility remains vulnerable on finite battery reserve during transit lag",
            ],
            risk_level="Medium",
        )

    def _simulate_strategy_e(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy E: Medical Gas & Oxygen Flow Conservation Protocol."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        is_gas_incident = (incident_type == "medical_gas_failure")
        icu_cont = 100.0 if is_gas_incident else 90.0
        ward_cont = 40.0

        for s in mock_services:
            if s.id == "SERVICE_ICU":
                s.service_continuity_pct = icu_cont
                s.status = ServiceStatus.FULL_OPERATION
            elif s.id in ("SERVICE_ER", "SERVICE_OT"):
                s.service_continuity_pct = 90.0
            else:
                s.service_continuity_pct = ward_cont

        for a in mock_assets:
            if a.type == AssetType.OXYGEN_SYSTEM:
                a.status = OperationalStatus.NORMAL
                a.pressure_psi = 52.0

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=15.0,
            load_shed_kw=60.0,
        )

        return StrategyResult(
            strategy_id="strat_e",
            strategy_name="Medical Gas & Oxygen Reserve Conservation",
            strategy_code="Strategy E",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=icu_cont,
            emergency_continuity_pct=90.0,
            operating_theatre_continuity_pct=85.0,
            general_ward_continuity_pct=ward_cont,
            backup_runtime_remaining_hours=96.0 if is_gas_incident else 5.0,
            non_critical_load_shed_kw=60.0,
            estimated_recovery_time_min=15.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=10.0,
            pros=[
                "Extends central oxygen manifold reserves from 24h to 96+ hours",
                "Guarantees continuous ventilator supply for life-support beds",
                "Fast implementation time (10-15 minutes valve rebalancing)",
            ],
            cons=[
                "Requires manual isolation of non-essential ward supply lines",
                "General wards must transition to portable oxygen concentrators",
            ],
            risk_level="Low" if is_gas_incident else "Medium",
        )

    def _simulate_strategy_f(
        self,
        assets: Dict[str, InfrastructureAsset],
        services: Dict[str, HospitalService],
        incident: IncidentState,
        incident_type: str,
    ) -> StrategyResult:
        """Strategy F: Partial Ward Evacuation & Patient Relocation Protocol."""
        mock_services = [s.model_copy() for s in services.values()]
        mock_assets = [a.model_copy() for a in assets.values()]

        for s in mock_services:
            if s.id == "SERVICE_WARD":
                s.service_continuity_pct = 15.0
                s.status = ServiceStatus.EVACUATING
            elif s.id in ("SERVICE_ICU", "SERVICE_ER"):
                s.service_continuity_pct = 90.0
            else:
                s.service_continuity_pct = 50.0

        service_risks = self._evaluate_mock_service_risks(mock_assets, mock_services, incident)
        breakdown = self.calculator.compute_resilience_breakdown(
            services=mock_services,
            assets=mock_assets,
            is_incident_active=True,
            baseline_score=94.5,
            service_risks=service_risks,
            recovery_time_min=120.0,
            load_shed_kw=200.0,
        )

        return StrategyResult(
            strategy_id="strat_f",
            strategy_name="Partial Ward Evacuation & Inter-Hospital Transfer",
            strategy_code="Strategy F",
            projected_resilience_score=breakdown.overall_score,
            resilience_breakdown=breakdown,
            icu_continuity_pct=90.0,
            emergency_continuity_pct=80.0,
            operating_theatre_continuity_pct=70.0,
            general_ward_continuity_pct=15.0,
            backup_runtime_remaining_hours=5.5,
            non_critical_load_shed_kw=200.0,
            estimated_recovery_time_min=120.0,
            clinical_safety_score=breakdown.sub_scores.service_continuity,
            infrastructure_stability_score=breakdown.sub_scores.stability_factor,
            resource_efficiency_score=breakdown.sub_scores.resource_conservation,
            implementation_latency_min=60.0,
            pros=[
                "Dramatically reduces physical demand on strained power and HVAC systems",
                "Removes non-critical patients from vulnerable environments",
            ],
            cons=[
                "Severe logistical friction and extensive inter-agency EMS coordination",
                "High transit risks during patient transfer",
                "Requires minimum 60-120 minutes before evacuation manifests load relief",
            ],
            risk_level="High",
        )

    # =========================================================================
    # Multi-Criteria & Pareto Optimality Helpers
    # =========================================================================

    def _compute_pareto_optimality(self, strategies: List[StrategyResult]) -> None:
        """Determines the Pareto efficiency frontier across (Resilience, ICU Continuity, Runtime Hours).
        A strategy is Pareto optimal if no other strategy strictly dominates it across all three metrics.
        """
        for s1 in strategies:
            is_dominated = False
            for s2 in strategies:
                if s1.strategy_id == s2.strategy_id:
                    continue
                # Dominance condition: s2 >= s1 on all criteria, and s2 > s1 on at least one
                s2_ge_s1 = (
                    s2.projected_resilience_score >= s1.projected_resilience_score
                    and s2.icu_continuity_pct >= s1.icu_continuity_pct
                    and s2.backup_runtime_remaining_hours >= s1.backup_runtime_remaining_hours
                )
                s2_gt_s1 = (
                    s2.projected_resilience_score > s1.projected_resilience_score
                    or s2.icu_continuity_pct > s1.icu_continuity_pct
                    or s2.backup_runtime_remaining_hours > s1.backup_runtime_remaining_hours
                )
                if s2_ge_s1 and s2_gt_s1:
                    is_dominated = True
                    break
            s1.pareto_optimal = not is_dominated

    def _classify_incident_type(self, source_id: str) -> str:
        """Categorizes incident root cause for targeted strategy adaptation."""
        sid = source_id.upper()
        if any(k in sid for k in ("GRID", "TRANSFORMER", "MAIN_BUS", "EMERGENCY_BUS", "ELECTRICAL")):
            return "electrical_outage"
        elif any(k in sid for k in ("CHILLER", "HVAC", "COOLING")):
            return "hvac_thermal_failure"
        elif any(k in sid for k in ("OXYGEN", "MANIFOLD", "GAS")):
            return "medical_gas_failure"
        elif any(k in sid for k in ("WATER", "PUMP")):
            return "water_supply_failure"
        return "general_infrastructure_disruption"

    def _evaluate_mock_service_risks(
        self,
        assets: List[InfrastructureAsset],
        services: List[HospitalService],
        incident: IncidentState,
    ) -> Optional[Dict[str, float]]:
        """Evaluates live service risks via Phase 1 Risk Engine."""
        try:
            asset_dict = {a.id: a for a in assets}
            service_dict = {s.id: s for s in services}
            summary = self.risk_engine.evaluate_incident_risk(
                assets=asset_dict,
                services=service_dict,
                incident=incident,
            )
            return {sid: s.risk_score for sid, s in summary.service_risks.items()}
        except Exception as exc:
            logger.warning("Could not evaluate mock service risks: %s", exc)
            return None

    def _generate_causal_explanation(
        self,
        recommended: StrategyResult,
        baseline: StrategyResult,
        incident_type: str,
    ) -> str:
        """Synthesizes human-readable decision rationale explaining why the recommended strategy won."""
        resilience_delta = recommended.delta_resilience or 0.0
        icu_delta = recommended.delta_icu or 0.0
        runtime_delta = recommended.delta_runtime_hours or 0.0

        return (
            f"Strategy '{recommended.strategy_name}' is ranked #1 recommended for {incident_type.replace('_', ' ').title()}. "
            f"It achieves a projected Resilience Index of {recommended.projected_resilience_score:.1f}/100 "
            f"(+{resilience_delta:.1f} vs unmitigated baseline), securing {recommended.icu_continuity_pct:.1f}% ICU life support "
            f"(+{icu_delta:.1f}%) and extending backup runtime to {recommended.backup_runtime_remaining_hours:.1f} hours (+{runtime_delta:.1f}h). "
            f"Key Trade-off: Non-critical circuits shed {recommended.non_critical_load_shed_kw:.0f} kW to safeguard emergency clinical delivery."
        )
