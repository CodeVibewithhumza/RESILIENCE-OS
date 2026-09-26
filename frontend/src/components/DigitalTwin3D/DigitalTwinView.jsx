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
  Layers
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

  // Exact 9 interactive HUD pins matching Design Reference
  const twinPins = [
    { id: 'GEN_01', label: 'Generator', status: 'Normal', top: '26%', left: '27%', color: 'cyan' },
    { id: 'WATER_TANK', label: 'Water Tank', status: 'Normal', top: '27%', left: '45%', color: 'cyan' },
    { id: 'CHILLER_PLANT', label: 'HVAC Plant', status: 'At Risk', top: '31%', left: '65%', color: 'amber' },
    { id: 'UTILITY_BLOCK', label: 'Utility Block', status: 'Normal', top: '38%', left: '22%', color: 'cyan' },
    { id: 'MAIN_HOSPITAL', label: 'Main Hospital', status: 'Normal', top: '47%', left: '44%', color: 'red-cross' },
    { id: 'MED_GAS_PLANT', label: 'Medical Gas Plant', status: 'Normal', top: '51%', left: '67%', color: 'cyan' },
    { id: 'SERVICE_ICU', label: 'ICU', status: 'Normal', top: '53%', left: '27%', color: 'cyan' },
    { id: 'SERVICE_ER', label: 'Emergency', status: 'Normal', top: '63%', left: '40%', color: 'cyan' },
    { id: 'SERVICE_OT', label: 'OT', status: 'Normal', top: '63%', left: '59%', color: 'cyan' }
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
        {/* 3D Visual Canvas Viewport */}
        <div className="twin-canvas-card">
          <div className="twin-viewport-container">
            {/* Embedded 3D Scene / Visual Model */}
            <TwinContainer
              assets={assets}
              services={services}
              selectedAssetId={selectedAsset?.id}
              onSelectAsset={onSelectAsset}
              filterSubsystem={activeFilter}
              viewMode={viewMode}
              activeLayers={activeLayers}
            />

            {/* Interactive Pins Overlay */}
            <div className="twin-pins-overlay">
              {twinPins.map((pin) => (
                <div
                  key={pin.id}
                  className={`twin-hud-pin pin-${pin.color} ${selectedAsset?.id === pin.id ? 'is-selected' : ''}`}
                  style={{ top: pin.top, left: pin.left }}
                  onClick={() => onSelectAsset && onSelectAsset(pin.id)}
                >
                  <span className="hud-pin-icon">
                    {pin.color === 'red-cross' ? '+' : pin.color === 'amber' ? '❄' : '●'}
                  </span>
                  <div className="hud-pin-text-col">
                    <span className="hud-pin-name">{pin.label}</span>
                    <span className="hud-pin-status font-mono">
                      <span className={`hud-dot ${pin.status === 'At Risk' ? 'dot-amber' : 'dot-cyan'}`} />
                      {pin.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Utility Network Legend Box on bottom left */}
            <div className="twin-utility-legend-box">
              <div className="legend-box-title">Utility Network</div>
              <div className="legend-box-items">
                <div className="legend-pipe-item">
                  <span className="pipe-line" style={{ backgroundColor: '#00F0FF' }} />
                  <span>Electrical</span>
                </div>
                <div className="legend-pipe-item">
                  <span className="pipe-line" style={{ backgroundColor: '#00A3FF' }} />
                  <span>Water</span>
                </div>
                <div className="legend-pipe-item">
                  <span className="pipe-line" style={{ backgroundColor: '#FFB800' }} />
                  <span>HVAC</span>
                </div>
                <div className="legend-pipe-item">
                  <span className="pipe-line" style={{ backgroundColor: '#A855F7' }} />
                  <span>Medical Gas</span>
                </div>
              </div>
            </div>

            {/* Top-Left Compass HUD */}
            <div className="twin-compass-hud">
              <div className="compass-circle">
                <span className="compass-dir compass-n">N</span>
                <span className="compass-dir compass-e">E</span>
                <span className="compass-dir compass-s">S</span>
                <span className="compass-dir compass-w">W</span>
                <div className="compass-needle" />
              </div>
            </div>

            {/* Right Zoom / Camera Controls */}
            <div className="twin-floating-camera-controls">
              <button type="button" className="camera-ctrl-btn" title="Fullscreen">
                <Maximize2 size={13} />
              </button>
              <button
                type="button"
                className="camera-ctrl-btn"
                title="Reset Camera"
                onClick={() => onSelectAsset && onSelectAsset(null)}
              >
                <Navigation size={13} />
              </button>
              <button type="button" className="camera-ctrl-btn" title="Zoom In">
                <Plus size={13} />
              </button>
              <button type="button" className="camera-ctrl-btn" title="Zoom Out">
                <Minus size={13} />
              </button>
            </div>
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
