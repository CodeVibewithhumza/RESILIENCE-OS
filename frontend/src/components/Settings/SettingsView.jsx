import { useState } from 'react'
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
  Layers
} from 'lucide-react'
import './SettingsView.css'

const SETTING_TABS = [
  { id: 'model', name: 'Hospital Model', sub: 'Assets, services, dependencies', icon: Building },
  { id: 'sim', name: 'Simulation', sub: 'Parameters and scenarios', icon: Activity },
  { id: 'thresholds', name: 'Thresholds', sub: 'State & risk thresholds', icon: AlertTriangle },
  { id: 'vis', name: 'Visualization', sub: '3D view & display options', icon: SlidersHorizontal },
  { id: 'users', name: 'Users & Access', sub: 'Team and permissions', icon: Users },
  { id: 'data', name: 'Data & Export', sub: 'Import, export & logs', icon: Database },
  { id: 'system', name: 'System', sub: 'General settings', icon: SettingsIcon }
]

export default function SettingsView({ onReset, theme = 'dark', onSetTheme, onNotify }) {
  const [activeTab, setActiveTab] = useState('model')
  const [assetSystemFilter, setAssetSystemFilter] = useState('Electrical System')
  const [thresholdSystemTab, setThresholdSystemTab] = useState('Electrical')

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

  const assetsList = [
    { name: 'Main Transformer', icon: Zap, cap: '2 MVA', status: 'Normal', crit: 'High' },
    { name: 'Diesel Generator (DG-1)', icon: SettingsIcon, cap: '1.5 MVA', status: 'Standby', crit: 'High' },
    { name: 'UPS System', icon: Layers, cap: '500 kVA', status: 'Normal', crit: 'High' },
    { name: 'ATS', icon: Zap, cap: '2 MVA', status: 'Normal', crit: 'High' },
    { name: 'Distribution Panel', icon: Zap, cap: '—', status: 'Normal', crit: 'Medium' },
    { name: 'Chiller Plant', icon: Wind, cap: '1200 TR', status: 'Normal', crit: 'Medium' },
    { name: 'Water Tank (Main)', icon: Droplets, cap: '200 KL', status: 'Normal', crit: 'Medium' },
    { name: 'Medical Gas Plant', icon: Flame, cap: 'Oxygen/Air/Vacuum', status: 'Normal', crit: 'High' }
  ]

  const servicesList = [
    { name: 'ICU', icon: HeartPulse, prio: 'Critical', deps: 12, status: 'Normal' },
    { name: 'OT (Operation Theatre)', icon: Activity, prio: 'Critical', deps: 10, status: 'Normal' },
    { name: 'Emergency', icon: HeartPulse, prio: 'Critical', deps: 11, status: 'Normal' },
    { name: 'Wards', icon: Building, prio: 'High', deps: 8, status: 'Normal' },
    { name: 'OPD', icon: Building, prio: 'Medium', deps: 6, status: 'Normal' },
    { name: 'Laboratory', icon: Flame, prio: 'Medium', deps: 7, status: 'Normal' },
    { name: 'Radiology', icon: Zap, prio: 'Medium', deps: 6, status: 'Normal' },
    { name: 'Pharmacy', icon: Layers, prio: 'Low', deps: 4, status: 'Normal' }
  ]

  const handleResetAll = () => {
    if (onReset) onReset()
    if (onNotify) onNotify('All system settings reset to factory defaults', 'warning')
  }

  return (
    <div className="settings-page">
      {/* 1. TOP 7 NAVIGATION TABS */}
      <section className="settings-top-tabs-row">
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

      {/* 2. TOP ROW (3 CARDS): 1. Hospital Config, 2. Infrastructure Assets, 3. Critical Services */}
      <section className="settings-top-cards-grid">
        {/* Card 1: Hospital Configuration */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">1. Hospital Configuration</span>
            <Info size={13} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Configure the hospital model, assets, services and dependencies.</span>

          <div className="hospital-model-select-row">
            <div className="model-dropdown-wrap">
              <label className="field-lbl">Hospital Model</label>
              <select className="settings-select font-mono" defaultValue="campus_default">
                <option value="campus_default">Campus Model (Default)</option>
                <option value="single_tower">Single Tower Model</option>
              </select>
            </div>
            <button type="button" className="load-preset-btn">Load Preset</button>
          </div>

          {/* 4 Metric Badges in 2x2 */}
          <div className="hospital-badges-grid font-mono">
            <div className="h-badge-box">
              <Building size={14} className="h-badge-icon" />
              <span className="h-badge-val">52</span>
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
              <span className="meta-k">Description</span>
              <span className="meta-v">Small, representative hospital infrastructure model for simulation and demonstration.</span>
            </div>
          </div>

          {/* 4 Action buttons 2x2 */}
          <div className="hospital-actions-grid">
            <button type="button" className="h-action-btn">✏ Edit Infrastructure Model</button>
            <button type="button" className="h-action-btn">📋 Manage Services</button>
            <button type="button" className="h-action-btn">🔗 View Dependency Graph</button>
            <button type="button" className="h-action-btn">🔄 Reset to Default</button>
          </div>
        </div>

        {/* Card 2: Infrastructure Assets */}
        <div className="settings-panel-card">
          <div className="panel-header-with-select">
            <div className="title-with-info">
              <span className="settings-panel-title">2. Infrastructure Assets</span>
              <Info size={13} className="panel-info-icon" />
            </div>
            <select
              className="settings-select font-mono"
              value={assetSystemFilter}
              onChange={(e) => setAssetSystemFilter(e.target.value)}
            >
              <option value="Electrical System">Electrical System</option>
              <option value="Water System">Water System</option>
              <option value="HVAC System">HVAC System</option>
              <option value="Medical Gas">Medical Gas</option>
            </select>
          </div>
          <span className="panel-subtitle">Configure key assets and capacities.</span>

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
                {assetsList.map((item, idx) => {
                  const Icon = item.icon
                  return (
                    <tr key={idx}>
                      <td className="td-left font-sans td-with-icon">
                        <Icon size={12} className="td-icon" />
                        <span>{item.name}</span>
                      </td>
                      <td>{item.cap}</td>
                      <td><span className="status-dot dot-cyan" /> {item.status}</td>
                      <td>
                        <span className={`crit-badge badge-${item.crit.toLowerCase()}`}>{item.crit}</span>
                      </td>
                      <td><ChevronRight size={12} className="td-chevron" /></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="add-item-btn">
            <Plus size={13} />
            <span>Add New Asset</span>
          </button>
        </div>

        {/* Card 3: Critical Services */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">3. Critical Services</span>
            <Info size={13} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Configure service dependencies and criticality.</span>

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
                      <td>{srv.deps}</td>
                      <td><span className="status-dot dot-cyan" /> {srv.status}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <button type="button" className="add-item-btn">
            <Plus size={13} />
            <span>Add New Service</span>
          </button>
        </div>
      </section>

      {/* 3. BOTTOM ROW (4 CARDS): 4. Simulation Settings, 5. Thresholds & State Rules, 6. Visualization Settings, 7. Data & System */}
      <section className="settings-bottom-cards-grid">
        {/* Card 4: Simulation Settings */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">4. Simulation Settings</span>
            <Info size={12} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Set global simulation parameters.</span>

          <div className="sliders-form-list">
            <div className="slider-row">
              <div className="slider-label-val">
                <span>Simulation Speed</span>
                <span className="font-mono">{simSpeed} x</span>
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
                <span>Time Step</span>
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
                <span>Default Duration</span>
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
              <span>Default Severity</span>
              <select
                className="settings-select font-mono"
                value={defSeverity}
                onChange={(e) => setDefSeverity(e.target.value)}
              >
                <option value="Medium (50%)">Medium (50%)</option>
                <option value="Full Failure">Full Failure</option>
              </select>
            </div>

            <div className="toggle-switches-list">
              <label className="toggle-switch-row">
                <span>Enable Real-time Animation</span>
                <input
                  type="checkbox"
                  checked={enableRealtimeAnim}
                  onChange={() => setEnableRealtimeAnim(!enableRealtimeAnim)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Enable Event Logging</span>
                <input
                  type="checkbox"
                  checked={enableEventLogging}
                  onChange={() => setEnableEventLogging(!enableEventLogging)}
                />
              </label>
              <label className="toggle-switch-row">
                <span>Auto-refresh Dashboard</span>
                <input
                  type="checkbox"
                  checked={autoRefreshDash}
                  onChange={() => setAutoRefreshDash(!autoRefreshDash)}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Card 5: Thresholds & State Rules */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">5. Thresholds & State Rules</span>
            <Info size={12} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Configure state transition thresholds for key systems.</span>

          {/* System Tabs */}
          <div className="thresholds-mini-tabs">
            {['Electrical', 'Water', 'HVAC', 'Medical Gas'].map((t) => (
              <button
                key={t}
                type="button"
                className={`thresh-tab ${thresholdSystemTab === t ? 'is-active' : ''}`}
                onClick={() => setThresholdSystemTab(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="sliders-form-list">
            <div className="slider-row">
              <div className="slider-label-val">
                <span>Voltage Threshold (Low)</span>
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
                <span>Transformer Load (High)</span>
                <span className="font-mono">{transformerLoad} %</span>
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
                <span>Generator Start Delay</span>
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
                <span>UPS Battery Low</span>
                <span className="font-mono">{upsBatteryLow} %</span>
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
                <span>State Hysteresis</span>
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

            <button type="button" className="edit-rules-btn">✏ Edit Advanced Rules</button>
          </div>
        </div>

        {/* Card 6: Visualization Settings */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">6. Visualization Settings</span>
            <Info size={12} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Configure 3D digital twin and display options.</span>

          <div className="vis-radio-toggle-row font-mono">
            <label className="vis-radio-lbl">
              <input type="radio" name="vis_mode" defaultChecked />
              <span>3D View</span>
            </label>
            <label className="vis-radio-lbl">
              <input type="radio" name="vis_mode" />
              <span>2D Schematic</span>
            </label>
          </div>

          <div className="dropdown-field-row">
            <span>View Mode</span>
            <select className="settings-select font-mono" defaultValue="campus">
              <option value="campus">Campus View</option>
              <option value="building">Building View</option>
            </select>
          </div>

          <div className="dropdown-field-row">
            <span>Theme</span>
            <select
              className="settings-select font-mono"
              value={theme}
              onChange={(e) => onSetTheme && onSetTheme(e.target.value)}
            >
              <option value="dark">Dark (Default)</option>
              <option value="light">Light</option>
            </select>
          </div>

          <div className="toggle-switches-list">
            <label className="toggle-switch-row">
              <span>Show Labels</span>
              <input
                type="checkbox"
                checked={showLabels}
                onChange={() => setShowLabels(!showLabels)}
              />
            </label>
            <label className="toggle-switch-row">
              <span>Show Flow Animation</span>
              <input
                type="checkbox"
                checked={showFlowAnim}
                onChange={() => setShowFlowAnim(!showFlowAnim)}
              />
            </label>
            <label className="toggle-switch-row">
              <span>Camera Auto-Rotate</span>
              <input
                type="checkbox"
                checked={cameraAutoRotate}
                onChange={() => setCameraAutoRotate(!cameraAutoRotate)}
              />
            </label>
          </div>

          <div className="slider-row">
            <div className="slider-label-val">
              <span>Building Opacity</span>
              <span className="font-mono">{buildingOpacity} %</span>
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

        {/* Card 7: Data & System */}
        <div className="settings-panel-card">
          <div className="panel-header-with-info">
            <span className="settings-panel-title">7. Data & System</span>
            <Info size={12} className="panel-info-icon" />
          </div>
          <span className="panel-subtitle">Manage data, import/export and system options.</span>

          <div className="dropdown-field-row">
            <span>Data Source</span>
            <select className="settings-select font-mono" defaultValue="synthetic">
              <option value="synthetic">Synthetic Data (Default)</option>
              <option value="live_ws">Live Telemetry (WebSocket)</option>
            </select>
          </div>

          <div className="dropdown-field-row">
            <span>Scenario Library</span>
            <button type="button" className="scen-lib-btn">📁 Manage Scenarios</button>
          </div>

          <div className="import-export-row">
            <span>Import / Export</span>
            <div className="ie-buttons">
              <button type="button" className="ie-btn"><Upload size={11} /> Import Config</button>
              <button type="button" className="ie-btn"><Download size={11} /> Export Config</button>
            </div>
          </div>

          <div className="toggle-switches-list">
            <label className="toggle-switch-row">
              <span>Enable WebSocket (Real-time)</span>
              <input
                type="checkbox"
                checked={enableWebSocket}
                onChange={() => setEnableWebSocket(!enableWebSocket)}
              />
            </label>
            <label className="toggle-switch-row">
              <span>Save Simulation History</span>
              <input
                type="checkbox"
                checked={saveSimHistory}
                onChange={() => setSaveSimHistory(!saveSimHistory)}
              />
            </label>
            <label className="toggle-switch-row">
              <span>Enable Anomaly Detection (ML)</span>
              <input
                type="checkbox"
                checked={enableAnomalyDetection}
                onChange={() => setEnableAnomalyDetection(!enableAnomalyDetection)}
              />
            </label>
            <label className="toggle-switch-row">
              <span>Enable Detailed Logs</span>
              <input
                type="checkbox"
                checked={enableDetailedLogs}
                onChange={() => setEnableDetailedLogs(!enableDetailedLogs)}
              />
            </label>
          </div>

          <button type="button" className="reset-all-settings-btn" onClick={handleResetAll}>
            <RotateCcw size={13} />
            <span>Reset All Settings</span>
          </button>
        </div>
      </section>
    </div>
  )
}
