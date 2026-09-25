import { useState } from 'react'
import {
  Sliders,
  Award,
  CheckCircle2,
  AlertCircle,
  Layers,
  LayoutGrid,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  GitCompare,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import StrategyCard from './StrategyCard'
import './StrategyLab.css'

export default function StrategyMatrix({
  strategies = [],
  selectedStrategyId,
  onSelectStrategy,
  whatIfData = null,
  isLoading = false,
  error = null,
  onRefresh = null,
  isIncidentActive = false
}) {
  const [showPairwise, setShowPairwise] = useState(true)

  // Default selection based on backend recommended strategy, then fallback to first strategy
  const defaultSelected =
    whatIfData?.recommended_strategy_id ||
    strategies.find((s) => s.is_recommended)?.strategy_id ||
    strategies[0]?.strategy_id

  const activeId = selectedStrategyId || defaultSelected
  const selectedStrategy = strategies.find((s) => s.strategy_id === activeId) || strategies[0]

  const handleSelect = (id) => {
    if (onSelectStrategy) {
      onSelectStrategy(id)
    }
  }

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--status-normal)'
    if (score >= 70) return 'var(--status-stable)'
    if (score >= 50) return 'var(--status-warning)'
    return 'var(--status-critical)'
  }

  // Risk badge styling
  const getRiskBadgeClass = (risk = 'medium') => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'badge-normal'
      case 'medium': return 'badge-warning'
      case 'high': return 'badge-critical'
      case 'critical': return 'badge-critical'
      default: return 'badge-offline'
    }
  }

  // MCDA extraction helpers from backend comparison_matrix
  const paretoFrontierIds = whatIfData?.comparison_matrix?.pareto_frontier_ids || []
  const rankingResults = whatIfData?.comparison_matrix?.ranking_results || []
  const rankingItem = selectedStrategy
    ? rankingResults.find((r) => r.strategy_id === selectedStrategy.strategy_id)
    : null

  const pairwiseComparisons = whatIfData?.comparison_matrix?.pairwise_comparisons || []
  const relevantPairwise = selectedStrategy
    ? pairwiseComparisons.filter(
        (c) => c.strategy_a_id === selectedStrategy.strategy_id || c.strategy_b_id === selectedStrategy.strategy_id
      )
    : []

  const profileSensitivity = whatIfData?.comparison_matrix?.profile_sensitivity
  const decisionSummary = whatIfData?.decision_summary
  const unmitigatedBaseline = whatIfData?.unmitigated_baseline_score

  const isSelectedPareto = selectedStrategy
    ? paretoFrontierIds.includes(selectedStrategy.strategy_id) ||
      Boolean(selectedStrategy.pareto_optimal || selectedStrategy.is_pareto_optimal)
    : false

  return (
    <div className="strategy-lab-container" id="strategy-lab-module">
      {/* 1. Header with provenance, baseline, and refresh control */}
      <div className="strategy-lab-header">
        <div className="strategy-lab-title-group">
          <div className="strategy-lab-title">
            <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>WHAT-IF STRATEGY LAB</span>
          </div>
          <span className="strategy-lab-subtitle">
            Simulated Response Interventions & MCDA Trade-off Optimization
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Provenance Badge */}
          {whatIfData ? (
            isIncidentActive || (whatIfData.incident_id && whatIfData.incident_id !== 'INC-PREVIEW') ? (
              <span className="badge badge-normal font-mono" title="Live incident simulation output from backend">
                Live Incident: {whatIfData.incident_id}
              </span>
            ) : (
              <span className="badge badge-cyan font-mono" title="Baseline preview calculation — No active incident">
                Baseline Preview (No Active Incident)
              </span>
            )
          ) : (
            <span className="badge badge-offline font-mono" title="Offline / Mock fallback data">
              Demo / Offline Data
            </span>
          )}

          {/* Unmitigated baseline score */}
          {typeof unmitigatedBaseline === 'number' && (
            <span className="badge badge-warning font-mono" title="Unmitigated baseline score evaluated by simulation engine">
              Baseline: {unmitigatedBaseline.toFixed(1)}/100
            </span>
          )}

          <span className="badge badge-subtle font-mono">
            {strategies.length} Strategies Evaluated
          </span>

          {/* Refresh / Recalculate Button */}
          {onRefresh && (
            <button
              type="button"
              className="strategy-refresh-btn font-mono"
              onClick={onRefresh}
              disabled={isLoading}
              title="Recalculate simulation strategies from backend"
            >
              <RefreshCw size={11} className={isLoading ? 'spin-icon' : ''} />
              <span>{isLoading ? 'Recalculating...' : 'Recalculate'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="strategy-lab-body">
        {/* Loading and Error Feedback Banners */}
        {isLoading && (
          <div className="strategy-status-banner info font-mono">
            <RefreshCw size={12} className="spin-icon" />
            <span>Loading What-if simulation analysis from backend...</span>
          </div>
        )}

        {error && !isLoading && (
          <div className="strategy-status-banner warning font-mono">
            <AlertTriangle size={12} />
            <span>Backend analysis unavailable ({error}) — showing demo data</span>
          </div>
        )}

        {/* 2. Backend Decision Summary Panel */}
        {decisionSummary && (
          <div className="decision-summary-box">
            <div className="decision-summary-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={15} style={{ color: 'var(--status-normal)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-primary)' }}>
                  Simulation Decision Support Summary (Backend MCDA Evaluation)
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                {decisionSummary.incident_type && (
                  <span className="badge badge-cyan font-mono" style={{ fontSize: '10px' }}>
                    Incident: {decisionSummary.incident_type.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>

            <div className="decision-summary-grid">
              <div className="decision-summary-card">
                <span className="kpi-label">Classified Incident</span>
                <span className="kpi-value font-mono" style={{ fontSize: '13px', textTransform: 'capitalize' }}>
                  {decisionSummary.incident_type ? decisionSummary.incident_type.replace(/_/g, ' ') : 'General Disruption'}
                </span>
              </div>
              <div className="decision-summary-card">
                <span className="kpi-label">Max Resilience Gain</span>
                <span className="kpi-value font-mono" style={{ color: 'var(--status-normal)' }}>
                  +{typeof decisionSummary.max_resilience_gain === 'number' ? decisionSummary.max_resilience_gain.toFixed(1) : '0.0'} pts
                </span>
              </div>
              <div className="decision-summary-card">
                <span className="kpi-label">Max Backup Runtime</span>
                <span className="kpi-value font-mono">
                  {typeof decisionSummary.max_runtime_hours === 'number' ? decisionSummary.max_runtime_hours.toFixed(1) : '0.0'} Hours
                </span>
              </div>
              <div className="decision-summary-card">
                <span className="kpi-label">TOPSIS Closeness</span>
                <span className="kpi-value font-mono" style={{ color: 'var(--accent-cyan)' }}>
                  {typeof decisionSummary.topsis_closeness === 'number'
                    ? `${(decisionSummary.topsis_closeness * 100).toFixed(0)}%`
                    : '—'}
                </span>
              </div>
            </div>

            {/* Factual Rationale attributed to backend simulation output */}
            {(whatIfData.causal_explanation || decisionSummary.trade_off_analysis) && (
              <div className="decision-rationale-text">
                <strong>Backend Simulation Rationale: </strong>
                {whatIfData.causal_explanation ||
                  (typeof decisionSummary.trade_off_analysis === 'object'
                    ? Object.values(decisionSummary.trade_off_analysis).join(' • ')
                    : String(decisionSummary.trade_off_analysis))}
              </div>
            )}
          </div>
        )}

        {/* 3. Horizontal Strategy Cards Overview */}
        <div className="strategy-section">
          <div className="strategy-section-header">
            <span className="strategy-section-label">
              <LayoutGrid size={13} style={{ color: 'var(--accent-cyan)' }} />
              <span>Intervention Catalog (Select to Inspect)</span>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any strategy to inspect clinical impact, MCDA ranking, and operational trade-offs
            </span>
          </div>

          <div className="strategy-cards-horizontal-grid">
            {strategies.map((strat) => (
              <StrategyCard
                key={strat.strategy_id}
                strategy={{
                  ...strat,
                  pareto_optimal: paretoFrontierIds.includes(strat.strategy_id) || strat.pareto_optimal
                }}
                isSelected={strat.strategy_id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* 4. Selected Strategy Detailed Outcome & MCDA Inspector */}
        {selectedStrategy && (
          <div
            className={`strategy-inspector-box ${
              selectedStrategy.is_recommended ? 'is-recommended-inspection' : ''
            }`}
          >
            <div className="strategy-inspector-header">
              <div className="inspector-identity">
                <div className="inspector-title-row">
                  <span className="inspector-code font-mono">{selectedStrategy.strategy_code}</span>
                  <span className="inspector-name">{selectedStrategy.strategy_name}</span>
                  <span className="badge badge-subtle font-mono">
                    Rank #{selectedStrategy.recommendation_rank || 1}
                  </span>
                  {selectedStrategy.is_recommended && (
                    <span className="badge badge-normal">
                      <Award size={12} style={{ marginRight: '4px' }} />
                      Recommended Strategy
                    </span>
                  )}
                  {isSelectedPareto && (
                    <span className="badge badge-cyan font-mono">
                      Pareto Frontier
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Interactive inspection of simulated outcome parameters, MCDA scores & resource conservation
                </span>
              </div>

              <div className="inspector-score-badge">
                <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Projected Resilience:
                </span>
                <span
                  className="inspector-score-val font-mono"
                  style={{ color: getScoreColor(selectedStrategy.projected_resilience_score) }}
                >
                  {selectedStrategy.projected_resilience_score.toFixed(1)}
                </span>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ 100</span>
              </div>
            </div>

            {/* 4 Core KPIs */}
            <div className="inspector-kpis-grid">
              <div className="inspector-kpi-card">
                <span className="kpi-label">ICU Continuity</span>
                <span
                  className="kpi-value font-mono"
                  style={{
                    color: selectedStrategy.icu_continuity_pct >= 90 ? 'var(--status-normal)' : 'var(--status-warning)'
                  }}
                >
                  {selectedStrategy.icu_continuity_pct.toFixed(0)}%
                </span>
              </div>

              <div className="inspector-kpi-card">
                <span className="kpi-label">Backup Runtime</span>
                <span className="kpi-value font-mono">
                  {selectedStrategy.backup_runtime_remaining_hours.toFixed(1)} Hours
                </span>
              </div>

              <div className="inspector-kpi-card">
                <span className="kpi-label">Load Shed</span>
                <span className="kpi-value font-mono">
                  {selectedStrategy.non_critical_load_shed_kw.toFixed(0)} kW
                </span>
              </div>

              <div className="inspector-kpi-card">
                <span className="kpi-label">Estimated Recovery</span>
                <span className="kpi-value font-mono">
                  {selectedStrategy.estimated_recovery_time_min} Min
                </span>
              </div>
            </div>

            {/* MCDA Multi-Attribute Evaluation Scores */}
            <div className="inspector-mcda-section">
              <div className="inspector-mcda-title">
                <Sliders size={12} />
                <span>Multi-Criteria Decision Analysis (MCDA / TOPSIS Metrics)</span>
              </div>
              <div className="inspector-mcda-grid">
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">TOPSIS Score</span>
                  <span className="mcda-metric-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                    {typeof selectedStrategy.topsis_score === 'number'
                      ? `${(selectedStrategy.topsis_score * 100).toFixed(1)}%`
                      : rankingItem?.topsis_score != null
                      ? `${(rankingItem.topsis_score * 100).toFixed(1)}%`
                      : '—'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">TOPSIS Rank</span>
                  <span className="mcda-metric-val font-mono">
                    {rankingItem?.topsis_rank != null
                      ? `#${rankingItem.topsis_rank}`
                      : `#${selectedStrategy.recommendation_rank || 1}`}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Pareto Rank / Status</span>
                  <span className="mcda-metric-val font-mono">
                    {selectedStrategy.pareto_rank != null
                      ? `Rank #${selectedStrategy.pareto_rank} (${isSelectedPareto ? 'Frontier' : 'Dominated'})`
                      : isSelectedPareto
                      ? 'Frontier (Rank #1)'
                      : 'Dominated'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Weighted Utility</span>
                  <span className="mcda-metric-val font-mono">
                    {rankingItem?.weighted_utility_score != null
                      ? `${rankingItem.weighted_utility_score.toFixed(1)} / 100`
                      : '—'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Implementation Latency</span>
                  <span className="mcda-metric-val font-mono">
                    {typeof selectedStrategy.implementation_latency_min === 'number'
                      ? `${selectedStrategy.implementation_latency_min.toFixed(0)} min`
                      : '—'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Clinical Safety</span>
                  <span
                    className="mcda-metric-val font-mono"
                    style={{
                      color:
                        typeof selectedStrategy.clinical_safety_score === 'number' &&
                        selectedStrategy.clinical_safety_score >= 80
                          ? 'var(--status-normal)'
                          : 'var(--status-warning)'
                    }}
                  >
                    {typeof selectedStrategy.clinical_safety_score === 'number'
                      ? selectedStrategy.clinical_safety_score.toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Infra Stability</span>
                  <span className="mcda-metric-val font-mono">
                    {typeof selectedStrategy.infrastructure_stability_score === 'number'
                      ? selectedStrategy.infrastructure_stability_score.toFixed(1)
                      : '—'}
                  </span>
                </div>
                <div className="mcda-metric-cell">
                  <span className="mcda-metric-label">Resource Efficiency</span>
                  <span className="mcda-metric-val font-mono">
                    {typeof selectedStrategy.resource_efficiency_score === 'number'
                      ? selectedStrategy.resource_efficiency_score.toFixed(1)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {/* Trade-Off Analysis: Pros vs Cons */}
            <div className="inspector-tradeoffs-grid">
              <div className="tradeoff-column">
                <span className="tradeoff-title" style={{ color: 'var(--status-normal)' }}>
                  <CheckCircle2 size={13} />
                  <span>Trade-Off Benefits (Pros)</span>
                </span>
                <ul className="tradeoff-list">
                  {selectedStrategy.pros && selectedStrategy.pros.map((pro, pIdx) => (
                    <li key={pIdx}>
                      <span className="tradeoff-bullet" style={{ color: 'var(--status-normal)' }}>✓</span>
                      <span>{pro}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="tradeoff-column">
                <span className="tradeoff-title" style={{ color: 'var(--status-warning)' }}>
                  <AlertCircle size={13} />
                  <span>Operational Limitations (Cons)</span>
                </span>
                <ul className="tradeoff-list">
                  {selectedStrategy.cons && selectedStrategy.cons.map((con, cIdx) => (
                    <li key={cIdx}>
                      <span className="tradeoff-bullet" style={{ color: 'var(--status-warning)' }}>⚠</span>
                      <span>{con}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pairwise Head-to-Head Comparisons for Selected Strategy */}
            {relevantPairwise.length > 0 && (
              <div className="pairwise-section">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer'
                  }}
                  onClick={() => setShowPairwise(!showPairwise)}
                  role="button"
                  tabIndex={0}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <GitCompare size={13} style={{ color: 'var(--accent-cyan)' }} />
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        color: 'var(--text-primary)'
                      }}
                    >
                      Head-to-Head Pairwise Comparisons ({selectedStrategy.strategy_code} vs Alternatives)
                    </span>
                  </div>
                  <button type="button" className="pairwise-toggle-btn">
                    {showPairwise ? (
                      <>
                        <span>Hide</span>
                        <ChevronUp size={12} />
                      </>
                    ) : (
                      <>
                        <span>Expand ({relevantPairwise.length})</span>
                        <ChevronDown size={12} />
                      </>
                    )}
                  </button>
                </div>

                {showPairwise && (
                  <div className="pairwise-grid">
                    {relevantPairwise.map((comp, idx) => {
                      const isA = comp.strategy_a_id === selectedStrategy.strategy_id
                      const opponentId = isA ? comp.strategy_b_id : comp.strategy_a_id
                      const opponent = strategies.find((s) => s.strategy_id === opponentId)
                      const isWinner = comp.winner_id === selectedStrategy.strategy_id

                      return (
                        <div key={idx} className="pairwise-card">
                          <div className="pairwise-header">
                            <span style={{ color: 'var(--text-primary)' }}>
                              vs {opponent ? `${opponent.strategy_code} (${opponent.strategy_name})` : opponentId}
                            </span>
                            <span
                              className={`badge ${isWinner ? 'badge-normal' : 'badge-subtle'} font-mono`}
                              style={{ fontSize: '9px' }}
                            >
                              {isWinner ? 'Preferred in MCDA' : `Preferred: ${comp.winner_id}`}
                            </span>
                          </div>
                          <div className="pairwise-deltas font-mono">
                            <span
                              style={{
                                color: comp.delta_resilience >= 0 ? 'var(--status-normal)' : 'var(--status-critical)'
                              }}
                            >
                              Δ Resilience: {comp.delta_resilience > 0 ? `+${comp.delta_resilience}` : comp.delta_resilience}
                            </span>
                            <span>•</span>
                            <span
                              style={{
                                color: comp.delta_icu_pct >= 0 ? 'var(--status-normal)' : 'var(--status-warning)'
                              }}
                            >
                              Δ ICU: {comp.delta_icu_pct > 0 ? `+${comp.delta_icu_pct}%` : `${comp.delta_icu_pct}%`}
                            </span>
                            <span>•</span>
                            <span>
                              Δ Runtime: {comp.delta_runtime_hours > 0 ? `+${comp.delta_runtime_hours}h` : `${comp.delta_runtime_hours}h`}
                            </span>
                            <span>•</span>
                            <span>
                              Δ Rec: {comp.delta_recovery_min > 0 ? `+${comp.delta_recovery_min}m` : `${comp.delta_recovery_min}m`}
                            </span>
                            <span>•</span>
                            <span>
                              Δ Shed: {comp.delta_load_shed_kw > 0 ? `+${comp.delta_load_shed_kw} kW` : `${comp.delta_load_shed_kw} kW`}
                            </span>
                          </div>
                          <div className="pairwise-summary">
                            {comp.advantage_summary}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. Profile Sensitivity Section */}
        {profileSensitivity && (
          <div className="strategy-section">
            <div className="strategy-section-header">
              <span className="strategy-section-label">
                <Sliders size={13} style={{ color: 'var(--accent-cyan)' }} />
                <span>MCDA Profile Sensitivity Analysis</span>
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Optimal strategy selected by backend under different stakeholder operational priorities
              </span>
            </div>
            <div className="profile-sensitivity-grid">
              {Object.entries({
                balanced: { label: 'Balanced', desc: 'Equal weighting across patient safety, fuel preservation & recovery horizon' },
                life_safety: { label: 'Life Safety', desc: 'Maximum prioritization of ICU life support and emergency care continuity' },
                resource_conservation: { label: 'Resource Conservation', desc: 'Maximizes generator fuel reserves and autonomous runtime hours' },
                rapid_stabilization: { label: 'Rapid Stabilization', desc: 'Minimizes recovery time and procedural implementation latency' }
              }).map(([key, meta]) => {
                const winningId = profileSensitivity[key]
                const winningStrat = strategies.find((s) => s.strategy_id === winningId)
                return (
                  <div key={key} className="profile-sensitivity-card">
                    <span className="profile-name">{meta.label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="profile-winner font-mono">
                        {winningStrat ? winningStrat.strategy_code : winningId || '—'}
                      </span>
                      {winningStrat && (
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {winningStrat.strategy_name}
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {meta.desc}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 6. Comparative Decision Matrix Table */}
        <div className="strategy-section">
          <div className="strategy-section-header">
            <span className="strategy-section-label">
              <Layers size={13} style={{ color: 'var(--accent-cyan)' }} />
              <span>Comparative Multi-Criteria Decision Matrix</span>
            </span>
          </div>

          <div className="strategy-table-wrapper">
            <table className="strategy-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Strategy Code</th>
                  <th>Name</th>
                  <th>Projected Score</th>
                  <th>TOPSIS</th>
                  <th>Pareto</th>
                  <th>ICU Continuity</th>
                  <th>Backup Runtime</th>
                  <th>Load Shed</th>
                  <th>Recovery</th>
                  <th>Risk Level</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {strategies.map((strat) => {
                  const isRowSelected = strat.strategy_id === activeId
                  const isStratPareto =
                    paretoFrontierIds.includes(strat.strategy_id) ||
                    Boolean(strat.pareto_optimal || strat.is_pareto_optimal)

                  return (
                    <tr
                      key={strat.strategy_id}
                      className={`strategy-table-row ${isRowSelected ? 'is-selected' : ''} ${
                        strat.is_recommended ? 'is-recommended' : ''
                      }`}
                      onClick={() => handleSelect(strat.strategy_id)}
                    >
                      <td>
                        <span className="badge badge-subtle font-mono">
                          #{strat.recommendation_rank || 1}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>
                        {strat.strategy_code}
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {strat.strategy_name}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 700, color: getScoreColor(strat.projected_resilience_score) }}>
                        {strat.projected_resilience_score.toFixed(1)}
                      </td>
                      <td className="font-mono" style={{ color: 'var(--accent-cyan)' }}>
                        {typeof strat.topsis_score === 'number'
                          ? `${(strat.topsis_score * 100).toFixed(0)}%`
                          : '—'}
                      </td>
                      <td>
                        {isStratPareto ? (
                          <span className="badge badge-cyan font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                            Frontier
                          </span>
                        ) : (
                          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Dominated
                          </span>
                        )}
                      </td>
                      <td className="font-mono">
                        <span
                          style={{
                            color: strat.icu_continuity_pct >= 90 ? 'var(--status-normal)' : 'var(--status-warning)'
                          }}
                        >
                          {strat.icu_continuity_pct.toFixed(0)}%
                        </span>
                      </td>
                      <td className="font-mono">
                        {strat.backup_runtime_remaining_hours.toFixed(1)} hrs
                      </td>
                      <td className="font-mono">
                        {strat.non_critical_load_shed_kw.toFixed(0)} kW
                      </td>
                      <td className="font-mono">
                        {strat.estimated_recovery_time_min} min
                      </td>
                      <td>
                        <span className={`badge ${getRiskBadgeClass(strat.risk_level)} font-mono`}>
                          {strat.risk_level}
                        </span>
                      </td>
                      <td>
                        {strat.is_recommended ? (
                          <span className="badge badge-normal font-mono" style={{ fontSize: '9px' }}>
                            <Award size={10} style={{ marginRight: '3px' }} />
                            Recommended
                          </span>
                        ) : (
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                            Alternative
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
