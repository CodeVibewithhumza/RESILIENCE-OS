"""Unit tests for Cascade Propagation & State transitions."""
import pytest
from simulation.state_engine import HospitalStateEngine
from models.incident import FailureInjectionRequest, IncidentSeverity
from models.infrastructure import OperationalStatus
from models.service import ServiceStatus


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
    assert len(incident.timeline) >= 4
    assert len(incident.cascade_path) > 0

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


def test_chiller_failure_cascade():
    """Verifies HVAC Chiller failure propagates thermal degradation to surgical & critical units."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    request = FailureInjectionRequest(
        asset_id="CHILLER_PLANT",
        failure_type="compressor_trip",
        severity=IncidentSeverity.HIGH
    )
    incident = engine.inject_failure(request)

    assert incident.is_active is True
    assert "CHILLER_PLANT" in incident.affected_asset_ids
    assert "SERVICE_OT" in incident.affected_service_ids
    assert "SERVICE_ICU" in incident.affected_service_ids

    # OT should drop to CRITICAL_ONLY due to sterile positive pressure & cooling loss
    assert engine.services["SERVICE_OT"].status == ServiceStatus.CRITICAL_ONLY
    assert engine.services["SERVICE_OT"].service_continuity_pct <= 50.0
    assert engine.services["SERVICE_ICU"].status == ServiceStatus.REDUCED_CAPACITY


def test_oxygen_manifold_failure_cascade():
    """Verifies central oxygen failure compromises ICU life-support ventilators."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    request = FailureInjectionRequest(
        asset_id="OXYGEN_MANIFOLD",
        failure_type="header_rupture",
        severity=IncidentSeverity.CATASTROPHIC
    )
    incident = engine.inject_failure(request)

    assert incident.is_active is True
    assert "OXYGEN_MANIFOLD" in incident.affected_asset_ids
    assert "SERVICE_ICU" in incident.affected_service_ids

    # ICU ventilators compromised
    assert engine.services["SERVICE_ICU"].status == ServiceStatus.COMPROMISED
    assert engine.services["SERVICE_ICU"].service_continuity_pct <= 40.0
    assert "E-cylinders" in engine.services["SERVICE_ICU"].risk_reason


def test_water_pump_failure_cascade():
    """Verifies water pump outage degrades sterilization and sanitary flow."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    request = FailureInjectionRequest(
        asset_id="WATER_PUMP_STATION",
        failure_type="pump_cavitation",
        severity=IncidentSeverity.MEDIUM
    )
    incident = engine.inject_failure(request)

    assert incident.is_active is True
    assert "WATER_PUMP_STATION" in incident.affected_asset_ids
    assert "SERVICE_OT" in incident.affected_service_ids
    assert engine.services["SERVICE_OT"].service_continuity_pct <= 70.0


def test_compound_heatwave_modifier():
    """Verifies compound heatwave accelerates battery countdown and worsens timeline scores."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    request_normal = FailureInjectionRequest(asset_id="GRID_MAIN", compound_heatwave=False)
    incident_normal = engine.inject_failure(request_normal)
    normal_runtime = engine.assets["UPS_CRITICAL"].runtime_remaining_min

    engine.reset_to_baseline()
    request_heatwave = FailureInjectionRequest(asset_id="GRID_MAIN", compound_heatwave=True)
    incident_heatwave = engine.inject_failure(request_heatwave)
    heatwave_runtime = engine.assets["UPS_CRITICAL"].runtime_remaining_min

    # Heatwave should reduce UPS runtime and shorten blackout horizon
    assert heatwave_runtime < normal_runtime
    assert incident_heatwave.estimated_unmitigated_blackout_min < incident_normal.estimated_unmitigated_blackout_min

