# 🧠 ResilienceOS — Evaluation & Multi-Criteria Strategy Ranking (MCDA)

## 1. Overview
During severe multi-system disruptions, hospital incident commanders must select from competing mitigation strategies under deep uncertainty.

The **ResilienceOS Strategy Evaluation & Ranking Engine** applies **Multi-Criteria Decision Analysis (MCDA)** combined with the **TOPSIS algorithm (Technique for Order Preference by Similarity to Ideal Solution)** to mathematically rank response options based on patient safety, service continuity, recovery time, and operational risk.

---

## 2. Multi-Criteria Resilience Index Formulation

The overall Hospital Resilience Index $\mathcal{R}(t) \in [0, 100]$ is synthesized from 4 foundational pillars:

$$\mathcal{R}(t) = w_s \cdot S_c(t) + w_b \cdot R_b(t) + w_a \cdot A_p(t) + w_l \cdot L_r(t)$$

where $\sum w_i = 1.0$ with clinical baseline weights:
* $w_s = 0.40$ (Service Continuity Index)
* $w_b = 0.25$ (Backup Redundancy Margin)
* $w_a = 0.20$ (Asset Technical Health)
* $w_l = 0.15$ (Recovery Readiness & Reserve Margin)

### 2.1 Sub-Score Formulations
1. **Service Continuity ($S_c$)**:
   $$S_c(t) = \sum_{s \in \mathcal{S}} \omega_s \cdot \text{OperationalDeliveryRatio}_s(t)$$
   where $\omega_{\text{ICU}} = 0.35, \omega_{\text{OT}} = 0.25, \omega_{\text{ED}} = 0.20, \omega_{\text{Wards}} = 0.10, \omega_{\text{Admin}} = 0.10$.
2. **Backup Redundancy Margin ($R_b$)**:
   $$R_b(t) = \frac{1}{|\mathcal{A}_{\text{crit}}|} \sum_{a \in \mathcal{A}_{\text{crit}}} \min\left(1.0, \frac{\text{BackupCapacity}_a(t)}{\text{RequiredLoad}_a(t)}\right)$$
3. **Asset Technical Health ($A_p$)**:
   $$A_p(t) = \frac{1}{|\mathcal{A}|} \sum_{a \in \mathcal{A}} H_a(t)$$
4. **Recovery Readiness ($L_r$)**:
   $$L_r(t) = 1.0 - \min\left(1.0, \frac{\text{ActiveMTTR}(t)}{\text{MaxAllowableDowntime}}\right)$$

---

## 3. Response Strategy Library (Strategies A through F)

| ID | Nomenclature | Mechanism & Description | Target Objective |
|:---:|---|---|---|
| **`STRATEGY_A`** | **Emergency Generator Spool & Auto-Transfer** | Automatic ATS transfer to Standby Diesel Generators ($\text{GEN\_01}$ + $\text{GEN\_02}$) to sustain primary buses. | Maximize power availability across campus |
| **`STRATEGY_B`** | **Critical Life-Support Ring-Fencing** | Shed non-essential HVAC and Ward circuits to preserve 100% UPS battery for ICU and OT suites. | Protect Tier 1 clinical patient survival |
| **`STRATEGY_C`** | **Secondary Gantry Feed Rerouting** | Dynamic switchover via tie-breakers to secondary transformer $T2$ and standby gas vaporizers. | Bypass damaged substation components |
| **`STRATEGY_D`** | **UPS Runtime Conservation Mode** | Dim lighting, duty-cycle non-critical diagnostic monitors to extend UPS battery duration from $35\text{ min}$ to $> 90\text{ min}$. | Buy time for utility grid restoration |
| **`STRATEGY_E`** | **Controlled Partial Service Triage** | Defer elective surgeries and non-emergent outpatient clinics to concentrate resources on ICU/ED. | Controlled load reduction |
| **`STRATEGY_F`** | **Comprehensive Autonomous Microgrid** | Coordinated multi-system response combining generator dispatch, selective load shed, and oxygen backup. | Holistic optimal recovery |

---

## 4. TOPSIS Strategy Ranking Algorithm

1. **Construct Normalized Decision Matrix**:
   $$r_{ij} = \frac{x_{ij}}{\sqrt{\sum_{k=1}^m x_{kj}^2}}$$
   where $x_{ij}$ is the outcome of Strategy $i$ on Criterion $j$ (Resilience Index, Services at Risk, Recovery Time, Load Shed %).
2. **Weighted Normalized Matrix**:
   $$v_{ij} = w_j \cdot r_{ij}$$
3. **Determine Positive Ideal ($A^+$) and Negative Ideal ($A^-$)**:
   $$A^+ = \{\max_i v_{ij} \mid j \in J_{\text{benefit}}\} \cup \{\min_i v_{ij} \mid j \in J_{\text{cost}}\}$$
   $$A^- = \{\min_i v_{ij} \mid j \in J_{\text{benefit}}\} \cup \{\max_i v_{ij} \mid j \in J_{\text{cost}}\}$$
4. **Calculate Euclidean Distances & Closeness Coefficient**:
   $$S_i^+ = \sqrt{\sum_j (v_{ij} - v_j^+)^2}, \quad S_i^- = \sqrt{\sum_j (v_{ij} - v_j^-)^2}$$
   $$C_i^* = \frac{S_i^-}{S_i^+ + S_i^-}$$
5. **Ranking**: The strategy with highest $C_i^* \in [0, 1]$ is selected as the **AI Recommended Optimal Strategy**.
