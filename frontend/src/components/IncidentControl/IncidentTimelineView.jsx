import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Zap,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings as CogIcon,
  ChevronRight,
  Info,
  ShieldCheck,
  ShieldAlert,
  Flame,
  Wind,
  Droplets,
  Activity,
  Layers,
  Sparkles
} from 'lucide-react'
import './IncidentTimelineView.css'

export default function IncidentTimelineView({
  incident = {},
  timeline = [],
  activeCheckpointIndex = 0,
  onSelectCheckpoint,
  onNextCheckpoint,
  onOpenExplainability,
  onReset,
  onTriggerFailure,
  onApplyStrategy,
  assets = [],
  services = [],
  resilience = {},
  onNotify
}) {
  const [selectedEventFilter, setSelectedEventFilter] = useState('all') // 'all' | 'critical' | 'warnings'
  const [isPlaying, setIsPlaying] = useState(false)

  // --------------------------------------------------------------------------
  // 1. Dynamic Incident Metadata from Backend
  // --------------------------------------------------------------------------
  const isIncActive = Boolean(incident?.is_active || (incident?.affected_asset_ids && incident.affected_asset_ids.length > 0))
  const sourceAssetId = incident?.source_asset_id || 'GRID_MAIN'
  const sourceAsset = assets.find((a) => a.id === sourceAssetId) || {
    id: sourceAssetId,
    name: sourceAssetId.replace(/_/g, ' '),
    type: 'ELECTRICAL',
    location: 'Central Substation'
  }

  // Identify affected subsystems dynamically
  const affectedSubsystems = useMemo(() => {
    if (!isIncActive || !incident?.affected_asset_ids) return []
    const sysSet = new Set()
    incident.affected_asset_ids.forEach((id) => {
      const lower = id.toLowerCase()
      if (lower.includes('grid') || lower.includes('trans') || lower.includes('bus') || lower.includes('gen') || lower.includes('ups')) {
        sysSet.add('Electrical Power')
      } else if (lower.includes('chiller') || lower.includes('ahu') || lower.includes('hvac')) {
        sysSet.add('Thermal HVAC')
      } else if (lower.includes('oxygen') || lower.includes('gas') || lower.includes('manifold')) {
        sysSet.add('Medical Gas')
      } else if (lower.includes('water') || lower.includes('pump')) {
        sysSet.add('Hydraulic & Water')
      }
    })
    return Array.from(sysSet)
  }, [isIncActive, incident?.affected_asset_ids])

  // Identify affected clinical services dynamically
  const affectedServiceNames = useMemo(() => {
    if (!isIncActive) return []
    const affectedIds = incident?.affected_service_ids || []
    return services
      .filter((s) => affectedIds.includes(s.id) || s.status === 'compromised' || s.status === 'reduced_capacity' || s.at_risk)
      .map((s) => s.name || s.id)
  }, [isIncActive, incident?.affected_service_ids, services])

  // --------------------------------------------------------------------------
  // 2. Dynamic Timeline Milestones & Event Logs from Backend Cascade Engine
  // --------------------------------------------------------------------------
  const defaultMilestones = useMemo(() => [
    { t_offset_min: 0, title: 'Fault Triggered', desc: 'Initial component trip and emergency failover engaged.', system_resilience_score: 69 },
    { t_offset_min: 5, title: 'Secondary Transfer', desc: 'Intermediate reserves taking critical hospital loads.', system_resilience_score: 58 },
    { t_offset_min: 10, title: 'Service Strain', desc: 'Downstream cooling and non-critical distribution curtailed.', system_resilience_score: 47 },
    { t_offset_min: 20, title: 'Reserve Depletion Boundary', desc: 'Life-safety battery depletion threshold alarm triggered.', system_resilience_score: 28 }
  ], [])

  const rawTimeline = useMemo(() => {
    if (Array.isArray(timeline) && timeline.length > 0) return timeline
    if (Array.isArray(incident?.timeline) && incident.timeline.length > 0) return incident.timeline
    return defaultMilestones
  }, [timeline, incident?.timeline, defaultMilestones])

  // Parsed milestones for top scrubber bar
  const milestones = useMemo(() => {
    return rawTimeline.map((step, idx) => {
      const score = typeof step.system_resilience_score === 'number'
        ? Math.round(step.system_resilience_score)
        : (isIncActive ? Math.max(25, 94 - idx * 14) : 94)
      const color = score >= 75 ? '#00E5A3' : score >= 55 ? '#FFB800' : score >= 35 ? '#FF7A00' : '#FF4D4D'
      const tLabel = typeof step.t_offset_min === 'number' ? `T+${step.t_offset_min}m` : `T+${idx * 5}m`
      const rawTitle = step.title || `Checkpoint ${idx + 1}`
      const cleanLabel = rawTitle.replace(/^T\+\d+\s*(min)?:?\s*/i, '')
      return {
        idx,
        t: tLabel,
        t_offset_min: step.t_offset_min ?? idx * 5,
        label: cleanLabel,
        color,
        score,
        description: step.description || step.service_impact_summary || 'Multi-tier failure cascade propagation update.',
        serviceImpact: step.service_impact_summary || 'Infrastructure parameters updated.',
        affectedNodeIds: step.affected_node_ids || []
      }
    })
  }, [rawTimeline, isIncActive])

  // Safe active checkpoint index
  const safeActiveIdx = Math.min(activeCheckpointIndex, Math.max(0, milestones.length - 1))
  const currentCheckpoint = milestones[safeActiveIdx] || milestones[0]

  // Event Logs synthesized from milestones
  const eventLogs = useMemo(() => {
    return milestones.map((m) => {
      const isCritical = m.score < 40
      const isWarn = m.score >= 40 && m.score < 70
      const isCheck = m.score >= 70
      return {
        id: `evt-${m.idx}`,
        idx: m.idx,
        time: m.t,
        title: m.label,
        desc: m.description,
        serviceImpact: m.serviceImpact,
        score: m.score,
        type: isCritical ? 'critical' : isWarn ? 'warn' : isCheck ? 'check' : 'cog',
        affectedNodeIds: m.affectedNodeIds
      }
    })
  }, [milestones])

  const filteredLogs = useMemo(() => {
    return eventLogs.filter((evt) => {
      if (selectedEventFilter === 'critical') return evt.type === 'critical'
      if (selectedEventFilter === 'warnings') return evt.type === 'warn' || evt.type === 'critical'
      return true
    })
  }, [eventLogs, selectedEventFilter])

  // --------------------------------------------------------------------------
  // 3. Play / Pause Autoplay Scrubber
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isPlaying) return
    const timer = setInterval(() => {
      if (onSelectCheckpoint) {
        onSelectCheckpoint((prev) => (prev + 1) % milestones.length)
      }
    }, 3200)

    return () => clearInterval(timer)
  }, [isPlaying, milestones.length, onSelectCheckpoint])

  // --------------------------------------------------------------------------
  // 4. Subsystem Stability Over Time (Dynamically mapped to milestones count)
  // --------------------------------------------------------------------------
  const subsystemStatuses = useMemo(() => {
    const isGas = sourceAssetId.includes('OXYGEN') || sourceAssetId.includes('GAS')
    const isChiller = sourceAssetId.includes('CHILLER') || sourceAssetId.includes('HVAC')
    const isWater = sourceAssetId.includes('WATER') || sourceAssetId.includes('PUMP')
    const isPwr = isIncActive && !isGas && !isChiller && !isWater

    const numMilestones = milestones.length

    const getStates = (sysType) => {
      const arr = []
      for (let i = 0; i < numMilestones; i++) {
        if (!isIncActive) {
          arr.push('Normal')
          continue
        }
        if (sysType === 'elec') {
          if (isPwr) {
            arr.push(i === 0 ? 'Failed' : i === 1 ? 'Degraded' : i === 2 ? 'At Risk' : 'Failed')
          } else {
            arr.push('Normal')
          }
        } else if (sysType === 'hvac') {
          if (isChiller) {
            arr.push(i === 0 ? 'Failed' : i === 1 ? 'Failed' : 'Failed')
          } else if (isPwr) {
            arr.push(i === 0 ? 'Normal' : i === 1 ? 'Degraded' : 'At Risk')
          } else {
            arr.push('Normal')
          }
        } else if (sysType === 'medgas') {
          if (isGas) {
            arr.push(i === 0 ? 'Failed' : i === 1 ? 'Failed' : 'Failed')
          } else {
            arr.push('Normal')
          }
        } else if (sysType === 'water') {
          if (isWater) {
            arr.push(i === 0 ? 'Failed' : i === 1 ? 'Failed' : 'Failed')
          } else {
            arr.push('Normal')
          }
        }
      }
      return arr
    }

    return [
      {
        id: 'elec',
        name: 'Electrical Power',
        icon: Zap,
        color: '#00F0FF',
        currentStatus: isPwr ? 'Failed' : 'Normal',
        states: getStates('elec')
      },
      {
        id: 'hvac',
        name: 'Thermal HVAC',
        icon: Flame,
        color: '#FFB800',
        currentStatus: (isPwr || isChiller) ? 'Degraded' : 'Normal',
        states: getStates('hvac')
      },
      {
        id: 'medgas',
        name: 'Medical Gas',
        icon: Wind,
        color: '#A855F7',
        currentStatus: isGas ? 'Failed' : 'Normal',
        states: getStates('medgas')
      },
      {
        id: 'water',
        name: 'Water & Hydraulic',
        icon: Droplets,
        color: '#00A3FF',
        currentStatus: isWater ? 'Failed' : 'Normal',
        states: getStates('water')
      }
    ]
  }, [isIncActive, sourceAssetId, milestones.length])

  // --------------------------------------------------------------------------
  // 5. Clinical Service Continuity Matrix (Heatmap dynamically aligned)
  // --------------------------------------------------------------------------
  const serviceMatrix = useMemo(() => {
    const isGas = sourceAssetId.includes('OXYGEN') || sourceAssetId.includes('GAS')
    const isWater = sourceAssetId.includes('WATER') || sourceAssetId.includes('PUMP')
    const isHvac = sourceAssetId.includes('CHILLER') || sourceAssetId.includes('HVAC')
    const isPwr = isIncActive && !isGas && !isWater && !isHvac

    const baseServices = services.length > 0 ? services : [
      { id: 'SERVICE_ICU', name: 'Intensive Care Unit (ICU)', criticality: 5 },
      { id: 'SERVICE_OT', name: 'Operating Theatres (OT 1-4)', criticality: 5 },
      { id: 'SERVICE_ER', name: 'Emergency Trauma (ED)', criticality: 4 },
      { id: 'SERVICE_WARD', name: 'General Inpatient Wards', criticality: 3 },
      { id: 'SERVICE_ADMIN', name: 'Administrative & Facilities', criticality: 2 }
    ]

    const numMilestones = milestones.length

    return baseServices.map((srv) => {
      const states = []
      for (let i = 0; i < numMilestones; i++) {
        if (!isIncActive) {
          states.push('normal')
          continue
        }
        if (srv.id === 'SERVICE_ICU') {
          states.push(isGas ? (i === 0 ? 'at-risk' : 'failed') : isPwr ? (i === 0 ? 'normal' : i === 1 ? 'degraded' : 'at-risk') : isHvac ? (i === 0 ? 'normal' : 'degraded') : 'normal')
        } else if (srv.id === 'SERVICE_OT') {
          states.push((isGas || isHvac) ? 'failed' : isPwr ? (i === 0 ? 'degraded' : i === 1 ? 'at-risk' : 'failed') : 'normal')
        } else if (srv.id === 'SERVICE_ER') {
          states.push(isGas ? 'at-risk' : isPwr ? (i === 0 ? 'normal' : 'degraded') : 'normal')
        } else if (srv.id === 'SERVICE_WARD') {
          states.push(isPwr ? (i === 0 ? 'degraded' : 'at-risk') : isWater ? 'failed' : 'normal')
        } else {
          states.push(isPwr ? 'failed' : 'normal')
        }
      }

      return {
        id: srv.id,
        name: srv.name || srv.id,
        criticality: srv.criticality || 3,
        states
      }
    })
  }, [services, isIncActive, sourceAssetId, milestones.length])

  // --------------------------------------------------------------------------
  // 6. Multi-Temporal Metrics Table (Aligned to milestones)
  // --------------------------------------------------------------------------
  const metricsCols = useMemo(() => {
    return milestones.map((m) => {
      const score = m.score
      const atRiskSvcCount = isIncActive
        ? (score < 40 ? Math.min(5, affectedServiceNames.length + 1) : score < 65 ? Math.min(3, affectedServiceNames.length) : Math.max(1, affectedServiceNames.length - 1))
        : 0
      const affectedAssetCount = isIncActive
        ? (score < 40 ? Math.max(6, (incident?.affected_asset_ids?.length || 4) + 2) : score < 65 ? (incident?.affected_asset_ids?.length || 3) : 1)
        : 0

      return {
        t: m.t,
        label: m.label,
        score,
        atRiskSvcCount,
        affectedAssetCount,
        timeToImpact: m.idx === 0 ? (isIncActive ? '0 min' : '—') : (isIncActive ? `~${m.t_offset_min} min` : '—'),
        recoveryEst: isIncActive ? (m.idx >= milestones.length - 1 ? 'Stabilized' : `~${Math.max(15, 45 - m.t_offset_min)} min`) : 'Optimal'
      }
    })
  }, [milestones, isIncActive, affectedServiceNames.length, incident?.affected_asset_ids])

  // Quick failure injection helper
  const handleQuickInject = useCallback((assetId, failureType = 'complete_outage') => {
    if (onTriggerFailure) {
      onTriggerFailure({
        asset_id: assetId,
        failure_type: failureType,
        severity: 'high',
        duration_minutes: 60
      })
    }
  }, [onTriggerFailure])

  return (
    <div className="incident-timeline-page">
      {/* --------------------------------------------------------------------
          1. TOP MILESTONE PROGRESSION BAR & PLAYBACK SCRUBBER
          -------------------------------------------------------------------- */}
      <section className="timeline-progression-bar-card">
        <div className="progression-header-row">
          <div className="progression-title-wrap">
            <span className="prog-card-title">Incident Timeline & Temporal Propagation</span>
            <span className={`prog-status-pill ${isIncActive ? 'pill-active' : 'pill-baseline'}`}>
              <span className="status-dot" />
              {isIncActive ? 'LIVE SCENARIO ACTIVE' : 'NOMINAL BASELINE'}
            </span>
          </div>

          <div className="playback-controls">
            <button
              type="button"
              className={`play-toggle-btn ${isPlaying ? 'is-playing' : ''}`}
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}
              <span>{isPlaying ? 'Pause Playback' : 'Autoplay Sequence'}</span>
            </button>

            {isIncActive && onReset && (
              <button
                type="button"
                className="timeline-reset-btn"
                onClick={onReset}
              >
                <RotateCcw size={12} />
                <span>Restore Baseline</span>
              </button>
            )}
          </div>
        </div>

        {/* Milestone Nodes Track */}
        <div className="milestones-track-wrapper">
          <div className="milestones-track-line" />
          <div className="milestones-nodes-row">
            {milestones.map((m, idx) => {
              const isActive = idx === safeActiveIdx
              const isPast = idx <= safeActiveIdx
              return (
                <div
                  key={idx}
                  className={`prog-milestone-node ${isPast ? 'is-past' : ''} ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectCheckpoint && onSelectCheckpoint(idx)}
                >
                  <div className="milestone-dot-outer">
                    <span
                      className="milestone-dot-inner"
                      style={{ backgroundColor: m.color }}
                    />
                  </div>
                  <span className="milestone-time font-mono">{m.t}</span>
                  <span className="milestone-label">{m.label}</span>
                  <span className="milestone-score-badge font-mono" style={{ color: m.color }}>
                    {m.score} pts
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          2. MIDDLE 2-COLUMN SECTION:
             Left: 1. Incident Command Profile (Full backend metadata)
             Right: 2. Cascade Propagation Event Log (Chronological log)
          -------------------------------------------------------------------- */}
      <section className="timeline-middle-grid">
        {/* Card 1: Incident Command Profile */}
        <div className="timeline-panel-card">
          <div className="card-top-title-row">
            <span className="timeline-panel-title">1. Incident Command Profile</span>
            <span className={`incident-severity-badge ${isIncActive ? 'badge-alert' : 'badge-normal'}`}>
              {isIncActive ? (incident?.severity || 'HIGH').toUpperCase() : 'OPTIMAL'}
            </span>
          </div>

          {isIncActive ? (
            <div className="incident-active-content">
              <div className="incident-hero-box">
                <div className="hero-box-left">
                  <div className="hero-icon-wrap">
                    <Zap size={18} className="hero-lightning-icon" />
                  </div>
                  <div className="hero-titles">
                    <span className="hero-main-title">{sourceAsset.name} Failure</span>
                    <span className="hero-sub-id font-mono">Target Node: {sourceAsset.id}</span>
                  </div>
                </div>
                <span className="hero-status-tag">
                  {incident?.active_mitigation_strategy ? 'MITIGATING' : 'CASCADE ACTIVE'}
                </span>
              </div>

              <p className="incident-narrative">
                {incident?.description ||
                  `Unscheduled outage on ${sourceAsset.name}. Cascade propagation traversing dependent secondary distribution headers and acute clinical departments.`}
              </p>

              <div className="incident-specs-grid font-mono">
                <div className="spec-item">
                  <span className="spec-label">Source Asset</span>
                  <span className="spec-val text-accent">{sourceAsset.name}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Failure Type</span>
                  <span className="spec-val">{incident?.failure_type?.replace(/_/g, ' ') || 'Complete Outage'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Unmitigated Horizon</span>
                  <span className="spec-val text-red">
                    {incident?.estimated_unmitigated_blackout_min ? `${incident.estimated_unmitigated_blackout_min} Minutes` : '20 Minutes'}
                  </span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Active Strategy</span>
                  <span className="spec-val">
                    {incident?.active_mitigation_strategy ? incident.active_mitigation_strategy.toUpperCase() : 'None (Unmitigated)'}
                  </span>
                </div>
                <div className="spec-item col-full">
                  <span className="spec-label">Affected Systems ({affectedSubsystems.length})</span>
                  <span className="spec-val">
                    {affectedSubsystems.length > 0 ? affectedSubsystems.join(', ') : 'Electrical Power, Thermal HVAC'}
                  </span>
                </div>
                <div className="spec-item col-full">
                  <span className="spec-label">Compromised Services ({affectedServiceNames.length})</span>
                  <span className="spec-val text-red">
                    {affectedServiceNames.length > 0 ? affectedServiceNames.join(', ') : 'ICU, Operating Theatres, Emergency'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="incident-nominal-state">
              <div className="nominal-shield-wrap">
                <ShieldCheck size={32} className="shield-green" />
              </div>
              <h4 className="nominal-head">Hospital Infrastructure Baseline Intact</h4>
              <p className="nominal-sub">
                All 31 modeled infrastructure headers (Grid Utility, Transformers, Emergency Generators, Static UPS, Chiller Plants, Medical Oxygen) are operating in nominal steady state. Zero cascade threats active.
              </p>

              <div className="quick-test-section">
                <span className="quick-test-head">TRIGGER SIMULATED FAILURE (LIVE FASTAPI ENGINE):</span>
                <div className="quick-test-buttons">
                  <button
                    type="button"
                    className="test-btn btn-power"
                    onClick={() => handleQuickInject('GRID_MAIN', 'complete_outage')}
                  >
                    <Zap size={13} />
                    <span>11kV Grid Outage</span>
                  </button>
                  <button
                    type="button"
                    className="test-btn btn-chiller"
                    onClick={() => handleQuickInject('CHILLER_PLANT', 'thermal_overload')}
                  >
                    <Flame size={13} />
                    <span>Chiller Plant Trip</span>
                  </button>
                  <button
                    type="button"
                    className="test-btn btn-gas"
                    onClick={() => handleQuickInject('OXYGEN_MANIFOLD', 'pressure_loss')}
                  >
                    <Wind size={13} />
                    <span>Oxygen Manifold Drop</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Cascade Propagation Event Log */}
        <div className="timeline-panel-card">
          <div className="card-top-title-row">
            <div className="title-with-pill">
              <span className="timeline-panel-title">2. Cascade Propagation Event Log</span>
              <span className="event-count-pill font-mono">{filteredLogs.length} Events</span>
            </div>
            <select
              className="event-filter-select"
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="critical">Critical Only</option>
              <option value="warnings">Warnings & Alerts</option>
            </select>
          </div>

          <div className="event-logs-list">
            {filteredLogs.map((evt) => {
              const isSelected = evt.idx === safeActiveIdx
              return (
                <div
                  key={evt.id}
                  className={`event-card-item ${isSelected ? 'is-selected' : ''}`}
                  onClick={() => onSelectCheckpoint && onSelectCheckpoint(evt.idx)}
                >
                  <div className="event-item-left">
                    <span className="event-time-pill font-mono">{evt.time}</span>
                    <div className={`event-status-icon icon-${evt.type}`}>
                      {evt.type === 'cog' && <CogIcon size={12} />}
                      {evt.type === 'warn' && <AlertTriangle size={12} />}
                      {evt.type === 'critical' && <AlertTriangle size={12} />}
                      {evt.type === 'check' && <CheckCircle2 size={12} />}
                    </div>
                  </div>

                  <div className="event-item-body">
                    <div className="event-title-row">
                      <span className="event-name">{evt.title}</span>
                      <span className={`event-score-badge font-mono ${evt.score < 40 ? 'score-red' : evt.score < 70 ? 'score-amber' : 'score-green'}`}>
                        {evt.score}% Resilience
                      </span>
                    </div>
                    <p className="event-desc">{evt.desc}</p>
                    {evt.serviceImpact && (
                      <span className="event-impact-note">
                        <strong>Impact:</strong> {evt.serviceImpact}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. BOTTOM 3 ANALYTICAL PANELS:
             3. Subsystem Stability Over Time
             4. Clinical Service Continuity Matrix
             5. Multi-Temporal Resilience Metrics
          -------------------------------------------------------------------- */}
      <section className="timeline-bottom-grid">
        {/* Card 3: Subsystem Stability Over Time */}
        <div className="timeline-panel-card">
          <div className="card-top-title-row">
            <span className="timeline-panel-title">3. Subsystem Stability Over Time</span>
            <div className="legend-pills-row font-mono">
              <span><span className="leg-dot" style={{ backgroundColor: '#00F0FF' }} /> Electrical</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#FFB800' }} /> HVAC</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#A855F7' }} /> MedGas</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#00A3FF' }} /> Water</span>
            </div>
          </div>

          <div className="subsystems-flow-list">
            {subsystemStatuses.map((sys) => {
              const Icon = sys.icon
              return (
                <div key={sys.id} className="subsystem-row-item">
                  <div className="sys-header-info">
                    <div className="sys-icon-box" style={{ color: sys.color }}>
                      <Icon size={14} />
                    </div>
                    <span className="sys-title">{sys.name}</span>
                    <span className={`sys-status-badge badge-${sys.currentStatus.toLowerCase()}`}>
                      {sys.currentStatus}
                    </span>
                  </div>

                  <div className="sys-timeline-track">
                    {sys.states.map((st, i) => {
                      const isActiveCol = i === safeActiveIdx
                      const stClass = st.toLowerCase().replace(/\s+/g, '-')
                      return (
                        <div
                          key={i}
                          className={`sys-block block-${stClass} ${isActiveCol ? 'active-step' : ''}`}
                          title={`${sys.name} at ${milestones[i]?.t || `T+${i*5}m`}: ${st}`}
                        >
                          <span className="block-status-txt">{st}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            <div className="timeline-axis-ticks font-mono">
              <span className="axis-pad" />
              <div className="axis-ticks-row">
                {milestones.map((m, idx) => (
                  <span
                    key={idx}
                    className={`axis-tick-item ${idx === safeActiveIdx ? 'active-tick' : ''}`}
                    onClick={() => onSelectCheckpoint && onSelectCheckpoint(idx)}
                  >
                    {m.t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Clinical Service Continuity Matrix (Heatmap) */}
        <div className="timeline-panel-card">
          <div className="card-top-title-row">
            <span className="timeline-panel-title">4. Clinical Service Continuity Matrix</span>
            <div className="legend-pills-row font-mono">
              <span><span className="leg-dot" style={{ backgroundColor: '#00E5A3' }} /> Normal</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#FFB800' }} /> Degraded</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#FF7A00' }} /> At Risk</span>
              <span><span className="leg-dot" style={{ backgroundColor: '#FF4D4D' }} /> Failed</span>
            </div>
          </div>

          <div className="service-matrix-table">
            <div className="matrix-thead-row font-mono">
              <span className="matrix-col-dept">Clinical Department</span>
              {milestones.map((m, idx) => (
                <span
                  key={idx}
                  className={`matrix-col-time ${idx === safeActiveIdx ? 'active-col' : ''}`}
                  onClick={() => onSelectCheckpoint && onSelectCheckpoint(idx)}
                >
                  {m.t}
                </span>
              ))}
            </div>

            <div className="matrix-tbody">
              {serviceMatrix.map((row) => (
                <div key={row.id} className="matrix-trow">
                  <div className="dept-meta-col">
                    <span className="dept-name">{row.name}</span>
                    <span className="dept-stars">{'★'.repeat(row.criticality)}</span>
                  </div>
                  {row.states.map((st, i) => (
                    <div
                      key={i}
                      className={`matrix-state-cell state-${st} ${i === safeActiveIdx ? 'active-col-cell' : ''}`}
                      title={`${row.name} at ${milestones[i]?.t}: ${st.toUpperCase()}`}
                    >
                      <span className="cell-dot" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 5: Multi-Temporal Quantitative Resilience Metrics Table */}
        <div className="timeline-panel-card">
          <div className="card-top-title-row">
            <span className="timeline-panel-title">5. Multi-Temporal Resilience Metrics</span>
            <span className="active-metric-pill font-mono">
              Active: {currentCheckpoint.t}
            </span>
          </div>

          <div className="metrics-table-wrapper font-mono">
            <table className="temporal-metrics-table">
              <thead>
                <tr>
                  <th className="th-metric font-sans">Metric</th>
                  {metricsCols.map((c, i) => (
                    <th key={i} className={i === safeActiveIdx ? 'th-active' : ''}>
                      {c.t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-metric font-sans">Critical Services At Risk</td>
                  {metricsCols.map((c, i) => (
                    <td key={i} className={i === safeActiveIdx ? 'td-active' : ''}>
                      <span className={c.atRiskSvcCount > 0 ? 'txt-red' : 'txt-green'}>
                        {c.atRiskSvcCount} {c.atRiskSvcCount === 1 ? 'service' : 'services'}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="td-metric font-sans">Affected Infrastructure Assets</td>
                  {metricsCols.map((c, i) => (
                    <td key={i} className={i === safeActiveIdx ? 'td-active' : ''}>
                      <span>{c.affectedAssetCount} nodes</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="td-metric font-sans">Composite Resilience Index (R)</td>
                  {metricsCols.map((c, i) => (
                    <td key={i} className={i === safeActiveIdx ? 'td-active' : ''}>
                      <span className={`score-tag ${c.score < 40 ? 'tag-red' : c.score < 70 ? 'tag-amber' : 'tag-green'}`}>
                        {c.score} / 100
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="td-metric font-sans">Time to Primary Impact</td>
                  {metricsCols.map((c, i) => (
                    <td key={i} className={i === safeActiveIdx ? 'td-active' : ''}>
                      <span>{c.timeToImpact}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="td-metric font-sans">Estimated Containment / Recovery</td>
                  {metricsCols.map((c, i) => (
                    <td key={i} className={i === safeActiveIdx ? 'td-active' : ''}>
                      <span>{c.recoveryEst}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
