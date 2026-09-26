import { useMemo } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  HeartPulse,
  Activity
} from 'lucide-react'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './Home.css'

export default function Home({
  resilience,
  assets = [],
  services = [],
  incident,
  connectionStatus = 'disconnected',
  lastUpdated = null,
  telemetry = null,
  latestTwinEvent = null,
  onNavigate,
  onSelectAsset
}) {
  const statusColor = resilience?.status_color || '#10B981'
  const statusLabel = resilience?.status_label || 'OPTIMAL'
  const overallScore = typeof resilience?.overall_score === 'number'
    ? resilience.overall_score
    : 94.5

  const totalAssets = assets.length || 52
  const totalServices = services.length || 8
  const operationalServices = services.filter((s) => s.status === 'full_operation' || !s.at_risk).length || 8
  const atRiskServices = services.filter((s) => s.at_risk).length

  const activeAlertsCount =
    (incident?.is_active ? incident.affected_asset_ids?.length || 1 : 0) + atRiskServices

  // Map assets for quick lookup
  const assetMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => {
      map[a.id] = a
    })
    return map
  }, [assets])

  // 1. Top 5 Subsystem Cards
  const powerAssets = assets.filter((a) =>
    ['grid', 'transformer', 'main_bus', 'emergency_bus', 'generator', 'ups'].includes(a.type)
  )
  const powerFailed = powerAssets.some((a) => a.status === 'failed' || a.status === 'critical')
  const powerDegraded = powerAssets.some((a) => a.status === 'degraded' || a.status === 'starting')
  const powerPct = powerFailed ? 42 : powerDegraded ? 68 : 91

  const waterAsset = assetMap['WATER_PUMP_STATION']
  const waterFailed = waterAsset?.status === 'failed' || waterAsset?.status === 'critical'
  const waterPct = waterFailed ? 35 : 86

  const hvacAsset = assetMap['CHILLER_PLANT']
  const hvacAtRisk = hvacAsset?.status === 'degraded' || hvacAsset?.status === 'failed'
  const hvacPct = hvacAtRisk ? 78 : 92

  const gasAsset = assetMap['OXYGEN_MANIFOLD']
  const gasDegraded = gasAsset?.status === 'degraded' || gasAsset?.status === 'failed'
  const gasPct = gasDegraded ? 60 : 94

  const topCards = [
    {
      id: 'power',
      name: 'Power',
      icon: Zap,
      pct: `${powerPct}%`,
      status: powerFailed ? 'CRITICAL' : powerDegraded ? 'DEGRADED' : 'OPERATIONAL',
      statusClass: powerFailed ? 'badge-critical' : powerDegraded ? 'badge-warning' : 'badge-normal',
      sparkPoints: '0,20 15,18 30,22 45,15 60,19 75,12 90,14 105,8 120,10',
      sparkColor: powerFailed ? '#ef4444' : powerDegraded ? '#f59e0b' : '#10b981'
    },
    {
      id: 'water',
      name: 'Water',
      icon: Droplets,
      pct: `${waterPct}%`,
      status: waterFailed ? 'CRITICAL' : 'OPERATIONAL',
      statusClass: waterFailed ? 'badge-critical' : 'badge-normal',
      sparkPoints: '0,18 15,16 30,19 45,14 60,15 75,16 90,12 105,14 120,11',
      sparkColor: waterFailed ? '#ef4444' : '#10b981'
    },
    {
      id: 'hvac',
      name: 'HVAC',
      icon: Wind,
      pct: `${hvacPct}%`,
      status: hvacAtRisk ? 'AT RISK' : 'OPERATIONAL',
      statusClass: hvacAtRisk ? 'badge-warning' : 'badge-normal',
      sparkPoints: '0,12 15,14 30,15 45,18 60,20 75,22 90,21 105,24 120,25',
      sparkColor: hvacAtRisk ? '#f59e0b' : '#10b981'
    },
    {
      id: 'gas',
      name: 'Medical Gas',
      icon: Flame,
      pct: `${gasPct}%`,
      status: gasDegraded ? 'DEGRADED' : 'OPERATIONAL',
      statusClass: gasDegraded ? 'badge-warning' : 'badge-normal',
      sparkPoints: '0,14 15,12 30,13 45,11 60,12 75,10 90,11 105,9 120,8',
      sparkColor: gasDegraded ? '#f59e0b' : '#10b981'
    },
    {
      id: 'services',
      name: 'Critical Services',
      icon: HeartPulse,
      pct: `${operationalServices}/${totalServices}`,
      status: atRiskServices > 0 ? `${atRiskServices} AT RISK` : 'OPERATIONAL',
      statusClass: atRiskServices > 0 ? 'badge-critical' : 'badge-normal',
      sparkPoints: '0,10 15,10 30,10 45,10 60,12 75,10 90,14 105,10 120,10',
      sparkColor: atRiskServices > 0 ? '#ef4444' : '#10b981'
    }
  ]

  // 8 Interactive HUD pins on campus twin
  const overlayPins = [
    { id: 'SERVICE_ER', label: 'Emergency Care', sub: 'L1 Trauma Unit', top: '48%', left: '18%', type: 'service' },
    { id: 'SERVICE_ICU', label: 'ICU Center', sub: 'L3 Intensive Care', top: '34%', left: '32%', type: 'service' },
    { id: 'SERVICE_OT', label: 'Surgery Block', sub: 'L4 Operating Suites', top: '28%', left: '50%', type: 'service' },
    { id: 'CHILLER_PLANT', label: 'Chiller Plant', sub: 'HVAC Cooling Tower', top: '22%', left: '68%', type: 'asset' },
    { id: 'GRID_MAIN', label: 'Substation', sub: '11kV Main Feeder', top: '64%', left: '26%', type: 'asset' },
    { id: 'WATER_PUMP_STATION', label: 'Water Treatment', sub: 'Booster Pump Station', top: '74%', left: '55%', type: 'asset' },
    { id: 'OXYGEN_MANIFOLD', label: 'Oxygen Tank', sub: 'Cryogenic Liquid O2', top: '46%', left: '80%', type: 'asset' },
    { id: 'GEN_01', label: 'Backup Generator', sub: '1.5 MVA Diesel Gen 1', top: '58%', left: '72%', type: 'asset' }
  ]

  // Recent operational events list
  const recentEvents = useMemo(() => {
    const list = []
    if (latestTwinEvent) {
      if (latestTwinEvent.type === 'failure_injected') {
        list.push({
          id: 'live-evt-failure',
          text: `Fault on ${latestTwinEvent.target_node_id || 'node'} (${latestTwinEvent.payload?.failure_type || 'failure'})`,
          time: 'Just now',
          type: 'critical'
        })
      } else if (latestTwinEvent.type === 'hospital_reset') {
        list.push({
          id: 'live-evt-reset',
          text: 'Twin state restored to 100% operational baseline',
          time: 'Just now',
          type: 'normal'
        })
      }
    }

    if (incident?.is_active) {
      const source = incident.source_asset_id || 'Subsystem'
      list.push(
        { id: 'e1', text: `Primary cascade failure: ${source}`, time: 'Active', type: 'critical' },
        { id: 'e2', text: `${incident.affected_asset_ids?.length || 1} downstream node(s) compromised`, time: 'T+0m', type: 'warning' },
        { id: 'e3', text: 'Automatic mitigation strategy optimization active', time: 'Active', type: 'normal' }
      )
    } else {
      list.push(
        { id: 'e1', text: 'All infrastructure subsystems operating normally', time: '2m ago', type: 'normal' },
        { id: 'e2', text: 'Realtime telemetry sync stream established', time: '1s interval', type: 'normal' },
        { id: 'e3', text: 'Subsystem resilience audit completed', time: '14m ago', type: 'normal' }
      )
    }
    return list.slice(0, 3)
  }, [incident, latestTwinEvent])

  const getPinColor = (pin) => {
    if (pin.type === 'asset') {
      const a = assetMap[pin.id]
      if (a?.status === 'failed' || a?.status === 'critical') return 'var(--status-critical)'
      if (a?.status === 'degraded' || a?.status === 'starting') return 'var(--status-warning)'
      return 'var(--status-normal)'
    }
    const s = services.find((srv) => srv.id === pin.id)
    if (s?.at_risk || s?.status === 'compromised') return 'var(--status-critical)'
    if (s?.status === 'reduced_capacity') return 'var(--status-warning)'
    return 'var(--status-normal)'
  }

  // Radial calculation for Resilience Index
  const dialRadius = 54
  const dialCircumference = 2 * Math.PI * dialRadius
  const dialStrokeDashoffset = dialCircumference - (overallScore / 100) * dialCircumference

  return (
    <div className="dashboard-page">
      {/* 1. TOP SUBSYSTEM KPI CARDS ROW */}
      <section className="dashboard-top-cards-row">
        {topCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.id} className="subsystem-kpi-card">
              <div className="subsystem-kpi-header">
                <div className="subsystem-title-group">
                  <Icon size={14} className="subsystem-icon" />
                  <span className="subsystem-name">{card.name}</span>
                </div>
                <span className={`badge ${card.statusClass} font-mono`}>
                  {card.status}
                </span>
              </div>

              <div className="subsystem-kpi-body">
                <div className="subsystem-metric-val font-mono">{card.pct}</div>
                {/* Micro sparkline visual */}
                <div className="subsystem-sparkline-wrap">
                  <svg className="subsystem-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
                    <polyline
                      fill="none"
                      stroke={card.sparkColor}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={card.sparkPoints}
                    />
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. MIDDLE TWO-COLUMN WORKSPACE: Campus Twin (Left) + Resilience Index & System Performance (Right) */}
      <section className="dashboard-middle-grid">
        {/* Left: Campus Twin Visual with glowing interactive pins & overlay panels */}
        <div className="dashboard-campus-card">
          <div className="campus-card-header">
            <div className="campus-header-title-group">
              <span className="campus-card-title">Hospital Campus Twin (Simulated)</span>
              <span className="campus-card-subtitle font-mono">Central Metropolitan Medical Center</span>
            </div>
            <div className="campus-quick-tags">
              <button
                type="button"
                className="campus-tag-btn is-active"
                onClick={() => onNavigate && onNavigate('digital-twin')}
              >
                All Systems
              </button>
              <button
                type="button"
                className="campus-tag-btn"
                onClick={() => onNavigate && onNavigate('digital-twin')}
              >
                Critical Care
              </button>
              <button
                type="button"
                className="campus-tag-btn"
                onClick={() => onNavigate && onNavigate('start-simulation')}
              >
                Simulate Fault
              </button>
            </div>
          </div>

          <div className="campus-visual-container">
            <img
              src={hospitalCampusImg}
              alt="Hospital Campus Infrastructure Twin"
              className="campus-image"
            />
            <div className="campus-vignette-overlay" />

            {/* Interactive Campus Pins */}
            {overlayPins.map((pin) => {
              const pinColor = getPinColor(pin)
              return (
                <div
                  key={pin.id}
                  className="campus-hud-pin"
                  style={{ top: pin.top, left: pin.left }}
                  onClick={() => {
                    if (pin.type === 'asset' && onSelectAsset) {
                      onSelectAsset(pin.id)
                    }
                    if (onNavigate) {
                      onNavigate('digital-twin')
                    }
                  }}
                  title={`Inspect ${pin.label} (${pin.sub})`}
                >
                  <span
                    className="pin-core-dot"
                    style={{
                      backgroundColor: pinColor,
                      boxShadow: `0 0 10px ${pinColor}`
                    }}
                  />
                  <div className="pin-tag-card">
                    <span className="pin-label">{pin.label}</span>
                    <span className="pin-sub">{pin.sub}</span>
                  </div>
                </div>
              )
            })}

            {/* Floating Live System Overview HUD Overlay */}
            <div className="campus-hud-overview">
              <div className="hud-overview-header">
                <div className="hud-title-group">
                  <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
                  <span className="hud-title">LIVE SYSTEM OVERVIEW</span>
                </div>
                <span className="hud-badge font-mono" style={{ color: statusColor }}>
                  {statusLabel}
                </span>
              </div>
              <div className="hud-metrics-row">
                <div className="hud-stat-cell">
                  <span className="hud-stat-lbl">Resilience</span>
                  <span className="hud-stat-val font-mono" style={{ color: statusColor }}>
                    {overallScore.toFixed(1)}%
                  </span>
                </div>
                <div className="hud-stat-cell">
                  <span className="hud-stat-lbl">Alerts</span>
                  <span
                    className="hud-stat-val font-mono"
                    style={{ color: activeAlertsCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }}
                  >
                    {activeAlertsCount}
                  </span>
                </div>
                <div className="hud-stat-cell">
                  <span className="hud-stat-lbl">Services</span>
                  <span className="hud-stat-val font-mono">
                    {operationalServices}/{totalServices}
                  </span>
                </div>
                <div className="hud-stat-cell">
                  <span className="hud-stat-lbl">Assets</span>
                  <span className="hud-stat-val font-mono">
                    {totalAssets}
                  </span>
                </div>
              </div>
            </div>

            {/* Floating Recent Events Overlay */}
            <div className="campus-hud-events">
              <div className="hud-events-header">
                <span className="hud-events-title">Recent Events</span>
                <button
                  type="button"
                  className="hud-events-link"
                  onClick={() => onNavigate && onNavigate('incident-timeline')}
                >
                  Timeline →
                </button>
              </div>
              <div className="hud-events-items">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="hud-event-entry">
                    <span
                      className="hud-entry-dot"
                      style={{
                        backgroundColor:
                          evt.type === 'critical'
                            ? 'var(--status-critical)'
                            : evt.type === 'warning'
                            ? 'var(--status-warning)'
                            : 'var(--status-normal)'
                      }}
                    />
                    <span className="hud-entry-text">{evt.text}</span>
                    <span className="hud-entry-time font-mono">{evt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Stack: Resilience Index + System Performance Chart */}
        <div className="dashboard-right-stack">
          {/* Card 1: Resilience Index Dial & Subsystem Breakdown */}
          <div className="dashboard-panel-card resilience-index-card">
            <div className="panel-card-header">
              <span className="panel-card-title">Resilience Index</span>
              <span className="badge badge-normal font-mono" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>

            <div className="resilience-dial-body">
              {/* Radial dial */}
              <div className="radial-dial-wrap">
                <svg className="radial-svg" viewBox="0 0 130 130">
                  <circle
                    className="radial-bg"
                    cx="65"
                    cy="65"
                    r={dialRadius}
                  />
                  <circle
                    className="radial-fg"
                    cx="65"
                    cy="65"
                    r={dialRadius}
                    style={{
                      strokeDasharray: dialCircumference,
                      strokeDashoffset: dialStrokeDashoffset,
                      stroke: statusColor
                    }}
                  />
                </svg>
                <div className="radial-center-content">
                  <span className="radial-val font-mono" style={{ color: statusColor }}>
                    {overallScore.toFixed(1)}%
                  </span>
                  <span className="radial-sub font-mono">INDEX</span>
                </div>
              </div>

              {/* 4 Horizontal subsystem bars */}
              <div className="subsystem-bars-wrap">
                <div className="subsystem-bar-item">
                  <div className="subsystem-bar-label-row">
                    <span>Power</span>
                    <span className="font-mono">{powerPct}%</span>
                  </div>
                  <div className="subsystem-bar-track">
                    <div
                      className="subsystem-bar-fill"
                      style={{
                        width: `${powerPct}%`,
                        backgroundColor: powerFailed ? 'var(--status-critical)' : 'var(--accent-cyan)'
                      }}
                    />
                  </div>
                </div>

                <div className="subsystem-bar-item">
                  <div className="subsystem-bar-label-row">
                    <span>Water</span>
                    <span className="font-mono">{waterPct}%</span>
                  </div>
                  <div className="subsystem-bar-track">
                    <div
                      className="subsystem-bar-fill"
                      style={{
                        width: `${waterPct}%`,
                        backgroundColor: waterFailed ? 'var(--status-critical)' : '#0284c7'
                      }}
                    />
                  </div>
                </div>

                <div className="subsystem-bar-item">
                  <div className="subsystem-bar-label-row">
                    <span>HVAC</span>
                    <span className="font-mono">{hvacPct}%</span>
                  </div>
                  <div className="subsystem-bar-track">
                    <div
                      className="subsystem-bar-fill"
                      style={{
                        width: `${hvacPct}%`,
                        backgroundColor: hvacAtRisk ? 'var(--status-warning)' : '#10b981'
                      }}
                    />
                  </div>
                </div>

                <div className="subsystem-bar-item">
                  <div className="subsystem-bar-label-row">
                    <span>Medical Gas</span>
                    <span className="font-mono">{gasPct}%</span>
                  </div>
                  <div className="subsystem-bar-track">
                    <div
                      className="subsystem-bar-fill"
                      style={{
                        width: `${gasPct}%`,
                        backgroundColor: gasDegraded ? 'var(--status-warning)' : '#14b8a6'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: System Performance Line Chart */}
          <div className="dashboard-panel-card system-perf-card">
            <div className="panel-card-header">
              <span className="panel-card-title">System Performance</span>
              <div className="chart-legend-group font-mono">
                <span className="legend-item legend-cyan">● Resilience</span>
                <span className="legend-item legend-blue">● Load</span>
              </div>
            </div>

            <div className="perf-chart-wrap">
              <svg className="perf-chart-svg" viewBox="0 0 340 110" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="resilienceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                  </linearGradient>
                  <linearGradient id="loadGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal grid lines */}
                <line x1="0" y1="25" x2="340" y2="25" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="55" x2="340" y2="55" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="85" x2="340" y2="85" stroke="var(--border-subtle)" strokeDasharray="3 3" />

                {/* Area fills */}
                <path
                  d="M0,30 Q80,25 170,28 T340,24 L340,110 L0,110 Z"
                  fill="url(#resilienceGrad)"
                />
                <path
                  d="M0,60 Q80,68 170,62 T340,58 L340,110 L0,110 Z"
                  fill="url(#loadGrad)"
                />

                {/* Lines */}
                <path
                  d="M0,30 Q80,25 170,28 T340,24"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M0,60 Q80,68 170,62 T340,58"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <div className="chart-x-axis font-mono">
                <span>00:00</span>
                <span>06:00</span>
                <span>12:00</span>
                <span>18:00</span>
                <span>Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM ROW: Utilization (Left) + Risk Distribution (Center) + Key Metrics (Right) */}
      <section className="dashboard-bottom-grid">
        {/* Card 1: Infrastructure Utilization (4 Dials) */}
        <div className="dashboard-panel-card utilization-card">
          <div className="panel-card-header">
            <span className="panel-card-title">Infrastructure Utilization</span>
            <span className="panel-card-sub font-mono">CURRENT LOAD</span>
          </div>

          <div className="utilization-dials-row">
            {/* Power Dial 68% */}
            <div className="util-dial-item">
              <svg className="util-svg" viewBox="0 0 60 60">
                <circle className="util-bg" cx="30" cy="30" r="24" />
                <circle
                  className="util-fg"
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#06b6d4"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (68 / 100) * 150.8}
                />
              </svg>
              <span className="util-val font-mono">68%</span>
              <span className="util-name">Power</span>
            </div>

            {/* Water Dial 54% */}
            <div className="util-dial-item">
              <svg className="util-svg" viewBox="0 0 60 60">
                <circle className="util-bg" cx="30" cy="30" r="24" />
                <circle
                  className="util-fg"
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#0284c7"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (54 / 100) * 150.8}
                />
              </svg>
              <span className="util-val font-mono">54%</span>
              <span className="util-name">Water</span>
            </div>

            {/* HVAC Dial 72% */}
            <div className="util-dial-item">
              <svg className="util-svg" viewBox="0 0 60 60">
                <circle className="util-bg" cx="30" cy="30" r="24" />
                <circle
                  className="util-fg"
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#f59e0b"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (72 / 100) * 150.8}
                />
              </svg>
              <span className="util-val font-mono">72%</span>
              <span className="util-name">HVAC</span>
            </div>

            {/* Med Gas Dial 48% */}
            <div className="util-dial-item">
              <svg className="util-svg" viewBox="0 0 60 60">
                <circle className="util-bg" cx="30" cy="30" r="24" />
                <circle
                  className="util-fg"
                  cx="30"
                  cy="30"
                  r="24"
                  stroke="#10b981"
                  strokeDasharray="150.8"
                  strokeDashoffset={150.8 - (48 / 100) * 150.8}
                />
              </svg>
              <span className="util-val font-mono">48%</span>
              <span className="util-name">Med Gas</span>
            </div>
          </div>
        </div>

        {/* Card 2: Risk Distribution Donut */}
        <div className="dashboard-panel-card risk-dist-card">
          <div className="panel-card-header">
            <span className="panel-card-title">Risk Distribution</span>
            <span className="panel-card-sub font-mono">12 TOTAL RISKS</span>
          </div>

          <div className="risk-donut-body">
            <div className="donut-chart-wrap">
              <svg className="donut-svg" viewBox="0 0 100 100">
                {/* Donut arcs for 12 risks: 3 High (25%), 5 Medium (41.6%), 4 Low (33.3%) */}
                {/* Circumference for r=38 is 238.76 */}
                <circle
                  className="donut-arc arc-low"
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#10b981"
                  strokeDasharray="80 159"
                  strokeDashoffset="0"
                />
                <circle
                  className="donut-arc arc-med"
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#f59e0b"
                  strokeDasharray="100 139"
                  strokeDashoffset="-80"
                />
                <circle
                  className="donut-arc arc-high"
                  cx="50"
                  cy="50"
                  r="38"
                  stroke="#ef4444"
                  strokeDasharray="60 179"
                  strokeDashoffset="-180"
                />
              </svg>
              <div className="donut-center-text">
                <span className="donut-num font-mono">12</span>
                <span className="donut-label">Total</span>
              </div>
            </div>

            <div className="risk-legend-list">
              <div className="risk-legend-row">
                <span className="risk-dot dot-high" />
                <span className="risk-lbl">High Risk</span>
                <span className="risk-count font-mono">3</span>
              </div>
              <div className="risk-legend-row">
                <span className="risk-dot dot-med" />
                <span className="risk-lbl">Medium Risk</span>
                <span className="risk-count font-mono">5</span>
              </div>
              <div className="risk-legend-row">
                <span className="risk-dot dot-low" />
                <span className="risk-lbl">Low Risk</span>
                <span className="risk-count font-mono">4</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Key Metrics (4 Stat Boxes) */}
        <div className="dashboard-panel-card key-metrics-card">
          <div className="panel-card-header">
            <span className="panel-card-title">Key Metrics</span>
            <span className="panel-card-sub font-mono">SYSTEM SUMMARY</span>
          </div>

          <div className="stat-boxes-grid">
            <div className="stat-box-item">
              <span className="stat-box-num font-mono">{totalAssets}</span>
              <span className="stat-box-label">Monitored Assets</span>
            </div>
            <div className="stat-box-item">
              <span className="stat-box-num font-mono">6</span>
              <span className="stat-box-label">Subsystems</span>
            </div>
            <div className="stat-box-item">
              <span
                className="stat-box-num font-mono"
                style={{ color: activeAlertsCount > 0 ? 'var(--status-critical)' : 'var(--text-primary)' }}
              >
                {activeAlertsCount}
              </span>
              <span className="stat-box-label">Active Alerts</span>
            </div>
            <div className="stat-box-item">
              <span className="stat-box-num font-mono" style={{ color: 'var(--status-normal)' }}>
                98.4%
              </span>
              <span className="stat-box-label">System Uptime</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
