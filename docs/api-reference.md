# 📡 ResilienceOS — REST API & WebSocket Reference

Base URL: `http://localhost:8000/api/v1`  
WebSocket Stream: `ws://localhost:8000/ws`  
Interactive Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 1. Hospital Topology & Inventory Endpoints

### `GET /hospital/assets`
Returns complete catalog of hospital infrastructure and clinical life-support assets.

**Response `200 OK`**:
```json
[
  {
    "id": "ICU_BED_01",
    "name": "ICU Bed 01 (Cardiac Care)",
    "type": "icu_bed",
    "location": "ICU Wing, Level 3",
    "floor": 3,
    "nominal_capacity": 3.5,
    "available_capacity": 3.5,
    "current_load": 2.1,
    "capacity_unit": "kW",
    "status": "normal",
    "health_score": 100.0,
    "redundancy_level": 2,
    "metadata": {
      "patient_id": "P-9841",
      "ventilator_active": true,
      "spo2_pct": 98,
      "heart_rate_bpm": 74
    }
  }
]
```

### `GET /hospital/services`
Returns all healthcare delivery service units and continuity status.

**Response `200 OK`**:
```json
[
  {
    "id": "SERVICE_ICU",
    "name": "Intensive Care Unit (ICU)",
    "criticality_tier": 1,
    "delivery_percentage": 100.0,
    "at_risk": false,
    "dependencies": ["ICU_BED_01", "UPS_CRITICAL", "OXYGEN_MANIFOLD"]
  }
]
```

---

## 2. Simulation & Failure Injection Endpoints

### `POST /simulation/inject-failure`
Triggers simulated asset or subsystem disruption and propagates cascading impacts.

**Request Body**:
```json
{
  "asset_id": "TRANSFORMER_01",
  "failure_type": "full_trip",
  "severity": 1.0,
  "duration_minutes": 120
}
```

**Response `200 OK`**:
```json
{
  "incident_id": "INC-20260925-01",
  "status": "active",
  "initial_resilience": 82.4,
  "projected_resilience": 38.0,
  "affected_assets_count": 12,
  "services_at_risk": ["SERVICE_ICU", "SERVICE_OT"]
}
```

### `POST /simulation/reset`
Restores digital twin back to baseline 100% nominal state.

---

## 3. Strategy Evaluation & Ranking Endpoints

### `POST /simulation/strategies/rank`
Ranks mitigation strategies A through F using multi-criteria TOPSIS decision analysis.

**Response `200 OK`**:
```json
{
  "recommended_strategy_id": "STRATEGY_A",
  "rankings": [
    {
      "strategy_id": "STRATEGY_A",
      "strategy_name": "Emergency Generator Backup",
      "score": 0.884,
      "projected_resilience": 76.5,
      "services_at_risk_count": 2,
      "estimated_recovery_time_hours": 1.5,
      "key_tradeoffs": ["High fuel consumption", "Immediate life-support continuity"]
    }
  ]
}
```

---

## 4. WebSocket Streaming Protocol

Connect to `ws://localhost:8000/ws` for real-time telemetry streaming:

```json
{
  "event": "TELEMETRY_TICK",
  "timestamp": "2026-09-25T16:20:00Z",
  "resilience_index": 82.0,
  "active_incident": false,
  "asset_deltas": {
    "GEN_01": { "load": 0.0, "status": "standby" },
    "UPS_CRITICAL": { "battery_pct": 100.0 }
  }
}
```
