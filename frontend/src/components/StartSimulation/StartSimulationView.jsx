import { useState } from 'react'
import {
  Play,
  RotateCcw,
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Info,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Clock,
  Box,
  ChevronRight
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './StartSimulationView.css'

const CATEGORY_TILES = [
  {
    id: 'electrical',
    name: 'Electrical Failure',
    sub: 'Grid / Transformer / DG / UPS',
    icon: Zap,
    color: '#00F0FF'
  },
  {
    id: 'water',
    name: 'Water System',
    sub: 'Supply / Pump / Tank',
    icon: Droplets,
    color: '#00A3FF'
  },
  {
    id: 'hvac',
    name: 'HVAC System',
    sub: 'Chiller / AHU / Ducts',
    icon: Wind,
    color: '#14B8A6'
  },
  {
    id: 'gas',
    name: 'Medical Gas System',
    sub: 'Oxygen / Air / Vacuum',
    icon: Flame,
    color: '#00F0FF'
  },
  {
    id: 'combined',
    name: 'Combined Scenario',
    sub: 'Multiple simultaneous failures',
    icon: AlertTriangle,
    color: '#FF4D4D'
  }
]

const INCIDENTS_BY_CATEGORY = {
  electrical: [
    {
      id: 'transformer',
      name: 'Primary Transformer Failure',
      desc: 'Loss of main transformer supply',
      asset_id: 'TRANSFORMER_01',
      failure_type: 'transformer_thermal_trip'
    },
    {
      id: 'grid',
      name: 'Grid Power Outage',
      desc: 'Loss of external grid supply',
      asset_id: 'GRID_MAIN',
      failure_type: 'complete_outage'
    },
    {
      id: 'gen',
      name: 'Generator Failure',
      desc: 'Backup generator fails to start',
      asset_id: 'GEN_01',
      failure_type: 'generator_failure'
    },
    {
      id: 'ups',
      name: 'UPS Battery Depletion',
      desc: 'UPS runtime exhausted',
      asset_id: 'UPS_CRITICAL',
      failure_type: 'battery_depletion'
    },
    {
      id: 'ats',
      name: 'ATS Failure',
      desc: 'Automatic transfer switch failure',
      asset_id: 'TRANSFORMER_01',
      failure_type: 'ats_failure'
    }
  ],
  water: [
    {
      id: 'water_tank',
      name: 'Main Storage Tank Contamination',
      desc: 'Primary reservoir breach',
      asset_id: 'WATER_PUMP_STATION',
      failure_type: 'tank_contamination'
    },
    {
      id: 'water_pump',
      name: 'Booster Pump Cavitation',
      desc: 'Loss of potable water header pressure',
      asset_id: 'WATER_PUMP_STATION',
      failure_type: 'pump_cavitation'
    }
  ],
  hvac: [
    {
      id: 'chiller_trip',
      name: 'HVAC Chiller Thermal Trip',
      desc: 'Loss of cleanroom surgical air cooling',
      asset_id: 'CHILLER_PLANT',
      failure_type: 'compressor_failure'
    }
  ],
  gas: [
    {
      id: 'o2_rupture',
      name: 'Cryogenic O2 Pipeline Rupture',
      desc: 'Pressure drop in main oxygen distribution line',
      asset_id: 'OXYGEN_MANIFOLD',
      failure_type: 'pressure_loss'
    }
  ],
  combined: [
    {
      id: 'combined_heatwave',
      name: 'Grid Blackout + DG Failure (Heatwave)',
      desc: 'Multi-system cascade with ambient heatwave stress',
      asset_id: 'GRID_MAIN',
      failure_type: 'lockout'
    }
  ]
}

export default function StartSimulationView({
  assets = [],
  services = [],
  incident = {},
  onTriggerFailure,
  onReset,
  onNotify
}) {
  const [selectedCategory, setSelectedCategory] = useState('electrical')
  const [selectedIncident, setSelectedIncident] = useState('transformer')
  const [severity, setSeverity] = useState('Full Failure')
  const [startTime, setStartTime] = useState('Immediate (T = 0)')
  const [duration, setDuration] = useState('2 Hours')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isIncidentActive = Boolean(incident?.is_active)
  const currentIncidentsList = INCIDENTS_BY_CATEGORY[selectedCategory] || INCIDENTS_BY_CATEGORY.electrical

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    const list = INCIDENTS_BY_CATEGORY[catId]
    if (list && list.length > 0) {
      setSelectedIncident(list[0].id)
    }
  }

  const handleLaunch = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const list = INCIDENTS_BY_CATEGORY[selectedCategory] || INCIDENTS_BY_CATEGORY.electrical
    const foundInc = list.find((i) => i.id === selectedIncident) || list[0]

    const payload = {
      asset_id: foundInc.asset_id,
      failure_type: foundInc.failure_type,
      severity: severity.toLowerCase().includes('full') ? 'high' : 'medium',
      duration_minutes: duration.includes('2') ? 120 : 60,
      compound_heatwave: selectedCategory === 'combined'
    }

    try {
      if (onTriggerFailure) {
        await onTriggerFailure(payload)
      }
      if (onNotify) {
        onNotify(`Failure injected: ${foundInc.name}`, 'warning')
      }
    } catch (err) {
      if (onNotify) {
        onNotify(`Simulation execution failed: ${err.message}`, 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Visual simulation pins
  const simPins = [
    { id: 'TRANSFORMER', label: 'Transformer', status: 'Failed', top: '35%', left: '42%', color: 'red' },
    { id: 'GEN_01', label: 'Generator', status: 'Standby', top: '30%', left: '59%', color: 'cyan' },
    { id: 'HVAC_PLANT', label: 'HVAC Plant', status: 'Normal', top: '36%', left: '87%', color: 'cyan' },
    { id: 'MAIN_HOSPITAL', label: 'Main Hospital', status: 'At Risk', top: '46%', left: '68%', color: 'amber' },
    { id: 'MED_GAS_PLANT', label: 'Medical Gas Plant', status: 'Normal', top: '49%', left: '90%', color: 'cyan' },
    { id: 'SERVICE_ICU', label: 'ICU', status: 'At Risk', top: '55%', left: '53%', color: 'amber' },
    { id: 'SERVICE_ER', label: 'Emergency', status: 'Normal', top: '63%', left: '63%', color: 'cyan' },
    { id: 'SERVICE_OT', label: 'OT', status: 'At Risk', top: '60%', left: '79%', color: 'amber' }
  ]

  return (
    <div className="start-sim-page">
      {/* 1. TOP 5 CATEGORY TILES */}
      <section className="sim-categories-row">
        {CATEGORY_TILES.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          return (
            <div
              key={cat.id}
              className={`sim-cat-tile ${isActive ? 'is-active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              <div className="sim-cat-icon-wrap" style={{ color: cat.color }}>
                <Icon size={18} />
              </div>
              <div className="sim-cat-text-col">
                <span className="sim-cat-name">{cat.name}</span>
                <span className="sim-cat-sub">{cat.sub}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. MAIN SPLIT: Left Controls & Right 3D Visual + Timeline */}
      <section className="sim-main-grid">
        {/* Left Controls Column */}
        <aside className="sim-left-controls">
          {/* Section 1: Select Incident */}
          <div className="sim-panel-box">
            <div className="sim-panel-title">1. Select Incident</div>
            <div className="sim-incident-radio-list">
              {currentIncidentsList.map((inc) => {
                const isSelected = selectedIncident === inc.id
                return (
                  <label
                    key={inc.id}
                    className={`sim-radio-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedIncident(inc.id)}
                  >
                    <input
                      type="radio"
                      name="incident_choice"
                      checked={isSelected}
                      onChange={() => setSelectedIncident(inc.id)}
                    />
                    <div className="sim-radio-left-icon">
                      {selectedCategory === 'electrical' && <Zap size={14} style={{ color: '#00F0FF' }} />}
                      {selectedCategory === 'water' && <Droplets size={14} style={{ color: '#00A3FF' }} />}
                      {selectedCategory === 'hvac' && <Wind size={14} style={{ color: '#FFB800' }} />}
                      {selectedCategory === 'gas' && <Flame size={14} style={{ color: '#A855F7' }} />}
                      {selectedCategory === 'combined' && <AlertTriangle size={14} style={{ color: '#FF4D4D' }} />}
                    </div>
                    <div className="sim-radio-meta">
                      <span className="sim-radio-title">{inc.name}</span>
                      <span className="sim-radio-desc">{inc.desc}</span>
                    </div>
                    <span className="sim-radio-indicator" />
                  </label>
                )
              })}
            </div>
          </div>

          {/* Section 2: Configure Parameters */}
          <div className="sim-panel-box">
            <div className="sim-panel-title">2. Configure Parameters</div>
            <div className="sim-params-form">
              <div className="sim-field-row">
                <span className="sim-field-lbl">Severity</span>
                <select
                  className="sim-select font-mono"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Full Failure">Full Failure</option>
                  <option value="Partial (50%)">Partial (50%)</option>
                  <option value="Intermittent">Intermittent</option>
                </select>
              </div>

              <div className="sim-field-row">
                <span className="sim-field-lbl">Start Time</span>
                <select
                  className="sim-select font-mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="Immediate (T = 0)">Immediate (T = 0)</option>
                  <option value="T + 5 min">T + 5 min</option>
                  <option value="T + 15 min">T + 15 min</option>
                </select>
              </div>

              <div className="sim-field-row">
                <span className="sim-field-lbl">Duration</span>
                <select
                  className="sim-select font-mono"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="2 Hours">2 Hours</option>
                  <option value="1 Hour">1 Hour</option>
                  <option value="4 Hours">4 Hours</option>
                </select>
              </div>

              <button
                type="button"
                className="sim-advanced-link"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <ChevronRight size={12} className={isAdvancedOpen ? 'rotate-90' : ''} />
                <span>Advanced Parameters</span>
              </button>
            </div>
          </div>

          {/* Section 4: Run Simulation CTA */}
          <div className="sim-panel-box run-sim-box">
            <div className="sim-panel-title">4. Run Simulation</div>
            <button
              type="button"
              className={`sim-start-cta-btn ${isSubmitting ? 'is-loading' : ''}`}
              onClick={handleLaunch}
              disabled={isSubmitting}
            >
              <Play size={16} fill="currentColor" />
              <span>{isSubmitting ? 'Simulating Cascade...' : 'Start Simulation'}</span>
            </button>
          </div>
        </aside>

        {/* Right Main Area: 3D Visual + Timeline & Expected Impact */}
        <div className="sim-right-workspace">
          {/* Section 3: Visualize & Simulate Canvas */}
          <div className="sim-visual-card">
            <div className="sim-visual-header">
              <span className="sim-visual-title">3. Visualize & Simulate</span>
              <div className="sim-status-legend">
                <span className="legend-item"><span className="leg-dot leg-normal" /> Normal</span>
                <span className="legend-item"><span className="leg-dot leg-degraded" /> Degraded</span>
                <span className="legend-item"><span className="leg-dot leg-failed" /> Failed</span>
                <span className="legend-item"><span className="leg-dot leg-backup" /> Backup</span>
              </div>
            </div>

            <div className="sim-canvas-viewport">
              <TwinContainer
                assets={assets}
                services={services}
                incident={incident}
              />

              {/* Sim HUD Pins */}
              <div className="sim-hud-pins-layer">
                {simPins.map((pin) => (
                  <div
                    key={pin.id}
                    className={`sim-hud-pin pin-${pin.color}`}
                    style={{ top: pin.top, left: pin.left }}
                  >
                    <span className="sim-pin-icon">
                      {pin.color === 'red' ? '⚡' : pin.color === 'amber' ? '●' : '●'}
                    </span>
                    <div className="sim-pin-text">
                      <span className="sim-pin-name">{pin.label}</span>
                      <span className="sim-pin-status font-mono">
                        <span className={`hud-dot ${pin.color === 'red' ? 'dot-red' : pin.color === 'amber' ? 'dot-amber' : 'dot-cyan'}`} />
                        {pin.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compass HUD */}
              <div className="sim-compass-hud">
                <div className="compass-circle">
                  <span className="compass-dir compass-n">N</span>
                  <span className="compass-dir compass-e">E</span>
                  <span className="compass-dir compass-s">S</span>
                  <span className="compass-dir compass-w">W</span>
                  <div className="compass-needle" />
                </div>
              </div>

              {/* Floating Camera Controls */}
              <div className="sim-camera-controls">
                <button type="button" className="sim-ctrl-btn" title="Fullscreen"><Maximize2 size={12} /></button>
                <button type="button" className="sim-ctrl-btn" title="Reset View"><Navigation size={12} /></button>
                <button type="button" className="sim-ctrl-btn" title="Zoom In"><Plus size={12} /></button>
                <button type="button" className="sim-ctrl-btn" title="Zoom Out"><Minus size={12} /></button>
              </div>
            </div>
          </div>

          {/* Bottom Row: Simulation Timeline + Expected Impact Preview */}
          <div className="sim-bottom-row-grid">
            {/* Simulation Timeline track */}
            <div className="sim-timeline-box">
              <div className="sim-timeline-title">Simulation Timeline</div>
              <div className="sim-nodes-track">
                <div className="sim-node-step node-active">
                  <span className="node-dot dot-red" />
                  <span className="node-time font-mono">T+0</span>
                  <span className="node-label">Failure Injected</span>
                </div>
                <div className="track-connector" />
                <div className="sim-node-step">
                  <span className="node-dot dot-cyan" />
                  <span className="node-time font-mono">T+2 min</span>
                  <span className="node-label">ATS Switch</span>
                </div>
                <div className="track-connector" />
                <div className="sim-node-step">
                  <span className="node-dot dot-cyan" />
                  <span className="node-time font-mono">T+5 min</span>
                  <span className="node-label">Generator Start</span>
                </div>
                <div className="track-connector" />
                <div className="sim-node-step">
                  <span className="node-dot dot-cyan" />
                  <span className="node-time font-mono">T+10 min</span>
                  <span className="node-label">Load Transfer</span>
                </div>
                <div className="track-connector" />
                <div className="sim-node-step">
                  <span className="node-dot dot-cyan" />
                  <span className="node-time font-mono">T+30 min</span>
                  <span className="node-label">Service Impact</span>
                </div>
              </div>
            </div>

            {/* Expected Impact (Preview) 3 KPI cards */}
            <div className="sim-expected-impact-box">
              <div className="impact-box-header">
                <span className="impact-box-title">Expected Impact (Preview)</span>
                <Info size={12} className="panel-info-icon" />
              </div>

              <div className="impact-cards-grid">
                <div className="impact-metric-card card-red">
                  <div className="impact-icon-wrap icon-red">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">3</span>
                    <span className="impact-lbl">Services At Risk</span>
                  </div>
                </div>

                <div className="impact-metric-card card-gold">
                  <div className="impact-icon-wrap icon-gold">
                    <Box size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">12</span>
                    <span className="impact-lbl">Affected Assets</span>
                  </div>
                </div>

                <div className="impact-metric-card card-blue">
                  <div className="impact-icon-wrap icon-blue">
                    <Clock size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">~8 min</span>
                    <span className="impact-lbl">Time to First Impact</span>
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
