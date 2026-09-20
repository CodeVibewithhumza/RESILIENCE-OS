import { AlertTriangle, ShieldCheck, HeartPulse, User, Zap } from 'lucide-react'

export default function ServiceCard({ service, isSelected, onSelect }) {
  if (!service) return null

  const {
    id,
    name,
    location,
    criticality = 5,
    status = 'full_operation',
    service_continuity_pct = 100,
    backup_priority = 1,
    at_risk = false,
    risk_reason,
    estimated_active_patients = 0,
    required_power_kw = 100,
    requires_medical_gas,
    requires_hvac_cooling
  } = service

  // Criticality classification
  const getCritClass = (crit) => {
    if (crit >= 5) return 'crit-5'
    if (crit >= 3) return 'crit-3'
    return 'crit-1'
  }

  // Status badge styling
  const getStatusBadgeClass = (st) => {
    switch (st) {
      case 'full_operation': return 'badge-normal'
      case 'reduced_capacity': return 'badge-warning'
      case 'critical_only': return 'badge-warning'
      case 'compromised': return 'badge-critical'
      case 'evacuating': return 'badge-critical'
      default: return 'badge-normal'
    }
  }

  const continuityColor = service_continuity_pct >= 90
    ? 'var(--status-normal)'
    : service_continuity_pct >= 60
    ? 'var(--status-warning)'
    : 'var(--status-critical)'

  return (
    <div
      className={`service-card ${criticality >= 5 ? 'is-critical-service' : ''} ${at_risk ? 'is-at-risk' : ''} ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect && onSelect(id)}
      role="button"
      tabIndex={0}
    >
      {/* Header Row */}
      <div className="service-card-header-row">
        <div className="service-title-group">
          <div className="service-name">
            <HeartPulse size={16} style={{ color: criticality >= 5 ? 'var(--accent-cyan)' : 'var(--text-muted)' }} />
            <span>{name}</span>
          </div>
          <span className="service-location">{location}</span>
        </div>

        <div className="service-badges-row">
          <span className={`criticality-badge ${getCritClass(criticality)}`} title={`Criticality Level ${criticality} / 5`}>
            L{criticality} Crit
          </span>
          <span className={`badge ${getStatusBadgeClass(status)} font-mono`}>
            {status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Continuity Progress Bar */}
      <div className="service-continuity-block">
        <div className="service-continuity-header">
          <span className="continuity-title">Service Continuity</span>
          <span className="continuity-val" style={{ color: continuityColor }}>
            {service_continuity_pct.toFixed(0)}%
          </span>
        </div>
        <div className="service-meter-track">
          <div
            className="service-meter-fill"
            style={{
              width: `${Math.min(100, Math.max(0, service_continuity_pct))}%`,
              backgroundColor: continuityColor
            }}
          />
        </div>
      </div>

      {/* At-Risk Alert Box (only displayed if at_risk is true) */}
      {at_risk && (
        <div className="service-risk-alert">
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>Service At Risk: </strong>
            <span>{risk_reason || 'Upstream dependency threshold compromised.'}</span>
          </div>
        </div>
      )}

      {/* Footer Meta */}
      <div className="service-meta-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
            <User size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="font-mono">{estimated_active_patients} pts</span>
          </span>

          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)' }}>
            <Zap size={12} />
            <span className="font-mono">{required_power_kw}kW</span>
          </span>
        </div>

        <div className="service-demands-pills">
          <span className="demand-pill" title="Backup Generator Switchboard Priority">
            Pri #{backup_priority}
          </span>
          {requires_medical_gas && (
            <span className="demand-pill" title="Requires Medical Oxygen Feed">
              O2
            </span>
          )}
          {requires_hvac_cooling && (
            <span className="demand-pill" title="Requires Continuous Chilled Air HVAC">
              HVAC
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
