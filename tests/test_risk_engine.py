"""Unit and integration tests for Phase 1: Risk Estimation Engine & Data Contracts."""
import pytest
from fastapi.testclient import TestClient

from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus
from models.service import HospitalService, ServiceType, ServiceStatus
from models.incident import FailureInjectionRequest
from models.risk import (
    RiskLevel,
    ViolationType,
    AssetRiskAssessment,
    ServiceRiskAssessment,
    IncidentRiskSummary,
)
from simulation.risk_engine import RiskEstimationEngine
from simulation.state_engine import HospitalStateEngine
from backend.app.main import app


# =============================================================================
# 1. Asset-Level Risk Tests
# =============================================================================

def test_asset_risk_normal_baseline():
    """Verify that an asset operating nominally has minimal risk and no violations."""
    engine = RiskEstimationEngine()
    asset = InfrastructureAsset(
        id="GRID_MAIN",
        name="Main 11kV Grid",
        type=AssetType.GRID,
        nominal_capacity=1000.0,
        available_capacity=1000.0,
        current_load=450.0,
        status=OperationalStatus.NORMAL,
        health_score=100.0,
    )
    assessment = engine.assess_asset_risk(asset)

    assert 0.0 <= assessment.risk_score <= 0.10
    assert assessment.risk_level == RiskLevel.LOW
    assert len(assessment.violations) == 0
    assert assessment.capacity_utilization_pct == 45.0


def test_asset_risk_failed_status():
    """Verify that a failed asset immediately evaluates to risk 1.0 (Critical)."""
    engine = RiskEstimationEngine()
    asset = InfrastructureAsset(
        id="TRANSFORMER_01",
        name="Main Transformer",
        type=AssetType.TRANSFORMER,
        nominal_capacity=800.0,
        available_capacity=0.0,
        current_load=0.0,
        status=OperationalStatus.FAILED,
        health_score=0.0,
    )
    assessment = engine.assess_asset_risk(asset)

    assert assessment.risk_score == 1.0
    assert assessment.risk_level == RiskLevel.CRITICAL
    assert assessment.risk_percentage == 100.0


def test_asset_risk_capacity_overload():
    """Verify that an asset exceeding available capacity triggers a Critical violation."""
    engine = RiskEstimationEngine()
    asset = InfrastructureAsset(
        id="EMERGENCY_BUS",
        name="Emergency Bus",
        type=AssetType.EMERGENCY_BUS,
        nominal_capacity=500.0,
        available_capacity=500.0,
        current_load=580.0, # 116% overload
        status=OperationalStatus.DEGRADED,
    )
    assessment = engine.assess_asset_risk(asset)

    assert assessment.risk_score >= 0.75
    assert assessment.risk_level == RiskLevel.CRITICAL
    assert any(v.violation_type == ViolationType.CAPACITY_OVERLOAD for v in assessment.violations)


def test_asset_risk_time_to_threshold_depletion():
    """Verify that imminent battery exhaustion generates a critical TimeToThreshold estimate."""
    engine = RiskEstimationEngine()
    asset = InfrastructureAsset(
        id="UPS_CRITICAL",
        name="ICU UPS",
        type=AssetType.UPS,
        nominal_capacity=250.0,
        available_capacity=250.0,
        current_load=150.0,
        status=OperationalStatus.NORMAL,
        battery_level_pct=12.0, # Critically low (<15%)
        runtime_remaining_min=10.5, # Under 15 minutes emergency boundary
    )
    assessment = engine.assess_asset_risk(asset)

    assert assessment.time_to_threshold is not None
    assert assessment.time_to_threshold.is_critical is True
    assert assessment.time_to_threshold.estimated_time_remaining_min == 10.5
    assert assessment.risk_score >= 0.50
    assert any(v.violation_type == ViolationType.BATTERY_DEPLETED for v in assessment.violations)


def test_asset_risk_environmental_thresholds():
    """Verify that chiller over-temperature and oxygen under-pressure trigger violations."""
    engine = RiskEstimationEngine()

    # Chiller at 15.5 °C (Severe thermal excursion)
    chiller = InfrastructureAsset(
        id="CHILLER_PLANT",
        name="HVAC Plant",
        type=AssetType.CHILLER_HVAC,
        nominal_capacity=400.0,
        available_capacity=300.0,
        temperature_c=15.5,
        status=OperationalStatus.DEGRADED,
    )
    chiller_eval = engine.assess_asset_risk(chiller)
    assert any(v.violation_type == ViolationType.TEMPERATURE_HIGH for v in chiller_eval.violations)
    assert chiller_eval.risk_score >= 0.50

    # Oxygen at 30 PSI (Ventilator cutoff threshold)
    o2 = InfrastructureAsset(
        id="OXYGEN_MANIFOLD",
        name="O2 Tank Header",
        type=AssetType.OXYGEN_SYSTEM,
        nominal_capacity=100.0,
        available_capacity=100.0,
        pressure_psi=30.0,
        status=OperationalStatus.DEGRADED,
    )
    o2_eval = engine.assess_asset_risk(o2)
    assert any(v.violation_type == ViolationType.PRESSURE_LOW for v in o2_eval.violations)


def test_redundancy_mitigation():
    """Verify that N+1 / 2N redundancy mitigates operational risk compared to a single point of failure."""
    engine = RiskEstimationEngine()

    # Asset A: Single point of failure (redundancy = 1)
    asset_spof = InfrastructureAsset(
        id="T1_SPOF",
        name="T1 Standalone",
        type=AssetType.TRANSFORMER,
        nominal_capacity=800.0,
        available_capacity=600.0,
        current_load=500.0,
        status=OperationalStatus.DEGRADED,
        redundancy_level=1,
    )
    eval_spof = engine.assess_asset_risk(asset_spof)

    # Asset B: Redundant feeder (redundancy = 2)
    asset_redundant = InfrastructureAsset(
        id="T1_REDUNDANT",
        name="T1 Dual Feed",
        type=AssetType.TRANSFORMER,
        nominal_capacity=800.0,
        available_capacity=600.0,
        current_load=500.0,
        status=OperationalStatus.DEGRADED,
        redundancy_level=2,
    )
    eval_redundant = engine.assess_asset_risk(asset_redundant)

    assert eval_redundant.risk_score < eval_spof.risk_score


# =============================================================================
# 2. Service-Level Risk Tests
# =============================================================================

def test_service_risk_criticality_scaling():
    """Verify that a life-support service (Crit 5) is penalized more than administrative offices (Crit 1)."""
    engine = RiskEstimationEngine()

    mock_assets = {
        "MAIN_BUS": InfrastructureAsset(
            id="MAIN_BUS", name="MSB", type=AssetType.MAIN_BUS,
            nominal_capacity=1000.0, available_capacity=300.0, current_load=300.0,
            status=OperationalStatus.DEGRADED
        ),
        "EMERGENCY_BUS": InfrastructureAsset(
            id="EMERGENCY_BUS", name="ESB", type=AssetType.EMERGENCY_BUS,
            nominal_capacity=600.0, available_capacity=200.0, current_load=200.0,
            status=OperationalStatus.DEGRADED
        ),
    }

    icu = HospitalService(
        id="SERVICE_ICU", name="ICU", type=ServiceType.ICU,
        criticality=5, service_continuity_pct=70.0, status=ServiceStatus.REDUCED_CAPACITY
    )
    admin = HospitalService(
        id="SERVICE_ADMIN", name="Admin", type=ServiceType.ADMIN_FACILITY,
        criticality=1, service_continuity_pct=70.0, status=ServiceStatus.REDUCED_CAPACITY
    )

    icu_eval = engine.assess_service_risk(icu, mock_assets)
    admin_eval = engine.assess_service_risk(admin, mock_assets)

    assert icu_eval.risk_score > admin_eval.risk_score
    assert icu_eval.criticality == 5
    assert admin_eval.criticality == 1


def test_service_risk_upstream_exhaustion():
    """Verify that when upstream UPS runtime is limited, service risk reflects the blackout timeline."""
    engine = RiskEstimationEngine()

    mock_assets = {
        "EMERGENCY_BUS": InfrastructureAsset(
            id="EMERGENCY_BUS", name="ESB", type=AssetType.EMERGENCY_BUS,
            nominal_capacity=600.0, available_capacity=600.0, current_load=220.0,
            status=OperationalStatus.NORMAL
        ),
        "UPS_CRITICAL": InfrastructureAsset(
            id="UPS_CRITICAL", name="UPS", type=AssetType.UPS,
            nominal_capacity=250.0, available_capacity=250.0, current_load=220.0,
            status=OperationalStatus.NORMAL,
            battery_level_pct=25.0,
            runtime_remaining_min=20.0,
        ),
    }

    icu = HospitalService(
        id="SERVICE_ICU", name="ICU", type=ServiceType.ICU,
        criticality=5, service_continuity_pct=95.0, status=ServiceStatus.FULL_OPERATION
    )

    icu_eval = engine.assess_service_risk(icu, mock_assets)

    assert icu_eval.estimated_blackout_time_min == 20.0
    assert any("20.0 minutes" in r for r in icu_eval.risk_reasons)


# =============================================================================
# 3. Incident-Level Risk & Campus Evaluation Tests
# =============================================================================

def test_incident_risk_baseline_vs_failure():
    """Verify that an active grid failure elevates overall incident risk and identifies threats."""
    state_engine = HospitalStateEngine()
    state_engine.reset_to_baseline()

    # 1. Baseline state
    baseline_risk = state_engine.get_incident_risk()
    assert baseline_risk.overall_risk_score < 0.25
    assert baseline_risk.overall_risk_level == RiskLevel.LOW
    assert len(baseline_risk.critical_services_at_risk) == 0

    # 2. Inject failure on GRID_MAIN
    state_engine.inject_failure(FailureInjectionRequest(asset_id="GRID_MAIN"))
    post_failure_risk = state_engine.get_incident_risk()

    assert post_failure_risk.overall_risk_score > baseline_risk.overall_risk_score
    assert post_failure_risk.overall_risk_level in (RiskLevel.HIGH, RiskLevel.CRITICAL)
    assert len(post_failure_risk.critical_services_at_risk) > 0
    assert post_failure_risk.service_risks["SERVICE_ICU"].service_name in post_failure_risk.critical_services_at_risk
    assert any("Intensive Care" in name for name in post_failure_risk.critical_services_at_risk)
    assert post_failure_risk.highest_risk_asset in ("GRID_MAIN", "TRANSFORMER_01", "TRANSFORMER_02")
    assert len(post_failure_risk.imminent_threshold_crossings) > 0


# =============================================================================
# 4. FastAPI Endpoint Integration Tests
# =============================================================================

def test_api_risk_summary_endpoint():
    """Verify GET /api/risk/summary returns a valid IncidentRiskSummary."""
    client = TestClient(app)
    response = client.get("/api/risk/summary")

    assert response.status_code == 200
    data = response.json()
    assert "overall_risk_score" in data
    assert "overall_risk_level" in data
    assert "asset_risks" in data
    assert "service_risks" in data
    assert 0.0 <= data["overall_risk_score"] <= 1.0


def test_api_asset_and_service_risk_endpoints():
    """Verify GET /api/risk/assets/{id} and GET /api/risk/services/{id}."""
    client = TestClient(app)

    # Valid asset
    res_asset = client.get("/api/risk/assets/GRID_MAIN")
    assert res_asset.status_code == 200
    asset_data = res_asset.json()
    assert asset_data["asset_id"] == "GRID_MAIN"
    assert "risk_score" in asset_data

    # Invalid asset -> 404
    res_invalid_asset = client.get("/api/risk/assets/NON_EXISTENT_ASSET")
    assert res_invalid_asset.status_code == 404

    # Valid service
    res_service = client.get("/api/risk/services/SERVICE_ICU")
    assert res_service.status_code == 200
    service_data = res_service.json()
    assert service_data["service_id"] == "SERVICE_ICU"
    assert service_data["criticality"] == 5

    # Invalid service -> 404
    res_invalid_service = client.get("/api/risk/services/NON_EXISTENT_SERVICE")
    assert res_invalid_service.status_code == 404
