"""Unit and Integration tests for SimulationReportGenerator."""
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from simulation.state_engine import HospitalStateEngine
from simulation.report_generator import SimulationReportGenerator
from models.incident import FailureInjectionRequest, IncidentSeverity


@pytest.fixture
def state_engine():
    """Provides a fresh, reset state engine."""
    engine = HospitalStateEngine()
    engine.reset_to_baseline()
    return engine


def test_markdown_report_baseline_generation(state_engine):
    """Verifies that baseline state generates a well-structured markdown report."""
    report = state_engine.generate_simulation_report(format="markdown", scenario_title="Baseline Audit")

    assert "# 🏥 ResilienceOS — Executive Simulation Audit Report" in report
    assert "Baseline Audit" in report
    assert "Resilience Index Breakdown" in report
    assert "Critical Service Continuity" in report
    assert "Infrastructure Availability" in report
    assert "Backup Energy Margin" in report


def test_markdown_report_post_incident_generation(state_engine):
    """Verifies that post-incident report includes timeline, risk threshold crossings, and what-if matrix."""
    # Inject failure
    state_engine.inject_failure(
        FailureInjectionRequest(asset_id="GRID_MAIN", severity=IncidentSeverity.HIGH, compound_heatwave=True)
    )

    report = state_engine.generate_simulation_report(format="markdown", scenario_title="Grid Blackout Incident")

    assert "Grid Blackout Incident" in report
    assert "GRID_MAIN" in report
    assert "Cascading Failure Timeline" in report
    assert "What-If Response Strategy Outcome Comparison" in report
    assert "Actionable Tactical Directives" in report
    assert "⭐ **RECOMMENDED**" in report


def test_json_report_generation(state_engine):
    """Verifies that JSON report contains all serializable state dictionaries."""
    state_engine.inject_failure(FailureInjectionRequest(asset_id="OXYGEN_MANIFOLD"))
    report_dict = state_engine.generate_simulation_report(format="json", scenario_title="O2 Leak Audit")

    assert isinstance(report_dict, dict)
    assert report_dict["title"] == "O2 Leak Audit"
    assert "resilience_breakdown" in report_dict
    assert "incident_state" in report_dict
    assert "risk_summary" in report_dict
    assert "what_if_comparison" in report_dict
    assert report_dict["incident_state"]["source_asset_id"] == "OXYGEN_MANIFOLD"


def test_api_simulation_report_endpoint():
    """Verifies GET /api/simulation/report endpoint works for markdown and JSON formats."""
    client = TestClient(app)

    # Markdown format
    res_md = client.get("/api/simulation/report?format=markdown")
    assert res_md.status_code == 200
    assert "ResilienceOS" in res_md.text

    # JSON format
    res_json = client.get("/api/simulation/report?format=json")
    assert res_json.status_code == 200
    data = res_json.json()
    assert "resilience_breakdown" in data


def test_api_scenarios_endpoint():
    """Verifies GET /api/scenarios returns catalog of all available scenario JSONs."""
    client = TestClient(app)
    response = client.get("/api/scenarios")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] >= 6
    assert any(s["scenario_id"] == "scenario_main_power_failure" for s in data["scenarios"])
    assert any(s["scenario_id"] == "scenario_chiller_thermal_excursion" for s in data["scenarios"])
