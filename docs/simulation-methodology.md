# 🔬 ResilienceOS — Simulation Methodology & Mathematical Formulations

## 1. Overview
The **ResilienceOS Simulation Engine** is a high-fidelity, deterministic state machine and graph-traversal system engineered to model multi-tier physical and clinical dependencies within modern hospital infrastructure.

It mathematically models:
1. **Asset State Degradation & Transition Dynamics**
2. **Multi-Hop Dependency Cascade Propagation**
3. **Backup Spooling, Inverter Transfer & Battery Depletion Dynamics**
4. **Clinical Service Vulnerability & Impact Trajectories**
5. **Recovery Curves & Intervention Restoration Trajectories**

---

## 2. Asset State Machine & Health Scoring

Each physical asset $a \in \mathcal{A}$ has a continuous health score $H_a(t) \in [0, 100]$ and a discrete operational state $S_a(t) \in \{\text{NORMAL}, \text{DEGRADED}, \text{CRITICAL}, \text{FAILED}, \text{RECOVERING}\}$.

### 2.1 State Transition Thresholds
$$\begin{aligned}
S_a(t) = \begin{cases}
\text{NORMAL} & \text{if } H_a(t) \ge 80 \\
\text{DEGRADED} & \text{if } 50 \le H_a(t) < 80 \\
\text{CRITICAL} & \text{if } 20 \le H_a(t) < 50 \\
\text{FAILED} & \text{if } H_a(t) < 20 \\
\text{RECOVERING} & \text{if being restored and } H_a(t) \text{ is strictly increasing}
\end{cases}
\end{aligned}$$

### 2.2 Dynamic Health Score Formulation
Under nominal operation without disruptions:
$$H_a(t) = 100.0$$

When an upstream supply dependency $u \in \text{Parents}(a)$ fails or degrades, the input deficit factor $\delta_a(t)$ is calculated as:
$$\delta_a(t) = \sum_{u \in \text{Parents}(a)} w_{u \to a} \cdot \left(1 - \frac{\text{AvailableCapacity}_u(t)}{\text{RequiredCapacity}_{u \to a}}\right)$$
where $w_{u \to a} \in [0, 1]$ represents the normalized criticality weight of dependency edge $(u, a)$ such that $\sum_u w_{u \to a} = 1.0$.

Health score degradation rate over continuous time-step $\Delta t$:
$$H_a(t + \Delta t) = \max\left(0, H_a(t) - \kappa_a \cdot \delta_a(t) \cdot \Delta t\right)$$
where $\kappa_a$ is the asset-specific vulnerability coefficient.

---

## 3. Dependency Cascade Traversal Algorithm

Cascading failures are computed using a depth-bounded, priority-ordered breadth-first graph traversal over the directed dependency graph $G = (\mathcal{V}, \mathcal{E})$.

```
Algorithm 1: Deterministic Cascade Propagation
Input: Graph G = (V, E), Initial Failed Nodes F_0, Simulation Horizon T_max, Step Delta t
Output: Timeline check-points with asset states, service impacts, and resilience scores

1. Initialize State Queue Q <- F_0 with timestamp T = 0
2. Mark all f in F_0 as FAILED, H_f(0) = 0
3. For each milestone t in [0, 2, 5, 10, 18, 30, 45, 60] minutes:
    a. For each active asset a in V:
        i. Evaluate upstream power, gas, water, and cooling feeds from G.
        ii. If primary feed is offline, check redundant backup paths (e.g. ATS, GEN, UPS).
        iii. If backup is active and capacity >= required load:
                Set a.status = NORMAL or DEGRADED (if running on limited reserve).
             Else:
                Calculate load deficit delta_a(t).
                Degrade H_a(t) according to equation (2.2).
    b. For each clinical service s in Services:
        i. Evaluate all prerequisite asset dependencies D_s subset of V.
        ii. Calculate Service Delivery Ratio SDR_s(t) = (OperationalDependencies) / (TotalDependencies).
        iii. If SDR_s(t) < 0.5 -> s.status = AT_RISK.
    c. Compute Composite Resilience Index R(t).
    d. Emit synchronized timeline delta snapshot.
```

---

## 4. Backup Power & Energy Storage Dynamics

### 4.1 Standby Diesel Generator Warmup Curve
Standby diesel generators ($\text{GEN\_01}, \text{GEN\_02}$) require mechanical start-up, oil pressurization, and frequency synchronization:
$$P_{\text{gen}}(t) = \begin{cases}
0 & \text{for } 0 \le t < t_{\text{crank}} \\
P_{\text{rated}} \cdot \left(\frac{t - t_{\text{crank}}}{t_{\text{warmup}}}\right) & \text{for } t_{\text{crank}} \le t < t_{\text{crank}} + t_{\text{warmup}} \\
P_{\text{rated}} & \text{for } t \ge t_{\text{crank}} + t_{\text{warmup}}
\end{cases}$$
* Nominal values: $t_{\text{crank}} = 10\text{ seconds}$, $t_{\text{warmup}} = 120\text{ seconds}$.

### 4.2 Static UPS Battery Discharge Formulation
When supplying essential clinical life-support loads under main grid outage:
$$E_{\text{bat}}(t + \Delta t) = E_{\text{bat}}(t) - \frac{P_{\text{load}}(t) \cdot \Delta t}{\eta_{\text{inverter}}}$$
$$\text{RuntimeRemaining}(t) = \frac{E_{\text{bat}}(t) \cdot \eta_{\text{inverter}}}{P_{\text{load}}(t)}$$
where $\eta_{\text{inverter}} \approx 0.94$ represents the solid-state inverter conversion efficiency.

---

## 5. Cryogenic Oxygen Pressure & Gas Dynamics

Liquid oxygen ($\text{LOX}$) vaporization and manifold pressure delivery to ICU and Operating Theatre ventilators:
$$P_{\text{manifold}}(t) = P_{\text{tank}}(t) - R_{\text{flow}} \cdot Q_{\text{demand}}(t) - \Delta P_{\text{leak}}(t)$$
* If $P_{\text{manifold}}(t) < 45\text{ PSI}$, ventilator alarms trigger.
* If $P_{\text{manifold}}(t) < 30\text{ PSI}$, secondary reserve cylinders automatically actuate.

---

## 6. Real-Time Synchronization with 3D Digital Twin

1. **State Dispatch**: Every simulation time-step broadcasts state deltas over WebSocket (`/ws`) in $< 15\text{ ms}$.
2. **Dynamic Shader Material Mapping**:
   * Emissive shader pulses on 3D meshes map directly to real-time $H_a(t)$ values.
   * Conduits render moving photon energy particles with velocity $\vec{v} \propto \text{CurrentLoad}_a$.
3. **Smart HUD Culling**: Floating 3D HTML telemetry overlays use distance and occlusion culling to guarantee constant $60\text{ FPS}$ performance.
