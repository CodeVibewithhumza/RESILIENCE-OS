# ResilienceOS — System Architecture

## 1. Purpose

ResilienceOS is an AI-powered hospital infrastructure resilience
decision-support system using a digital twin and what-if simulation.

## 2. High-Level Data Flow

Simulated Telemetry
        ↓
State Engine
        ↓
Digital Twin Model
        ↓
Dependency Graph + ML Engine
        ↓
Cascade Engine
        ↓
What-If Simulator
        ↓
Response Evaluator
        ↓
Resilience Index
        ↓
Explainability
        ↓
Human Operator / Dashboard

## 3. Core Components

| Component | Responsibility |
|---|---|
| Telemetry Simulator | Generates infrastructure telemetry |
| State Engine | Maintains asset and service states |
| Digital Twin | Represents entities, relationships and history |
| Dependency Graph | Represents infrastructure dependencies |
| ML Engine | Supports anomaly and risk estimation |
| Cascade Engine | Propagates failures through dependencies |
| What-If Simulator | Evaluates response strategies |
| Response Evaluator | Compares strategy outcomes |
| Resilience Index | Calculates resilience score |
| Explainability | Provides causal explanation |
| FastAPI Backend | Exposes system APIs |
| Dashboard | Displays system state and decisions |

## 4. Backend Responsibilities

- Expose REST APIs through FastAPI.
- Provide WebSocket updates for telemetry.
- Coordinate the State Engine and simulation modules.
- Return consistent API responses.
- Connect frontend requests with backend services.

## 5. Current API Modules

- Hospital state and telemetry
- Failure injection
- What-if simulation
- Strategy application
- Dependency graph
- Bottleneck analysis
- Service explanations
- WebSocket telemetry updates

## 6. Phase 0 Completion Criteria

- Module responsibilities are defined.
- Data flow is documented.
- API and module boundaries are identified.
- Interface contracts are prepared.
- All team members understand module ownership.

## 7. Implementation Status

The current repository contains the FastAPI backend,
state engine, cascade simulation, graph APIs,
what-if simulation and WebSocket telemetry support.

ML integration, persistent storage and production deployment
must be verified separately before being marked complete.
