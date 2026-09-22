"""Resilience Index canonical mathematical formulation and bounded multi-criteria evaluation engine."""
from typing import Dict, Any, List, Optional
from models.resilience import ResilienceIndexBreakdown, SubScores, CanonicalComponents
from models.service import HospitalService
from models.infrastructure import InfrastructureAsset, OperationalStatus, AssetType
import logging

logger = logging.getLogger(__name__)


class ResilienceIndexCalculator:
    """Computes the project-defined, bounded Resilience Index R in [0, 100] per the master specification:

        R = 100 * ( w1*C + w2*A + w3*B - w4*T_norm - w5*U_norm )

    Where:
        C      = Critical-service continuity (weighted avg across ICU, OT, ER delivery & risk) in [0, 1]
        A      = Infrastructure availability (fraction of assets in normal/degraded) in [0, 1]
        B      = Backup margin remaining (battery, fuel, and electrical headroom) in [0, 1]
        T_norm = Normalized recovery-time penalty (relative to reference max 120 min) in [0, 1]
        U_norm = Normalized resource-use / load shed penalty (relative to reference 500 kW) in [0, 1]
    """

    def __init__(
        self,
        weights: Optional[Dict[str, float]] = None,
        reference_recovery_time_min: float = 120.0,
        reference_max_load_shed_kw: float = 500.0,
    ):
        # Master spec baseline weights: w1=0.40, w2=0.20, w3=0.15, w4=0.15, w5=0.10
        self.weights = weights or {
            "service_continuity": 0.40,
            "backup_margin": 0.25,
            "stability_factor": 0.20,
            "recovery_readiness": 0.15,
        }

        # Canonical weights mapping
        self.w_c = float(self.weights.get("service_continuity", 0.40))
        self.w_a = float(self.weights.get("infrastructure_availability", self.weights.get("stability_factor", 0.20)))
        self.w_b = float(self.weights.get("backup_margin", 0.15))
        self.w_t = float(self.weights.get("recovery_time_penalty", self.weights.get("recovery_readiness", 0.15)))
        self.w_u = float(self.weights.get("resource_use_penalty", 0.10))

        # Normalization factor for positive terms (sum of positive weights)
        self.w_pos_sum = max(0.001, self.w_c + self.w_a + self.w_b)

        self.t_ref_max = max(1.0, reference_recovery_time_min)
        self.u_ref_max = max(1.0, reference_max_load_shed_kw)

    # =========================================================================
    # 1. Canonical Term Calculations (Bounded in [0.0, 1.0])
    # =========================================================================

    def calculate_c_continuity(
        self,
        services: List[HospitalService],
        service_risks: Optional[Dict[str, float]] = None
    ) -> float:
        """Calculates C: Critical-service continuity in [0.0, 1.0].
        Weights heavily on life-support clinical services (ICU, OT, ER: criticality >= 4).
        """
        if not services:
            return 1.0

        # Filter to clinical critical services (ICU, OT, ER)
        crit_services = [s for s in services if s.criticality >= 4]
        if not crit_services:
            crit_services = services

        total_weight = 0.0
        weighted_sum = 0.0

        for s in crit_services:
            weight = float(s.criticality ** 2)
            total_weight += weight

            # Delivery continuity (0.0 - 1.0)
            delivery_ratio = max(0.0, min(1.0, s.service_continuity_pct / 100.0))

            # If risk score provided, incorporate risk attenuation (1 - risk)
            if service_risks and s.id in service_risks:
                risk_val = max(0.0, min(1.0, service_risks[s.id]))
                effective_continuity = delivery_ratio * (1.0 - (0.5 * risk_val))
            else:
                effective_continuity = delivery_ratio

            weighted_sum += (effective_continuity * weight)

        if total_weight <= 0.0:
            return 1.0

        c = weighted_sum / total_weight
        return round(max(0.0, min(1.0, c)), 4)

    def calculate_a_availability(self, assets: List[InfrastructureAsset]) -> float:
        """Calculates A: Infrastructure availability in [0.0, 1.0].
        Fraction of modeled assets in NORMAL or DEGRADED, with explicit denominator.
        """
        if not assets:
            return 1.0

        n_total = len(assets)
        points = 0.0

        # Check if generators/emergency buses actively absorb the failure
        buses_healthy = any(
            a.status in (OperationalStatus.NORMAL, OperationalStatus.DEGRADED)
            for a in assets if a.type == AssetType.EMERGENCY_BUS
        )
        gens_running = any(
            a.status == OperationalStatus.NORMAL and a.current_load > 0
            for a in assets if a.type == AssetType.GENERATOR
        )
        mitigated_by_backup = buses_healthy and gens_running

        for a in assets:
            if a.status == OperationalStatus.NORMAL:
                points += 1.0
            elif a.status == OperationalStatus.RECOVERING:
                points += 0.80
            elif a.status == OperationalStatus.STARTING:
                points += 0.60
            elif a.status == OperationalStatus.DEGRADED:
                points += 0.50
            elif a.status == OperationalStatus.OFFLINE:
                points += 0.35 # Standby assets available on command
            elif a.status == OperationalStatus.CRITICAL:
                points += 0.15
            elif a.status == OperationalStatus.FAILED:
                # If grid/transformer failed but active generator absorbed load
                if mitigated_by_backup and a.type in (AssetType.GRID, AssetType.TRANSFORMER):
                    points += 0.50 # Partial credit for absorbed outage
                else:
                    points += 0.0

        a_score = points / n_total
        return round(max(0.0, min(1.0, a_score)), 4)

    def calculate_b_backup_margin(self, assets: List[InfrastructureAsset]) -> float:
        """Calculates B: Backup margin remaining in [0.0, 1.0].
        Synthesizes generator fuel reserve, UPS battery reserve, and electrical capacity headroom.
        """
        if not assets:
            return 1.0

        gen_fuel_ratios: List[float] = []
        ups_battery_ratios: List[float] = []
        headroom_ratios: List[float] = []

        for a in assets:
            if a.fuel_level_pct is not None:
                gen_fuel_ratios.append(max(0.0, min(1.0, a.fuel_level_pct / 100.0)))
            if a.battery_level_pct is not None:
                ups_battery_ratios.append(max(0.0, min(1.0, a.battery_level_pct / 100.0)))
            if a.nominal_capacity > 0:
                headroom = max(0.0, (a.available_capacity - a.current_load) / a.nominal_capacity)
                headroom_ratios.append(min(1.0, headroom))

        avg_fuel = sum(gen_fuel_ratios) / len(gen_fuel_ratios) if gen_fuel_ratios else 1.0
        avg_battery = sum(ups_battery_ratios) / len(ups_battery_ratios) if ups_battery_ratios else 1.0
        avg_headroom = sum(headroom_ratios) / len(headroom_ratios) if headroom_ratios else 1.0

        # Weighted combination: 40% battery, 40% fuel, 20% electrical headroom
        b = 0.40 * avg_battery + 0.40 * avg_fuel + 0.20 * avg_headroom
        return round(max(0.0, min(1.0, b)), 4)

    def calculate_t_recovery_penalty(
        self,
        assets: List[InfrastructureAsset],
        is_incident_active: bool = False,
        recovery_time_min: Optional[float] = None
    ) -> float:
        """Calculates T_norm: Normalized recovery-time penalty in [0.0, 1.0].
        Duration until normal operation relative to configured reference max (120 min), capped at 1.
        """
        if recovery_time_min is not None:
            t_norm = max(0.0, recovery_time_min) / self.t_ref_max
            return round(min(1.0, t_norm), 4)

        if not is_incident_active:
            return 0.0

        # Estimate recovery penalty from asset states when explicit duration is omitted
        gens = [a for a in assets if a.type == AssetType.GENERATOR]
        gen_delay_penalty = 0.0
        if gens and all(g.status in (OperationalStatus.OFFLINE, OperationalStatus.STARTING) for g in gens):
            gen_delay_penalty = 0.20 # Standby transition latency

        ups_assets = [a for a in assets if a.type == AssetType.UPS]
        battery_exhaustion_penalty = 0.0
        for u in ups_assets:
            if u.runtime_remaining_min is not None and u.runtime_remaining_min <= 45.0:
                battery_exhaustion_penalty = max(
                    battery_exhaustion_penalty,
                    (45.0 - u.runtime_remaining_min) / 45.0 * 0.40
                )

        est_penalty = 0.15 + gen_delay_penalty + battery_exhaustion_penalty
        return round(max(0.0, min(1.0, est_penalty)), 4)

    def calculate_u_resource_penalty(
        self,
        load_shed_kw: Optional[float] = None,
        assets: Optional[List[InfrastructureAsset]] = None,
        services: Optional[List[HospitalService]] = None,
    ) -> float:
        """Calculates U_norm: Normalized resource-use / load shed penalty in [0.0, 1.0].
        Non-critical load shed relative to configured reference capacity (500 kW), capped at 1.
        """
        if load_shed_kw is not None:
            u_norm = max(0.0, load_shed_kw) / self.u_ref_max
            return round(min(1.0, u_norm), 4)

        # If non-critical services (Admin, Ward, etc.) have curtailed continuity
        if services:
            non_crit_curtailed = sum(
                s.required_power_kw * (1.0 - max(0.0, min(100.0, s.service_continuity_pct)) / 100.0)
                for s in services
                if s.criticality < 4
            )
            if non_crit_curtailed > 0:
                return round(min(1.0, non_crit_curtailed / self.u_ref_max), 4)

        # If load_shed_kw is not explicitly passed, inspect degraded bus loads
        if assets:
            main_bus = next((a for a in assets if a.type == AssetType.MAIN_BUS), None)
            if main_bus and main_bus.nominal_capacity > 0 and main_bus.status in (OperationalStatus.DEGRADED, OperationalStatus.CRITICAL, OperationalStatus.FAILED):
                curtailed = max(0.0, main_bus.nominal_capacity - main_bus.available_capacity)
                if curtailed > 0:
                    return round(min(1.0, curtailed / self.u_ref_max), 4)

        return 0.0

    # =========================================================================
    # 2. Full Composite Breakdown Computation
    # =========================================================================

    def compute_resilience_breakdown(
        self,
        services: List[HospitalService],
        assets: List[InfrastructureAsset],
        is_incident_active: bool = False,
        baseline_score: float = 94.5,
        service_risks: Optional[Dict[str, float]] = None,
        recovery_time_min: Optional[float] = None,
        load_shed_kw: Optional[float] = None
    ) -> ResilienceIndexBreakdown:
        """Computes full Resilience Index Breakdown with subscores, canonical [0, 1] terms,
        and strictly bounds the composite score to [0.0, 100.0].
        """
        c = self.calculate_c_continuity(services, service_risks)
        a = self.calculate_a_availability(assets)
        b = self.calculate_b_backup_margin(assets)
        t_norm = self.calculate_t_recovery_penalty(assets, is_incident_active, recovery_time_min)
        u_norm = self.calculate_u_resource_penalty(load_shed_kw, assets, services)

        # Normalized formulation:
        # Base Score is normalized across the positive weight sum
        base_score = (self.w_c * c + self.w_a * a + self.w_b * b) / self.w_pos_sum
        penalty = self.w_t * t_norm + self.w_u * u_norm

        raw_score = 100.0 * (base_score - penalty)
        overall = round(max(0.0, min(100.0, raw_score)), 1)

        # Status classification matching Master Documentation (Part XI, Section 107)
        if overall >= 85.0:
            status_label = "OPTIMAL"
            status_color = "#10B981" # Emerald Green
        elif overall >= 70.0:
            status_label = "STABLE"
            status_color = "#3B82F6" # Blue
        elif overall >= 50.0:
            status_label = "DEGRADED"
            status_color = "#F59E0B" # Amber
        elif overall >= 30.0:
            status_label = "AT RISK"
            status_color = "#EF4444" # Red
        else:
            status_label = "CRITICAL BLACKOUT"
            status_color = "#7F1D1D" # Dark Red

        # Scaled subscores (0-100) for backward-compatible gauge and UI consumption
        sc_100 = round(c * 100.0, 2)
        rb_100 = round(b * 100.0, 2)
        ap_100 = round(a * 100.0, 2)
        lr_100 = round(max(0.0, (1.0 - t_norm) * 100.0), 2)
        uc_100 = round(max(0.0, (1.0 - u_norm) * 100.0), 2)

        canonical = CanonicalComponents(
            c_continuity=c,
            a_availability=a,
            b_backup_margin=b,
            t_recovery_penalty=t_norm,
            u_resource_penalty=u_norm,
            raw_score=round(raw_score, 2),
        )
        logger.info(
            "Resilience Index computed | service_count=%d | "
            "asset_count=%d | incident_active=%s | "
            "score=%.1f | delta=%.1f",
            len(services),
            len(assets),
            is_incident_active,
            overall,
            round(overall - baseline_score, 1),
        )

        return ResilienceIndexBreakdown(
            overall_score=overall,
            status_label=status_label,
            status_color=status_color,
            sub_scores=SubScores(
                service_continuity=sc_100,
                backup_margin=rb_100,
                stability_factor=ap_100,
                recovery_readiness=lr_100,
                resource_conservation=uc_100,
                canonical=canonical,
            ),
            weights=self.weights,
            delta_from_baseline=round(overall - baseline_score, 1),
            mathematical_formula="R = 100 * (w1*C + w2*A + w3*B - w4*T_norm - w5*U_norm)",
        )

    # =========================================================================
    # 3. Backward-Compatible Subscore Wrappers
    # =========================================================================

    def calculate_service_continuity_subscore(
        self,
        services: List[HospitalService],
        service_risks: Optional[Dict[str, float]] = None
    ) -> float:
        """Returns Sc in [0-100]."""
        return round(self.calculate_c_continuity(services, service_risks) * 100.0, 2)

    def calculate_backup_margin_subscore(self, assets: List[InfrastructureAsset]) -> float:
        """Returns Rb in [0-100]."""
        return round(self.calculate_b_backup_margin(assets) * 100.0, 2)

    def calculate_stability_factor_subscore(self, assets: List[InfrastructureAsset]) -> float:
        """Returns Ap in [0-100]."""
        return round(self.calculate_a_availability(assets) * 100.0, 2)

    def calculate_recovery_readiness_subscore(
        self,
        assets: List[InfrastructureAsset],
        is_incident_active: bool = False,
        recovery_time_min: Optional[float] = None
    ) -> float:
        """Returns Lr in [0-100]."""
        t_norm = self.calculate_t_recovery_penalty(assets, is_incident_active, recovery_time_min)
        return round(max(0.0, (1.0 - t_norm) * 100.0), 2)
