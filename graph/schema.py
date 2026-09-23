"""Graph schema definitions for nodes and relationships."""
from enum import Enum
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field

class EdgeType(str, Enum):
    SUPPLIES = "SUPPLIES"             # Upstream raw feed (e.g. Grid -> Transformer)
    FEEDS = "FEEDS"                   # Distribution line (e.g. Transformer -> Main Bus)
    POWERS = "POWERS"                 # Electrical bus to service/equipment (e.g. Emergency Bus -> ICU)
    BACKS_UP = "BACKS_UP"             # Backup path (e.g. Generator/UPS -> Emergency Bus)
    COOLS = "COOLS"                   # HVAC to Room/Equipment (e.g. Chiller -> Operating Theatre)
    PROVIDES_WATER = "PROVIDES_WATER" # Water pump/tank -> Service
    PROVIDES_GAS = "PROVIDES_GAS"     # Oxygen/Medical gas -> ICU/OT
    DEPENDS_ON = "DEPENDS_ON"         # Generic logical dependency

class GraphNode(BaseModel):
    id: str
    label: str
    category: str = Field(..., description="'infrastructure' or 'service'")
    name: str
    criticality: int = Field(default=1, ge=1, le=5)
    capacity: float = Field(default=100.0)
    current_load: float = Field(default=0.0)
    health_score: float = Field(default=100.0)
    status: str = Field(default="normal")
    floor: int = Field(default=0)
    properties: Dict[str, Any] = Field(default_factory=dict)

class GraphEdge(BaseModel):
    source: str
    target: str
    relationship: EdgeType
    dependency_strength: float = Field(default=1.0, ge=0.0, le=1.0, description="Weight of dependency (1.0 = essential)")
    threshold: float = Field(default=0.70, description="Fraction below which target degrades")
    is_active: bool = Field(default=True)
    is_redundant: bool = Field(default=False)

    failure_propagation_rule: Optional[str] = Field(
        default=None,
        description="Rule used to propagate upstream failure to the dependent target",
    )
    recovery_behavior: Optional[str] = Field(
        default=None,
        description="Rule used to recover the dependent target",
    )
    priority: Optional[int] = Field(
        default=None,
        description="Operational priority of this dependency",
    )

    properties: Dict[str, Any] = Field(default_factory=dict)
