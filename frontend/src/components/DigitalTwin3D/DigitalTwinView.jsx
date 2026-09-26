import { useState } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  HeartPulse,
  Eye,
  EyeOff,
  Maximize2,
  RotateCcw,
  Activity
} from 'lucide-react'
import TwinContainer from './TwinContainer'
import './DigitalTwinView.css'

export default function DigitalTwinView({
  assets = [],
  services = [],
  selectedAssetId,
  onSelectAsset,
  onOpenExplainability
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('3d') // '3d' | '2d'
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'dependencies' | 'live'
  const [activeLayers, setActiveLayers] = useState({
    power: true,
    water: true,
    hvac: true,
    gas: true,
    services: true
  })

  // Selected asset or default to GEN_01 / first asset
  const selectedAsset =
    assets.find((a) => a.id === selectedAssetId) ||
    assets.find((a) => a.id === 'GEN_01') ||
    assets[0] ||
    {
      id: 'GEN_01',
      name: 'Diesel Generator 1',
      type: 'generator',
      subsystem: 'Power Generation',
      status: 'normal',
      health_score: 100,
      current_load: 750,
      capacity: 1500,
      location: 'Energy Center - Level B1'
    }

  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))
  }

  const filterButtons = [
    { id: 'all', label: 'All Systems' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'water', label: 'Water' },
    { id: 'hvac', label: 'HVAC' },
    { id: 'gas', label: 'Medical Gas' },
    { id: 'services', label: 'Critical Services' }
  ]

  const layerCards = [
    {
      id: 'power',
      name: 'Power Grid',
      nodes: '12 Nodes Active',
      icon: Zap,
      color: 'var(--accent-cyan)'
    },
    {
      id: 'water',
      name: 'Water Distribution',
      nodes: '8 Nodes Active',
      icon: Droplets,
      color: '#0284c7'
    },
    {
      id: 'hvac',
      name: 'HVAC System',
      nodes: '10 Nodes Active',
      icon: Wind,
      color: '#10b981'
    },
    {
      id: 'gas',
      name: 'Medical Gas',
      nodes: '6 Nodes Active',
      icon: Flame,
      color: '#14b8a6'
    },
    {
      id: 'services',
      name: 'Emergency Services',
      nodes: '5 Units Active',
      icon: HeartPulse,
      color: '#ef4444'
    }
  ]

  const statusLabel = selectedAsset?.status?.toUpperCase() || 'OPERATIONAL'
  const isFailed = selectedAsset?.status === 'failed' || selectedAsset?.status === 'critical'
  const isDegraded = selectedAsset?.status === 'degraded' || selectedAsset?.status === 'starting'

  return (
    <div className="digital-twin-page">
      {/* 1. TOP SUBSYSTEM FILTER STRIP */}
      <section className="twin-top-filter-bar">
        <div className="twin-filters-group">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              type="button"
              className={`twin-filter-pill ${activeFilter === btn.id ? 'is-active' : ''}`}
              onClick={() => setActiveFilter(btn.id)}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="twin-controls-group">
          <div className="twin-view-mode-toggle">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === '3d' ? 'is-active' : ''}`}
              onClick={() => setViewMode('3d')}
            >
              3D View
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === '2d' ? 'is-active' : ''}`}
              onClick={() => setViewMode('2d')}
            >
              2D Schematic
            </button>
          </div>

          <button
            type="button"
            className="twin-icon-btn"
            title="Reset Camera View"
            onClick={() => onSelectAsset && onSelectAsset(null)}
          >
            <RotateCcw size={14} />
          </button>
          <button
            type="button"
            className="twin-icon-btn"
            title="Maximize Viewport"
          >
            <Maximize2 size={14} />
          </button>
        </div>
      </section>

      {/* 2. MAIN WORKSPACE: 3D Twin Viewport (Left) + Asset Details (Right) */}
      <section className="twin-main-split-grid">
        {/* 3D Digital Twin BIM Canvas */}
        <div className="twin-viewport-container">
          <TwinContainer
            assets={assets}
            services={services}
            selectedAssetId={selectedAssetId}
            onSelectAsset={onSelectAsset}
            filterSubsystem={activeFilter}
          />
        </div>

        {/* Right: Asset Details Inspection Panel */}
        <aside className="twin-asset-inspection-card">
          <div className="asset-card-header">
            <div className="asset-header-left">
              <h3 className="asset-name-title">
                {selectedAsset.name || selectedAsset.id}
              </h3>
              <span className="asset-id-tag font-mono">{selectedAsset.id}</span>
            </div>
            <span
              className={`badge font-mono ${
                isFailed ? 'badge-critical' : isDegraded ? 'badge-warning' : 'badge-normal'
              }`}
            >
              {statusLabel}
            </span>
          </div>

          <div className="asset-subsystem-row">
            <span className="asset-meta-label">Subsystem:</span>
            <span className="asset-meta-val font-mono">{selectedAsset.type || 'Power Grid'}</span>
            <span className="meta-sep">•</span>
            <span className="asset-meta-label">Location:</span>
            <span className="asset-meta-val">{selectedAsset.location || 'Central Utility Plant'}</span>
          </div>

          {/* Inspection Tabs */}
          <div className="asset-tabs-header">
            <button
              type="button"
              className={`asset-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button
              type="button"
              className={`asset-tab-btn ${activeTab === 'dependencies' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('dependencies')}
            >
              Dependencies
            </button>
            <button
              type="button"
              className={`asset-tab-btn ${activeTab === 'live' ? 'is-active' : ''}`}
              onClick={() => setActiveTab('live')}
            >
              Live State
            </button>
          </div>

          <div className="asset-tab-body">
            {activeTab === 'overview' && (
              <div className="asset-overview-tab">
                <div className="asset-stat-field">
                  <span className="stat-label">Health Score</span>
                  <div className="stat-bar-row">
                    <div className="stat-bar-track">
                      <div
                        className="stat-bar-fill"
                        style={{
                          width: `${selectedAsset.health_score ?? 100}%`,
                          backgroundColor: isFailed
                            ? 'var(--status-critical)'
                            : isDegraded
                            ? 'var(--status-warning)'
                            : 'var(--status-normal)'
                        }}
                      />
                    </div>
                    <span className="stat-bar-num font-mono">
                      {selectedAsset.health_score?.toFixed(0) ?? 100}%
                    </span>
                  </div>
                </div>

                <div className="asset-specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Current Load</span>
                    <span className="spec-val font-mono">
                      {selectedAsset.current_load ? `${selectedAsset.current_load.toFixed(0)} kW` : 'Nominal'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Rated Capacity</span>
                    <span className="spec-val font-mono">
                      {selectedAsset.capacity ? `${selectedAsset.capacity} kW` : '1,500 kW'}
                    </span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Redundancy</span>
                    <span className="spec-val font-mono">N+1 Dual Feed</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Operational Mode</span>
                    <span className="spec-val font-mono">Automatic Standby</span>
                  </div>
                </div>

                <p className="asset-desc-text">
                  Critical primary infrastructure node providing uninterrupted hospital utility continuity.
                  Monitored via 1s telemetry synchronization.
                </p>
              </div>
            )}

            {activeTab === 'dependencies' && (
              <div className="asset-dependencies-tab">
                <div className="dep-section">
                  <span className="dep-section-title">Upstream Suppliers</span>
                  <div className="dep-node-pill">
                    <Zap size={12} style={{ color: 'var(--accent-cyan)' }} />
                    <span className="font-mono">GRID_MAIN (11kV Feeder)</span>
                    <span className="dep-status-dot dot-normal" />
                  </div>
                </div>

                <div className="dep-section">
                  <span className="dep-section-title">Downstream Clinical Services</span>
                  <div className="dep-nodes-list">
                    <div className="dep-node-pill">
                      <HeartPulse size={12} style={{ color: '#ef4444' }} />
                      <span className="font-mono">SERVICE_ICU (Intensive Care)</span>
                      <span className="dep-status-dot dot-normal" />
                    </div>
                    <div className="dep-node-pill">
                      <HeartPulse size={12} style={{ color: '#ef4444' }} />
                      <span className="font-mono">SERVICE_OT (Operating Theatres)</span>
                      <span className="dep-status-dot dot-normal" />
                    </div>
                    <div className="dep-node-pill">
                      <HeartPulse size={12} style={{ color: '#ef4444' }} />
                      <span className="font-mono">SERVICE_ER (Emergency Care)</span>
                      <span className="dep-status-dot dot-normal" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'live' && (
              <div className="asset-live-tab">
                <div className="live-metric-row">
                  <span className="live-metric-label">Output Frequency</span>
                  <span className="live-metric-val font-mono">50.0 Hz</span>
                </div>
                <div className="live-metric-row">
                  <span className="live-metric-label">Bus Voltage</span>
                  <span className="live-metric-val font-mono">415 V</span>
                </div>
                <div className="live-metric-row">
                  <span className="live-metric-label">Operating Temperature</span>
                  <span className="live-metric-val font-mono">68.4 °C</span>
                </div>
                <div className="live-metric-row">
                  <span className="live-metric-label">Vibration Index</span>
                  <span className="live-metric-val font-mono">0.08 mm/s (Normal)</span>
                </div>
              </div>
            )}
          </div>

          <div className="asset-card-footer">
            <button
              type="button"
              className="asset-action-btn primary-action"
              onClick={() => onOpenExplainability && onOpenExplainability()}
            >
              <Activity size={14} />
              <span>Inspect Causal Path</span>
            </button>
          </div>
        </aside>
      </section>

      {/* 3. BOTTOM ROW: INFRASTRUCTURE LAYERS */}
      <section className="twin-bottom-layers-row">
        {layerCards.map((layer) => {
          const Icon = layer.icon
          const isEnabled = activeLayers[layer.id]

          return (
            <div
              key={layer.id}
              className={`layer-toggle-card ${isEnabled ? 'is-layer-active' : 'is-layer-disabled'}`}
              onClick={() => toggleLayer(layer.id)}
              role="button"
              tabIndex={0}
            >
              <div className="layer-card-left">
                <div
                  className="layer-icon-box"
                  style={{
                    color: layer.color,
                    backgroundColor: `${layer.color}18`,
                    borderColor: `${layer.color}35`
                  }}
                >
                  <Icon size={16} />
                </div>
                <div className="layer-meta">
                  <span className="layer-name">{layer.name}</span>
                  <span className="layer-count font-mono">{layer.nodes}</span>
                </div>
              </div>

              <button
                type="button"
                className="layer-eye-btn"
                title={isEnabled ? 'Hide Layer' : 'Show Layer'}
              >
                {isEnabled ? (
                  <Eye size={15} style={{ color: layer.color }} />
                ) : (
                  <EyeOff size={15} style={{ color: 'var(--text-muted)' }} />
                )}
              </button>
            </div>
          )
        })}
      </section>
    </div>
  )
}
