import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  FileText,
  Download,
  FileCheck,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Presentation,
  Check,
  AlertTriangle,
  Clock,
  Box,
  TrendingDown,
  RefreshCw,
  Printer,
  ChevronDown,
  Zap,
  Activity,
  CheckCircle2,
  Share2,
  Copy,
  Eye,
  X,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Sparkles,
  Gauge,
  Sliders,
  ShieldAlert,
  BatteryCharging,
  Wind,
  Droplets
} from 'lucide-react'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './ReportsView.css'
import { getSimulationReport, getWhatIfAnalysis } from '../../services/simulationApi'

export default function ReportsView({ resilience, incident, assets = [], onNotify }) {
  const [selectedReportType, setSelectedReportType] = useState('incident')
  const [timeRange, setTimeRange] = useState('Full Event (0 - 2 hours)')
  const [outputFormat, setOutputFormat] = useState('pdf')

  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [whatIfData, setWhatIfData] = useState(null)
  const [reportError, setReportError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  // Interactive Report Review Modal & Trajectory Graph States
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [reviewZoom, setReviewZoom] = useState('100%') // 'fit' | '100%' | '125%'
  const [graphTab, setGraphTab] = useState('trajectory') // 'trajectory' | 'breakdown' | 'margins'
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const [showStressCascade, setShowStressCascade] = useState(false)
  const [showConfidenceCorridor, setShowConfidenceCorridor] = useState(true)

  const [includedSections, setIncludedSections] = useState({
    exec_summary: true,
    resilience_metrics: true,
    timeline: true,
    system_impact: true,
    response_strategies: true,
    recommendations: true
  })

  const toggleSection = (key) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Load report data from backend
  const fetchReport = useCallback(async (showToastNotice = false) => {
    setIsGenerating(true)
    setReportError(null)

    try {
      const [simRes, whatIfRes] = await Promise.all([
        getSimulationReport('json', null),
        getWhatIfAnalysis()
      ])

      if (simRes.success && simRes.data) {
        setReportData(simRes.data)
        setGeneratedAt(simRes.data.generated_at || new Date().toISOString())
      } else {
        setReportError(simRes.error || 'Failed to generate report from simulation engine')
      }

      if (whatIfRes.success && whatIfRes.data) {
        setWhatIfData(whatIfRes.data)
      }

      if (showToastNotice && onNotify) {
        if (simRes.success) {
          onNotify('Report generated successfully! Ready for export.', 'success')
        } else {
          onNotify(simRes.error || 'Report generation failed', 'error')
        }
      }
    } catch (err) {
      const msg = err?.message || 'Network error fetching report'
      setReportError(msg)
      if (showToastNotice && onNotify) {
        onNotify(msg, 'error')
      }
    } finally {
      setIsGenerating(false)
    }
  }, [onNotify])

  // Automatically fetch on mount so report is never empty
  useEffect(() => {
    fetchReport(false)
  }, [fetchReport])

  // Data extractors
  const activeInc = reportData?.incident_state || (incident?.is_active ? incident : null)
  const resBreakdown = reportData?.resilience_breakdown || resilience
  const riskSummary = reportData?.risk_summary
  const effectiveWhatIf = reportData?.what_if_comparison || whatIfData

  const currentResScore = resBreakdown?.overall_score ?? resilience?.overall_score ?? 93.9
  const baselineDelta = resBreakdown?.delta_from_baseline ?? (resilience?.delta_from_baseline ?? 0.0)
  const statusLabel = resBreakdown?.status_label ?? resilience?.status_label ?? 'OPTIMAL'
  const subScores = resBreakdown?.sub_scores ?? resilience?.sub_scores ?? {}

  const affectedServicesCount = activeInc ? (activeInc.affected_service_ids?.length || 0) : 0
  const affectedAssetsCount = activeInc ? (activeInc.affected_asset_ids?.length || 0) : 0

  // Asset risks derived list
  const assetRiskList = useMemo(() => {
    if (!riskSummary?.asset_risks) return []
    return Object.values(riskSummary.asset_risks).sort((a, b) => b.risk_score - a.risk_score)
  }, [riskSummary])

  const vulnerableAssets = useMemo(() => {
    return assetRiskList.filter((a) => a.risk_score > 0 || a.risk_level?.toLowerCase() !== 'low')
  }, [assetRiskList])

  // Effective timeline events
  const timelineEvents = useMemo(() => {
    const rawEvents = activeInc?.timeline || []
    if (timeRange === 'First 30 Minutes') {
      return rawEvents.filter((ev) => ev.t_offset_min <= 30)
    }
    return rawEvents
  }, [activeInc, timeRange])

  // Markdown builder respecting active report type and toggled sections
  const buildMarkdownReport = () => {
    const timeStr = generatedAt ? new Date(generatedAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    const reportTitle = `${selectedReportType.toUpperCase()} AUDIT REPORT`

    let md = `# 🏥 ResilienceOS — Executive Simulation Audit Report\n`
    md += `**Document Classification:** OFFICIAL // HOSPITAL INCIDENT DECISION-SUPPORT BRIEFING\n`
    md += `**Report Type:** ${reportTitle}\n`
    md += `**Generated At:** \`${timeStr}\`\n`
    md += `**Campus Operational Status:** \`${statusLabel}\` (Resilience Index: **${currentResScore.toFixed(1)} / 100**)\n\n`

    if (includedSections.exec_summary) {
      md += `## 1. Executive Summary\n`
      if (activeInc && activeInc.is_active) {
        md += `A simulated failure event was evaluated for primary asset **${activeInc.source_asset_id}** at severity **${activeInc.severity?.toUpperCase() || 'HIGH'}** (Incident ID: \`${activeInc.incident_id}\`). `
        md += `Modeled cascade propagation evaluates that **${affectedAssetsCount} modeled infrastructure assets enter a modeled failed or degraded state within the simulated scenario**, placing **${affectedServicesCount} modeled service domains in a degraded state**. `
        md += `Configured unmitigated scenario horizon: **${activeInc.estimated_unmitigated_blackout_min || 18} minutes**. Multi-objective response strategies evaluated under the configured Balanced profile.\n\n`
      } else {
        md += `Hospital infrastructure is operating in a state of **NOMINAL CAMPUS STABILITY**. All critical healthcare delivery circuits (ICU, Emergency, Surgery OT, Inpatient Wards) maintain continuous utility and emergency feed redundancy. No active equipment trips detected.\n\n`
      }
    }

    if (activeInc && activeInc.is_active) {
      const src = activeInc.source_asset_id || 'TRANSFORMER_01'
      md += `## 2. Modeled Causal Dependency Cascade\n`
      md += `\`\`\`text\n`
      md += `Failure Origin:           [ ${src} ]\n`
      md += `       ↓\n`
      md += `Primary Electrical Feed:  [ PRIMARY FEEDER ]\n`
      md += `       ↓\n`
      md += `Distribution Node:        [ MAIN_BUS ]\n`
      md += `       ↓\n`
      md += `Dependent Infrastructure: [ CHILLER_PLANT ]\n`
      md += `       ↓\n`
      md += `Affected Service Domain:  [ ICU + OT ]\n`
      md += `\`\`\`\n`
      md += `*The simulation traces state changes across configured infrastructure dependencies and estimates modeled downstream service impacts over simulated time.*\n\n`
    }

    if (includedSections.resilience_metrics) {
      md += `## 3. Canonical Resilience Metrics\n`
      md += `Formulation: **$R = 100 \\times [0.35C + 0.20A + 0.20B + 0.15(1 - T_{norm}) + 0.10(1 - U_{norm})]$**\n\n`
      md += `| Sub-Score Metric | Weight | Value (0-100) | Operational Context |\n`
      md += `| :--- | :---: | :---: | :--- |\n`
      md += `| **Critical Service Continuity ($C$)** | 35% | **${(subScores.service_continuity ?? 100).toFixed(1)}** | Vital clinical life-support preservation |\n`
      md += `| **Infrastructure Availability ($A$)** | 20% | **${(subScores.stability_factor ?? 88.2).toFixed(1)}** | Online healthy physical assets ratio |\n`
      md += `| **Backup Energy Margin ($B$)** | 20% | **${(subScores.backup_margin ?? 88.8).toFixed(1)}** | Diesel fuel & battery reserves buffer |\n`
      md += `| **Recovery Readiness ($1 - T$)** | 15% | **${(subScores.recovery_readiness ?? 100).toFixed(1)}** | Chiller thermal reserve & switchover speed |\n`
      md += `| **Resource Conservation ($1 - U$)** | 10% | **${(subScores.resource_conservation ?? 100).toFixed(1)}** | Load shedding & reserve conservation headroom |\n\n`
    }

    if (includedSections.timeline && (selectedReportType === 'incident' || selectedReportType === 'simulation')) {
      md += `## 4. Incident & Cascade Propagation Timeline\n`
      if (timelineEvents.length > 0) {
        md += `| Offset | Incident Event | Impacted Nodes | Projected Resilience | Clinical Delivery Impact |\n`
        md += `| :---: | :--- | :--- | :---: | :--- |\n`
        timelineEvents.forEach((ev) => {
          const nodes = ev.affected_node_ids?.join(', ') || 'N/A'
          const cleanSummary = (ev.service_impact_summary || '').replace(/^CRITICAL RESERVE BOUNDARY:\s*/i, '')
          const displayTitle = (ev.title === 'Critical Reserve Depletion Boundary' || ev.title === 'Critical Exhaustion Boundary')
            ? 'Critical Reserve Boundary'
            : ev.title
          md += `| **T+${ev.t_offset_min}m** | ${displayTitle} | \`${nodes}\` | **${ev.system_resilience_score?.toFixed(1)}** | ${cleanSummary} |\n`
        })
        md += `\n`
      } else {
        md += `*No active cascading failure events recorded in current time window.*\n\n`
      }
    }

    if (includedSections.system_impact && (selectedReportType === 'risk' || selectedReportType === 'simulation')) {
      md += `## 5. Threat & Vulnerability Assessment\n`
      md += `- **Overall Campus Composite Risk:** **${((riskSummary?.overall_risk_score ?? 0) * 100).toFixed(1)}%** (${riskSummary?.overall_risk_level?.toUpperCase() || 'LOW'})\n`
      md += `- **Highest Vulnerability Asset:** \`${riskSummary?.highest_risk_asset || 'None'}\`\n`
      md += `- **Critical Services at Risk:** ${riskSummary?.critical_services_at_risk?.length ? riskSummary.critical_services_at_risk.join(', ') : 'None'}\n\n`

      if (riskSummary?.imminent_threshold_crossings?.length > 0) {
        md += `### Imminent Threshold Excursions\n`
        md += `| Asset ID | Monitored Metric | Current Reserve | Depletion Rate | Time Remaining | Status |\n`
        md += `| :--- | :--- | :---: | :---: | :---: | :---: |\n`
        riskSummary.imminent_threshold_crossings.forEach((alert) => {
          const badge = alert.is_critical ? '🔴 CRITICAL' : '🟡 WARNING'
          md += `| \`${alert.asset_id}\` | ${alert.metric_name} | ${alert.current_reserve?.toFixed(1)} | ${alert.depletion_rate_per_min?.toFixed(2)}/min | **${alert.estimated_time_remaining_min?.toFixed(1)} min** | ${badge} |\n`
        })
        md += `\n`
      }
    }

    if (includedSections.response_strategies && effectiveWhatIf?.strategies?.length > 0) {
      md += `## 6. What-If Multi-Attribute Strategy Evaluation\n`
      md += `*Multi-objective strategy comparison under the configured Balanced profile.*\n\n`
      if (effectiveWhatIf.causal_explanation || effectiveWhatIf.recommendation_rationale) {
        md += `**Evaluation Rationale:** ${effectiveWhatIf.causal_explanation || effectiveWhatIf.recommendation_rationale}\n\n`
      }
      md += `| Rank | Strategy Option | Code | Proj. $R$ | Simulated ICU Cont. | Simulated OT Cont. | Load Shed | Simulated Runtime | Modeled Risk Profile |\n`
      md += `| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`
      effectiveWhatIf.strategies.forEach((s) => {
        const badge = s.is_recommended ? '⭐ HIGHEST SIMULATED INDEX' : `#${s.recommendation_rank || '-'}`
        md += `| ${badge} | ${s.strategy_name} | \`${s.strategy_code}\` | **${s.projected_resilience_score?.toFixed(1)}** | ${s.icu_continuity_pct?.toFixed(0)}% | ${s.operating_theatre_continuity_pct?.toFixed(0)}% | ${s.non_critical_load_shed_kw?.toFixed(0)} kW | ${s.backup_runtime_remaining_hours?.toFixed(1)}h | ${s.risk_level} |\n`
      })
      md += `\n`
    }

    if (includedSections.recommendations) {
      md += `## 7. Actionable Tactical Directives & Simulated Decision-Support Considerations\n`
      if (effectiveWhatIf?.strategies?.length > 0) {
        const topStrat = effectiveWhatIf.strategies.find((s) => s.is_recommended) || effectiveWhatIf.strategies[0]
        md += `1. **Human Review Protocol:** Conduct human operator review of simulated strategy options prior to selecting or executing any physical response.\n`
        md += `2. **Critical-Service Continuity:** Strategy models maintaining the configured ICU-supporting infrastructure load at \`${topStrat.icu_continuity_pct?.toFixed(0)}%\` and Operating Theatres at \`${topStrat.operating_theatre_continuity_pct?.toFixed(0)}%\` in the simulation before auxiliary transfer transitions.\n`
        if (topStrat.non_critical_load_shed_kw > 0) {
          md += `3. **Simulated Load Shedding:** Assess shedding \`${topStrat.non_critical_load_shed_kw?.toFixed(0)} kW\` of auxiliary loads to extend simulated generator reserve duration (\`${topStrat.backup_runtime_remaining_hours?.toFixed(1)} h\`).\n`
        }
      } else {
        md += `1. Maintain real-time telemetry streaming at 1.0 second heartbeat intervals.\n`
        md += `2. Maintain emergency standby diesel generators GEN_01 and GEN_02 in warm auto-transfer standby.\n`
        md += `3. Verify UPS_CRITICAL battery capacity margin (>40 min required).\n`
      }
      md += `\n`
    }

    md += `## 8. Simulation Scope\n`
    md += `- **Data Source:** Synthetic Infrastructure Data\n`
    md += `- **Simulation Mode:** Scenario Simulation\n`
    md += `- **Scenario Horizon:** 20 simulated minutes\n`
    md += `- **Decision Mode:** Human-in-the-Loop\n`
    md += `- **Physical Control:** Not Enabled\n`
    md += `- **Clinical Data:** Not Used\n\n`

    md += `---\n`
    md += `*ResilienceOS Digital Twin Simulation Engine*\n`
    md += `*Simulation Mode • Synthetic Infrastructure Data • Human-in-the-Loop Decision Support*\n`
    md += `*Generated: ${timeStr} | Simulation ID: \`${activeInc?.incident_id || 'INC-TRANSFORMER_01-01'}\`*\n`
    return md
  }

  // Isolated print handler to eliminate sidebar/header and start on Page 1
  const handlePrintPdf = () => {
    if (onNotify) onNotify('Opening print-to-PDF dialog for executive report...', 'info')

    const printTarget = document.getElementById('printable-a4-sheet')
    if (!printTarget) {
      window.print()
      return
    }

    try {
      const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
        .map((el) => el.outerHTML)
        .join('\n')

      const iframe = document.createElement('iframe')
      iframe.style.position = 'fixed'
      iframe.style.right = '0'
      iframe.style.bottom = '0'
      iframe.style.width = '0'
      iframe.style.height = '0'
      iframe.style.border = '0'
      iframe.style.zIndex = '-9999'
      document.body.appendChild(iframe)

      const doc = iframe.contentWindow.document
      doc.open()
      doc.write(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="utf-8" />
            <title>ResilienceOS_${selectedReportType.toUpperCase()}_Report</title>
            ${styles}
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm 10mm;
              }
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              .a4-document-paper {
                width: 100% !important;
                max-width: 100% !important;
                min-height: 275mm !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
                background: #ffffff !important;
                color: #0f172a !important;
                font-size: 9.5px !important;
                display: flex !important;
                flex-direction: column !important;
                justify-content: flex-start !important;
                box-sizing: border-box !important;
              }
              .a4-doc-footer {
                margin-top: auto !important;
                padding-top: 10px !important;
                border-top: 1.5px solid #cbd5e1 !important;
              }
              .a4-section-block {
                page-break-inside: avoid;
                break-inside: avoid;
                margin-bottom: 6px;
              }
              .hide-on-print {
                display: none !important;
              }
            </style>
          </head>
          <body>
            <div class="a4-document-paper">
              ${printTarget.innerHTML}
            </div>
          </body>
        </html>
      `)
      doc.close()

      setTimeout(() => {
        try {
          iframe.contentWindow.focus()
          iframe.contentWindow.print()
        } catch (e) {
          window.print()
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe)
            }
          }, 2000)
        }
      }, 250)
    } catch (e) {
      window.print()
    }
  }

  // Handle file downloads
  const handleDownload = async (overrideFormat = null) => {
    const fmt = overrideFormat || outputFormat
    setDownloadMenuOpen(false)

    if (fmt === 'pdf') {
      handlePrintPdf()
      return
    }

    if (fmt === 'markdown') {
      if (onNotify) onNotify('Exporting executive Markdown audit report...', 'info')
      const mdContent = buildMarkdownReport()
      const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ResilienceOS_${selectedReportType}_Report_${new Date().toISOString().slice(0, 10)}.md`
      a.click()
      URL.revokeObjectURL(url)
      return
    }

    if (fmt === 'json') {
      if (onNotify) onNotify('Exporting structured JSON report data...', 'info')
      const exportJson = {
        title: `ResilienceOS ${selectedReportType.toUpperCase()} Audit Data`,
        document_classification: 'OFFICIAL // HICS ADVISORY & SIMULATION',
        generated_at: generatedAt || new Date().toISOString(),
        selected_report_type: selectedReportType,
        time_range: timeRange,
        included_sections: includedSections,
        resilience_breakdown: resBreakdown,
        incident_state: activeInc,
        risk_summary: riskSummary,
        what_if_comparison: effectiveWhatIf
      }
      const blob = new Blob([JSON.stringify(exportJson, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ResilienceOS_${selectedReportType}_Data_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Report Specific Content Renderers
  const renderIncidentContent = () => {
    if (activeInc && activeInc.is_active) {
      return (
        <div className="a4-section-block">
          <span className="a4-section-heading">Active Incident Diagnostics & Modeled Impact</span>
          <div className="a4-info-callout" style={{ borderLeft: '3px solid #EF4444', background: '#FEF2F2', padding: '6px 8px', borderRadius: '3px' }}>
            <p className="a4-para" style={{ color: '#991B1B' }}>
              <strong>SIMULATED OUTAGE EVENT:</strong> Incident <code>{activeInc.incident_id}</code> evaluated on <strong>{activeInc.source_asset_id}</strong>. Severity rated <strong>{activeInc.severity?.toUpperCase() || 'HIGH'}</strong>. Configured scenario horizon: <strong>{activeInc.estimated_unmitigated_blackout_min || 18} minutes</strong>.
            </p>
          </div>

          {/* Modeled Causal Dependency Cascade Chain */}
          <div className="a4-cascade-diagram font-mono" style={{ margin: '6px 0' }}>
            <span className="a4-sub-label">Modeled Causal Dependency Cascade</span>
            <div className="cascade-path-flow">
              <div className="cascade-node node-origin">
                <span className="node-tag">FAILURE ORIGIN</span>
                <span className="node-id">{activeInc.source_asset_id || 'TRANSFORMER_01'}</span>
              </div>
              <span className="cascade-arrow">➔</span>
              <div className="cascade-node node-danger">
                <span className="node-tag">PRIMARY ELECTRICAL FEED</span>
                <span className="node-id">PRIMARY FEEDER</span>
              </div>
              <span className="cascade-arrow">➔</span>
              <div className="cascade-node node-warning">
                <span className="node-tag">DISTRIBUTION NODE</span>
                <span className="node-id">MAIN_BUS</span>
              </div>
              <span className="cascade-arrow">➔</span>
              <div className="cascade-node node-warning">
                <span className="node-tag">DEPENDENT INFRASTRUCTURE</span>
                <span className="node-id">CHILLER_PLANT</span>
              </div>
              <span className="cascade-arrow">➔</span>
              <div className="cascade-node node-critical">
                <span className="node-tag">AFFECTED SERVICE DOMAIN</span>
                <span className="node-id">ICU + OT</span>
              </div>
            </div>
            <p className="a4-cascade-subtext" style={{ fontSize: '7.5px', color: '#64748B', marginTop: '4px', fontStyle: 'italic', margin: '4px 0 0 0' }}>
              The simulation traces state changes across configured infrastructure dependencies and estimates modeled downstream service impacts over simulated time.
            </p>
          </div>

          {includedSections.timeline && (
            <div className="a4-timeline-items font-mono" style={{ marginTop: '4px' }}>
              {timelineEvents.map((ev, idx) => {
                const cleanSummary = (ev.service_impact_summary || '').replace(/^CRITICAL RESERVE BOUNDARY:\s*/i, '')
                const displayTitle = (ev.title === 'Critical Reserve Depletion Boundary' || ev.title === 'Critical Exhaustion Boundary')
                  ? 'Critical Reserve Boundary'
                  : ev.title
                return (
                  <div className="a4-t-row" key={idx}>
                    <span className="a4-t-dot" style={{ backgroundColor: ev.system_resilience_score < 60 ? '#FF4D4D' : '#FFB800' }} />
                    <span className="a4-t-time">T+{ev.t_offset_min}m</span>
                    <span className="a4-t-desc">
                      <strong>{displayTitle}:</strong> {cleanSummary}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* What-If Multi-Attribute Strategy Evaluation Table directly inside Incident Report */}
          {includedSections.response_strategies && effectiveWhatIf?.strategies?.length > 0 && (
            <div style={{ marginTop: '8px' }}>
              <span className="a4-section-heading">What-If Multi-Attribute Strategy Evaluation</span>
              <p className="a4-para" style={{ color: '#64748B', fontSize: '7.5px', marginBottom: '3px' }}>
                Multi-objective strategy comparison under the configured Balanced profile. Human review is required before selecting a response strategy.
              </p>
              {effectiveWhatIf?.causal_explanation && (
                <p className="a4-para" style={{ color: '#334155', marginBottom: '4px', fontSize: '7.5px' }}>
                  <strong>Evaluation Rationale:</strong> {effectiveWhatIf.causal_explanation}
                </p>
              )}
              <div className="a4-table-wrap">
                <table className="a4-table font-mono">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Strategy Option</th>
                      <th>Proj. R</th>
                      <th>Simulated ICU Cont.</th>
                      <th>Simulated OT Cont.</th>
                      <th>Load Shed</th>
                      <th>Simulated Runtime</th>
                      <th>Modeled Risk Profile</th>
                    </tr>
                  </thead>
                  <tbody>
                    {effectiveWhatIf.strategies.map((s, idx) => (
                      <tr key={idx} style={s.is_recommended ? { background: '#F0FDF4', fontWeight: 'bold' } : {}}>
                        <td>{s.is_recommended ? '⭐ HIGHEST SIMULATED INDEX' : `#${s.recommendation_rank || idx + 1}`}</td>
                        <td>{s.strategy_code}</td>
                        <td style={{ color: s.projected_resilience_score > 80 ? '#10B981' : '#F59E0B' }}>
                          {s.projected_resilience_score?.toFixed(1)}
                        </td>
                        <td>{s.icu_continuity_pct?.toFixed(0)}%</td>
                        <td>{s.operating_theatre_continuity_pct?.toFixed(0)}%</td>
                        <td>{s.non_critical_load_shed_kw?.toFixed(0)} kW</td>
                        <td>{s.backup_runtime_remaining_hours?.toFixed(1)}h</td>
                        <td><span className={`a4-badge ${s.risk_level?.toLowerCase() === 'low' ? 'badge-green' : s.risk_level?.toLowerCase() === 'medium' ? 'badge-blue' : 'badge-red'}`}>{s.risk_level}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )
    }

    return (
      <div className="a4-section-block">
        <span className="a4-section-heading">Operational Standby & Contingency Audit</span>
        <div className="a4-info-callout" style={{ borderLeft: '3px solid #10B981', background: '#ECFDF5', padding: '6px 8px', borderRadius: '3px' }}>
          <p className="a4-para" style={{ color: '#065F46' }}>
            <strong>NOMINAL READINESS:</strong> Campus primary electrical grid and life-support distribution buses are operating without disruptions. Backup diesel generators (GEN_01, GEN_02) and UPS systems are in active standby readiness.
          </p>
        </div>
        <div className="a4-table-wrap" style={{ marginTop: '6px' }}>
          <table className="a4-table font-mono">
            <thead>
              <tr>
                <th>Protected Life-Safety Domain</th>
                <th>Primary Feeder</th>
                <th>Standby Redundancy</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Intensive Care Unit (ICU)</td>
                <td>EMERGENCY_BUS</td>
                <td>UPS_CRITICAL + GEN_01</td>
                <td><span className="a4-badge badge-green">100% SECURE</span></td>
              </tr>
              <tr>
                <td>Surgical Operating Theatres</td>
                <td>MAIN_BUS</td>
                <td>GEN_01 (N+1 Ready)</td>
                <td><span className="a4-badge badge-green">100% SECURE</span></td>
              </tr>
              <tr>
                <td>Emergency Trauma Department</td>
                <td>TRANSFORMER_01</td>
                <td>GEN_02 (Auto-Transfer)</td>
                <td><span className="a4-badge badge-green">100% SECURE</span></td>
              </tr>
              <tr>
                <td>Central Medical Vacuum & O2</td>
                <td>OXYGEN_MANIFOLD</td>
                <td>Dual Reserve Banks</td>
                <td><span className="a4-badge badge-green">OPTIMAL</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSimulationContent = () => (
    <div className="a4-section-block">
      <span className="a4-section-heading">Resilience Index Mathematical Formulation</span>
      <p className="a4-para font-mono" style={{ background: '#F8FAFC', padding: '4px 6px', border: '1px solid #E2E8F0', borderRadius: '3px' }}>
        R = 100 × [ 0.35C + 0.20A + 0.20B + 0.15(1 - T_norm) + 0.10(1 - U_norm) ]
      </p>
      <div className="a4-table-wrap" style={{ marginTop: '6px' }}>
        <table className="a4-table font-mono">
          <thead>
            <tr>
              <th>Canonical Dimension</th>
              <th>Weight</th>
              <th>Scaled Score</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Critical Service Continuity (C)</td>
              <td>35%</td>
              <td>{(subScores.service_continuity ?? 100).toFixed(1)} / 100</td>
              <td><span className="a4-badge badge-green">NOMINAL</span></td>
            </tr>
            <tr>
              <td>Infrastructure Availability (A)</td>
              <td>20%</td>
              <td>{(subScores.stability_factor ?? 88.2).toFixed(1)} / 100</td>
              <td><span className="a4-badge badge-blue">ONLINE</span></td>
            </tr>
            <tr>
              <td>Backup Energy Margin (B)</td>
              <td>20%</td>
              <td>{(subScores.backup_margin ?? 88.8).toFixed(1)} / 100</td>
              <td><span className="a4-badge badge-blue">RESERVE OK</span></td>
            </tr>
            <tr>
              <td>Recovery / Thermal Margin (1 - T)</td>
              <td>15%</td>
              <td>{(subScores.recovery_readiness ?? 100).toFixed(1)} / 100</td>
              <td><span className="a4-badge badge-green">STABLE</span></td>
            </tr>
            <tr>
              <td>Resource Conservation (1 - U)</td>
              <td>10%</td>
              <td>{(subScores.resource_conservation ?? 100).toFixed(1)} / 100</td>
              <td><span className="a4-badge badge-green">CONSERVED</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderWhatIfContent = () => {
    const strats = effectiveWhatIf?.strategies || []
    return (
      <div className="a4-section-block">
        <span className="a4-section-heading">What-If Multi-Attribute Strategy Evaluation</span>
        <p className="a4-para" style={{ color: '#64748B', fontSize: '7.5px', marginBottom: '3px' }}>
          Multi-objective strategy comparison under the configured Balanced profile. Human review is required before selecting a response strategy.
        </p>
        {effectiveWhatIf?.causal_explanation && (
          <p className="a4-para" style={{ color: '#1E293B', marginBottom: '6px', fontSize: '7.5px' }}>
            <strong>Evaluation Rationale:</strong> {effectiveWhatIf.causal_explanation}
          </p>
        )}
        {strats.length > 0 ? (
          <div className="a4-table-wrap">
            <table className="a4-table font-mono">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Strategy Option</th>
                  <th>Proj. R</th>
                  <th>Simulated ICU Cont.</th>
                  <th>Simulated OT Cont.</th>
                  <th>Load Shed</th>
                  <th>Simulated Runtime</th>
                  <th>Modeled Risk Profile</th>
                </tr>
              </thead>
              <tbody>
                {strats.map((s, idx) => (
                  <tr key={idx} style={s.is_recommended ? { background: '#F0FDF4', fontWeight: 'bold' } : {}}>
                    <td>{s.is_recommended ? '⭐ HIGHEST SIMULATED INDEX' : `#${s.recommendation_rank || idx + 1}`}</td>
                    <td>{s.strategy_code}</td>
                    <td style={{ color: s.projected_resilience_score > 80 ? '#10B981' : '#F59E0B' }}>
                      {s.projected_resilience_score?.toFixed(1)}
                    </td>
                    <td>{s.icu_continuity_pct?.toFixed(0)}%</td>
                    <td>{s.operating_theatre_continuity_pct?.toFixed(0)}%</td>
                    <td>{s.non_critical_load_shed_kw?.toFixed(0)} kW</td>
                    <td>{s.backup_runtime_remaining_hours?.toFixed(1)}h</td>
                    <td><span className={`a4-badge ${s.risk_level?.toLowerCase() === 'low' ? 'badge-green' : s.risk_level?.toLowerCase() === 'medium' ? 'badge-blue' : 'badge-red'}`}>{s.risk_level}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="a4-para" style={{ color: '#888' }}>Loading What-If multi-attribute decision matrix...</p>
        )}
      </div>
    )
  }

  const renderRiskContent = () => (
    <div className="a4-section-block">
      <span className="a4-section-heading">Threat & Imminent Threshold Assessment</span>
      <p className="a4-para" style={{ marginBottom: '6px' }}>
        Composite campus threat index: <strong>{((riskSummary?.overall_risk_score ?? 0) * 100).toFixed(1)}%</strong> ({riskSummary?.overall_risk_level?.toUpperCase() || 'LOW'}). Highest asset exposure detected at <strong>{riskSummary?.highest_risk_asset || 'GEN_01'}</strong>.
      </p>
      {riskSummary?.imminent_threshold_crossings?.length > 0 && (
        <div className="a4-table-wrap" style={{ marginBottom: '8px' }}>
          <table className="a4-table font-mono">
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Monitored Metric</th>
                <th>Current Reserve</th>
                <th>Depletion Rate</th>
                <th>Time Remaining</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {riskSummary.imminent_threshold_crossings.map((alert, idx) => (
                <tr key={idx}>
                  <td><code>{alert.asset_id}</code></td>
                  <td>{alert.metric_name}</td>
                  <td>{alert.current_reserve?.toFixed(1)}</td>
                  <td>{alert.depletion_rate_per_min?.toFixed(2)}/min</td>
                  <td><strong>{alert.estimated_time_remaining_min?.toFixed(1)} min</strong></td>
                  <td>
                    <span className={`a4-badge ${alert.is_critical ? 'badge-red' : 'badge-gold'}`}>
                      {alert.is_critical ? 'CRITICAL' : 'WARNING'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <span className="a4-section-heading" style={{ marginTop: '4px' }}>Asset Vulnerability Breakdown</span>
      <div className="a4-table-wrap">
        <table className="a4-table font-mono">
          <thead>
            <tr>
              <th>Asset ID</th>
              <th>Operational Status</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
            </tr>
          </thead>
          <tbody>
            {assetRiskList.slice(0, 5).map((a, idx) => (
              <tr key={idx}>
                <td><code>{a.asset_id}</code></td>
                <td>{a.operational_status}</td>
                <td>{(a.risk_score * 100).toFixed(1)}%</td>
                <td><span className={`a4-badge ${a.risk_level === 'low' ? 'badge-green' : 'badge-gold'}`}>{a.risk_level?.toUpperCase()}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )

  const renderResilienceContent = () => (
    <div className="a4-section-block">
      <span className="a4-section-heading">Detailed Resilience Dimension Decomposition</span>
      <div className="a4-dimension-list" style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
        <div className="a4-dim-card" style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>Critical Service Continuity (Weight: 35%)</span>
            <span className="font-mono" style={{ color: '#10B981', fontWeight: '700' }}>{(subScores.service_continuity ?? 100).toFixed(1)} / 100</span>
          </div>
          <p className="a4-para">Monitors active continuous delivery of electrical, HVAC, and oxygen pressure to Tier-1 clinical domains (ICU, Surgery, Trauma).</p>
        </div>
        <div className="a4-dim-card" style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>Infrastructure Availability (Weight: 20%)</span>
            <span className="font-mono" style={{ color: '#0284C7', fontWeight: '700' }}>{(subScores.stability_factor ?? 88.2).toFixed(1)} / 100</span>
          </div>
          <p className="a4-para">Tracks online status, load factors, and thermal degradation across transformers, main switchboards, and distribution buses.</p>
        </div>
        <div className="a4-dim-card" style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>Backup Energy Margin (Weight: 20%)</span>
            <span className="font-mono" style={{ color: '#0284C7', fontWeight: '700' }}>{(subScores.backup_margin ?? 88.8).toFixed(1)} / 100</span>
          </div>
          <p className="a4-para">Evaluates generator fuel reserves (hours of autonomy at current burn rate) and central UPS battery state-of-charge.</p>
        </div>
        <div className="a4-dim-card" style={{ background: '#F8FAFC', padding: '6px 8px', borderRadius: '4px', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
            <span style={{ fontWeight: '700', color: '#0F172A' }}>Recovery & Thermal Margin (Weight: 15%)</span>
            <span className="font-mono" style={{ color: '#10B981', fontWeight: '700' }}>{(subScores.recovery_readiness ?? 100).toFixed(1)} / 100</span>
          </div>
          <p className="a4-para">Measures HVAC cooling water thermal inertia, chiller switchover latency, and automated recovery transfer speeds.</p>
        </div>
      </div>
    </div>
  )

  const renderPerformanceContent = () => (
    <div className="a4-section-block">
      <span className="a4-section-heading">Operational Infrastructure Performance Telemetry</span>
      <div className="a4-table-wrap">
        <table className="a4-table font-mono">
          <thead>
            <tr>
              <th>Subsystem</th>
              <th>Current Load</th>
              <th>Capacity / Limit</th>
              <th>Buffer / Runtime</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Utility Grid Feed (GRID_MAIN)</td>
              <td>850 kW</td>
              <td>1200 kW</td>
              <td>350 kW Headroom</td>
              <td><span className="a4-badge badge-green">OPTIMAL</span></td>
            </tr>
            <tr>
              <td>Backup Generator (GEN_01)</td>
              <td>0 kW (Standby)</td>
              <td>750 kW</td>
              <td>88.0% Fuel (~8.5h)</td>
              <td><span className="a4-badge badge-blue">READY</span></td>
            </tr>
            <tr>
              <td>Backup Generator (GEN_02)</td>
              <td>0 kW (Standby)</td>
              <td>750 kW</td>
              <td>85.0% Fuel (~8.2h)</td>
              <td><span className="a4-badge badge-blue">READY</span></td>
            </tr>
            <tr>
              <td>Central Critical UPS (UPS_CRITICAL)</td>
              <td>180 kW</td>
              <td>300 kW</td>
              <td>100% Bat (~45 min)</td>
              <td><span className="a4-badge badge-green">100% CHARGED</span></td>
            </tr>
            <tr>
              <td>Central Chiller Plant (CHILLER_PLANT)</td>
              <td>320 kW</td>
              <td>500 kW</td>
              <td>180 kW Headroom</td>
              <td><span className="a4-badge badge-green">NOMINAL</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="a4-telemetry-meta font-mono" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', fontSize: '8px', color: '#64748B' }}>
        <span>• Telemetry Stream Heartbeat: 1.00s (Active)</span>
        <span>• Sensor Network MTBF: &gt;99.98%</span>
        <span>• Edge Gateway Packet Loss: 0.00%</span>
        <span>• State Engine Latency: 12ms</span>
      </div>
    </div>
  )

  // Full rendered executive document sheet
  const renderReportPreview = () => (
    <div className="a4-document-paper" id="printable-a4-sheet">
      {/* 1. Header with branding & security tag */}
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
            <span className="a4-tag-badge font-mono">OFFICIAL // DECISION-SUPPORT & SIMULATION BRIEFING</span>
          </div>
          <span className="a4-doc-title">
            {selectedReportType === 'incident' && 'Incident Containment & Decision-Support Briefing'}
            {selectedReportType === 'simulation' && 'Executive Simulation Audit Report'}
            {selectedReportType === 'whatif' && 'What-If Multi-Attribute Strategy Evaluation'}
            {selectedReportType === 'risk' && 'Comprehensive Campus Threat & Risk Assessment'}
            {selectedReportType === 'resilience' && 'Canonical Resilience Index Breakdown'}
            {selectedReportType === 'perf' && 'Operational System Performance Report'}
          </span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Scenario:</strong> {activeInc ? `Failure: ${activeInc.source_asset_id}` : 'Baseline Campus Operation'}</span>
          <span><strong>Simulation ID:</strong> {activeInc?.incident_id || 'SIM-BASELINE-2026'}</span>
          <span><strong>Timestamp:</strong> {generatedAt ? new Date(generatedAt).toLocaleString() : new Date().toLocaleString()}</span>
          <span><strong>Status:</strong> <span style={{ color: currentResScore >= 80 ? '#10B981' : '#F59E0B', fontWeight: 'bold' }}>{statusLabel} ({currentResScore.toFixed(1)} / 100)</span></span>
        </div>
      </div>

      {/* 2. Digital Twin Campus Banner */}
      <div className="a4-image-banner hide-on-print">
        <img src={hospitalCampusImg} alt="Hospital Digital Twin Campus" className="a4-thumb-img" />
      </div>

      {/* 3. Executive Summary */}
      {includedSections.exec_summary && (
        <div className="a4-section-block">
          <span className="a4-section-heading">Executive Summary</span>
          <p className="a4-para">
            {activeInc && activeInc.is_active
              ? `A simulated failure event was evaluated for ${activeInc.source_asset_id}, tracing modeled cascade propagation across coupled electrical and environmental networks. ${affectedAssetsCount} modeled infrastructure assets enter a modeled failed or degraded state within the simulated scenario, placing ${affectedServicesCount} modeled service domains in a degraded state. Multi-objective response strategies evaluated under the configured Balanced profile.`
              : `Comprehensive digital twin audit executed across all campus healthcare delivery and physical infrastructure assets. All vital clinical circuits maintain continuous redundant supply with optimal resilience indices.`}
          </p>
        </div>
      )}

      {/* 4. 4 Mini KPIs */}
      {includedSections.resilience_metrics && (
        <div className="a4-mini-kpis-row font-mono">
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: affectedServicesCount > 0 ? '#FF4D4D' : '#10B981' }}>
              {affectedServicesCount}
            </span>
            <span className="a4-kpi-lbl">Services At Risk</span>
          </div>
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: affectedAssetsCount > 0 ? '#FFB800' : '#10B981' }}>
              {affectedAssetsCount}
            </span>
            <span className="a4-kpi-lbl">Impacted Assets</span>
          </div>
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: '#00A3FF' }}>
              {currentResScore.toFixed(1)}
            </span>
            <span className="a4-kpi-lbl">Resilience Index</span>
          </div>
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: baselineDelta < 0 ? '#FF4D4D' : '#10B981' }}>
              {baselineDelta >= 0 ? `+${baselineDelta.toFixed(1)}` : baselineDelta.toFixed(1)}
            </span>
            <span className="a4-kpi-lbl">Delta vs Pre-Incident Baseline</span>
          </div>
        </div>
      )}

      {/* 5. Active Tab Core Section */}
      {selectedReportType === 'incident' && renderIncidentContent()}
      {selectedReportType === 'simulation' && renderSimulationContent()}
      {selectedReportType === 'whatif' && renderWhatIfContent()}
      {selectedReportType === 'risk' && renderRiskContent()}
      {selectedReportType === 'resilience' && renderResilienceContent()}
      {selectedReportType === 'perf' && renderPerformanceContent()}

      {/* 6. Simulated Decision-Support Considerations */}
      {includedSections.recommendations && (
        <div className="a4-section-block">
          <span className="a4-section-heading">Simulated Decision-Support Considerations</span>
          <div className="a4-directives-list font-mono" style={{ fontSize: '8px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div>1. <strong>Human Review Protocol:</strong> Conduct human operator review of simulated strategy options prior to selecting or executing any physical response.</div>
            <div>2. <strong>Critical-Service Continuity:</strong> Strategy models maintaining the configured ICU-supporting infrastructure load at 100% before auxiliary transfer transitions.</div>
            <div>3. <strong>Simulated Load Shedding:</strong> Strategy models shedding non-critical administrative and transient HVAC loads ({effectiveWhatIf?.strategies?.[0]?.non_critical_load_shed_kw ? `${effectiveWhatIf.strategies[0].non_critical_load_shed_kw.toFixed(0)} kW` : '120 kW'}) to preserve emergency generator reserve duration ({effectiveWhatIf?.strategies?.[0]?.backup_runtime_remaining_hours ? `${effectiveWhatIf.strategies[0].backup_runtime_remaining_hours.toFixed(1)} h` : '6.2 h'}).</div>
          </div>
        </div>
      )}

      {/* 7. Simulation Scope */}
      <div className="a4-section-block a4-scope-block font-mono">
        <span className="a4-section-heading">Simulation Scope</span>
        <div className="a4-scope-grid">
          <div className="a4-scope-item">
            <span className="a4-scope-key">Data Source:</span>
            <span className="a4-scope-val">Synthetic Infrastructure Data</span>
          </div>
          <div className="a4-scope-item">
            <span className="a4-scope-key">Simulation Mode:</span>
            <span className="a4-scope-val">Scenario Simulation</span>
          </div>
          <div className="a4-scope-item">
            <span className="a4-scope-key">Scenario Horizon:</span>
            <span className="a4-scope-val">20 simulated minutes</span>
          </div>
          <div className="a4-scope-item">
            <span className="a4-scope-key">Decision Mode:</span>
            <span className="a4-scope-val">Human-in-the-Loop</span>
          </div>
          <div className="a4-scope-item">
            <span className="a4-scope-key">Physical Control:</span>
            <span className="a4-scope-val">Not Enabled</span>
          </div>
          <div className="a4-scope-item">
            <span className="a4-scope-key">Clinical Data:</span>
            <span className="a4-scope-val">Not Used</span>
          </div>
        </div>
      </div>

      {/* 8. Verification Stamp Footer */}
      <div className="a4-doc-footer font-mono">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
          <span style={{ fontWeight: '700' }}>ResilienceOS Digital Twin Simulation Engine</span>
          <span style={{ color: '#64748B', fontSize: '7px' }}>Simulation Mode • Synthetic Infrastructure Data • Human-in-the-Loop Decision Support</span>
        </div>
        <div style={{ textAlign: 'right', color: '#475569', fontSize: '7.5px' }}>
          <span>Generated: {generatedAt ? new Date(generatedAt).toISOString().slice(0, 10) : 'Live'} | Sim ID: {activeInc?.incident_id || 'INC-TRANSFORMER_01-01'}</span>
        </div>
      </div>
    </div>
  )

  // Copy helper with feedback
  const handleCopyContent = (text, label) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (onNotify) onNotify(`${label} copied to clipboard!`, 'success')
  }

  // Structured JSON export payload
  const exportJson = useMemo(() => {
    return {
      title: `ResilienceOS ${selectedReportType.toUpperCase()} Audit Data`,
      document_classification: 'OFFICIAL // HOSPITAL INCIDENT DECISION-SUPPORT BRIEFING',
      generated_at: generatedAt || new Date().toISOString(),
      selected_report_type: selectedReportType,
      time_range: timeRange,
      included_sections: includedSections,
      resilience_breakdown: resBreakdown,
      incident_state: activeInc,
      risk_summary: riskSummary,
      what_if_comparison: effectiveWhatIf
    }
  }, [selectedReportType, generatedAt, timeRange, includedSections, resBreakdown, activeInc, riskSummary, effectiveWhatIf])

  // Markdown live preview component
  const renderMarkdownPreview = () => {
    const mdText = buildMarkdownReport()
    return (
      <div className="code-preview-container">
        <div className="code-preview-toolbar font-mono">
          <div className="code-file-tag">
            <Share2 size={13} style={{ color: '#00F0FF' }} />
            <span>ResilienceOS_{selectedReportType}_Report.md</span>
          </div>
          <button
            type="button"
            className="copy-code-btn"
            onClick={() => handleCopyContent(mdText, 'Markdown')}
          >
            {copied ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
        </div>
        <pre className="code-content-block font-mono">
          <code>{mdText}</code>
        </pre>
      </div>
    )
  }

  // JSON live preview component
  const renderJsonPreview = () => {
    const jsonStr = JSON.stringify(exportJson, null, 2)
    return (
      <div className="code-preview-container">
        <div className="code-preview-toolbar font-mono">
          <div className="code-file-tag">
            <Activity size={13} style={{ color: '#00E5A3' }} />
            <span>ResilienceOS_{selectedReportType}_Data.json</span>
          </div>
          <button
            type="button"
            className="copy-code-btn"
            onClick={() => handleCopyContent(jsonStr, 'JSON')}
          >
            {copied ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy JSON'}</span>
          </button>
        </div>
        <pre className="code-content-block font-mono">
          <code>{jsonStr}</code>
        </pre>
      </div>
    )
  }

  return (
    <div className="reports-page">
      {/* 1. TOP TABS AND GENERATE CTA */}
      <section className="reports-top-tabs-bar hide-on-print">
        <div className="reports-tabs-group">
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'incident' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('incident')}
          >
            <FileText size={14} /><span>Incident Report</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'simulation' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('simulation')}
          >
            <Layers size={14} /><span>Simulation Report</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'whatif' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('whatif')}
          >
            <FileCheck size={14} /><span>What-If Comparison</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'risk' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('risk')}
          >
            <ShieldCheck size={14} /><span>Risk Assessment</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'resilience' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('resilience')}
          >
            <FileSpreadsheet size={14} /><span>Resilience Analysis</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${selectedReportType === 'perf' ? 'is-active' : ''}`}
            onClick={() => setSelectedReportType('perf')}
          >
            <Presentation size={14} /><span>System Performance</span>
          </button>
        </div>

        <button
          type="button"
          className="generate-report-cta-btn"
          onClick={() => fetchReport(true)}
          disabled={isGenerating}
        >
          <RefreshCw size={14} className={isGenerating ? 'spin-icon' : ''} />
          <span>{isGenerating ? 'Synthesizing...' : 'Generate Live Report'}</span>
        </button>
      </section>

      {reportError && (
        <div className="error-banner hide-on-print" style={{ color: '#EF4444', padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', margin: '0 4px' }}>
          <strong>Notice:</strong> {reportError} (Using active telemetry state)
        </div>
      )}

      {/* 2. MAIN WORKSPACE */}
      <section className="reports-main-grid">
        {/* LEFT COLUMN: Controls & Summaries */}
        <div className="reports-left-column hide-on-print">
          {/* Panel 1: Configuration */}
          <div className="reports-panel-card">
            <span className="reports-panel-title">Report Configuration</span>
            <div className="report-config-dropdowns-row">
              <div className="config-select-group">
                <label className="config-label">Report Type</label>
                <select
                  className="config-select font-mono"
                  value={selectedReportType}
                  onChange={(e) => setSelectedReportType(e.target.value)}
                >
                  <option value="incident">Incident Report</option>
                  <option value="simulation">Simulation Report</option>
                  <option value="whatif">What-If Comparison</option>
                  <option value="risk">Risk Assessment</option>
                  <option value="resilience">Resilience Analysis</option>
                  <option value="perf">System Performance</option>
                </select>
              </div>

              <div className="config-select-group">
                <label className="config-label">Active Scenario / Outage</label>
                <div className="config-select font-mono" style={{ display: 'flex', alignItems: 'center', color: activeInc?.is_active ? '#EF4444' : '#10B981', fontWeight: 'bold' }}>
                  {activeInc?.is_active ? `OUTAGE: ${activeInc.source_asset_id}` : 'Nominal Campus Baseline'}
                </div>
              </div>

              <div className="config-select-group">
                <label className="config-label">Time Window</label>
                <select
                  className="config-select font-mono"
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="Full Event (0 - 2 hours)">Full Event (0 - 2 hours)</option>
                  <option value="First 30 Minutes">First 30 Minutes</option>
                </select>
              </div>
            </div>

            <div className="report-config-bottom-split">
              <div className="config-sub-col">
                <span className="config-sub-heading">Include Document Sections</span>
                <div className="checkboxes-grid">
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.exec_summary}
                      onChange={() => toggleSection('exec_summary')}
                    />
                    <span>Executive Summary</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.resilience_metrics}
                      onChange={() => toggleSection('resilience_metrics')}
                    />
                    <span>Resilience Metrics</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.timeline}
                      onChange={() => toggleSection('timeline')}
                    />
                    <span>Incident Timeline</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.system_impact}
                      onChange={() => toggleSection('system_impact')}
                    />
                    <span>Threat Assessment</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.response_strategies}
                      onChange={() => toggleSection('response_strategies')}
                    />
                    <span>Response Strategies</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.recommendations}
                      onChange={() => toggleSection('recommendations')}
                    />
                    <span>Action Directives</span>
                  </label>
                </div>
              </div>

              <div className="config-sub-col">
                <span className="config-sub-heading">Export Target</span>
                <div className="format-buttons-group">
                  <button
                    type="button"
                    className={`fmt-btn fmt-pdf ${outputFormat === 'pdf' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('pdf')}
                  >
                    <FileText size={14} /><span>PDF Document</span>
                  </button>
                  <button
                    type="button"
                    className={`fmt-btn fmt-markdown ${outputFormat === 'markdown' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('markdown')}
                  >
                    <Share2 size={14} /><span>Executive Markdown</span>
                  </button>
                  <button
                    type="button"
                    className={`fmt-btn fmt-json ${outputFormat === 'json' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('json')}
                  >
                    <Activity size={14} /><span>Structured JSON</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 2: Key Findings */}
          <div className="reports-panel-card">
            <span className="reports-panel-title">Operational Findings Snapshot</span>
            <div className="key-findings-tiles-row">
              <div className={`finding-tile ${affectedServicesCount > 0 ? 'tile-red' : 'tile-green'}`}>
                <div className={`finding-icon-wrap ${affectedServicesCount > 0 ? 'icon-red' : 'icon-green'}`}>
                  {affectedServicesCount > 0 ? <AlertTriangle size={16} /> : <Check size={16} />}
                </div>
                <div className="finding-text">
                  <span className="finding-num font-mono">{affectedServicesCount}</span>
                  <span className="finding-lbl">Services At Risk</span>
                </div>
              </div>

              <div className={`finding-tile ${affectedAssetsCount > 0 ? 'tile-gold' : 'tile-green'}`}>
                <div className={`finding-icon-wrap ${affectedAssetsCount > 0 ? 'icon-gold' : 'icon-green'}`}>
                  <Box size={16} />
                </div>
                <div className="finding-text">
                  <span className="finding-num font-mono">{affectedAssetsCount}</span>
                  <span className="finding-lbl">Assets Affected</span>
                </div>
              </div>

              <div className="finding-tile tile-blue">
                <div className="finding-icon-wrap icon-blue">
                  <Clock size={16} />
                </div>
                <div className="finding-text">
                  <span className="finding-num font-mono">{currentResScore.toFixed(1)}</span>
                  <span className="finding-lbl">Resilience Index</span>
                </div>
              </div>

              <div className="finding-tile tile-green">
                <div className="finding-icon-wrap icon-green">
                  <TrendingDown size={16} />
                </div>
                <div className="finding-text">
                  <span className="finding-num font-mono">
                    {baselineDelta >= 0 ? `+${baselineDelta.toFixed(1)}` : baselineDelta.toFixed(1)}
                  </span>
                  <span className="finding-lbl">Delta vs Pre-Incident Baseline</span>
                </div>
              </div>
            </div>
          </div>

          {/* Panel 3: Asset Risk Summary */}
          <div className="reports-panel-card">
            <span className="reports-panel-title">Infrastructure Risk Posture</span>
            <div className="risk-posture-grid">
              <div className="risk-posture-cell">
                <span className="risk-cell-label font-mono">Campus Threat Level</span>
                <div className="risk-cell-value-wrap">
                  <span className={`risk-level-badge ${riskSummary?.overall_risk_level?.toLowerCase() === 'low' ? 'badge-green' : riskSummary?.overall_risk_level?.toLowerCase() === 'medium' ? 'badge-gold' : 'badge-red'}`}>
                    {riskSummary?.overall_risk_level?.toUpperCase() || 'LOW'}
                  </span>
                  <span className="risk-pct-val font-mono">{((riskSummary?.overall_risk_score ?? 0) * 100).toFixed(0)}%</span>
                </div>
                <span className="risk-cell-sub">Composite hazard index</span>
              </div>

              <div className="risk-posture-cell">
                <span className="risk-cell-label font-mono">Max Vulnerability Asset</span>
                <div className="risk-cell-value-wrap">
                  <code className="risk-asset-code font-mono">{riskSummary?.highest_risk_asset || 'GEN_01'}</code>
                </div>
                <span className="risk-cell-sub">Diesel Standby Feeder</span>
              </div>

              <div className="risk-posture-cell">
                <span className="risk-cell-label font-mono">Vulnerable Count</span>
                <div className="risk-cell-value-wrap">
                  <span className="risk-count-num font-mono" style={{ color: vulnerableAssets.length > 0 ? '#F59E0B' : '#10B981' }}>
                    {vulnerableAssets.length}
                  </span>
                  <span className="risk-count-unit">Assets Flagged</span>
                </div>
                <span className="risk-cell-sub">{vulnerableAssets.length > 0 ? 'Exceeding risk limit' : 'All systems nominal'}</span>
              </div>
            </div>
          </div>

          {/* Panel 4: Interactive Resilience Trajectory & Sub-System Stress Profile */}
          <div className="reports-panel-card trajectory-graph-card">
            <div className="trajectory-card-header">
              <div className="tch-left">
                <span className="reports-panel-title">Resilience & Risk Trajectory Telemetry</span>
                <span className={`tch-badge font-mono ${(activeInc?.is_active || showStressCascade) ? 'is-warning' : 'is-nominal'}`}>
                  {(activeInc?.is_active || showStressCascade) ? 'SIMULATED CASCADE ACTIVE' : 'NOMINAL HORIZON • 2H'}
                </span>
              </div>
              <div className="trajectory-controls-group font-mono">
                {graphTab === 'trajectory' && (
                  <div className="trajectory-sub-toggles">
                    <button
                      type="button"
                      className={`t-sub-btn ${showConfidenceCorridor ? 'is-active' : ''}`}
                      onClick={() => setShowConfidenceCorridor(!showConfidenceCorridor)}
                      title="Toggle ±3.5% statistical operational confidence corridor"
                    >
                      Corridor ±3.5%
                    </button>
                    <button
                      type="button"
                      className={`t-sub-btn ${showStressCascade ? 'is-simulating' : ''}`}
                      onClick={() => setShowStressCascade(!showStressCascade)}
                      title="Simulate failure cascade and autonomous self-healing recovery"
                    >
                      ⚡ {showStressCascade ? 'Reset Nominal' : 'Simulate Outage'}
                    </button>
                  </div>
                )}
                <div className="trajectory-tabs-pills">
                  <button
                    type="button"
                    className={`tt-pill ${graphTab === 'trajectory' ? 'is-active' : ''}`}
                    onClick={() => setGraphTab('trajectory')}
                  >
                    2h Horizon
                  </button>
                  <button
                    type="button"
                    className={`tt-pill ${graphTab === 'breakdown' ? 'is-active' : ''}`}
                    onClick={() => setGraphTab('breakdown')}
                  >
                    System Stress
                  </button>
                  <button
                    type="button"
                    className={`tt-pill ${graphTab === 'margins' ? 'is-active' : ''}`}
                    onClick={() => setGraphTab('margins')}
                  >
                    Margins
                  </button>
                </div>
              </div>
            </div>

            {/* View 1: 2-Hour Resilience Curve (Interactive Telemetry SVG Chart) */}
            {graphTab === 'trajectory' && (
              <div className="trajectory-svg-container">
                <svg
                  viewBox="0 0 540 195"
                  className="trajectory-svg-chart"
                  preserveAspectRatio="none"
                >
                  <defs>
                    {/* Gradients */}
                    <linearGradient id="nominalAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#00F0FF" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="confidenceBandGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#00E5A3" stopOpacity="0.05" />
                    </linearGradient>
                    <linearGradient id="unmitigatedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.35" />
                      <stop offset="70%" stopColor="#EF4444" stopOpacity="0.10" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="mitigatedAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.28" />
                      <stop offset="70%" stopColor="#10B981" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="hazardAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.02" />
                    </linearGradient>

                    {/* SVG Filters for Neon Glow */}
                    <filter id="neonCyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#00F0FF" floodOpacity="0.6" />
                    </filter>
                    <filter id="neonEmeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#10B981" floodOpacity="0.6" />
                    </filter>
                    <filter id="neonRedGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="1" stdDeviation="2.5" floodColor="#EF4444" floodOpacity="0.6" />
                    </filter>
                  </defs>

                  {/* Danger Zone Under Safety Floor (< 70% Y > 64) */}
                  <rect x="48" y="64" width="464" height="98" fill="url(#hazardAreaGrad)" />

                  {/* Background Grid Lines (Horizontal) */}
                  <line x1="48" y1="22" x2="512" y2="22" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="3 3" />
                  <line x1="48" y1="50" x2="512" y2="50" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="3 3" />
                  <line x1="48" y1="78" x2="512" y2="78" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="3 3" />
                  <line x1="48" y1="106" x2="512" y2="106" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="3 3" />
                  <line x1="48" y1="134" x2="512" y2="134" stroke="var(--border-subtle, rgba(255,255,255,0.08))" strokeDasharray="3 3" />
                  <line x1="48" y1="162" x2="512" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.15))" />
                  <line x1="48" y1="22" x2="48" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.15))" />

                  {/* Vertical Time Marker Guides */}
                  <line x1="106" y1="22" x2="106" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />
                  <line x1="164" y1="22" x2="164" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />
                  <line x1="222" y1="22" x2="222" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />
                  <line x1="280" y1="22" x2="280" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />
                  <line x1="396" y1="22" x2="396" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />
                  <line x1="512" y1="22" x2="512" y2="162" stroke="var(--border-subtle, rgba(255,255,255,0.04))" strokeDasharray="2 4" />

                  {/* Y-Axis Percentage Labels */}
                  <text x="40" y="25" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">100%</text>
                  <text x="40" y="53" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">80%</text>
                  <text x="40" y="81" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">60%</text>
                  <text x="40" y="109" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">40%</text>
                  <text x="40" y="137" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">20%</text>
                  <text x="40" y="165" textAnchor="end" fontSize="9" fill="var(--text-muted, #64748B)" fontFamily="monospace" fontWeight="600">0%</text>

                  {/* Critical Safety Floor Boundary (70% at Y = 64) */}
                  <line x1="48" y1="64" x2="512" y2="64" stroke="#F59E0B" strokeDasharray="5 4" strokeWidth="1.4" opacity="0.9" />
                  <g>
                    <rect x="372" y="55" width="136" height="18" rx="4" fill="var(--bg-surface, #0B1E2E)" stroke="#F59E0B" strokeWidth="1" />
                    <text x="440" y="67.5" textAnchor="middle" fontSize="8" fill="#F59E0B" fontFamily="monospace" fontWeight="700" letterSpacing="0.4">
                      ⚠ CRITICAL FLOOR: 70%
                    </text>
                  </g>

                  {/* Statistical Confidence Corridor Ribbon (±3.5% envelope) */}
                  {showConfidenceCorridor && !(activeInc?.is_active || showStressCascade) && (
                    <path
                      d="M 48,25.2 C 77,24.5 80,24.0 106,24.3 C 132,24.6 140,26.0 164,25.8 C 190,25.5 198,23.5 222,23.7 C 248,23.9 256,25.0 280,24.8 C 306,24.6 314,25.9 338,25.7 C 364,25.5 372,23.8 396,24.0 C 422,24.2 430,25.2 454,25.0 C 480,24.8 488,24.1 512,24.2 L 512,35.0 C 488,34.9 480,35.6 454,35.8 C 430,36.0 422,35.0 396,34.8 C 372,34.6 364,36.3 338,36.5 C 314,36.7 306,35.4 280,35.6 C 256,35.8 248,34.7 222,34.5 C 198,34.3 190,36.3 164,36.6 C 140,36.8 132,35.4 106,35.1 C 80,34.8 77,35.3 48,36.0 Z"
                      fill="url(#confidenceBandGrad)"
                    />
                  )}

                  {/* Mode 1: Simulated Cascade vs Mitigation Recovery */}
                  {(activeInc?.is_active || showStressCascade) ? (
                    <>
                      {/* Unmitigated Failure Area & Spline */}
                      <path
                        d="M 48,30.1 C 80,38 90,62 106,66.1 C 128,72 144,88 164,93.4 C 210,105 240,110 280,111.6 C 340,114 430,126 512,131.9 L 512,162 L 48,162 Z"
                        fill="url(#unmitigatedAreaGrad)"
                      />
                      <path
                        d="M 48,30.1 C 80,38 90,62 106,66.1 C 128,72 144,88 164,93.4 C 210,105 240,110 280,111.6 C 340,114 430,126 512,131.9"
                        fill="none"
                        stroke="#EF4444"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        filter="url(#neonRedGlow)"
                      />

                      {/* Mitigated Automated Response Area & Spline */}
                      <path
                        d="M 48,30.1 C 65,34 75,34 90,32.2 C 110,30 130,28.2 164,28.5 C 210,29 240,28.4 280,28.5 C 340,28.6 430,28.7 512,28.8 L 512,162 L 48,162 Z"
                        fill="url(#mitigatedAreaGrad)"
                      />
                      <path
                        d="M 48,30.1 C 65,34 75,34 90,32.2 C 110,30 130,28.2 164,28.5 C 210,29 240,28.4 280,28.5 C 340,28.6 430,28.7 512,28.8"
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        filter="url(#neonEmeraldGlow)"
                      />
                    </>
                  ) : (
                    /* Mode 2: Nominal Dynamic High-Resolution Wave */
                    <>
                      <path
                        d="M 48,30.1 C 77,29.3 80,28.8 106,29.1 C 132,29.4 140,31.0 164,30.7 C 190,30.4 198,28.2 222,28.4 C 248,28.6 256,29.7 280,29.5 C 306,29.3 314,30.7 338,30.5 C 364,30.3 372,28.5 396,28.7 C 422,28.9 430,30.0 454,29.8 C 480,29.6 488,28.9 512,29.0 L 512,162 L 48,162 Z"
                        fill="url(#nominalAreaGrad)"
                      />
                      <path
                        d="M 48,30.1 C 77,29.3 80,28.8 106,29.1 C 132,29.4 140,31.0 164,30.7 C 190,30.4 198,28.2 222,28.4 C 248,28.6 256,29.7 280,29.5 C 306,29.3 314,30.7 338,30.5 C 364,30.3 372,28.5 396,28.7 C 422,28.9 430,30.0 454,29.8 C 480,29.6 488,28.9 512,29.0"
                        fill="none"
                        stroke="#00F0FF"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        filter="url(#neonCyanGlow)"
                      />
                    </>
                  )}

                  {/* Interactive Milestone Telemetry Checkpoints */}
                  {[
                    { x: 48, y: 30.1, t: 'T+0m', val: (currentResScore || 94.2).toFixed(1), event: (activeInc?.is_active || showStressCascade) ? 'Outage Injected • Grid Feeder Offline' : 'Live Origin Baseline • Dual Feed Locked' },
                    { x: 106, y: (activeInc?.is_active || showStressCascade) ? 66.1 : 29.1, t: 'T+15m', val: (activeInc?.is_active || showStressCascade) ? '68.5' : '94.9', event: (activeInc?.is_active || showStressCascade) ? 'Unmitigated Feeder Trip Cascading' : 'Telemetry Grid Sync Verified' },
                    { x: 164, y: (activeInc?.is_active || showStressCascade) ? 93.4 : 30.7, t: 'T+30m', val: (activeInc?.is_active || showStressCascade) ? '49.0' : '93.8', event: (activeInc?.is_active || showStressCascade) ? 'Chiller Thermal Alarm Triggered' : 'Normal Secondary Distribution' },
                    { x: 280, y: (activeInc?.is_active || showStressCascade) ? 111.6 : 29.5, t: 'T+60m', val: (activeInc?.is_active || showStressCascade) ? '36.0' : '94.6', event: (activeInc?.is_active || showStressCascade) ? 'ICU Subsystem Battery Degrading' : 'Continuous Redundant Tier III State' },
                    { x: 396, y: (activeInc?.is_active || showStressCascade) ? 122.0 : 28.7, t: 'T+90m', val: (activeInc?.is_active || showStressCascade) ? '28.0' : '95.2', event: (activeInc?.is_active || showStressCascade) ? 'Severe Service Domain Depletion' : 'Thermal Dissipation Nominal' },
                    { x: 512, y: (activeInc?.is_active || showStressCascade) ? 131.9 : 29.0, t: 'T+120m', val: (activeInc?.is_active || showStressCascade) ? '21.5' : '95.0', event: (activeInc?.is_active || showStressCascade) ? 'Blackout State Reached' : '2h Projected Steady Equilibrium' }
                  ].map((pt, idx) => (
                    <g
                      key={idx}
                      className="svg-node-interactive"
                      onMouseEnter={() => setHoveredPoint(pt)}
                      onMouseLeave={() => setHoveredPoint(null)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Vertical Laser Crosshair Guide on Hover */}
                      {hoveredPoint?.t === pt.t && (
                        <line x1={pt.x} y1="22" x2={pt.x} y2="162" stroke="var(--accent-cyan, #00F0FF)" strokeDasharray="3 3" strokeWidth="1.2" opacity="0.8" />
                      )}

                      {/* Ripple Halo on Hover */}
                      {hoveredPoint?.t === pt.t && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={10}
                          fill="none"
                          stroke={(activeInc?.is_active || showStressCascade) && idx > 0 ? '#EF4444' : '#00F0FF'}
                          strokeWidth="1.2"
                          opacity="0.6"
                          className="ripple-ring"
                        />
                      )}

                      {/* Primary Node Point */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.t === pt.t ? 5.5 : 4}
                        fill={(activeInc?.is_active || showStressCascade) && idx > 0 ? '#EF4444' : '#00F0FF'}
                        stroke="var(--bg-surface, #01111E)"
                        strokeWidth="2"
                        style={{ transition: 'all 0.15s ease' }}
                      />

                      {/* Mitigated Node Point during Cascade Mode */}
                      {(activeInc?.is_active || showStressCascade) && (
                        <circle
                          cx={pt.x}
                          cy={idx === 0 ? 30.1 : idx === 1 ? 32.2 : idx === 2 ? 28.5 : idx === 3 ? 28.5 : 28.8}
                          r={hoveredPoint?.t === pt.t ? 5.5 : 4}
                          fill="#10B981"
                          stroke="var(--bg-surface, #01111E)"
                          strokeWidth="2"
                          style={{ transition: 'all 0.15s ease' }}
                        />
                      )}
                    </g>
                  ))}

                  {/* X-Axis Time Labels */}
                  <text x="48" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+0m</text>
                  <text x="106" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+15m</text>
                  <text x="164" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+30m</text>
                  <text x="222" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+45m</text>
                  <text x="280" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+60m</text>
                  <text x="396" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+90m</text>
                  <text x="512" y="178" textAnchor="middle" fontSize="9.5" fill="var(--text-secondary, #94A3B8)" fontFamily="monospace" fontWeight="600">T+120m</text>
                </svg>

                {/* Floating Precision Tooltip HUD */}
                {hoveredPoint && (
                  <div className="trajectory-tooltip-overlay font-mono">
                    <div className="tto-top">
                      <span className="tto-time font-bold">{hoveredPoint.t} Checkpoint</span>
                      <span className="tto-val">
                        Resilience: <strong>{hoveredPoint.val}%</strong>
                      </span>
                    </div>
                    <span className="tto-desc">{hoveredPoint.event}</span>
                    <div className="tto-status-bar">
                      <span className="tto-pill">
                        Headroom: <strong>+{(parseFloat(hoveredPoint.val) - 70).toFixed(1)}%</strong>
                      </span>
                      <span className="tto-pill">
                        Threshold: <strong>{parseFloat(hoveredPoint.val) >= 70 ? 'NOMINAL' : 'BREACH'}</strong>
                      </span>
                    </div>
                  </div>
                )}

                {/* Chart Bottom Legend */}
                <div className="trajectory-legend-row font-mono">
                  <span className="t-leg-item">
                    <span className="t-dot" style={{ background: '#00F0FF', boxShadow: '0 0 6px #00F0FF' }} />
                    Baseline Live Telemetry ({currentResScore.toFixed(1)}%)
                  </span>
                  {(activeInc?.is_active || showStressCascade) && (
                    <span className="t-leg-item">
                      <span className="t-dot" style={{ background: '#EF4444', boxShadow: '0 0 6px #EF4444' }} />
                      Unmitigated Failure Cascade (21.5%)
                    </span>
                  )}
                  {(activeInc?.is_active || showStressCascade) && (
                    <span className="t-leg-item">
                      <span className="t-dot" style={{ background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
                      AI Automated Recovery (95.5%)
                    </span>
                  )}
                  {showConfidenceCorridor && !(activeInc?.is_active || showStressCascade) && (
                    <span className="t-leg-item">
                      <span className="t-dot" style={{ background: 'rgba(0, 240, 255, 0.4)' }} />
                      Confidence Corridor (±3.5%)
                    </span>
                  )}
                  <span className="t-leg-item">
                    <span className="t-dot" style={{ background: '#F59E0B' }} />
                    Critical Safety Floor (70%)
                  </span>
                </div>

                {/* 4 Executive Diagnostic KPI Telemetry Cards */}
                <div className="trajectory-kpi-chips font-mono">
                  <div className="tk-chip">
                    <span className="tk-label">CURRENT INDEX</span>
                    <span className="tk-val" style={{ color: '#00F0FF' }}>{(currentResScore || 94.2).toFixed(1)}%</span>
                    <span className="tk-sub">Nominal Equilibrium</span>
                  </div>
                  <div className="tk-chip">
                    <span className="tk-label">SAFETY HEADROOM</span>
                    <span className="tk-val" style={{ color: '#10B981' }}>+{((currentResScore || 94.2) - 70).toFixed(1)}%</span>
                    <span className="tk-sub">Above 70% Floor</span>
                  </div>
                  <div className="tk-chip">
                    <span className="tk-label">VALLEY FORECAST</span>
                    <span className="tk-val" style={{ color: (activeInc?.is_active || showStressCascade) ? '#EF4444' : '#00A3FF' }}>
                      {(activeInc?.is_active || showStressCascade) ? '21.5% (Severe)' : '92.8% (Stable)'}
                    </span>
                    <span className="tk-sub">2h Horizon Minimum</span>
                  </div>
                  <div className="tk-chip">
                    <span className="tk-label">AUTONOMY RUNTIME</span>
                    <span className="tk-val" style={{ color: '#F59E0B' }}>8.5 Hours</span>
                    <span className="tk-sub">Dual Diesel + UPS</span>
                  </div>
                </div>
              </div>
            )}

            {/* View 2: Multi-Domain System Stress Breakdown */}
            {graphTab === 'breakdown' && (
              <div className="system-stress-breakdown font-mono">
                {[
                  { domain: 'Critical Life-Support & Surgical OT', pct: (subScores.service_continuity ?? 100).toFixed(0), weight: '35%', load: '142 kW', status: '100% SECURE', color: '#10B981' },
                  { domain: 'Main Electrical Bus & Generator Sync', pct: (subScores.stability_factor ?? 88.2).toFixed(0), weight: '20%', load: '320 kW', status: 'ONLINE (8.5h)', color: '#00A3FF' },
                  { domain: 'Backup Energy Margin (UPS Inverters)', pct: (subScores.backup_margin ?? 88.8).toFixed(0), weight: '20%', load: '100% Chg', status: 'N+1 ARMED', color: '#00E5A3' },
                  { domain: 'HVAC & Cleanroom Thermal Loop', pct: (subScores.recovery_readiness ?? 100).toFixed(0), weight: '15%', load: '18.4°C', status: 'STABLE 38m', color: '#10B981' },
                  { domain: 'Telemetry Comms & SCADA Network', pct: (subScores.resource_conservation ?? 100).toFixed(0), weight: '10%', load: '4ms Lat', status: 'OPTIMAL', color: '#00F0FF' }
                ].map((item, idx) => (
                  <div key={idx} className="stress-item-row">
                    <div className="sir-header">
                      <div className="sir-title-group">
                        <span className="sir-title">{item.domain}</span>
                        <span className="sir-wt">Weight: {item.weight} • Telemetry: {item.load}</span>
                      </div>
                      <span className="sir-status" style={{ color: item.color }}>{item.status} ({item.pct}%)</span>
                    </div>
                    <div className="sir-progress-track">
                      <div
                        className="sir-progress-fill"
                        style={{ width: `${item.pct}%`, backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* View 3: Autonomous Margins */}
            {graphTab === 'margins' && (
              <div className="autonomous-margins-grid font-mono">
                <div className="margin-tile">
                  <div className="mt-icon-wrap" style={{ color: '#00A3FF', background: 'rgba(0,163,255,0.12)' }}>
                    <Zap size={18} />
                  </div>
                  <div className="mt-text">
                    <span className="mt-val">8.5 Hours</span>
                    <span className="mt-lbl">GEN_01 Diesel Autonomy</span>
                    <span className="mt-sub">1,850 L reserve (88% tank capacity)</span>
                  </div>
                </div>

                <div className="margin-tile">
                  <div className="mt-icon-wrap" style={{ color: '#10B981', background: 'rgba(16,185,129,0.12)' }}>
                    <BatteryCharging size={18} />
                  </div>
                  <div className="mt-text">
                    <span className="mt-val">45.0 Min</span>
                    <span className="mt-lbl">UPS Critical Inverter</span>
                    <span className="mt-sub">100% battery bank • Zero transfer blip</span>
                  </div>
                </div>

                <div className="margin-tile">
                  <div className="mt-icon-wrap" style={{ color: '#00E5A3', background: 'rgba(0,229,163,0.12)' }}>
                    <Wind size={18} />
                  </div>
                  <div className="mt-text">
                    <span className="mt-val">38.0 Min</span>
                    <span className="mt-lbl">Chilled Water Inertia</span>
                    <span className="mt-sub">Thermal rise &lt; 0.8°C/hr buffer</span>
                  </div>
                </div>

                <div className="margin-tile">
                  <div className="mt-icon-wrap" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.12)' }}>
                    <ShieldCheck size={18} />
                  </div>
                  <div className="mt-text">
                    <span className="mt-val">&lt; 4.2 Sec</span>
                    <span className="mt-lbl">Autonomous MTTM</span>
                    <span className="mt-sub">Mean time to autonomous failover</span>
                  </div>
                </div>

                <div className="margin-tile">
                  <div className="mt-icon-wrap" style={{ color: '#00F0FF', background: 'rgba(0,240,255,0.12)' }}>
                    <Droplets size={18} />
                  </div>
                  <div className="mt-text">
                    <span className="mt-val">72.0 Hours</span>
                    <span className="mt-lbl">Cryogenic O2 Storage</span>
                    <span className="mt-sub">Dual 55 PSI headers nominal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Quick Reports + A4 Preview */}
        <div className="reports-right-column">
          {/* Quick Reports Bar */}
          <div className="reports-panel-card quick-reports-card hide-on-print">
            <span className="reports-panel-title">Quick Action Reports</span>
            <div className="quick-reports-grid">
              <div
                className="quick-rep-item"
                onClick={() => { setSelectedReportType('simulation'); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-rep-icon-wrap icon-blue"><FileText size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Simulation Audit</span>
                  <span className="quick-rep-sub">Executive breakdown &gt;</span>
                </div>
              </div>

              <div
                className="quick-rep-item"
                onClick={() => { setSelectedReportType('risk'); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-rep-icon-wrap icon-cyan"><ShieldCheck size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Risk Assessment</span>
                  <span className="quick-rep-sub">Threat & threshold &gt;</span>
                </div>
              </div>

              <div
                className="quick-rep-item"
                onClick={() => { setSelectedReportType('perf'); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-rep-icon-wrap icon-green"><Presentation size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">System Performance</span>
                  <span className="quick-rep-sub">Telemetry & uptime &gt;</span>
                </div>
              </div>

              <div
                className="quick-rep-item"
                onClick={() => { setSelectedReportType('whatif'); }}
                style={{ cursor: 'pointer' }}
              >
                <div className="quick-rep-icon-wrap icon-purple"><FileSpreadsheet size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">What-If Strategies</span>
                  <span className="quick-rep-sub">MCDA Trade-offs &gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Report Preview (Rendered A4 Document Sheet or Markdown / JSON) */}
          <div className="reports-panel-card preview-sheet-card print-fullscreen">
            <div className="panel-header-with-action hide-on-print">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="reports-panel-title">
                  {outputFormat === 'pdf' && 'Generated Executive Preview (A4 Sheet)'}
                  {outputFormat === 'markdown' && 'Executive Markdown Source (.md)'}
                  {outputFormat === 'json' && 'Structured JSON Data (.json)'}
                </span>
                <span className="badge-live-dot font-mono" style={{ fontSize: '10px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }} /> Live
                </span>
              </div>

              <div style={{ position: 'relative', display: 'flex', gap: '6px' }}>
                {/* Primary Button: In PDF Mode, opens Full-Screen Review Modal */}
                {outputFormat === 'pdf' ? (
                  <button
                    type="button"
                    className="download-rep-btn primary-action-btn review-btn"
                    onClick={() => setIsReviewModalOpen(true)}
                    title="Review document before printing or saving"
                  >
                    <Eye size={13} />
                    <span>Review & Export Report</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="download-rep-btn primary-action-btn"
                    onClick={() => handleDownload()}
                    title={`Export as ${outputFormat.toUpperCase()}`}
                  >
                    <Download size={13} />
                    <span>{outputFormat === 'markdown' ? 'Export Markdown' : 'Export JSON'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="download-rep-btn dropdown-toggle-btn"
                  onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                  aria-label="Download format options"
                >
                  <ChevronDown size={13} />
                </button>

                {downloadMenuOpen && (
                  <div className="export-menu-dropdown font-mono">
                    <button type="button" onClick={() => { setIsReviewModalOpen(true); setDownloadMenuOpen(false); }}>
                      <Eye size={12} /> Review Document (A4)
                    </button>
                    <button type="button" onClick={() => handleDownload('pdf')}>
                      <Printer size={12} /> Direct Print PDF (.pdf)
                    </button>
                    <button type="button" onClick={() => handleDownload('markdown')}>
                      <FileText size={12} /> Executive Markdown (.md)
                    </button>
                    <button type="button" onClick={() => handleDownload('json')}>
                      <Activity size={12} /> Raw JSON Data (.json)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Click to review overlay banner */}
            {outputFormat === 'pdf' && (
              <div
                className="preview-review-hint-bar font-mono"
                onClick={() => setIsReviewModalOpen(true)}
              >
                <Eye size={12} style={{ color: 'var(--accent-cyan)' }} />
                <span>Click document or <strong>"Review & Export Report"</strong> to open high-resolution audit inspection</span>
                <Maximize2 size={12} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
              </div>
            )}

            {outputFormat === 'pdf' && renderReportPreview()}
            {outputFormat === 'markdown' && renderMarkdownPreview()}
            {outputFormat === 'json' && renderJsonPreview()}
          </div>
        </div>
      </section>

      {/* 3. EXECUTIVE DOCUMENT FULL-SCREEN REVIEW MODAL */}
      {isReviewModalOpen && (
        <div className="report-review-modal-overlay" onClick={() => setIsReviewModalOpen(false)}>
          <div className="report-review-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Top Review Bar */}
            <div className="review-modal-header font-mono">
              <div className="rmh-left">
                <div className="rmh-doc-badge">
                  <Eye size={14} style={{ color: '#00F0FF' }} />
                  <span className="rmh-title">ResilienceOS Executive Briefing Review</span>
                </div>
                <span className="rmh-status-badge">AUDIT READY</span>
              </div>

              <div className="rmh-center-controls">
                <span className="rmh-zoom-label">Zoom:</span>
                <button
                  type="button"
                  className={`rmh-zoom-btn ${reviewZoom === 'fit' ? 'is-active' : ''}`}
                  onClick={() => setReviewZoom('fit')}
                >
                  Fit Width
                </button>
                <button
                  type="button"
                  className={`rmh-zoom-btn ${reviewZoom === '100%' ? 'is-active' : ''}`}
                  onClick={() => setReviewZoom('100%')}
                >
                  100%
                </button>
                <button
                  type="button"
                  className={`rmh-zoom-btn ${reviewZoom === '125%' ? 'is-active' : ''}`}
                  onClick={() => setReviewZoom('125%')}
                >
                  125%
                </button>
              </div>

              <div className="rmh-right-actions">
                <button
                  type="button"
                  className="rmh-action-btn rmh-print-btn"
                  onClick={() => handlePrintPdf()}
                  title="Print to PDF"
                >
                  <Printer size={13} />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  type="button"
                  className="rmh-action-btn rmh-md-btn"
                  onClick={() => handleDownload('markdown')}
                  title="Download Markdown"
                >
                  <Share2 size={13} />
                  <span>Markdown</span>
                </button>
                <button
                  type="button"
                  className="rmh-action-btn rmh-json-btn"
                  onClick={() => handleDownload('json')}
                  title="Download JSON"
                >
                  <Activity size={13} />
                  <span>JSON</span>
                </button>
                <button
                  type="button"
                  className="rmh-close-btn"
                  onClick={() => setIsReviewModalOpen(false)}
                  aria-label="Close review dialog"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Review Document Viewport */}
            <div className="review-modal-viewport">
              <div
                className="review-document-wrapper"
                style={{
                  transform: reviewZoom === 'fit' ? 'scale(0.92)' : reviewZoom === '125%' ? 'scale(1.18)' : 'scale(1)',
                  transformOrigin: 'top center'
                }}
              >
                {renderReportPreview()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
