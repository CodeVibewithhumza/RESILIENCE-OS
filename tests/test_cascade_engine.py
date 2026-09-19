"""Unit tests for Cascade Propagation & State transitions."""
import pytest
from simulation.state_engine import HospitalStateEngine
from models.incident import FailureInjectionRequest, IncidentSeverity
from models.infrastructure import OperationalStatus

def test_failure_injection_cascade():
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    
    initial_resilience = engine.get_resilience_breakdown().overall_score
    assert initial_resilience > 85.0
    
    # Inject failure on Grid
    request = FailureInjectionRequest(
        asset_id="GRID_MAIN",
        failure_type="complete_outage",
        severity=IncidentSeverity.HIGH
    )
    incident = engine.inject_failure(request)
    
    assert incident.is_active is True
    assert "GRID_MAIN" in incident.affected_asset_ids
    assert "MAIN_BUS" in incident.affected_asset_ids
    assert "SERVICE_ADMIN" in incident.affected_service_ids
    assert "SERVICE_ICU" in incident.affected_service_ids
    
    # Check that Resilience Index drops significantly
    post_incident_resilience = engine.get_resilience_breakdown().overall_score
    assert post_incident_resilience < initial_resilience
    assert post_incident_resilience < 70.0

def test_recovery_application():
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    
    # Inject failure
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))
    assert engine.active_incident is not None
    disrupted_score = engine.get_resilience_breakdown().overall_score
    
    # Apply Strategy C
    res = engine.apply_strategy("strat_c")
    assert res["status"] == "applied"
    
    recovered_score = engine.get_resilience_breakdown().overall_score
    assert recovered_score > disrupted_score
    assert recovered_score >= 75.0
    assert engine.services["SERVICE_ICU"].service_continuity_pct == 100.0
