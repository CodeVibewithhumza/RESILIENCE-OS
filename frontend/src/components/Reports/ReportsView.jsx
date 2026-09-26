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
  TrendingDown,
  ChevronRight
} from 'lucide-react'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './ReportsView.css'

export default function ReportsView({ resilience, incident, assets = [], onNotify }) {
  const [activeReportTab, setActiveReportTab] = useState('incident')
  const [reportType, setReportType] = useState('Incident Report')
  const [incidentChoice, setIncidentChoice] = useState('Primary Transformer Failure')
  const [timeRange, setTimeRange] = useState('Full Event (0 - 2 hours)')
  const [outputFormat, setOutputFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)

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

  const handleGenerate = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      if (onNotify) {
        onNotify('Report generated successfully! Ready for export.', 'success')
      }
    }, 800)
  }

  const handleDownload = () => {
    if (outputFormat === 'pdf') {
      window.print()
    } else {
      if (onNotify) {
        onNotify(`Exported report in ${outputFormat.toUpperCase()} format`, 'info')
      }
    }
  }

  const serviceImpactSummary = [
    { service: 'Emergency', init: 'Normal', min: 'Degraded', time: '~25 min', impact: 'Medium' },
    { service: 'ICU', init: 'Normal', min: 'At Risk', time: '~40 min', impact: 'High' },
    { service: 'OT', init: 'Normal', min: 'At Risk', time: '~38 min', impact: 'High' },
    { service: 'Wards', init: 'Normal', min: 'Degraded', time: '~55 min', impact: 'Medium' },
    { service: 'OPD', init: 'Normal', min: 'Normal', time: 'N/A', impact: 'Low' },
    { service: 'Laboratory', init: 'Normal', min: 'Degraded', time: '~60 min', impact: 'Medium' },
    { service: 'Radiology', init: 'Normal', min: 'Degraded', time: '~50 min', impact: 'Medium' }
  ]

  return (
    <div className="reports-page">
      {/* 1. TOP NAVIGATION TABS & ACTION BAR */}
      <section className="reports-top-tabs-bar">
        <div className="reports-tabs-group">
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'incident' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('incident')}
          >
            <FileText size={14} />
            <span>Incident Report</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'simulation' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('simulation')}
          >
            <Layers size={14} />
            <span>Simulation Report</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'whatif' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('whatif')}
          >
            <FileCheck size={14} />
            <span>What-If Comparison</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'risk' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('risk')}
          >
            <ShieldCheck size={14} />
            <span>Risk Assessment</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'resilience' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('resilience')}
          >
            <FileSpreadsheet size={14} />
            <span>Resilience Analysis</span>
          </button>
          <button
            type="button"
            className={`report-tab-btn ${activeReportTab === 'perf' ? 'is-active' : ''}`}
            onClick={() => setActiveReportTab('perf')}
          >
            <Presentation size={14} />
            <span>System Performance</span>
          </button>
        </div>

        <button
          type="button"
          className="generate-report-cta-btn"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          <FileText size={14} />
          <span>{isGenerating ? 'Generating...' : 'Generate Report'}</span>
        </button>
      </section>

      {/* 2. TWO-COLUMN WORKSPACE */}
      <section className="reports-main-grid">
        {/* Left Column: Configuration, Key Findings, Service Impact, System Impact Chart */}
        <div className="reports-left-column">
          {/* Card 1: Report Configuration */}
          <div className="reports-panel-card">
            <span className="reports-panel-title">Report Configuration</span>

            <div className="report-config-dropdowns-row">
              <div className="config-select-group">
                <label className="config-label">Report Type</label>
                <select
                  className="config-select font-mono"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="Incident Report">Incident Report</option>
                  <option value="Simulation Report">Simulation Report</option>
                </select>
              </div>

              <div className="config-select-group">
                <label className="config-label">Incident</label>
                <select
                  className="config-select font-mono"
                  value={incidentChoice}
                  onChange={(e) => setIncidentChoice(e.target.value)}
                >
                  <option value="Primary Transformer Failure">Primary Transformer Failure</option>
                  <option value="Grid Power Outage">Grid Power Outage</option>
                </select>
              </div>

              <div className="config-select-group">
                <label className="config-label">Time Range</label>
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
              {/* Left: Include Sections */}
              <div className="config-sub-col">
                <span className="config-sub-heading">Include Sections</span>
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
                      checked={includedSections.response_strategies}
                      onChange={() => toggleSection('response_strategies')}
                    />
                    <span>Response Strategies Analysis</span>
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
                      checked={includedSections.resilience_metrics}
                      onChange={() => toggleSection('resilience_metrics')}
                    />
                    <span>Resilience Metrics</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.system_impact}
                      onChange={() => toggleSection('system_impact')}
                    />
                    <span>System Impact Analysis</span>
                  </label>
                  <label className="config-checkbox-lbl">
                    <input
                      type="checkbox"
                      checked={includedSections.recommendations}
                      onChange={() => toggleSection('recommendations')}
                    />
                    <span>Recommendations</span>
                  </label>
                </div>
              </div>

              {/* Right: Output Format */}
              <div className="config-sub-col">
                <span className="config-sub-heading">Output Format</span>
                <div className="format-buttons-group">
                  <button
                    type="button"
                    className={`fmt-btn fmt-pdf ${outputFormat === 'pdf' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('pdf')}
                  >
                    <FileText size={14} />
                    <span>PDF Report</span>
                  </button>
                  <button
                    type="button"
                    className={`fmt-btn fmt-excel ${outputFormat === 'excel' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('excel')}
                  >
                    <FileSpreadsheet size={14} />
                    <span>Excel Data</span>
                  </button>
                  <button
                    type="button"
                    className={`fmt-btn fmt-ppt ${outputFormat === 'ppt' ? 'is-active' : ''}`}
                    onClick={() => setOutputFormat('ppt')}
                  >
                    <Presentation size={14} />
                    <span>Presentation (PPT)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Key Findings (Primary Transformer Failure) */}
          <div className="reports-panel-card">
            <div className="panel-header-with-action">
              <span className="reports-panel-title">Key Findings (Primary Transformer Failure)</span>
              <button type="button" className="view-full-rep-link">View Full Report</button>
            </div>

            <div className="key-findings-tiles-row">
              <div className="finding-tile tile-red">
                <div className="finding-icon-wrap icon-red"><AlertTriangle size={16} /></div>
                <div className="finding-text">
                  <span className="finding-num font-mono">2</span>
                  <span className="finding-lbl">Services at Risk</span>
                </div>
              </div>

              <div className="finding-tile tile-gold">
                <div className="finding-icon-wrap icon-gold"><Box size={16} /></div>
                <div className="finding-text">
                  <span className="finding-num font-mono">12</span>
                  <span className="finding-lbl">Assets Affected</span>
                </div>
              </div>

              <div className="finding-tile tile-blue">
                <div className="finding-icon-wrap icon-blue"><Clock size={16} /></div>
                <div className="finding-text">
                  <span className="finding-num font-mono">~8 min</span>
                  <span className="finding-lbl">Time to First Impact</span>
                </div>
              </div>

              <div className="finding-tile tile-green">
                <div className="finding-icon-wrap icon-green"><TrendingDown size={16} /></div>
                <div className="finding-text">
                  <span className="finding-num font-mono">82 → 54</span>
                  <span className="finding-lbl">Resilience Index Drop</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Two Sub-boxes: Service Impact Summary & System Impact Overview Chart */}
          <div className="reports-subgrid-row">
            {/* Service Impact Summary Table */}
            <div className="reports-panel-card">
              <span className="reports-panel-title">Service Impact Summary</span>
              <table className="service-impact-table font-mono">
                <thead>
                  <tr>
                    <th className="th-left font-sans">Service</th>
                    <th>Initial State</th>
                    <th>Min. State</th>
                    <th>Recovery Time</th>
                    <th>Impact Level</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceImpactSummary.map((row) => (
                    <tr key={row.service}>
                      <td className="td-left font-sans">{row.service}</td>
                      <td><span className="state-badge badge-normal">{row.init}</span></td>
                      <td><span className={`state-badge badge-${row.min.toLowerCase().replace(/\s+/g, '')}`}>{row.min}</span></td>
                      <td>{row.time}</td>
                      <td><span className={`impact-badge badge-${row.impact.toLowerCase()}`}>{row.impact}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* System Impact Overview & Resilience Metrics Over Time Chart */}
            <div className="reports-panel-card">
              <div className="chart-header-legend">
                <span className="reports-panel-title">System Impact Overview</span>
                <div className="chart-legend-row font-mono">
                  <span><span className="dot" style={{ backgroundColor: '#00F0FF' }} /> Electrical</span>
                  <span><span className="dot" style={{ backgroundColor: '#00A3FF' }} /> Water</span>
                  <span><span className="dot" style={{ backgroundColor: '#FFB800' }} /> HVAC</span>
                  <span><span className="dot" style={{ backgroundColor: '#A855F7' }} /> Medical Gas</span>
                </div>
              </div>

              <div className="system-impact-chart-wrap">
                <svg className="sys-impact-svg" viewBox="0 0 260 80" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="260" y2="0" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <line x1="0" y1="25" x2="260" y2="25" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <line x1="0" y1="50" x2="260" y2="50" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                  <line x1="0" y1="75" x2="260" y2="75" stroke="var(--border-subtle)" />

                  <path d="M0,60 C40,40 80,10 120,20 C160,30 200,60 260,70" fill="none" stroke="#00F0FF" strokeWidth="2" />
                  <path d="M0,70 C40,65 80,50 120,55 C160,60 200,68 260,75" fill="none" stroke="#00A3FF" strokeWidth="1.5" />
                  <path d="M0,65 C40,55 80,30 120,35 C160,45 200,65 260,72" fill="none" stroke="#FFB800" strokeWidth="1.5" />
                  <path d="M0,72 C40,70 80,58 120,62 C160,68 200,72 260,75" fill="none" stroke="#A855F7" strokeWidth="1.5" />
                </svg>
                <div className="impact-x-axis font-mono">
                  <span>T+0</span>
                  <span>T+10m</span>
                  <span>T+20m</span>
                  <span>T+30m</span>
                  <span>T+45m</span>
                  <span>T+60m</span>
                  <span>T+90m</span>
                  <span>T+120m</span>
                </div>
              </div>

              {/* Resilience Metrics Over Time */}
              <div className="res-over-time-sub">
                <div className="sub-header-row">
                  <span className="sub-title">Resilience Metrics Over Time</span>
                  <div className="sub-badges font-mono">
                    <span className="min-badge">Minimum: 54</span>
                    <span className="final-badge">Final: 78</span>
                  </div>
                </div>
                <svg className="res-metric-svg" viewBox="0 0 260 40" preserveAspectRatio="none">
                  <path d="M0,10 C40,35 80,38 120,30 C160,20 200,16 260,14" fill="none" stroke="#00E5A3" strokeWidth="2" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Reports & Generated Report Preview Sheet */}
        <div className="reports-right-column">
          {/* Quick Reports 2x2 Grid */}
          <div className="reports-panel-card">
            <span className="reports-panel-title">Quick Reports</span>
            <div className="quick-reports-grid">
              <div className="quick-rep-item">
                <div className="quick-rep-icon-wrap icon-blue"><FileText size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Latest Simulation Report</span>
                  <span className="quick-rep-sub">Most recent run &gt;</span>
                </div>
              </div>

              <div className="quick-rep-item">
                <div className="quick-rep-icon-wrap icon-cyan"><ShieldCheck size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">Risk Assessment Report</span>
                  <span className="quick-rep-sub">Current infrastructure risks &gt;</span>
                </div>
              </div>

              <div className="quick-rep-item">
                <div className="quick-rep-icon-wrap icon-green"><Presentation size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">System Performance Report</span>
                  <span className="quick-rep-sub">Last 24 hours &gt;</span>
                </div>
              </div>

              <div className="quick-rep-item">
                <div className="quick-rep-icon-wrap icon-purple"><FileSpreadsheet size={15} /></div>
                <div className="quick-rep-info">
                  <span className="quick-rep-name">What-If Analysis Report</span>
                  <span className="quick-rep-sub">Compare strategies A-F &gt;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Report Preview (Rendered A4 Document Sheet) */}
          <div className="reports-panel-card preview-sheet-card">
            <div className="panel-header-with-action">
              <span className="reports-panel-title">Generated Report Preview</span>
              <button type="button" className="download-rep-btn" onClick={handleDownload}>
                <Download size={13} />
                <span>Download ⌵</span>
              </button>
            </div>

            {/* A4 Executive Sheet */}
            <div className="a4-document-paper">
              <div className="a4-doc-header">
                <div className="a4-brand-row">
                  <span className="a4-logo-text">Resilience<span style={{ color: '#00A3FF' }}>OS</span></span>
                  <span className="a4-doc-title">Incident Analysis Report</span>
                </div>
                <div className="a4-meta-grid font-mono">
                  <span><strong>Scenario:</strong> Primary Transformer Failure</span>
                  <span><strong>Simulation ID:</strong> SIM-20260920-001</span>
                  <span><strong>Date:</strong> 20 September 2026, 10:24 AM</span>
                  <span><strong>Duration:</strong> 2 Hours | <strong>Severity:</strong> High</span>
                </div>
              </div>

              {/* Thumbnail image */}
              <div className="a4-image-banner">
                <img src={hospitalCampusImg} alt="Report Digital Twin Banner" className="a4-thumb-img" />
              </div>

              {/* Executive Summary paragraph */}
              <div className="a4-section-block">
                <span className="a4-section-heading">Executive Summary</span>
                <p className="a4-para">
                  A primary transformer failure was simulated, resulting in loss of main electrical supply and cascading impact on critical hospital services. The failure caused degradation of ICU, OT, and supporting infrastructure. Backup systems mitigated full service disruption and all systems recovered within 2 hours.
                </p>
              </div>

              {/* 4 Mini KPIs */}
              <div className="a4-mini-kpis-row font-mono">
                <div className="a4-kpi-cell">
                  <span className="a4-kpi-val" style={{ color: '#FF4D4D' }}>2</span>
                  <span className="a4-kpi-lbl">Services at Risk</span>
                </div>
                <div className="a4-kpi-cell">
                  <span className="a4-kpi-val" style={{ color: '#FFB800' }}>12</span>
                  <span className="a4-kpi-lbl">Assets Affected</span>
                </div>
                <div className="a4-kpi-cell">
                  <span className="a4-kpi-val" style={{ color: '#00A3FF' }}>~8 min</span>
                  <span className="a4-kpi-lbl">Time to First Impact</span>
                </div>
                <div className="a4-kpi-cell">
                  <span className="a4-kpi-val" style={{ color: '#00E5A3' }}>82 → 54</span>
                  <span className="a4-kpi-lbl">Resilience Drop</span>
                </div>
              </div>

              {/* Incident Timeline points */}
              <div className="a4-section-block">
                <span className="a4-section-heading">Incident Timeline</span>
                <div className="a4-timeline-items font-mono">
                  <div className="a4-t-row">
                    <span className="a4-t-dot" style={{ backgroundColor: '#FF4D4D' }} />
                    <span className="a4-t-time">T+0 min</span>
                    <span className="a4-t-desc">Primary transformer failure detected</span>
                  </div>
                  <div className="a4-t-row">
                    <span className="a4-t-dot" style={{ backgroundColor: '#FF7A00' }} />
                    <span className="a4-t-time">T+2 min</span>
                    <span className="a4-t-desc">Grid supply lost, UPS activated</span>
                  </div>
                  <div className="a4-t-row">
                    <span className="a4-t-dot" style={{ backgroundColor: '#FFB800' }} />
                    <span className="a4-t-time">T+10 min</span>
                    <span className="a4-t-desc">HVAC capacity reduced, ICU at risk</span>
                  </div>
                  <div className="a4-t-row">
                    <span className="a4-t-dot" style={{ backgroundColor: '#00A3FF' }} />
                    <span className="a4-t-time">T+18 min</span>
                    <span className="a4-t-desc">Intervention applied: Backup Generator</span>
                  </div>
                  <div className="a4-t-row">
                    <span className="a4-t-dot" style={{ backgroundColor: '#00E5A3' }} />
                    <span className="a4-t-time">T+120 min</span>
                    <span className="a4-t-desc">All systems recovered to normal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
