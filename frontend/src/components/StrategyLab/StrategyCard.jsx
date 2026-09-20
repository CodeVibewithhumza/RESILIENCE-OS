import { CheckCircle2, Clock, Zap, HeartPulse, AlertCircle, Award } from 'lucide-react'

export default function StrategyCard({ strategy, isSelected, onSelect }) {
  if (!strategy) return null

  const {
    strategy_id,
    strategy_name,
    strategy_code,
    projected_resilience_score = 0,
    icu_continuity_pct = 0,
    backup_runtime_remaining_hours = 0,
    non_critical_load_shed_kw = 0,
    estimated_recovery_time_min = 0,
    risk_level = 'Medium',
    recommendation_rank,
    pros = [],
    cons = [],
    is_recommended = false
  } = strategy

  // Score color coding
  const getScoreColor = (score) => {
    if (score >= 85) return 'var(--status-normal)'
    if (score >= 70) return 'var(--status-stable)'
    if (score >= 50) return 'var(--status-warning)'
    return 'var(--status-critical)'
  }

  // Risk badge styling
  const getRiskBadgeClass = (risk) => {
    switch (risk.toLowerCase()) {
      case 'low': return 'badge-normal'
      case 'medium': return 'badge-warning'
      case 'high': return 'badge-critical'
      case 'critical': return 'badge-critical'
      default: return 'badge-offline'
    }
  }

  return (
    <div
      className={`strategy-card ${is_recommended ? 'is-recommended-card' : ''} ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect && onSelect(strategy_id)}
      role="button"
      tabIndex={0}
    >
      {/* Card Header */}
      <div className="strategy-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="strategy-card-code">{strategy_code}</span>
            {recommendation_rank && (
              <span className="badge badge-offline font-mono" style={{ fontSize: '10px' }}>
                Rank #{recommendation_rank}
              </span>
            )}
          </div>
          <div className="strategy-card-name">{strategy_name}</div>
        </div>

        <div className="strategy-score-pill">
          <span
            className="strategy-score-val"
            style={{ color: getScoreColor(projected_resilience_score) }}
          >
            {projected_resilience_score.toFixed(1)}
          </span>
          <span className="strategy-score-label">Projected</span>
        </div>
      </div>

      {/* Recommended simulated response tag (driven strictly by fixture is_recommended) */}
      {is_recommended && (
        <div className="recommended-banner">
          <Award size={13} />
          <span>Recommended simulated response</span>
        </div>
      )}

      {/* Primary Comparison Metrics Row */}
      <div className="strategy-card-metrics">
        <div className="card-metric-cell">
          <span className="card-metric-label">ICU Cont.</span>
          <span
            className="card-metric-val"
            style={{
              color: icu_continuity_pct >= 90 ? 'var(--status-normal)' : 'var(--status-warning)'
            }}
          >
            {icu_continuity_pct.toFixed(0)}%
          </span>
        </div>

        <div className="card-metric-cell">
          <span className="card-metric-label">Backup Run</span>
          <span className="card-metric-val">
            {backup_runtime_remaining_hours.toFixed(1)}h
          </span>
        </div>

        <div className="card-metric-cell">
          <span className="card-metric-label">Load Shed</span>
          <span className="card-metric-val">
            {non_critical_load_shed_kw.toFixed(0)} kW
          </span>
        </div>
      </div>

      {/* Trade-offs summary */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          Est. Recovery: <span className="font-mono" style={{ color: 'var(--text-secondary)' }}>{estimated_recovery_time_min}m</span>
        </span>
        <span className={`badge ${getRiskBadgeClass(risk_level)} font-mono`}>
          {risk_level} Risk
        </span>
      </div>
    </div>
  )
}
