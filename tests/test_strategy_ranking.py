"""Unit and integration tests for Phase 4: Strategy Comparison & Multi-Objective Ranking Logic."""
import pytest
from simulation.strategy_ranking import MultiObjectiveRankingEngine, MCDAProfile, PROFILE_WEIGHTS
from simulation.what_if_engine import WhatIfSimulationEngine
from simulation.resilience_index import ResilienceIndexCalculator
from simulation.state_engine import HospitalStateEngine
from models.strategy import (
    StrategyResult,
    MCDAProfile,
    StrategyComparisonMatrix,
    MultiObjectiveRankingResult,
)
from models.incident import FailureInjectionRequest, IncidentState
from models.resilience import ResilienceIndexBreakdown, SubScores, CanonicalComponents


def _create_mock_strategy(
    strategy_id: str,
    name: str,
    resilience: float,
    icu: float,
    runtime: float,
    ot: float = 80.0,
    recovery: float = 30.0,
    load_shed: float = 100.0,
    latency: float = 5.0,
) -> StrategyResult:
    """Helper to instantiate mock StrategyResult with specified objective metrics."""
    breakdown = ResilienceIndexBreakdown(
        overall_score=resilience,
        status_label="OPTIMAL" if resilience >= 85 else "STABLE",
        status_color="#10B981",
        sub_scores=SubScores(
            service_continuity=icu,
            backup_margin=75.0,
            stability_factor=resilience,
            recovery_readiness=80.0,
            resource_conservation=max(0.0, 100.0 - (load_shed / 5.0)),
            canonical=CanonicalComponents(
                c_continuity=max(0.0, min(1.0, icu / 100.0)),
                a_availability=max(0.0, min(1.0, resilience / 100.0)),
                b_backup_margin=0.75,
                t_recovery_penalty=min(1.0, max(0.0, recovery / 120.0)),
                u_resource_penalty=min(1.0, max(0.0, load_shed / 500.0)),
                raw_score=resilience,
            ),
        ),
    )
    return StrategyResult(
        strategy_id=strategy_id,
        strategy_name=name,
        strategy_code=f"Strategy {strategy_id[-1].upper()}",
        projected_resilience_score=resilience,
        resilience_breakdown=breakdown,
        icu_continuity_pct=icu,
        emergency_continuity_pct=95.0,
        operating_theatre_continuity_pct=ot,
        general_ward_continuity_pct=50.0,
        backup_runtime_remaining_hours=runtime,
        non_critical_load_shed_kw=load_shed,
        estimated_recovery_time_min=recovery,
        clinical_safety_score=icu,
        infrastructure_stability_score=resilience,
        resource_efficiency_score=max(0.0, 100.0 - (load_shed / 5.0)),
        implementation_latency_min=latency,
        pros=["Mock Pro"],
        cons=["Mock Con"],
        risk_level="Low" if resilience >= 80 else "Medium",
    )


# =============================================================================
# 1. TOPSIS Multi-Criteria Ranking Tests
# =============================================================================

def test_topsis_calculation_ranking():
    """Verify TOPSIS calculates valid relative closeness scores in [0.0, 1.0] and prefers superior strategies."""
    engine = MultiObjectiveRankingEngine()

    strat_high = _create_mock_strategy("strat_c", "High Performance", resilience=92.0, icu=100.0, runtime=6.5, ot=95.0, recovery=15.0, load_shed=120.0, latency=2.0)
    strat_mid = _create_mock_strategy("strat_b", "Medium Performance", resilience=75.0, icu=95.0, runtime=4.5, ot=40.0, recovery=45.0, load_shed=380.0, latency=5.0)
    strat_low = _create_mock_strategy("strat_a", "Low Performance", resilience=45.0, icu=60.0, runtime=0.5, ot=30.0, recovery=180.0, load_shed=0.0, latency=0.0)

    strategies = [strat_high, strat_mid, strat_low]
    topsis_scores = engine.calculate_topsis_scores(strategies, MCDAProfile.BALANCED)

    assert len(topsis_scores) == 3
    for sid, score in topsis_scores.items():
        assert 0.0 <= score <= 1.0

    # strat_c should have higher TOPSIS relative closeness than strat_b and strat_a
    assert topsis_scores["strat_c"] > topsis_scores["strat_b"]
    assert topsis_scores["strat_b"] > topsis_scores["strat_a"]


# =============================================================================
# 2. Pareto Dominance & Frontier Tests
# =============================================================================

def test_pareto_dominance_and_frontiers():
    """Verify Pareto dominance logic correctly detects dominated solutions and identifies Frontier 1."""
    engine = MultiObjectiveRankingEngine()

    # strat_c dominates strat_a across all metrics
    strat_c = _create_mock_strategy("strat_c", "Smart Rebalance", resilience=90.0, icu=100.0, runtime=6.0, ot=95.0, recovery=20.0, load_shed=120.0, latency=2.0)
    strat_d = _create_mock_strategy("strat_d", "Mobile Generator", resilience=85.0, icu=95.0, runtime=12.0, ot=80.0, recovery=40.0, load_shed=50.0, latency=35.0)
    strat_a = _create_mock_strategy("strat_a", "Do Nothing", resilience=40.0, icu=50.0, runtime=0.4, ot=20.0, recovery=180.0, load_shed=0.0, latency=0.0)

    pareto_info = engine.compute_pareto_frontiers([strat_c, strat_d, strat_a])

    assert pareto_info["strat_c"]["pareto_rank"] == 1
    assert pareto_info["strat_d"]["pareto_rank"] == 1
    assert pareto_info["strat_a"]["pareto_rank"] > 1

    # strat_a must be dominated by strat_c
    assert "strat_c" in pareto_info["strat_a"]["dominated_by"]
    assert "strat_a" in pareto_info["strat_c"]["dominates"]


# =============================================================================
# 3. Profile Sensitivity Analysis Tests
# =============================================================================

def test_profile_sensitivity_analysis():
    """Verify that multi-attribute utility changes under different operational profiles."""
    engine = MultiObjectiveRankingEngine()

    strat_c = _create_mock_strategy("strat_c", "Smart Rebalance", resilience=92.0, icu=100.0, runtime=6.0, ot=95.0)
    strat_d = _create_mock_strategy("strat_d", "Mobile Generator", resilience=86.0, icu=92.0, runtime=14.0, ot=80.0)
    strat_e = _create_mock_strategy("strat_e", "O2 Conservation", resilience=88.0, icu=100.0, runtime=96.0, ot=85.0)

    strategies = [strat_c, strat_d, strat_e]
    utilities, winners = engine.evaluate_profile_sensitivity(strategies)

    # Check that all 4 profiles are populated
    for profile in MCDAProfile:
        assert profile.value in winners
        for s in strategies:
            assert profile.value in utilities[s.strategy_id]
            assert 0.0 <= utilities[s.strategy_id][profile.value] <= 100.0

    # Under RESOURCE_CONSERVATION, extreme runtime strategy (strat_e) should score very high
    assert utilities["strat_e"][MCDAProfile.RESOURCE_CONSERVATION.value] > 70.0


# =============================================================================
# 4. Pairwise Head-to-Head Comparisons Tests
# =============================================================================

def test_pairwise_comparison_matrix():
    """Verify that pairwise comparisons compute accurate deltas and descriptive summaries."""
    engine = MultiObjectiveRankingEngine()

    strat_c = _create_mock_strategy("strat_c", "Strategy C", resilience=90.0, icu=100.0, runtime=6.0, recovery=20.0, load_shed=120.0)
    strat_b = _create_mock_strategy("strat_b", "Strategy B", resilience=70.0, icu=95.0, runtime=4.5, recovery=45.0, load_shed=380.0)

    comparisons = engine.generate_pairwise_comparisons([strat_c, strat_b])

    assert len(comparisons) == 1
    pair = comparisons[0]
    assert pair.strategy_a_id == "strat_c"
    assert pair.strategy_b_id == "strat_b"
    assert pair.delta_resilience == 20.0
    assert pair.delta_icu_pct == 5.0
    assert pair.delta_runtime_hours == 1.5
    assert pair.winner_id == "strat_c"
    assert "Strategy C achieves a +20.0 higher Resilience Index" in pair.advantage_summary


# =============================================================================
# 5. Full Strategy Comparison Matrix Tests
# =============================================================================

def test_strategy_comparison_matrix_generation():
    """Verify that compare_and_rank_strategies generates a complete, valid StrategyComparisonMatrix."""
    engine = MultiObjectiveRankingEngine()

    strategies = [
        _create_mock_strategy("strat_a", "Strategy A", resilience=42.0, icu=65.0, runtime=0.4, recovery=180.0, load_shed=0.0),
        _create_mock_strategy("strat_b", "Strategy B", resilience=72.0, icu=100.0, runtime=4.8, recovery=45.0, load_shed=380.0),
        _create_mock_strategy("strat_c", "Strategy C", resilience=91.0, icu=100.0, runtime=6.2, recovery=20.0, load_shed=120.0),
        _create_mock_strategy("strat_d", "Strategy D", resilience=84.0, icu=95.0, runtime=12.0, recovery=40.0, load_shed=50.0),
        _create_mock_strategy("strat_e", "Strategy E", resilience=86.0, icu=100.0, runtime=96.0, recovery=15.0, load_shed=60.0),
        _create_mock_strategy("strat_f", "Strategy F", resilience=65.0, icu=90.0, runtime=5.5, recovery=120.0, load_shed=200.0),
    ]

    matrix = engine.compare_and_rank_strategies(strategies, incident_id="INC-TEST-001")

    assert isinstance(matrix, StrategyComparisonMatrix)
    assert matrix.incident_id == "INC-TEST-001"
    assert len(matrix.ranking_results) == 6
    assert len(matrix.pairwise_comparisons) == 15 # 6 * 5 / 2 = 15 pairs
    assert len(matrix.pareto_frontier_ids) >= 1

    # Verify ranking results have consistent ranks
    ranks = [res.final_rank for res in matrix.ranking_results]
    assert ranks == [1, 2, 3, 4, 5, 6]

    # Winner must be top recommended
    assert matrix.top_recommended_strategy_id == matrix.ranking_results[0].strategy_id
    assert len(matrix.recommendation_rationale) > 20

    # Ensure StrategyResult instances were updated
    for s in strategies:
        assert s.topsis_score is not None
        assert 0.0 <= s.topsis_score <= 1.0
        assert s.pareto_rank is not None and s.pareto_rank >= 1
        assert s.recommendation_rank >= 1


# =============================================================================
# 6. End-to-End What-If Simulation Integration Tests
# =============================================================================

def test_what_if_simulation_engine_integration_with_ranking():
    """Verify that WhatIfSimulationEngine populates comparison_matrix and TOPSIS scores on live simulation."""
    calc = ResilienceIndexCalculator()
    ranking_engine = MultiObjectiveRankingEngine()
    what_if = WhatIfSimulationEngine(calculator=calc, ranking_engine=ranking_engine)

    incident = IncidentState(
        incident_id="INC-LIVE-GRID",
        is_active=True,
        source_asset_id="GRID_MAIN",
    )

    comparison = what_if.evaluate_strategies(
        incident=incident,
        current_assets={},
        current_services={},
    )

    assert comparison.comparison_matrix is not None
    matrix = comparison.comparison_matrix
    assert len(matrix.ranking_results) == 6
    assert len(matrix.pairwise_comparisons) == 15
    assert matrix.top_recommended_strategy_id == comparison.recommended_strategy_id

    # Verify decision summary includes TOPSIS closeness
    assert "topsis_closeness" in comparison.decision_summary
    assert comparison.decision_summary["topsis_closeness"] is not None

    # Check that live strategies have Pareto and TOPSIS attributes
    for s in comparison.strategies:
        assert s.topsis_score is not None
        assert s.pareto_rank is not None
        assert isinstance(s.pareto_optimal, bool)


# =============================================================================
# 7. Edge Cases & Robustness
# =============================================================================

def test_empty_strategies_robustness():
    """Verify ranking engine handles empty strategy list without crashing."""
    engine = MultiObjectiveRankingEngine()
    matrix = engine.compare_and_rank_strategies([], incident_id="INC-EMPTY")
    assert matrix.top_recommended_strategy_id == ""
    assert len(matrix.ranking_results) == 0


def test_single_strategy_robustness():
    """Verify ranking engine handles a single strategy input."""
    engine = MultiObjectiveRankingEngine()
    single = _create_mock_strategy("strat_solo", "Solo Strategy", resilience=85.0, icu=95.0, runtime=5.0)

    matrix = engine.compare_and_rank_strategies([single], incident_id="INC-SOLO")
    assert matrix.top_recommended_strategy_id == "strat_solo"
    assert len(matrix.ranking_results) == 1
    assert matrix.ranking_results[0].final_rank == 1
    assert matrix.ranking_results[0].is_pareto_optimal is True
