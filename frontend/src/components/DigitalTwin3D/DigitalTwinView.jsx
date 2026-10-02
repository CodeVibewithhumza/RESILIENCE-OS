import { useState, useMemo, useEffect } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  HeartPulse,
  Eye,
  EyeOff,
  X,
  Building,
  Activity,
  Sun,
  Moon,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Clock,
  Gauge,
  Thermometer,
  BatteryCharging
} from 'lucide-react'
import TwinContainer from './TwinContainer'
import { ASSET_TOPOLOGY_DEFS, STATUS_COLORS } from './twinConstants'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './DigitalTwinView.css'

export default function DigitalTwinView({
  assets = [],
  services = [],
  incident = null,
  selectedAssetId,
  onSelectAsset,
  onOpenExplainability
}) {
  const [activeFilter, setActiveFilter] = useState('all')
  const [viewMode, setViewMode] = useState('3d') // '3d' | '2d'
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'dependencies' | 'live'
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
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

  // Build unified map of all 28 modeled hospital assets, clinical wings, and plants
  const assetsMap = useMemo(() => {
    const map = {}

    // 1. Seed with rich topology definitions for all 28 campus nodes
    Object.entries(ASSET_TOPOLOGY_DEFS).forEach(([id, def]) => {
      let displayName = def.subsystem || def.label
      let desc = `${def.subsystem || def.label} is an integral part of the hospital's clinical life-support and mission-critical infrastructure.`

      if (def.meshType === 'icu_bed') {
        displayName = `ICU Bed ${def.bedNumber}`
        desc = `Critical care ICU bed ${def.bedNumber} in ${def.zone || 'Cardiac Wing'} equipped with dedicated mechanical ventilation, multi-parameter vital signs monitor, and dual-redundant UPS power feeds.`
      } else if (def.meshType === 'operating_theatre') {
        displayName = `OT Suite ${def.label.replace('OT_SUITE_', '')}`
        desc = `Surgical Operating Theatre ${def.label.replace('OT_SUITE_', '')} featuring sterile laminar airflow HVAC, backup dual-feed electrical transfer, anesthesia gas scavenging, and continuous monitoring.`
      } else if (def.meshType === 'emergency_bay') {
        displayName = `Trauma Bay ${def.bayNumber}`
        desc = `Emergency Department resuscitation trauma bay ${def.bayNumber} with rapid oxygen infusion, crash cart power connection, and high-intensity procedural lighting.`
      } else if (def.meshType === 'ward_bed') {
        displayName = `Ward Room ${def.roomNumber}`
        desc = `Inpatient ward bed unit ${def.roomNumber} supported by central medical suction, room environmental climate control, and nurse call response systems.`
      } else if (def.meshType === 'nurse_station') {
        displayName = 'ICU Central Nurse Station'
        desc = 'Central telemetry and patient monitoring station continuously consolidating ECG, SpO2, and ventilator alarm feeds across all ICU beds.'
      } else if (def.meshType === 'admin_hub') {
        displayName = 'Operations Command Hub'
        desc = 'Hospital operational leadership and facility dispatch control room supervising building management systems and emergency communications.'
      } else if (def.meshType === 'ambulance_bay') {
        displayName = 'Ambulance Trauma Intake'
        desc = 'Primary ambulance arrival and triage portal with rapid vehicular access and decontamination airlock.'
      }

      map[id] = {
        id,
        name: displayName,
        subsystem: def.subsystem || def.label,
        type: def.meshType || def.category || 'Clinical Life-Support',
        floor: def.floor,
        floorId: def.floorId,
        zone: def.zone,
        powerSource: def.powerSource || 'EMERGENCY_BUS / UPS',
        serviceId: def.serviceId,
        status: 'normal',
        health_score: 100,
        current_load: def.meshType === 'icu_bed' ? 1.2 : def.meshType === 'operating_theatre' ? 18 : 0,
        capacity_unit: 'kW',
        description: desc,
        metadata: { ...def },
        ...def
      }
    })

    // 2. Overlay live backend infrastructure assets
    assets.forEach((a) => {
      map[a.id] = { ...(map[a.id] || {}), ...a }
    })

    // 3. Register and overlay clinical services
    if (Array.isArray(services) && services.length > 0) {
      const svcMap = new Map(services.map((s) => [s.id, s]))

      services.forEach((s) => {
        map[s.id] = {
          id: s.id,
          name: s.name,
          subsystem: s.department || 'Clinical Service',
          type: 'Critical Hospital Service',
          status: s.status || 'normal',
          health_score: s.service_continuity_pct != null ? s.service_continuity_pct : 100,
          current_load: s.current_load_kw || 0,
          capacity_unit: 'kW',
          service_continuity_pct: s.service_continuity_pct,
          criticality: s.criticality,
          powerSource: s.primary_power_source || 'EMERGENCY_BUS',
          description: s.description || `${s.name} is a mission-critical hospital department with ${s.service_continuity_pct || 100}% service continuity.`
        }
      })

      // Link clinical service status to matching rooms/beds
      Object.entries(ASSET_TOPOLOGY_DEFS).forEach(([id, def]) => {
        if (def.serviceId && svcMap.has(def.serviceId)) {
          const s = svcMap.get(def.serviceId)
          if (s.at_risk || s.status === 'compromised' || s.status === 'critical_only' || (typeof s.service_continuity_pct === 'number' && s.service_continuity_pct < 90)) {
            const isCritical = s.status === 'compromised' || (s.service_continuity_pct != null && s.service_continuity_pct < 50)
            map[id] = {
              ...map[id],
              status: isCritical ? 'critical' : 'degraded',
              health_score: typeof s.service_continuity_pct === 'number' ? s.service_continuity_pct : 60,
              serviceStatus: s.status,
              serviceContinuity: s.service_continuity_pct
            }
          }
        }
      })
    }

    return map
  }, [assets, services])

  // Selected asset lookup across all 28 assets and services
  const selectedAsset = useMemo(() => {
    if (!selectedAssetId) return null
    return (
      assetsMap[selectedAssetId] ||
      assets.find((a) => a.id === selectedAssetId) ||
      services.find((s) => s.id === selectedAssetId) ||
      null
    )
  }, [selectedAssetId, assetsMap, assets, services])

  // Automatically open the details drawer when an asset is selected
  useEffect(() => {
    if (selectedAssetId) {
      setIsDetailsOpen(true)
    }
  }, [selectedAssetId])

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
      <section className={`twin-main-workspace ${isDetailsOpen && selectedAsset ? 'has-details' : 'no-details'}`}>
        {/* 3D Visual Canvas Viewport OR 2D Schematic */}
        <div className="twin-canvas-card">
          <div className="twin-viewport-container">
            {viewMode === '3d' ? (
              /* Clean 3D Digital Twin Viewport */
              <TwinContainer
                assets={assets}
                services={services}
                incident={incident}
                selectedAssetId={selectedAssetId || null}
                onSelectAsset={(id) => {
                  if (onSelectAsset) onSelectAsset(id)
                  if (id) setIsDetailsOpen(true)
                }}
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
                      {assets.filter(a => ['grid', 'transformer', 'generator', 'ups', 'main_bus', 'emergency_bus'].includes(a.type) || ['GRID_MAIN', 'TRANSFORMER_01', 'TRANSFORMER_02', 'MAIN_BUS', 'EMERGENCY_BUS', 'GEN_01', 'GEN_02', 'UPS_CRITICAL'].includes(a.id)).map(node => (
                        <div
                          key={node.id}
                          className={`schematic-node-card ${selectedAsset?.id === node.id ? 'is-selected' : ''} status-${node.status}`}
                          onClick={() => {
                            if (onSelectAsset) onSelectAsset(node.id)
                            setIsDetailsOpen(true)
                          }}
                        >
                          <div className="node-top">
                            <span className="node-id font-mono">{node.id}</span>
                            <span className={`node-dot dot-${node.status}`} />
                          </div>
                          <div className="node-name">{node.name}</div>
                          <div className="node-meta font-mono">
                            <span>{node.current_load != null ? `${node.current_load} ${node.capacity_unit || 'kW'}` : (node.status || 'NORMAL').toUpperCase()}</span>
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
                          onClick={() => {
                            if (onSelectAsset) onSelectAsset(node.id)
                            setIsDetailsOpen(true)
                          }}
                        >
                          <div className="node-top">
                            <span className="node-id font-mono">{node.id}</span>
                            <span className={`node-dot dot-${node.status}`} />
                          </div>
                          <div className="node-name">{node.name}</div>
                          <div className="node-meta font-mono">
                            <span>{node.pressure_psi ? `${node.pressure_psi} PSI` : node.current_load != null ? `${node.current_load} kW` : 'ONLINE'}</span>
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
                          onClick={() => {
                            if (onSelectAsset) onSelectAsset(svc.id)
                            setIsDetailsOpen(true)
                          }}
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
        {isDetailsOpen && selectedAsset && (
          <aside className="twin-asset-details-panel">
            <div className="details-panel-header">
              <span className="details-panel-title">Asset Details</span>
              <button
                type="button"
                className="details-close-btn"
                onClick={() => {
                  setIsDetailsOpen(false)
                  if (onSelectAsset) onSelectAsset(null)
                }}
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
                  <span className="asset-banner-name">{selectedAsset.name || selectedAsset.id}</span>
                </div>
                <div className="asset-banner-status font-mono">
                  <span className={`status-dot status-dot-${selectedAsset.status || 'normal'}`} />
                  <span>{(selectedAsset.status || 'normal').toUpperCase()}</span>
                  <span style={{ opacity: 0.7 }}>•</span>
                  <span>{selectedAsset.health_score != null ? selectedAsset.health_score : 100}% Health</span>
                </div>
                <div className="asset-banner-sub font-mono">
                  {selectedAsset.floor != null ? `Floor L${selectedAsset.floor} • ` : ''}
                  {selectedAsset.zone || selectedAsset.subsystem || selectedAsset.location || 'Hospital infrastructure node'}
                </div>
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

            {/* Spec Fields based on Active Tab */}
            <div className="details-fields-body">
              {activeTab === 'overview' && (
                <>
                  <div className="details-field-row">
                    <span className="field-lbl">Identifier</span>
                    <span className="field-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                      {selectedAsset.id}
                    </span>
                  </div>
                  <div className="details-field-row">
                    <span className="field-lbl">Subsystem & Role</span>
                    <span className="field-val">{selectedAsset.subsystem || selectedAsset.name}</span>
                  </div>
                  <div className="details-field-row">
                    <span className="field-lbl">Power Feed Source</span>
                    <span className="field-val font-mono">{selectedAsset.powerSource || 'EMERGENCY_BUS / UPS'}</span>
                  </div>

                  {/* Patient Clinical Info if ICU Bed / Ward */}
                  {selectedAsset.metadata?.patient_id && (
                    <div className="details-field-row clinical-pod">
                      <span className="field-lbl">Active Patient Monitoring</span>
                      <div className="clinical-pills-row">
                        <span className="clinical-pill">Patient {selectedAsset.metadata.patient_id}</span>
                        {selectedAsset.metadata.ventilator_active && (
                          <span className="clinical-pill active-vent">Ventilator: ON</span>
                        )}
                        {selectedAsset.metadata.spo2_pct && (
                          <span className="clinical-pill spo2-pill">{selectedAsset.metadata.spo2_pct}% SpO2</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="details-field-row">
                    <span className="field-lbl">Connected Utility Systems</span>
                    <div className="connected-systems-val">
                      <span className="sys-badge" style={{ color: '#00F0FF' }}><Zap size={11} /> Electrical</span>
                      <span className="sys-badge" style={{ color: '#00A3FF' }}><Droplets size={11} /> Water</span>
                      <span className="sys-badge" style={{ color: '#FFB800' }}><Wind size={11} /> HVAC</span>
                      <span className="sys-badge" style={{ color: '#A855F7' }}><Flame size={11} /> Medical Gas</span>
                    </div>
                  </div>

                  <div className="details-field-row desc-row">
                    <span className="field-lbl">Description</span>
                    <p className="field-val-desc">
                      {selectedAsset.description || `${selectedAsset.name || selectedAsset.id} is actively integrated into campus hospital infrastructure and real-time supervisory telemetry networks.`}
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'dependencies' && (
                <>
                  <div className="details-field-row">
                    <span className="field-lbl">Upstream Power Feed</span>
                    <div className="dep-box">
                      <Zap size={13} style={{ color: 'var(--accent-cyan)' }} />
                      <span className="font-mono">{selectedAsset.powerSource || 'UPS_CRITICAL / ESB'}</span>
                    </div>
                  </div>

                  <div className="details-field-row">
                    <span className="field-lbl">Life-Support & Gas Pipeline</span>
                    <div className="dep-box">
                      <Flame size={13} style={{ color: '#A855F7' }} />
                      <span>{selectedAsset.category === 'clinical' ? '55 PSI Central Medical Oxygen Line' : 'Auxiliary Yard Cryo Header'}</span>
                    </div>
                  </div>

                  <div className="details-field-row">
                    <span className="field-lbl">HVAC & Environmental Control</span>
                    <div className="dep-box">
                      <Wind size={13} style={{ color: '#FFB800' }} />
                      <span>{selectedAsset.category === 'clinical' ? 'HEPA Filtered Positive Pressure Air' : 'Chilled Water Loop 7°C'}</span>
                    </div>
                  </div>

                  <div className="details-field-row">
                    <span className="field-lbl">Impacted Clinical Services</span>
                    <span className="field-val">Emergency, ICU, Operating Theatres, Wards</span>
                  </div>
                </>
              )}

              {activeTab === 'live' && (
                <>
                  <div className="details-live-grid">
                    <div className="live-stat-card">
                      <span className="live-stat-label">HEALTH SCORE</span>
                      <span className="live-stat-val font-mono" style={{ color: STATUS_COLORS[selectedAsset.status] || '#10B981' }}>
                        {selectedAsset.health_score != null ? selectedAsset.health_score : 100}%
                      </span>
                    </div>
                    <div className="live-stat-card">
                      <span className="live-stat-label">STATUS</span>
                      <span className="live-stat-val font-mono" style={{ color: STATUS_COLORS[selectedAsset.status] || '#10B981', textTransform: 'uppercase' }}>
                        {selectedAsset.status || 'NORMAL'}
                      </span>
                    </div>
                    <div className="live-stat-card">
                      <span className="live-stat-label">ELECTRICAL LOAD</span>
                      <span className="live-stat-val font-mono">
                        {selectedAsset.current_load != null ? `${selectedAsset.current_load.toFixed(0)} ${selectedAsset.capacity_unit || 'kW'}` : '1.2 kW'}
                      </span>
                    </div>
                    <div className="live-stat-card">
                      <span className="live-stat-label">OPERATIONAL STATE</span>
                      <span className="live-stat-val font-mono" style={{ color: selectedAsset.status === 'failed' ? '#EF4444' : '#10B981' }}>
                        {selectedAsset.status === 'failed' ? 'OFFLINE / TRIP' : 'SYNCHRONIZED'}
                      </span>
                    </div>
                  </div>

                  {selectedAsset.metadata?.patient_id && (
                    <div className="details-field-row" style={{ marginTop: '8px' }}>
                      <span className="field-lbl">Telemetry Vitals</span>
                      <div className="dep-box">
                        <HeartPulse size={14} style={{ color: '#EF4444' }} />
                        <span className="font-mono">SpO2: {selectedAsset.metadata.spo2_pct || 98}% • HR: {selectedAsset.metadata.heart_rate_bpm || 72} BPM</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {onOpenExplainability && (
                <button
                  type="button"
                  className="details-causal-btn"
                  onClick={() => onOpenExplainability(selectedAsset.serviceId || 'SERVICE_ICU')}
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
