import { Shield, TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react'
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

  const deltaFormatted = typeof delta_from_baseline === 'number'
    ? (delta_from_baseline > 0
        ? `+${delta_from_baseline.toFixed(1)}`
        : delta_from_baseline === 0
        ? '0.0'
        : delta_from_baseline.toFixed(1))
    : '—'

  // SVG Gauge calculations
  // Radius = 68, Circumference = 2 * PI * 68 = ~427.26
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const clampedScore = Math.min(100, Math.max(0, overall_score))
  // Gauge spans 260 degrees arc (from 140deg to 400deg / 40deg)
  // Let's use a 270 degree arc for a classic industrial tachometer/gauge look
  const arcLength = circumference * 0.75
  const strokeDashoffset = arcLength - (arcLength * clampedScore) / 100

  return (
    <div className="resilience-card" id="resilience-overview-card">
      {/* Card Header */}
      <div className="resilience-card-header">
        <div className="resilience-card-title">
          <Shield size={16} style={{ color: 'var(--accent-cyan)' }} />
          <span>Composite Resilience Index</span>
        </div>
        <div className="resilience-header-tags">
          <span className="badge badge-cyan font-mono">
            Bounded Index (0–100)
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="resilience-card-body">
        {/* Gauge & Main Metric Hero Section */}
        <div className="resilience-hero-section">
          {/* Circular SVG Gauge Graphic */}
          <div className="resilience-gauge-wrapper">
            <svg
              className="resilience-gauge-svg"
              viewBox="0 0 180 180"
              width="170"
              height="170"
            >
              <defs>
                <linearGradient id="gaugeGradientNormal" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
                <linearGradient id="gaugeGradientCritical" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F59E0B" />
                  <stop offset="100%" stopColor="#EF4444" />
                </linearGradient>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Decorative outer radar ring */}
              <circle
                cx="90"
                cy="90"
                r="78"
                fill="none"
                stroke="var(--border-subtle)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />

              {/* Base background track */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="var(--border-default)"
                strokeWidth="10"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(135 90 90)"
              />

              {/* Active illuminated value arc */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke={overall_score >= 80 ? 'url(#gaugeGradientNormal)' : 'url(#gaugeGradientCritical)'}
                strokeWidth="11"
                strokeDasharray={`${arcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform="rotate(135 90 90)"
                filter="url(#glowEffect)"
                style={{
                  transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1), stroke 0.5s ease'
                }}
              />
            </svg>

            {/* Gauge Centered Numeric Readout */}
            <div className="gauge-center-content">
              <span className="gauge-center-num font-mono" style={{ color: status_color }}>
                {overall_score.toFixed(1)}
              </span>
              <span className="gauge-center-scale font-mono">/ 100.0</span>
              <span
                className="gauge-center-status-badge"
                style={{
                  color: status_color,
                  backgroundColor: `${status_color}18`,
                  borderColor: `${status_color}50`
                }}
              >
                {status_label}
              </span>
            </div>
          </div>

          {/* Metric Details & Delta Status */}
          <div className="resilience-meta-summary">
            <div className="meta-summary-heading">
              <span className="meta-summary-title">Operational Health Vector</span>
              <span className="meta-summary-desc">
                Real-time composite weighted synthesis of telemetry resilience across clinical services & backup reserves.
              </span>
            </div>

            <div className="meta-summary-chips">
              <div className="resilience-delta-badge font-mono">
                {typeof delta_from_baseline === 'number' && delta_from_baseline < 0 ? (
                  <TrendingDown size={14} style={{ color: 'var(--status-critical)' }} />
                ) : typeof delta_from_baseline === 'number' && delta_from_baseline > 0 ? (
                  <TrendingUp size={14} style={{ color: 'var(--status-normal)' }} />
                ) : (
                  <Minus size={14} style={{ color: 'var(--text-muted)' }} />
                )}
                <span style={{ color: 'var(--text-muted)' }}>Baseline Delta:</span>
                <span
                  className="resilience-delta-val"
                  style={{
                    color: typeof delta_from_baseline === 'number' && delta_from_baseline < 0 ? 'var(--status-critical)' : 'var(--text-secondary)'
                  }}
                >
                  {deltaFormatted}{typeof delta_from_baseline === 'number' ? ' pts' : ''}
                </span>
              </div>

              <div className="resilience-state-badge font-mono">
                <span className="status-dot status-dot-pulse" style={{ backgroundColor: status_color }} />
                <span>State: <strong style={{ color: status_color }}>{status_label}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Multi-Criteria Sub-Scores Grid */}
        <div className="subscores-section">
          <div className="subscores-heading">
            <Activity size={13} style={{ color: 'var(--accent-cyan)' }} />
            <span>Multi-Criteria Sub-Factor Decomposition</span>
          </div>

          <div className="subscores-grid">
            {subscoreItems.map((item) => (
              <div key={item.id} className="subscore-box">
                <div className="subscore-top">
                  <div className="subscore-name-group">
                    <span className="subscore-name">{item.name}</span>
                    <span className="subscore-symbol">Factor {item.symbol}</span>
                  </div>
                  <span className="subscore-weight font-mono" title="Formula Weight">
                    w = {item.weight}
                  </span>
                </div>

                <div className="subscore-value-row">
                  <span className="subscore-value-num font-mono" style={{ color: item.color }}>
                    {item.value.toFixed(1)}%
                  </span>
                </div>

                <div className="subscore-meter-track">
                  <div
                    className="subscore-meter-fill"
                    style={{
                      width: `${Math.min(100, Math.max(0, item.value))}%`,
                      backgroundColor: item.color,
                      boxShadow: `0 0 8px ${item.color}80`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
