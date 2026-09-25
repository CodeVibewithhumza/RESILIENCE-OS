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
  Check
} from 'lucide-react'
import './SettingsView.css'

export default function SettingsView({ onReset }) {
  const [activeTab, setActiveTab] = useState('model')
  const [themeMode, setThemeMode] = useState('dark')
  const [simSpeed, setSimSpeed] = useState(1)
  const [autoRotate3D, setAutoRotate3D] = useState(false)
  const [showLabels3D, setShowLabels3D] = useState(true)
  const [buildingOpacity, setBuildingOpacity] = useState(100)
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  const toggleTheme = (theme) => {
    setThemeMode(theme)
    if (theme === 'light') {
      document.body.classList.add('light-theme')
    } else {
      document.body.classList.remove('light-theme')
    }
  }

  return (
    <div className="settings-page">
      {/* Header Bar */}
      <div className="settings-header-row">
        <div>
          <h1 className="settings-page-title">System Settings & Model Configuration</h1>
          <p className="settings-page-subtitle">
            Configure hospital topology parameters, simulation thresholds, 3D visualization options, and theme preferences
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button className="settings-reset-btn" onClick={onReset}>
            <RotateCcw size={13} />
            <span>Reset All</span>
          </button>
          <button className="settings-save-btn" onClick={handleSave}>
            {isSaved ? (
              <>
                <Check size={14} style={{ color: '#10B981' }} />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Setting Navigation Tabs */}
      <div className="settings-tabs-bar">
        {[
          { id: 'model', label: 'Hospital Model & Topology', icon: Building },
          { id: 'simulation', label: 'Simulation & Delays', icon: Activity },
          { id: 'thresholds', label: 'Thresholds & State Rules', icon: ShieldAlert },
          { id: 'visualization', label: '3D View & Appearance', icon: SlidersHorizontal }
        ].map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              className={`setting-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={13} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      <div className="settings-panel-grid">
        {/* TAB 1: HOSPITAL MODEL */}
        {activeTab === 'model' && (
          <>
            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">Hospital Topology Model (BIM Campus)</span>
                <span className="badge badge-normal font-mono">v1.0 Standard</span>
              </div>
              <div className="setting-model-stats">
                <div className="stat-pill"><span className="stat-num font-mono">52</span> Assets Total</div>
                <div className="stat-pill"><span className="stat-num font-mono">6</span> Subsystems</div>
                <div className="stat-pill"><span className="stat-num font-mono">8</span> Critical Services</div>
                <div className="stat-pill"><span className="stat-num font-mono">112</span> Dependency Links</div>
              </div>
              <div className="setting-form-group">
                <label className="setting-label">Active Model Profile</label>
                <select className="setting-select font-mono">
                  <option>Metropolitan Acute Tertiary Hospital (500 Beds)</option>
                  <option>Regional Trauma & Emergency Medical Center</option>
                  <option>Specialized Surgical & ICU Cleanroom Clinic</option>
                </select>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">Infrastructure Redundancy Ratings</span>
                <span className="badge badge-outline font-mono">N+1 Topology</span>
              </div>
              <div className="redundancy-list">
                <div className="redundancy-row">
                  <span>Main 11kV Grid Feed</span>
                  <span className="badge badge-normal">Dual Redundant Feeds (T1 + T2)</span>
                </div>
                <div className="redundancy-row">
                  <span>Standby Diesel Generation</span>
                  <span className="badge badge-normal">2 Units (750kVA + 500kVA)</span>
                </div>
                <div className="redundancy-row">
                  <span>Static UPS Battery System</span>
                  <span className="badge badge-normal">2N Parallel Redundant</span>
                </div>
                <div className="redundancy-row">
                  <span>Cryogenic Oxygen Storage</span>
                  <span className="badge badge-normal">Primary LOX + Secondary Manifold</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: SIMULATION PARAMETERS */}
        {activeTab === 'simulation' && (
          <>
            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">Simulation Execution Speed & Step Dims</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>Real-Time Math</span>
              </div>
              <div className="setting-slider-group">
                <div className="slider-label-row">
                  <span>Simulation Speed Multiplier</span>
                  <span className="font-mono">{simSpeed}x Real-time</span>
                </div>
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

              <div className="setting-form-group">
                <label className="setting-label">Standby Generator Spool Delay</label>
                <select className="setting-select font-mono">
                  <option>10 seconds (Automated ATS Fast Crank)</option>
                  <option>30 seconds (Standard Warmup)</option>
                  <option>120 seconds (Cold Start Delay)</option>
                </select>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">Dynamic Telemetry Logging</span>
                <span className="badge badge-normal">Enabled</span>
              </div>
              <p className="setting-help-text">
                Continuous telemetry frames are buffered in memory and synchronized with the frontend WebSocket engine at 1-second intervals.
              </p>
            </div>
          </>
        )}

        {/* TAB 3: THRESHOLDS & RULES */}
        {activeTab === 'thresholds' && (
          <div className="setting-card full-col">
            <div className="setting-card-header">
              <span className="setting-card-title">Clinical State & Subsystem Risk Thresholds</span>
              <span className="badge badge-critical font-mono">Safety Limits</span>
            </div>
            <div className="thresholds-grid">
              <div className="threshold-box">
                <span className="thresh-title">Voltage Dip (Low PU)</span>
                <input type="text" defaultValue="0.85 pu (350V)" className="setting-input font-mono" />
                <span className="thresh-desc">Trips automatic transfer switch to UPS</span>
              </div>
              <div className="threshold-box">
                <span className="thresh-title">Transformer Load Alarm</span>
                <input type="text" defaultValue="90% Nominal" className="setting-input font-mono" />
                <span className="thresh-desc">Flags warning before thermal degradation</span>
              </div>
              <div className="threshold-box">
                <span className="thresh-title">Oxygen Pressure Critical</span>
                <input type="text" defaultValue="45.0 PSI" className="setting-input font-mono" />
                <span className="thresh-desc">Triggers ICU mechanical ventilator alarm</span>
              </div>
              <div className="threshold-box">
                <span className="thresh-title">UPS Battery Low Alert</span>
                <input type="text" defaultValue="20% Capacity" className="setting-input font-mono" />
                <span className="thresh-desc">Activates emergency load-shedding</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: VISUALIZATION & THEME */}
        {activeTab === 'visualization' && (
          <>
            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">Color Theme & Visual Interface</span>
                <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>UI Mode</span>
              </div>
              <div className="theme-toggle-row">
                <button
                  className={`theme-btn ${themeMode === 'dark' ? 'active' : ''}`}
                  onClick={() => toggleTheme('dark')}
                >
                  <Moon size={15} />
                  <span>Dark Command Center (Default)</span>
                </button>
                <button
                  className={`theme-btn ${themeMode === 'light' ? 'active' : ''}`}
                  onClick={() => toggleTheme('light')}
                >
                  <Sun size={15} />
                  <span>Light Medical Cleanroom</span>
                </button>
              </div>
            </div>

            <div className="setting-card">
              <div className="setting-card-header">
                <span className="setting-card-title">3D Digital Twin Canvas Options</span>
                <span className="badge badge-normal font-mono">WebGL R3F</span>
              </div>
              <div className="toggle-options-list">
                <label className="toggle-row">
                  <span>Show 3D Floating Smart HUD Labels</span>
                  <input
                    type="checkbox"
                    checked={showLabels3D}
                    onChange={(e) => setShowLabels3D(e.target.checked)}
                  />
                </label>
                <label className="toggle-row">
                  <span>Enable Cinematic Drone Auto-Rotation</span>
                  <input
                    type="checkbox"
                    checked={autoRotate3D}
                    onChange={(e) => setAutoRotate3D(e.target.checked)}
                  />
                </label>
                <div className="setting-slider-group" style={{ marginTop: '8px' }}>
                  <div className="slider-label-row">
                    <span>Building Slab Opacity</span>
                    <span className="font-mono">{buildingOpacity}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={buildingOpacity}
                    onChange={(e) => setBuildingOpacity(Number(e.target.value))}
                    className="setting-slider"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
