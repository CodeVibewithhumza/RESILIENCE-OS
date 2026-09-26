import { useState } from 'react'
import {
  Play,
  RotateCcw,
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Activity
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './StartSimulationView.css'

/**
 * Canonical incident definitions mapped to backend failure topology contracts.
 */
const INCIDENT_CONFIG = {
  transformer: {
    id: 'transformer',
    name: 'Primary Transformer Failure (T1)',
    category: 'electrical',
    desc: 'Loss of main 415V transformer supply',
    asset_id: 'TRANSFORMER_01',
    failure_type: 'transformer_thermal_trip'
  },
  grid: {
    id: 'grid',
    name: '11kV Utility Grid Blackout',
    category: 'electrical',
    desc: 'Total loss of external city power grid',
    asset_id: 'GRID_MAIN',
    failure_type: 'complete_outage'
  },
  gen: {
    id: 'gen',
    name: 'Standby Generator Start Failure',
    category: 'electrical',
    desc: 'Backup diesel generator fails to crank',
    asset_id: 'GEN_01',
    failure_type: 'generator_failure'
  },
  ups: {
    id: 'ups',
    name: 'UPS Battery Depletion / Inverter Fault',
    category: 'electrical',
    desc: 'Static battery bank depleted',
    asset_id: 'UPS_CRITICAL',
    failure_type: 'battery_depletion'
  },
  o2_rupture: {
    id: 'o2_rupture',
    name: 'Cryogenic O2 Pipeline Rupture',
    category: 'gas',
    desc: 'Pressure drop in main oxygen distribution line',
    asset_id: 'OXYGEN_MANIFOLD',
    failure_type: 'pressure_loss'
  },
  chiller_trip: {
    id: 'chiller_trip',
    name: 'HVAC Chiller Thermal Trip',
    category: 'hvac',
    desc: 'Loss of cleanroom surgical air cooling',
    asset_id: 'CHILLER_PLANT',
    failure_type: 'compressor_failure'
  },
  water_pump: {
    id: 'water_pump',
    name: 'Primary Water Booster Pump Cavitation',
    category: 'water',
    desc: 'Loss of potable water header pressure and autoclave supply',
    asset_id: 'WATER_PUMP_STATION',
    failure_type: 'pump_cavitation'
  },
  combined: {
    id: 'combined',
    name: 'Compound Grid Blackout + Emergency Generator Lockout',
    category: 'combined',
    desc: 'Multi-system cascade disruption with elevated ambient heatwave',
    asset_id: 'GRID_MAIN',
    failure_type: 'lockout'
  }
}

const SEVERITY_MAP = {
  full: 'high',
  partial: 'medium',
  intermittent: 'low'
}

const DURATION_MAP = {
  '1': 60,
  '2': 120,
  '4': 240
}

export default function StartSimulationView({
  assets = [],
  services = [],
  incident = {},
  onTriggerFailure,
  onReset
}) {
  const [selectedCategory, setSelectedCategory] = useState('electrical')
  const [selectedIncident, setSelectedIncident] = useState('transformer')
  const [severity, setSeverity] = useState('full')
  const [duration, setDuration] = useState('2')
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  const isIncidentActive = Boolean(incident?.is_active)

  // Filter incidents strictly by selected category
  const filteredIncidents = Object.values(INCIDENT_CONFIG).filter(
    (inc) => inc.category === selectedCategory
  )

  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    setSubmitError(null)
    const matches = Object.values(INCIDENT_CONFIG).filter((inc) => inc.category === catId)
    if (matches.length > 0) {
      if (!matches.some((m) => m.id === selectedIncident)) {
        setSelectedIncident(matches[0].id)
      }
    }
  }

  const handleLaunch = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    const incidentConfig = INCIDENT_CONFIG[selectedIncident] || INCIDENT_CONFIG.transformer
    const targetAssetId = incidentConfig.asset_id

    const payload = {
      asset_id: targetAssetId,
      failure_type: incidentConfig.failure_type,
      severity: SEVERITY_MAP[severity] || 'high',
      duration_minutes: DURATION_MAP[duration] || 120,
      compound_heatwave: selectedCategory === 'combined'
    }

    try {
      if (onTriggerFailure) {
        const result = await onTriggerFailure(payload)
        if (result && !result.success) {
          setSubmitError(result.error || 'Failed to inject disruption')
        }
      }
    } catch (err) {
      setSubmitError(err?.message || 'Error executing disruption injection')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReset = () => {
    setSubmitError(null)
    if (onReset) {
      onReset()
    }
  }

  // --- Dynamic Preview Cards (Derived strictly from backend incident state) ---

  // 1. Services at Risk
  let servicesAtRiskDisplay = '0 (All Normal)'
  let servicesAtRiskColor = '#10B981'
  if (isIncidentActive) {
    const srvCount = incident?.affected_service_ids?.length
    if (typeof srvCount === 'number' && srvCount > 0) {
      servicesAtRiskDisplay = `${srvCount} Unit${srvCount === 1 ? '' : 's'}`
      servicesAtRiskColor = '#EF4444'
    } else if (typeof srvCount === 'number') {
      servicesAtRiskDisplay = '0 Units'
    } else {
      servicesAtRiskDisplay = '—'
    }
  }

  // 2. Affected Assets
  let affectedAssetsDisplay = '0 Nodes'
  let affectedAssetsColor = '#00F0FF'
  if (isIncidentActive) {
    const assetCount = incident?.affected_asset_ids?.length
    if (typeof assetCount === 'number' && assetCount > 0) {
      affectedAssetsDisplay = `${assetCount} Node${assetCount === 1 ? '' : 's'}`
      affectedAssetsColor = '#F59E0B'
    } else if (typeof assetCount === 'number') {
      affectedAssetsDisplay = '0 Nodes'
    } else {
      affectedAssetsDisplay = '—'
    }
  }

  // 3. Time to First Impact
  let timeToFirstImpactDisplay = 'N/A'
  if (isIncidentActive) {
    if (typeof incident?.estimated_unmitigated_blackout_min === 'number') {
      timeToFirstImpactDisplay = `~${Math.round(incident.estimated_unmitigated_blackout_min)} min`
    } else if (
      Array.isArray(incident?.timeline) &&
      incident.timeline.length > 1 &&
      typeof incident.timeline[1]?.t_offset_min === 'number'
    ) {
      timeToFirstImpactDisplay = `~${incident.timeline[1].t_offset_min} min`
    } else {
      timeToFirstImpactDisplay = '—'
    }
  }

  return (
    <div className="start-sim-page">
      {/* Header Bar */}
      <div className="sim-header-row">
        <div>
          <h1 className="sim-page-title">Failure Injection & Cascade Simulation</h1>
          <p className="sim-page-subtitle">
            Inject discrete equipment disruptions, simulate real-time multi-hop cascading impacts, and observe 3D digital twin reactions
          </p>
        </div>
        <div className="sim-status-pill font-mono">
          <Activity size={13} style={{ color: isIncidentActive ? '#EF4444' : '#10B981' }} />
          <span>{isIncidentActive ? 'SIMULATION ACTIVE' : 'ENGINE READY'}</span>
        </div>
      </div>

      {/* Category Tile Selector Row */}
      <div className="sim-category-tiles">
        {[
          { id: 'electrical', label: 'Electrical Failure', desc: 'Grid / Transformer / DG / UPS', icon: Zap, color: '#00F0FF' },
          { id: 'gas', label: 'Medical Gas System', desc: 'Oxygen / Vacuum / Manifold', icon: Flame, color: '#10B981' },
          { id: 'hvac', label: 'HVAC Cleanrooms', desc: 'Chillers / AHU / Ducts', icon: Wind, color: '#F59E0B' },
          { id: 'water', label: 'Water Distribution', desc: 'Booster Pumps / Storage Tank', icon: Droplets, color: '#38BDF8' },
          { id: 'combined', label: 'Combined Disaster', desc: 'Multi-System Cascade Event', icon: AlertTriangle, color: '#EF4444' }
        ].map((cat) => {
          const Icon = cat.icon
          return (
            <div
              key={cat.id}
              className={`cat-tile ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              <div
                className="cat-icon-wrap"
                style={{
                  background: `rgba(${cat.id === 'combined' ? '239, 68, 68' : '0, 240, 255'}, 0.15)`,
                  color: cat.color
                }}
              >
                <Icon size={18} />
              </div>
              <div className="cat-info">
                <span className="cat-name">{cat.label}</span>
                <span className="cat-sub">{cat.desc}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* 2-Column Main Workspace */}
      <div className="sim-workspace-grid">
        {/* Left Column: Parameter Selection & Run Button */}
        <div className="sim-controls-col">
          {/* 1. Incident Picker */}
          <div className="sim-card">
            <div className="sim-card-header">
              <span className="sim-card-step font-mono">1</span>
              <span className="sim-card-title">Select Disruption Scenario</span>
            </div>
            <div className="incident-radio-list">
              {filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`incident-radio-row ${selectedIncident === inc.id ? 'selected' : ''}`}
                  onClick={() => setSelectedIncident(inc.id)}
                >
                  <input
                    type="radio"
                    name="incident-choice"
                    checked={selectedIncident === inc.id}
                    onChange={() => setSelectedIncident(inc.id)}
                  />
                  <div className="incident-text-group">
                    <span className="inc-title">{inc.name}</span>
                    <span className="inc-desc">{inc.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Parameters */}
          <div className="sim-card">
            <div className="sim-card-header">
              <span className="sim-card-step font-mono">2</span>
              <span className="sim-card-title">Configure Parameters</span>
            </div>
            <div className="param-fields-grid">
              <div className="param-field">
                <label className="param-label">Disruption Severity</label>
                <select
                  className="param-select font-mono"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="full">Full Trip (100% Failure)</option>
                  <option value="partial">Partial Degradation (50%)</option>
                  <option value="intermittent">Intermittent Brownout</option>
                </select>
              </div>

              <div className="param-field">
                <label className="param-label">Simulation Horizon</label>
                <select
                  className="param-select font-mono"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1">1.0 Hour (Immediate)</option>
                  <option value="2">2.0 Hours (Standard)</option>
                  <option value="4">4.0 Hours (Extended Outage)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Launch Action */}
          <div className="sim-launch-bar">
            {isIncidentActive ? (
              <button
                type="button"
                className="sim-reset-action-btn"
                onClick={handleReset}
              >
                <RotateCcw size={14} />
                <span>Reset Simulation to Normal</span>
              </button>
            ) : (
              <button
                type="button"
                className="sim-start-action-btn"
                onClick={handleLaunch}
                disabled={isSubmitting}
                style={{
                  opacity: isSubmitting ? 0.75 : 1,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <Activity size={15} style={{ animation: 'spin 1.2s linear infinite' }} />
                ) : (
                  <Play size={15} />
                )}
                <span>{isSubmitting ? 'Injecting Disruption...' : 'Inject Disruption & Start Simulation'}</span>
              </button>
            )}

            {submitError && (
              <div
                style={{
                  color: '#EF4444',
                  fontSize: '11px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '8px'
                }}
              >
                <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: 3D Visualization Canvas & Impact Preview */}
        <div className="sim-visual-col">
          <div className="sim-card twin-preview-card">
            <div className="sim-card-header">
              <span className="sim-card-step font-mono">3</span>
              <span className="sim-card-title">3D Digital Twin Real-Time Reaction</span>
            </div>
            <div className="sim-twin-embed">
              <TwinContainer
                assets={assets}
                services={services}
                selectedAssetId={selectedAssetId}
                onSelectAsset={setSelectedAssetId}
              />
            </div>
          </div>

          {/* Impact Preview Metrics */}
          <div className="sim-impact-preview-row">
            <div className="impact-badge-card">
              <span className="impact-badge-label">Services at Risk</span>
              <span className="impact-badge-val font-mono" style={{ color: servicesAtRiskColor }}>
                {servicesAtRiskDisplay}
              </span>
            </div>
            <div className="impact-badge-card">
              <span className="impact-badge-label">Affected Assets</span>
              <span className="impact-badge-val font-mono" style={{ color: affectedAssetsColor }}>
                {affectedAssetsDisplay}
              </span>
            </div>
            <div className="impact-badge-card">
              <span className="impact-badge-label">Time to First Impact</span>
              <span className="impact-badge-val font-mono">
                {timeToFirstImpactDisplay}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
