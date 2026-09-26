import { useState } from 'react'
import {
  Sliders,
  CheckCircle2,
  Award,
  Layers,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
  Clock
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './WhatIfView.css'

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
  const [selectedIncidentType, setSelectedIncidentType] = useState('grid')
  const [horizonHours, setHorizonHours] = useState('2')
  const [selectedStrategies, setSelectedStrategies] = useState(['A', 'B', 'C', 'D', 'E', 'F'])
  const [isApplied, setIsApplied] = useState(false)

  // Default selected strategy
  const defaultSelected =
    whatIfData?.recommended_strategy_id ||
    strategies.find((s) => s.is_recommended)?.strategy_id ||
    strategies[0]?.strategy_id

  const activeId = selectedStrategyId || defaultSelected
  const activeStrategy = strategies.find((s) => s.strategy_id === activeId) || strategies[0] || {
    strategy_code: 'B',
    strategy_name: 'Emergency Generator Priority Dispatch',
    projected_resilience_score: 88.5,
    icu_continuity_pct: 100,
    cost_score: 2,
    time_to_stabilize_min: 15,
    is_recommended: true
  }

  const toggleStrategyCheckbox = (code) => {
    setSelectedStrategies((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    )
  }

  const handleApplyStrategy = () => {
    setIsApplied(true)
    if (onNotify) {
      onNotify(`Strategy ${activeStrategy?.strategy_code}: "${activeStrategy?.strategy_name}" dispatched to hospital control`, 'success')
    }
    setTimeout(() => setIsApplied(false), 2500)
  }

  const workflowSteps = [
    { num: 1, label: 'Select Incident', status: 'completed' },
    { num: 2, label: 'Configure Parameters', status: 'completed' },
    { num: 3, label: 'Select Strategies', status: 'active' },
    { num: 4, label: 'Compare & Evaluate', status: 'active' }
  ]

  const strategyCards = [
    { code: 'A', name: 'Automated Load Shedding', desc: 'Throttles non-critical admin & ambulatory wings' },
    { code: 'B', name: 'Emergency Generator Priority Dispatch', desc: 'Accelerates DG synchronization to life-support buses' },
    { code: 'C', name: 'Cross-Tie Circuit Reconfiguration', desc: 'Isolates faulted bus via automatic transfer switch' },
    { code: 'D', name: 'HVAC Duty Cycle Throttling', desc: 'Reduces chiller load to preserve emergency fuel headroom' },
    { code: 'E', name: 'Selective Critical Care Isolation', desc: 'Creates microgrid islands for ICU and Surgery Suites' },
    { code: 'F', name: 'Manual Feeder Bypass Protocol', desc: 'Dispatches technician team for auxiliary tie-in' }
  ]

  return (
    <div className="whatif-page">
      {/* 1. TOP 4-STEP WORKFLOW INDICATOR */}
      <section className="whatif-workflow-card">
        <div className="workflow-steps-track">
          {workflowSteps.map((step, idx) => {
            const isLast = idx === workflowSteps.length - 1
            const isDone = step.status === 'completed'
            const isCurrent = step.status === 'active'

            return (
              <div key={step.num} className="workflow-step-item">
                <div className="step-circle-row">
                  <div className={`step-circle ${isDone ? 'is-done' : ''} ${isCurrent ? 'is-current' : ''}`}>
                    {isDone ? <CheckCircle2 size={13} /> : step.num}
                  </div>
                  <span className="step-label font-mono">{step.label}</span>
                  {!isLast && <ChevronRight size={14} className="step-arrow" />}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 2. THREE-COLUMN MAIN WORKSPACE */}
      <section className="whatif-workspace-grid">
        {/* Left Column: Incident Selector & Configuration */}
        <aside className="whatif-left-col">
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">1. Select Incident</span>
            </div>

            <div className="incident-select-list">
              <label className={`incident-pick-row ${selectedIncidentType === 'grid' ? 'is-picked' : ''}`}>
                <input
                  type="radio"
                  name="wi-incident"
                  checked={selectedIncidentType === 'grid'}
                  onChange={() => setSelectedIncidentType('grid')}
                />
                <div className="pick-meta">
                  <span className="pick-name">11kV Grid Blackout</span>
                  <span className="pick-sub">GRID_MAIN Primary Trip</span>
                </div>
              </label>

              <label className={`incident-pick-row ${selectedIncidentType === 'transformer' ? 'is-picked' : ''}`}>
                <input
                  type="radio"
                  name="wi-incident"
                  checked={selectedIncidentType === 'transformer'}
                  onChange={() => setSelectedIncidentType('transformer')}
                />
                <div className="pick-meta">
                  <span className="pick-name">Transformer Overheat</span>
                  <span className="pick-sub">TRANSFORMER_01 Thermal Trip</span>
                </div>
              </label>

              <label className={`incident-pick-row ${selectedIncidentType === 'water' ? 'is-picked' : ''}`}>
                <input
                  type="radio"
                  name="wi-incident"
                  checked={selectedIncidentType === 'water'}
                  onChange={() => setSelectedIncidentType('water')}
                />
                <div className="pick-meta">
                  <span className="pick-name">Water Booster Loss</span>
                  <span className="pick-sub">WATER_PUMP_STATION Pressure Drop</span>
                </div>
              </label>

              <label className={`incident-pick-row ${selectedIncidentType === 'chiller' ? 'is-picked' : ''}`}>
                <input
                  type="radio"
                  name="wi-incident"
                  checked={selectedIncidentType === 'chiller'}
                  onChange={() => setSelectedIncidentType('chiller')}
                />
                <div className="pick-meta">
                  <span className="pick-name">HVAC Chiller Offline</span>
                  <span className="pick-sub">CHILLER_PLANT Failure</span>
                </div>
              </label>
            </div>
          </div>

          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">2. Configure Parameters</span>
            </div>

            <div className="param-field-stack">
              <div className="param-item">
                <span className="param-lbl">Simulation Horizon</span>
                <select
                  className="param-dropdown font-mono"
                  value={horizonHours}
                  onChange={(e) => setHorizonHours(e.target.value)}
                >
                  <option value="1">1.0 Hour (Immediate)</option>
                  <option value="2">2.0 Hours (Standard)</option>
                  <option value="4">4.0 Hours (Extended)</option>
                </select>
              </div>

              <div className="param-item">
                <span className="param-lbl">MCDA Optimization Weighting</span>
                <select className="param-dropdown font-mono" defaultValue="balanced">
                  <option value="balanced">Balanced (Clinical + Cost + Speed)</option>
                  <option value="clinical">Clinical First (Max ICU/OT)</option>
                  <option value="speed">Rapidity First (Min Downtime)</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Strategy Selection Cards + 3D Twin Preview + Comparison Table */}
        <main className="whatif-center-col">
          {/* Strategy Selection Cards (A-F) */}
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">3. Select Response Strategies</span>
              <span className="badge badge-cyan font-mono">
                {selectedStrategies.length} of 6 Selected
              </span>
            </div>

            <div className="strategy-cards-grid">
              {strategyCards.map((strat) => {
                const isChecked = selectedStrategies.includes(strat.code)
                const isSelected = activeStrategy?.strategy_code === strat.code

                return (
                  <div
                    key={strat.code}
                    className={`strat-item-card ${isChecked ? 'is-checked' : ''} ${isSelected ? 'is-active-inspect' : ''}`}
                    onClick={() => {
                      const matched = strategies.find((s) => s.strategy_code === strat.code)
                      if (matched && onSelectStrategy) {
                        onSelectStrategy(matched.strategy_id)
                      }
                    }}
                  >
                    <div className="strat-card-top">
                      <label
                        className="strat-checkbox-wrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleStrategyCheckbox(strat.code)}
                        />
                        <span className="strat-code font-mono">Strategy {strat.code}</span>
                      </label>
                      {activeStrategy?.strategy_code === strat.code && (
                        <span className="badge badge-normal font-mono" style={{ fontSize: '9px' }}>
                          Active
                        </span>
                      )}
                    </div>
                    <span className="strat-name">{strat.name}</span>
                    <span className="strat-desc">{strat.desc}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3D Simulation Preview of Selected Strategy */}
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <div className="preview-title-group">
                <Layers size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span className="panel-heading">
                  3D Simulation Preview: Strategy {activeStrategy?.strategy_code}
                </span>
              </div>
              <span className="badge badge-normal font-mono">
                Projected R: {activeStrategy?.projected_resilience_score?.toFixed(1) || '88.5'}%
              </span>
            </div>

            <div className="whatif-twin-embed">
              <TwinContainer
                assets={assets}
                services={services}
                selectedAssetId={activeStrategy?.target_asset_id || incident?.source_asset_id || 'GEN_01'}
              />
            </div>
          </div>

          {/* Strategy Comparison Results Table */}
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">Strategy Comparison Results (TOPSIS)</span>
              <span className="badge badge-subtle font-mono">RANKED</span>
            </div>

            <div className="comparison-table-wrap">
              <table className="comparison-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Strategy</th>
                    <th>Resilience (R)</th>
                    <th>ICU Cont.</th>
                    <th>Cost Score</th>
                    <th>Recovery Time</th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.length > 0 ? (
                    strategies.map((strat, idx) => (
                      <tr
                        key={strat.strategy_id}
                        className={activeStrategy?.strategy_id === strat.strategy_id ? 'is-selected-row' : ''}
                        onClick={() => onSelectStrategy && onSelectStrategy(strat.strategy_id)}
                      >
                        <td className="font-mono font-bold">
                          {strat.is_recommended ? '⭐ 1' : `#${idx + 1}`}
                        </td>
                        <td className="font-bold">
                          Strategy {strat.strategy_code} — {strat.strategy_name}
                        </td>
                        <td className="font-mono" style={{ color: 'var(--status-normal)' }}>
                          {strat.projected_resilience_score?.toFixed(1)}%
                        </td>
                        <td className="font-mono">
                          {strat.icu_continuity_pct?.toFixed(0)}%
                        </td>
                        <td className="font-mono">
                          {strat.cost_score || '$2,400'}
                        </td>
                        <td className="font-mono">
                          {strat.time_to_stabilize_min ? `${strat.time_to_stabilize_min} min` : '15 min'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                        Evaluating MCDA trade-offs...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* Right Column: Key Impact + Service Impact Chart + Recommended Strategy */}
        <aside className="whatif-right-col">
          {/* Key Impact Stat Boxes */}
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">Key Impact</span>
              <span className="badge badge-cyan font-mono">PROJECTED</span>
            </div>

            <div className="impact-stats-grid">
              <div className="impact-box">
                <span className="impact-lbl">Resilience Improvement</span>
                <span className="impact-val font-mono" style={{ color: 'var(--status-normal)' }}>
                  +18.4 pts
                </span>
              </div>
              <div className="impact-box">
                <span className="impact-lbl">ICU Continuity</span>
                <span className="impact-val font-mono" style={{ color: 'var(--status-normal)' }}>
                  100%
                </span>
              </div>
              <div className="impact-box">
                <span className="impact-lbl">Backup Runtime</span>
                <span className="impact-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                  3.5 hrs
                </span>
              </div>
              <div className="impact-box">
                <span className="impact-lbl">Load Shedding</span>
                <span className="impact-val font-mono">
                  420 kW
                </span>
              </div>
            </div>
          </div>

          {/* Service Level Impact Bar Chart */}
          <div className="whatif-panel-card">
            <div className="panel-header-row">
              <span className="panel-heading">Service Level Impact</span>
              <span className="card-sub font-mono">CONTINUITY</span>
            </div>

            <div className="service-impact-bars-stack">
              <div className="svc-impact-bar-item">
                <div className="svc-bar-label-row font-mono">
                  <span>Intensive Care (ICU)</span>
                  <span>100%</span>
                </div>
                <div className="svc-bar-track">
                  <div className="svc-bar-fill" style={{ width: '100%', backgroundColor: 'var(--status-normal)' }} />
                </div>
              </div>

              <div className="svc-impact-bar-item">
                <div className="svc-bar-label-row font-mono">
                  <span>Surgery Suites (OT)</span>
                  <span>95%</span>
                </div>
                <div className="svc-bar-track">
                  <div className="svc-bar-fill" style={{ width: '95%', backgroundColor: 'var(--status-normal)' }} />
                </div>
              </div>

              <div className="svc-impact-bar-item">
                <div className="svc-bar-label-row font-mono">
                  <span>Emergency Trauma (ER)</span>
                  <span>90%</span>
                </div>
                <div className="svc-bar-track">
                  <div className="svc-bar-fill" style={{ width: '90%', backgroundColor: 'var(--accent-cyan)' }} />
                </div>
              </div>

              <div className="svc-impact-bar-item">
                <div className="svc-bar-label-row font-mono">
                  <span>General Care Wards</span>
                  <span>75%</span>
                </div>
                <div className="svc-bar-track">
                  <div className="svc-bar-fill" style={{ width: '75%', backgroundColor: 'var(--status-warning)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Recommended Strategy Card with CTA */}
          <div className="whatif-panel-card recommended-card">
            <div className="panel-header-row">
              <div className="rec-badge-group">
                <Award size={15} style={{ color: '#f59e0b' }} />
                <span className="panel-heading">Recommended Strategy</span>
              </div>
              <span className="badge badge-normal font-mono">TOP RANKED</span>
            </div>

            <div className="recommended-body">
              <span className="rec-title">
                Strategy {activeStrategy?.strategy_code} — {activeStrategy?.strategy_name}
              </span>
              <p className="rec-desc">
                Multi-criteria decision analysis (TOPSIS) identified this strategy as optimal.
                Preserves 100% ICU life-support continuity while maintaining 3.5 hours of emergency runtime.
              </p>

              <button
                type="button"
                className="apply-strategy-btn"
                onClick={handleApplyStrategy}
              >
                {isApplied ? (
                  <>
                    <Check size={14} style={{ color: '#ffffff' }} />
                    <span>Strategy Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>Apply Strategy</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}
