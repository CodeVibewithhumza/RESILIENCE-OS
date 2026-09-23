"""Comprehensive Scenario Testing Suite for ResilienceOS Disaster & Stress Scenarios."""
import json
from pathlib import Path
import pytest

from simulation.state_engine import HospitalStateEngine
from models.incident import FailureInjectionRequest, IncidentSeverity
from models.infrastructure import OperationalStatus
from models.service import ServiceStatus


@pytest.fixture
def state_engine():
    """Provides a fresh, reset state engine for each scenario test."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    return engine


def test_load_all_scenario_definitions():
    """Validates that all scenario JSON files in scenarios/ directory have valid schemas."""
    scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
    assert scenarios_dir.exists(), "scenarios directory must exist"

    scenario_files = list(scenarios_dir.glob("*.json"))
    assert len(scenario_files) >= 6, f"Expected at least 6 scenarios, found {len(scenario_files)}"

    for s_file in scenario_files:
        with open(s_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        assert "scenario_id" in data, f"Missing scenario_id in {s_file.name}"
        assert "name" in data, f"Missing name in {s_file.name}"
        assert "target_asset" in data, f"Missing target_asset in {s_file.name}"
        assert "failure_type" in data, f"Missing failure_type in {s_file.name}"
        assert "severity" in data, f"Missing severity in {s_file.name}"


def test_scenario_main_power_outage(state_engine):
    """Scenario 1: Main Utility Grid Outage with ATS switchover and heatwave modifier."""
    scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
    with open(scenarios_dir / "scenario_main_power.json", "r", encoding="utf-8") as f:
        config = json.load(f)

    # 1. Baseline check
    base_resilience = state_engine.get_resilience_breakdown()
    assert base_resilience.overall_score >= 85.0

    # 2. Inject failure
    req = FailureInjectionRequest(
        asset_id=config["target_asset"],
        failure_type=config["failure_type"],
        severity=IncidentSeverity.HIGH,
        compound_heatwave=config.get("modifiers", {}).get("compound_heatwave", False),
    )
    incident = state_engine.inject_failure(req)

    assert incident.is_active is True
    assert incident.source_asset_id == "GRID_MAIN"
    assert state_engine.assets["GRID_MAIN"].status == OperationalStatus.FAILED
    assert "TRANSFORMER_01" in incident.affected_asset_ids
    assert "TRANSFORMER_02" in incident.affected_asset_ids

    # 3. Verify resilience impact
    post_resilience = state_engine.get_resilience_breakdown()
    assert post_resilience.overall_score < base_resilience.overall_score

    # 4. Verify What-If strategies
    comparison = state_engine.get_what_if_comparison()
    assert len(comparison.strategies) >= 6
    assert comparison.recommended_strategy_id in ("strat_c", "strat_b")


def test_scenario_oxygen_pressure_drop(state_engine):
    """Scenario 2: Medical Gas & Oxygen Manifold Pressure Drop."""
    req = FailureInjectionRequest(
        asset_id="OXYGEN_MANIFOLD",
        failure_type="pressure_loss",
        severity=IncidentSeverity.CATASTROPHIC,
    )
    incident = state_engine.inject_failure(req)

    assert incident.is_active is True
    assert state_engine.assets["OXYGEN_MANIFOLD"].status == OperationalStatus.FAILED
    assert "SERVICE_ICU" in incident.affected_service_ids or "SERVICE_OT" in incident.affected_service_ids

    # Risk evaluation
    risk_summary = state_engine.get_incident_risk()
    assert risk_summary.overall_risk_score > 0.30

    # What-If evaluation
    comparison = state_engine.get_what_if_comparison()
    assert comparison.incident_id == incident.incident_id


def test_scenario_chiller_thermal_excursion(state_engine):
    """Scenario 3: Central Chiller Plant Compressor Failure during Summer Heatwave."""
    scenarios_dir = Path(__file__).resolve().parent.parent / "scenarios"
    with open(scenarios_dir / "scenario_chiller_failure.json", "r", encoding="utf-8") as f:
        config = json.load(f)

    req = FailureInjectionRequest(
        asset_id=config["target_asset"],
        failure_type=config["failure_type"],
        severity=IncidentSeverity.HIGH,
        compound_heatwave=True,
    )
    incident = state_engine.inject_failure(req)

    assert state_engine.assets["CHILLER_PLANT"].status == OperationalStatus.FAILED
    resilience = state_engine.get_resilience_breakdown()
    assert resilience.overall_score < 80.0


def test_scenario_water_pump_failure(state_engine):
    """Scenario 4: Primary Water Booster Pump Failure & Pressure Loss."""
    req = FailureInjectionRequest(
        asset_id="WATER_PUMP_STATION",
        failure_type="pump_cavitation",
        severity=IncidentSeverity.MEDIUM,
    )
    incident = state_engine.inject_failure(req)

    assert state_engine.assets["WATER_PUMP_STATION"].status == OperationalStatus.FAILED
    resilience = state_engine.get_resilience_breakdown()
    assert resilience.overall_score < 95.0


def test_scenario_compound_grid_and_generator_lockout(state_engine):
    """Scenario 5: Compound Grid Failure + Emergency Generator 01 Failure."""
    # 1. Fail Primary Generator
    state_engine.inject_failure(FailureInjectionRequest(asset_id="GEN_01", failure_type="starter_lockout"))
    # 2. Fail Grid
    state_engine.inject_failure(
        FailureInjectionRequest(asset_id="GRID_MAIN", failure_type="outage", compound_heatwave=True)
    )

    resilience = state_engine.get_resilience_breakdown()
    assert resilience.overall_score < 65.0  # Compound degradation

    # What-if should evaluate strategies
    comparison = state_engine.get_what_if_comparison()
    assert len(comparison.strategies) >= 6


def test_scenario_transformer_thermal_trip(state_engine):
    """Scenario 6: Main Transformer 01 Overload and Trip."""
    req = FailureInjectionRequest(
        asset_id="TRANSFORMER_01",
        failure_type="transformer_thermal_trip",
        severity=IncidentSeverity.HIGH,
    )
    incident = state_engine.inject_failure(req)

    assert state_engine.assets["TRANSFORMER_01"].status == OperationalStatus.FAILED
    assert "MAIN_BUS" in incident.affected_asset_ids
