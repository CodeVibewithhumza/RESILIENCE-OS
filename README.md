# ResilienceOS 🏥

### Autonomous Hospital Infrastructure Digital Twin & Clinical Resilience Decision Support System

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg?logo=three.js&logoColor=white)](https://threejs.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.2+-orange.svg)](https://networkx.org/)
[![pytest](https://img.shields.io/badge/pytest-103%2F103%20Passing-brightgreen.svg)](tests/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?logo=docker&logoColor=white)](docker-compose.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**ResilienceOS** is an enterprise-grade digital twin platform engineered to safeguard critical acute healthcare environments (Intensive Care Units, Operating Theatres, Emergency Trauma, Cleanrooms). By combining **directed property knowledge graphs**, **physics-informed failure propagation engines**, **multi-criteria decision analysis (MCDA / TOPSIS)**, and **real-time 3D spatial WebGL rendering**, ResilienceOS predicts systemic vulnerabilities, simulates multi-system cascade disruptions, and prescribes prioritized mitigation strategies to ensure zero disruption to life-support care.

---

## 📑 Table of Contents

1. [Executive Summary & Problem Statement](#-executive-summary--problem-statement)
2. [Core Platform Capabilities](#-core-platform-capabilities)
3. [System Architecture & Data Flow](#-system-architecture--data-flow)
4. [Mathematical & Algorithmic Formulations](#-mathematical--algorithmic-formulations)
   - [Directed Property Dependency Graph](#1-directed-property-dependency-graph)
   - [Resilience Index Synthesis ($R$)](#2-resilience-index-synthesis-r)
   - [Physics-Informed Cascade Propagation](#3-physics-informed-cascade-propagation)
   - [TOPSIS Multi-Criteria Decision Ranking](#4-topsis-multi-criteria-decision-ranking)
5. [8-View Command Center Interface](#-8-view-command-center-interface)
6. [Repository & Directory Structure](#-repository--directory-structure)
7. [REST & WebSocket API Reference](#-rest--websocket-api-reference)
8. [Installation & Deployment Guide](#-installation--deployment-guide)
   - [Prerequisites](#prerequisites)
   - [Local Development Setup](#local-development-setup)
   - [One-Click Windows Launcher](#one-click-windows-launcher)
   - [Docker & Containerized Deployment](#docker--containerized-deployment)
   - [Running Automated Verification Tests](#running-automated-verification-tests)
9. [Human-in-the-Loop Safety Protocol](#-human-in-the-loop-safety-protocol)
10. [License](#-license)

---

## 🎯 Executive Summary & Problem Statement

Modern tertiary hospitals are complex interconnected systems where clinical life-support services rely entirely on multi-utility physical infrastructure:

* **Electrical Power:** Medium voltage (11kV) grid feeds, step-down transformers (415V), emergency diesel generators, transfer switches (ATS), and static uninterruptible power supply (UPS) batteries.
* **Medical Gases:** Cryogenic liquid oxygen (LOX) storage, vaporizers, manifold systems, and high-pressure distribution pipelines to ICU mechanical ventilators and surgical pendants.
* **HVAC & Environment:** Water chillers, cooling towers, primary/secondary pumps, and air handling units (AHU) maintaining sterile positive pressure in cleanrooms and Operating Theatres.
* **Domestic & Process Water:** Municipal mains, underground reservoirs, rooftop storage tanks, and hydro-pneumatic booster pumps supplying central sterilization (CSSD), dialyzers, and sanitary systems.

### The Cascade Failure Threat
When a primary asset experiences an unexpected fault (e.g., an 11kV transformer trip or main water booster failure), downstream disruptions do not occur in isolation. Subsystems propagate cascading stress across dependency chains. For instance, losing grid power causes HVAC chillers to stall, resulting in cleanroom thermal runaway within 15 minutes; meanwhile, static UPS batteries discharge rapidly while emergency generators spool up, threatening mechanical ventilation in the ICU.

**ResilienceOS eliminates single-point-of-failure blind spots** by continuously computing dynamic health states, evaluating cascade blast radiuses, and recommending validated mitigation actions within seconds.

---

## ⚡ Core Platform Capabilities

* 🌐 **BIM-Grade 3D Digital Twin:** Spatial WebGL campus reconstruction (React Three Fiber) rendering 5 architectural floor levels (Basement B1, Ground L1, Floor 2, Floor 3, Roof L4), clinical room polygons, interactive 3D assets, dynamic heatmaps, and volumetric status glow shaders.
* 🔗 **Graph Knowledge Engine:** Directed property graph ($G = (\mathcal{V}, \mathcal{E})$) modeling 52 physical nodes and 112 multi-tier dependency edges with relationship taxonomies (`POWERS`, `BACKS_UP`, `SUPPLIES`, `COOLS`, `PROVIDES_WATER`, `PROVIDES_GAS`).
* ⏱️ **Temporal Cascade Simulator:** Simulates discrete multi-hop failure propagation across $T+0 \to T+45$ minute horizons with physics-based battery decay curves, diesel generator startup delays, and cryogenic boil-off dynamics.
* 📊 **Multi-Criteria Resilience Synthesis ($0-100$):** Real-time composite metric aggregating Service Continuity ($S_c$), Backup Redundancy ($R_b$), Dynamic Adaptability ($A_p$), and Recovery Latency ($L_r$).
* ⚖️ **TOPSIS Strategy Lab:** Evaluates and ranks 6 operational response strategies (**Strategies A through F**) against multi-criteria trade-offs (ICU continuity, time-to-impact, operational cost, grid dependency).
* 🧠 **Explainable AI (XAI) Causal Engine:** Generates natural-language reasoning chains directly extracted from graph traversal paths (*"Why is ICU at risk? Because Primary Transformer T1 tripped $\to$ Main Bus dropped $\to$ UPS discharging at 1.8x load"*).
* 📑 **Autonomous Report Generation:** Produces formal executive incident reports, compliance logs, and data exports in PDF, Excel, and PowerPoint formats with live paper-sheet previews.
* 🌓 **Adaptive Dual Theme:** Futuristic Dark Command Center interface and Light Medical Cleanroom visual mode.

---

## 🏗️ System Architecture & Data Flow

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│                           RESILIENCE OS FRONTEND CLIENT                           │
│  React 19 • Vite • React Three Fiber 3D Canvas • Glassmorphism Telemetry HUD      │
│  8 Views: Dashboard | Digital Twin | Start Sim | What-If | Timeline | Risk | Rep │
└────────────────────────────────────────┬──────────────────────────────────────────┘
                                         │ REST APIs & WebSocket (1s Sync)
                                         ▼
┌───────────────────────────────────────────────────────────────────────────────────┐
│                             FASTAPI BACKEND RUNTIME                               │
│  • Singleton Digital Twin State Service    • FastAPI REST Router & Endpoints     │
│  • Real-Time Broadcast WebSocket Manager   • Pydantic V2 Domain Schemas           │
└──────┬─────────────────┬───────────────────┬───────────────────┬──────────────────┘
       │                 │                   │                   │
       ▼                 ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐    ┌──────────────┐    ┌─────────────────────────┐
│ KNOWLEDGE    │  │ CASCADE      │    │ RESILIENCE   │    │ STRATEGY & DECISION     │
│ GRAPH ENGINE │  │ PROPAGATION  │    │ SYNTHESIS    │    │ LAB (MCDA / TOPSIS)     │
│ NetworkX     │  │ Physics &    │    │ Bounded      │    │ Strategies A–F Ranking, │
│ 52 Nodes     │  │ Graph BFS    │    │ Formulation  │    │ Causal Path Reasoning   │
│ 112 Edges    │  │ T+0 → T+45m  │    │ R ∈ [0, 100] │    │ (Explainable AI Engine) │
└──────────────┘  └──────────────┘    └──────────────┘    └─────────────────────────┘
```

---

## 📐 Mathematical & Algorithmic Formulations

### 1. Directed Property Dependency Graph
The hospital infrastructure topology is modeled as a directed multi-edge property graph:

$$\mathcal{G} = (\mathcal{V}, \mathcal{E}, \Phi, \Psi)$$

Where:
* $\mathcal{V} = \mathcal{V}_{\text{infra}} \cup \mathcal{V}_{\text{service}}$ is the set of 52 physical nodes (generators, transformers, pumps, chillers, buses) and 8 critical clinical services.
* $\mathcal{E} \subseteq \mathcal{V} \times \mathcal{V}$ is the set of 112 directed dependency edges.
* $\Phi: \mathcal{V} \to \{\text{Power}, \text{Water}, \text{HVAC}, \text{Gas}, \text{Clinical}\}$ partitions nodes into functional subsystems.
* $\Psi: \mathcal{E} \to \{\text{POWERS}, \text{BACKS\_UP}, \text{SUPPLIES}, \text{COOLS}, \text{PROVIDES\_WATER}, \text{PROVIDES\_GAS}\}$ classifies dependency relationships.

---

### 2. Resilience Index Synthesis ($R$)
The composite Resilience Index $R \in [0, 100]$ evaluates holistic hospital operational integrity as a weighted linear combination of four normalized sub-criteria:

$$R = 100 \times \left( w_s S_c + w_b R_b + w_a A_p + w_l L_r \right)$$

| Component | Metric | Weight ($w_i$) | Formulation |
| :--- | :--- | :--- | :--- |
| **Service Continuity ($S_c$)** | Healthcare delivery across critical units | $w_s = 0.40$ | $S_c = \frac{\sum_{i \in \text{Services}} \omega_i \cdot \text{delivery\_pct}_i}{\sum \omega_i}$ |
| **Backup Redundancy ($R_b$)** | Available standby capacity margin | $w_b = 0.25$ | $R_b = \frac{1}{|\mathcal{A}_{\text{backup}}|} \sum_{j} \frac{C_{\text{avail}, j}}{C_{\text{rated}, j}}$ |
| **Dynamic Adaptability ($A_p$)** | Rerouting & cross-tie switching headroom | $w_a = 0.20$ | $A_p = \frac{\text{Operational Paths}}{\text{Total Dependency Paths}}$ |
| **Latency / Health ($L_r$)** | Equipment health & thermal degradation | $w_l = 0.15$ | $L_r = \frac{1}{|\mathcal{V}_{\text{infra}}|} \sum_{k} \frac{H_k}{100}$ |

*Constraint:* $\sum w_i = 0.40 + 0.25 + 0.20 + 0.15 = 1.00$.

---

### 3. Physics-Informed Cascade Propagation

#### A. Static UPS Battery Depletion
Under emergency inverter discharge, UPS battery runtime follows Peukert-adjusted energy discharge:

$$E(t) = E_0 - \int_{0}^{t} \frac{P_{\text{load}}(\tau)}{\eta_{\text{inverter}}} d\tau, \quad \text{SOC}(t) = \frac{E(t)}{E_{\text{rated}}} \times 100\%$$

When $\text{SOC}(t) \le 20\%$, automatic load-shedding is triggered; at $\text{SOC}(t) = 0\%$, all connected critical branch circuits fail.

#### B. Standby Diesel Generator Thermal Spooling
Standby generators require warmup delay $\tau_{\text{warm}}$ (default 10s ATS fast-crank) before assuming full rated load:

$$P_{\text{gen}}(t) = \begin{cases} 0 & t < t_{\text{start}} \\ P_{\text{rated}} \cdot \left(\frac{t - t_{\text{start}}}{\tau_{\text{warm}}}\right) & t_{\text{start}} \le t < t_{\text{start}} + \tau_{\text{warm}} \\ P_{\text{rated}} & t \ge t_{\text{start}} + \tau_{\text{warm}} \end{cases}$$

---

### 4. TOPSIS Multi-Criteria Decision Ranking
To evaluate mitigation strategies (**Strategies A through F**), the platform utilizes the Technique for Order of Preference by Similarity to Ideal Solution (TOPSIS):

1. **Normalized Decision Matrix ($r_{ij}$):**
   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^{m} x_{kj}^2}}$$
2. **Weighted Normalized Matrix ($v_{ij}$):**
   $$v_{ij} = w_j \cdot r_{ij}$$
3. **Ideal ($A^+$) and Negative-Ideal ($A^-$) Solutions:**
   $$A^+ = \{ \max_i v_{ij} \mid j \in J_{\text{benefit}} \}, \quad A^- = \{ \min_i v_{ij} \mid j \in J_{\text{benefit}} \}$$
4. **Euclidean Distances & Relative Closeness ($C_i^*$):**
   $$D_i^+ = \sqrt{\sum_j (v_{ij} - v_j^+)^2}, \quad D_i^- = \sqrt{\sum_j (v_{ij} - v_j^-)^2}$$
   $$C_i^* = \frac{D_i^-}{D_i^+ + D_i^-}, \quad C_i^* \in [0, 1]$$

---

## 🖥️ 8-View Command Center Interface

The platform provides 8 specialized operational views matching medical command center workflows:

1. 📊 **Dashboard (Executive Overview):** Real-time campus telemetry strip, 4 core KPI cards, interactive 3D campus overlay pins, and live incident log.
2. 🌐 **Digital Twin (3D Spatial BIM):** Full 3D interactive viewport with layer isolation, floor level slicing (B1 to L4), room polygon focus, and individual asset telemetry inspection.
3. ⚡ **Start Simulation (Failure Injection):** Scenario selector (Electrical Grid Outage, Transformer Trip, O2 Rupture, Chiller Trip, Combined Disaster), severity & duration controls, and real-time 3D twin reaction canvas.
4. 🔬 **What-If Analysis (Decision Lab):** Side-by-side comparison of Strategies A through F with TOPSIS scores, trade-off radar charts, and execution levers.
5. ⏱️ **Incident Timeline (Cascade Stepper):** Milestone-based temporal scrubber ($T+0, T+5, T+10, T+20$ min) showing subsystem failure propagation and explainability drawer.
6. 🛡️ **Risk & Resilience (Vulnerability Analytics):** 6 KPI summary pills, 5 circular SVG factor dials, ranked single-point-of-failure (SPOF) table, and clinical care continuity bars.
7. 📑 **Reports (Executive Document Studio):** Incident report generator with PDF, Excel, and PowerPoint export options and formatted live paper sheet preview.
8. ⚙️ **Settings (Model & Rules Configuration):** Hospital topology profiles, simulation speed multipliers, safety threshold rules, 3D options, and Dark/Light theme toggles.

---

## 📁 Repository & Directory Structure

```
Resilience OS/
├── backend/                        # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                    # REST API Endpoints & Routers
│   │   ├── core/                   # Security, Config & Lifecycle
│   │   ├── services/               # State Coordinator & WebSocket Manager
│   │   └── main.py                 # FastAPI App Entrypoint
│   └── Dockerfile                  # Production Backend Container
├── simulation/                     # Physics & Cascade Engine
│   ├── state_engine.py             # Asset & Service State Machine
│   ├── cascade_engine.py           # Breadth-First Multi-Hop Cascade
│   ├── resilience_index.py         # 4-Pillar Resilience Formulator
│   ├── what_if_engine.py           # Strategies A–F & TOPSIS Ranking
│   ├── risk_engine.py              # SPOF & Vulnerability Scoring
│   ├── report_generator.py         # Autonomous Document Formatter
│   └── explanation_engine.py       # Causal Graph Traversal Reasoner
├── graph/                          # Dependency Knowledge Graph
│   ├── schema.py                   # Node & Edge Type Definitions
│   ├── topology_builder.py         # 52-Node Hospital Graph Generator
│   └── traversals.py               # Blast Radius & Centrality Metrics
├── models/                         # Shared Pydantic Schemas & Domain Types
├── scenarios/                      # JSON Scenario Fixtures
├── docs/                           # Technical Specifications
│   ├── simulation-methodology.md   # Mathematical Formulas & Decay Curves
│   ├── graph-topology-specification.md # Graph Schema & Node Registry
│   ├── evaluation-mcda-ranking.md  # TOPSIS & MCDA Decision Formulations
│   └── api-reference.md            # Complete API Documentation
├── frontend/                       # React 19 + Three.js Command Center
│   ├── src/
│   │   ├── components/
│   │   │   ├── DigitalTwin3D/      # 3D BIM Canvas, Rooms, Floors & Shaders
│   │   │   ├── IncidentControl/    # Failure Injection & Cascade Stepper
│   │   │   ├── ResilienceGauge/    # SVG Circular Resilience Dial
│   │   │   ├── StrategyLab/        # Strategy Comparison & TOPSIS Matrix
│   │   │   ├── RiskResilience/     # Risk Dials & SPOF Ranking Table
│   │   │   ├── Reports/            # Document Studio & Live Paper Preview
│   │   │   ├── Settings/           # Topology & Safety Rules Config
│   │   │   ├── StartSimulation/    # Failure Scenario Launchpad
│   │   │   └── Home/               # Interactive Campus Hero & Telemetry
│   │   ├── mock/                   # Deterministic Benchmark State Data
│   │   └── App.jsx                 # 8-View Coordinator
│   ├── Dockerfile                  # Production Frontend Nginx Container
│   └── nginx.conf                  # Reverse Proxy Configuration
├── tests/                          # 103 Unit & Integration Tests (100% Passing)
├── docker-compose.yml              # Multi-Container Orchestration
├── start.bat                       # One-Click Windows Development Runner
└── requirements.txt                # Python Backend Dependencies
```

---

## 📡 REST & WebSocket API Reference

The backend provides OpenAPI 3.0 documentation at `/docs`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hospital/state` | Retrieves live digital twin state, Resilience Index, and sensor telemetry. |
| `GET` | `/api/assets` | Returns catalog of all 52 infrastructure assets with health and load metrics. |
| `GET` | `/api/services` | Returns status of all 8 critical care units with delivery percentage. |
| `POST` | `/api/failures/inject` | Injects equipment failure (e.g. `GRID_MAIN`, `TRANSFORMER_01`). |
| `GET` | `/api/simulation/what-if` | Runs What-If simulation comparing Strategies A through F with TOPSIS scores. |
| `POST` | `/api/simulation/apply-strategy` | Applies intervention strategy and updates digital twin state. |
| `GET` | `/api/dependencies` | Returns complete dependency knowledge graph (nodes + edge attributes). |
| `GET` | `/api/graph/bottlenecks` | Computes betweenness centrality and single-point-of-failure vulnerabilities. |
| `GET` | `/api/explanations/{service_id}` | Returns natural-language causal dependency explanation for service risk. |
| `GET` | `/api/reports/generate` | Generates structured incident analysis and compliance summary report. |
| `POST` | `/api/hospital/reset` | Resets digital twin to 100% nominal baseline state. |
| `WS` | `/ws/telemetry` | WebSocket stream broadcasting real-time state frames every 1.0 second. |

---

## 🚀 Installation & Deployment Guide

### Prerequisites
* **Python 3.10+** (Python 3.11 / 3.14 fully supported)
* **Node.js 18+** & `npm`
* **Docker & Docker Compose** *(Optional, for containerized deployment)*

---

### Local Development Setup

#### 1. Clone Repository & Install Backend
```bash
# Clone the repository
git clone https://github.com/CodeVibewithhumza/RESILIENCE-OS.git
cd RESILIENCE-OS

# Install Python backend dependencies
pip install -r requirements.txt
```

#### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

#### 3. Run Backend & Frontend Servers
In Terminal 1 (Backend):
```bash
python scripts/run_backend.py
```
*Backend API available at: `http://127.0.0.1:8000` | Swagger UI at: `http://127.0.0.1:8000/docs`*

In Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```
*Frontend Command Center available at: `http://localhost:5173`*

---

### One-Click Windows Launcher
On Windows, simply double-click **`start.bat`** in the root directory. It automatically verifies dependencies, starts the FastAPI backend, launches the Vite dev server, and opens the command center.

---

### Docker & Containerized Deployment
Run the complete stack inside isolated production containers using Docker Compose:

```bash
docker compose up --build -d
```

* Frontend Command Center: `http://localhost:80` (or `http://localhost:5173`)
* Backend REST API: `http://localhost:8000`
* Stop services: `docker compose down`

---

### Running Automated Verification Tests
Run the comprehensive test suite (103 unit and integration tests covering cascade propagation, graph traversal, TOPSIS ranking, resilience formulation, and REST/WebSocket APIs):

```bash
pytest -v
```

---

## 🛡️ Human-in-the-Loop Safety Protocol

ResilienceOS is engineered as an **AI-Assisted Decision Support System (DSS)** designed for hospital emergency operations centers (EOC) and facility engineers:

1. **Advisory Role:** All strategy rankings and load-shedding actions are advisory. The system does not directly trigger physical switchgear without human operator confirmation.
2. **Transparent Reasoning:** Every risk score and strategy rank is backed by deterministic graph traversal paths accessible via the Explainability Drawer.
3. **Safety Fallbacks:** Hard-coded safety interlocks prevent emergency generator shedding while ICU life-support circuits remain active.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <sub>ResilienceOS • Hospital Infrastructure Digital Twin & Clinical Resilience Decision Support System</sub>
</div>
