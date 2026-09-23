"""Simulation Report Generator for ResilienceOS.

Generates executive incident audit reports, canonical resilience breakdown tables,
cascade propagation timelines, threshold violation summaries, and What-If strategy outcome matrices.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional

from models.incident import IncidentState
from models.resilience import ResilienceIndexBreakdown
from models.risk import IncidentRiskSummary
from models.strategy import WhatIfComparison, StrategyResult


class SimulationReportGenerator:
    """Generates structured Markdown and JSON audit reports from simulation states."""

    @staticmethod
    def generate_markdown_report(
        incident: Optional[IncidentState],
        resilience: ResilienceIndexBreakdown,
        risk_summary: Optional[IncidentRiskSummary] = None,
        what_if: Optional[WhatIfComparison] = None,
        scenario_title: Optional[str] = None,
    ) -> str:
        """Generates a complete, publication-ready Markdown Incident & Resilience Audit Report."""
        timestamp_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
        title = scenario_title or (
            f"Incident Report: {incident.source_asset_id}" if incident and incident.source_asset_id else "Campus Baseline Resilience Report"
        )

        lines: List[str] = []
        lines.append(f"# 🏥 ResilienceOS — Executive Simulation Audit Report")
        lines.append(f"**Scenario / Incident:** {title}")
        lines.append(f"**Generated At:** `{timestamp_str}`")
        lines.append(f"**Overall Campus Status:** `{resilience.status_label}` (Score: **{resilience.overall_score:.1f} / 100**)")
        lines.append("")

        # 1. Executive Summary Table
        lines.append("## 1. Executive Incident Summary")
        lines.append("| Metric | Status / Value |")
        lines.append("| :--- | :--- |")
        if incident and incident.is_active:
            lines.append(f"| **Incident ID** | `{incident.incident_id}` |")
            lines.append(f"| **Primary Failure Origin** | `{incident.source_asset_id or 'N/A'}` |")
            lines.append(f"| **Severity** | `{incident.severity.value.upper() if hasattr(incident.severity, 'value') else incident.severity}` |")
            lines.append(f"| **Impacted Infrastructure Assets** | `{len(incident.affected_asset_ids)} assets` |")
            lines.append(f"| **Impacted Clinical Services** | `{len(incident.affected_service_ids)} services` |")
            lines.append(f"| **Unmitigated Blackout Horizon** | `{incident.estimated_unmitigated_blackout_min or 'N/A'} minutes` |")
            lines.append(f"| **Active Mitigation Strategy** | `{incident.active_mitigation_strategy or 'None (Unmitigated)'}` |")
        else:
            lines.append("| **Incident Status** | `NORMAL (No Active Outage)` |")
            lines.append(f"| **Baseline Score** | `{resilience.overall_score:.1f} / 100` |")
        lines.append("")

        # 2. Canonical Resilience Index Breakdown
        lines.append("## 2. Resilience Index Breakdown")
        lines.append("Formulation: **$R = 100 \\times [0.35C + 0.20A + 0.20B + 0.15(1 - T_{norm}) + 0.10(1 - U_{norm})]$**")
        lines.append("")
        lines.append("| Sub-Score Component | Weight | Raw Component Value [0.0 - 1.0] | Scaled Gauge [0 - 100] | Clinical Interpretation |")
        lines.append("| :--- | :---: | :---: | :---: | :--- |")

        subs = resilience.sub_scores
        c_val = subs.canonical.c_continuity if subs.canonical else (subs.service_continuity / 100.0)
        a_val = subs.canonical.a_availability if subs.canonical else (subs.stability_factor / 100.0)
        b_val = subs.canonical.b_backup_margin if subs.canonical else (subs.backup_margin / 100.0)
        t_val = subs.canonical.t_recovery_penalty if subs.canonical else ((100.0 - subs.recovery_readiness) / 100.0)
        u_val = subs.canonical.u_resource_penalty if subs.canonical else ((100.0 - subs.resource_conservation) / 100.0)

        lines.append(f"| **Critical Service Continuity ($C$)** | 35% | `{c_val:.3f}` | `{subs.service_continuity:.1f}` | Vital clinical delivery preservation |")
        lines.append(f"| **Infrastructure Availability ($A$)** | 20% | `{a_val:.3f}` | `{subs.stability_factor:.1f}` | Online & healthy asset ratio |")
        lines.append(f"| **Backup Energy Margin ($B$)** | 20% | `{b_val:.3f}` | `{subs.backup_margin:.1f}` | Generator fuel & UPS battery buffer |")
        lines.append(f"| **Recovery / Thermal Margin ($1 - T$)** | 15% | `{(1.0 - t_val):.3f}` | `{subs.recovery_readiness:.1f}` | HVAC/Chiller thermal & switchover readiness |")
        lines.append(f"| **Resource Conservation ($1 - U$)** | 10% | `{(1.0 - u_val):.3f}` | `{subs.resource_conservation:.1f}` | Load headroom & non-critical circuit shedding |")
        lines.append("")

        # 3. Risk & Threshold Crossings
        if risk_summary:
            lines.append("## 3. Threat Assessment & Threshold Crossings")
            lines.append(f"- **Campus Composite Risk Score:** `{risk_summary.overall_risk_score:.2f}` (`{risk_summary.overall_risk_level.value.upper()}`)")
            lines.append(f"- **Highest Vulnerability Asset:** `{risk_summary.highest_risk_asset or 'None'}`")
            lines.append(f"- **Critical Services At Risk:** `{', '.join(risk_summary.critical_services_at_risk) if risk_summary.critical_services_at_risk else 'None'}`")
            lines.append("")
            if risk_summary.imminent_threshold_crossings:
                lines.append("### Imminent Threshold Excursions")
                lines.append("| Asset ID | Monitored Parameter | Current Reserve | Depletion Rate | Time Remaining | Status |")
                lines.append("| :--- | :--- | :---: | :---: | :---: | :---: |")
                for alert in risk_summary.imminent_threshold_crossings:
                    status_badge = "🔴 **CRITICAL**" if alert.is_critical else "🟡 WARNING"
                    lines.append(
                        f"| `{alert.asset_id}` | `{alert.metric_name}` | `{alert.current_reserve:.1f}` | "
                        f"`{alert.depletion_rate_per_min:.2f}/min` | **{alert.estimated_time_remaining_min:.1f} min** | {status_badge} |"
                    )
                lines.append("")

        # 4. Cascade Propagation Timeline
        if incident and incident.timeline:
            lines.append("## 4. Cascading Failure Timeline")
            lines.append("| Time Offset | Event Title | Affected Nodes | Projected Score | Service Impact |")
            lines.append("| :---: | :--- | :--- | :---: | :--- |")
            for event in incident.timeline:
                nodes_str = ", ".join(event.affected_node_ids) if event.affected_node_ids else "None"
                lines.append(
                    f"| **T+{event.t_offset_min}m** | {event.title} | `{nodes_str}` | `{event.system_resilience_score:.1f}` | {event.service_impact_summary} |"
                )
            lines.append("")

        # 5. What-If Strategy Evaluation Matrix
        if what_if and what_if.strategies:
            lines.append("## 5. What-If Response Strategy Outcome Comparison")
            lines.append(f"**Recommended Strategy:** `{what_if.recommended_strategy_id}` (Rank #1)")
            lines.append(f"**Causal Rationale:** {what_if.causal_explanation}")
            lines.append("")
            lines.append("| Rank | Strategy Name | Code | Projected $R$ | ICU Continuity | OT Continuity | Shed Load (kW) | Backup Runtime | Risk Level |")
            lines.append("| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |")
            for s in what_if.strategies:
                badge = "⭐ **RECOMMENDED**" if s.is_recommended else f"#{s.recommendation_rank}"
                lines.append(
                    f"| {badge} | {s.strategy_name} | `{s.strategy_code}` | **{s.projected_resilience_score:.1f}** | "
                    f"`{s.icu_continuity_pct:.0f}%` | `{s.operating_theatre_continuity_pct:.0f}%` | `{s.non_critical_load_shed_kw:.0f} kW` | "
                    f"`{s.backup_runtime_remaining_hours:.1f} hrs` | `{s.risk_level}` |"
                )
            lines.append("")

        # 6. Tactical Directives
        lines.append("## 6. Actionable Tactical Directives")
        if what_if and what_if.strategies:
            best = what_if.strategies[0]
            lines.append(f"1. **Deploy Recommended Strategy:** `{best.strategy_name}` (`{best.strategy_code}`).")
            lines.append(f"2. **Preserve Life-Safety Circuits:** Maintain ICU at `{best.icu_continuity_pct:.0f}%` and OT at `{best.operating_theatre_continuity_pct:.0f}%`.")
            if best.non_critical_load_shed_kw > 0:
                lines.append(f"3. **Execute Load Shedding:** Shed `{best.non_critical_load_shed_kw:.0f} kW` of non-critical corridors/admin HVAC to extend backup reserves.")
            lines.append(f"4. **Monitor Blackout Reserve:** Current operational buffer is `{best.backup_runtime_remaining_hours:.1f} hours`.")
        else:
            lines.append("1. Continue monitoring normal telemetry streams at 1-second intervals.")
            lines.append("2. Maintain standby generators in ready offline status.")

        lines.append("")
        lines.append("---")
        lines.append("*Report generated by ResilienceOS v2.4 Autonomic Simulation & Decision Engine.*")

        return "\n".join(lines)

    @staticmethod
    def generate_json_report(
        incident: Optional[IncidentState],
        resilience: ResilienceIndexBreakdown,
        risk_summary: Optional[IncidentRiskSummary] = None,
        what_if: Optional[WhatIfComparison] = None,
        scenario_title: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Generates a structured dictionary representation of the simulation report."""
        return {
            "title": scenario_title or "ResilienceOS Simulation Audit",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "resilience_breakdown": resilience.model_dump(mode="json"),
            "incident_state": incident.model_dump(mode="json") if incident else None,
            "risk_summary": risk_summary.model_dump(mode="json") if risk_summary else None,
            "what_if_comparison": what_if.model_dump(mode="json") if what_if else None,
        }
