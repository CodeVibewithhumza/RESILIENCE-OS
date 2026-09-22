"""Unit tests for Hospital Dependency Knowledge Graph."""
import pytest
import networkx as nx
from graph.topology_builder import HospitalTopologyBuilder
from graph.traversals import GraphTraversalEngine
from models.infrastructure import InfrastructureAsset

def test_graph_initialization():
    builder = HospitalTopologyBuilder()
    graph = builder.graph
    
    assert len(graph.nodes) >= 15
    assert len(graph.edges) >= 20
    
    # Check key infrastructure nodes
    assert "GRID_MAIN" in graph
    assert "TRANSFORMER_01" in graph
    assert "EMERGENCY_BUS" in graph
    assert "UPS_CRITICAL" in graph
    assert "CHILLER_PLANT" in graph
    assert "OXYGEN_MANIFOLD" in graph
    
    # Check key service nodes
    assert "SERVICE_ICU" in graph
    assert "SERVICE_OT" in graph
    assert "SERVICE_ER" in graph

def test_reachability_from_grid():
    builder = HospitalTopologyBuilder()
    graph = builder.graph
    
    # Grid should reach ICU through transformers and emergency bus
    assert nx.has_path(graph, "GRID_MAIN", "SERVICE_ICU")
    assert nx.has_path(graph, "GRID_MAIN", "SERVICE_OT")
    assert nx.has_path(graph, "GRID_MAIN", "SERVICE_WARD")

def test_downstream_traversal():
    builder = HospitalTopologyBuilder()
    traversal = GraphTraversalEngine(builder.graph)
    
    downstream = traversal.get_downstream_subgraph("TRANSFORMER_02")
    node_ids = [d["node_id"] for d in downstream]
    
    assert "EMERGENCY_BUS" in node_ids
    assert "SERVICE_ICU" in node_ids

def test_bottleneck_detection():
    builder = HospitalTopologyBuilder()
    traversal = GraphTraversalEngine(builder.graph)
    
    bottlenecks = traversal.find_critical_bottlenecks()
    assert len(bottlenecks) > 0
    top_bottleneck_ids = [b["node_id"] for b in bottlenecks]
    assert "GRID_MAIN" in top_bottleneck_ids or "EMERGENCY_BUS" in top_bottleneck_ids

def test_yaml_configuration_integrity():
    builder = HospitalTopologyBuilder()

    config = builder.config
    graph = builder.graph

    # Required top-level configuration sections
    assert "infrastructure_assets" in config
    assert "services" in config
    assert "dependencies" in config

    assets = config["infrastructure_assets"]
    services = config["services"]
    dependencies = config["dependencies"]

    # Expected prototype hospital model
    assert len(assets) == 11
    assert len(services) == 5
    assert len(dependencies) == 23

    # Every configured asset/service must exist in the graph
    configured_node_ids = {
        item["id"] for item in assets + services
    }

    assert configured_node_ids == set(graph.nodes)

    # Every dependency must reference valid nodes
    for dependency in dependencies:
        assert dependency["source"] in configured_node_ids
        assert dependency["target"] in configured_node_ids

        assert 0.0 <= dependency["dependency_strength"] <= 1.0
        assert 0.0 <= dependency["threshold"] <= 1.0

        assert "relationship" in dependency
        assert "failure_propagation_rule" in dependency
        assert "recovery_behavior" in dependency
        assert "priority" in dependency


def test_dependency_behavior_configuration():
    builder = HospitalTopologyBuilder()

    configured_dependencies = {
        (dependency["source"], dependency["target"]): dependency
        for dependency in builder.config["dependencies"]
    }

    for source, target, data in builder.graph.edges(data=True):
        config_dependency = configured_dependencies[(source, target)]

        assert data["failure_propagation_rule"] == config_dependency[
            "failure_propagation_rule"
        ]

        assert data["recovery_behavior"] == config_dependency[
            "recovery_behavior"
        ]

        assert data["priority"] == config_dependency["priority"]

    # Critical service dependencies must exist.
    assert builder.graph.has_edge("EMERGENCY_BUS", "SERVICE_ICU")
    assert builder.graph.has_edge("EMERGENCY_BUS", "SERVICE_OT")
    assert builder.graph.has_edge("OXYGEN_MANIFOLD", "SERVICE_ICU")
    assert builder.graph.has_edge("CHILLER_PLANT", "SERVICE_ICU")

def test_asset_configuration_integrity():
    builder = HospitalTopologyBuilder()

    assets = builder.config["infrastructure_assets"]

    for asset in assets:
        # Common asset configuration
        assert asset["id"]
        assert asset["name"]
        assert asset["type"]

        assert asset["nominal_capacity"] > 0
        assert 0 <= asset["available_capacity"] <= asset["nominal_capacity"]
        assert 0 <= asset["current_load"] <= asset["available_capacity"]

        assert 0.0 <= asset["threshold"] <= 1.0
        assert 0 <= asset["health_score"] <= 100
        assert asset["redundancy_level"] >= 1

    # Asset-specific configuration
    for asset in assets:
        asset_type = asset["type"]

        if asset_type == "generator":
            assert "fuel_level_pct" in asset
            assert 0 <= asset["fuel_level_pct"] <= 100

        elif asset_type == "ups":
            assert "battery_level_pct" in asset
            assert 0 <= asset["battery_level_pct"] <= 100
            assert "runtime_remaining_min" in asset
            assert asset["runtime_remaining_min"] >= 0

        elif asset_type == "oxygen_system":
            assert "pressure_psi" in asset
            assert asset["pressure_psi"] > 0

        elif asset_type == "water_pump":
            assert "pressure_psi" in asset
            assert asset["pressure_psi"] > 0

        elif asset_type == "chiller_hvac":
            assert "temperature_c" in asset
            assert asset["temperature_c"] >= 0

def test_assets_match_infrastructure_model():
    builder = HospitalTopologyBuilder()

    for asset_config in builder.config["infrastructure_assets"]:
        asset = InfrastructureAsset(**asset_config)

        assert asset.id == asset_config["id"]
        assert asset.type.value == asset_config["type"]
        assert asset.threshold == asset_config["threshold"]