import { useState } from 'react'
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
  TrendingDown
} from 'lucide-react'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './ReportsView.css'
import { getSimulationReport } from '../../services/simulationApi'

// 1. INCIDENT REPORT
const IncidentReportPreview = ({ reportData, generatedAt }) => {
  const activeInc = reportData?.incident_state
  const affectedServicesCount = activeInc ? (activeInc.affected_service_ids?.length || 0) : 0
  const affectedAssetsCount = activeInc ? (activeInc.affected_asset_ids?.length || 0) : 0

  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">Incident Report</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
          <span><strong>Status:</strong> {activeInc ? 'Active Incident' : 'No Active Incident'}</span>
        </div>
      </div>
      <div className="a4-section-block">
        {activeInc ? (
          <>
            <p className="a4-para">
              Incident <strong>{activeInc.incident_id}</strong> is currently active, originating from asset <strong>{activeInc.source_asset_id}</strong> with severity <strong>{activeInc.severity}</strong>.
            </p>
            <div className="a4-mini-kpis-row font-mono">
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#FF4D4D' }}>{affectedServicesCount}</span>
                <span className="a4-kpi-lbl">Affected Services</span>
              </div>
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#FFB800' }}>{affectedAssetsCount}</span>
                <span className="a4-kpi-lbl">Affected Assets</span>
              </div>
            </div>
          </>
        ) : (
          <p className="a4-para" style={{ color: '#00E5A3', fontWeight: 'bold' }}>No Active Incident.</p>
        )}
      </div>
    </div>
  )
}

// 2. SIMULATION REPORT
const SimulationReportPreview = ({ reportData, generatedAt, currentResScore }) => {
  const activeInc = reportData?.incident_state
  const resBreakdown = reportData?.resilience_breakdown

  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">Simulation Report</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
          <span><strong>Simulation State:</strong> {activeInc ? 'Degraded' : 'Nominal'}</span>
        </div>
      </div>
      <div className="a4-image-banner hide-on-print">
        <img src={hospitalCampusImg} alt="Report Digital Twin Banner" className="a4-thumb-img" />
      </div>
      <div className="a4-section-block">
        <span className="a4-section-heading">Simulation Overview</span>
        <p className="a4-para">
          Comprehensive system simulation executed. Current overall resilience score is {currentResScore.toFixed(1)}. {activeInc ? `An incident (${activeInc.incident_id}) is actively propagating.` : 'No active incident detected.'}
        </p>
        <div className="a4-mini-kpis-row font-mono">
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: '#00E5A3' }}>{currentResScore.toFixed(1)}</span>
            <span className="a4-kpi-lbl">Current Resilience</span>
          </div>
          <div className="a4-kpi-cell">
            <span className="a4-kpi-val" style={{ color: '#00A3FF' }}>{resBreakdown?.status_label || 'Optimal'}</span>
            <span className="a4-kpi-lbl">Status</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// 3. WHAT-IF COMPARISON
const WhatIfReportPreview = ({ reportData, generatedAt }) => {
  const whatIf = reportData?.what_if_comparison

  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">What-If Comparison</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="a4-section-block">
        {whatIf ? (
          <>
            <p className="a4-para">Strategy comparison executed. Best projected outcome identified.</p>
            <div className="a4-timeline-items font-mono">
              {whatIf.strategies?.map((strat, idx) => (
                <div className="a4-t-row" key={idx}>
                  <span className="a4-t-dot" style={{ backgroundColor: '#00A3FF' }} />
                  <span className="a4-t-desc">
                    <strong>{strat.strategy_id}</strong> - Projected Resilience: {strat.projected_resilience?.toFixed(1)}
                    {strat.estimated_recovery_time_mins ? ` (Recovery: ${strat.estimated_recovery_time_mins}m)` : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="a4-para" style={{ color: '#888' }}>No What-If analysis data available from the current simulation state.</p>
        )}
      </div>
    </div>
  )
}

// 4. RISK ASSESSMENT
const RiskReportPreview = ({ reportData, generatedAt }) => {
  const riskSummary = reportData?.risk_summary

  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">Risk Assessment</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
          <span><strong>Risk Level:</strong> {riskSummary?.overall_risk_level || 'Unknown'}</span>
        </div>
      </div>
      <div className="a4-section-block">
        {riskSummary ? (
          <>
            <div className="a4-mini-kpis-row font-mono">
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#FF4D4D' }}>{(riskSummary.overall_risk_score * 100).toFixed(1)}%</span>
                <span className="a4-kpi-lbl">Overall Risk Score</span>
              </div>
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#FFB800' }}>{riskSummary.vulnerable_assets?.length || 0}</span>
                <span className="a4-kpi-lbl">Vulnerable Assets</span>
              </div>
            </div>
            {riskSummary.vulnerable_assets?.length > 0 && (
              <div className="a4-timeline-items font-mono" style={{ marginTop: '20px' }}>
                {riskSummary.vulnerable_assets.slice(0, 5).map((vuln, idx) => (
                  <div className="a4-t-row" key={idx}>
                    <span className="a4-t-dot" style={{ backgroundColor: '#FF4D4D' }} />
                    <span className="a4-t-desc">Asset: {vuln.asset_id} (Risk: {(vuln.risk_score * 100).toFixed(1)}%)</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="a4-para" style={{ color: '#888' }}>No Risk Summary data available.</p>
        )}
      </div>
    </div>
  )
}

// 5. RESILIENCE ANALYSIS
const ResilienceReportPreview = ({ reportData, generatedAt }) => {
  const resBreakdown = reportData?.resilience_breakdown

  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">Resilience Analysis</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
          <span><strong>Status:</strong> {resBreakdown?.status_label || 'Unknown'}</span>
        </div>
      </div>
      <div className="a4-section-block">
        {resBreakdown ? (
          <>
            <div className="a4-mini-kpis-row font-mono">
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#00E5A3' }}>{resBreakdown.overall_score?.toFixed(1)}</span>
                <span className="a4-kpi-lbl">Overall Score</span>
              </div>
              <div className="a4-kpi-cell">
                <span className="a4-kpi-val" style={{ color: '#00A3FF' }}>{resBreakdown.delta_from_baseline.toFixed(1)}</span>
                <span className="a4-kpi-lbl">Delta vs Baseline</span>
              </div>
            </div>
            <div className="a4-timeline-items font-mono" style={{ marginTop: '20px' }}>
              {resBreakdown.subcomponents && Object.entries(resBreakdown.subcomponents).map(([key, value], idx) => (
                <div className="a4-t-row" key={idx}>
                  <span className="a4-t-dot" style={{ backgroundColor: '#00A3FF' }} />
                  <span className="a4-t-desc">{key.replace(/_/g, ' ').toUpperCase()}: {typeof value === 'number' ? value.toFixed(1) : value}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="a4-para" style={{ color: '#888' }}>No Resilience Breakdown data available.</p>
        )}
      </div>
    </div>
  )
}

// 6. SYSTEM PERFORMANCE
const PerformanceReportPreview = ({ reportData, generatedAt }) => {
  return (
    <div className="a4-document-paper">
      <div className="a4-doc-header">
        <div className="a4-brand-row">
          <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
          <span className="a4-doc-title">System Performance</span>
        </div>
        <div className="a4-meta-grid font-mono">
          <span><strong>Generated:</strong> {new Date(generatedAt).toLocaleString()}</span>
        </div>
      </div>
      <div className="a4-section-block" style={{ marginTop: '20px' }}>
        <p className="a4-para" style={{ color: '#888' }}>Performance data not available from current simulation state.</p>
      </div>
    </div>
  )
}

export default function ReportsView({ resilience, incident, assets = [], onNotify }) {
  const [selectedReportType, setSelectedReportType] = useState('incident')
  const [timeRange, setTimeRange] = useState('Full Event (0 - 2 hours)')
  const [outputFormat, setOutputFormat] = useState('pdf')

  const [isGenerating, setIsGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [reportError, setReportError] = useState(null)
  const [generatedAt, setGeneratedAt] = useState(null)

  const [includedSections, setIncludedSections] = useState({
    exec_summary: true,
    timeline: true,
    system_impact: true,
    response_strategies: true,
    resilience_metrics: true,
    recommendations: true
  })

  const toggleSection = (key) => {
    setIncludedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setReportError(null)
    const res = await getSimulationReport('json', null)
    setIsGenerating(false)
    if (res.success && res.data) {
      setReportData(res.data)
      setGeneratedAt(res.data.generated_at || new Date().toISOString())
      if (onNotify) {
        onNotify('Report generated successfully! Ready for export.', 'success')
      }
    } else {
      setReportError(res.error || 'Failed to generate report')
      if (onNotify) {
        onNotify(res.error || 'Failed to generate report', 'error')
      }
    }
  }

  const activeInc = reportData?.incident_state
  const resBreakdown = reportData?.resilience_breakdown
  const riskSummary = reportData?.risk_summary
  const whatIf = reportData?.what_if_comparison

  const getReportSpecificJson = () => {
    switch (selectedReportType) {
      case 'incident': return { type: 'Incident Report', generated_at: generatedAt, incident_state: activeInc || null }
      case 'simulation': return { type: 'Simulation Report', generated_at: generatedAt, ...reportData }
      case 'whatif': return { type: 'What-If Comparison', generated_at: generatedAt, what_if_comparison: whatIf || null }
      case 'risk': return { type: 'Risk Assessment', generated_at: generatedAt, risk_summary: riskSummary || null }
      case 'resilience': return { type: 'Resilience Analysis', generated_at: generatedAt, resilience_breakdown: resBreakdown || null }
      case 'perf': return { type: 'System Performance', error: 'Performance data not available from current simulation state.' }
      default: return reportData
    }
  }

  const getReportSpecificMarkdown = () => {
    let md = `# ResilienceOS - ${selectedReportType.toUpperCase()} REPORT\n`
    md += `**Generated At:** ${new Date(generatedAt).toLocaleString()}\n\n`

    if (selectedReportType === 'incident') {
      if (!activeInc) {
        md += "### No Active Incident\n"
      } else {
        md += `## Incident ID: ${activeInc.incident_id}\n`
        md += `- **Source Asset:** ${activeInc.source_asset_id}\n`
        md += `- **Severity:** ${activeInc.severity}\n`
        md += `- **Affected Assets:** ${activeInc.affected_asset_ids?.length || 0}\n`
        md += `- **Affected Services:** ${activeInc.affected_service_ids?.length || 0}\n`
      }
    } else if (selectedReportType === 'simulation') {
      md += `## Simulation Overview\n`
      md += `Current Resilience: ${resBreakdown?.overall_score?.toFixed(1) || 'N/A'}\n`
      md += `Active Incident: ${activeInc ? activeInc.incident_id : 'None'}\n`
    } else if (selectedReportType === 'whatif') {
      if (!whatIf) {
        md += "### No What-If Comparison Data Available\n"
      } else {
        md += "## Strategy Comparison\n"
        whatIf.strategies?.forEach(s => {
          md += `### ${s.strategy_id}\n`
          md += `- Projected Resilience: ${s.projected_resilience?.toFixed(1)}\n`
        })
      }
    } else if (selectedReportType === 'risk') {
      if (!riskSummary) md += "### No Risk Data Available\n"
      else {
        md += `## Overall Risk Level: ${riskSummary.overall_risk_level}\n`
        md += `Risk Score: ${(riskSummary.overall_risk_score * 100).toFixed(1)}%\n`
      }
    } else if (selectedReportType === 'resilience') {
      if (!resBreakdown) md += "### No Resilience Data Available\n"
      else {
        md += `## Overall Score: ${resBreakdown.overall_score?.toFixed(1)}\n`
        md += `Status: ${resBreakdown.status_label}\n`
        md += `Delta from baseline: ${resBreakdown.delta_from_baseline?.toFixed(1)}\n`
      }
    } else if (selectedReportType === 'perf') {
      md += "### Performance data not available from current simulation state.\n"
    }

    return md
  }

  const handleDownload = async () => {
    if (!reportData) return
    if (outputFormat === 'pdf') {
      window.print()
    } else if (outputFormat === 'markdown') {
      if (onNotify) onNotify('Downloading markdown report...', 'info')
      const mdContent = getReportSpecificMarkdown()
      const blob = new Blob([mdContent], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resilienceos-${selectedReportType}-report-${new Date().toISOString().replace(/[:.]/g, '-')}.md`
      a.click()
      URL.revokeObjectURL(url)
    } else if (outputFormat === 'json') {
      const jsonContent = getReportSpecificJson()
      const blob = new Blob([JSON.stringify(jsonContent, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resilienceos-${selectedReportType}-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  const affectedServicesCount = activeInc ? (activeInc.affected_service_ids?.length || 0) : 0
  const affectedAssetsCount = activeInc ? (activeInc.affected_asset_ids?.length || 0) : 0
  const currentResScore = resBreakdown?.overall_score || resilience?.overall_score || 0
  const baselineDelta = resBreakdown?.delta_from_baseline || 0

  const renderReportPreview = () => {
    if (!reportData) {
      return (
        <div className="a4-document-paper">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#888' }}>
            <span>Generate a report to view the latest report.</span>
          </div>
        </div>
      )
    }

    switch (selectedReportType) {
      case 'incident':
        return <IncidentReportPreview reportData={reportData} generatedAt={generatedAt} />
      case 'simulation':
        return <SimulationReportPreview reportData={reportData} generatedAt={generatedAt} currentResScore={currentResScore} />
      case 'whatif':
        return <WhatIfReportPreview reportData={reportData} generatedAt={generatedAt} />
      case 'risk':
        return <RiskReportPreview reportData={reportData} generatedAt={generatedAt} />
      case 'resilience':
        return <ResilienceReportPreview reportData={reportData} generatedAt={generatedAt} />
      case 'perf':
        return <PerformanceReportPreview reportData={reportData} generatedAt={generatedAt} />
      default:
        return null
    }
  }

  return (
    <div className="reports-page">
      <section className="reports-top-tabs-bar hide-on-print">
        <div className="reports-tabs-group">
          <button type="button" className={`report-tab-btn ${selectedReportType === 'incident' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('incident')}>
            <FileText size={14} /><span>Incident Report</span>
          </button>
          <button type="button" className={`report-tab-btn ${selectedReportType === 'simulation' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('simulation')}>
            <Layers size={14} /><span>Simulation Report</span>
          </button>
          <button type="button" className={`report-tab-btn ${selectedReportType === 'whatif' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('whatif')}>
            <FileCheck size={14} /><span>What-If Comparison</span>
          </button>
          <button type="button" className={`report-tab-btn ${selectedReportType === 'risk' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('risk')}>
            <ShieldCheck size={14} /><span>Risk Assessment</span>
          </button>
          <button type="button" className={`report-tab-btn ${selectedReportType === 'resilience' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('resilience')}>
            <FileSpreadsheet size={14} /><span>Resilience Analysis</span>
          </button>
          <button type="button" className={`report-tab-btn ${selectedReportType === 'perf' ? 'is-active' : ''}`} onClick={() => setSelectedReportType('perf')}>
            <Presentation size={14} /><span>System Performance</span>
          </button>
        </div>

        <button type="button" className="generate-report-cta-btn" onClick={handleGenerate} disabled={isGenerating}>
          <FileText size={14} />
          <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </section>

      {reportError && (
        <div className="error-banner hide-on-print" style={{ color: 'red', padding: '10px', background: '#ffe6e6', margin: '0 20px' }}>
          {reportError}
        </div>
      )}

      <section className="reports-main-grid">
        <div className="reports-left-column hide-on-print">
          <div className="reports-panel-card">
            <span className="reports-panel-title">Report Configuration</span>
            <div className="report-config-dropdowns-row">
              <div className="config-select-group">
                <label className="config-label">Report Type</label>
                <select className="config-select font-mono" value={selectedReportType} onChange={(e) => setSelectedReportType(e.target.value)}>
                  <option value="incident">Incident Report</option>
                  <option value="simulation">Simulation Report</option>
                  <option value="whatif">What-If Comparison</option>
                  <option value="risk">Risk Assessment</option>
                  <option value="resilience">Resilience Analysis</option>
                  <option value="perf">System Performance</option>
                </select>
              </div>
              <div className="config-select-group">
                <label className="config-label">Active Incident</label>
                <div className="config-select font-mono" style={{ display: 'flex', alignItems: 'center' }}>
                  {activeInc ? activeInc.incident_id : 'No Active Incident'}
                </div>
              </div>
              <div className="config-select-group">
                <label className="config-label">Time Range</label>
                <select className="config-select font-mono" value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
                  <option value="Full Event (0 - 2 hours)">Full Event (0 - 2 hours)</option>
                  <option value="First 30 Minutes">First 30 Minutes</option>
                </select>
              </div>
            </div>

            <div className="report-config-bottom-split">
              <div className="config-sub-col">
                <span className="config-sub-heading">Include Sections</span>
                <div className="checkboxes-grid">
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.exec_summary} onChange={() => toggleSection('exec_summary')} /><span>Executive Summary</span></label>
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.response_strategies} onChange={() => toggleSection('response_strategies')} /><span>Response Strategies</span></label>
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.timeline} onChange={() => toggleSection('timeline')} /><span>Incident Timeline</span></label>
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.resilience_metrics} onChange={() => toggleSection('resilience_metrics')} /><span>Resilience Metrics</span></label>
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.system_impact} onChange={() => toggleSection('system_impact')} /><span>System Impact Analysis</span></label>
                  <label className="config-checkbox-lbl"><input type="checkbox" checked={includedSections.recommendations} onChange={() => toggleSection('recommendations')} /><span>Recommendations</span></label>
                </div>
              </div>

              <div className="config-sub-col">
                <span className="config-sub-heading">Output Format</span>
                <div className="format-buttons-group">
                  <button type="button" className={`fmt-btn fmt-pdf ${outputFormat === 'pdf' ? 'is-active' : ''}`} onClick={() => setOutputFormat('pdf')}>
                    <FileText size={14} /><span>PDF Report</span>
                  </button>
                  <button type="button" className={`fmt-btn fmt-markdown ${outputFormat === 'markdown' ? 'is-active' : ''}`} onClick={() => setOutputFormat('markdown')}>
                    <FileText size={14} /><span>Markdown</span>
                  </button>
                  <button type="button" className={`fmt-btn fmt-json ${outputFormat === 'json' ? 'is-active' : ''}`} onClick={() => setOutputFormat('json')}>
                    <FileText size={14} /><span>JSON Data</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="reports-panel-card">
            <div className="panel-header-with-action">
              <span className="reports-panel-title">Key Findings</span>
            </div>
            {reportData ? (
              <div className="key-findings-tiles-row">
                {activeInc ? (
                  <>
                    <div className="finding-tile tile-red">
                      <div className="finding-icon-wrap icon-red"><AlertTriangle size={16} /></div>
                      <div className="finding-text">
                        <span className="finding-num font-mono">{affectedServicesCount}</span>
                        <span className="finding-lbl">Services at Risk</span>
                      </div>
                    </div>
                    <div className="finding-tile tile-gold">
                      <div className="finding-icon-wrap icon-gold"><Box size={16} /></div>
                      <div className="finding-text">
                        <span className="finding-num font-mono">{affectedAssetsCount}</span>
                        <span className="finding-lbl">Assets Affected</span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="finding-tile tile-green">
                    <div className="finding-icon-wrap icon-green"><Check size={16} /></div>
                    <div className="finding-text">
                      <span className="finding-lbl">No active incident</span>
                    </div>
                  </div>
                )}
                <div className="finding-tile tile-blue">
                  <div className="finding-icon-wrap icon-blue"><Clock size={16} /></div>
                  <div className="finding-text">
                    <span className="finding-num font-mono">{currentResScore.toFixed(1)}</span>
                    <span className="finding-lbl">Current Resilience</span>
                  </div>
                </div>
                {activeInc && (
                  <div className="finding-tile tile-green">
                    <div className="finding-icon-wrap icon-green"><TrendingDown size={16} /></div>
                    <div className="finding-text">
                      <span className="finding-num font-mono">{baselineDelta.toFixed(1)}</span>
                      <span className="finding-lbl">Delta vs Baseline</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '20px', color: '#888' }}>No report generated yet.</div>
            )}
          </div>

          <div className="reports-panel-card">
            <span className="reports-panel-title">System Impact</span>
            {reportData && riskSummary ? (
              <div className="service-impact-list">
                <div className="impact-list-header font-mono">
                  <span>Risk Level</span>
                  <span>Max Asset Risk</span>
                  <span>Vulnerable Assets</span>
                </div>
                <div className="impact-list-body">
                  <div className="impact-list-row">
                    <span className="service-name-col">{riskSummary.overall_risk_level} ({(riskSummary.overall_risk_score * 100).toFixed(0)}%)</span>
                    <span className="init-col">{riskSummary.highest_risk_asset?.asset_id || 'None'}</span>
                    <span className="min-col" style={{ color: riskSummary.vulnerable_assets?.length > 0 ? '#FF4D4D' : '#00E5A3' }}>
                      {riskSummary.vulnerable_assets?.length || 0}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '20px', color: '#888' }}>No risk data available.</div>
            )}
          </div>
        </div>

        <div className="reports-right-column">
          <div className="reports-panel-card hide-on-print">
            <span className="reports-panel-title">Quick Reports</span>
            <div className="quick-reports-grid">
              <div className="quick-rep-item" onClick={() => { setSelectedReportType('simulation'); handleGenerate(); }} style={{ cursor: 'pointer' }}>
                <div className="quick-rep-icon-wrap icon-blue"><FileText size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Latest Simulation Report</span>
                  <span className="quick-rep-sub">Fetch current &gt;</span>
                </div>
              </div>
              <div className="quick-rep-item" onClick={() => { setSelectedReportType('risk'); handleGenerate(); }} style={{ cursor: 'pointer' }}>
                <div className="quick-rep-icon-wrap icon-cyan"><ShieldCheck size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Risk Assessment Report</span>
                  <span className="quick-rep-sub">View current risks &gt;</span>
                </div>
              </div>
              <div className="quick-rep-item" onClick={() => { setSelectedReportType('perf'); handleGenerate(); }} style={{ cursor: 'pointer' }}>
                <div className="quick-rep-icon-wrap icon-green"><Presentation size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">System Performance Report</span>
                  <span className="quick-rep-sub">Not Supported &gt;</span>
                </div>
              </div>
              <div className="quick-rep-item" onClick={() => { setSelectedReportType('whatif'); handleGenerate(); }} style={{ cursor: 'pointer' }}>
                <div className="quick-rep-icon-wrap icon-purple"><FileSpreadsheet size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">What-If Analysis Report</span>
                  <span className="quick-rep-sub">Compare strategies &gt;</span>
                </div>
              </div>
            </div>
          </div>

          <div className="reports-panel-card preview-sheet-card print-fullscreen">
            <div className="panel-header-with-action hide-on-print">
              <span className="reports-panel-title">Generated Report Preview</span>
              <button type="button" className="download-rep-btn" onClick={handleDownload} disabled={!reportData}>
                <Download size={13} />
                <span>Download ⌵</span>
              </button>
            </div>
            {renderReportPreview()}
          </div>
        </div>
      </section>
    </div>
  )
}
