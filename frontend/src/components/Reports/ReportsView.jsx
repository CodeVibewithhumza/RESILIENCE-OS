import { useState } from 'react'
import {
  FileText,
  Download,
  CheckSquare,
  FileCheck,
  TrendingDown,
  Clock,
  ShieldCheck,
  Layers,
  FileSpreadsheet,
  Presentation,
  Check
} from 'lucide-react'
import './ReportsView.css'

export default function ReportsView({ resilience, incident, assets = [] }) {
  const [reportType, setReportType] = useState('incident')
  const [selectedFormat, setSelectedFormat] = useState('pdf')
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const handleDownloadReport = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    }, 1200)
  }

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
          onClick={handleDownloadReport}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <span>Generating Document...</span>
          ) : downloadSuccess ? (
            <>
              <Check size={14} style={{ color: '#10B981' }} />
              <span>Export Ready!</span>
            </>
          ) : (
            <>
              <FileText size={14} />
              <span>Generate New Report</span>
            </>
          )}
        </button>
      </div>

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
              <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>v1.0 Formatter</span>
            </div>

            <div className="report-config-grid">
              <div className="config-field">
                <label className="config-label">Incident Scope</label>
                <select className="config-select font-mono">
                  <option>Primary Transformer Failure (Full Trip)</option>
                  <option>11kV City Grid Blackout</option>
                  <option>Cryogenic Oxygen Pipeline Rupture</option>
                  <option>HVAC Chiller Thermal Trip</option>
                </select>
              </div>

              <div className="config-field">
                <label className="config-label">Time Horizon</label>
                <select className="config-select font-mono">
                  <option>Full Event Horizon (T+0 to T+45 min)</option>
                  <option>Immediate Cascade Phase (T+0 to T+10 min)</option>
                  <option>Stabilization Phase (T+10 to T+45 min)</option>
                </select>
              </div>
            </div>

            <div className="format-selection-row">
              <span className="config-label">Export Format:</span>
              <div className="format-pills-row">
                <button
                  className={`format-pill ${selectedFormat === 'pdf' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('pdf')}
                >
                  <FileText size={13} />
                  <span>PDF Executive Report</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'excel' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('excel')}
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel Telemetry Data</span>
                </button>
                <button
                  className={`format-pill ${selectedFormat === 'ppt' ? 'active' : ''}`}
                  onClick={() => setSelectedFormat('ppt')}
                >
                  <Presentation size={13} />
                  <span>Presentation Slides</span>
                </button>
              </div>
            </div>
          </div>

          {/* Key Findings Card */}
          <div className="report-card">
            <div className="report-card-header">
              <span className="report-card-title">Key Executive Findings</span>
              <span className="badge badge-critical font-mono">Critical Summary</span>
            </div>

            <div className="findings-stat-grid">
              <div className="finding-box">
                <span className="finding-label">Services at Risk</span>
                <span className="finding-val font-mono" style={{ color: '#EF4444' }}>2 Units</span>
                <span className="finding-sub">ICU & Surgical Cleanrooms</span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Assets Affected</span>
                <span className="finding-val font-mono" style={{ color: '#F59E0B' }}>12 Nodes</span>
                <span className="finding-sub">Power & Gas Subsystems</span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Time to First Impact</span>
                <span className="finding-val font-mono">~8 min</span>
                <span className="finding-sub">UPS Inverter Transfer</span>
              </div>
              <div className="finding-box">
                <span className="finding-label">Resilience Delta</span>
                <span className="finding-val font-mono" style={{ color: '#EF4444' }}>82 → 54</span>
                <span className="finding-sub">34% Degradation</span>
              </div>
            </div>

            {/* Impact Table */}
            <div className="report-table-wrap">
              <table className="report-impact-table">
                <thead>
                  <tr>
                    <th>Clinical Unit</th>
                    <th>Initial</th>
                    <th>Min State</th>
                    <th>Est. Recovery</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold">Intensive Care Unit (ICU)</td>
                    <td><span className="badge badge-normal">Normal</span></td>
                    <td><span className="badge badge-critical">At Risk</span></td>
                    <td className="font-mono">~40 min</td>
                    <td><span className="badge badge-critical">High</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Operating Theatres (OT)</td>
                    <td><span className="badge badge-normal">Normal</span></td>
                    <td><span className="badge badge-critical">At Risk</span></td>
                    <td className="font-mono">~38 min</td>
                    <td><span className="badge badge-critical">High</span></td>
                  </tr>
                  <tr>
                    <td className="font-bold">Emergency Trauma (ED)</td>
                    <td><span className="badge badge-normal">Normal</span></td>
                    <td><span className="badge badge-outline">Degraded</span></td>
                    <td className="font-mono">~25 min</td>
                    <td><span className="badge badge-outline">Medium</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Live Generated Document Preview Card */}
        <div className="reports-right-col">
          <div className="report-card document-preview-card">
            <div className="preview-top-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
                <span className="preview-title font-mono">INCIDENT_ANALYSIS_REPORT.pdf</span>
              </div>
              <button className="preview-download-btn" onClick={handleDownloadReport}>
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>

            {/* Paper Sheet Document Preview */}
            <div className="document-sheet">
              <div className="doc-header-block">
                <div className="doc-brand">RESILIENCE<span style={{ color: '#00F0FF' }}>OS</span></div>
                <div className="doc-meta-right font-mono">
                  <div>SIM ID: SIM-20260925-001</div>
                  <div>DATE: 25 Sep 2026, 16:25 IST</div>
                  <div>CLASSIFICATION: RESTRICTED</div>
                </div>
              </div>

              <h2 className="doc-report-title">HOSPITAL INFRASTRUCTURE DISRUPTION & RESILIENCE REPORT</h2>
              <div className="doc-badge-row">
                <span className="doc-tag">PRIMARY TRANSFORMER FAILURE</span>
                <span className="doc-tag">CASCADE HORIZON: 2.0 HOURS</span>
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">1. Executive Summary</h4>
                <p className="doc-p">
                  A catastrophic primary substation transformer failure was modeled, resulting in immediate loss of main 415V distribution power. Secondary life-support systems transferred to emergency generator GEN_01 and UPS battery backup. Downstream cascade mitigation strategies were evaluated using multi-criteria decision analysis (MCDA).
                </p>
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">2. Critical Clinical Impact</h4>
                <div className="doc-metric-row font-mono">
                  <div className="doc-metric-pill">Services At Risk: 2</div>
                  <div className="doc-metric-pill">Affected Assets: 12</div>
                  <div className="doc-metric-pill">Resilience Drop: 82 → 54</div>
                </div>
              </div>

              <div className="doc-section">
                <h4 className="doc-section-title">3. AI Recommended Mitigation Strategy</h4>
                <div className="doc-recommendation-box">
                  <strong>RECOMMENDED: Strategy A — Emergency Standby Generator Auto-Transfer</strong>
                  <p className="doc-p" style={{ margin: '4px 0 0 0' }}>
                    Auto-spooling Standby Generator 1 (750kVA) achieves 100% life-support continuity for ICU mechanical ventilators and surgical luminaire lights within 120 seconds, avoiding patient hypoxia risk.
                  </p>
                </div>
              </div>

              <div className="doc-footer-stamp font-mono">
                Generated autonomously by ResilienceOS v1.0 AI Decision Support Engine
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
