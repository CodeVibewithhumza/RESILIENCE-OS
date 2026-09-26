import { useState, useEffect } from 'react'
import {
  FileText,
  Download,
  FileCheck,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Presentation,
  Check,
  AlertTriangle
} from 'lucide-react'
import { getSimulationReport } from '../../services/simulationApi'
import './ReportsView.css'

export default function ReportsView({ resilience, incident, assets = [] }) {
  const [reportType, setReportType] = useState('incident')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [reportData, setReportData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)
  const [formatNotice, setFormatNotice] = useState(null)
  const [scopeScenario, setScopeScenario] = useState('active')
  const [timeHorizon, setTimeHorizon] = useState('all')

  // Fetch live backend simulation report data
  const fetchReport = async (customTitle = null) => {
    setIsGenerating(true)
    setError(null)
    setFormatNotice(null)
    try {
      const result = await getSimulationReport('json', customTitle)
      if (result.success && result.data) {
        setReportData(result.data)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch report from backend.')
      }
    } catch (err) {
      setError(err?.message || 'Error communicating with simulation engine.')
    } finally {
      setIsGenerating(false)
      setIsLoading(false)
    }
  }

  // Initial mount & when active incident state changes
  useEffect(() => {
    fetchReport()
  }, [incident?.incident_id, incident?.is_active])

  // Backend report data takes precedence; props act as temporary fallback
  const incidentState = reportData?.incident_state ?? incident ?? null
  const resilienceBreakdown = reportData?.resilience_breakdown ?? resilience ?? null
  const riskSummary = reportData?.risk_summary ?? null
  const whatIfComparison = reportData?.what_if_comparison ?? null
  const isIncidentActive = Boolean(incidentState && incidentState.is_active)

  // Executive findings metrics (derived strictly from backend data)
  const servicesAtRiskCount = isIncidentActive
    ? (incidentState.affected_service_ids?.length ?? 0)
    : 0

  const assetsAffectedCount = isIncidentActive
    ? (incidentState.affected_asset_ids?.length ?? 0)
    : 0

  const blackoutHorizon = isIncidentActive && incidentState.estimated_unmitigated_blackout_min != null
    ? `~${incidentState.estimated_unmitigated_blackout_min} min`
    : '—'

  const overallResilienceScore = resilienceBreakdown?.overall_score != null
    ? Number(resilienceBreakdown.overall_score).toFixed(1)
    : '—'

  // Per specification: use backend-provided delta if available; do not invent baseline
  const resilienceDelta = '—'

  // Handle user-initiated refresh / generation
  const handleGenerateReport = async () => {
    const customTitle = scopeScenario === 'active' ? null : scopeScenario
    await fetchReport(customTitle)
    setDownloadSuccess(true)
    setTimeout(() => setDownloadSuccess(false), 2500)
  }

  // Handle document export / download
  const handleDownloadReport = async () => {
    setFormatNotice(null)

    // Excel and PowerPoint are unsupported by backend
    if (selectedFormat === 'excel' || selectedFormat === 'ppt') {
      setFormatNotice(
        `Format "${selectedFormat.toUpperCase()}" is unsupported by the backend. Use Markdown (.md), JSON (.json), or PDF Print.`
      )
      return
    }

    // PDF format uses native browser print
    if (selectedFormat === 'pdf') {
      window.print()
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
      return
    }

    const baseFilename = isIncidentActive
      ? `${reportType}_report_${incidentState.incident_id || 'incident'}_${new Date().toISOString().slice(0, 10)}`
      : `campus_baseline_${reportType}_report_${new Date().toISOString().slice(0, 10)}`

    // JSON export via Blob
    if (selectedFormat === 'json') {
      try {
        let dataToDownload = reportData
        if (!dataToDownload) {
          const res = await getSimulationReport('json', scopeScenario === 'active' ? null : scopeScenario)
          if (res.success && res.data) {
            dataToDownload = res.data
          }
        }

        if (!dataToDownload) {
          setError('No report data available to download.')
          return
        }

        const jsonStr = JSON.stringify(dataToDownload, null, 2)
        const blob = new Blob([jsonStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${baseFilename}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloadSuccess(true)
        setTimeout(() => setDownloadSuccess(false), 3000)
      } catch (err) {
        setError(`JSON download failed: ${err.message}`)
      }
      return
    }

    // Markdown export via Blob
    if (selectedFormat === 'markdown') {
      try {
        setIsGenerating(true)
        const res = await getSimulationReport('markdown', scopeScenario === 'active' ? null : scopeScenario)
        setIsGenerating(false)

        if (!res.success || !res.data) {
          setError(res.error || 'Failed to retrieve Markdown report from backend.')
          return
        }

        const blob = new Blob([res.data], { type: 'text/markdown;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${baseFilename}.md`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setDownloadSuccess(true)
        setTimeout(() => setDownloadSuccess(false), 3000)
      } catch (err) {
        setIsGenerating(false)
        setError(`Markdown download failed: ${err.message}`)
      }
    }
  }

  // Filter cascade timeline based on Time Horizon selector
  const rawTimeline = incidentState?.timeline || []
  const filteredTimeline = rawTimeline.filter((item) => {
    if (timeHorizon === 'immediate') return item.t_offset_min <= 10
    if (timeHorizon === 'stabilization') return item.t_offset_min > 10
    return true
  })

  return (
    <div className="reports-page">
      {/* Header Row */}
      <div className="reports-header-row">
        <div>
          <h1 className="reports-page-title">Executive Resilience & Incident Reports</h1>
          <p className="reports-page-subtitle">
            Generate formal incident summaries, what-if trade-off reports, and export compliance artifacts
          </p>
        </div>
        <button
          className="generate-report-btn"
          onClick={handleGenerateReport}
          disabled={isGenerating || isLoading}
        >
          {isGenerating ? (
            <span>Generating Document...</span>
          ) : downloadSuccess ? (
            <>
              <Check size={14} style={{ color: '#10B981' }} />
              <span>Report Updated!</span>
            </>
          ) : (
            <>
              <FileText size={14} />
              <span>Generate New Report</span>
            </>
          )}
        </button>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #EF4444',
          borderRadius: '6px',
          color: '#FCA5A5',
          fontSize: '12px'
        }}>
          <AlertTriangle size={15} style={{ color: '#EF4444', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {/* Format Notice Banner */}
      {formatNotice && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid #F59E0B',
          borderRadius: '6px',
          color: '#FCD34D',
          fontSize: '11.5px'
        }}>
          <AlertTriangle size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span>{formatNotice}</span>
        </div>
      )}

      {/* Report Type Category Selector Tabs */}
      <div className="report-tabs-bar">
        {[
          { id: 'incident', label: 'Incident Analysis Report', icon: FileText },
          { id: 'simulation', label: 'Simulation & Cascade Log', icon: FileCheck },
          { id: 'whatif', label: 'What-If Comparison Report', icon: Layers },
          { id: 'risk', label: 'Risk Assessment (SPOF)', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`report-tab-btn ${reportType === tab.id ? 'active' : ''}`}
              onClick={() => setReportType(tab.id)}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* 2-Column Split: Config & Key Findings (Left) vs Live Document Preview (Right) */}
      <div className="reports-split-grid">
        {/* Left Column: Config & Findings */}
        <div className="reports-left-col">
          {/* Configuration Card */}
          <div className="report-card">
            <div className="report-card-header">
              <span className="report-card-title">Report Configuration</span>
              <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>Live v2.4 Formatter</span>
            </div>

            <div className="report-config-grid">
              <div className="config-field">
                <label className="config-label">Incident Scope</label>
                <select
                  className="config-select font-mono"
                  value={scopeScenario}
                  onChange={(e) => setScopeScenario(e.target.value)}
                >
                  <option value="active">
                    {isIncidentActive
                      ? `Active: ${incidentState.source_asset_id} (${incidentState.failure_type})`
                      : 'Campus Baseline (Normal State)'}
                  </option>
                  <option value="Primary Substation Transformer Failure (Full Trip)">
                    Primary Transformer Failure (Full Trip)
                  </option>
                  <option value="11kV City Grid Blackout">
                    11kV City Grid Blackout
                  </option>
                  <option value="Cryogenic Oxygen Pipeline Rupture">
                    Cryogenic Oxygen Pipeline Rupture
                  </option>
                  <option value="HVAC Chiller Thermal Trip">
                    HVAC Chiller Thermal Trip
                  </option>
                </select>
              </div>

              <div className="config-field">
                <label className="config-label">Time Horizon</label>
                <select
                  className="config-select font-mono"
                  value={timeHorizon}
                  onChange={(e) => setTimeHorizon(e.target.value)}
                >
                  <option value="all">Full Event Horizon (All Offsets)</option>
                  <option value="immediate">Immediate Cascade Phase (T+0 to T+10 min)</option>
                  <option value="stabilization">Stabilization Phase (T+10 to T+45 min)</option>
                </select>
              </div>
            </div>

            <div className="format-selection-row">
              <span className="config-label">Export Format:</span>
              <div className="format-pills-row">
                <button
                  className={`format-pill ${selectedFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFormat('pdf')
                    setFormatNotice(null)
                  }}
                  title="Print or save as PDF via browser"
                >
                  <FileText size={13} />
                  <span>PDF Executive (Print)</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'markdown' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFormat('markdown')
                    setFormatNotice(null)
                  }}
                  title="Download publication-ready Markdown file"
                >
                  <FileText size={13} />
                  <span>Markdown (.md)</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'json' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFormat('json')
                    setFormatNotice(null)
                  }}
                  title="Download structured JSON report"
                >
                  <FileCheck size={13} />
                  <span>JSON Data (.json)</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFormat('excel')
                    setFormatNotice('Excel export (.xlsx) is currently unsupported by backend.')
                  }}
                  title="Format unsupported by backend"
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel (N/A)</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'ppt' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFormat('ppt')
                    setFormatNotice('Presentation slides (.pptx) is currently unsupported by backend.')
                  }}
                  title="Format unsupported by backend"
                >
                  <Presentation size={13} />
                  <span>Slides (N/A)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Findings Card */}
          <div className="report-card">
            <div className="report-card-header">
              <span className="report-card-title">Key Executive Findings</span>
              <span className={`badge ${isIncidentActive ? 'badge-critical' : 'badge-normal'} font-mono`}>
                {isIncidentActive ? 'Active Incident' : 'Baseline Normal'}
              </span>
            </div>

            <div className="findings-stat-grid">
              <div className="finding-box">
                <span className="finding-label">Services at Risk</span>
                <span className="finding-val font-mono" style={{ color: servicesAtRiskCount > 0 ? '#EF4444' : '#10B981' }}>
                  {servicesAtRiskCount} Units
                </span>
                <span className="finding-sub">
                  {servicesAtRiskCount > 0
                    ? incidentState.affected_service_ids.slice(0, 2).join(' & ')
                    : 'All Services Nominal'}
                </span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Assets Affected</span>
                <span className="finding-val font-mono" style={{ color: assetsAffectedCount > 0 ? '#F59E0B' : '#10B981' }}>
                  {assetsAffectedCount} Nodes
                </span>
                <span className="finding-sub">
                  {isIncidentActive && incidentState.source_asset_id
                    ? `Origin: ${incidentState.source_asset_id}`
                    : 'Infrastructure Healthy'}
                </span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Blackout Horizon</span>
                <span className="finding-val font-mono">
                  {blackoutHorizon}
                </span>
                <span className="finding-sub">
                  {isIncidentActive ? 'Estimated Horizon' : 'Continuous Operation'}
                </span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Resilience Score</span>
                <span className="finding-val font-mono" style={{ color: Number(overallResilienceScore) < 70 ? '#EF4444' : '#10B981' }}>
                  {overallResilienceScore} / 100
                </span>
                <span className="finding-sub">
                  {resilienceBreakdown?.status_label || (isIncidentActive ? 'DEGRADED' : 'OPTIMAL')} (Delta: {resilienceDelta})
                </span>
              </div>
            </div>

            {/* Dynamic Table Section based on Report Tab */}
            <div className="report-table-wrap">
              {/* TAB 1: Incident Analysis */}
              {reportType === 'incident' && (
                <table className="report-impact-table">
                  <thead>
                    <tr>
                      <th>Clinical Unit / Subsystem</th>
                      <th>Baseline</th>
                      <th>Current State</th>
                      <th>Est. Horizon</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isIncidentActive && incidentState.affected_service_ids?.length > 0 ? (
                      incidentState.affected_service_ids.map((serviceId) => (
                        <tr key={serviceId}>
                          <td className="font-bold">{serviceId.replace(/_/g, ' ')}</td>
                          <td><span className="badge badge-normal">Normal</span></td>
                          <td><span className="badge badge-critical">At Risk</span></td>
                          <td className="font-mono">{blackoutHorizon}</td>
                          <td><span className="badge badge-critical">High</span></td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                          All clinical units operating at normal 100% capacity. No active disruptions.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 2: Simulation & Cascade Log */}
              {reportType === 'simulation' && (
                <table className="report-impact-table">
                  <thead>
                    <tr>
                      <th>Time Offset</th>
                      <th>Event Title</th>
                      <th>Affected Nodes</th>
                      <th>Projected Score</th>
                      <th>Service Impact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTimeline.length > 0 ? (
                      filteredTimeline.map((event, idx) => (
                        <tr key={idx}>
                          <td className="font-mono" style={{ color: 'var(--accent-cyan)' }}>
                            T+{event.t_offset_min}m
                          </td>
                          <td className="font-bold">{event.title}</td>
                          <td className="font-mono" style={{ fontSize: '10.5px' }}>
                            {event.affected_node_ids?.join(', ') || '—'}
                          </td>
                          <td className="font-mono" style={{ color: event.system_resilience_score < 70 ? '#EF4444' : '#10B981' }}>
                            {event.system_resilience_score != null ? event.system_resilience_score.toFixed(1) : '—'}
                          </td>
                          <td>{event.service_impact_summary || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                          No cascade events recorded for this time horizon. System is operating at baseline.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 3: What-If Comparison */}
              {reportType === 'whatif' && (
                <table className="report-impact-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Strategy Name</th>
                      <th>Projected R</th>
                      <th>ICU Continuity</th>
                      <th>OT Continuity</th>
                      <th>Backup Runtime</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whatIfComparison?.strategies?.length > 0 ? (
                      whatIfComparison.strategies.map((strategy) => (
                        <tr key={strategy.strategy_id}>
                          <td>
                            {strategy.is_recommended ? (
                              <span className="badge badge-normal font-mono">⭐ TOP</span>
                            ) : (
                              <span className="font-mono">#{strategy.recommendation_rank}</span>
                            )}
                          </td>
                          <td className="font-bold">
                            {strategy.strategy_name} ({strategy.strategy_code})
                          </td>
                          <td className="font-mono" style={{ color: strategy.projected_resilience_score < 70 ? '#EF4444' : '#10B981' }}>
                            {strategy.projected_resilience_score != null ? strategy.projected_resilience_score.toFixed(1) : '—'}
                          </td>
                          <td className="font-mono">{strategy.icu_continuity_pct?.toFixed(0)}%</td>
                          <td className="font-mono">{strategy.operating_theatre_continuity_pct?.toFixed(0)}%</td>
                          <td className="font-mono">{strategy.backup_runtime_remaining_hours?.toFixed(1)} hrs</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                          No What-If strategies evaluated. Run simulation to compare response options.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

              {/* TAB 4: Risk Assessment */}
              {reportType === 'risk' && (
                <table className="report-impact-table">
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
                    {riskSummary?.imminent_threshold_crossings?.length > 0 ? (
                      riskSummary.imminent_threshold_crossings.map((alert, idx) => (
                        <tr key={idx}>
                          <td className="font-mono font-bold">{alert.asset_id}</td>
                          <td>{alert.metric_name}</td>
                          <td className="font-mono">{alert.current_reserve != null ? alert.current_reserve.toFixed(1) : '—'}</td>
                          <td className="font-mono">{alert.depletion_rate_per_min != null ? `${alert.depletion_rate_per_min.toFixed(2)}/min` : '—'}</td>
                          <td className="font-mono" style={{ color: alert.is_critical ? '#EF4444' : '#F59E0B' }}>
                            {alert.estimated_time_remaining_min != null ? `${alert.estimated_time_remaining_min.toFixed(1)} min` : '—'}
                          </td>
                          <td>
                            <span className={`badge ${alert.is_critical ? 'badge-critical' : 'badge-outline'}`}>
                              {alert.is_critical ? 'Critical' : 'Warning'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: '#94a3b8', padding: '16px' }}>
                          No imminent threshold crossings detected. All operational reserves within safe margins.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Generated Document Preview Card */}
        <div className="reports-right-col">
          <div className="report-card document-preview-card">
            <div className="preview-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span className="preview-title font-mono">
                  {selectedFormat === 'pdf' && (isIncidentActive ? 'INCIDENT_ANALYSIS_REPORT.pdf' : 'CAMPUS_BASELINE_REPORT.pdf')}
                  {selectedFormat === 'markdown' && (isIncidentActive ? 'INCIDENT_ANALYSIS_REPORT.md' : 'CAMPUS_BASELINE_REPORT.md')}
                  {selectedFormat === 'json' && (isIncidentActive ? 'INCIDENT_ANALYSIS_REPORT.json' : 'CAMPUS_BASELINE_REPORT.json')}
                  {selectedFormat === 'excel' && 'INCIDENT_TELEMETRY.xlsx (Unsupported)'}
                  {selectedFormat === 'ppt' && 'PRESENTATION_SLIDES.pptx (Unsupported)'}
                </span>
              </div>
              <button
                className="preview-download-btn"
                onClick={handleDownloadReport}
                disabled={isGenerating || isLoading || selectedFormat === 'excel' || selectedFormat === 'ppt'}
                title={selectedFormat === 'excel' || selectedFormat === 'ppt' ? 'Format unsupported' : 'Export document'}
              >
                <Download size={13} />
                <span>
                  {selectedFormat === 'pdf'
                    ? 'Print / PDF'
                    : selectedFormat === 'excel' || selectedFormat === 'ppt'
                    ? 'N/A'
                    : 'Download'}
                </span>
              </button>
            </div>

            {/* Paper Sheet Document Preview */}
            <div className="document-sheet">
              <div className="doc-header-block">
                <div className="doc-brand">RESILIENCE<span style={{ color: '#00F0FF' }}>OS</span></div>
                <div className="doc-meta-right font-mono">
                  <div>SIM ID: {incidentState?.incident_id || 'CAMPUS-BASELINE-AUDIT'}</div>
                  <div>DATE: {reportData?.generated_at ? new Date(reportData.generated_at).toUTCString() : new Date().toUTCString()}</div>
                  <div>CLASSIFICATION: RESTRICTED</div>
                </div>
              </div>

              <h2 className="doc-report-title">
                {isIncidentActive
                  ? 'HOSPITAL INFRASTRUCTURE DISRUPTION & RESILIENCE REPORT'
                  : 'CAMPUS BASELINE RESILIENCE & INFRASTRUCTURE AUDIT'}
              </h2>
              <div className="doc-badge-row">
                <span className="doc-tag">
                  {isIncidentActive
                    ? (incidentState.failure_type ? incidentState.failure_type.toUpperCase().replace(/_/g, ' ') : incidentState.source_asset_id)
                    : 'NORMAL BASELINE OPERATION'}
                </span>
                <span className="doc-tag">
                  {isIncidentActive
                    ? `CASCADE HORIZON: ${incidentState.estimated_unmitigated_blackout_min ? `${incidentState.estimated_unmitigated_blackout_min} MIN` : '2.0 HOURS'}`
                    : `CAMPUS HEALTH: ${resilienceBreakdown?.status_label || 'OPTIMAL'}`}
                </span>
                {isIncidentActive && incidentState.severity && (
                  <span className="doc-tag">
                    SEVERITY: {String(incidentState.severity).toUpperCase()}
                  </span>
                )}
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">1. Executive Summary</h4>
                <p className="doc-p">
                  {isIncidentActive
                    ? `An active disruption was detected originating at node ${incidentState.source_asset_id || 'unknown'} with failure mode '${incidentState.failure_type || 'unspecified'}'. Current campus resilience index is evaluated at ${overallResilienceScore} / 100 (${resilienceBreakdown?.status_label || 'DEGRADED'}). The disruption propagates across ${assetsAffectedCount} infrastructure nodes and impacts ${servicesAtRiskCount} critical clinical delivery units. ${incidentState.active_mitigation_strategy ? `Applied mitigation strategy: ${incidentState.active_mitigation_strategy}.` : 'No autonomous mitigation strategy has been applied.'}`
                    : `The hospital campus digital twin is operating in baseline normal state with no active failures or disruptions. Campus composite resilience index is ${overallResilienceScore} / 100 (${resilienceBreakdown?.status_label || 'OPTIMAL'}). Primary grid, emergency standby generators, uninterruptible power supplies, and cryogenic life-support systems are operating within standard parameters.`}
                </p>
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">2. Critical Clinical Impact & Resilience Breakdown</h4>
                <div className="doc-metric-row font-mono">
                  <div className="doc-metric-pill">Services At Risk: {servicesAtRiskCount}</div>
                  <div className="doc-metric-pill">Affected Assets: {assetsAffectedCount}</div>
                  <div className="doc-metric-pill">Resilience Index: {overallResilienceScore} / 100</div>
                </div>
                {resilienceBreakdown?.sub_scores && (
                  <p className="doc-p" style={{ fontSize: '10px', color: '#94a3b8' }}>
                    Continuity (C): {resilienceBreakdown.sub_scores.service_continuity?.toFixed(1) || '—'}% | Availability (A): {resilienceBreakdown.sub_scores.stability_factor?.toFixed(1) || '—'}% | Backup Margin (B): {resilienceBreakdown.sub_scores.backup_margin?.toFixed(1) || '—'}% | Recovery Margin (1-T): {resilienceBreakdown.sub_scores.recovery_readiness?.toFixed(1) || '—'}%
                  </p>
                )}
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">3. AI Recommended Mitigation Strategy</h4>
                <div className="doc-recommendation-box">
                  {whatIfComparison?.strategies?.length > 0 ? (
                    <>
                      <strong>RECOMMENDED: Strategy {whatIfComparison.strategies[0].strategy_code} — {whatIfComparison.strategies[0].strategy_name}</strong>
                      <p className="doc-p" style={{ margin: '4px 0 0 0' }}>
                        {whatIfComparison.causal_explanation || whatIfComparison.strategies[0].trade_off_summary || 'Multi-criteria decision analysis identified this response strategy as optimal for preserving vital healthcare continuity.'}
                      </p>
                    </>
                  ) : isIncidentActive ? (
                    <>
                      <strong>RECOMMENDED: Response Strategy Evaluation Pending</strong>
                      <p className="doc-p" style={{ margin: '4px 0 0 0' }}>
                        Multi-criteria decision analysis (MCDA) strategy evaluation can be executed from the Strategy Lab / What-If view.
                      </p>
                    </>
                  ) : (
                    <>
                      <strong>RECOMMENDED: Standard Operational Protocols</strong>
                      <p className="doc-p" style={{ margin: '4px 0 0 0' }}>
                        Continue telemetry monitoring at 1-second intervals. Maintain standby generators in ready offline status and monitor battery buffer headroom.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="doc-footer-stamp font-mono">
                Generated autonomously by ResilienceOS v2.4 Autonomic Simulation & Decision Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
