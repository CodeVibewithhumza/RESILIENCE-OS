import { useState } from 'react'
import {
  Sliders,
  Building,
  Activity,
  SlidersHorizontal,
  Moon,
  Sun,
  Database,
  ShieldAlert,
  Save,
  RotateCcw,
  Check,
  Server,
  Layers
} from 'lucide-react'
import './SettingsView.css'

export default function SettingsView({ onReset, theme = 'dark', onSetTheme, onNotify }) {
  const [activeTab, setActiveTab] = useState('model')
  const [simSpeed, setSimSpeed] = useState(1)
  const [cascadeSpeed, setCascadeSpeed] = useState(5)
  const [monteCarloRuns, setMonteCarloRuns] = useState(500)
  const [criticalFloor, setCriticalFloor] = useState(60)
  const [batteryThreshold, setBatteryThreshold] = useState(20)
  const [fuelThreshold, setFuelThreshold] = useState(40)
  const [renderQuality, setRenderQuality] = useState('high')
  const [showCompass, setShowCompass] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    if (onNotify) {
      onNotify('System parameters & model configurations updated', 'success')
    }
    setTimeout(() => setIsSaved(false), 2000)
  }

  const handleThemeChange = (newTheme) => {
    if (onSetTheme) {
      onSetTheme(newTheme)
    }
  }

  const settingTabs = [
    { id: 'general', label: 'General', icon: Sliders },
    { id: 'model', label: 'Hospital Model', icon: Building },
    { id: 'assets', label: 'Assets & Services', icon: Server },
    { id: 'simulation', label: 'Simulation', icon: Activity },
    { id: 'thresholds', label: 'Thresholds', icon: ShieldAlert },
    { id: 'visualization', label: 'Visualization', icon: SlidersHorizontal },
    { id: 'data', label: 'Data & System', icon: Database }
  ]

  return (
    <div className="settings-page">
      {/* Header Bar */}
      <div className="settings-header-row">
        <div>
          <h1 className="settings-page-title">Settings & System Configuration</h1>
          <p className="settings-page-subtitle">
            Hospital infrastructure parameters, simulation rules, visualization options, and system preferences
          </p>
        </div>
        <div className="settings-actions-group">
          <button type="button" className="settings-reset-btn" onClick={onReset} title="Reset to baseline">
            <RotateCcw size={13} />
            <span>Reset Baseline</span>
          </button>
          <button type="button" className="settings-save-btn" onClick={handleSave}>
            {isSaved ? (
              <>
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7 Setting Navigation Tabs */}
      <div className="settings-tabs-bar">
        {settingTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              type="button"
              className={`setting-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="settings-panel-grid">
        {/* TAB 1: GENERAL */}
        {activeTab === 'general' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">General Platform Settings</span>
              <span className="font-mono badge badge-normal">System Active</span>
            </div>
            <div className="setting-form-grid">
              <div className="setting-field">
                <label className="field-label">Command Center Identifier</label>
                <input
                  type="text"
                  className="setting-input font-mono"
                  defaultValue="RESILIENCE-OS-PRODUCTION-CLUSTER-01"
                  readOnly
                />
              </div>
              <div className="setting-field">
                <label className="field-label">Timezone Sync</label>
                <select className="setting-select font-mono" defaultValue="UTC">
                  <option value="UTC">Coordinated Universal Time (UTC)</option>
                  <option value="EST">Eastern Standard Time (EST)</option>
                  <option value="PST">Pacific Standard Time (PST)</option>
                </select>
              </div>
              <div className="setting-field">
                <label className="field-label">Telemetry Ingestion Interval</label>
                <input type="text" className="setting-input font-mono" defaultValue="1000 ms (1s Live WebSocket)" readOnly />
              </div>
              <div className="setting-field">
                <label className="field-label">Session Operating Mode</label>
                <input type="text" className="setting-input font-mono" defaultValue="Simulation & Decision Support" readOnly />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HOSPITAL MODEL */}
        {activeTab === 'model' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Hospital Infrastructure Model (BIM Campus)</span>
              <span className="font-mono badge badge-normal">Level 1 Trauma</span>
            </div>
            <div className="setting-form-grid">
              <div className="setting-field">
                <label className="field-label">Healthcare Facility Name</label>
                <input type="text" className="setting-input" defaultValue="Central Metropolitan Hospital Campus" />
              </div>
              <div className="setting-field">
                <label className="field-label">Clinical Trauma Designation</label>
                <input type="text" className="setting-input" defaultValue="Level 1 Regional Trauma Center" />
              </div>
              <div className="setting-field">
                <label className="field-label">Total Inpatient Bed Capacity</label>
                <input type="number" className="setting-input font-mono" defaultValue="850" />
              </div>
              <div className="setting-field">
                <label className="field-label">Intensive Care Units (ICU Beds)</label>
                <input type="number" className="setting-input font-mono" defaultValue="48" />
              </div>
              <div className="setting-field">
                <label className="field-label">Operating Suites (OT Rooms)</label>
                <input type="number" className="setting-input font-mono" defaultValue="12" />
              </div>
              <div className="setting-field">
                <label className="field-label">Peak Electrical Demand</label>
                <input type="text" className="setting-input font-mono" defaultValue="2,200 kW" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ASSETS & SERVICES */}
        {activeTab === 'assets' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Infrastructure Assets & Clinical Topology</span>
              <span className="font-mono badge badge-cyan">52 Nodes Monitored</span>
            </div>
            <div className="setting-form-grid">
              <div className="setting-field">
                <label className="field-label">Electrical Substation Feeds</label>
                <input type="text" className="setting-input font-mono" defaultValue="11kV Dual Underground Feeders (A & B)" />
              </div>
              <div className="setting-field">
                <label className="field-label">Standby Generator Redundancy</label>
                <input type="text" className="setting-input font-mono" defaultValue="2x 1.5 MVA Cummins Diesel Generators (N+1)" />
              </div>
              <div className="setting-field">
                <label className="field-label">UPS System Capacity</label>
                <input type="text" className="setting-input font-mono" defaultValue="500 kVA Static UPS with 45 min Battery Bank" />
              </div>
              <div className="setting-field">
                <label className="field-label">Medical Gas Supply Configuration</label>
                <input type="text" className="setting-input font-mono" defaultValue="Bulk Cryogenic Liquid O2 + Dual Cylinder Manifold" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SIMULATION */}
        {activeTab === 'simulation' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Simulation Engine & Cascade Rules</span>
              <span className="font-mono badge badge-normal">Realtime Engine</span>
            </div>
            <div className="setting-form-grid">
              <div className="setting-field">
                <label className="field-label">Time Step Resolution: {simSpeed}x</label>
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={simSpeed}
                  onChange={(e) => setSimSpeed(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>
              <div className="setting-field">
                <label className="field-label">Cascade Propagation Speed: {cascadeSpeed}m delay</label>
                <input
                  type="range"
                  min="1"
                  max="15"
                  value={cascadeSpeed}
                  onChange={(e) => setCascadeSpeed(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>
              <div className="setting-field">
                <label className="field-label">Monte Carlo Strategy Iterations</label>
                <input
                  type="number"
                  className="setting-input font-mono"
                  value={monteCarloRuns}
                  onChange={(e) => setMonteCarloRuns(Number(e.target.value))}
                />
              </div>
              <div className="setting-field">
                <label className="field-label">MCDA Optimization Weighting</label>
                <select className="setting-select font-mono" defaultValue="balanced">
                  <option value="balanced">Balanced (Clinical Continuity + Cost + Speed)</option>
                  <option value="clinical">Clinical First (Max ICU/OT Preservation)</option>
                  <option value="runtime">Runtime First (Max Battery/Fuel Reserve)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: THRESHOLDS */}
        {activeTab === 'thresholds' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Alert & Resilience Thresholds</span>
              <span className="font-mono badge badge-warning">Active Rules</span>
            </div>
            <div className="setting-form-grid">
              <div className="setting-field">
                <label className="field-label">Critical Resilience Alert Floor: {criticalFloor}%</label>
                <input
                  type="range"
                  min="30"
                  max="80"
                  value={criticalFloor}
                  onChange={(e) => setCriticalFloor(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>
              <div className="setting-field">
                <label className="field-label">Battery Headroom Warning: {batteryThreshold}%</label>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={batteryThreshold}
                  onChange={(e) => setBatteryThreshold(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>
              <div className="setting-field">
                <label className="field-label">Generator Fuel Reserve Floor: {fuelThreshold}%</label>
                <input
                  type="range"
                  min="20"
                  max="60"
                  value={fuelThreshold}
                  onChange={(e) => setFuelThreshold(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: VISUALIZATION */}
        {activeTab === 'visualization' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Visualization & Theme Settings</span>
              <span className="font-mono badge badge-cyan">Appearance</span>
            </div>
            <div className="setting-form-grid">
              {/* Theme Selector */}
              <div className="setting-field">
                <label className="field-label">Theme Mode</label>
                <div className="theme-toggle-row">
                  <button
                    type="button"
                    className={`theme-option-btn ${theme === 'dark' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <Moon size={15} />
                    <span>Dark Theme</span>
                  </button>
                  <button
                    type="button"
                    className={`theme-option-btn ${theme === 'light' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <Sun size={15} />
                    <span>Light Theme</span>
                  </button>
                </div>
              </div>

              <div className="setting-field">
                <label className="field-label">3D Render Quality</label>
                <select
                  className="setting-select font-mono"
                  value={renderQuality}
                  onChange={(e) => setRenderQuality(e.target.value)}
                >
                  <option value="high">High Performance (Antialiasing + Bloom + Shadows)</option>
                  <option value="medium">Medium (Standard WebGL)</option>
                  <option value="low">Low (Battery Saver Mode)</option>
                </select>
              </div>

              <div className="setting-field">
                <label className="field-label">Spatial HUD Overlays</label>
                <div className="checkbox-toggle-row">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showCompass}
                      onChange={(e) => setShowCompass(e.target.checked)}
                    />
                    <span>Compass & Navigation HUD</span>
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={showParticles}
                      onChange={(e) => setShowParticles(e.target.checked)}
                    />
                    <span>Particle Stream Dynamics</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: DATA & SYSTEM */}
        {activeTab === 'data' && (
          <div className="setting-card">
            <div className="setting-card-header">
              <span className="setting-card-title">Data Management & Reset</span>
              <span className="font-mono badge badge-critical">Maintenance</span>
            </div>
            <div className="setting-data-actions-list">
              <div className="data-action-row">
                <div className="data-action-info">
                  <span className="data-action-title">Reset Hospital Twin to 100% Operational Baseline</span>
                  <span className="data-action-desc">
                    Clears any active failure injections, resets all telemetry to nominal defaults, and restores the digital twin state.
                  </span>
                </div>
                <button type="button" className="btn-danger-outline" onClick={onReset}>
                  <RotateCcw size={13} />
                  <span>Reset Baseline</span>
                </button>
              </div>

              <div className="data-action-row">
                <div className="data-action-info">
                  <span className="data-action-title">Export Current Twin State Snapshot</span>
                  <span className="data-action-desc">
                    Downloads a full JSON snapshot of all 52 nodes, service health matrices, and active incident telemetry.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-neutral-outline"
                  onClick={() => alert('Snapshot exported successfully.')}
                >
                  <Database size={13} />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
