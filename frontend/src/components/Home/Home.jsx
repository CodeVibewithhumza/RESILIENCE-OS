import { useMemo } from 'react'
import {
  Play,
  Compass,
  Shield,
  Server,
  HeartPulse,
  AlertTriangle,
  Zap,
  Droplets,
  Wind,
  Flame,
  Activity,
  ArrowRight,
  Radio
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
  // Derive status from active state
  const statusColor = resilience?.status_color || '#10B981'
  const statusLabel = resilience?.status_label || 'OPTIMAL'

  // Dynamic KPI counts derived from actual state
  const totalAssets = assets.length
  const normalAssets = assets.filter((a) => a.status === 'normal').length
  const disruptedAssets = assets.filter(
    (a) => a.status === 'failed' || a.status === 'critical' || a.status === 'degraded'
  ).length

  const totalServices = services.length
  const operationalServices = services.filter((s) => s.status === 'full_operation').length
  const atRiskServices = services.filter((s) => s.at_risk).length

  const activeAlertsCount =
    (incident?.is_active ? incident.affected_asset_ids?.length || 0 : 0) + atRiskServices

  // Fast asset lookup by ID for interactive overlay pins
  const assetMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => {
      map[a.id] = a
    })
    return map
  }, [assets])

  // Overlay pins mapped to actual assets & layout coordinates on the hospital campus visual
  const overlayPins = [
    {
      id: 'GRID_MAIN',
      label: 'GRID_MAIN',
      subtext: '11kV Feed',
      top: '47%',
      left: '16%',
      asset: assetMap['GRID_MAIN']
    },
    {
      id: 'GEN_01',
      label: 'GEN_01',
      subtext: 'Diesel Gen 1',
      top: '33%',
      left: '26%',
      asset: assetMap['GEN_01']
    },
    {
      id: 'CHILLER_PLANT',
      label: 'CHILLER_PLANT',
      subtext: 'HVAC Roof',
      top: '18%',
      left: '40%',
      asset: assetMap['CHILLER_PLANT']
    },
    {
      id: 'UPS_CRITICAL',
      label: 'UPS_CRITICAL',
      subtext: 'Battery Bank',
      top: '42%',
      left: '32%',
      asset: assetMap['UPS_CRITICAL']
    },
    {
      id: 'OXYGEN_MANIFOLD',
      label: 'O2_MANIFOLD',
      subtext: 'Cryo-Gas',
      top: '42%',
      left: '84%',
      asset: assetMap['OXYGEN_MANIFOLD']
    },
    {
      id: 'WATER_PUMP_STATION',
      label: 'WATER_BOOSTER',
      subtext: 'Basement Pumps',
      top: '73%',
      left: '56%',
      asset: assetMap['WATER_PUMP_STATION']
    },
    {
      id: 'SERVICE_ER',
      label: 'EMERGENCY_TRAUMA',
      subtext: 'L5 Trauma',
      top: '56%',
      left: '58%',
      isService: true,
      service: services.find((s) => s.id === 'SERVICE_ER')
    }
  ]

  // System Status Strip configurations derived dynamically
  const powerAssets = assets.filter((a) =>
    ['grid', 'transformer', 'main_bus', 'emergency_bus', 'generator', 'ups'].includes(a.type)
  )
  const powerDisrupted = powerAssets.some((a) => a.status === 'failed' || a.status === 'critical')
  const powerDegraded = powerAssets.some((a) => a.status === 'degraded' || a.status === 'starting')

  const waterAsset = assetMap['WATER_PUMP_STATION']
  const hvacAsset = assetMap['CHILLER_PLANT']
  const gasAsset = assetMap['OXYGEN_MANIFOLD']

  const systemStatusCards = [
    {
      id: 'power',
      name: 'Power System',
      icon: Zap,
      status: powerDisrupted ? 'CRITICAL' : powerDegraded ? 'DEGRADED' : 'OPERATIONAL',
      statusType: powerDisrupted ? 'critical' : powerDegraded ? 'warning' : 'normal',
      metric: powerDisrupted
        ? 'Grid Outage / Gen Online'
        : telemetry?.total_hospital_load_kw
        ? `${telemetry.total_hospital_load_kw.toFixed(0)} kW Load • ${powerAssets.filter((a) => a.status === 'normal' || a.status === 'offline').length}/${powerAssets.length} Nominal`
        : `${powerAssets.filter((a) => a.status === 'normal' || a.status === 'offline').length}/${powerAssets.length} Assets Nominal`,
      targetAnchor: 'assets'
    },
    {
      id: 'water',
      name: 'Water Utilities',
      icon: Droplets,
      status: waterAsset?.status === 'failed' ? 'FAILED' : 'OPERATIONAL',
      statusType: waterAsset?.status === 'failed' ? 'critical' : 'normal',
      metric: `${waterAsset?.pressure_psi || 60} PSI System Header`,
      targetAnchor: 'assets'
    },
    {
      id: 'hvac',
      name: 'HVAC & Cooling',
      icon: Wind,
      status: hvacAsset?.status === 'degraded' ? 'THROTTLED' : 'OPTIMAL',
      statusType: hvacAsset?.status === 'degraded' ? 'warning' : 'normal',
      metric: hvacAsset?.temperature_c ? `${hvacAsset.temperature_c}°C Chilled Loop` : '7.2°C Loop Temp',
      targetAnchor: 'assets'
    },
    {
      id: 'gas',
      name: 'Medical Gas',
      icon: Flame,
      status: gasAsset?.status === 'degraded' ? 'DEGRADED' : 'OPERATIONAL',
      statusType: gasAsset?.status === 'degraded' ? 'warning' : 'normal',
      metric: `${gasAsset?.pressure_psi || 55} PSI Line Pressure`,
      targetAnchor: 'assets'
    },
    {
      id: 'clinical',
      name: 'Critical Services',
      icon: HeartPulse,
      status: atRiskServices > 0 ? `${atRiskServices} AT RISK` : '100% CONTINUITY',
      statusType: atRiskServices > 0 ? 'critical' : 'normal',
      metric: `${operationalServices}/${totalServices} Units Full Care`,
      targetAnchor: 'services'
    }
  ]

  // Recent operational events list linked to canonical state and live twin events
  const recentEvents = useMemo(() => {
    const list = []
    if (latestTwinEvent) {
      if (latestTwinEvent.type === 'failure_injected') {
        list.push({
          id: 'live-evt-failure',
          text: `Real-time fault on ${latestTwinEvent.target_node_id || 'node'} (${latestTwinEvent.payload?.failure_type || 'failure'})`,
          time: 'Live',
          type: 'critical'
        })
      } else if (latestTwinEvent.type === 'strategy_applied') {
        list.push({
          id: 'live-evt-strat',
          text: `Strategy ${latestTwinEvent.payload?.strategy_name || latestTwinEvent.payload?.strategy_id || ''} applied`,
          time: 'Live',
          type: 'normal'
        })
      } else if (latestTwinEvent.type === 'hospital_reset') {
        list.push({
          id: 'live-evt-reset',
          text: 'Twin state reset to 100% operational baseline',
          time: 'Live',
          type: 'normal'
        })
      } else if (latestTwinEvent.type === 'simulation_run_persisted') {
        list.push({
          id: 'live-evt-persist',
          text: `Simulation run persisted (ID: ${String(latestTwinEvent.payload?.simulation_id || '').slice(0, 8)})`,
          time: 'Live',
          type: 'normal'
        })
      }
    }

    if (incident?.is_active) {
      list.push(
        { id: 'e1', text: 'Main grid outage injected at Substation A', time: 'Just now', type: 'critical' },
        { id: 'e2', text: 'Emergency Bus switched to backup feeder', time: 'T+0 min', type: 'critical' },
        { id: 'e3', text: 'GEN_01 diesel generator warmup initialized', time: 'T+5 min', type: 'warning' },
        { id: 'e4', text: 'Critical care care units switched to UPS reserve', time: 'T+10 min', type: 'warning' }
      )
    } else {
      list.push(
        { id: 'e1', text: 'System status nominal', time: '2 min ago', type: 'normal' },
        { id: 'e2', text: 'Telemetry sync active', time: '1s interval', type: 'normal' },
        { id: 'e3', text: 'Simulation module ready', time: '12 min ago', type: 'normal' },
        { id: 'e4', text: 'All critical services online', time: '18 min ago', type: 'normal' }
      )
    }
    return list.slice(0, 4)
  }, [incident?.is_active, latestTwinEvent])

  const handleScrollTo = (anchorId) => {
    if (onNavigate) {
      onNavigate(anchorId)
    }
    const elem = document.getElementById(anchorId)
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getStatusDotColor = (status) => {
    switch (status) {
      case 'normal':
      case 'full_operation':
        return 'var(--status-normal)'
      case 'degraded':
      case 'reduced_capacity':
      case 'critical_only':
      case 'starting':
        return 'var(--status-warning)'
      case 'critical':
      case 'failed':
      case 'compromised':
        return 'var(--status-critical)'
      case 'offline':
        return 'var(--status-offline)'
      default:
        return 'var(--status-normal)'
    }
  }

  return (
    <section className="home-screen" id="overview">
      {/* 1. Command Center Two-Column Hero: Headline + CTAs (Left) and Real-Time Monitoring Card (Right) */}
      <div className="home-hero-two-col">
        {/* Left Column: Headline & Action CTAs */}
        <div className="home-hero-left">
          <div className="home-eyebrow">
            <Radio size={12} className="home-eyebrow-icon" />
            <span>MONITOR · SIMULATE · PREDICT · PREPARE</span>
          </div>

          <h1 className="home-headline">Hospital Resilience at a Glance</h1>

          <p className="home-subheadline">
            An intelligent digital twin for hospital infrastructure resilience — predictive cascade modeling,
            real-time telemetry monitoring, and automated mitigation strategy evaluation.
          </p>

          {/* Primary Action Buttons */}
          <div className="home-actions-row">
            <button
              type="button"
              className="home-cta-primary"
              onClick={() => handleScrollTo('incident-control')}
              title="Navigate to Incident Injection Control"
            >
              <div className="cta-icon-box cta-icon-pulse">
                <Play size={16} fill="currentColor" />
              </div>
              <div className="cta-text-group">
                <span className="cta-main-label">START SIMULATION</span>
                <span className="cta-sub-label">Run a failure scenario</span>
              </div>
              <ArrowRight size={15} className="cta-arrow" />
            </button>

            <button
              type="button"
              className="home-cta-secondary"
              onClick={() => handleScrollTo('digital-twin')}
              title="Explore 3D Digital Twin Model"
            >
              <div className="cta-icon-box">
                <Compass size={16} />
              </div>
              <div className="cta-text-group">
                <span className="cta-main-label">EXPLORE DIGITAL TWIN</span>
                <span className="cta-sub-label">View infrastructure topology</span>
              </div>
              <ArrowRight size={15} className="cta-arrow" />
            </button>
          </div>
        </div>

        {/* Right Column: Premium Real-Time Monitoring Promotional Card */}
        <div className="home-hero-right">
          <div className="hero-promo-card">
            <div className="promo-badge-row">
              <span className="promo-badge">
                <Activity size={12} className="promo-badge-icon" />
                REAL-TIME MONITORING
              </span>
              <span className="promo-live-dot-wrap">
                <span
                  className={`status-dot ${connectionStatus === 'connected' || connectionStatus === 'connecting' || connectionStatus === 'reconnecting' ? 'status-dot-pulse' : ''}`}
                  style={{
                    backgroundColor:
                      connectionStatus === 'connected'
                        ? 'var(--accent-cyan)'
                        : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                        ? 'var(--status-warning)'
                        : 'var(--text-muted)'
                  }}
                />
                <span
                  className="promo-live-text font-mono"
                  style={{
                    color:
                      connectionStatus === 'connected'
                        ? 'var(--accent-cyan)'
                        : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                        ? 'var(--status-warning)'
                        : 'var(--text-muted)'
                  }}
                >
                  {connectionStatus === 'connected'
                    ? 'TELEMETRY LIVE'
                    : connectionStatus === 'reconnecting'
                    ? 'RECONNECTING...'
                    : connectionStatus === 'connecting'
                    ? 'CONNECTING...'
                    : 'DEMO STANDBY'}
                </span>
              </span>
            </div>

            <div className="promo-content">
              <h2 className="promo-headline">
                A MORE RESILIENT<br />
                <span className="promo-headline-accent">HEALTHCARE TOMORROW</span>
              </h2>
              <p className="promo-tagline">
                Predict. Prepare. Protect Lives.
              </p>
            </div>

            {/* Subtle Animated Cyan Heartbeat / ECG Waveform Visual */}
            <div className="promo-ecg-canvas">
              <svg viewBox="0 0 380 90" className="promo-ecg-svg" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="ecgGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                    <stop offset="25%" stopColor="#06b6d4" stopOpacity="0.75" />
                    <stop offset="50%" stopColor="#22d3ee" stopOpacity="1" />
                    <stop offset="75%" stopColor="#14b8a6" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
                  </linearGradient>
                  <filter id="ecgGlowFilter" x="-10%" y="-20%" width="120%" height="140%">
                    <feGaussianBlur stdDeviation="2.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <line x1="0" y1="45" x2="380" y2="45" stroke="rgba(6, 182, 212, 0.12)" strokeWidth="1" strokeDasharray="3 3" />
                <path
                  d="M0,45 L50,45 L62,45 L70,36 L78,54 L86,10 L96,80 L104,38 L112,48 L120,45 L170,45 L182,45 L190,36 L198,54 L206,10 L216,80 L224,38 L232,48 L240,45 L290,45 L302,45 L310,36 L318,54 L326,10 L336,80 L344,38 L352,48 L360,45 L380,45"
                  fill="none"
                  stroke="url(#ecgGrad)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter="url(#ecgGlowFilter)"
                  className="ecg-animated-path"
                />
              </svg>
            </div>

            <div className="promo-card-footer">
              <span className="font-mono">Central Metropolitan Hospital Campus</span>
              <span className="promo-sep">•</span>
              <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>Active Decision Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Visual Centerpiece: Hospital Campus Twin with Real-Time HUD Overlay & Recent Events Panel */}
      <div className="home-visual-section">
        <div className="home-visual-wrapper">
          <div className="home-visual-canvas">
            <img
              src={hospitalCampusImg}
              alt="ResilienceOS Hospital Campus Infrastructure Digital Twin"
              className="home-campus-image"
              loading="eager"
            />

            {/* Subtle Technological Scan Line & Vignette Overlays */}
            <div className="home-visual-vignette" />
            <div className="home-visual-scanline" />

            {/* Interactive Campus Pins linked to real ResilienceOS asset state */}
            {overlayPins.map((pin) => {
              const currentStatus = pin.isService
                ? pin.service?.status || 'full_operation'
                : pin.asset?.status || 'normal'
              const pinColor = getStatusDotColor(currentStatus)

              return (
                <div
                  key={pin.id}
                  className="campus-hud-pin"
                  style={{ top: pin.top, left: pin.left }}
                  onClick={() => {
                    if (pin.asset && onSelectAsset) {
                      onSelectAsset(pin.asset.id)
                      handleScrollTo('digital-twin')
                    } else if (pin.isService) {
                      handleScrollTo('services')
                    }
                  }}
                  title={`Inspect ${pin.label}`}
                >
                  <span
                    className="hud-pin-dot"
                    style={{
                      backgroundColor: pinColor,
                      boxShadow: `0 0 10px ${pinColor}`
                    }}
                  />
                  <div className="hud-pin-tag">
                    <span className="hud-pin-id font-mono">{pin.label}</span>
                    <span className="hud-pin-sub">{pin.subtext}</span>
                  </div>
                </div>
              )
            })}

            {/* Floating Live System Overview HUD Panel on Visual */}
            <div className="home-hud-overview-panel">
              <div className="hud-panel-top">
                <div className="hud-panel-title-group">
                  <Activity size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span className="hud-panel-title">LIVE SYSTEM OVERVIEW</span>
                </div>
                <span
                  className="badge font-mono"
                  style={{
                    color: statusColor,
                    backgroundColor: `${statusColor}18`,
                    borderColor: `${statusColor}45`,
                    fontSize: '9px'
                  }}
                >
                  <span
                    className="status-dot status-dot-pulse"
                    style={{ backgroundColor: statusColor }}
                  />
                  {statusLabel}
                </span>
              </div>

              <div className="hud-metrics-grid">
                <div className="hud-metric-cell">
                  <span className="hud-metric-label">Resilience Index</span>
                  <div className="hud-metric-val-row">
                    <span className="hud-metric-val font-mono" style={{ color: statusColor }}>
                      {resilience?.overall_score?.toFixed(1) || '94.5'}
                    </span>
                    <span className="hud-metric-denom font-mono">/ 100</span>
                  </div>
                </div>

                <div className="hud-metric-cell">
                  <span className="hud-metric-label">Active Alerts</span>
                  <div className="hud-metric-val-row">
                    <span
                      className="hud-metric-val font-mono"
                      style={{
                        color: activeAlertsCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)'
                      }}
                    >
                      {activeAlertsCount}
                    </span>
                    <span className="hud-metric-denom font-mono">Conditions</span>
                  </div>
                </div>

                <div className="hud-metric-cell">
                  <span className="hud-metric-label">Critical Services</span>
                  <div className="hud-metric-val-row">
                    <span
                      className="hud-metric-val font-mono"
                      style={{
                        color: atRiskServices > 0 ? 'var(--status-warning)' : 'var(--status-normal)'
                      }}
                    >
                      {operationalServices}/{totalServices}
                    </span>
                    <span className="hud-metric-denom font-mono">Units</span>
                  </div>
                </div>

                <div className="hud-metric-cell">
                  <span className="hud-metric-label">Assets Monitored</span>
                  <div className="hud-metric-val-row">
                    <span className="hud-metric-val font-mono">
                      {totalAssets}
                    </span>
                    <span className="hud-metric-denom font-mono">Nodes</span>
                  </div>
                </div>
              </div>

              <div className="hud-panel-footer">
                <span className="font-mono">Central Metropolitan Trauma Center</span>
                <span style={{ color: 'var(--text-muted)' }}>•</span>
                <span className="font-mono">
                  {connectionStatus === 'connected'
                    ? `Live Telemetry Sync${lastUpdated ? ` (${lastUpdated.toLocaleTimeString()})` : ''}`
                    : 'Demo Fallback Mode'}
                </span>
              </div>
            </div>

            {/* Floating Recent Events Panel below Live System Overview */}
            <div className="home-hud-events-panel">
              <div className="hud-events-top">
                <div className="hud-events-title-group">
                  <span className="hud-events-dot" />
                  <span className="hud-events-title">RECENT EVENTS</span>
                </div>
                <button
                  type="button"
                  className="hud-events-link font-mono"
                  onClick={() => handleScrollTo('resilience-cascade')}
                  title="View complete cascade timeline"
                >
                  View All →
                </button>
              </div>

              <div className="hud-events-list">
                {recentEvents.map((evt) => (
                  <div key={evt.id} className="hud-event-row">
                    <div className="hud-event-left">
                      <span
                        className="hud-event-status-dot"
                        style={{
                          backgroundColor:
                            evt.type === 'critical'
                              ? 'var(--status-critical)'
                              : evt.type === 'warning'
                              ? 'var(--status-warning)'
                              : 'var(--status-normal)'
                        }}
                      />
                      <span className="hud-event-text">{evt.text}</span>
                    </div>
                    <span className="hud-event-time font-mono">{evt.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Four Core KPI Metrics Cards Grid */}
      <div className="kpi-cards-grid">
        {/* KPI 1: Composite Resilience Index */}
        <div className={`kpi-card ${incident?.is_active ? 'is-alert-card' : ''}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Composite Resilience Index</span>
            <Shield size={16} style={{ color: resilience?.status_color || '#10B981' }} />
          </div>
          <div className="kpi-card-metric-row">
            <span className="kpi-main-num font-mono" style={{ color: resilience?.status_color || '#10B981' }}>
              {resilience?.overall_score?.toFixed(1) || '94.5'}
            </span>
            <span className="kpi-main-denom font-mono">/ 100.0</span>
          </div>
          <div className="kpi-card-footer">
            <span
              className="badge font-mono"
              style={{
                color: resilience?.status_color || '#10B981',
                backgroundColor: `${resilience?.status_color || '#10B981'}18`,
                borderColor: `${resilience?.status_color || '#10B981'}45`
              }}
            >
              {resilience?.status_label || 'OPTIMAL'}
            </span>
            <span className="kpi-card-sub font-mono">
              {resilience?.delta_from_baseline === 0
                ? 'Baseline Nominal'
                : `${(resilience?.delta_from_baseline || 0) > 0 ? '+' : ''}${(resilience?.delta_from_baseline || 0).toFixed(1)} pts`}
            </span>
          </div>
        </div>

        {/* KPI 2: Critical Care Services */}
        <div className={`kpi-card ${atRiskServices > 0 ? 'is-warning-card' : ''}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Critical Care Services</span>
            <HeartPulse size={16} style={{ color: atRiskServices > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }} />
          </div>
          <div className="kpi-card-metric-row">
            <span className="kpi-main-num font-mono" style={{ color: atRiskServices > 0 ? 'var(--status-warning)' : 'var(--status-normal)' }}>
              {operationalServices}
            </span>
            <span className="kpi-main-denom font-mono">/ {totalServices} Units</span>
          </div>
          <div className="kpi-card-footer">
            <span className={`badge ${atRiskServices > 0 ? 'badge-critical' : 'badge-normal'} font-mono`}>
              {atRiskServices > 0 ? `${atRiskServices} At Risk` : '100% Operational'}
            </span>
            <span className="kpi-card-sub font-mono">
              ICU, OT, ER Monitored
            </span>
          </div>
        </div>

        {/* KPI 3: Infrastructure Assets */}
        <div className={`kpi-card ${disruptedAssets > 0 ? 'is-warning-card' : ''}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Infrastructure Assets</span>
            <Server size={16} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div className="kpi-card-metric-row">
            <span className="kpi-main-num font-mono">
              {totalAssets}
            </span>
            <span className="kpi-main-denom font-mono">Active Nodes</span>
          </div>
          <div className="kpi-card-footer">
            <span className={`badge ${disruptedAssets > 0 ? 'badge-warning' : 'badge-normal'} font-mono`}>
              {disruptedAssets > 0 ? `${disruptedAssets} Disrupted` : `${normalAssets} Normal`}
            </span>
            <span className="kpi-card-sub font-mono">
              5 Subsystems Linked
            </span>
          </div>
        </div>

        {/* KPI 4: Active System Alerts */}
        <div className={`kpi-card ${activeAlertsCount > 0 ? 'is-alert-card' : ''}`}>
          <div className="kpi-card-header">
            <span className="kpi-card-title">Active System Alerts</span>
            <AlertTriangle size={16} style={{ color: activeAlertsCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }} />
          </div>
          <div className="kpi-card-metric-row">
            <span className="kpi-main-num font-mono" style={{ color: activeAlertsCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)' }}>
              {activeAlertsCount}
            </span>
            <span className="kpi-main-denom font-mono">Conditions</span>
          </div>
          <div className="kpi-card-footer">
            <span className={`badge ${activeAlertsCount > 0 ? 'badge-critical' : 'badge-normal'} font-mono`}>
              {activeAlertsCount > 0 ? 'Action Required' : '0 Anomalies'}
            </span>
            <span className="kpi-card-sub font-mono">
              {incident?.is_active ? 'Grid Failure Active' : 'Standby Normal'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. System Status Strip (Under Hero) */}
      <div className="system-status-strip-section">
        <div className="status-strip-header">
          <span className="status-strip-title">
            <Server size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>Core Subsystems Status Stream</span>
          </span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Real-time multi-utility infrastructure telemetry
          </span>
        </div>

        <div className="status-strip-grid">
          {systemStatusCards.map((card) => {
            const Icon = card.icon
            const badgeClass =
              card.statusType === 'critical'
                ? 'badge-critical'
                : card.statusType === 'warning'
                ? 'badge-warning'
                : 'badge-normal'

            return (
              <div
                key={card.id}
                className="status-strip-card"
                onClick={() => handleScrollTo(card.targetAnchor)}
                role="button"
                tabIndex={0}
                title={`View ${card.name} Details`}
              >
                <div className="strip-card-top">
                  <div className="strip-card-title-group">
                    <Icon size={14} style={{ color: 'var(--accent-cyan)' }} />
                    <span className="strip-card-name">{card.name}</span>
                  </div>
                  <span className={`badge ${badgeClass} font-mono`} style={{ fontSize: '9px' }}>
                    {card.status}
                  </span>
                </div>

                <div className="strip-card-bottom">
                  <span className="strip-card-metric font-mono">{card.metric}</span>
                  <ArrowRight size={12} className="strip-card-arrow" />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
