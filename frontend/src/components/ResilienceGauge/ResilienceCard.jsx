import { Shield, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import './ResilienceCard.css'

export default function ResilienceCard({ resilience }) {
  if (!resilience) return null

  const {
    overall_score = 94.5,
    status_label = 'OPTIMAL',
    status_color = '#10B981',
    delta_from_baseline = 0.0,
    sub_scores = {},
    weights = {}
  } = resilience

  const serviceContinuity = sub_scores.service_continuity ?? 100
  const backupMargin = sub_scores.backup_margin ?? 92.5
  const stabilityFactor = sub_scores.stability_factor ?? 100
  const recoveryReadiness = sub_scores.recovery_readiness ?? 85

  const subscoreItems = [
    {
      id: 'sc',
      name: 'Service Continuity',
      symbol: 'Sc',
      weight: weights.service_continuity ? `${(weights.service_continuity * 100).toFixed(0)}%` : '40%',
      value: serviceContinuity,
      color: serviceContinuity >= 80 ? 'var(--status-normal)' : serviceContinuity >= 50 ? 'var(--status-warning)' : 'var(--status-critical)'
    },
    {
      id: 'rb',
      name: 'Backup Margin',
      symbol: 'Rb',
      weight: weights.backup_margin ? `${(weights.backup_margin * 100).toFixed(0)}%` : '25%',
      value: backupMargin,
      color: backupMargin >= 70 ? 'var(--status-stable)' : backupMargin >= 40 ? 'var(--status-warning)' : 'var(--status-critical)'
    },
    {
      id: 'ap',
      name: 'Stability Factor',
      symbol: 'Ap',
      weight: weights.stability_factor ? `${(weights.stability_factor * 100).toFixed(0)}%` : '20%',
      value: stabilityFactor,
      color: stabilityFactor >= 75 ? 'var(--accent-cyan)' : stabilityFactor >= 45 ? 'var(--status-warning)' : 'var(--status-critical)'
    },
    {
      id: 'lr',
      name: 'Recovery Readiness',
      symbol: 'Lr',
      weight: weights.recovery_readiness ? `${(weights.recovery_readiness * 100).toFixed(0)}%` : '15%',
      value: recoveryReadiness,
      color: recoveryReadiness >= 75 ? 'var(--status-normal)' : recoveryReadiness >= 40 ? 'var(--status-warning)' : 'var(--status-critical)'
    }
  ]

  const deltaFormatted = delta_from_baseline > 0
    ? `+${delta_from_baseline.toFixed(1)}`
    : delta_from_baseline === 0
    ? '0.0'
    : delta_from_baseline.toFixed(1)

  return (
    <div className="resilience-card">
      <div className="resilience-card-header">
        <div className="resilience-card-title">
          <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Composite Resilience Index</span>
        </div>
        <span className="badge badge-cyan font-mono">
          Bounded Formulation (0–100)
        </span>
      </div>

      <div className="resilience-card-body">
        {/* Prominent Score Hero Banner */}
        <div className="resilience-hero-section">
          <div className="resilience-hero-left">
            <span className="resilience-hero-num" style={{ color: status_color }}>
              {overall_score.toFixed(1)}
            </span>
            <span className="resilience-hero-scale">/ 100.0</span>
          </div>

          <div className="resilience-hero-meta">
            <div
              className="resilience-status-badge"
              style={{
                color: status_color,
                backgroundColor: `${status_color}18`,
                borderColor: `${status_color}45`
              }}
            >
              <span className="status-dot" style={{ backgroundColor: status_color }} />
              <span>{status_label}</span>
            </div>

            <div className="resilience-delta-badge font-mono">
              {delta_from_baseline < 0 ? (
                <TrendingDown size={13} style={{ color: 'var(--status-critical)' }} />
              ) : delta_from_baseline > 0 ? (
                <TrendingUp size={13} style={{ color: 'var(--status-normal)' }} />
              ) : (
                <Minus size={13} style={{ color: 'var(--text-muted)' }} />
              )}
              <span>Baseline Delta:</span>
              <span
                className="resilience-delta-val"
                style={{
                  color: delta_from_baseline < 0 ? 'var(--status-critical)' : 'var(--text-secondary)'
                }}
              >
                {deltaFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* 4 Multi-Criteria Sub-Scores */}
        <div className="subscores-grid">
          {subscoreItems.map((item) => (
            <div key={item.id} className="subscore-box">
              <div className="subscore-top">
                <div className="subscore-name-group">
                  <span className="subscore-name">{item.name}</span>
                  <span className="subscore-symbol">Factor {item.symbol}</span>
                </div>
                <span className="subscore-weight" title="Formula Weight">
                  w = {item.weight}
                </span>
              </div>

              <div className="subscore-value-row">
                <span className="subscore-value-num" style={{ color: item.color }}>
                  {item.value.toFixed(1)}%
                </span>
              </div>

              <div className="subscore-meter-track">
                <div
                  className="subscore-meter-fill"
                  style={{
                    width: `${Math.min(100, Math.max(0, item.value))}%`,
                    backgroundColor: item.color
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
