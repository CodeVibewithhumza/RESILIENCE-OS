
# ResilienceOS — Module Ownership

| Module | Primary Responsibility | Integration With |
|---|---|---|
| FastAPI Backend | REST APIs, WebSocket, integration | All modules |
| Telemetry Simulator | Generate simulated sensor data | State Engine |
| State Engine | Maintain asset and service states | Cascade Engine, Digital Twin |
| Digital Twin Model | Represent assets, services and relationships | Graph, State Engine |
| Dependency Graph | Store and traverse infrastructure dependencies | Cascade Engine, Explainability |
| ML Engine | Anomaly detection and risk estimation | State Engine, Resilience Index |
| Cascade Engine | Propagate failures through dependencies | State Engine, Graph |
| What-If Simulator | Simulate response strategies | Cascade Engine, Evaluator |
| Response Evaluator | Compare strategy outcomes | What-If Simulator, Resilience Index |
| Resilience Index | Calculate resilience score | Evaluator, Explainability |
| Explainability | Generate causal explanations | Graph, Cascade Engine |
| Frontend Dashboard | Display state, alerts and decisions | FastAPI Backend |
| 3D Digital Twin | Visualize infrastructure state | Frontend, Backend |

## Integration Rules

1. Each module owns its internal business logic.
2. Modules communicate through defined contracts.
3. Backend coordinates requests but does not duplicate simulation logic.
4. API changes must be communicated to the frontend team.
5. Integration tests must verify cross-module behavior.
6. A module is complete only when its tests and integration requirements are met.