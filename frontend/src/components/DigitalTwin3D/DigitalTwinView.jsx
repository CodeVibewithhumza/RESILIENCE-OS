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
  Plus,
  Minus,
  Navigation,
  X,
  Building,
  Activity,
  Layers,
  Sun,
  Moon
} from 'lucide-react'
import TwinContainer from './TwinContainer'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
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
  const [isDetailsOpen, setIsDetailsOpen] = useState(true)
  const [twinTheme, setTwinTheme] = useState(() => {
    return (
      localStorage.getItem('twin_3d_theme') ||
      document.documentElement.getAttribute('data-theme') ||
      'dark'
    )
  })

  const handleToggleTwinTheme = () => {
    const nextTheme = twinTheme === 'dark' ? 'light' : 'dark'
    setTwinTheme(nextTheme)
    localStorage.setItem('twin_3d_theme', nextTheme)
  }
  const [activeLayers, setActiveLayers] = useState({
    services: true,
    electrical: true,
    water: true,
    hvac: true,
    gas: true
  })

  // Selected asset or default to Main Hospital / first asset
  const selectedAsset =
    assets.find((a) => a.id === selectedAssetId) ||
    assets.find((a) => a.id === 'MAIN_HOSPITAL') ||
    assets[0] || {
      id: 'MAIN_HOSPITAL',
      name: 'Main Hospital',
      type: 'hospital_building',
      subsystem: 'Critical Infrastructure',
      status: 'normal',
      health_score: 98,
      current_load: 1850,
      capacity: 2500,
      location: 'Campus Central Block'
    }

  const toggleLayer = (layerKey) => {
    setActiveLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }))
  }

  const filterButtons = [
    { id: 'all', label: 'All Systems', icon: Building },
    { id: 'electrical', label: 'Electrical', icon: Zap },
    { id: 'water', label: 'Water', icon: Droplets },
    { id: 'hvac', label: 'HVAC', icon: Wind },
    { id: 'gas', label: 'Medical Gas', icon: Flame },
    { id: 'services', label: 'Critical Services', icon: HeartPulse }
  ]

  const layerCards = [
    {
      id: 'services',
      name: 'Buildings & Services',
      desc: 'Hospital areas and key services',
      icon: Building,
      color: '#00F0FF'
    },
    {
      id: 'electrical',
      name: 'Electrical System',
      desc: 'Grid, Transformer, DG, UPS, ATS',
      icon: Zap,
      color: '#00F0FF'
    },
    {
      id: 'water',
      name: 'Water System',
      desc: 'Storage, Pumps, Distribution',
      icon: Droplets,
      color: '#00A3FF'
    },
    {
      id: 'hvac',
      name: 'HVAC System',
      desc: 'Chillers, AHUs, Ducts',
      icon: Wind,
      color: '#FFB800'
    },
    {
      id: 'gas',
      name: 'Medical Gas System',
      desc: 'Oxygen, Air, Vacuum',
      icon: Flame,
      color: '#A855F7'
    }
  ]

  return (
    <div className="digital-twin-page">
      {/* 1. TOP SUBSYSTEM FILTER STRIP */}
      <section className="twin-top-filter-bar">
        <div className="twin-filters-group">
          {filterButtons.map((btn) => {
            const Icon = btn.icon
            return (
              <button
                key={btn.id}
                type="button"
                className={`twin-filter-pill ${activeFilter === btn.id ? 'is-active' : ''}`}
                onClick={() => setActiveFilter(btn.id)}
              >
                <Icon size={14} className="filter-pill-icon" />
                <span>{btn.label}</span>
              </button>
            )
          })}
        </div>

        <div className="twin-controls-group">
          {/* Prominent 3D Theme Switcher */}
          <button
            type="button"
            className={`twin-theme-toggle-header ${twinTheme === 'light' ? 'is-light' : 'is-dark'}`}
            onClick={handleToggleTwinTheme}
            title={twinTheme === 'light' ? 'Switch 3D View to Cyber Dark Theme' : 'Switch 3D View to Daylight BIM Theme'}
          >
            {twinTheme === 'light' ? (
              <>
                <Sun size={14} className="theme-toggle-icon sun-icon" />
                <span>3D Daylight</span>
              </>
            ) : (
              <>
                <Moon size={14} className="theme-toggle-icon moon-icon" />
                <span>3D Dark</span>
              </>
            )}
          </button>

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
        </div>
      </section>

      {/* 2. CENTER CANVAS & RIGHT ASSET DETAILS SPLIT */}
      <section className="twin-main-workspace">
        {/* 3D Visual Canvas Viewport OR 2D Schematic */}
        <div className="twin-canvas-card">
          <div className="twin-viewport-container">
            {viewMode === '3d' ? (
              /* Clean 3D Digital Twin Viewport (No overlapping 2D pins!) */
              <TwinContainer
                assets={assets}
                services={services}
                selectedAssetId={selectedAsset?.id}
                onSelectAsset={onSelectAsset}
                filterSubsystem={activeFilter}
                viewMode={viewMode}
                activeLayers={activeLayers}
                theme={twinTheme}
                onToggleTheme={handleToggleTwinTheme}
              />
            ) : (
              /* Clean 2D Topological Infrastructure Schematic */
              <div className="twin-schematic-view">
                <div className="schematic-header-bar">
                  <div className="schematic-title-group">
                    <span className="schematic-indicator-dot" />
                    <span className="schematic-title">HOSPITAL INFRASTRUCTURE 2D TOPOLOGY SCHEMATIC</span>
                    <span className="schematic-badge font-mono">CAD / SCADA ARCHITECTURE</span>
                  </div>
                  <div className="schematic-legend-inline">
                    <span className="schematic-leg-item"><span className="leg-line pipe-cyan" /> Electrical Bus</span>
                    <span className="schematic-leg-item"><span className="leg-line pipe-blue" /> Water Supply</span>
                    <span className="schematic-leg-item"><span className="leg-line pipe-amber" /> HVAC Air</span>
                    <span className="schematic-leg-item"><span className="leg-line pipe-purple" /> Medical Gas</span>
                  </div>
                </div>

                <div className="schematic-body-grid">
                  {/* Grid / Generation Tier */}
                  <div className="schematic-tier">
                    <div className="tier-header">
                      <Zap size={14} className="tier-icon" />
                      <span>PRIMARY GRID & EMERGENCY GENERATION (L0 YARD)</span>
                    </div>
                    <div className="tier-nodes-row">
                      {assets.filter(a => ['grid', 'transformer', 'generator', 'ups', 'main_bus', 'emergency_bus'].includes(a.type)).map(node => (
                        <div
                          key={node.id}
                          className={`schematic-node-card ${selectedAsset?.id === node.id ? 'is-selected' : ''} status-${node.status}`}
                          onClick={() => onSelectAsset && onSelectAsset(node.id)}
                        >
                          <div className="node-top">
                            <span className="node-id font-mono">{node.id}</span>
                            <span className={`node-dot dot-${node.status}`} />
                          </div>
                          <div className="node-name">{node.name}</div>
                          <div className="node-meta font-mono">
                            <span>{node.current_load ? `${node.current_load} ${node.capacity_unit || 'kW'}` : node.status.toUpperCase()}</span>
                            <span>{node.health_score || 100}% HP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Central Plants Tier */}
                  <div className="schematic-tier">
                    <div className="tier-header">
                      <Wind size={14} className="tier-icon" />
                      <span>CENTRAL UTILITY & LIFE-SUPPORT PLANTS (AUXILIARY YARD)</span>
                    </div>
                    <div className="tier-nodes-row">
                      {assets.filter(a => ['chiller', 'water_pump', 'oxygen_manifold', 'mechanical'].includes(a.type) || ['CHILLER_PLANT', 'WATER_PUMP_STATION', 'OXYGEN_MANIFOLD'].includes(a.id)).map(node => (
                        <div
                          key={node.id}
                          className={`schematic-node-card ${selectedAsset?.id === node.id ? 'is-selected' : ''} status-${node.status}`}
                          onClick={() => onSelectAsset && onSelectAsset(node.id)}
                        >
                          <div className="node-top">
                            <span className="node-id font-mono">{node.id}</span>
                            <span className={`node-dot dot-${node.status}`} />
                          </div>
                          <div className="node-name">{node.name}</div>
                          <div className="node-meta font-mono">
                            <span>{node.pressure_psi ? `${node.pressure_psi} PSI` : node.current_load ? `${node.current_load} kW` : 'ONLINE'}</span>
                            <span>{node.health_score || 100}% HP</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Critical Services Destination Tier */}
                  <div className="schematic-tier">
                    <div className="tier-header">
                      <HeartPulse size={14} className="tier-icon" />
                      <span>CRITICAL HOSPITAL CLINICAL SERVICES & WARDS</span>
                    </div>
                    <div className="tier-nodes-row">
                      {services.map(svc => (
                        <div
                          key={svc.id}
                          className={`schematic-node-card service-card ${selectedAsset?.id === svc.id ? 'is-selected' : ''} status-${svc.status}`}
                          onClick={() => onSelectAsset && onSelectAsset(svc.id)}
                        >
                          <div className="node-top">
                            <span className="node-id font-mono">{svc.id}</span>
                            <span className={`node-dot dot-${svc.status}`} />
                          </div>
                          <div className="node-name">{svc.name}</div>
                          <div className="node-meta font-mono">
                            <span>{svc.service_continuity_pct || 100}% Continuity</span>
                            <span style={{ color: svc.at_risk ? 'var(--status-critical)' : 'var(--status-normal)' }}>
                              {svc.at_risk ? 'AT RISK' : 'HEALTHY'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Asset Details Panel matching Design Reference */}
        {isDetailsOpen && (
          <aside className="twin-asset-details-panel">
            <div className="details-panel-header">
              <span className="details-panel-title">Asset Details</span>
              <button
                type="button"
                className="details-close-btn"
                onClick={() => setIsDetailsOpen(false)}
                title="Close details"
              >
                <X size={14} />
              </button>
            </div>

            {/* Preview Card Banner */}
            <div className="details-asset-banner-card">
              <img src={hospitalCampusImg} alt="Asset Thumbnail" className="asset-thumb-img" />
              <div className="asset-banner-info">
                <div className="asset-banner-title-row">
                  <span className="asset-red-cross">+</span>
                  <span className="asset-banner-name">{selectedAsset?.name || 'Main Hospital'}</span>
                </div>
                <div className="asset-banner-status font-mono">
                  <span className="status-dot status-dot-normal" />
                  <span>Normal</span>
                </div>
                <div className="asset-banner-sub">Primary care building</div>
              </div>
            </div>

            {/* 3 Tabs */}
            <div className="details-tabs-row">
              <button
                type="button"
                className={`details-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </button>
              <button
                type="button"
                className={`details-tab-btn ${activeTab === 'dependencies' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('dependencies')}
              >
                Dependencies
              </button>
              <button
                type="button"
                className={`details-tab-btn ${activeTab === 'live' ? 'is-active' : ''}`}
                onClick={() => setActiveTab('live')}
              >
                Live State
              </button>
            </div>

            {/* Spec Fields */}
            <div className="details-fields-body">
              <div className="details-field-row">
                <span className="field-lbl">Type</span>
                <span className="field-val">Hospital Building</span>
              </div>
              <div className="details-field-row">
                <span className="field-lbl">Category</span>
                <span className="field-val">Critical Infrastructure</span>
              </div>
              <div className="details-field-row">
                <span className="field-lbl">Connected Systems</span>
                <div className="connected-systems-val">
                  <span className="sys-badge" style={{ color: '#00F0FF' }}><Zap size={11} /> Electrical</span>
                  <span className="sys-badge" style={{ color: '#00A3FF' }}><Droplets size={11} /> Water</span>
                  <span className="sys-badge" style={{ color: '#FFB800' }}><Wind size={11} /> HVAC</span>
                  <span className="sys-badge" style={{ color: '#A855F7' }}><Flame size={11} /> Medical Gas</span>
                </div>
              </div>
              <div className="details-field-row">
                <span className="field-lbl">Key Services</span>
                <span className="field-val">Emergency, ICU, OT, Wards</span>
              </div>
              <div className="details-field-row desc-row">
                <span className="field-lbl">Description</span>
                <p className="field-val-desc">
                  Main hospital building housing critical and non-critical services. Connected to all major infrastructure systems.
                </p>
              </div>

              {onOpenExplainability && (
                <button
                  type="button"
                  className="details-causal-btn"
                  onClick={() => onOpenExplainability('SERVICE_ICU')}
                >
                  <Activity size={13} />
                  <span>Inspect Causal Dependencies</span>
                </button>
              )}
            </div>
          </aside>
        )}
      </section>

      {/* 3. BOTTOM ROW: INFRASTRUCTURE LAYERS */}
      <section className="twin-bottom-layers-section">
        <div className="layers-section-header">
          <span className="layers-section-title">Infrastructure Layers</span>
          <span className="layers-section-sub">Toggle systems to visualize infrastructure networks and dependencies</span>
        </div>

        <div className="layers-cards-row">
          {layerCards.map((card) => {
            const Icon = card.icon
            const isToggled = activeLayers[card.id]

            return (
              <div
                key={card.id}
                className={`layer-toggle-card ${isToggled ? 'is-toggled' : ''}`}
                onClick={() => toggleLayer(card.id)}
              >
                <div className="layer-card-left">
                  <div className="layer-card-icon" style={{ color: card.color }}>
                    <Icon size={16} />
                  </div>
                  <div className="layer-card-meta">
                    <span className="layer-card-name">{card.name}</span>
                    <span className="layer-card-desc">{card.desc}</span>
                  </div>
                </div>

                <div className="layer-eye-btn" style={{ color: isToggled ? card.color : 'var(--text-muted)' }}>
                  {isToggled ? <Eye size={15} /> : <EyeOff size={15} />}
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
