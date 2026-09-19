"""Unit tests for What-If strategy evaluation and ranking."""
import pytest
from simulation.state_engine import HospitalStateEngine
from models.incident import FailureInjectionRequest

def test_what_if_evaluation():
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
