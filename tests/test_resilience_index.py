"""Unit tests for Resilience Index mathematical formulation."""
import pytest
from simulation.resilience_index import ResilienceIndexCalculator
from models.service import HospitalService, ServiceType, ServiceStatus
from models.infrastructure import InfrastructureAsset, AssetType, OperationalStatus

def test_resilience_index_bounds():
    calc = ResilienceIndexCalculator()
    
    # 1. Normal State
    services = [
        HospitalService(id="S1", name="ICU", type=ServiceType.ICU, criticality=5, service_continuity_pct=100.0),
        HospitalService(id="S2", name="Ward", type=ServiceType.GENERAL_WARD, criticality=3, service_continuity_pct=100.0),
    ]
    assets = [
        InfrastructureAsset(id="A1", name="Grid", type=AssetType.GRID, nominal_capacity=1000, available_capacity=1000, status=OperationalStatus.NORMAL),
        InfrastructureAsset(id="A2", name="Gen", type=AssetType.GENERATOR, nominal_capacity=500, available_capacity=500, fuel_level_pct=95.0, status=OperationalStatus.OFFLINE),
    ]
    
    breakdown = calc.compute_resilience_breakdown(services, assets, is_incident_active=False)
    assert 0.0 <= breakdown.overall_score <= 100.0
    assert breakdown.overall_score >= 85.0
    assert breakdown.status_label == "OPTIMAL"

def test_criticality_weighting():
    calc = ResilienceIndexCalculator()
    
    # ICU (Crit 5) dropped vs Ward (Crit 3) dropped
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
    
    # Dropping ICU should penalize much more severely than dropping Ward
    assert score_icu_down < score_ward_down
