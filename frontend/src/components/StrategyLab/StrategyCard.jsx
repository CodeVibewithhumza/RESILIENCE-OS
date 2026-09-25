import { Clock, Award } from 'lucide-react'

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
      {/* Recommended banner on top if applicable */}
      {is_recommended && (
        <div className="recommended-banner">
          <Award size={12} />
          <span>Recommended Response</span>
        </div>
      )}

      {/* Card Header */}
      <div className="strategy-card-header">
        <div className="strategy-card-header-left">
          <div className="strategy-card-identity">
            <span className="strategy-card-code font-mono">{strategy_code}</span>
            {recommendation_rank && (
              <span className="badge badge-subtle font-mono" style={{ fontSize: '9px' }}>
                Rank #{recommendation_rank}
              </span>
            )}
            {(strategy.pareto_optimal || strategy.is_pareto_optimal) && (
              <span className="badge badge-cyan font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
                Pareto
              </span>
            )}
          </div>
          <div className="strategy-card-name">{strategy_name}</div>
        </div>

        <div className="strategy-score-pill">
          <span
            className="strategy-score-val font-mono"
            style={{ color: getScoreColor(projected_resilience_score) }}
          >
            {projected_resilience_score.toFixed(1)}
          </span>
          <span className="strategy-score-label">Projected</span>
        </div>
      </div>

      {/* Primary Comparison Metrics Row */}
      <div className="strategy-card-metrics">
        <div className="card-metric-cell">
          <span className="card-metric-label">ICU Continuity</span>
          <span
            className="card-metric-val font-mono"
            style={{
              color: icu_continuity_pct >= 90 ? 'var(--status-normal)' : 'var(--status-warning)'
            }}
          >
            {icu_continuity_pct.toFixed(0)}%
          </span>
        </div>

        <div className="card-metric-cell">
          <span className="card-metric-label">Backup Runtime</span>
          <span className="card-metric-val font-mono">
            {backup_runtime_remaining_hours.toFixed(1)}h
          </span>
        </div>

        <div className="card-metric-cell">
          <span className="card-metric-label">Load Shed</span>
          <span className="card-metric-val font-mono">
            {non_critical_load_shed_kw.toFixed(0)} kW
          </span>
        </div>
      </div>

      {/* Footer Details: Recovery, TOPSIS & Risk */}
      <div className="strategy-card-footer">
        <span className="strategy-footer-recovery">
          <Clock size={11} style={{ color: 'var(--text-muted)' }} />
          <span>Est. Recovery: </span>
          <strong className="font-mono" style={{ color: 'var(--text-secondary)' }}>{estimated_recovery_time_min}m</strong>
        </span>
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {typeof strategy.topsis_score === 'number' && (
            <span className="badge badge-subtle font-mono" style={{ fontSize: '9px', padding: '1px 5px' }}>
              {(strategy.topsis_score * 100).toFixed(0)}% TOPSIS
            </span>
          )}
          <span className={`badge ${getRiskBadgeClass(risk_level)} font-mono`}>
            {risk_level} Risk
          </span>
        </div>
      </div>
    </div>
  )
}
