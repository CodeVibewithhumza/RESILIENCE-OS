# ResilienceOS 🏥

### AI-Powered Intelligent Hospital Digital Twin for Infrastructure Resilience

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19+-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-R3F-black.svg?logo=three.js&logoColor=white)](https://threejs.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-3.2+-orange.svg)](https://networkx.org/)
[![Tests](https://img.shields.io/badge/pytest-13%2F13%20Passing-brightgreen.svg)](file:///tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

ResilienceOS is an **AI-powered decision-support platform** that models hospital infrastructure, analyzes multi-system dependencies (Power, Oxygen, HVAC, Water), simulates cascading failures, and dynamically evaluates response strategies to protect critical patient care (ICU, Operating Theatres, Emergency).

---

## 🚀 Key Features

* 🏥 **Hospital Digital Twin:** Stateful, real-time synchronized representation of physical assets and critical healthcare services.
* 🔗 **Dependency Knowledge Graph:** Explicit relationship modeling (`SUPPLIES`, `FEEDS`, `POWERS`, `BACKS_UP`, `COOLS`, `PROVIDES_WATER`, `PROVIDES_GAS`) using NetworkX / property graphs.
* ⚡ **Failure Injection & Cascade Propagation:** Depth-bounded breadth-first graph traversal modeling cascading disruptions and time-to-exhaustion timelines ($T+0 \to T+20$).
* 📊 **Multi-Criteria Resilience Index ($0-100$):** Transparent, bounded metric combining Service Continuity ($S_c$), Backup Margin ($R_b$), Stability ($A_p$), and Recovery Readiness ($L_r$).
* 🔄 **What-If Strategy Lab:** Real-time side-by-side simulation and ranking of **Strategies A through F** with automated trade-off analysis.
* 🧠 **Explainable AI (XAI):** Natural-language causal dependency chains (*"Why is ICU at risk?"*) grounded directly in graph traversal paths.
* 🌐 **3D WebGL Canvas & Command Center:** Synchronized 3D isometric twin (React Three Fiber) with glassmorphism telemetry dashboard and real-time WebSockets.
* 🔧 **1-Click Deterministic Reset:** Instant return to normal operating baseline for clean, repeatable demonstrations.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend & APIs** | FastAPI, Python 3.14, Uvicorn, WebSockets, Pydantic V2 |
| **Graph & Simulation** | NetworkX, Scikit-learn (Isolation Forest), NumPy |
| **Frontend & 3D** | React 19, Vite, Three.js, React Three Fiber, React Three Drei |
| **UI & Visualization** | Lucide React, Recharts, Modern Glassmorphism CSS |
| **Testing** | Pytest, HTTPX TestClient (100% test pass rate) |

---

## 🏗️ Project Architecture

```
Resilience OS/
├── backend/app/                 # FastAPI REST & WebSocket Server
│   ├── api/                     # Endpoints (/hospital, /failures, /simulation, /dependencies)
│   ├── services/                # Singleton Digital Twin State Service
│   └── main.py                  # API Application Entrypoint
├── simulation/                  # Core Simulation & Mathematical Engine
│   ├── state_engine.py          # State machine transitions & telemetry generator
│   ├── cascade_engine.py        # Failure propagation & timeline scheduler
│   ├── resilience_index.py      # Normalized [0, 100] index & sub-score calculator
│   ├── what_if_engine.py        # Strategies A-F evaluator & ranking matrix
│   └── explanation_engine.py    # Causal graph path reasoning ("Why?")
├── graph/                       # Knowledge Graph & Topology Engine
│   ├── schema.py                # Graph nodes & relationship types
│   ├── topology_builder.py      # Canonical hospital dependency graph builder
│   └── traversals.py            # Blast radius & single-point-of-failure analysis
├── models/                      # Shared Pydantic Schemas & Domain Types
├── scenarios/                   # Data-driven JSON incident scenario fixtures
├── frontend/                    # Modern React + Three.js 3D Digital Twin UI
├── tests/                       # Automated unit and integration test suite
└── scripts/                     # Developer launchers & utility scripts
```

---

## 🏃 Quick Start

### 1. Prerequisites
* **Python 3.10+** (Python 3.14 supported)
* **Node.js 18+** & `npm`

### 2. Backend Setup & Run
```powershell
# Install backend dependencies
pip install -r requirements.txt

# Run the automated test suite
pytest -v

# Launch the FastAPI Backend Server
python scripts/run_backend.py
```
* **Interactive API Documentation:** Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.
* **Live Health Check:** [http://127.0.0.1:8000/api/hospital/state](http://127.0.0.1:8000/api/hospital/state)

### 3. Frontend Setup & Run
```powershell
cd frontend
npm install
npm run dev
```
* **Dashboard & 3D Twin UI:** Open [http://localhost:5173](http://localhost:5173).

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/hospital/state` | Live digital twin state, Resilience Index, and sensor telemetry. |
| `GET` | `/api/assets` | Catalog of all 11 infrastructure assets with health & load metrics. |
| `GET` | `/api/services` | Catalog of all 5 hospital services with criticality and delivery %. |
| `POST` | `/api/failures/inject` | Trigger simulated failure (e.g. `GRID_MAIN`, `TRANSFORMER_01`). |
| `GET` | `/api/simulation/what-if` | Run What-If simulation comparing Strategies A through F. |
| `POST` | `/api/simulation/apply-strategy` | Apply intervention strategy and transition digital twin state. |
| `GET` | `/api/dependencies` | Retrieve complete dependency knowledge graph (nodes + edges). |
| `GET` | `/api/graph/bottlenecks` | Single-point-of-failure and vulnerability rankings. |
| `GET` | `/api/explanations/{service_id}` | Causal step-by-step explanation of service risk. |
| `POST` | `/api/hospital/reset` | Deterministic 1-click reset to 100% normal operating baseline. |
| `WS` | `/ws/telemetry` | Real-time 1-second streaming WebSocket for telemetry & 3D twin. |

---

## 👥 Team & Roles

* **Mohammed Humza** — Project Structure, Simulation Engine, Cascade & 3D Twin
* **Arjit Bhadouria** — System Architecture, API Design & FastAPI Core
* **Anuj Kushwah (Gurujii)** — Metrics, Strategy Design & Resilience Formulation
* **Balwant Singh (Pappu)** — Data Schemas, Asset Catalog & Graph Dependencies
* **Jatin Kumar** — Frontend Skeleton, UI Components & Dashboard Layout
* **Shishant Yadav** — Testing, Verification & Presentation Readiness

---

## ⚠️ Prototype Disclaimer

ResilienceOS is a prototype decision-support system designed for hackathon demonstration and research exploration. All hospital telemetry, asset parameters, and incident scenarios are simulated. The system is designed for **human-in-the-loop decision guidance** and is **not** intended for autonomous equipment control, direct clinical diagnosis, or live building management deployment.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

**ResilienceOS — Simulating failures. Understanding dependencies. Supporting resilient decisions.**
