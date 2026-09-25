# 📡 ResilienceOS — REST API & WebSocket Reference

Base URL: `http://localhost:8000/api`
Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 1. Hospital State & Topology Endpoints

### `GET /hospital/state`
Returns complete state snapshot of the hospital digital twin, including telemetry, resilience scores, and summaries.
**Response**: `200 OK`
```json
{
  "timestamp": "2026-09-25T16:20:00Z",
  "resilience_index": { "overall_score": 94.5 },
  "is_incident_active": false,
  "assets_summary": { "total": 12, "normal": 12 },
  "services_summary": { "total": 5, "full_operation": 5 },
  "telemetry": { ... }
}
```

### `GET /assets`
Returns all modeled infrastructure assets with real-time status.

### `GET /services`
Returns all hospital services with criticality and delivery percentages.

### `GET /dependencies`
Returns a node-edge graph topology representation of the entire hospital ecosystem, including 3D coordinates.

### `GET /graph/bottlenecks`
Identifies topological bottlenecks and single points of failure in the hospital grid.

### `POST /hospital/reset`
Resets the digital twin back to baseline normal operation.

---

## 2. Simulation & Scenarios

### `GET /scenarios`
Returns available predefined disaster scenarios.

### `POST /scenarios`
Registers a new scenario definition.

### `POST /failures/inject`
Triggers an asset disruption and propagates cascading impacts.
**Request Body**:
```json
{
  "asset_id": "GRID_MAIN",
  "failure_type": "complete_outage",
  "severity": 1.0,
  "duration_minutes": 120
}
```

### `GET /simulation/what-if`
Evaluates and ranks mitigation strategies using multi-criteria TOPSIS decision analysis against Pareto dominance bounds.

### `POST /strategies/apply`
Applies a recommended mitigation strategy to the digital twin.

### `POST /simulation/run`
Persists a snapshot of the current simulation run (strategy and configuration) to the database.

---

## 3. Resilience & Explanations

### `GET /resilience/{id}`
Retrieves a detailed resilience breakdown (overall score and multi-dimensional sub-scores) for a specific simulation run ID.
**Error**: Returns `404 Not Found` if the simulation ID does not exist.

### `GET /explanations/{id}`
Returns a generated causal explanation report summarizing the failure cascade and strategy effectiveness for a simulation run.

---

## 4. Telemetry

### `GET /telemetry`
Returns the current live telemetry snapshot.

### `POST /telemetry/persist`
Persists the current telemetry snapshot to PostgreSQL.

### `GET /telemetry/history`
Retrieves recent persisted telemetry time-series records.

---

## 5. WebSocket Streaming Protocol

ResilienceOS utilizes an ASGI EventBus to push real-time updates seamlessly across thread boundaries.

### `ws://localhost:8000/ws/telemetry`
Provides a periodic `telemetry_tick` stream every second.
Optimization: Broadcast is cached O(1) across all clients and deduplicated if the physical state hasn't changed.

### `ws://localhost:8000/ws/twin`
Provides initial digital twin topology snapshots and streams granular state transitions.

**Standard WebSocket Event Envelope**:
All backend events strictly conform to this schema:
```json
{
  "type": "event_type_name",
  "target_node_id": "ASSET_ID_OR_NULL",
  "payload": {
    "key": "value"
  }
}
```

**Supported Real-Time Event Types**:
- `twin_state_snapshot`
- `telemetry_tick`
- `asset_state_changed`
- `service_health_changed`
- `failure_injected`
- `cascade_triggered`
- `what_if_simulation_completed`
- `simulation_run_persisted`
- `strategy_applied`
- `hospital_reset`

---

## 6. Error Handling
All API errors return a standard JSON envelope:
```json
{
  "error": {
    "code": "validation_error | http_404 | internal_server_error",
    "message": "Human readable description",
    "details": []
  }
}
```
Validation errors return `422`, missing resources return `404`, and unexpected crashes return `500` (stack traces are intentionally sanitized to prevent data leakage).
