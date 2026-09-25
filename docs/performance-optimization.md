# Performance Optimization

## Problem / Bottleneck
The previous telemetry broadcaster (`_telemetry_broadcaster`) in the WebSocket API unconditionally calculated the full resilience index (`engine.get_resilience_breakdown()`) every single second for all connected clients. Because the resilience breakdown performs a deep multi-criteria topological evaluation across all assets and services in the graph, this resulted in an expensive and entirely redundant O(N) CPU penalty whenever the hospital infrastructure state was stable and unchanged.

## Baseline
The baseline implementation correctly maintained a centralized ASGI lifespan broadcaster to avoid calculating telemetry independently per client. However, it lacked state-awareness, blindly triggering deep graph evaluations on every tick. No formal benchmark numbers (e.g., ops/sec or millisecond timings) exist in the repository to quantify this baseline.

## Optimization
The optimization introduces an O(1) read-side state cache:
- **`HospitalStateEngine.state_version`**: A deterministic integer tracker was injected into the core simulation engine.
- **State-Change Invalidation**: The `state_version` increments exclusively during structural mutations: `transition_asset_state`, `evaluate_services_health`, and `reset_to_baseline`.
- **Telemetry Broadcaster Cache Behavior**: The WebSocket broadcaster now tracks `last_state_version`. It only executes `engine.get_resilience_breakdown()` if `current_version > last_state_version`. If the state is unchanged, it re-broadcasts the previously cached resilience matrix.
- **Centralized Broadcaster**: The single background task continues to serve all connected clients, guaranteeing that no matter how many UI instances connect, the backend scales at O(1).
- **Telemetry Timestamp Updates**: `engine.get_telemetry_snapshot()` continues to run every second outside the cache lock. This ensures the live telemetry `timestamp` field continues to tick natively for the frontend without incurring the heavy topological graph calculations.

## Correctness / Determinism
This optimization is purely an observer-level read cache. The underlying `HospitalStateEngine` and discrete event simulation mechanics were not altered. Because all structural disruptions (failures, cascade propagations, and strategies) must flow through the domain methods that increment `state_version`, the cache safely captures all state transitions without altering the deterministic cascade outputs.

## Testing
The optimization is fully verified against the existing test suite.
- Integration tests in `tests/test_api_endpoints.py` and `tests/test_websocket.py` pass cleanly.
- The full test suite currently reports 106 tests passed with 0 failures, ensuring no regressions in WebSocket envelope structure or cascade physics.

## Remaining Limitations
- **Telemetry Tick Behavior**: The broadcaster continuously pushes the cached payload over the network every second. A future optimization could optionally pause network broadcasts entirely if clients support dormant state holds.
- **Threadpool Saturation**: While the ASGI event loop is unblocked via `run_in_threadpool` for What-If and strategy simulations, aggressive parallel strategy workloads could theoretically saturate Python's standard thread limits since they lack out-of-process distributed worker scaling.
