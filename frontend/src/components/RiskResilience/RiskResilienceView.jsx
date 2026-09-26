import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { getRiskSummary, getResilienceBreakdown } from '../../services/riskResilienceApi'
import './RiskResilienceView.css'

/**
 * Format asset system/type name for UI display.
 * Maps backend AssetType enum values to human-readable subsystem labels.
 */
function formatAssetType(type) {
  if (!type) return 'General'
  const map = {
    grid: 'Electrical Grid',
    transformer: 'Transformer',
    generator: 'Standby Generator',
    ups: 'Static UPS',
    battery: 'Battery Storage',
    main_bus: 'Main Bus',
    emergency_bus: 'Emergency Bus',
    chiller_hvac: 'HVAC Chiller',
    water_pump: 'Water Booster',
    oxygen_system: 'Medical Gas'
  }
  return map[type] || type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Returns style object for risk level badge based on backend RiskLevel.
 */
function getRiskBadgeStyle(level) {
  const normLevel = (level || '').toLowerCase()
  if (normLevel === 'critical') {
    return {
      background: 'rgba(239, 68, 68, 0.25)',
      color: '#EF4444',
      border: '1px solid #EF4444'
    }
  }
  if (normLevel === 'high') {
    return {
      background: 'rgba(239, 68, 68, 0.2)',
      color: '#EF4444',
      border: '1px solid #EF4444'
    }
  }
  if (normLevel === 'medium') {
    return {
      background: 'rgba(245, 158, 11, 0.2)',
      color: '#F59E0B',
      border: '1px solid #F59E0B'
    }
  }
  return {
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#10B981',
    border: '1px solid #10B981'
  }
}

export default function RiskResilienceView({ resilience, assets = [], services = [] }) {
  const [riskSummary, setRiskSummary] = useState(null)
  const [resilienceBreakdown, setResilienceBreakdown] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async (isInitial = false) => {
    if (isInitial) {
      setLoading(true)
    } else {
      setIsRefreshing(true)
    }
    setError(null)

    try {
      const [riskRes, resilienceRes] = await Promise.all([
        getRiskSummary(),
        getResilienceBreakdown()
      ])

      if (!riskRes.success && !resilienceRes.success) {
        setError(riskRes.error || resilienceRes.error || 'Failed to communicate with risk engine backend')
        return
      }

      if (riskRes.success && riskRes.data) {
        setRiskSummary(riskRes.data)
      } else if (!riskRes.success) {
        setError(riskRes.error)
      }

      if (resilienceRes.success && resilienceRes.data) {
        setResilienceBreakdown(resilienceRes.data)
      } else if (!resilienceRes.success && !riskRes.error) {
        setError(resilienceRes.error)
      }
    } catch (err) {
      setError(err?.message || 'Unexpected network error')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData(true)
  }, [fetchData, resilience?.overall_score])

  // Initial loading state (before any data is cached)
  if (loading && !riskSummary && !resilienceBreakdown) {
    return (
      <div className="risk-resilience-page">
        <div className="risk-header-row">
          <div>
            <h1 className="risk-page-title">Risk & Resilience Analytics</h1>
            <p className="risk-page-subtitle">
              Assess systemic vulnerabilities, single-points-of-failure (SPOF), and multi-criteria resilience metrics
            </p>
          </div>
          <div className="risk-header-badge font-mono">
            <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>CONNECTING TO RISK ENGINE...</span>
          </div>
        </div>
        <div
          className="risk-card"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '64px 20px',
            gap: '14px'
          }}
        >
          <Activity size={24} style={{ color: 'var(--accent-cyan)' }} />
          <span className="font-mono" style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Synchronizing risk & resilience telemetry from backend...
          </span>
        </div>
      </div>
    )
  }

  // Graceful inline error state if API is unavailable and no data could be loaded
  if (error && !riskSummary && !resilienceBreakdown) {
    return (
      <div className="risk-resilience-page">
        <div className="risk-header-row">
          <div>
            <h1 className="risk-page-title">Risk & Resilience Analytics</h1>
            <p className="risk-page-subtitle">
              Assess systemic vulnerabilities, single-points-of-failure (SPOF), and multi-criteria resilience metrics
            </p>
          </div>
          <div
            className="risk-header-badge font-mono"
            style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#EF4444' }}
          >
            <AlertTriangle size={13} style={{ color: '#EF4444' }} />
            <span>TELEMETRY DISCONNECTED</span>
          </div>
        </div>
        <div
          className="risk-card"
          style={{
            border: '1px solid rgba(239, 68, 68, 0.35)',
            background: 'rgba(239, 68, 68, 0.05)',
            padding: '36px 24px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <AlertTriangle size={36} style={{ color: '#EF4444' }} />
          <div style={{ color: '#F8FAFC', fontWeight: 800, fontSize: '16px' }}>
            Risk Engine Telemetry Unavailable
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px', maxWidth: '520px', margin: 0 }}>
            Unable to connect to backend risk assessment endpoints (/api/risk/summary, /api/resilience/breakdown).
            {error && (
              <span style={{ display: 'block', marginTop: '6px', color: '#EF4444', fontFamily: 'var(--font-mono)' }}>
                {error}
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={() => fetchData(true)}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '8px',
              padding: '8px 18px',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} />
            <span>Retry Telemetry Connection</span>
          </button>
        </div>
      </div>
    )
  }

  // --- Backend Data Derivations ---

  // 1. Resilience Score & Delta
  const score = typeof resilienceBreakdown?.overall_score === 'number'
    ? resilienceBreakdown.overall_score
    : typeof resilience?.overall_score === 'number'
    ? resilience.overall_score
    : 0
  const isHealthy = score >= 75
  const scoreColor = resilienceBreakdown?.status_color || (isHealthy ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444')
  const delta = resilienceBreakdown?.delta_from_baseline ?? resilience?.delta_from_baseline ?? 0
  const isDeltaPositive = delta >= 0

  // 2. Asset Risks & Distribution
  const assetRiskList = riskSummary?.asset_risks
    ? Object.values(riskSummary.asset_risks)
    : []
  const totalAssets = assetRiskList.length || assets.length || 0

  const highRiskCount = assetRiskList.filter(
    (a) => a.risk_level === 'critical' || a.risk_level === 'high'
  ).length

  const medRiskCount = assetRiskList.filter(
    (a) => a.risk_level === 'medium'
  ).length

  const lowRiskCount = assetRiskList.filter(
    (a) => a.risk_level === 'low' && (a.risk_percentage > 0 || (a.operational_status && a.operational_status !== 'normal'))
  ).length

  const nominalCount = Math.max(0, totalAssets - highRiskCount - medRiskCount - lowRiskCount)

  const highPct = totalAssets > 0 ? Math.round((highRiskCount / totalAssets) * 100) : 0
  const medPct = totalAssets > 0 ? Math.round((medRiskCount / totalAssets) * 100) : 0
  const lowPct = totalAssets > 0 ? Math.round((lowRiskCount / totalAssets) * 100) : 0
  const nomPct = totalAssets > 0 ? Math.max(0, 100 - highPct - medPct - lowPct) : 0

  const p1 = highPct
  const p2 = p1 + medPct
  const p3 = p2 + lowPct
  const donutGradient = totalAssets > 0
    ? `conic-gradient(#ef4444 0% ${p1}%, #f59e0b ${p1}% ${p2}%, #10b981 ${p2}% ${p3}%, #38bdf8 ${p3}% 100%)`
    : 'conic-gradient(#38bdf8 0% 100%)'

  // 3. Service Risks & Critical Services
  const serviceRiskList = riskSummary?.service_risks
    ? Object.values(riskSummary.service_risks)
    : []
  const totalServices = serviceRiskList.length || services.length || 0

  const criticalServicesList = serviceRiskList.filter((s) => s.criticality >= 4)
  const totalCriticalServices = criticalServicesList.length > 0 ? criticalServicesList.length : totalServices

  const criticalAtRiskCount = Array.isArray(riskSummary?.critical_services_at_risk) && riskSummary.critical_services_at_risk.length > 0
    ? riskSummary.critical_services_at_risk.length
    : serviceRiskList.filter((s) => s.criticality >= 4 && (s.risk_score >= 0.25 || s.risk_level !== 'low')).length

  const criticalServicesPct = totalCriticalServices > 0
    ? Math.round((criticalAtRiskCount / totalCriticalServices) * 100)
    : 0

  // 4. Recovery Time & Readiness
  const tPenalty = resilienceBreakdown?.sub_scores?.canonical?.t_recovery_penalty ?? 0
  const recoveryTimeMin = tPenalty * 120
  const recoveryDisplay = recoveryTimeMin > 0
    ? (recoveryTimeMin >= 60 ? `${(recoveryTimeMin / 60).toFixed(1)} hrs` : `${Math.round(recoveryTimeMin)} min`)
    : '0 min'
  const recoveryReadinessScore = resilienceBreakdown?.sub_scores?.recovery_readiness ?? 100

  // 5. Canonical Resilience Pillars (sub_scores from /api/resilience/breakdown)
  // Strictly adhering to backend canonical terminology:
  // 1. Critical Service Continuity
  // 2. Infrastructure Availability / Stability Factor
  // 3. Backup Margin
  // 4. Recovery Readiness
  // 5. Resource Conservation
  const subScores = resilienceBreakdown?.sub_scores || {}

  const components = [
    {
      name: 'Critical Service Continuity',
      score: Math.round(subScores.service_continuity ?? 100),
      color: '#00F0FF',
      desc: 'Critical service delivery index Sc'
    },
    {
      name: 'Infrastructure Availability / Stability Factor',
      score: Math.round(subScores.stability_factor ?? 100),
      color: '#38BDF8',
      desc: 'Grid & asset availability factor Ap'
    },
    {
      name: 'Backup Margin',
      score: Math.round(subScores.backup_margin ?? 100),
      color: '#10B981',
      desc: 'Available backup energy & fuel reserve Rb'
    },
    {
      name: 'Recovery Readiness',
      score: Math.round(subScores.recovery_readiness ?? 100),
      color: '#F59E0B',
      desc: 'Recovery readiness factor Lr'
    },
    {
      name: 'Resource Conservation',
      score: Math.round(subScores.resource_conservation ?? 100),
      color: '#818CF8',
      desc: 'Resource conservation & load balance factor'
    }
  ]

  // 6. Top 5 Ranked Risk Vulnerabilities (SPOF) sorted by risk_percentage descending
  const topRiskAssets = [...assetRiskList]
    .sort((a, b) => (b.risk_percentage ?? 0) - (a.risk_percentage ?? 0))
    .slice(0, 5)

  // 7. Clinical Healthcare Continuity Risk sorted by risk_percentage descending
  const sortedServices = [...serviceRiskList].sort(
    (a, b) => (b.risk_percentage ?? 0) - (a.risk_percentage ?? 0)
  )

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
        <button
          type="button"
          onClick={() => fetchData(false)}
          className="risk-header-badge font-mono"
          title="Click to refresh telemetry from backend"
          style={{ cursor: 'pointer', background: 'rgba(15, 23, 42, 0.9)' }}
        >
          <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>{isRefreshing ? 'REFRESHING TELEMETRY...' : 'REAL-TIME RISK ENGINE ACTIVE'}</span>
        </button>
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
              <span className="kpi-val font-mono" style={{ color: scoreColor }}>
                {score.toFixed(0)} / 100
              </span>
              <span className={`kpi-delta ${isDeltaPositive ? 'positive' : 'negative'} font-mono`}>
                {isDeltaPositive ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}%
              </span>
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
              <span className="kpi-val font-mono" style={{ color: '#EF4444' }}>
                {highRiskCount}
              </span>
              <span className={`kpi-delta ${highRiskCount > 0 ? 'negative' : 'positive'} font-mono`}>
                {highPct}%
              </span>
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
              <span className="kpi-val font-mono" style={{ color: '#F59E0B' }}>
                {medRiskCount}
              </span>
              <span className="kpi-delta positive font-mono">
                {medPct}%
              </span>
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
              <span className="kpi-val font-mono" style={{ color: '#10B981' }}>
                {lowRiskCount + nominalCount}
              </span>
              <span className="kpi-delta positive font-mono">
                {lowPct + nomPct}%
              </span>
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
              <span
                className="kpi-val font-mono"
                style={{ color: criticalAtRiskCount > 0 ? '#EF4444' : '#8B5CF6' }}
              >
                {criticalAtRiskCount} / {totalCriticalServices}
              </span>
              <span className={`kpi-delta ${criticalAtRiskCount > 0 ? 'negative' : 'positive'} font-mono`}>
                {criticalServicesPct}%
              </span>
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
              <span className="kpi-val font-mono">
                {recoveryDisplay}
              </span>
              <span className={`kpi-delta ${recoveryReadinessScore >= 80 ? 'positive' : 'negative'} font-mono`}>
                {Math.round(recoveryReadinessScore)}% ready
              </span>
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
            <span className="badge badge-normal font-mono">Canonical Sub-Scores</span>
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
            <span className="font-mono" style={{ color: 'var(--text-muted)' }}>
              {totalAssets} Total Assets
            </span>
          </div>
          <div className="donut-body-row">
            <div className="donut-visual-box" style={{ background: donutGradient }}>
              <div className="donut-center-stat">
                <span className="font-mono donut-huge-num">{totalAssets}</span>
                <span className="donut-label">Assets</span>
              </div>
            </div>
            <div className="donut-legend-col">
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#EF4444' }} />
                <span>High Risk ({highRiskCount} {highRiskCount === 1 ? 'asset' : 'assets'})</span>
                <span className="font-mono percentage">{highPct}%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#F59E0B' }} />
                <span>Medium Risk ({medRiskCount} {medRiskCount === 1 ? 'asset' : 'assets'})</span>
                <span className="font-mono percentage">{medPct}%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#10B981' }} />
                <span>Low Risk ({lowRiskCount} {lowRiskCount === 1 ? 'asset' : 'assets'})</span>
                <span className="font-mono percentage">{lowPct}%</span>
              </div>
              <div className="legend-row">
                <span className="legend-bullet" style={{ background: '#38BDF8' }} />
                <span>Nominal ({nominalCount} {nominalCount === 1 ? 'asset' : 'assets'})</span>
                <span className="font-mono percentage">{nomPct}%</span>
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
                {topRiskAssets.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No asset risk vulnerabilities detected. All assets nominal.
                    </td>
                  </tr>
                ) : (
                  topRiskAssets.map((asset, idx) => {
                    const tierLabel = (asset.risk_level || 'low').toUpperCase()
                    const riskPct = asset.risk_percentage ?? 0
                    const tierStyle = getRiskBadgeStyle(asset.risk_level)
                    const assetScoreColor = riskPct >= 50 ? '#EF4444' : riskPct >= 25 ? '#F59E0B' : '#10B981'

                    return (
                      <tr key={asset.asset_id || idx}>
                        <td className="font-mono font-bold">{idx + 1}</td>
                        <td>{asset.asset_name || asset.asset_id}</td>
                        <td>
                          <span className="badge badge-outline">
                            {formatAssetType(asset.asset_type)}
                          </span>
                        </td>
                        <td>
                          <span className="badge" style={tierStyle}>
                            {tierLabel}
                          </span>
                        </td>
                        <td className="font-mono font-bold" style={{ color: assetScoreColor }}>
                          {Math.round(riskPct)} / 100
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Service Risk Overview */}
        <div className="risk-card">
          <div className="risk-card-header">
            <span className="risk-card-title">Clinical Healthcare Continuity Risk</span>
            <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>
              {sortedServices.length} Units
            </span>
          </div>
          <div className="service-risk-list">
            {sortedServices.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No clinical service risk records available.
              </div>
            ) : (
              sortedServices.map((srv, i) => {
                const continuity = Math.round(srv.service_continuity_pct ?? 100)
                const continuityColor = continuity < 70 ? '#EF4444' : continuity < 90 ? '#F59E0B' : '#10B981'
                const riskTier = (srv.risk_level || 'low').toUpperCase()
                const statusName = srv.service_status ? srv.service_status.replace(/_/g, ' ').toUpperCase() : 'NOMINAL'

                return (
                  <div key={srv.service_id || i} className="service-risk-row">
                    <div className="service-risk-name-col">
                      <span className="service-name-text">{srv.service_name}</span>
                      <span
                        className="service-status-pill font-mono"
                        style={{
                          color:
                            srv.risk_level === 'critical' || srv.risk_level === 'high'
                              ? '#EF4444'
                              : srv.risk_level === 'medium'
                              ? '#F59E0B'
                              : 'var(--text-muted)'
                        }}
                      >
                        {riskTier} RISK • {statusName}
                      </span>
                    </div>
                    <div className="service-score-bar-wrap">
                      <div
                        className="service-score-bar-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, continuity))}%`,
                          background: continuityColor
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold" style={{ color: continuityColor }}>
                      {continuity}%
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
