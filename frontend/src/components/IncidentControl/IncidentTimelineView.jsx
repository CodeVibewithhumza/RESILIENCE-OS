import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './IncidentTimelineView.css'

export default function IncidentTimelineView({
  incident,
  timeline = [],
  activeCheckpointIndex = 0,
  onSelectCheckpoint,
  onNextCheckpoint,
  onOpenExplainability,
  onReset,
  assets = [],
  services = [],
  resilience
}) {
  const isIncidentActive = incident?.is_active || false
  const sourceAsset = incident?.source_asset_id || 'GRID_MAIN'
  const severity = incident?.severity || 'HIGH'
  const affectedAssets = incident?.affected_asset_ids || (isIncidentActive ? [sourceAsset] : [])
  const affectedServices = incident?.affected_service_ids || []

  const activeStep = timeline[activeCheckpointIndex] || timeline[0] || {
    t_offset_min: 0,
    title: 'Baseline Operational State',
    description: 'All hospital infrastructure systems operating within nominal design tolerances.',
    system_resilience_score: 94.5
  }

  // Pre-configured 5 milestones for timeline progression bar
  const milestones = [
    { t: 0, label: 'Initial Fault', sub: 'Primary node failure' },
    { t: 5, label: 'Cascade Triggered', sub: 'Chiller offline, UPS active' },
    { t: 15, label: 'Backup Engaged', sub: 'Emergency gen online' },
    { t: 30, label: 'Secondary Impact', sub: 'Clinical throttling' },
    { t: 45, label: 'Stabilization', sub: 'Mitigation applied' }
  ]

  // Chronological event logs
  const eventLogs = isIncidentActive && incident?.timeline?.length > 0
    ? incident.timeline.map((step, idx) => ({
        id: `log-${idx}`,
        time: `T+${String(step.t_offset_min ?? idx * 5).padStart(2, '0')}:00`,
        title: step.title || 'Cascade Step',
        desc: step.description,
        type: idx === 0 ? 'critical' : idx === 1 ? 'warning' : 'normal',
        node: step.target_node_id || sourceAsset
      }))
    : [
        {
          id: 'l1',
          time: 'T+00:00',
          title: `Primary Disruption: ${sourceAsset}`,
          desc: 'Sudden loss of primary power feed from utility substation.',
          type: 'critical',
          node: sourceAsset
        },
        {
          id: 'l2',
          time: 'T+02:15',
          title: 'UPS Battery Bank Engaged',
          desc: 'Critical care circuits transferred seamlessly without power gap.',
          type: 'warning',
          node: 'UPS_CRITICAL'
        },
        {
          id: 'l3',
          time: 'T+05:00',
          title: 'Chiller Plant Secondary Trip',
          desc: 'HVAC compressors shut down to conserve emergency battery capacity.',
          type: 'warning',
          node: 'CHILLER_PLANT'
        },
        {
          id: 'l4',
          time: 'T+12:30',
          title: 'Emergency Generator 1 Online',
          desc: 'Diesel generator reaches nominal speed and synchronizes to emergency bus.',
          type: 'normal',
          node: 'GEN_01'
        }
      ]

  return (
    <div className="incident-timeline-page">
      {/* 1. TOP MILESTONE PROGRESSION BAR */}
      <section className="timeline-progression-bar-card">
        <div className="progression-header">
          <div className="progression-title-group">
            <Clock size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span className="progression-title">Cascade Horizon Progression</span>
            <span className="progression-sub font-mono">
              {isIncidentActive
                ? `Active Simulation • T+${activeStep.t_offset_min ?? 0}m Current`
                : 'Deterministic Operational Horizon'}
            </span>
          </div>

          <div className="progression-controls">
            <button
              type="button"
              className="prog-btn prog-next-btn"
              onClick={onNextCheckpoint}
              disabled={!isIncidentActive || activeCheckpointIndex >= timeline.length - 1}
            >
              <span>Next Checkpoint</span>
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              className="prog-btn prog-reset-btn"
              onClick={onReset}
              title="Reset simulation to T+0 baseline"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        {/* Sequential Milestone Track */}
        <div className="milestones-track">
          {milestones.map((m, idx) => {
            const isCompleted = activeCheckpointIndex > idx
            const isCurrent = activeCheckpointIndex === idx
            const isLast = idx === milestones.length - 1

            return (
              <div
                key={m.t}
                className={`milestone-node ${isCurrent ? 'is-current' : ''} ${
                  isCompleted ? 'is-completed' : ''
                }`}
                onClick={() => onSelectCheckpoint && onSelectCheckpoint(idx)}
                role="button"
                tabIndex={0}
              >
                <div className="milestone-indicator-row">
                  <div className="milestone-dot">
                    {isCompleted ? (
                      <CheckCircle2 size={12} />
                    ) : isCurrent ? (
                      <span className="current-pulse-dot" />
                    ) : (
                      <span className="font-mono">{idx + 1}</span>
                    )}
                  </div>
                  {!isLast && <div className="milestone-line" />}
                </div>

                <div className="milestone-content">
                  <span className="milestone-time font-mono">T+{m.t}m</span>
                  <span className="milestone-label">{m.label}</span>
                  <span className="milestone-sub">{m.sub}</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. MIDDLE 3-COLUMN WORKSPACE: Active Incident + 3D Viewport + Event Log */}
      <section className="timeline-middle-grid">
        {/* Column 1: Active Incident Card */}
        <div className="timeline-col-card active-incident-panel">
          <div className="card-header-row">
            <span className="card-heading">Active Incident</span>
            <span
              className={`badge font-mono ${
                isIncidentActive ? 'badge-critical' : 'badge-normal'
              }`}
            >
              {isIncidentActive ? 'OUTAGE ACTIVE' : 'NOMINAL'}
            </span>
          </div>

          <div className="incident-id-box">
            <span className="incident-code font-mono">
              {incident?.incident_id || 'INC-2026-0926-01'}
            </span>
            <span className="incident-name-sub">
              {incident?.title || `Primary Disruption on ${sourceAsset}`}
            </span>
          </div>

          <div className="incident-specs-list">
            <div className="spec-row">
              <span className="spec-k">Source Node:</span>
              <span className="spec-v font-mono">{sourceAsset}</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Severity Level:</span>
              <span
                className="spec-v font-mono"
                style={{ color: isIncidentActive ? 'var(--status-critical)' : 'var(--status-normal)' }}
              >
                {severity.toUpperCase()}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Cascade Depth:</span>
              <span className="spec-v font-mono">
                {isIncidentActive ? `${affectedAssets.length} Nodes Impacted` : '0 Nodes (Nominal)'}
              </span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Current Resilience:</span>
              <span
                className="spec-v font-mono"
                style={{ color: resilience?.status_color || '#10b981' }}
              >
                {resilience?.overall_score?.toFixed(1) || '94.5'}%
              </span>
            </div>
          </div>

          {/* Affected Services Impact List */}
          <div className="affected-services-section">
            <span className="affected-section-title">Clinical Risk Assessment</span>
            <div className="services-chips-wrap">
              {services.map((svc) => (
                <div
                  key={svc.id}
                  className={`service-status-chip ${svc.at_risk ? 'is-at-risk' : 'is-nominal'}`}
                >
                  <span className="chip-dot" />
                  <span className="chip-name font-mono">{(svc.id || '').replace('SERVICE_', '')}</span>
                  <span className="chip-status">
                    {svc.at_risk ? 'At Risk' : '100%'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="incident-explain-btn"
            onClick={onOpenExplainability}
          >
            <Activity size={14} />
            <span>Open Causal Explanation</span>
          </button>
        </div>

        {/* Column 2: Temporal State (3D View) Preview */}
        <div className="timeline-col-card temporal-twin-panel">
          <div className="card-header-row">
            <div className="twin-title-group">
              <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
              <span className="card-heading">Temporal State (3D Twin)</span>
            </div>
            <span className="badge badge-cyan font-mono">
              T+{activeStep.t_offset_min ?? 0}m Snapshot
            </span>
          </div>

          <div className="temporal-canvas-wrapper">
            <TwinContainer
              assets={assets}
              services={services}
              selectedAssetId={sourceAsset}
            />
          </div>

          {/* Scrubber slider bar */}
          <div className="temporal-scrubber-row">
            <span className="scrubber-label font-mono">T+0</span>
            <input
              type="range"
              min="0"
              max={Math.max(timeline.length - 1, 4)}
              value={activeCheckpointIndex}
              onChange={(e) => onSelectCheckpoint && onSelectCheckpoint(Number(e.target.value))}
              className="temporal-slider"
            />
            <span className="scrubber-label font-mono">T+45m</span>
          </div>
        </div>

        {/* Column 3: Event Log Card */}
        <div className="timeline-col-card event-log-panel">
          <div className="card-header-row">
            <span className="card-heading">Cascade Event Log</span>
            <span className="badge badge-subtle font-mono">CHRONOLOGICAL</span>
          </div>

          <div className="event-log-list">
            {eventLogs.map((log) => (
              <div key={log.id} className="event-log-item">
                <div className="log-top-row">
                  <span className="log-time-tag font-mono">{log.time}</span>
                  <span className="log-node font-mono">{log.node}</span>
                </div>
                <div className="log-title-row">
                  <span
                    className={`log-status-dot ${
                      log.type === 'critical'
                        ? 'dot-critical'
                        : log.type === 'warning'
                        ? 'dot-warning'
                        : 'dot-normal'
                    }`}
                  />
                  <span className="log-title">{log.title}</span>
                </div>
                <p className="log-desc">{log.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. BOTTOM ROW: Status Over Time + Service Impact + Key Metrics */}
      <section className="timeline-bottom-grid">
        {/* Card 1: System Status Over Time */}
        <div className="timeline-col-card bottom-card">
          <div className="card-header-row">
            <span className="card-heading">System Status Over Time</span>
            <div className="timeline-chart-legend font-mono">
              <span className="leg-cyan">● Power</span>
              <span className="leg-blue">● Water</span>
              <span className="leg-green">● HVAC</span>
            </div>
          </div>

          <div className="timeline-chart-wrap">
            <svg className="timeline-chart-svg" viewBox="0 0 320 80" preserveAspectRatio="none">
              <line x1="0" y1="20" x2="320" y2="20" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="45" x2="320" y2="45" stroke="var(--border-subtle)" strokeDasharray="3 3" />
              <line x1="0" y1="70" x2="320" y2="70" stroke="var(--border-subtle)" strokeDasharray="3 3" />

              {/* Power curve (drop and recover) */}
              <polyline
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2"
                points="0,15 60,18 100,68 180,62 260,35 320,20"
              />
              {/* Water curve */}
              <polyline
                fill="none"
                stroke="#0284c7"
                strokeWidth="2"
                points="0,22 80,24 140,40 220,38 320,24"
              />
              {/* HVAC curve */}
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="2"
                points="0,25 70,25 120,55 240,50 320,30"
              />
            </svg>
            <div className="timeline-chart-axis font-mono">
              <span>T+0</span>
              <span>T+15m</span>
              <span>T+30m</span>
              <span>T+45m</span>
              <span>T+60m</span>
            </div>
          </div>
        </div>

        {/* Card 2: Service Impact Timeline */}
        <div className="timeline-col-card bottom-card">
          <div className="card-header-row">
            <span className="card-heading">Service Impact Timeline</span>
            <span className="card-sub font-mono">CLINICAL CONTINUITY</span>
          </div>

          <div className="service-heatmap-grid">
            {['ICU', 'Surgery (OT)', 'Emergency (ER)', 'Neonatal (NICU)'].map((svcName, idx) => (
              <div key={svcName} className="heatmap-row">
                <span className="heatmap-svc-label font-mono">{svcName}</span>
                <div className="heatmap-cells-track">
                  <div className={`hm-cell ${idx === 0 && isIncidentActive ? 'hm-critical' : 'hm-nominal'}`} title="T+0" />
                  <div className={`hm-cell ${idx <= 1 && isIncidentActive ? 'hm-warning' : 'hm-nominal'}`} title="T+15m" />
                  <div className={`hm-cell ${idx <= 2 && isIncidentActive ? 'hm-warning' : 'hm-nominal'}`} title="T+30m" />
                  <div className="hm-cell hm-nominal" title="T+45m" />
                  <div className="hm-cell hm-nominal" title="T+60m" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Key Metrics */}
        <div className="timeline-col-card bottom-card">
          <div className="card-header-row">
            <span className="card-heading">Key Metrics</span>
            <span className="card-sub font-mono">IMPACT ASSESSMENT</span>
          </div>

          <div className="timeline-metrics-grid">
            <div className="tm-metric-box">
              <span className="tm-metric-val font-mono">
                {isIncidentActive ? affectedAssets.length : 0}
              </span>
              <span className="tm-metric-lbl">Affected Assets</span>
            </div>
            <div className="tm-metric-box">
              <span
                className="tm-metric-val font-mono"
                style={{ color: affectedServices.length > 0 ? 'var(--status-critical)' : 'var(--text-primary)' }}
              >
                {affectedServices.length}
              </span>
              <span className="tm-metric-lbl">At-Risk Services</span>
            </div>
            <div className="tm-metric-box">
              <span className="tm-metric-val font-mono">42 min</span>
              <span className="tm-metric-lbl">Est. Recovery</span>
            </div>
            <div className="tm-metric-box">
              <span
                className="tm-metric-val font-mono"
                style={{ color: isIncidentActive ? 'var(--status-critical)' : 'var(--status-normal)' }}
              >
                {isIncidentActive ? '-28.5' : '0.0'} pts
              </span>
              <span className="tm-metric-lbl">Resilience Impact</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
