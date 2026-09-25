import { useState } from 'react'
import {
  Play,
  RotateCcw,
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Layers,
  Activity,
  CheckCircle2
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './StartSimulationView.css'

export default function StartSimulationView({
  assets = [],
  services = [],
  incident,
  onTriggerFailure,
  onReset
}) {
  const [selectedCategory, setSelectedCategory] = useState('electrical')
  const [selectedIncident, setSelectedIncident] = useState('transformer')
  const [severity, setSeverity] = useState('full')
  const [duration, setDuration] = useState('2')
  const [selectedAssetId, setSelectedAssetId] = useState(null)

  const incidents = [
    { id: 'transformer', name: 'Primary Transformer Failure (T1)', category: 'electrical', desc: 'Loss of main 415V transformer supply' },
    { id: 'grid', name: '11kV Utility Grid Blackout', category: 'electrical', desc: 'Total loss of external city power grid' },
    { id: 'gen', name: 'Standby Generator Start Failure', category: 'electrical', desc: 'Backup diesel generator fails to crank' },
    { id: 'ups', name: 'UPS Battery Depletion / Inverter Fault', category: 'electrical', desc: 'Static battery bank depleted' },
    { id: 'o2_rupture', name: 'Cryogenic O2 Pipeline Rupture', category: 'gas', desc: 'Pressure drop in main oxygen distribution line' },
    { id: 'chiller_trip', name: 'HVAC Chiller Thermal Trip', category: 'hvac', desc: 'Loss of cleanroom surgical air cooling' }
  ]

  const filteredIncidents = incidents.filter(
    (inc) => selectedCategory === 'combined' || inc.category === selectedCategory
  )

  const handleLaunch = () => {
    onTriggerFailure()
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
          <Activity size={13} style={{ color: incident.is_active ? '#EF4444' : '#10B981' }} />
          <span>{incident.is_active ? 'SIMULATION ACTIVE' : 'ENGINE READY'}</span>
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
              onClick={() => setSelectedCategory(cat.id)}
            >
              <div className="cat-icon-wrap" style={{ background: `rgba(${cat.id === 'combined' ? '239, 68, 68' : '0, 240, 255'}, 0.15)`, color: cat.color }}>
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
            {incident.is_active ? (
              <button className="sim-reset-action-btn" onClick={onReset}>
                <RotateCcw size={14} />
                <span>Reset Simulation to Normal</span>
              </button>
            ) : (
              <button className="sim-start-action-btn" onClick={handleLaunch}>
                <Play size={15} />
                <span>Inject Disruption & Start Simulation</span>
              </button>
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
              <span className="impact-badge-val font-mono" style={{ color: incident.is_active ? '#EF4444' : '#10B981' }}>
                {incident.is_active ? '2 Units (ICU, OT)' : '0 (All Normal)'}
              </span>
            </div>
            <div className="impact-badge-card">
              <span className="impact-badge-label">Affected Assets</span>
              <span className="impact-badge-val font-mono" style={{ color: incident.is_active ? '#F59E0B' : '#00F0FF' }}>
                {incident.is_active ? '12 Nodes' : '0 Nodes'}
              </span>
            </div>
            <div className="impact-badge-card">
              <span className="impact-badge-label">Time to First Impact</span>
              <span className="impact-badge-val font-mono">
                {incident.is_active ? '~8 min' : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
