
# ResilienceOS — API Contracts

## 1. Base Configuration

- Base URL: `/api`
- API Documentation: `/docs`
- OpenAPI Schema: `/openapi.json`

---

## 2. Hospital State

### GET `/api/hospital/state`

Returns the current hospital infrastructure state.

**Request:** No body.

**Response includes:**
- Timestamp
- Resilience index breakdown
- Active incident information
- Asset summary
- Service summary
- Latest telemetry

---

## 3. Assets

### GET `/api/assets`

Returns all infrastructure assets and their operational states.

**Request:** No body.

**Response:** List of asset objects.

---

## 4. Services

### GET `/api/services`

Returns all hospital services and their current operational status.

**Request:** No body.

**Response:** List of service objects.

---

## 5. Telemetry

### GET `/api/telemetry`

Returns the latest hospital telemetry snapshot.

**Request:** No body.

**Response:** Current telemetry snapshot.

---

## 6. Reset Hospital

### POST `/api/hospital/reset`

Resets the hospital digital twin to its baseline state.

**Request:** No body.

**Response Schema:**

```json
{
  "status": "success",
  "message": "Hospital digital twin reset to 100% normal baseline.",
  "resilience_index": 94.5
}
```

The resilience index is constrained to the range `0–100`.

---

## 7. Failure Injection

### POST `/api/failures/inject`

Injects a simulated infrastructure failure and executes cascade propagation.

**Request Schema:**

```json
{
  "asset_id": "GRID_MAIN",
  "failure_type": "complete_outage",
  "severity": "high",
  "duration_minutes": 60,
  "compound_heatwave": false,
  "generator_delay_seconds": 15,
  "ambient_temp_c": 35.0
}
```

**Required field:**
- `asset_id`

**Response includes:**
- Operation status
- Incident details
- Resilience index breakdown
- Confirmation message

**Errors:**
- `404`: Asset not found
- `422`: Request validation failure

---

## 8. What-If Simulation

### GET `/api/simulation/what-if`

Returns response strategies and their projected outcomes for the active incident.

**Request:** No body.

**Response Schema:**

```json
{
  "incident_id": "incident_id",
  "incident_source": "GRID_MAIN",
  "timestamp_evaluated": "ISO-8601 timestamp",
  "unmitigated_baseline_score": 57.4,
  "strategies": [],
  "recommended_strategy_id": "strategy_id",
  "causal_explanation": "Explanation of projected outcomes."
}
```

The `strategies` array contains strategy result objects.

---

## 9. Apply Strategy

### POST `/api/simulation/apply-strategy`

Applies a selected response strategy to the active incident.

**Request Schema:**

```json
{
  "strategy_id": "strat_c"
}
```

**Response Schema:**

```json
{
  "status": "applied",
  "strategy": "Strategy C",
  "message": "Strategy applied successfully.",
  "new_resilience_score": 78.8
}
```

The actual response values depend on the current simulation state.

---

## 10. Dependency Graph

### GET `/api/dependencies`

Returns the hospital infrastructure dependency graph.

**Response includes:**
- Graph nodes
- Graph edges

---

## 11. Bottleneck Analysis

### GET `/api/graph/bottlenecks`

Returns critical infrastructure bottlenecks and vulnerability information.

**Request:** No body.

**Response:** Bottleneck analysis results.

---

## 12. Service Explanation

### GET `/api/explanations/{service_id}`

Returns a causal explanation for a service's risk.

**Query Parameter:**
- `failed_asset_id` (optional)

**Example:**

```text
/api/explanations/ICU?failed_asset_id=GRID_MAIN
```

**Errors:**
- `404`: Service not found

---

## 13. WebSocket Telemetry

### WS `/ws/telemetry`

Provides real-time telemetry updates to connected clients.

**Message Content:**
- Telemetry information
- Asset state updates
- Service state updates

The WebSocket connection is intended for real-time dashboard updates.

---

## 14. Validation and Contract Rules

1. Request data must be validated using Pydantic models.
2. API paths should remain backward compatible.
3. Date-time values must use ISO 8601 format.
4. Errors must return meaningful HTTP status codes.
5. API changes must be communicated to the frontend team.
6. Response schemas must be verified against the backend implementation.
7. Simulation logic must remain inside the relevant backend services.
8. Contract changes should be covered by appropriate tests.

---

## 15. Implementation Status

The documented endpoints represent the current FastAPI backend structure.

The following require separate verification before being marked production-ready:
- Persistent database integration
- Production ML integration
- Production deployment
- Full WebSocket broadcast integration
- Complete response schemas for all endpoints