"""Unit tests for Hospital Dependency Knowledge Graph."""
import pytest
import networkx as nx
from graph.topology_builder import HospitalTopologyBuilder
from graph.traversals import GraphTraversalEngine

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