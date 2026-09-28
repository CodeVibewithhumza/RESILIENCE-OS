import { useState } from 'react'
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Maximize2,
  Settings as CogIcon,
  ChevronRight,
  Info
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './IncidentTimelineView.css'

const TIMELINE_MILESTONES = [
  { t: 'T+0 min', label: 'Incident Triggered', color: '#FF4D4D' },
  { t: 'T+2 min', label: 'Initial Impact', color: '#FF7A00' },
  { t: 'T+5 min', label: 'Cascade Propagation', color: '#FFB800' },
  { t: 'T+10 min', label: 'Critical Services Affected', color: '#FFD600' },
  { t: 'T+18 min', label: 'Intervention Applied', color: '#00A3FF' },
  { t: 'T+30 min', label: 'Recovery in Progress', color: '#00F0FF' },
  { t: 'T+45 min', label: 'Stabilized', color: '#00E5A3' }
]

const EVENT_LOGS = [
  { time: '10:24 AM (T+0)', title: 'Primary transformer Failure detected', desc: 'Main transformer offline. Grid supply lost.', type: 'cog' },
  { time: '10:25 AM (T+1)', title: 'UPS supplying critical loads', desc: 'ICU, Emergency and OT shifted to UPS.', type: 'cog' },
  { time: '10:26 AM (T+2)', title: 'Generator auto-start initiated', desc: 'Generator starting (estimated 3 minutes).', type: 'cog' },
  { time: '10:29 AM (T+5)', title: 'HVAC capacity reduced', desc: 'Chillers running at limited capacity. Non-critical areas affected.', type: 'warn' },
  { time: '10:32 AM (T+8)', title: 'Medical gas pressure drop', desc: 'Pressure below threshold in secondary line.', type: 'warn' },
  { time: '10:34 AM (T+10)', title: 'ICU services at risk', desc: 'Temperature and air handling outside safe range.', type: 'critical' },
  { time: '10:42 AM (T+18)', title: 'Intervention applied', desc: 'Strategy A: Use Backup Generator.', type: 'cog' },
  { time: '10:50 AM (T+26)', title: 'Systems stabilizing', desc: 'HVAC and medical gas recovering.', type: 'cog' },
  { time: '11:09 AM (T+45)', title: 'Incident stabilized', desc: 'All critical services restored to normal.', type: 'check' }
]

export default function IncidentTimelineView({
  incident,
  timeline = [],
  activeCheckpointIndex = 3,
  onSelectCheckpoint,
  onNextCheckpoint,
  onOpenExplainability,
  onReset,
  assets = [],
  services = [],
  resilience
}) {
  const [selectedEventFilter, setSelectedEventFilter] = useState('all')
  const [currentTimeStep, setCurrentTimeStep] = useState('T+10m')
  const [viewMode, setViewMode] = useState('3d') // '3d' | '2d'

  // Temporal 3D HUD Pins at T+10m
  const temporalPins = [
    { id: 'TRANSFORMER', label: 'Transformer', status: 'Failed', top: '38%', left: '44%', color: 'red' },
    { id: 'GEN_01', label: 'Generator', status: 'Starting', top: '32%', left: '53%', color: 'orange' },
    { id: 'HVAC_PLANT', label: 'HVAC Plant', status: 'Degraded', top: '32%', left: '69%', color: 'orange' },
    { id: 'MAIN_HOSPITAL', label: 'Main Hospital', status: 'Partial Power', top: '40%', left: '59%', color: 'orange' },
    { id: 'MED_GAS_PLANT', label: 'Medical Gas Plant', status: 'Normal', top: '43%', left: '73%', color: 'cyan' },
    { id: 'SERVICE_ICU', label: 'ICU', status: 'At Risk', top: '50%', left: '48%', color: 'red' },
    { id: 'SERVICE_ER', label: 'Emergency', status: 'Stable', top: '56%', left: '56%', color: 'cyan' },
    { id: 'SERVICE_OT', label: 'OT', status: 'At Risk', top: '51%', left: '68%', color: 'orange' }
  ]

  // Service impact matrix rows
  const serviceMatrixRows = [
    { name: 'Emergency', t0: 'normal', t5: 'normal', t10: 'normal', t15: 'normal', t30: 'normal', t45: 'normal' },
    { name: 'ICU', t0: 'normal', t5: 'degraded', t10: 'risk', t15: 'risk', t30: 'degraded', t45: 'normal' },
    { name: 'OT', t0: 'normal', t5: 'degraded', t10: 'risk', t15: 'risk', t30: 'degraded', t45: 'normal' },
    { name: 'Wards', t0: 'normal', t5: 'normal', t10: 'degraded', t15: 'degraded', t30: 'normal', t45: 'normal' },
    { name: 'OPD', t0: 'normal', t5: 'normal', t10: 'normal', t15: 'normal', t30: 'normal', t45: 'normal' },
    { name: 'Laboratory', t0: 'normal', t5: 'normal', t10: 'normal', t15: 'normal', t30: 'normal', t45: 'normal' },
    { name: 'Radiology', t0: 'normal', t5: 'normal', t10: 'normal', t15: 'normal', t30: 'normal', t45: 'normal' }
  ]

  return (
    <div className="incident-timeline-page">
      {/* 1. TOP MILESTONE PROGRESSION BAR */}
      <section className="timeline-progression-bar-card">
        <div className="milestones-track-wrapper">
          <div className="milestone-gradient-line" />
          <div className="milestones-nodes-row">
            {TIMELINE_MILESTONES.map((m, idx) => (
              <div
                key={m.t}
                className={`prog-milestone-node ${idx <= 3 ? 'is-past' : ''} ${idx === 3 ? 'is-active' : ''}`}
              >
                <div className="milestone-dot-wrap">
                  <span className="milestone-dot" style={{ backgroundColor: m.color }} />
                </div>
                <span className="milestone-time font-mono">{m.t}</span>
                <span className="milestone-label">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. MIDDLE 3-COLUMN WORKSPACE: 1. Active Incident, 2. 3D View with Scrubber, 3. Event Log */}
      <section className="timeline-middle-grid">
        {/* Column 1: 1. Active Incident */}
        <aside className="timeline-active-incident-card">
          <div className="incident-card-header">
            <span className="incident-card-title">1. Active Incident</span>
          </div>

          <div className="incident-title-box">
            <div className="incident-title-left">
              <Zap size={16} className="incident-lightning-icon" />
              <span className="incident-main-name">Primary Transformer Failure</span>
            </div>
            <span className="incident-critical-badge font-mono">Critical</span>
          </div>

          <p className="incident-description-text">
            Loss of main transformer supply in electrical system causing cascading impact on hospital infrastructure.
          </p>

          <div className="incident-specs-table font-mono">
            <div className="spec-row">
              <span className="spec-k">Start Time</span>
              <span className="spec-v">20 Sep 2026, 10:24 AM (T+0)</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Duration</span>
              <span className="spec-v">2 Hours (Simulated)</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Severity</span>
              <span className="spec-v text-red">High</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Status</span>
              <span className="spec-v text-red">In Progress</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Affected Systems</span>
              <span className="spec-v font-sans">Electrical, HVAC, Medical Gas</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Affected Services</span>
              <span className="spec-v font-sans">ICU, OT, Emergency, Wards</span>
            </div>
            <div className="spec-row">
              <span className="spec-k">Simulation ID</span>
              <span className="spec-v">SIM-20260920-001</span>
            </div>
          </div>
        </aside>

        {/* Column 2: 2. Temporal Infrastructure State (3D View) with Scrubber */}
        <div className="timeline-temporal-card">
          <div className="temporal-card-header">
            <span className="temporal-card-title">2. Temporal Infrastructure State (3D View)</span>
            <div className="temporal-controls-right">
              <div className="twin-view-mode-toggle">
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === '3d' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('3d')}
                >
                  3D View
                </button>
                <button
                  type="button"
                  className={`view-mode-btn ${viewMode === '2d' ? 'is-active' : ''}`}
                  onClick={() => setViewMode('2d')}
                >
                  2D Schematic
                </button>
              </div>
              <button type="button" className="temporal-expand-btn"><Maximize2 size={12} /></button>
            </div>
          </div>

          <div className="temporal-canvas-viewport">
            <TwinContainer
              assets={assets}
              services={services}
              incident={incident}
            />

            {/* Top-left Time Indicator Badge */}
            <div className="temporal-time-badge font-mono">
              <span>T + 10 min</span>
            </div>

            {/* Temporal HUD Pins */}
            <div className="temporal-pins-layer">
              {temporalPins.map((pin) => (
                <div key={pin.id} className={`temporal-hud-pin pin-${pin.color}`} style={{ top: pin.top, left: pin.left }}>
                  <span className="t-pin-icon">{pin.color === 'red' ? '⚡' : '●'}</span>
                  <div className="t-pin-text">
                    <span className="t-pin-name">{pin.label}</span>
                    <span className="t-pin-status font-mono">{pin.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Scrubber Bar */}
            <div className="temporal-scrubber-bar">
              <button type="button" className="scrubber-play-btn">
                <Play size={12} fill="currentColor" />
              </button>

              <div className="scrubber-track-wrap">
                <div className="scrubber-track-line">
                  <div className="scrubber-progress-fill" style={{ width: '45%' }} />
                  <span className="scrubber-thumb" style={{ left: '45%' }} />
                </div>
                <div className="scrubber-ticks font-mono">
                  <span className={currentTimeStep === 'T+0' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+0')}>T+0</span>
                  <span className={currentTimeStep === 'T+5m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+5m')}>T+5m</span>
                  <span className={currentTimeStep === 'T+10m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+10m')}>T+10m</span>
                  <span className={currentTimeStep === 'T+15m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+15m')}>T+15m</span>
                  <span className={currentTimeStep === 'T+20m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+20m')}>T+20m</span>
                  <span className={currentTimeStep === 'T+30m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+30m')}>T+30m</span>
                  <span className={currentTimeStep === 'T+45m' ? 'active-tick' : ''} onClick={() => setCurrentTimeStep('T+45m')}>T+45m</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: 3. Event Log */}
        <aside className="timeline-event-log-card">
          <div className="event-log-header">
            <span className="event-log-title">3. Event Log</span>
            <select
              className="event-filter-select font-mono"
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="critical">Critical Only</option>
              <option value="warnings">Warnings</option>
            </select>
          </div>

          <div className="event-logs-list-scroll">
            {EVENT_LOGS.map((evt, idx) => (
              <div key={idx} className="event-log-item">
                <div className="event-log-left-col">
                  <span className="event-time-tag font-mono">{evt.time}</span>
                  <div className={`event-icon-circle ${evt.type}`}>
                    {evt.type === 'cog' && <CogIcon size={12} />}
                    {evt.type === 'warn' && <AlertTriangle size={12} />}
                    {evt.type === 'critical' && <AlertTriangle size={12} />}
                    {evt.type === 'check' && <CheckCircle2 size={12} />}
                  </div>
                </div>
                <div className="event-log-content">
                  <span className="event-item-title">{evt.title}</span>
                  <span className="event-item-desc">{evt.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* 3. BOTTOM 3 CARDS: 4. System Status, 5. Service Impact Timeline, 6. Key Metrics */}
      <section className="timeline-bottom-grid">
        {/* Card 4: System Status Over Time Step Chart */}
        <div className="timeline-panel-card">
          <div className="panel-header-with-legend">
            <span className="timeline-panel-title">4. System Status Over Time</span>
            <div className="chart-legend-row font-mono">
              <span><span className="dot" style={{ backgroundColor: '#00F0FF' }} /> Electrical</span>
              <span><span className="dot" style={{ backgroundColor: '#00A3FF' }} /> Water</span>
              <span><span className="dot" style={{ backgroundColor: '#FFB800' }} /> HVAC</span>
              <span><span className="dot" style={{ backgroundColor: '#A855F7' }} /> Medical Gas</span>
            </div>
          </div>

          <div className="step-chart-container">
            <div className="step-y-axis">
              <span>Normal</span>
              <span>Degraded</span>
              <span>At Risk</span>
              <span>Failed</span>
            </div>
            <div className="step-svg-wrap">
              <svg className="step-chart-svg" viewBox="0 0 300 100" preserveAspectRatio="none">
                <line x1="0" y1="10" x2="300" y2="10" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="40" x2="300" y2="40" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="70" x2="300" y2="70" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="95" x2="300" y2="95" stroke="var(--border-subtle)" />

                {/* Electrical (Cyan): Normal -> Failed -> Step Recovery */}
                <path
                  d="M0,10 L30,10 L30,95 L120,95 L120,70 L180,70 L180,40 L240,40 L240,10 L300,10"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="2"
                />

                {/* HVAC (Orange): Normal -> Degraded -> Normal */}
                <path
                  d="M0,10 L60,10 L60,70 L180,70 L180,40 L260,40 L260,10 L300,10"
                  fill="none"
                  stroke="#FFB800"
                  strokeWidth="2"
                />

                {/* Medical Gas (Purple): Normal -> At Risk -> Normal */}
                <path
                  d="M0,10 L100,10 L100,40 L200,40 L200,10 L300,10"
                  fill="none"
                  stroke="#A855F7"
                  strokeWidth="2"
                />

                {/* Water (Blue): Remains Normal */}
                <path
                  d="M0,10 L300,10"
                  fill="none"
                  stroke="#00A3FF"
                  strokeWidth="2"
                />
              </svg>

              <div className="step-x-axis font-mono">
                <span>T+0</span>
                <span>T+5m</span>
                <span>T+10m</span>
                <span>T+15m</span>
                <span>T+20m</span>
                <span>T+30m</span>
                <span>T+45m</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 5: Service Impact Timeline Heatmap Matrix */}
        <div className="timeline-panel-card">
          <div className="panel-header-with-legend">
            <span className="timeline-panel-title">5. Service Impact Timeline</span>
            <div className="chart-legend-row font-mono">
              <span><span className="dot" style={{ backgroundColor: '#00E5A3' }} /> Normal</span>
              <span><span className="dot" style={{ backgroundColor: '#FFB800' }} /> Degraded</span>
              <span><span className="dot" style={{ backgroundColor: '#FF7A00' }} /> At Risk</span>
              <span><span className="dot" style={{ backgroundColor: '#FF4D4D' }} /> Failed</span>
            </div>
          </div>

          <div className="heatmap-matrix-wrapper">
            <div className="matrix-grid font-mono">
              <div className="matrix-header-row">
                <span className="matrix-cell-empty" />
                <span>T+0</span>
                <span>T+5m</span>
                <span>T+10m</span>
                <span>T+15m</span>
                <span>T+30m</span>
                <span>T+45m</span>
              </div>
              {serviceMatrixRows.map((row) => (
                <div key={row.name} className="matrix-data-row">
                  <span className="matrix-row-label font-sans">{row.name}</span>
                  <span className={`matrix-block block-${row.t0}`} />
                  <span className={`matrix-block block-${row.t5}`} />
                  <span className={`matrix-block block-${row.t10}`} />
                  <span className={`matrix-block block-${row.t15}`} />
                  <span className={`matrix-block block-${row.t30}`} />
                  <span className={`matrix-block block-${row.t45}`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 6: Key Metrics at Selected Times Table */}
        <div className="timeline-panel-card">
          <span className="timeline-panel-title">6. Key Metrics at Selected Times</span>
          <div className="metrics-table-scroll font-mono">
            <table className="timeline-metrics-table">
              <thead>
                <tr>
                  <th className="th-left font-sans">Metric</th>
                  <th>T+0</th>
                  <th>T+10m</th>
                  <th>T+30m</th>
                  <th>T+45m</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="td-left font-sans">Total Services At Risk</td>
                  <td>2</td>
                  <td>5</td>
                  <td>3</td>
                  <td>0</td>
                </tr>
                <tr>
                  <td className="td-left font-sans">Affected Assets</td>
                  <td>6</td>
                  <td>12</td>
                  <td>8</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td className="td-left font-sans">Resilience Index</td>
                  <td style={{ color: '#00E5A3' }}>82</td>
                  <td style={{ color: '#FF4D4D' }}>38</td>
                  <td style={{ color: '#FFB800' }}>62</td>
                  <td style={{ color: '#00E5A3' }}>78</td>
                </tr>
                <tr>
                  <td className="td-left font-sans">Time to First Impact</td>
                  <td>-</td>
                  <td>~8 min</td>
                  <td>-</td>
                  <td>-</td>
                </tr>
                <tr>
                  <td className="td-left font-sans">Estimated Recovery</td>
                  <td>-</td>
                  <td>~4 hours</td>
                  <td>~1.5 hours</td>
                  <td>-</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}
