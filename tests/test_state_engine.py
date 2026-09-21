"""Unit and Integration tests for Asset State Transitions and State Engine."""
import pytest
from models.infrastructure import OperationalStatus, AssetType
from models.service import ServiceStatus
from simulation.state_engine import HospitalStateEngine, VALID_STATE_TRANSITIONS


@pytest.fixture
def state_engine():
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    return engine


def test_state_engine_loads_yaml_baseline(state_engine):
    """Verifies that all assets and services are properly loaded from YAML configuration."""
    assert len(state_engine.assets) >= 10
    assert len(state_engine.services) >= 5

    # Check key assets loaded with correct types and capacities
    assert "GRID_MAIN" in state_engine.assets
    assert state_engine.assets["GRID_MAIN"].type == AssetType.GRID
    assert state_engine.assets["GRID_MAIN"].nominal_capacity == 1200.0
    assert state_engine.assets["GRID_MAIN"].status == OperationalStatus.NORMAL

    assert "GEN_01" in state_engine.assets
    assert state_engine.assets["GEN_01"].type == AssetType.GENERATOR
    assert state_engine.assets["GEN_01"].status == OperationalStatus.OFFLINE

    assert "SERVICE_ICU" in state_engine.services
    assert state_engine.services["SERVICE_ICU"].criticality == 5
    assert state_engine.services["SERVICE_ICU"].service_continuity_pct == 100.0
    assert state_engine.services["SERVICE_ICU"].status == ServiceStatus.FULL_OPERATION


def test_valid_asset_state_transitions(state_engine):
    """Verifies valid operational state transitions adjust health and capacity."""
    # NORMAL -> DEGRADED
    ok = state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.DEGRADED, reason="Overheat warning")
    assert ok is True
    assert state_engine.assets["MAIN_BUS"].status == OperationalStatus.DEGRADED
    assert state_engine.assets["MAIN_BUS"].health_score <= 80.0
    assert state_engine.assets["MAIN_BUS"].available_capacity < state_engine.assets["MAIN_BUS"].nominal_capacity

    # DEGRADED -> CRITICAL
    ok = state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.CRITICAL, reason="Load strain")
    assert ok is True
    assert state_engine.assets["MAIN_BUS"].status == OperationalStatus.CRITICAL
    assert state_engine.assets["MAIN_BUS"].health_score <= 50.0

    # CRITICAL -> FAILED
    ok = state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.FAILED, reason="Circuit breaker trip")
    assert ok is True
    assert state_engine.assets["MAIN_BUS"].status == OperationalStatus.FAILED
    assert state_engine.assets["MAIN_BUS"].available_capacity == 0.0
    assert state_engine.assets["MAIN_BUS"].health_score == 0.0

    # FAILED -> RECOVERING -> NORMAL
    ok = state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.RECOVERING, reason="Breaker reset")
    assert ok is True
    assert state_engine.assets["MAIN_BUS"].status == OperationalStatus.RECOVERING
    assert state_engine.assets["MAIN_BUS"].health_score >= 70.0

    ok = state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.NORMAL, reason="Fully re-energized")
    assert ok is True
    assert state_engine.assets["MAIN_BUS"].status == OperationalStatus.NORMAL
    assert state_engine.assets["MAIN_BUS"].health_score == 100.0


def test_invalid_asset_state_transitions_blocked(state_engine):
    """Verifies invalid transitions are rejected when bypass_validation=False."""
    # OFFLINE cannot go directly to CRITICAL or FAILED
    ok = state_engine.transition_asset_state("GEN_01", OperationalStatus.CRITICAL)
    assert ok is False
    assert state_engine.assets["GEN_01"].status == OperationalStatus.OFFLINE

    # FAILED cannot go directly to NORMAL without RECOVERING or OFFLINE
    state_engine.transition_asset_state("GRID_MAIN", OperationalStatus.FAILED, bypass_validation=True)
    assert state_engine.assets["GRID_MAIN"].status == OperationalStatus.FAILED

    ok = state_engine.transition_asset_state("GRID_MAIN", OperationalStatus.NORMAL)
    assert ok is False
    assert state_engine.assets["GRID_MAIN"].status == OperationalStatus.FAILED


def test_telemetry_threshold_overload_trip(state_engine):
    """Verifies sensor telemetry updates trigger automatic state changes."""
    # 1. Overload trip (> 120% capacity)
    transformer = state_engine.assets["TRANSFORMER_01"]
    nom_cap = transformer.nominal_capacity
    transitions = state_engine.update_asset_telemetry("TRANSFORMER_01", {"current_load": nom_cap * 1.25})
    
    assert any(t["status"] == OperationalStatus.FAILED.value for t in transitions)
    assert transformer.status == OperationalStatus.FAILED

    # 2. Temperature warning trigger (> 65°C -> CRITICAL)
    state_engine.reset_to_baseline()
    transitions = state_engine.update_asset_telemetry("TRANSFORMER_01", {"temperature_c": 72.0})
    assert any(t["status"] == OperationalStatus.CRITICAL.value for t in transitions)
    assert state_engine.assets["TRANSFORMER_01"].status == OperationalStatus.CRITICAL


def test_telemetry_generator_fuel_thresholds(state_engine):
    """Verifies generator fuel level triggers critical state."""
    # Put generator starting
    state_engine.transition_asset_state("GEN_01", OperationalStatus.STARTING)
    
    # Fuel level drops to 15%
    transitions = state_engine.update_asset_telemetry("GEN_01", {"fuel_level_pct": 15.0})
    assert any(t["status"] == OperationalStatus.CRITICAL.value for t in transitions)
    assert state_engine.assets["GEN_01"].status == OperationalStatus.CRITICAL


def test_service_health_propagation_on_bus_failure(state_engine):
    """Verifies that clinical services degrade when upstream power infrastructure fails."""
    # Initial state: 100% continuity
    assert state_engine.services["SERVICE_ADMIN"].service_continuity_pct == 100.0
    assert state_engine.services["SERVICE_ADMIN"].status == ServiceStatus.FULL_OPERATION

    # Fail Main Bus
    state_engine.transition_asset_state("MAIN_BUS", OperationalStatus.FAILED, bypass_validation=True)
    state_engine.evaluate_services_health()

    # Admin should be completely shed (0%), Ward compromised (40%)
    assert state_engine.services["SERVICE_ADMIN"].service_continuity_pct == 0.0
    assert state_engine.services["SERVICE_ADMIN"].status == ServiceStatus.EVACUATING
    assert state_engine.services["SERVICE_ADMIN"].at_risk is True

    assert state_engine.services["SERVICE_WARD"].service_continuity_pct == 40.0
    assert state_engine.services["SERVICE_WARD"].status == ServiceStatus.CRITICAL_ONLY


def test_asset_recovery_workflow(state_engine):
    """Verifies recover_asset() restores a failed asset through recovering state."""
    state_engine.transition_asset_state("CHILLER_PLANT", OperationalStatus.FAILED, bypass_validation=True)
    assert state_engine.assets["CHILLER_PLANT"].status == OperationalStatus.FAILED

    ok = state_engine.recover_asset("CHILLER_PLANT")
    assert ok is True
    assert state_engine.assets["CHILLER_PLANT"].status == OperationalStatus.NORMAL
    assert state_engine.assets["CHILLER_PLANT"].health_score == 100.0


def test_transition_history_audit_logging(state_engine):
    """Verifies that all state transitions are recorded in transition_history."""
    initial_len = len(state_engine.transition_history)
    state_engine.transition_asset_state("TRANSFORMER_02", OperationalStatus.DEGRADED, reason="Thermal strain")
    
    assert len(state_engine.transition_history) == initial_len + 1
    last_log = state_engine.transition_history[-1]
    assert last_log["asset_id"] == "TRANSFORMER_02"
    assert last_log["old_status"] == "normal"
    assert last_log["new_status"] == "degraded"
    assert last_log["reason"] == "Thermal strain"
