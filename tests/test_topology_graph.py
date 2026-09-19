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
