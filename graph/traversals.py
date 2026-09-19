"""Graph Traversal Engine for cascading failure impact analysis and path finding."""
import networkx as nx
from typing import List, Dict, Any, Set, Tuple, Optional

class GraphTraversalEngine:
    def __init__(self, graph: Optional[nx.DiGraph] = None):
        self.graph = graph or nx.DiGraph()

    def set_graph(self, graph: nx.DiGraph):
        self.graph = graph

    def get_downstream_subgraph(self, source_id: str, max_depth: int = 5) -> List[Dict[str, Any]]:
        """Breadth-first search of all reachable downstream assets and services."""
        if source_id not in self.graph:
            return []

        visited: Set[str] = set()
        queue: List[Tuple[str, int, List[str]]] = [(source_id, 0, [source_id])]
        results: List[Dict[str, Any]] = []

        while queue:
            current_node, depth, path = queue.pop(0)
            if current_node in visited or depth > max_depth:
                continue
            
            visited.add(current_node)
            node_data = self.graph.nodes[current_node]
            
            if current_node != source_id:
                results.append({
                    "node_id": current_node,
                    "depth": depth,
                    "path": path,
                    "label": node_data.get("label", current_node),
                    "category": node_data.get("category", "infrastructure"),
                    "criticality": node_data.get("criticality", 1),
                })

            for neighbor in self.graph.successors(current_node):
                if neighbor not in visited:
                    queue.append((neighbor, depth + 1, path + [neighbor]))

        return results

    def find_all_paths_to_services(self, source_id: str) -> Dict[str, List[List[str]]]:
        """Finds all dependency paths from a failed node to every service node."""
        service_paths: Dict[str, List[List[str]]] = {}
        if source_id not in self.graph:
            return service_paths

        service_nodes = [
            n for n, d in self.graph.nodes(data=True)
            if d.get("category") == "service"
        ]

        for s_node in service_nodes:
            if nx.has_path(self.graph, source_id, s_node):
                paths = list(nx.all_simple_paths(self.graph, source_id, s_node, cutoff=5))
                if paths:
                    service_paths[s_node] = paths

        return service_paths

    def find_critical_bottlenecks(self) -> List[Dict[str, Any]]:
        """Identifies single points of failure (nodes whose failure impacts multiple critical services)."""
        critical_services = [
            n for n, d in self.graph.nodes(data=True)
            if d.get("category") == "service" and d.get("criticality", 1) >= 4
        ]
        
        bottlenecks = []
        for n, d in self.graph.nodes(data=True):
            if d.get("category") == "infrastructure":
                impacted = 0
                for s in critical_services:
                    if nx.has_path(self.graph, n, s):
                        impacted += 1
                if impacted > 1:
                    bottlenecks.append({
                        "node_id": n,
                        "label": d.get("label", n),
                        "impacted_critical_services_count": impacted,
                        "total_critical_services": len(critical_services),
                        "vulnerability_score": round(impacted / len(critical_services) * 100, 1)
                    })
        
        return sorted(bottlenecks, key=lambda x: x["vulnerability_score"], reverse=True)
