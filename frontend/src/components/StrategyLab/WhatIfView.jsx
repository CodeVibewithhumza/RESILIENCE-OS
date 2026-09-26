import { useState } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Building,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Box,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  Check
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './WhatIfView.css'

const PREDEFINED_SCENARIOS = [
  { id: 'transformer', name: 'Primary Transformer Failure', sub: 'Loss of main transformer supply', icon: Zap, iconColor: '#00F0FF' },
  { id: 'grid', name: 'Grid Power Outage', sub: 'Loss of external grid supply', icon: Zap, iconColor: '#00F0FF' },
  { id: 'generator', name: 'Generator Failure', sub: 'Backup generator fails to start', icon: Zap, iconColor: '#00F0FF' },
  { id: 'ups', name: 'UPS Battery Depletion', sub: 'UPS runtime exhausted', icon: Zap, iconColor: '#00F0FF' },
  { id: 'water', name: 'Water Supply Disruption', sub: 'Main water tank/pump failure', icon: Droplets, iconColor: '#00A3FF' },
  { id: 'hvac', name: 'HVAC Chiller Failure', sub: 'Loss of cooling capacity', icon: Wind, iconColor: '#FFB800' },
  { id: 'gas', name: 'Medical Gas Pressure Drop', sub: 'Oxygen/air/vacuum supply failure', icon: Flame, iconColor: '#A855F7' },
  { id: 'multiple', name: 'Multiple Failures', sub: 'Combined scenario', icon: Building, iconColor: '#00F0FF' }
]

const STRATEGY_CARDS = [
  { code: 'A', id: 'backup_gen', name: 'Use Backup Generator', desc: 'Start DG and isolate fault', color: 'teal', defaultChecked: true },
  { code: 'B', id: 'load_shedding', name: 'Load Shedding', desc: 'Prioritize critical services', color: 'blue', defaultChecked: true },
  { code: 'C', id: 'alt_feeds', name: 'Switch to Alternate Feeds', desc: 'Reroute via secondary lines', color: 'orange', defaultChecked: true },
  { code: 'D', id: 'ups_ext', name: 'Use UPS Extension', desc: 'Extend UPS runtime', color: 'purple', defaultChecked: false },
  { code: 'E', id: 'partial_shut', name: 'Partial Shutdown', desc: 'Controlled service reduction', color: 'pink', defaultChecked: false },
  { code: 'F', id: 'combined_strat', name: 'Combined Strategy', desc: 'Multi-system coordinated', color: 'cyan', defaultChecked: false }
]

export default function WhatIfView({
  strategies = [],
  selectedStrategyId,
  onSelectStrategy,
  whatIfData = null,
  isLoading = false,
  error = null,
  onRefresh = null,
  isIncidentActive = false,
  incident = {},
  assets = [],
  services = [],
  onNotify
}) {
  const [scenarioTab, setScenarioTab] = useState('predefined') // 'predefined' | 'custom'
  const [selectedScenario, setSelectedScenario] = useState('transformer')
  const [severity, setSeverity] = useState('Full Failure (100%)')
  const [startTime, setStartTime] = useState('Immediate (T = 0)')
  const [duration, setDuration] = useState('2 Hours')
  const [selectedStrategies, setSelectedStrategies] = useState(['A', 'B', 'C'])
  const [activeStrategyCode, setActiveStrategyCode] = useState('A')
  const [isApplied, setIsApplied] = useState(false)

  const toggleStrategy = (code) => {
    setSelectedStrategies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleSelectAllStrategies = () => {
    if (selectedStrategies.length === STRATEGY_CARDS.length) {
      setSelectedStrategies(['A'])
    } else {
      setSelectedStrategies(STRATEGY_CARDS.map((s) => s.code))
    }
  }

  const handleApply = () => {
    setIsApplied(true)
    if (onNotify) {
      onNotify('Strategy A - Use Backup Generator applied successfully!', 'success')
    }
    setTimeout(() => setIsApplied(false), 2500)
  }

  // 3D HUD Pins for What-If preview
  const whatIfPins = [
    { id: 'TRANSFORMER', label: 'Transformer', status: 'Failed', top: '38%', left: '40%', color: 'red' },
    { id: 'GEN_01', label: 'Generator', status: 'Active', top: '30%', left: '48%', color: 'cyan' },
    { id: 'HVAC_PLANT', label: 'HVAC Plant', status: 'At Risk', top: '34%', left: '64%', color: 'amber' },
    { id: 'MAIN_HOSPITAL', label: 'Main Hospital', status: 'Partial Power', top: '48%', left: '52%', color: 'amber' },
    { id: 'MED_GAS_PLANT', label: 'Medical Gas Plant', status: 'Stable', top: '53%', left: '65%', color: 'cyan' },
    { id: 'SERVICE_ICU', label: 'ICU', status: 'Stable', top: '55%', left: '44%', color: 'cyan' },
    { id: 'SERVICE_ER', label: 'Emergency', status: 'Stable', top: '63%', left: '50%', color: 'cyan' },
    { id: 'SERVICE_OT', label: 'OT', status: 'At Risk', top: '59%', left: '60%', color: 'amber' }
  ]

  // Comparison Table Data
  const comparisonRows = [
    {
      metric: 'Resilience Index (0-100)',
      baseline: '28',
      stratA: '76',
      stratB: '68',
      stratC: '72',
      stratD: '61',
      stratE: '55',
      stratF: '82'
    },
    {
      metric: 'Services At Risk',
      baseline: '6',
      stratA: '2',
      stratB: '3',
      stratC: '2',
      stratD: '3',
      stratE: '4',
      stratF: '1'
    },
    {
      metric: 'Affected Assets',
      baseline: '18',
      stratA: '12',
      stratB: '14',
      stratC: '11',
      stratD: '13',
      stratE: '10',
      stratF: '8'
    },
    {
      metric: 'Time to First Impact',
      baseline: '~3 min',
      stratA: '~8 min',
      stratB: '~10 min',
      stratC: '~9 min',
      stratD: '~12 min',
      stratE: '~15 min',
      stratF: '~14 min'
    },
    {
      metric: 'Estimated Recovery Time',
      baseline: '> 4 hours',
      stratA: '~1.5 hours',
      stratB: '~2 hours',
      stratC: '~1.8 hours',
      stratD: '~2.5 hours',
      stratE: '~3 hours',
      stratF: '~1 hour'
    }
  ]

  return (
    <div className="whatif-page">
      {/* 1. TOP 4-STEP PROCESS BAR */}
      <section className="whatif-process-bar">
        <div className="process-step-box step-done">
          <span className="step-num font-mono">1</span>
          <div className="step-info">
            <span className="step-title">Select Incident</span>
            <span className="step-sub">Choose failure scenario</span>
          </div>
          <ChevronRight size={14} className="step-arrow" />
        </div>

        <div className="process-step-box step-done">
          <span className="step-num font-mono">2</span>
          <div className="step-info">
            <span className="step-title">Configure Parameters</span>
            <span className="step-sub">Set severity, duration, etc.</span>
          </div>
          <ChevronRight size={14} className="step-arrow" />
        </div>

        <div className="process-step-box step-active">
          <span className="step-num font-mono">3</span>
          <div className="step-info">
            <span className="step-title">Compare Strategies</span>
            <span className="step-sub">Simulate and analyze</span>
          </div>
          <ChevronRight size={14} className="step-arrow" />
        </div>

        <div className="process-step-box step-next">
          <span className="step-num font-mono">4</span>
          <div className="step-info">
            <span className="step-title">View Results</span>
            <span className="step-sub">Impact, risk and recommendation</span>
          </div>
        </div>
      </section>

      {/* 2. THREE-COLUMN WORKSPACE: Left Selectors, Center Strategies & Canvas & Table, Right Impact & Recommendation */}
      <section className="whatif-workspace-grid">
        {/* Left Column: 1. Select Incident & 2. Configure Parameters */}
        <aside className="whatif-left-col">
          {/* Card 1: Select Incident */}
          <div className="whatif-panel-card">
            <span className="whatif-panel-title">1. Select Incident</span>
            <div className="whatif-scenario-tabs">
              <button
                type="button"
                className={`scen-tab ${scenarioTab === 'predefined' ? 'is-active' : ''}`}
                onClick={() => setScenarioTab('predefined')}
              >
                Predefined Scenarios
              </button>
              <button
                type="button"
                className={`scen-tab ${scenarioTab === 'custom' ? 'is-active' : ''}`}
                onClick={() => setScenarioTab('custom')}
              >
                Custom Scenario
              </button>
            </div>

            <div className="whatif-scenarios-list">
              {PREDEFINED_SCENARIOS.map((scen) => {
                const Icon = scen.icon
                const isPicked = selectedScenario === scen.id
                return (
                  <label
                    key={scen.id}
                    className={`whatif-radio-row ${isPicked ? 'is-picked' : ''}`}
                    onClick={() => setSelectedScenario(scen.id)}
                  >
                    <input
                      type="radio"
                      name="whatif_scen"
                      checked={isPicked}
                      onChange={() => setSelectedScenario(scen.id)}
                    />
                    <Icon size={14} style={{ color: scen.iconColor }} className="scen-icon" />
                    <div className="scen-meta">
                      <span className="scen-name">{scen.name}</span>
                      <span className="scen-desc">{scen.sub}</span>
                    </div>
                    <span className="scen-indicator" />
                  </label>
                )
              })}
            </div>
          </div>

          {/* Card 2: Configure Parameters */}
          <div className="whatif-panel-card">
            <span className="whatif-panel-title">2. Configure Parameters</span>
            <div className="whatif-form-group">
              <div className="whatif-form-row">
                <span className="form-lbl">Severity</span>
                <select
                  className="form-select font-mono"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Full Failure (100%)">Full Failure (100%)</option>
                  <option value="Partial (50%)">Partial (50%)</option>
                </select>
              </div>

              <div className="whatif-form-row">
                <span className="form-lbl">Start Time</span>
                <select
                  className="form-select font-mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="Immediate (T = 0)">Immediate (T = 0)</option>
                  <option value="T + 5 min">T + 5 min</option>
                </select>
              </div>

              <div className="whatif-form-row">
                <span className="form-lbl">Duration</span>
                <select
                  className="form-select font-mono"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="2 Hours">2 Hours</option>
                  <option value="4 Hours">4 Hours</option>
                </select>
              </div>

              <span className="whatif-adv-link">&gt; Advanced Parameters</span>
            </div>
          </div>
        </aside>

        {/* Center Column: 3. Select Strategies, 4. Preview Canvas, 5. Comparison Results Table */}
        <div className="whatif-center-col">
          {/* 3. Select Response Strategies */}
          <div className="whatif-strategies-box">
            <div className="strategies-header-row">
              <span className="strategies-title">3. Select Response Strategies <span className="sub-note">(Choose up to 3 for comparison)</span></span>
              <button type="button" className="select-all-btn" onClick={handleSelectAllStrategies}>
                Select All
              </button>
            </div>

            <div className="strategy-cards-grid">
              {STRATEGY_CARDS.map((strat) => {
                const isChecked = selectedStrategies.includes(strat.code)
                return (
                  <div
                    key={strat.code}
                    className={`strat-card strat-${strat.color} ${isChecked ? 'is-checked' : ''}`}
                    onClick={() => toggleStrategy(strat.code)}
                  >
                    <div className="strat-card-top">
                      <div className="strat-code-badge">{strat.code}</div>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="strat-checkbox"
                      />
                    </div>
                    <div className="strat-card-name">{strat.name}</div>
                    <div className="strat-card-desc">{strat.desc}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 4. Simulation Preview (Strategy A: Backup Generator) */}
          <div className="whatif-canvas-card">
            <div className="canvas-header-row">
              <span className="canvas-title">4. Simulation Preview (Strategy A: Backup Generator)</span>
            </div>

            <div className="whatif-canvas-viewport">
              <TwinContainer
                assets={assets}
                services={services}
                incident={incident}
              />

              {/* Top-left Utility Legend */}
              <div className="whatif-utility-legend">
                <div className="leg-item"><span className="pipe-line" style={{ backgroundColor: '#00F0FF' }} /> Electrical</div>
                <div className="leg-item"><span className="pipe-line" style={{ backgroundColor: '#00A3FF' }} /> Water</div>
                <div className="leg-item"><span className="pipe-line" style={{ backgroundColor: '#FFB800' }} /> HVAC</div>
                <div className="leg-item"><span className="pipe-line" style={{ backgroundColor: '#A855F7' }} /> Medical Gas</div>
              </div>

              {/* Pins */}
              <div className="whatif-pins-layer">
                {whatIfPins.map((pin) => (
                  <div key={pin.id} className={`whatif-hud-pin pin-${pin.color}`} style={{ top: pin.top, left: pin.left }}>
                    <span className="pin-icon">{pin.color === 'red' ? '⚡' : '●'}</span>
                    <div className="pin-text">
                      <span className="pin-name">{pin.label}</span>
                      <span className="pin-status font-mono">{pin.status}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Compass HUD */}
              <div className="whatif-compass-hud">
                <div className="compass-circle">
                  <span className="compass-dir compass-n">N</span>
                  <span className="compass-dir compass-e">E</span>
                  <span className="compass-dir compass-s">S</span>
                  <span className="compass-dir compass-w">W</span>
                  <div className="compass-needle" />
                </div>
              </div>

              {/* Camera controls */}
              <div className="whatif-camera-controls">
                <button type="button" className="cam-btn"><Maximize2 size={12} /></button>
                <button type="button" className="cam-btn"><Navigation size={12} /></button>
                <button type="button" className="cam-btn"><Plus size={12} /></button>
                <button type="button" className="cam-btn"><Minus size={12} /></button>
              </div>
            </div>
          </div>

          {/* 5. Strategy Comparison Results Table */}
          <div className="whatif-table-card">
            <div className="table-header-row">
              <span className="table-title">5. Strategy Comparison Results</span>
              <button type="button" className="export-results-btn">Export Results</button>
            </div>

            <div className="comparison-table-scroll">
              <table className="comparison-table font-mono">
                <thead>
                  <tr>
                    <th className="th-metric">Metric</th>
                    <th>No Action<br /><span className="th-sub">(Baseline)</span></th>
                    <th className="th-highlight">A. Generator<br /><span className="th-sub">Backup</span></th>
                    <th>B. Load<br /><span className="th-sub">Shedding</span></th>
                    <th>C. Alternate<br /><span className="th-sub">Feed</span></th>
                    <th>D. UPS<br /><span className="th-sub">Extension</span></th>
                    <th>E. Partial<br /><span className="th-sub">Shutdown</span></th>
                    <th>F. Combined<br /><span className="th-sub">Strategy</span></th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.metric}>
                      <td className="td-metric">{row.metric}</td>
                      <td>{row.baseline}</td>
                      <td className="td-highlight">{row.stratA}</td>
                      <td>{row.stratB}</td>
                      <td>{row.stratC}</td>
                      <td>{row.stratD}</td>
                      <td>{row.stratE}</td>
                      <td>{row.stratF}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Key Impact + Service Level Impact + Recommended Strategy */}
        <aside className="whatif-right-col">
          {/* Key Impact (Strategy A) */}
          <div className="whatif-panel-card">
            <span className="whatif-panel-title">Key Impact (Strategy A)</span>
            <div className="key-impact-grid">
              <div className="key-impact-tile tile-red">
                <div className="tile-icon-wrap icon-red"><AlertTriangle size={15} /></div>
                <div className="tile-info">
                  <span className="tile-num font-mono">2</span>
                  <span className="tile-lbl">Services At Risk</span>
                </div>
              </div>

              <div className="key-impact-tile tile-gold">
                <div className="tile-icon-wrap icon-gold"><Box size={15} /></div>
                <div className="tile-info">
                  <span className="tile-num font-mono">12</span>
                  <span className="tile-lbl">Affected Assets</span>
                </div>
              </div>

              <div className="key-impact-tile tile-blue">
                <div className="tile-icon-wrap icon-blue"><Clock size={15} /></div>
                <div className="tile-info">
                  <span className="tile-num font-mono">~8 min</span>
                  <span className="tile-lbl">Time to First Impact</span>
                </div>
              </div>

              <div className="key-impact-tile tile-green">
                <div className="tile-icon-wrap icon-green"><ShieldCheck size={15} /></div>
                <div className="tile-info">
                  <span className="tile-num font-mono">76</span>
                  <span className="tile-lbl">Resilience Index</span>
                </div>
              </div>
            </div>
          </div>

          {/* Service Level Impact (Strategy A) */}
          <div className="whatif-panel-card">
            <div className="panel-title-with-legend">
              <span className="whatif-panel-title">Service Level Impact (Strategy A)</span>
              <div className="service-impact-legend">
                <span><span className="dot-g" /> Normal</span>
                <span><span className="dot-y" /> Degraded</span>
                <span><span className="dot-r" /> At Risk</span>
                <span><span className="dot-dr" /> Failed</span>
              </div>
            </div>

            {/* Stacked Vertical Bars */}
            <div className="service-bars-chart">
              <div className="chart-y-axis-nums font-mono">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>
              <div className="service-bars-container">
                {/* Emergency: 100% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-normal" style={{ height: '70%' }} />
                    <div className="bar-seg-deg" style={{ height: '20%' }} />
                    <div className="bar-seg-risk" style={{ height: '10%' }} />
                  </div>
                  <span className="bar-lbl">Emergency</span>
                </div>

                {/* ICU: 65% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-deg" style={{ height: '40%' }} />
                    <div className="bar-seg-risk" style={{ height: '25%' }} />
                  </div>
                  <span className="bar-lbl">ICU</span>
                </div>

                {/* OT: 50% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-risk" style={{ height: '50%' }} />
                  </div>
                  <span className="bar-lbl">OT</span>
                </div>

                {/* Ward: 65% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-normal" style={{ height: '65%' }} />
                  </div>
                  <span className="bar-lbl">Ward</span>
                </div>

                {/* OPD: 70% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-normal" style={{ height: '70%' }} />
                  </div>
                  <span className="bar-lbl">OPD</span>
                </div>

                {/* Lab: 75% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-normal" style={{ height: '75%' }} />
                  </div>
                  <span className="bar-lbl">Lab</span>
                </div>

                {/* Radiology: 75% */}
                <div className="service-bar-col">
                  <div className="bar-stacked-track">
                    <div className="bar-seg-normal" style={{ height: '75%' }} />
                  </div>
                  <span className="bar-lbl">Radiology</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Strategy Box */}
          <div className="whatif-panel-card rec-strategy-card">
            <div className="rec-header-row">
              <span className="whatif-panel-title">Recommended Strategy</span>
              <span className="rec-badge font-mono">Recommended</span>
            </div>

            <div className="rec-title-row">
              <span className="rec-star">⭐</span>
              <span className="rec-strat-name">Strategy A - Use Backup Generator</span>
            </div>

            <div className="rec-bullets-list">
              <div className="rec-bullet-item">
                <Check size={13} className="rec-check-icon" />
                <span>Maintains critical services (ICU, Emergency)</span>
              </div>
              <div className="rec-bullet-item">
                <Check size={13} className="rec-check-icon" />
                <span>Lower immediate risk to patient care</span>
              </div>
              <div className="rec-bullet-item">
                <Check size={13} className="rec-check-icon" />
                <span>Recovery time within acceptable window</span>
              </div>
              <div className="rec-bullet-item">
                <Check size={13} className="rec-check-icon" />
                <span>Minimal service disruption</span>
              </div>
            </div>

            <button
              type="button"
              className="apply-strategy-cta-btn"
              onClick={handleApply}
            >
              <Play size={14} fill="currentColor" />
              <span>{isApplied ? 'Strategy Applied!' : 'Apply This Strategy'}</span>
            </button>
          </div>
        </aside>
      </section>
    </div>
  )
}
