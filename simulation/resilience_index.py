"""Resilience Index mathematical formulation and subscore engine."""
from typing import Dict, Any, List, Optional
from models.resilience import ResilienceIndexBreakdown, SubScores
from models.service import HospitalService
from models.infrastructure import InfrastructureAsset, OperationalStatus, AssetType

class ResilienceIndexCalculator:
    def __init__(self, weights: Optional[Dict[str, float]] = None):
        self.weights = weights or {
            "service_continuity": 0.40,
            "backup_margin": 0.25,
            "stability_factor": 0.20,
            "recovery_readiness": 0.15,
        }
        # Normalize weights to sum to 1.0
        total_w = sum(self.weights.values())
        self.weights = {k: v / total_w for k, v in self.weights.items()}

    def calculate_service_continuity_subscore(self, services: List[HospitalService]) -> float:
        """Calculates Sc: Criticality-weighted service continuity (0-100)."""
        if not services:
            return 100.0
        
        total_weight = 0.0
        weighted_sum = 0.0
        
        for s in services:
            # Criticality 5 has exponentially higher weight (5^2 = 25 vs 1^2 = 1)
            weight = float(s.criticality ** 2)
            total_weight += weight
            weighted_sum += (s.service_continuity_pct * weight)
            
        return round(weighted_sum / total_weight, 2) if total_weight > 0 else 100.0

    def calculate_backup_margin_subscore(self, assets: List[InfrastructureAsset]) -> float:
        """Calculates Rb: Available backup energy, battery & fuel headroom (0-100)."""
        gen_fuel_scores = []
        ups_battery_scores = []
        headroom_scores = []

        for a in assets:
            if a.fuel_level_pct is not None:
                gen_fuel_scores.append(a.fuel_level_pct)
            if a.battery_level_pct is not None:
                ups_battery_scores.append(a.battery_level_pct)
            if a.nominal_capacity > 0:
                headroom = max(0.0, (a.available_capacity - a.current_load) / a.nominal_capacity * 100.0)
                headroom_scores.append(min(100.0, headroom))

        avg_fuel = sum(gen_fuel_scores) / len(gen_fuel_scores) if gen_fuel_scores else 100.0
        avg_battery = sum(ups_battery_scores) / len(ups_battery_scores) if ups_battery_scores else 100.0
        avg_headroom = sum(headroom_scores) / len(headroom_scores) if headroom_scores else 100.0

        # Weighted combination: 40% battery, 40% fuel, 20% electrical headroom
        rb = 0.40 * avg_battery + 0.40 * avg_fuel + 0.20 * avg_headroom
        return round(max(0.0, min(100.0, rb)), 2)

    def calculate_stability_factor_subscore(self, assets: List[InfrastructureAsset]) -> float:
        """Calculates Ap factor (100 - Anomaly/Failure penalty)."""
        if not assets:
            return 100.0

        penalty = 0.0
        # Check if generators/buses are healthy and handling load
        buses_healthy = all(
            a.status == OperationalStatus.NORMAL 
            for a in assets if a.type in (AssetType.MAIN_BUS, AssetType.EMERGENCY_BUS)
        )
        gens_healthy = any(
            a.status == OperationalStatus.NORMAL and a.current_load > 0
            for a in assets if a.type == AssetType.GENERATOR
        )
        mitigated_by_backup = buses_healthy and gens_healthy

        for a in assets:
            if a.status == OperationalStatus.FAILED:
                if mitigated_by_backup and a.type in (AssetType.GRID, AssetType.TRANSFORMER):
                    # Outage is actively absorbed by running generators/buses
                    penalty += 8.0
                else:
                    penalty += 30.0 if a.redundancy_level <= 1 else 15.0
            elif a.status == OperationalStatus.CRITICAL:
                penalty += 12.0
            elif a.status == OperationalStatus.DEGRADED:
                penalty += 6.0

        stability = max(0.0, 100.0 - penalty)
        return round(stability, 2)

    def calculate_recovery_readiness_subscore(self, assets: List[InfrastructureAsset], is_incident_active: bool) -> float:
        """Calculates Lr: Recovery readiness & fast-switchover state."""
        # Check standby generator state
        gen_ready_score = 100.0
        gens = [a for a in assets if "generator" in a.id.lower() or "gen" in a.id.lower()]
        
        if gens:
            ready_gens = [g for g in gens if g.status in (OperationalStatus.NORMAL, OperationalStatus.STARTING, OperationalStatus.OFFLINE) and (g.fuel_level_pct or 0) > 20]
            gen_ready_score = (len(ready_gens) / len(gens)) * 100.0

        if is_incident_active:
            # Under active incident, switchover readiness is tested
            return round(max(10.0, gen_ready_score * 0.85), 2)
        return round(gen_ready_score, 2)

    def compute_resilience_breakdown(
        self,
        services: List[HospitalService],
        assets: List[InfrastructureAsset],
        is_incident_active: bool = False,
        baseline_score: float = 94.5
    ) -> ResilienceIndexBreakdown:
        """Computes full Resilience Index Breakdown with subscores."""
        sc = self.calculate_service_continuity_subscore(services)
        rb = self.calculate_backup_margin_subscore(assets)
        ap = self.calculate_stability_factor_subscore(assets)
        lr = self.calculate_recovery_readiness_subscore(assets, is_incident_active)

        overall = (
            self.weights["service_continuity"] * sc +
            self.weights["backup_margin"] * rb +
            self.weights["stability_factor"] * ap +
            self.weights["recovery_readiness"] * lr
        )
        overall = round(max(0.0, min(100.0, overall)), 1)

        # Status classification
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
            status_label = "CRITICAL"
            status_color = "#EF4444" # Red
        else:
            status_label = "EMERGENCY BLACKOUT"
            status_color = "#7F1D1D" # Dark Red

        return ResilienceIndexBreakdown(
            overall_score=overall,
            status_label=status_label,
            status_color=status_color,
            sub_scores=SubScores(
                service_continuity=sc,
                backup_margin=rb,
                stability_factor=ap,
                recovery_readiness=lr
            ),
            weights=self.weights,
            delta_from_baseline=round(overall - baseline_score, 1)
        )
