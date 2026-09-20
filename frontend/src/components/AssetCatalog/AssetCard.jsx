import {
  Zap,
  BatteryCharging,
  Thermometer,
  Gauge,
  Clock,
  ShieldAlert,
  Server,
  Layers,
  Fuel
} from 'lucide-react'

export default function AssetCard({ asset, isSelected, onSelect }) {
  if (!asset) return null

  const {
    id,
    name,
    type,
    status = 'normal',
    health_score = 100,
    current_load = 0,
    nominal_capacity = 100,
    capacity_unit = 'kW',
    redundancy_level,
    fuel_level_pct,
    battery_level_pct,
    temperature_c,
    pressure_psi,
    runtime_remaining_min
  } = asset

  const loadPct = nominal_capacity > 0 ? Math.min(100, (current_load / nominal_capacity) * 100) : 0

  // Status color mapper
  const getStatusClass = (st) => {
    switch (st) {
      case 'normal': return 'asset-status-normal'
      case 'degraded': return 'asset-status-degraded'
      case 'critical': return 'asset-status-critical'
      case 'failed': return 'asset-status-failed'
      case 'offline': return 'asset-status-offline'
      case 'starting': return 'asset-status-starting'
      default: return 'asset-status-normal'
    }
  }

  // Load bar fill color
  const getLoadBarColor = () => {
    if (status === 'failed') return 'var(--status-critical)'
    if (status === 'offline') return 'var(--status-offline)'
    if (loadPct >= 90) return 'var(--status-warning)'
    return 'var(--accent-cyan)'
  }

  return (
    <div
      className={`asset-card ${isSelected ? 'is-selected' : ''}`}
      onClick={() => onSelect && onSelect(id)}
      role="button"
      tabIndex={0}
    >
      {/* Top Identity & Status */}
      <div className="asset-card-top">
        <div className="asset-card-identity">
          <div className="asset-card-id">
            <span>{id}</span>
          </div>
          <span className="asset-card-name">{name}</span>
        </div>
        <span className={`asset-status-pill ${getStatusClass(status)}`}>
          {status}
        </span>
      </div>

      {/* Capacity & Load Meter */}
      <div className="asset-load-section">
        <div className="asset-load-labels">
          <span className="asset-load-title">Load / Nominal</span>
          <span className="asset-load-val">
            {current_load.toFixed(0)} / {nominal_capacity.toFixed(0)} {capacity_unit} ({loadPct.toFixed(0)}%)
          </span>
        </div>
        <div className="asset-meter-track">
          <div
            className="asset-meter-fill"
            style={{
              width: `${loadPct}%`,
              backgroundColor: getLoadBarColor()
            }}
          />
        </div>
      </div>

      {/* Meta & Reserve Attributes (only non-null fields displayed) */}
      <div className="asset-meta-row">
        {/* Health Score */}
        <span className="asset-meta-badge" title="Asset Health Index">
          <ShieldAlert size={11} style={{ color: health_score >= 80 ? 'var(--status-normal)' : 'var(--status-warning)' }} />
          <span>Health {health_score.toFixed(0)}%</span>
        </span>

        {/* Redundancy */}
        {redundancy_level != null && (
          <span className="asset-meta-badge" title="Redundancy Architecture">
            <Layers size={11} style={{ color: 'var(--accent-cyan)' }} />
            <span>{redundancy_level > 1 ? `2N (${redundancy_level}x)` : 'N (Single)'}</span>
          </span>
        )}

        {/* Fuel Reserve */}
        {fuel_level_pct != null && (
          <span className="asset-meta-badge" title="Generator Fuel Reserve">
            <Fuel size={11} style={{ color: 'var(--status-warning)' }} />
            <span>Fuel {fuel_level_pct.toFixed(0)}%</span>
          </span>
        )}

        {/* Battery Reserve */}
        {battery_level_pct != null && (
          <span className="asset-meta-badge" title="UPS Battery State of Charge">
            <BatteryCharging size={11} style={{ color: 'var(--status-normal)' }} />
            <span>Battery {battery_level_pct.toFixed(0)}%</span>
          </span>
        )}

        {/* Temperature */}
        {temperature_c != null && (
          <span className="asset-meta-badge" title="Core Operating Temperature">
            <Thermometer size={11} style={{ color: 'var(--text-muted)' }} />
            <span>{temperature_c.toFixed(1)}°C</span>
          </span>
        )}

        {/* Pressure */}
        {pressure_psi != null && (
          <span className="asset-meta-badge" title="Operating Pressure">
            <Gauge size={11} style={{ color: 'var(--accent-cyan)' }} />
            <span>{pressure_psi.toFixed(0)} PSI</span>
          </span>
        )}

        {/* Runtime Remaining */}
        {runtime_remaining_min != null && (
          <span className="asset-meta-badge" title="Estimated Time to Resource Exhaustion">
            <Clock size={11} style={{ color: 'var(--text-secondary)' }} />
            <span>
              {runtime_remaining_min >= 60
                ? `${(runtime_remaining_min / 60).toFixed(1)}h run`
                : `${runtime_remaining_min.toFixed(0)}m run`}
            </span>
          </span>
        )}
      </div>
    </div>
  )
}
