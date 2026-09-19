"""Hospital Dependency Graph Builder using NetworkX with full data-driven configuration."""
import networkx as nx
from typing import Dict, Any, List, Optional
from .schema import EdgeType, GraphNode, GraphEdge

class HospitalTopologyBuilder:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.build_default_topology()

    def build_default_topology(self) -> nx.DiGraph:
        """Constructs the canonical hospital dependency graph."""
        self.graph.clear()
        
        # 1. Infrastructure Nodes
        nodes: List[GraphNode] = [
            GraphNode(
                id="GRID_MAIN",
                label="City Utility Grid",
                category="infrastructure",
                name="Primary 11kV Grid Feed",
                criticality=5,
                capacity=1200.0,
                current_load=750.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "grid", "voltage_v": 11000, "redundancy": 1}
            ),
            GraphNode(
                id="TRANSFORMER_01",
                label="Transformer T1",
                category="infrastructure",
                name="Main Distribution Transformer",
                criticality=4,
                capacity=800.0,
                current_load=430.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "transformer", "temp_c": 48.0}
            ),
            GraphNode(
                id="TRANSFORMER_02",
                label="Transformer T2",
                category="infrastructure",
                name="Essential / Emergency Transformer",
                criticality=5,
                capacity=800.0,
                current_load=320.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "transformer", "temp_c": 42.0}
            ),
            GraphNode(
                id="MAIN_BUS",
                label="Main Switchboard (MSB)",
                category="infrastructure",
                name="General Services Bus",
                criticality=3,
                capacity=1000.0,
                current_load=430.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "main_bus"}
            ),
            GraphNode(
                id="EMERGENCY_BUS",
                label="Emergency Switchboard (ESB)",
                category="infrastructure",
                name="Essential Life-Safety Bus",
                criticality=5,
                capacity=600.0,
                current_load=320.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "emergency_bus"}
            ),
            GraphNode(
                id="GEN_01",
                label="Diesel Generator 1",
                category="infrastructure",
                name="Primary Emergency Generator (750kVA)",
                criticality=5,
                capacity=750.0,
                current_load=0.0,
                health_score=100.0,
                status="offline", # Standby
                floor=0,
                properties={"type": "generator", "fuel_pct": 95.0, "warmup_seconds": 10}
            ),
            GraphNode(
                id="GEN_02",
                label="Diesel Generator 2",
                category="infrastructure",
                name="Auxiliary Generator (500kVA)",
                criticality=4,
                capacity=500.0,
                current_load=0.0,
                health_score=100.0,
                status="offline", # Standby
                floor=0,
                properties={"type": "generator", "fuel_pct": 90.0, "warmup_seconds": 15}
            ),
            GraphNode(
                id="UPS_CRITICAL",
                label="Central Battery UPS",
                category="infrastructure",
                name="Static Double-Conversion UPS (250kW)",
                criticality=5,
                capacity=250.0,
                current_load=120.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "ups", "battery_pct": 100.0, "runtime_min": 45.0}
            ),
            GraphNode(
                id="CHILLER_PLANT",
                label="Central Chiller Plant",
                category="infrastructure",
                name="HVAC Cooling Plant & AHU",
                criticality=4,
                capacity=400.0,
                current_load=280.0,
                health_score=100.0,
                status="normal",
                floor=4, # Rooftop
                properties={"type": "chiller_hvac", "temp_c": 7.2}
            ),
            GraphNode(
                id="OXYGEN_MANIFOLD",
                label="Medical Gas & Oxygen Manifold",
                category="infrastructure",
                name="Central Liquid O2 Tank & Header",
                criticality=5,
                capacity=100.0,
                current_load=45.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "oxygen_system", "pressure_psi": 55.0, "reserve_hours": 72.0}
            ),
            GraphNode(
                id="WATER_PUMP_STATION",
                label="Hydro-Pneumatic Water Pumps",
                category="infrastructure",
                name="Potable & Fire Booster Pumps",
                criticality=3,
                capacity=100.0,
                current_load=35.0,
                health_score=100.0,
                status="normal",
                floor=0,
                properties={"type": "water_pump", "pressure_psi": 60.0}
            ),
            
            # 2. Service Nodes
            GraphNode(
                id="SERVICE_ICU",
                label="Intensive Care Unit (ICU)",
                category="service",
                name="24-Bed Critical Intensive Care",
                criticality=5,
                capacity=100.0,
                current_load=100.0,
                health_score=100.0,
                status="full_operation",
                floor=3,
                properties={"type": "icu", "patients": 24, "min_power_kw": 150.0}
            ),
            GraphNode(
                id="SERVICE_OT",
                label="Operating Theatres (OT 1-4)",
                category="service",
                name="Surgical Suites & Recovery",
                criticality=5,
                capacity=100.0,
                current_load=100.0,
                health_score=100.0,
                status="full_operation",
                floor=2,
                properties={"type": "operating_theatre", "active_surgeries": 4, "min_power_kw": 180.0}
            ),
            GraphNode(
                id="SERVICE_ER",
                label="Emergency Trauma Department",
                category="service",
                name="Emergency Triage & Resuscitation",
                criticality=5,
                capacity=100.0,
                current_load=100.0,
                health_score=100.0,
                status="full_operation",
                floor=1,
                properties={"type": "emergency_dept", "active_patients": 32, "min_power_kw": 120.0}
            ),
            GraphNode(
                id="SERVICE_WARD",
                label="General Inpatient Wards",
                category="service",
                name="Wards A & B (120 Beds)",
                criticality=3,
                capacity=100.0,
                current_load=100.0,
                health_score=100.0,
                status="full_operation",
                floor=2,
                properties={"type": "general_ward", "patients": 94, "min_power_kw": 220.0}
            ),
            GraphNode(
                id="SERVICE_ADMIN",
                label="Administrative & Facilities",
                category="service",
                name="Records, Billing & Non-Clinical Offices",
                criticality=1,
                capacity=100.0,
                current_load=100.0,
                health_score=100.0,
                status="full_operation",
                floor=1,
                properties={"type": "admin_facility", "min_power_kw": 80.0}
            ),
        ]

        for node in nodes:
            self.graph.add_node(node.id, **node.model_dump())

        # 3. Explicit Relationship Edges
        edges: List[GraphEdge] = [
            # Grid to Transformers
            GraphEdge(source="GRID_MAIN", target="TRANSFORMER_01", relationship=EdgeType.SUPPLIES, dependency_strength=1.0),
            GraphEdge(source="GRID_MAIN", target="TRANSFORMER_02", relationship=EdgeType.SUPPLIES, dependency_strength=1.0),
            
            # Transformers to Buses
            GraphEdge(source="TRANSFORMER_01", target="MAIN_BUS", relationship=EdgeType.FEEDS, dependency_strength=1.0),
            GraphEdge(source="TRANSFORMER_02", target="EMERGENCY_BUS", relationship=EdgeType.FEEDS, dependency_strength=1.0),
            
            # Backups to Buses
            GraphEdge(source="GEN_01", target="EMERGENCY_BUS", relationship=EdgeType.BACKS_UP, dependency_strength=1.0, is_redundant=True, is_active=False),
            GraphEdge(source="GEN_02", target="MAIN_BUS", relationship=EdgeType.BACKS_UP, dependency_strength=0.8, is_redundant=True, is_active=False),
            GraphEdge(source="UPS_CRITICAL", target="EMERGENCY_BUS", relationship=EdgeType.BACKS_UP, dependency_strength=1.0, is_redundant=True, is_active=True),
            
            # Main Bus Powers Secondary Facilities & Plants
            GraphEdge(source="MAIN_BUS", target="CHILLER_PLANT", relationship=EdgeType.POWERS, dependency_strength=0.9),
            GraphEdge(source="MAIN_BUS", target="WATER_PUMP_STATION", relationship=EdgeType.POWERS, dependency_strength=0.8),
            GraphEdge(source="MAIN_BUS", target="SERVICE_WARD", relationship=EdgeType.POWERS, dependency_strength=1.0),
            GraphEdge(source="MAIN_BUS", target="SERVICE_ADMIN", relationship=EdgeType.POWERS, dependency_strength=1.0),
            
            # Emergency Bus Powers Critical Life-Safety Services
            GraphEdge(source="EMERGENCY_BUS", target="SERVICE_ICU", relationship=EdgeType.POWERS, dependency_strength=1.0),
            GraphEdge(source="EMERGENCY_BUS", target="SERVICE_OT", relationship=EdgeType.POWERS, dependency_strength=1.0),
            GraphEdge(source="EMERGENCY_BUS", target="SERVICE_ER", relationship=EdgeType.POWERS, dependency_strength=1.0),
            
            # HVAC Environmental Cooling Dependencies
            GraphEdge(source="CHILLER_PLANT", target="SERVICE_OT", relationship=EdgeType.COOLS, dependency_strength=0.95),
            GraphEdge(source="CHILLER_PLANT", target="SERVICE_ICU", relationship=EdgeType.COOLS, dependency_strength=0.85),
            GraphEdge(source="CHILLER_PLANT", target="SERVICE_WARD", relationship=EdgeType.COOLS, dependency_strength=0.60),
            
            # Medical Gas / Oxygen Dependencies
            GraphEdge(source="OXYGEN_MANIFOLD", target="SERVICE_ICU", relationship=EdgeType.PROVIDES_GAS, dependency_strength=1.0),
            GraphEdge(source="OXYGEN_MANIFOLD", target="SERVICE_OT", relationship=EdgeType.PROVIDES_GAS, dependency_strength=1.0),
            GraphEdge(source="OXYGEN_MANIFOLD", target="SERVICE_ER", relationship=EdgeType.PROVIDES_GAS, dependency_strength=0.90),
            
            # Water Dependencies
            GraphEdge(source="WATER_PUMP_STATION", target="SERVICE_ICU", relationship=EdgeType.PROVIDES_WATER, dependency_strength=0.70),
            GraphEdge(source="WATER_PUMP_STATION", target="SERVICE_OT", relationship=EdgeType.PROVIDES_WATER, dependency_strength=0.85),
            GraphEdge(source="WATER_PUMP_STATION", target="SERVICE_WARD", relationship=EdgeType.PROVIDES_WATER, dependency_strength=0.60),
        ]

        for edge in edges:
            self.graph.add_edge(
                edge.source,
                edge.target,
                relationship=edge.relationship.value,
                dependency_strength=edge.dependency_strength,
                threshold=edge.threshold,
                is_active=edge.is_active,
                is_redundant=edge.is_redundant,
                **edge.properties
            )

        return self.graph

    def get_nodes_dict(self) -> List[Dict[str, Any]]:
        return [{"id": n, **self.graph.nodes[n]} for n in self.graph.nodes]

    def get_edges_dict(self) -> List[Dict[str, Any]]:
        return [
            {"source": u, "target": v, **data}
            for u, v, data in self.graph.edges(data=True)
        ]
