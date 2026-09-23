"""Unit and integration tests for Phase 3 What-If Strategy Simulation Architecture."""
import pytest
from simulation.state_engine import HospitalStateEngine
from simulation.what_if_engine import WhatIfSimulationEngine
from simulation.resilience_index import ResilienceIndexCalculator
from models.incident import FailureInjectionRequest, IncidentState
from models.strategy import StrategyResult, WhatIfComparison


def test_what_if_evaluation():
    """Verify that What-If simulation evaluates 6 strategies and recommends Strategy C for grid failure."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    # Inject grid failure
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))

    comparison = engine.get_what_if_comparison()

    assert len(comparison.strategies) == 6
    assert comparison.recommended_strategy_id in ("strat_c", "C_dynamic_rebalance_hvac_throttle")

    # Top strategy should have higher score than baseline strategy A
    top_strat = comparison.strategies[0]
    strat_a = [s for s in comparison.strategies if s.strategy_id == "strat_a"][0]

    assert top_strat.projected_resilience_score > strat_a.projected_resilience_score
    assert top_strat.icu_continuity_pct == 100.0


def test_what_if_comparative_deltas():
    """Verify that comparative deltas (resilience, ICU, runtime) are computed relative to Strategy A."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))

    comparison = engine.get_what_if_comparison()
    strat_a = next(s for s in comparison.strategies if s.strategy_id == "strat_a")
    strat_c = next(s for s in comparison.strategies if s.strategy_id == "strat_c")

    # Strategy A deltas against itself should be 0.0
    assert strat_a.delta_resilience == 0.0
    assert strat_a.delta_icu == 0.0
    assert strat_a.delta_runtime_hours == 0.0

    # Strategy C should show positive gains over Strategy A
    assert strat_c.delta_resilience is not None and strat_c.delta_resilience > 0.0
    assert strat_c.delta_icu is not None and strat_c.delta_icu > 0.0
    assert strat_c.delta_runtime_hours is not None and strat_c.delta_runtime_hours > 0.0


def test_pareto_optimality_analysis():
    """Verify that Pareto efficiency frontier is determined across (Resilience, ICU, Runtime)."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))

    comparison = engine.get_what_if_comparison()

    # At least one strategy must be Pareto optimal
    optimal_strategies = [s for s in comparison.strategies if s.pareto_optimal]
    assert len(optimal_strategies) >= 1

    # Strategy A (dominated by Strategy C in score, ICU, and runtime) should not be Pareto optimal
    strat_a = next(s for s in comparison.strategies if s.strategy_id == "strat_a")
    assert strat_a.pareto_optimal is False


def test_multi_criteria_subscore_breakdowns():
    """Verify that all strategies contain bounded multi-criteria scores and canonical breakdown."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))

    comparison = engine.get_what_if_comparison()

    for s in comparison.strategies:
        assert 0.0 <= s.projected_resilience_score <= 100.0
        assert 0.0 <= s.icu_continuity_pct <= 100.0
        assert 0.0 <= s.emergency_continuity_pct <= 100.0
        assert 0.0 <= s.operating_theatre_continuity_pct <= 100.0
        assert 0.0 <= s.general_ward_continuity_pct <= 100.0
        assert s.backup_runtime_remaining_hours >= 0.0
        assert s.non_critical_load_shed_kw >= 0.0
        assert s.estimated_recovery_time_min >= 0.0

        # Enriched evaluation metrics
        assert s.clinical_safety_score is not None and 0.0 <= s.clinical_safety_score <= 100.0
        assert s.infrastructure_stability_score is not None and 0.0 <= s.infrastructure_stability_score <= 100.0
        assert s.resource_efficiency_score is not None and 0.0 <= s.resource_efficiency_score <= 100.0
        assert s.implementation_latency_min is not None and s.implementation_latency_min >= 0.0

        # Canonical components from Phase 2
        canonical = s.resilience_breakdown.sub_scores.canonical
        assert canonical is not None
        assert 0.0 <= canonical.c_continuity <= 1.0
        assert 0.0 <= canonical.a_availability <= 1.0
        assert 0.0 <= canonical.b_backup_margin <= 1.0


def test_incident_specific_adaptation_cooling():
    """Verify that What-If simulation engine adapts to HVAC / Chiller plant failures."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="CHILLER_PLANT"))

    comparison = engine.get_what_if_comparison()
    assert comparison.incident_type == "hvac_thermal_failure"
    assert comparison.recommended_strategy_id in ("strat_c", "strat_b")

    top_strat = comparison.strategies[0]
    assert top_strat.projected_resilience_score > comparison.unmitigated_baseline_score


def test_incident_specific_adaptation_medical_gas():
    """Verify that What-If simulation engine detects medical gas incident and evaluates Strategy E."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="OXYGEN_MANIFOLD"))

    comparison = engine.get_what_if_comparison()
    assert comparison.incident_type == "medical_gas_failure"

    strat_e = next(s for s in comparison.strategies if s.strategy_id == "strat_e")
    assert strat_e.backup_runtime_remaining_hours >= 72.0
    assert strat_e.icu_continuity_pct == 100.0


def test_decision_summary_and_explanation():
    """Verify that What-If comparison produces structured decision summary and causal explanation."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))

    comparison = engine.get_what_if_comparison()

    assert comparison.decision_summary is not None
    assert "recommended_strategy" in comparison.decision_summary
    assert "pareto_frontier" in comparison.decision_summary
    assert "trade_off_analysis" in comparison.decision_summary

    assert len(comparison.causal_explanation) > 20
    assert "Strategy" in comparison.causal_explanation
    assert "Resilience Index" in comparison.causal_explanation


def test_standalone_what_if_engine_robustness():
    """Verify that WhatIfSimulationEngine can run standalone without prior state engine injection."""
    calc = ResilienceIndexCalculator()
    engine = WhatIfSimulationEngine(calc)

    incident = IncidentState(
        incident_id="TEST-INC",
        is_active=True,
        source_asset_id="GRID_MAIN",
    )

    comparison = engine.evaluate_strategies(
        incident=incident,
        current_assets={},
        current_services={},
    )

    assert len(comparison.strategies) == 6
    assert comparison.recommended_strategy_id is not None
    assert 0.0 <= comparison.unmitigated_baseline_score <= 100.0
