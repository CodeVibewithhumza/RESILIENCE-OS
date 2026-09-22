"""Unit tests for Phase 2: Formally Bounded & Defensible Resilience Index Engine (C / A / B / T / U)."""
import pytest
from fastapi.testclient import TestClient

from simulation.resilience_index import ResilienceIndexCalculator
from simulation.state_engine import HospitalStateEngine
from models.service import HospitalService, ServiceType, ServiceStatus
from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus
from models.incident import FailureInjectionRequest
from backend.app.main import app


# =============================================================================
# 1. Bounds & Extremes Tests
# =============================================================================

def test_resilience_index_bounds():
    """Verify that Resilience Index is strictly bounded in [0.0, 100.0] under normal and extreme states."""
    calc = ResilienceIndexCalculator()

    # 1. Normal State
    services = [
        HospitalService(id="S1", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=100.0),
        HospitalService(id="S2", name="Ward", type=ServiceType.GENERAL_WARD, criticality=3, service_continuity_pct=100.0),
    ]
    assets = [
        InfrastructureAsset(id="A1", name="Grid", type=AssetType.GRID, nominal_capacity=1000, available_capacity=1000, current_load=450, status=OperationalStatus.NORMAL),
        InfrastructureAsset(id="A2", name="Gen", type=AssetType.GENERATOR, nominal_capacity=500, available_capacity=500, current_load=0, fuel_level_pct=95.0, status=OperationalStatus.OFFLINE),
    ]

    breakdown = calc.compute_resilience_breakdown(services, assets, is_incident_active=False)
    assert 0.0 <= breakdown.overall_score <= 100.0
    assert breakdown.overall_score >= 85.0
    assert breakdown.status_label == "OPTIMAL"

    # 2. Catastrophic Blackout State (Everything 0)
    failed_services = [
        HospitalService(id="S1", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=0.0, status=ServiceStatus.COMPROMISED),
    ]
    failed_assets = [
        InfrastructureAsset(id="A1", name="Grid", type=AssetType.GRID, nominal_capacity=1000, available_capacity=0, current_load=0, status=OperationalStatus.FAILED),
        InfrastructureAsset(id="A2", name="UPS", type=AssetType.UPS, nominal_capacity=200, available_capacity=0, current_load=0, battery_level_pct=0.0, status=OperationalStatus.FAILED),
    ]

    blackout = calc.compute_resilience_breakdown(
        failed_services,
        failed_assets,
        is_incident_active=True,
        recovery_time_min=180.0,
        load_shed_kw=600.0,
    )
    assert blackout.overall_score == 0.0
    assert blackout.status_label == "CRITICAL BLACKOUT"
    assert blackout.status_color == "#7F1D1D"


def test_criticality_weighting():
    """Verify that dropping ICU (Crit 5) continuity penalizes C much more severely than dropping Ward (Crit 3)."""
    calc = ResilienceIndexCalculator()

    icu_down = [
        HospitalService(id="S1", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=0.0),
        HospitalService(id="S2", name="Ward", type=ServiceType.GENERAL_WARD, criticality=3, service_continuity_pct=100.0),
    ]
    ward_down = [
        HospitalService(id="S1", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=100.0),
        HospitalService(id="S2", name="Ward", type=ServiceType.GENERAL_WARD, criticality=3, service_continuity_pct=0.0),
    ]

    score_icu_down = calc.calculate_service_continuity_subscore(icu_down)
    score_ward_down = calc.calculate_service_continuity_subscore(ward_down)

    assert score_icu_down < score_ward_down


# =============================================================================
# 2. Canonical Components (C / A / B / T / U) Tests
# =============================================================================

def test_canonical_components_normalization():
    """Verify that all canonical components C, A, B, T_norm, U_norm are normalized in [0.0, 1.0]."""
    calc = ResilienceIndexCalculator()

    services = [
        HospitalService(id="ICU", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=90.0),
        HospitalService(id="OT", name="OT", type=ServiceType.OPERATING_THEATRE, criticality=5, service_continuity_pct=85.0),
        HospitalService(id="ER", name="ER", type=ServiceType.EMERGENCY_DEPT, criticality=5, service_continuity_pct=95.0),
    ]
    assets = [
        InfrastructureAsset(id="G1", name="Grid", type=AssetType.GRID, nominal_capacity=1000, available_capacity=1000, current_load=500, status=OperationalStatus.NORMAL),
        InfrastructureAsset(id="UPS", name="UPS", type=AssetType.UPS, nominal_capacity=200, available_capacity=200, current_load=100, battery_level_pct=80.0, status=OperationalStatus.NORMAL),
        InfrastructureAsset(id="GEN", name="Gen", type=AssetType.GENERATOR, nominal_capacity=500, available_capacity=500, current_load=0, fuel_level_pct=85.0, status=OperationalStatus.OFFLINE),
    ]

    breakdown = calc.compute_resilience_breakdown(
        services,
        assets,
        is_incident_active=True,
        recovery_time_min=30.0,
        load_shed_kw=100.0,
    )

    canonical = breakdown.sub_scores.canonical
    assert canonical is not None

    assert 0.0 <= canonical.c_continuity <= 1.0
    assert 0.0 <= canonical.a_availability <= 1.0
    assert 0.0 <= canonical.b_backup_margin <= 1.0
    assert 0.0 <= canonical.t_recovery_penalty <= 1.0
    assert 0.0 <= canonical.u_resource_penalty <= 1.0

    # 30 min recovery out of 120 max reference = 0.25
    assert canonical.t_recovery_penalty == 0.25

    # 100 kW load shed out of 500 max reference = 0.20
    assert canonical.u_resource_penalty == 0.20


def test_recovery_time_penalty_capping():
    """Verify that recovery times beyond reference max (120 min) cap strictly at 1.0."""
    calc = ResilienceIndexCalculator(reference_recovery_time_min=120.0)

    assets = [
        InfrastructureAsset(id="A1", name="Grid", type=AssetType.GRID, nominal_capacity=1000, available_capacity=1000, status=OperationalStatus.NORMAL)
    ]

    # Exactly reference
    p_120 = calc.calculate_t_recovery_penalty(assets, is_incident_active=True, recovery_time_min=120.0)
    assert p_120 == 1.0

    # Over reference
    p_240 = calc.calculate_t_recovery_penalty(assets, is_incident_active=True, recovery_time_min=240.0)
    assert p_240 == 1.0

    # Zero / None when incident not active
    p_zero = calc.calculate_t_recovery_penalty(assets, is_incident_active=False)
    assert p_zero == 0.0


def test_resource_use_penalty_capping():
    """Verify that load shed penalties cap strictly at 1.0."""
    calc = ResilienceIndexCalculator(reference_max_load_shed_kw=500.0)

    # 250 kW = 0.50
    assert calc.calculate_u_resource_penalty(load_shed_kw=250.0) == 0.50

    # 500 kW = 1.0
    assert calc.calculate_u_resource_penalty(load_shed_kw=500.0) == 1.0

    # 750 kW = capped at 1.0
    assert calc.calculate_u_resource_penalty(load_shed_kw=750.0) == 1.0

    # 0 kW = 0.0
    assert calc.calculate_u_resource_penalty(load_shed_kw=0.0) == 0.0


# =============================================================================
# 3. Robustness & Zero-Division Safeguards
# =============================================================================

def test_zero_division_safeguards():
    """Verify that empty inputs, zero nominal capacities, or missing assets do not cause crashes."""
    calc = ResilienceIndexCalculator()

    # 1. Empty lists
    empty_breakdown = calc.compute_resilience_breakdown([], [], is_incident_active=False)
    assert 0.0 <= empty_breakdown.overall_score <= 100.0
    assert empty_breakdown.sub_scores.canonical.c_continuity == 1.0
    assert empty_breakdown.sub_scores.canonical.a_availability == 1.0
    assert empty_breakdown.sub_scores.canonical.b_backup_margin == 1.0

    # 2. Asset with nominal_capacity = 0
    zero_cap_asset = [
        InfrastructureAsset(id="A0", name="Virtual Sensor", type=AssetType.GRID, nominal_capacity=0.0, available_capacity=0.0, status=OperationalStatus.NORMAL)
    ]
    b = calc.calculate_b_backup_margin(zero_cap_asset)
    assert 0.0 <= b <= 1.0


# =============================================================================
# 4. Service Risk Integration with Phase 1
# =============================================================================

def test_service_risk_attenuation():
    """Verify that providing Phase 1 service risk scores attenuates critical service continuity."""
    calc = ResilienceIndexCalculator()

    services = [
        HospitalService(id="SERVICE_ICU", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=100.0),
    ]

    # Without risk score
    c_pure = calc.calculate_c_continuity(services)
    assert c_pure == 1.0

    # With high risk score (0.80) from upstream failure
    c_attenuated = calc.calculate_c_continuity(services, service_risks={"SERVICE_ICU": 0.80})
    assert c_attenuated < c_pure
    assert c_attenuated == 0.60 # 1.0 * (1 - 0.5 * 0.80) = 0.60


# =============================================================================
# 5. State Engine & API Integration
# =============================================================================

def test_state_engine_breakdown_flow():
    """Verify state engine computes valid breakdown at baseline and after failure injection."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()

    # Baseline breakdown
    baseline_bd = engine.get_resilience_breakdown()
    assert baseline_bd.overall_score >= 85.0
    assert baseline_bd.status_label == "OPTIMAL"
    assert baseline_bd.sub_scores.canonical is not None

    # Inject grid failure
    engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))
    failure_bd = engine.get_resilience_breakdown()

    assert failure_bd.overall_score < baseline_bd.overall_score
    assert failure_bd.delta_from_baseline < 0
    assert failure_bd.status_label in ("DEGRADED", "AT RISK", "CRITICAL BLACKOUT")


def test_api_resilience_breakdown_endpoint():
    """Verify GET /api/resilience/breakdown returns a valid ResilienceIndexBreakdown schema."""
    client = TestClient(app)
    response = client.get("/api/resilience/breakdown")

    assert response.status_code == 200
    data = response.json()
    assert "overall_score" in data
    assert "status_label" in data
    assert "sub_scores" in data
    assert "canonical" in data["sub_scores"]
    assert 0.0 <= data["overall_score"] <= 100.0
    assert 0.0 <= data["sub_scores"]["canonical"]["c_continuity"] <= 1.0
