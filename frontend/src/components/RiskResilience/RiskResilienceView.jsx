import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Layers,
  Zap,
  Droplets,
  Wind,
  Flame,
  CheckCircle2
} from 'lucide-react'
import './RiskResilienceView.css'

export default function RiskResilienceView({ resilience, assets = [], services = [] }) {
  const [activeTab, setActiveTab] = useState('infrastructure')
  const [selectedAssetFilter, setSelectedAssetFilter] = useState('all')

  const resilienceScore = resilience?.overall_score || 82
  const isHealthy = resilienceScore >= 75

  // Top Risk Assets Ranked
  const topRiskAssets = [
    { rank: 1, name: 'Main Substation Transformer T1', system: 'Electrical', riskLevel: 'High', riskScore: 92, status: 'normal' },
    { rank: 2, name: 'HVAC Chiller Plant & AHU-1', system: 'HVAC', riskLevel: 'High', riskScore: 88, status: 'degraded' },
    { rank: 3, name: 'Cryogenic O2 Manifold Compressor', system: 'Medical Gas', riskLevel: 'High', riskScore: 86, status: 'normal' },
    { rank: 4, name: 'Standby Generator DG-1 (750kVA)', system: 'Electrical', riskLevel: 'Medium', riskScore: 68, status: 'normal' },
    { rank: 5, name: 'Potable Water Hydro Booster Pumps', system: 'Water', riskLevel: 'Medium', riskScore: 62, status: 'normal' }
  ]

  // Resilience 5 Core Factors
  const components = [
    { name: 'Capacity (C)', score: 78, color: '#38BDF8', desc: 'Rated vs. active load buffer' },
    { name: 'Adaptability (A)', score: 85, color: '#00F0FF', desc: 'Dynamic feeder rerouting capability' },
    { name: 'Backup Margin (B)', score: 80, color: '#10B981', desc: 'N+1 generator & UPS reserve' },
    { name: 'Technical Health (T)', score: 70, color: '#F59E0B', desc: 'Equipment age & thermal state' },
    { name: 'Utilization (U)', score: 75, color: '#818CF8', desc: 'Subsystem duty-cycle factor' }
  ]

  return (
    <div className="risk-resilience-page">
      {/* Header Bar */}
      <div className="risk-header-row">
        <div>
          <h1 className="risk-page-title">Risk & Resilience Analytics</h1>
          <p className="risk-page-subtitle">
            Assess systemic vulnerabilities, single-points-of-failure (SPOF), and multi-criteria resilience metrics
          </p>
        </div>
        <div className="risk-header-badge font-mono">
          <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>REAL-TIME RISK ENGINE ACTIVE</span>
        </div>
      </div>

      {/* 1. Top 6 KPI Metric Pills */}
      <div className="risk-kpi-grid">
        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00F0FF' }}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <span className="kpi-label">Resilience Index</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono" style={{ color: isHealthy ? '#10B981' : '#EF4444' }}>
                {resilienceScore.toFixed(0)} / 100
              </span>
              <span className="kpi-delta positive font-mono">↑ 6%</span>
            </div>
          </div>
        </div>

        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <span className="kpi-label">High Risk Assets</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono" style={{ color: '#EF4444' }}>3</span>
              <span className="kpi-delta negative font-mono">↑ 1</span>
            </div>
          </div>
        </div>

        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B' }}>
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="kpi-label">Medium Risk Assets</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono" style={{ color: '#F59E0B' }}>5</span>
              <span className="kpi-delta positive font-mono">↓ 2</span>
            </div>
          </div>
        </div>

        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}>
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="kpi-label">Low Risk / Nominal</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono" style={{ color: '#10B981' }}>44</span>
              <span className="kpi-delta positive font-mono">↑ 4</span>
            </div>
          </div>
        </div>

        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#8B5CF6' }}>
            <Layers size={18} />
          </div>
          <div>
            <span className="kpi-label">Critical Services Risk</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono" style={{ color: '#8B5CF6' }}>2 / 8</span>
              <span className="kpi-delta font-mono">25%</span>
            </div>
          </div>
        </div>

        <div className="risk-kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8' }}>
            <Clock size={18} />
          </div>
          <div>
            <span className="kpi-label">Avg. Time to Recovery</span>
            <div className="kpi-val-row">
              <span className="kpi-val font-mono">3.2 hrs</span>
              <span className="kpi-delta positive font-mono">↓ 28%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Middle Row: 5 Resilience Factor Dials & Risk Distribution */}
      <div className="risk-middle-grid">
        {/* 5 Resilience Pillars */}
        <div className="risk-card components-card">
          <div className="risk-card-header">
            <span className="risk-card-title">Resilience Pillars & Sub-Score Synthesis</span>
            <span className="badge badge-normal font-mono">MCDA Weighted</span>
          </div>
          <div className="factors-circle-row">
            {components.map((comp, idx) => (
              <div key={idx} className="factor-dial-item">
                <div className="factor-circular-wrap">
                  <svg viewBox="0 0 36 36" className="factor-svg">
                    <path
                      className="factor-bg"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="factor-fill"
                      strokeDasharray={`${comp.score}, 100`}
                      style={{ stroke: comp.color }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="factor-number font-mono">{comp.score}</span>
                </div>
                <span className="factor-name">{comp.name}</span>
                <span className="factor-desc">{comp.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="risk-card donut-card">
          <div className="risk-card-header">
            <span className="risk-card-title">Risk Distribution</span>
            <span className="font-mono" style={{ color: 'var(--text-muted)' }}>52 Total Assets</span>
          </div>
          <div className="donut-body-row">
            <div className="donut-visual-box">
              <div className="donut-center-stat">
                <span className="font-mono donut-huge-num">52</span>
                <span className="donut-label">Assets</span>
              </div>
            </div>
            <div className="donut-legend-col">
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#EF4444' }} />
                <span>High Risk (3 assets)</span>
                <span className="font-mono percentage">6%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#F59E0B' }} />
                <span>Medium Risk (5 assets)</span>
                <span className="font-mono percentage">10%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#10B981' }} />
                <span>Low Risk (12 assets)</span>
                <span className="font-mono percentage">23%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#38BDF8' }} />
                <span>Nominal (32 assets)</span>
                <span className="font-mono percentage">61%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Top Risk Assets Table & Service Risk Overview */}
      <div className="risk-bottom-grid">
        {/* Top Risk Table */}
        <div className="risk-card">
          <div className="risk-card-header">
            <span className="risk-card-title">Top Ranked Risk Vulnerabilities (SPOF)</span>
            <span className="badge badge-critical font-mono">Priority Action</span>
          </div>
          <div className="risk-table-wrap">
            <table className="risk-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Infrastructure Asset</th>
                  <th>Subsystem</th>
                  <th>Risk Tier</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {topRiskAssets.map((asset) => (
                  <tr key={asset.rank}>
                    <td className="font-mono font-bold">{asset.rank}</td>
                    <td>{asset.name}</td>
                    <td>
                      <span className="badge badge-outline">{asset.system}</span>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: asset.riskLevel === 'High' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                          color: asset.riskLevel === 'High' ? '#EF4444' : '#F59E0B',
                          border: `1px solid ${asset.riskLevel === 'High' ? '#EF4444' : '#F59E0B'}`
                        }}
                      >
                        {asset.riskLevel}
                      </span>
                    </td>
                    <td className="font-mono font-bold" style={{ color: asset.riskScore > 80 ? '#EF4444' : '#F59E0B' }}>
                      {asset.riskScore} / 100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Risk Overview */}
        <div className="risk-card">
          <div className="risk-card-header">
            <span className="risk-card-title">Clinical Healthcare Continuity Risk</span>
            <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>8 Units</span>
          </div>
          <div className="service-risk-list">
            {[
              { name: 'Intensive Care Unit (ICU)', status: 'At Risk', risk: 'High', score: 62 },
              { name: 'Operating Theatres (OT 1 & 2)', status: 'At Risk', risk: 'High', score: 58 },
              { name: 'Emergency Trauma Department', status: 'Normal', risk: 'Medium', score: 74 },
              { name: 'Inpatient Wards (101–104)', status: 'Normal', risk: 'Low', score: 82 },
              { name: 'Outpatient Clinic (OPD)', status: 'Normal', risk: 'Low', score: 85 }
            ].map((srv, i) => (
              <div key={i} className="service-risk-row">
                <div className="service-risk-name-col">
                  <span className="service-name-text">{srv.name}</span>
                  <span className="service-status-pill">{srv.status}</span>
                </div>
                <div className="service-score-bar-wrap">
                  <div className="service-score-bar-fill" style={{ width: `${srv.score}%`, background: srv.score < 70 ? '#EF4444' : '#10B981' }} />
                </div>
                <span className="font-mono font-bold" style={{ color: srv.score < 70 ? '#EF4444' : '#10B981' }}>
                  {srv.score}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
