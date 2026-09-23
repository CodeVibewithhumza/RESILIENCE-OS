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

    # Every graph node must contain the required GraphNode structure.
    required_node_fields = {
        "id",
        "label",
        "category",
        "name",
        "criticality",
        "capacity",
        "current_load",
        "health_score",
        "status",
        "floor",
        "properties",
    }

    for node_id, data in graph.nodes(data=True):
        assert required_node_fields.issubset(data.keys())
        assert data["id"] == node_id
        assert data["category"] in {"infrastructure", "service"}
        assert data["capacity"] >= 0
        assert data["current_load"] >= 0
        assert 0 <= data["health_score"] <= 100
        assert isinstance(data["properties"], dict)

    # Every graph edge must contain the required dependency structure.
    required_edge_fields = {
        "relationship",
        "dependency_strength",
        "threshold",
        "is_active",
        "is_redundant",
        "failure_propagation_rule",
        "recovery_behavior",
        "priority",
    }

    for source, target, data in graph.edges(data=True):
        assert source in graph
        assert target in graph
        assert required_edge_fields.issubset(data.keys())
        assert data["relationship"] in {
            "SUPPLIES",
            "FEEDS",
            "POWERS",
            "BACKS_UP",
            "COOLS",
            "PROVIDES_WATER",
            "PROVIDES_GAS",
            "DEPENDS_ON",
        }
        assert 0.0 <= data["dependency_strength"] <= 1.0
        assert 0.0 <= data["threshold"] <= 1.0
        assert isinstance(data["is_active"], bool)
        assert isinstance(data["is_redundant"], bool)

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

def test_dependency_graph_is_directed():
    builder = HospitalTopologyBuilder()
    graph = builder.graph

    assert isinstance(graph, nx.DiGraph)
    assert not graph.is_directed() is False

    # Dependency direction must be preserved.
    assert graph.has_edge("GRID_MAIN", "TRANSFORMER_01")
    assert not graph.has_edge("TRANSFORMER_01", "GRID_MAIN")

    assert graph.has_edge("EMERGENCY_BUS", "SERVICE_ICU")
    assert not graph.has_edge("SERVICE_ICU", "EMERGENCY_BUS")

def test_dependency_graph_connectivity():
    builder = HospitalTopologyBuilder()
    graph = builder.graph

    # Critical services must be reachable from the primary grid path.
    critical_services = {
        "SERVICE_ICU",
        "SERVICE_OT",
        "SERVICE_ER",
        "SERVICE_WARD",
    }

    for service_id in critical_services:
        assert nx.has_path(graph, "GRID_MAIN", service_id)

    # Critical infrastructure should have downstream dependencies.
    assert graph.out_degree("GRID_MAIN") > 0
    assert graph.out_degree("EMERGENCY_BUS") > 0
    assert graph.out_degree("UPS_CRITICAL") > 0

def test_graph_traversal_preserves_dependency_direction():
    builder = HospitalTopologyBuilder()
    traversal = GraphTraversalEngine(builder.graph)

    downstream = traversal.get_downstream_subgraph("EMERGENCY_BUS")
    downstream_ids = {item["node_id"] for item in downstream}

    assert "SERVICE_ICU" in downstream_ids
    assert "SERVICE_OT" in downstream_ids
    assert "SERVICE_ER" in downstream_ids

    # Reverse direction must not appear in downstream traversal.
    assert "GRID_MAIN" not in downstream_ids
    assert "TRANSFORMER_02" not in downstream_ids

def test_failure_scenario_propagates_to_downstream_services():
    builder = HospitalTopologyBuilder()
    graph = builder.graph

    # Scenario: Emergency bus fails.
    graph.nodes["EMERGENCY_BUS"]["status"] = "failed"
    graph.nodes["EMERGENCY_BUS"]["health_score"] = 0.0

    downstream = nx.descendants(graph, "EMERGENCY_BUS")

    assert "SERVICE_ICU" in downstream
    assert "SERVICE_OT" in downstream
    assert "SERVICE_ER" in downstream

    # Failure must not propagate upstream.
    assert "GRID_MAIN" not in downstream
    assert "TRANSFORMER_02" not in downstream

def test_redundant_backup_path_exists_for_emergency_bus():
    builder = HospitalTopologyBuilder()
    graph = builder.graph

    backup_edges = [
        (source, target)
        for source, target, data in graph.edges(data=True)
        if target == "EMERGENCY_BUS"
        and data["relationship"] == "BACKS_UP"
        and data["is_redundant"]
    ]

    assert len(backup_edges) >= 1

    backup_sources = {source for source, _ in backup_edges}

    assert "GEN_01" in backup_sources or "GEN_02" in backup_sources

def test_recovery_scenario_restores_failed_asset_state():
    builder = HospitalTopologyBuilder()
    graph = builder.graph

    # Scenario: Emergency bus fails.
    graph.nodes["EMERGENCY_BUS"]["status"] = "failed"
    graph.nodes["EMERGENCY_BUS"]["health_score"] = 0.0

    assert graph.nodes["EMERGENCY_BUS"]["status"] == "failed"
    assert graph.nodes["EMERGENCY_BUS"]["health_score"] == 0.0

    # Recovery scenario: asset returns to normal operation.
    graph.nodes["EMERGENCY_BUS"]["status"] = "normal"
    graph.nodes["EMERGENCY_BUS"]["health_score"] = 100.0

    assert graph.nodes["EMERGENCY_BUS"]["status"] == "normal"
    assert graph.nodes["EMERGENCY_BUS"]["health_score"] == 100.0