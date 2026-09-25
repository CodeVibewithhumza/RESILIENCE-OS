"""Hospital Dependency Graph Builder using YAML-driven configuration."""

from pathlib import Path
from typing import Dict, Any, List

import networkx as nx
import yaml

from .schema import EdgeType, GraphNode, GraphEdge


class HospitalTopologyBuilder:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.config = self._load_config()
        self.build_default_topology()

    def _load_config(self) -> Dict[str, Any]:
        """Load canonical hospital configuration from YAML."""
        config_path = (
            Path(__file__).resolve().parent.parent
            / "config"
            / "hospital_model.yaml"
        )

        if not config_path.exists():
            raise FileNotFoundError(
                f"Hospital configuration not found: {config_path}"
            )

        with config_path.open("r", encoding="utf-8") as file:
            config = yaml.safe_load(file) or {}

        return config

    def build_default_topology(self) -> nx.DiGraph:
        """Construct the hospital dependency graph from YAML configuration."""
        self.graph.clear()

        infrastructure_assets = self.config.get("infrastructure_assets", [])
        services = self.config.get("services", [])
        dependencies = self.config.get("dependencies", [])

        # ---------------------------------------------------------
        # 1. Infrastructure Nodes
        # ---------------------------------------------------------
        for asset in infrastructure_assets:
            metadata = dict(asset.get("metadata") or {})

            # Keep operational/configuration fields available to the
            # graph engine without changing the GraphNode schema.
            for key in (
                "nominal_capacity",
                "available_capacity",
                "capacity_unit",
                "redundancy_level",
                "threshold",
                "fuel_level_pct",
                "battery_level_pct",
                "temperature_c",
                "pressure_psi",
                "runtime_remaining_min",
            ):
                if key in asset and asset[key] is not None:
                    metadata[key] = asset[key]

            node = GraphNode(
                id=asset["id"],
                label=asset["name"],
                category="infrastructure",
                name=asset["name"],
                criticality=asset.get("criticality", 1),
                capacity=float(asset.get("nominal_capacity", 100.0)),
                current_load=float(asset.get("current_load", 0.0)),
                health_score=float(asset.get("health_score", 100.0)),
                status=asset.get("status", "normal"),
                floor=int(asset.get("floor", 0)),
                position_x=float(asset.get("position", {}).get("x", 0.0)),
                position_y=float(asset.get("position", {}).get("y", 0.0)),
                position_z=float(asset.get("position", {}).get("z", 0.0)),
                rotation_y=float(asset.get("rotation_y", 0.0)),
                scale=float(asset.get("scale", 1.0)),
                properties={
                    "type": asset["type"],
                    "location": asset.get("location"),
                    **metadata,
                },
            )

            self.graph.add_node(node.id, **node.model_dump())

        # ---------------------------------------------------------
        # 2. Hospital Service Nodes
        # ---------------------------------------------------------
        for service in services:
            metadata = dict(service.get("metadata") or {})

            for key in (
                "min_required_capacity_pct",
                "acceptable_degradation",
                "backup_priority",
            ):
                if key in service:
                    metadata[key] = service[key]

            node = GraphNode(
                id=service["id"],
                label=service["name"],
                category="service",
                name=service["name"],
                criticality=int(service.get("criticality", 1)),
                capacity=100.0,
                current_load=float(
                    service.get("service_continuity_pct", 100.0)
                ),
                health_score=100.0,
                status=service.get("status", "full_operation"),
                floor=int(service.get("floor", 0)),
                position_x=float(service.get("position", {}).get("x", 0.0)),
                position_y=float(service.get("position", {}).get("y", 0.0)),
                position_z=float(service.get("position", {}).get("z", 0.0)),
                rotation_y=float(service.get("rotation_y", 0.0)),
                scale=float(service.get("scale", 1.0)),
                properties={
                    "type": service["type"],
                    "location": service.get("location"),
                    **metadata,
                },
            )

            self.graph.add_node(node.id, **node.model_dump())

        # ---------------------------------------------------------
        # 3. Dependency Edges
        # ---------------------------------------------------------
        for dependency in dependencies:
            relationship = dependency["relationship"]

            # Convert YAML relationship names to the existing enum.
            relationship_map = {
                "supplies": EdgeType.SUPPLIES,
                "feeds": EdgeType.FEEDS,
                "powers": EdgeType.POWERS,
                "backs_up": EdgeType.BACKS_UP,
                "cools": EdgeType.COOLS,
                "provides_water": EdgeType.PROVIDES_WATER,
                "provides_gas": EdgeType.PROVIDES_GAS,
                "depends_on": EdgeType.DEPENDS_ON,
            }

            if relationship not in relationship_map:
                raise ValueError(
                    f"Unsupported dependency relationship: {relationship}"
                )

            edge = GraphEdge(
                source=dependency["source"],
                target=dependency["target"],
                relationship=relationship_map[relationship],
                dependency_strength=float(
                    dependency.get("dependency_strength", 1.0)
                ),
                threshold=float(
                    dependency.get("threshold", 0.70)
                ),
                is_active=bool(
                    dependency.get("is_active", True)
                ),
                is_redundant=bool(
                    dependency.get("is_redundant", False)
                ),
                failure_propagation_rule=dependency.get(
                    "failure_propagation_rule"
                ),
                recovery_behavior=dependency.get(
                    "recovery_behavior"
                ),
                priority=dependency.get("priority"),
                properties={
                    "backup_type": dependency.get("backup_type"),
                },
                )

            if edge.source not in self.graph:
                raise ValueError(
                    f"Dependency source node not found: {edge.source}"
                )

            if edge.target not in self.graph:
                raise ValueError(
                    f"Dependency target node not found: {edge.target}"
                )

            self.graph.add_edge(
                edge.source,
                edge.target,
                relationship=edge.relationship.value,
                dependency_strength=edge.dependency_strength,
                threshold=edge.threshold,
                is_active=edge.is_active,
                is_redundant=edge.is_redundant,
                failure_propagation_rule=edge.failure_propagation_rule,
                recovery_behavior=edge.recovery_behavior,
                priority=edge.priority,
                **edge.properties,
            )

        return self.graph

    def get_nodes_dict(self) -> List[Dict[str, Any]]:
        return [
            {"id": node_id, **self.graph.nodes[node_id]}
            for node_id in self.graph.nodes
        ]

    def get_edges_dict(self) -> List[Dict[str, Any]]:
        return [
            {"source": source, "target": target, **data}
            for source, target, data in self.graph.edges(data=True)
        ]