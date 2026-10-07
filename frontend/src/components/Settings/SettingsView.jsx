import { useState, useEffect, useMemo, useRef } from 'react'
import {
  Building,
  Activity,
  AlertTriangle,
  SlidersHorizontal,
  Users,
  Database,
  Settings as SettingsIcon,
  Info,
  ChevronRight,
  Plus,
  RotateCcw,
  Zap,
  Droplets,
  Wind,
  Flame,
  HeartPulse,
  Share2,
  FileText,
  Download,
  Upload,
  Layers,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Radio,
  Sliders,
  Play,
  FileCode,
  Shield,
  Key,
  UserCheck,
  Server,
  Lock,
  Unlock,
  ShieldAlert,
  ArrowLeft,
  Delete
} from 'lucide-react'
import './SettingsView.css'
import { getApiBaseUrl } from '../../config/api'

const SETTING_TABS = [
  { id: 'model', name: 'Hospital Model', sub: 'Assets, services, dependencies', icon: Building },
  { id: 'sim', name: 'Simulation', sub: 'Parameters & scenarios', icon: Activity },
  { id: 'thresholds', name: 'Thresholds', sub: 'State & risk thresholds', icon: AlertTriangle },
  { id: 'vis', name: 'Visualization', sub: '3D view & display options', icon: SlidersHorizontal },
  { id: 'users', name: 'Users & Access', sub: 'Team and permissions', icon: Users },
  { id: 'data', name: 'Data & Export', sub: 'Import, export & logs', icon: Database },
  { id: 'system', name: 'System', sub: 'Diagnostics & engine', icon: SettingsIcon }
]

export default function SettingsView({
  onReset,
  theme = 'dark',
  onSetTheme,
  onNotify,
  assets = [],
  resilience,
  incident,
  onNavigate
}) {
  const [activeTab, setActiveTab] = useState('model')
  const [assetSystemFilter, setAssetSystemFilter] = useState('All Systems')
  const [thresholdSystemTab, setThresholdSystemTab] = useState('Electrical')

  // Live Backend State
  const [liveAssets, setLiveAssets] = useState(assets)
  const [liveScenarios, setLiveScenarios] = useState([])
  const [hospitalState, setHospitalState] = useState(null)
  const [isLoadingBackend, setIsLoadingBackend] = useState(false)
  const [selectedScenarioPreset, setSelectedScenarioPreset] = useState('campus_default')
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false)

  // Sliders state
  const [simSpeed, setSimSpeed] = useState(1)
  const [timeStep, setTimeStep] = useState(1)
  const [defDuration, setDefDuration] = useState(2)
  const [defSeverity, setDefSeverity] = useState('Medium (50%)')

  const [voltageThreshold, setVoltageThreshold] = useState(0.85)
  const [transformerLoad, setTransformerLoad] = useState(90)
  const [genStartDelay, setGenStartDelay] = useState(10)
  const [upsBatteryLow, setUpsBatteryLow] = useState(20)
  const [stateHysteresis, setStateHysteresis] = useState(5)

  const [buildingOpacity, setBuildingOpacity] = useState(100)
  const [showLabels, setShowLabels] = useState(true)
  const [showFlowAnim, setShowFlowAnim] = useState(true)
  const [cameraAutoRotate, setCameraAutoRotate] = useState(false)

  // System toggles
  const [enableWebSocket, setEnableWebSocket] = useState(true)
  const [saveSimHistory, setSaveSimHistory] = useState(true)
  const [enableAnomalyDetection, setEnableAnomalyDetection] = useState(true)
  const [enableDetailedLogs, setEnableDetailedLogs] = useState(true)

  const [enableRealtimeAnim, setEnableRealtimeAnim] = useState(true)
  const [enableEventLogging, setEnableEventLogging] = useState(true)
  const [autoRefreshDash, setAutoRefreshDash] = useState(true)

  const fileInputRef = useRef(null)

  // Fetch backend assets, state, and scenarios on mount
  useEffect(() => {
    let isMounted = true
    const fetchBackendData = async () => {
      setIsLoadingBackend(true)
      try {
        const baseUrl = getApiBaseUrl()
        const [stateRes, scenRes, assetsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/api/hospital/state`).then(r => r.ok ? r.json() : null),
          fetch(`${baseUrl}/api/scenarios`).then(r => r.ok ? r.json() : null),
          fetch(`${baseUrl}/api/assets`).then(r => r.ok ? r.json() : null)
        ])

        if (isMounted) {
          if (stateRes.status === 'fulfilled' && stateRes.value) {
            setHospitalState(stateRes.value)
          }
          if (scenRes.status === 'fulfilled' && scenRes.value?.scenarios) {
            setLiveScenarios(scenRes.value.scenarios)
          }
          if (assetsRes.status === 'fulfilled' && Array.isArray(assetsRes.value)) {
            setLiveAssets(assetsRes.value)
          } else if (assets && assets.length > 0) {
            setLiveAssets(assets)
          }
        }
      } catch (err) {
        console.error('Settings backend sync error:', err)
      } finally {
        if (isMounted) setIsLoadingBackend(false)
      }
    }

    fetchBackendData()
    return () => { isMounted = false }
  }, [assets])

  // System map icon helper
  const getAssetIcon = (assetType, sys) => {
    const s = (sys || '').toLowerCase()
    const t = (assetType || '').toLowerCase()
    if (s.includes('elec') || t.includes('trans') || t.includes('gen') || t.includes('ups') || t.includes('ats')) return Zap
    if (s.includes('water') || t.includes('tank') || t.includes('pump')) return Droplets
    if (s.includes('hvac') || t.includes('chiller') || t.includes('air')) return Wind
    if (s.includes('gas') || t.includes('oxygen') || t.includes('o2')) return Flame
    return SettingsIcon
  }

  // Filtered Assets list
  const filteredAssets = useMemo(() => {
    if (!liveAssets || liveAssets.length === 0) {
      return [
        { asset_id: 'TRANSFORMER_01', name: 'Main Feeder Transformer', system: 'electrical', capacity_kw: 2000, status: 'normal', criticality: 'CRITICAL' },
        { asset_id: 'GEN_01', name: 'Diesel Standby Generator', system: 'electrical', capacity_kw: 1500, status: 'standby', criticality: 'CRITICAL' },
        { asset_id: 'UPS_01', name: 'ICU Critical UPS Bank', system: 'electrical', capacity_kw: 500, status: 'normal', criticality: 'CRITICAL' },
        { asset_id: 'CHILLER_01', name: 'Central Chiller Unit A', system: 'hvac', capacity_kw: 1200, status: 'normal', criticality: 'HIGH' },
        { asset_id: 'O2_TANK_01', name: 'Cryogenic O2 Storage', system: 'medical_gas', capacity_kw: 5000, status: 'normal', criticality: 'CRITICAL' },
        { asset_id: 'WATER_PUMP_01', name: 'Hydro-Pneumatic Domestic Pump', system: 'water', capacity_kw: 250, status: 'normal', criticality: 'MEDIUM' }
      ]
    }

    if (assetSystemFilter === 'All Systems') return liveAssets

    const filterMap = {
      'Electrical System': 'electrical',
      'Water System': 'water',
      'HVAC System': 'hvac',
      'Medical Gas': 'medical_gas'
    }
    const targetSys = filterMap[assetSystemFilter] || assetSystemFilter.toLowerCase()

    return liveAssets.filter(a => {
      const sys = (a.system || a.system_type || '').toLowerCase()
      return sys.includes(targetSys)
    })
  }, [liveAssets, assetSystemFilter])

  // Services List
  const servicesList = useMemo(() => {
    return [
      { name: 'ICU Life Support', icon: HeartPulse, prio: 'CRITICAL', deps: 12, status: 'Normal', loc: 'East Wing Fl. 3' },
      { name: 'Surgical OT (Operation Theatre)', icon: Activity, prio: 'CRITICAL', deps: 10, status: 'Normal', loc: 'North Block Fl. 2' },
      { name: 'Emergency Trauma Care', icon: HeartPulse, prio: 'CRITICAL', deps: 11, status: 'Normal', loc: 'Ground Fl. ER' },
      { name: 'Inpatient Wards', icon: Building, prio: 'HIGH', deps: 8, status: 'Normal', loc: 'Main Tower' },
      { name: 'Outpatient Clinic (OPD)', icon: Building, prio: 'MEDIUM', deps: 6, status: 'Normal', loc: 'Ambulatory Pavilion' },
      { name: 'Clinical Laboratory', icon: Flame, prio: 'MEDIUM', deps: 7, status: 'Normal', loc: 'Diagnostic Wing' },
      { name: 'Radiology & MRI Imaging', icon: Zap, prio: 'MEDIUM', deps: 6, status: 'Normal', loc: 'Basement Level 1' },
      { name: 'Pharmacy & Drug Storage', icon: Layers, prio: 'LOW', deps: 4, status: 'Normal', loc: 'Ground Fl. Lobby' }
    ]
  }, [])

  // HICS User Access Roles list
  const hicsUsersList = [
    { name: 'Dr. Sarah Jenkins', role: 'Incident Commander', dept: 'Clinical Operations', access: 'FULL_ADMIN', status: 'ACTIVE' },
    { name: 'Eng. Marcus Vance', role: 'Operations Chief', dept: 'Facilities & Power', access: 'CONTROL_WRITE', status: 'ACTIVE' },
    { name: 'Elena Rostova', role: 'Bio-Medical Engineer', dept: 'Life-Safety Tech', access: 'TELEMETRY_WRITE', status: 'ACTIVE' },
    { name: 'Dr. Aaron Chen', role: 'Safety & Triage Lead', dept: 'Emergency Dept', access: 'READ_ONLY', status: 'IDLE' }
  ]

  // Export JSON configuration file
  const handleExportConfig = () => {
    const configExport = {
      hospital_name: 'ResilienceOS Campus Hospital',
      exported_at: new Date().toISOString(),
      theme,
      simulation_params: {
        simSpeed,
        timeStep,
        defDuration,
        defSeverity,
        enableRealtimeAnim,
        enableEventLogging,
        autoRefreshDash
      },
      threshold_rules: {
        voltageThreshold,
        transformerLoad,
        genStartDelay,
        upsBatteryLow,
        stateHysteresis
      },
      visualization_settings: {
        buildingOpacity,
        showLabels,
        showFlowAnim,
        cameraAutoRotate
      },
      assets_summary: hospitalState?.assets_summary || { total: liveAssets.length },
      assets_count: liveAssets.length
    }

    const blob = new Blob([JSON.stringify(configExport, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ResilienceOS_Config_${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    if (onNotify) onNotify('Hospital configuration successfully exported as JSON', 'success')
  }

  // Import JSON configuration file
  const handleImportConfig = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (parsed.simulation_params) {
          if (parsed.simulation_params.simSpeed) setSimSpeed(parsed.simulation_params.simSpeed)
          if (parsed.simulation_params.timeStep) setTimeStep(parsed.simulation_params.timeStep)
          if (parsed.simulation_params.defDuration) setDefDuration(parsed.simulation_params.defDuration)
        }
        if (parsed.threshold_rules) {
          if (parsed.threshold_rules.voltageThreshold) setVoltageThreshold(parsed.threshold_rules.voltageThreshold)
          if (parsed.threshold_rules.transformerLoad) setTransformerLoad(parsed.threshold_rules.transformerLoad)
        }
        if (parsed.theme && onSetTheme) {
          onSetTheme(parsed.theme)
        }
        if (onNotify) onNotify(`Successfully imported config: ${file.name}`, 'success')
      } catch (err) {
        if (onNotify) onNotify('Failed to parse config JSON file', 'error')
      }
    }
    reader.readAsText(file)
  }

  const handleResetAll = () => {
    setSimSpeed(1)
    setTimeStep(1)
    setDefDuration(2)
    setDefSeverity('Medium (50%)')
    setVoltageThreshold(0.85)
    setTransformerLoad(90)
    setGenStartDelay(10)
    setUpsBatteryLow(20)
    setStateHysteresis(5)
    setBuildingOpacity(100)
    setShowLabels(true)
    setShowFlowAnim(true)
    setCameraAutoRotate(false)
    if (onReset) onReset()
    if (onNotify) onNotify('All system settings reset to factory defaults', 'warning')
  }

  return (
    <div className="settings-page">
      {/* 1. TOP 7 NAVIGATION TABS */}
      <section className="settings-top-tabs-row font-mono">
        {SETTING_TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <div
              key={tab.id}
              className={`settings-nav-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="tab-icon-wrap">
                <Icon size={16} />
              </div>
              <div className="tab-text-col">
                <span className="tab-name">{tab.name}</span>
                <span className="tab-sub">{tab.sub}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. TAB CONTENT GRIDS (Single Focused View Per Tab) */}

      {/* TAB 1: HOSPITAL MODEL */}
      {activeTab === 'model' && (
        <section className="settings-top-cards-grid">
          {/* Card 1: Hospital Configuration */}
          <div className="settings-panel-card">
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Hospital Configuration</span>
              <span className="panel-live-tag font-mono">● LIVE MODEL</span>
            </div>
            <span className="panel-subtitle">Configure the hospital model, assets, services and dependencies.</span>

            <div className="hospital-model-select-row">
              <div className="model-dropdown-wrap">
                <label className="field-lbl">Hospital Topology Model</label>
                <select
                  className="settings-select font-mono"
                  value={selectedScenarioPreset}
                  onChange={(e) => setSelectedScenarioPreset(e.target.value)}
                >
                  <option value="campus_default">Campus Multi-Building Model (Active)</option>
                  <option value="single_tower">Single Acute Care Tower Model</option>
                  <option value="metropolitan">Metropolitan Medical Center (Tier IV)</option>
                </select>
              </div>
              <button
                type="button"
                className="load-preset-btn font-mono"
                onClick={() => setIsScenarioModalOpen(true)}
              >
                Load Preset
              </button>
            </div>

            {/* 4 Live Metric Badges */}
            <div className="hospital-badges-grid font-mono">
              <div className="h-badge-box">
                <Building size={14} className="h-badge-icon" />
                <span className="h-badge-val">{liveAssets.length || 52}</span>
                <span className="h-badge-lbl">Total Assets</span>
              </div>
              <div className="h-badge-box">
                <SettingsIcon size={14} className="h-badge-icon" />
                <span className="h-badge-val">6</span>
                <span className="h-badge-lbl">Sub-systems</span>
              </div>
              <div className="h-badge-box">
                <ShieldCheck size={14} className="h-badge-icon" />
                <span className="h-badge-val">8</span>
                <span className="h-badge-lbl">Critical Services</span>
              </div>
              <div className="h-badge-box">
                <Share2 size={14} className="h-badge-icon" />
                <span className="h-badge-val">112</span>
                <span className="h-badge-lbl">Dependencies</span>
              </div>
            </div>

            <div className="model-meta-fields">
              <div className="meta-field-row">
                <span className="meta-k">Model Name</span>
                <span className="meta-v">ResilienceOS - Campus Hospital (v1.0)</span>
              </div>
              <div className="meta-field-row">
                <span className="meta-k">Status</span>
                <span className="meta-v font-mono" style={{ color: '#10B981' }}>
                  {incident?.is_active ? 'SIMULATION CASCADE ACTIVE' : 'NOMINAL STEADY STATE'}
                </span>
              </div>
            </div>

            {/* 4 Action buttons */}
            <div className="hospital-actions-grid font-mono">
              <button
                type="button"
                className="h-action-btn"
                onClick={() => { if (onNotify) onNotify('Opening Infrastructure Asset Catalog...', 'info') }}
              >
                ✏ Edit Model
              </button>
              <button
                type="button"
                className="h-action-btn"
                onClick={() => { if (onNotify) onNotify('Managing Critical Clinical Services...', 'info') }}
              >
                📋 Manage Services
              </button>
              <button
                type="button"
                className="h-action-btn"
                onClick={() => { if (onNavigate) onNavigate('digital-twin') }}
              >
                🔗 View Digital Twin
              </button>
              <button
                type="button"
                className="h-action-btn"
                onClick={() => { if (onReset) onReset(); if (onNotify) onNotify('Hospital model reset to baseline equilibrium', 'warning') }}
              >
                🔄 Reset to Default
              </button>
            </div>
          </div>

          {/* Card 2: Infrastructure Assets */}
          <div className="settings-panel-card">
            <div className="panel-header-with-select">
              <div className="title-with-info">
                <span className="settings-panel-title">Infrastructure Assets</span>
                <span className="panel-count-badge font-mono">{filteredAssets.length}</span>
              </div>
              <select
                className="settings-select font-mono"
                value={assetSystemFilter}
                onChange={(e) => setAssetSystemFilter(e.target.value)}
              >
                <option value="All Systems">All Systems</option>
                <option value="Electrical System">Electrical System</option>
                <option value="Water System">Water System</option>
                <option value="HVAC System">HVAC System</option>
                <option value="Medical Gas">Medical Gas</option>
              </select>
            </div>
            <span className="panel-subtitle">Live status and capacities of connected physical assets.</span>

            <div className="assets-table-scroll font-mono">
              <table className="settings-data-table">
                <thead>
                  <tr>
                    <th className="th-left font-sans">Asset</th>
                    <th>Capacity</th>
                    <th>Status</th>
                    <th>Criticality</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.map((item, idx) => {
                    const Icon = getAssetIcon(item.asset_type, item.system)
                    const isNormal = !item.status || item.status.toLowerCase() === 'normal' || item.status.toLowerCase() === 'standby'
                    return (
                      <tr key={item.asset_id || idx}>
                        <td className="td-left font-sans td-with-icon">
                          <Icon size={12} className="td-icon" />
                          <span>{item.name || item.asset_id}</span>
                        </td>
                        <td>{item.capacity_kw ? `${item.capacity_kw} kW` : (item.capacity || '—')}</td>
                        <td>
                          <span className={`status-dot ${isNormal ? 'dot-cyan' : 'dot-red'}`} />
                          <span style={{ color: isNormal ? 'var(--text-primary)' : '#EF4444' }}>
                            {item.status ? item.status.toUpperCase() : 'NORMAL'}
                          </span>
                        </td>
                        <td>
                          <span className={`crit-badge badge-${(item.criticality || 'HIGH').toLowerCase()}`}>
                            {item.criticality || 'HIGH'}
                          </span>
                        </td>
                        <td><ChevronRight size={12} className="td-chevron" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="add-item-btn font-mono"
              onClick={() => { if (onNotify) onNotify('Asset registration form initialized', 'info') }}
            >
              <Plus size={13} />
              <span>Add New Asset</span>
            </button>
          </div>

          {/* Card 3: Critical Services */}
          <div className="settings-panel-card">
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Critical Healthcare Services</span>
              <span className="panel-count-badge font-mono">{servicesList.length}</span>
            </div>
            <span className="panel-subtitle">Configure service dependencies and operational priority.</span>

            <div className="services-table-scroll font-mono">
              <table className="settings-data-table">
                <thead>
                  <tr>
                    <th className="th-left font-sans">Service</th>
                    <th>Priority</th>
                    <th>Dependencies</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {servicesList.map((srv, idx) => {
                    const Icon = srv.icon
                    return (
                      <tr key={idx}>
                        <td className="td-left font-sans td-with-icon">
                          <Icon size={12} className="td-icon" />
                          <span>{srv.name}</span>
                        </td>
                        <td>
                          <span className={`crit-badge badge-${srv.prio.toLowerCase()}`}>{srv.prio}</span>
                        </td>
                        <td>{srv.deps} Nodes</td>
                        <td><span className="status-dot dot-cyan" /> {srv.status}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="add-item-btn font-mono"
              onClick={() => { if (onNotify) onNotify('Service definition editor opened', 'info') }}
            >
              <Plus size={13} />
              <span>Add New Service</span>
            </button>
          </div>
        </section>
      )}

      {/* TAB 2: SIMULATION PARAMETERS & SCENARIOS */}
      {activeTab === 'sim' && (
        <section className="settings-top-cards-grid">
          {/* Card 4: Simulation Settings */}
          <div className="settings-panel-card">
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Simulation Engine Parameters</span>
              <Activity size={13} className="panel-info-icon" />
            </div>
            <span className="panel-subtitle">Configure global physics & cascade evaluation rates.</span>

            <div className="sliders-form-list">
              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Simulation Speed</span>
                  <span className="font-mono">{simSpeed}x Realtime</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Simulation Time Step</span>
                  <span className="font-mono">{timeStep} min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={timeStep}
                  onChange={(e) => setTimeStep(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Default Scenario Horizon</span>
                  <span className="font-mono">{defDuration} hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={defDuration}
                  onChange={(e) => setDefDuration(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="dropdown-field-row">
                <span>Default Failure Severity</span>
                <select
                  className="settings-select font-mono"
                  value={defSeverity}
                  onChange={(e) => setDefSeverity(e.target.value)}
                >
                  <option value="Medium (50%)">Medium Degradation (50%)</option>
                  <option value="High (80%)">High Degradation (80%)</option>
                  <option value="Full Failure">Complete Catastrophic Blackout (100%)</option>
                </select>
              </div>

              <div className="toggle-switches-list font-mono">
                <label className="toggle-switch-row">
                  <span>Enable Real-time Dynamic Animation</span>
                  <input
                    type="checkbox"
                    checked={enableRealtimeAnim}
                    onChange={() => setEnableRealtimeAnim(!enableRealtimeAnim)}
                  />
                </label>
                <label className="toggle-switch-row">
                  <span>Event Logging to Audit Trail</span>
                  <input
                    type="checkbox"
                    checked={enableEventLogging}
                    onChange={() => setEnableEventLogging(!enableEventLogging)}
                  />
                </label>
                <label className="toggle-switch-row">
                  <span>Auto-refresh Telemetry Streams</span>
                  <input
                    type="checkbox"
                    checked={autoRefreshDash}
                    onChange={() => setAutoRefreshDash(!autoRefreshDash)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card: Scenario Presets Loader */}
          <div className="settings-panel-card">
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Disaster Scenario Catalog</span>
              <span className="panel-count-badge font-mono">{liveScenarios.length || 3} Presets</span>
            </div>
            <span className="panel-subtitle">Validated disaster scenarios for stress-testing hospital infrastructure.</span>

            <div className="ssm-grid" style={{ marginTop: '8px' }}>
              {[
                { id: 'scen_blackout', title: 'Severe Grid Blackout + Transformer Trip', desc: 'Primary 33kV feed severed. 18-minute critical battery depletion window.', type: 'Electrical', severity: 'HIGH' },
                { id: 'scen_chiller', title: 'HVAC Chiller Thermal Excursion', desc: 'Dual chiller plant compressor trip. OT cleanroom thermal rise > 0.8°C/hr.', type: 'HVAC', severity: 'MEDIUM' },
                { id: 'scen_oxygen', title: 'Cryogenic Liquid Oxygen Header Leak', desc: 'Pressure drops below 55 PSI in ICU manifold. Dual backup vaporization active.', type: 'Medical Gas', severity: 'CRITICAL' }
              ].map((scen) => (
                <div
                  key={scen.id}
                  className={`ssm-card ${selectedScenarioPreset === scen.id ? 'is-selected' : ''}`}
                  onClick={() => {
                    setSelectedScenarioPreset(scen.id)
                    if (onNotify) onNotify(`Configured simulation scenario: "${scen.title}"`, 'success')
                  }}
                >
                  <div className="ssm-card-top">
                    <span className="ssm-type">{scen.type}</span>
                    <span className="crit-badge badge-high">{scen.severity}</span>
                  </div>
                  <span className="ssm-name">{scen.title}</span>
                  <span className="ssm-sub">{scen.desc}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="add-item-btn font-mono"
              onClick={() => { if (onNavigate) onNavigate('simulation') }}
              style={{ marginTop: '10px' }}
            >
              <Play size={13} />
              <span>Launch Simulation Test</span>
            </button>
          </div>
        </section>
      )}

      {/* TAB 3: THRESHOLDS & STATE RULES */}
      {activeTab === 'thresholds' && (
        <section className="settings-top-cards-grid">
          {/* Card 5: Thresholds & State Rules */}
          <div className="settings-panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Thresholds & State Transition Rules</span>
              <AlertTriangle size={13} className="panel-info-icon" />
            </div>
            <span className="panel-subtitle">State transition triggers, alarm thresholds, and physical margin boundaries.</span>

            {/* System Tabs */}
            <div className="thresholds-mini-tabs font-mono" style={{ margin: '8px 0 14px 0' }}>
              {['Electrical', 'Water', 'HVAC', 'Medical Gas'].map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`thresh-tab ${thresholdSystemTab === t ? 'is-active' : ''}`}
                  onClick={() => setThresholdSystemTab(t)}
                >
                  {t} System
                </button>
              ))}
            </div>

            <div className="sliders-form-list">
              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Voltage Dip Threshold (Low-Voltage Alarm)</span>
                  <span className="font-mono">{voltageThreshold} pu</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.05"
                  value={voltageThreshold}
                  onChange={(e) => setVoltageThreshold(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Transformer Overload Limit (% Capacity)</span>
                  <span className="font-mono">{transformerLoad}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={transformerLoad}
                  onChange={(e) => setTransformerLoad(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>Generator Automatic Transfer Switch (ATS) Delay</span>
                  <span className="font-mono">{genStartDelay} sec</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="30"
                  value={genStartDelay}
                  onChange={(e) => setGenStartDelay(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>UPS Inverter Battery Low Warning Floor</span>
                  <span className="font-mono">{upsBatteryLow}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="50"
                  value={upsBatteryLow}
                  onChange={(e) => setUpsBatteryLow(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <div className="slider-row">
                <div className="slider-label-val">
                  <span>State Transition Hysteresis Dampening Window</span>
                  <span className="font-mono">{stateHysteresis} min</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={stateHysteresis}
                  onChange={(e) => setStateHysteresis(Number(e.target.value))}
                  className="setting-range-input"
                />
              </div>

              <button
                type="button"
                className="edit-rules-btn font-mono"
                onClick={() => { if (onNotify) onNotify('Custom mathematical physics parameters applied', 'success') }}
              >
                💾 Save Threshold Parameters
              </button>
            </div>
          </div>
        </section>
      )}

      {/* TAB 4: VISUALIZATION & 3D TWIN */}
      {activeTab === 'vis' && (
        <section className="settings-top-cards-grid">
          {/* Card 6: Visualization Settings */}
          <div className="settings-panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Visualization & 3D Digital Twin Preferences</span>
              <SlidersHorizontal size={13} className="panel-info-icon" />
            </div>
            <span className="panel-subtitle">Configure 3D graphics rendering, shaders, theme, and display preferences.</span>

            <div className="vis-radio-toggle-row font-mono" style={{ margin: '8px 0' }}>
              <label className="vis-radio-lbl">
                <input type="radio" name="vis_mode" defaultChecked />
                <span>3D Digital Twin</span>
              </label>
              <label className="vis-radio-lbl">
                <input type="radio" name="vis_mode" />
                <span>2D Topological Schematic</span>
              </label>
            </div>

            <div className="dropdown-field-row">
              <span>Rendering Mode</span>
              <select className="settings-select font-mono" defaultValue="campus">
                <option value="campus">Full Campus Isometric</option>
                <option value="building">Internal Building Cutaway</option>
                <option value="wireframe">Cyber Wireframe Overlay</option>
              </select>
            </div>

            <div className="dropdown-field-row">
              <span>Application Theme</span>
              <select
                className="settings-select font-mono"
                value={theme}
                onChange={(e) => {
                  if (onSetTheme) onSetTheme(e.target.value)
                  if (onNotify) onNotify(`Switched to ${e.target.value.toUpperCase()} theme`, 'info')
                }}
              >
                <option value="dark">Dark Theme (Default Cyberpunk)</option>
                <option value="light">Light Theme (Executive Clinical)</option>
              </select>
            </div>

            <div className="toggle-switches-list font-mono">
              <label className="toggle-switch-row">
                <span>Show Asset HUD Labels</span>
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={() => setShowLabels(!showLabels)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Show Energy & Gas Flow Particles</span>
                <input
                  type="checkbox"
                  checked={showFlowAnim}
                  onChange={() => setShowFlowAnim(!showFlowAnim)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Camera Orbit Auto-Rotate</span>
                <input
                  type="checkbox"
                  checked={cameraAutoRotate}
                  onChange={() => setCameraAutoRotate(!cameraAutoRotate)}
                />
              </label>
            </div>

            <div className="slider-row">
              <div className="slider-label-val">
                <span>Building Shell Opacity</span>
                <span className="font-mono">{buildingOpacity}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={buildingOpacity}
                onChange={(e) => setBuildingOpacity(Number(e.target.value))}
                className="setting-range-input"
              />
            </div>
          </div>
        </section>
      )}

      {/* TAB 5: USERS & ACCESS */}
      {activeTab === 'users' && (
        <section className="settings-top-cards-grid">
          {/* Card: Users & HICS Access */}
          <div className="settings-panel-card" style={{ gridColumn: 'span 3' }}>
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Hospital Incident Command System (HICS) Roles</span>
              <span className="panel-count-badge font-mono">{hicsUsersList.length} Operators</span>
            </div>
            <span className="panel-subtitle">Role-Based Access Control (RBAC) & Command Operators.</span>

            <div className="assets-table-scroll font-mono">
              <table className="settings-data-table">
                <thead>
                  <tr>
                    <th className="th-left font-sans">Operator</th>
                    <th>HICS Role</th>
                    <th>Department</th>
                    <th>Permission Level</th>
                    <th>Session Status</th>
                  </tr>
                </thead>
                <tbody>
                  {hicsUsersList.map((usr, idx) => (
                    <tr key={idx}>
                      <td className="td-left font-sans td-with-icon">
                        <UserCheck size={12} className="td-icon" />
                        <span>{usr.name}</span>
                      </td>
                      <td>{usr.role}</td>
                      <td>{usr.dept}</td>
                      <td>
                        <span className="crit-badge badge-high">{usr.access}</span>
                      </td>
                      <td>
                        <span className="status-dot dot-cyan" /> {usr.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              className="add-item-btn font-mono"
              onClick={() => { if (onNotify) onNotify('HICS Operator authorization wizard opened', 'info') }}
            >
              <Plus size={13} />
              <span>Invite New HICS Incident Commander</span>
            </button>
          </div>
        </section>
      )}

      {/* TAB 6: DATA & EXPORT */}
      {activeTab === 'data' && (
        <section className="settings-top-cards-grid">
          {/* Card 7: Data & System */}
          <div className="settings-panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header-with-info">
              <span className="settings-panel-title">Data Management & Topology Backup</span>
              <Database size={13} className="panel-info-icon" />
            </div>
            <span className="panel-subtitle">Import and export complete hospital topology, assets, and simulation state.</span>

            <div className="dropdown-field-row">
              <span>Telemetry Data Feed Source</span>
              <select className="settings-select font-mono" defaultValue="live_ws">
                <option value="live_ws">Live WebSocket Telemetry (/ws/twin)</option>
                <option value="synthetic">Synthetic Physics Simulation Engine</option>
              </select>
            </div>

            <div className="import-export-row font-mono" style={{ margin: '12px 0' }}>
              <span>Configuration Backup</span>
              <div className="ie-buttons">
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".json"
                  onChange={handleImportConfig}
                />
                <button
                  type="button"
                  className="ie-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={11} /> Import JSON Config
                </button>
                <button
                  type="button"
                  className="ie-btn"
                  onClick={handleExportConfig}
                >
                  <Download size={11} /> Export JSON Config
                </button>
              </div>
            </div>

            <div className="toggle-switches-list font-mono">
              <label className="toggle-switch-row">
                <span>Persist Simulation Audit History to Database</span>
                <input
                  type="checkbox"
                  checked={saveSimHistory}
                  onChange={() => setSaveSimHistory(!saveSimHistory)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Detailed Diagnostic Debug Telemetry Logs</span>
                <input
                  type="checkbox"
                  checked={enableDetailedLogs}
                  onChange={() => setEnableDetailedLogs(!enableDetailedLogs)}
                />
              </label>
            </div>
          </div>
        </section>
      )}

      {/* TAB 7: SYSTEM DIAGNOSTICS */}
      {activeTab === 'system' && (
        <section className="settings-top-cards-grid">
          <div className="settings-panel-card" style={{ gridColumn: 'span 2' }}>
            <div className="panel-header-with-info">
              <span className="settings-panel-title">System Runtime Diagnostics & Engine Health</span>
              <SettingsIcon size={13} className="panel-info-icon" />
            </div>
            <span className="panel-subtitle">Core microservices connectivity, machine learning modules, and factory defaults.</span>

            <div className="model-meta-fields" style={{ margin: '8px 0' }}>
              <div className="meta-field-row">
                <span className="meta-k">Backend Engine</span>
                <span className="meta-v font-mono" style={{ color: '#10B981' }}>FastAPI HospitalStateEngine (Online)</span>
              </div>
              <div className="meta-field-row">
                <span className="meta-k">WebSocket Stream</span>
                <span className="meta-v font-mono" style={{ color: '#00F0FF' }}>ws://localhost:8000/ws/twin (Synchronized)</span>
              </div>
              <div className="meta-field-row">
                <span className="meta-k">Database Store</span>
                <span className="meta-v font-mono">SQLite / AsyncSession Persisted</span>
              </div>
            </div>

            <div className="toggle-switches-list font-mono">
              <label className="toggle-switch-row">
                <span>Enable WebSocket Real-time Sync</span>
                <input
                  type="checkbox"
                  checked={enableWebSocket}
                  onChange={() => setEnableWebSocket(!enableWebSocket)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Enable ML Anomaly Detection Engine</span>
                <input
                  type="checkbox"
                  checked={enableAnomalyDetection}
                  onChange={() => setEnableAnomalyDetection(!enableAnomalyDetection)}
                />
              </label>
            </div>

            <button
              type="button"
              className="reset-all-settings-btn font-mono"
              onClick={handleResetAll}
              style={{ marginTop: '16px' }}
            >
              <RotateCcw size={13} />
              <span>Reset All System Settings to Default</span>
            </button>
          </div>
        </section>
      )}

      {/* 3. SCENARIO PRESETS MODAL */}
      {isScenarioModalOpen && (
        <div className="settings-scenario-modal-overlay" onClick={() => setIsScenarioModalOpen(false)}>
          <div className="settings-scenario-modal font-mono" onClick={(e) => e.stopPropagation()}>
            <div className="ssm-header">
              <span className="ssm-title">Hospital Incident Scenario Presets</span>
              <button type="button" className="ssm-close-btn" onClick={() => setIsScenarioModalOpen(false)}>✕</button>
            </div>
            <div className="ssm-body">
              <p className="ssm-desc">Select a validated hospital disaster preset to load infrastructure topology parameters:</p>
              <div className="ssm-grid">
                {[
                  { id: 'scen_blackout', title: 'Severe Grid Blackout + Transformer Trip', desc: 'Primary 33kV feed severed. 18-minute critical battery depletion window.', type: 'Electrical', severity: 'HIGH' },
                  { id: 'scen_chiller', title: 'HVAC Chiller Thermal Excursion', desc: 'Dual chiller plant compressor trip. OT cleanroom thermal rise > 0.8°C/hr.', type: 'HVAC', severity: 'MEDIUM' },
                  { id: 'scen_oxygen', title: 'Cryogenic Liquid Oxygen Header Leak', desc: 'Pressure drops below 55 PSI in ICU manifold. Dual backup vaporization active.', type: 'Medical Gas', severity: 'CRITICAL' }
                ].map((scen) => (
                  <div
                    key={scen.id}
                    className={`ssm-card ${selectedScenarioPreset === scen.id ? 'is-selected' : ''}`}
                    onClick={() => {
                      setSelectedScenarioPreset(scen.id)
                      setIsScenarioModalOpen(false)
                      if (onNotify) onNotify(`Loaded scenario preset: "${scen.title}"`, 'success')
                    }}
                  >
                    <div className="ssm-card-top">
                      <span className="ssm-type">{scen.type}</span>
                      <span className="crit-badge badge-high">{scen.severity}</span>
                    </div>
                    <span className="ssm-name">{scen.title}</span>
                    <span className="ssm-sub">{scen.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
