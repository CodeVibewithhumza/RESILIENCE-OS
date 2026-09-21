import {
  Sliders,
  Award,
  CheckCircle2,
  AlertCircle,
  Layers,
  LayoutGrid
} from 'lucide-react'
import StrategyCard from './StrategyCard'
import './StrategyLab.css'

export default function StrategyMatrix({
  strategies = [],
  selectedStrategyId,
  onSelectStrategy
}) {
  const defaultSelected = strategies.find((s) => s.is_recommended)?.strategy_id || strategies[0]?.strategy_id
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
    switch (risk.toLowerCase()) {
      case 'low': return 'badge-normal'
      case 'medium': return 'badge-warning'
      case 'high': return 'badge-critical'
      case 'critical': return 'badge-critical'
      default: return 'badge-offline'
    }
  }

  return (
    <div className="strategy-lab-container" id="strategy-lab-module">
      {/* 1. Header */}
      <div className="strategy-lab-header">
        <div className="strategy-lab-title-group">
          <div className="strategy-lab-title">
            <Sliders size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>WHAT-IF STRATEGY LAB</span>
          </div>
          <span className="strategy-lab-subtitle">
            Simulated Response Interventions & Trade-off Optimization
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-cyan font-mono">
            {strategies.length} Strategies Evaluated
          </span>
        </div>
      </div>

      <div className="strategy-lab-body">
        {/* 2. Horizontal Strategy Cards Overview (6 Cards) */}
        <div className="strategy-section">
          <div className="strategy-section-header">
            <span className="strategy-section-label">
              <LayoutGrid size={13} style={{ color: 'var(--accent-cyan)' }} />
              <span>Intervention Catalog (Select to Inspect)</span>
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Click any strategy to inspect clinical impact and operational trade-offs
            </span>
          </div>

          <div className="strategy-cards-horizontal-grid">
            {strategies.map((strat) => (
              <StrategyCard
                key={strat.strategy_id}
                strategy={strat}
                isSelected={strat.strategy_id === activeId}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>

        {/* 3. Selected Strategy Detailed Outcome Inspector */}
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
                    Rank #{selectedStrategy.recommendation_rank}
                  </span>
                  {selectedStrategy.is_recommended && (
                    <span className="badge badge-normal">
                      <Award size={12} style={{ marginRight: '4px' }} />
                      Recommended Strategy
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Interactive inspection of simulated outcome parameters & resource conservation
                </span>
              </div>

              <div className="inspector-score-badge">
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
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
          </div>
        )}

        {/* 4. Comparative Matrix Table */}
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
                          #{strat.recommendation_rank}
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
