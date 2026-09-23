import { useState } from 'react'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import ResilienceCard from './components/ResilienceGauge/ResilienceCard'
import IncidentPanel from './components/IncidentControl/IncidentPanel'
import TimelineView from './components/IncidentControl/TimelineView'
import TwinContainer from './components/DigitalTwin3D/TwinContainer'
import CausalDrawer from './components/Explainability/CausalDrawer'
import StrategyMatrix from './components/StrategyLab/StrategyMatrix'
import AssetGrid from './components/AssetCatalog/AssetGrid'
import ServiceList from './components/ServiceStatus/ServiceList'
import Home from './components/Home/Home'
import {
  INITIAL_ASSETS,
  INITIAL_SERVICES,
  INITIAL_RESILIENCE,
  DISRUPTED_RESILIENCE,
  DISRUPTED_ASSETS,
  DISRUPTED_SERVICES,
  INITIAL_INCIDENT_STATE,
  ACTIVE_INCIDENT_STATE,
  CASCADE_TIMELINE,
  WHAT_IF_STRATEGIES,
  CAUSAL_EXPLANATION_DATA
} from './mock/hospitalInitialData'
import './components/IncidentControl/IncidentControl.css'
import './App.css'

/**
 * Resolves deterministic asset state for a given cascade checkpoint index.
 * Directly reuses canonical DISRUPTED_ASSETS fixture as the single source of truth for T+0,
 * and layers checkpoint milestone deltas defined in CASCADE_TIMELINE without duplicating base failure state.
 */
function getAssetsForCheckpoint(incidentActive, checkpointIdx = 0) {
  if (!incidentActive) return INITIAL_ASSETS
  if (checkpointIdx === 0) return DISRUPTED_ASSETS

  // Layer checkpoint milestones onto canonical DISRUPTED_ASSETS
  return DISRUPTED_ASSETS.map((asset) => {
    // T+5: GEN_01 finishes startup warmup and comes online
    if (asset.id === 'GEN_01') {
      return {
        ...asset,
        status: 'normal',
        current_load: 420.0,
        health_score: 96.0,
        fuel_level_pct: Math.max(0, 95.0 - checkpointIdx * 4)
      }
    }

    // T+10: Emergency Bus load reaches 92% capacity
    if (asset.id === 'EMERGENCY_BUS' && checkpointIdx >= 2) {
      return {
        ...asset,
        status: 'critical',
        available_capacity: 600.0,
        current_load: 550.0,
        health_score: 45.0
      }
    }

    // T+20: UPS battery bank exhausted
    if (asset.id === 'UPS_CRITICAL') {
      if (checkpointIdx >= 3) {
        return {
          ...asset,
          status: 'failed',
          battery_level_pct: 0.0,
          runtime_remaining_min: 0.0,
          health_score: 20.0,
          current_load: 0.0
        }
      }
      return {
        ...asset,
        runtime_remaining_min: Math.max(0, 35.0 - checkpointIdx * 10),
        battery_level_pct: Math.max(0, 78.0 - checkpointIdx * 25)
      }
    }

    return asset
  })
}

export default function App() {
  // Phase 1: Local state coordinator initialized from canonical mock schemas
  const [resilience, setResilience] = useState(INITIAL_RESILIENCE)
  const [assets, setAssets] = useState(INITIAL_ASSETS)
  const [services, setServices] = useState(INITIAL_SERVICES)
  const [incident, setIncident] = useState(INITIAL_INCIDENT_STATE)
  const [activeCheckpointIndex, setActiveCheckpointIndex] = useState(0)

  // Explainability drawer open/close state
  const [isExplainDrawerOpen, setIsExplainDrawerOpen] = useState(false)

  // Navigation state for sidebar active indicator
  const [activeSection, setActiveSection] = useState('overview')

  // Shared asset and service selection state
  const [selectedStrategyId, setSelectedStrategyId] = useState(null)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  // Deterministic failure injection: Switch to canonical disrupted mock state
  const handleTriggerGridFailure = () => {
    setIncident(ACTIVE_INCIDENT_STATE)
    setResilience(DISRUPTED_RESILIENCE)
    setAssets(DISRUPTED_ASSETS)
    setServices(DISRUPTED_SERVICES)
    setActiveCheckpointIndex(0)
  }

  // Step through deterministic cascade checkpoints (T+0 -> T+5 -> T+10 -> T+20)
  const handleNextCheckpoint = () => {
    const nextIdx = Math.min(activeCheckpointIndex + 1, CASCADE_TIMELINE.length - 1)
    setActiveCheckpointIndex(nextIdx)
    if (incident.is_active) {
      setAssets(getAssetsForCheckpoint(true, nextIdx))
    }
  }

  const handleSelectCheckpoint = (idx) => {
    setActiveCheckpointIndex(idx)
    if (incident.is_active) {
      setAssets(getAssetsForCheckpoint(true, idx))
    }
  }

  // Reset to 100% normal baseline
  const handleReset = () => {
    setIncident(INITIAL_INCIDENT_STATE)
    setResilience(INITIAL_RESILIENCE)
    setAssets(INITIAL_ASSETS)
    setServices(INITIAL_SERVICES)
    setActiveCheckpointIndex(0)
    setSelectedStrategyId(null)
    setSelectedAssetId(null)
    setSelectedServiceId(null)
    setIsExplainDrawerOpen(false)
  }

  const handleSelectAsset = (id) => {
    setSelectedAssetId((prev) => (prev === id ? null : id))
  }

  const handleSelectService = (id) => {
    setSelectedServiceId((prev) => (prev === id ? null : id))
  }



  const activeAlertsCount =
    (incident.is_active ? incident.affected_asset_ids?.length || 0 : 0) +
    services.filter((s) => s.at_risk).length

  return (
    <div className="dashboard-shell">
      {/* 1. Top Global Command Header */}
      <Header
        resilience={resilience}
        scenarioName={
          incident.is_active
            ? 'Catastrophic Main Grid Outage (Active Cascade)'
            : 'Baseline 100% Operational'
        }
        assetsCount={assets.length}
        servicesCount={services.length}
        alertsCount={activeAlertsCount}
        onReset={handleReset}
      />

      {/* 2. Workspace Body: Left Sidebar + Main Content */}
      <div className="dashboard-layout-body">
        {/* Left Persistent Command-Center Sidebar */}
        <Sidebar
          activeSection={activeSection}
          onNavigate={(sec) => setActiveSection(sec)}
          incidentActive={incident.is_active}
        />

        {/* Center Main Application Scroll View */}
        <main className="dashboard-main-content">
          {/* A. Premium Home / Overview Landing Screen */}
          <Home
            resilience={resilience}
            assets={assets}
            services={services}
            incident={incident}
            onNavigate={(sec) => setActiveSection(sec)}
            onSelectAsset={handleSelectAsset}
          />

          {/* B. DIGITAL TWIN + INCIDENT CONTROL (Two-Column Primary Focal Area) */}
          <section className="dashboard-section-block" id="digital-twin">
            <div className="section-title-row">
              <span className="section-title-tag">PRIMARY VISUALIZATION & CONTROL</span>
              <h2 className="section-main-heading">Digital Twin Topology & Incident Injection</h2>
            </div>

            <div className="twin-incident-split-grid">
              {/* Left Column: 3D Digital Twin */}
              <div className="twin-col">
                <TwinContainer
                  assets={assets}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={handleSelectAsset}
                />
              </div>

              {/* Right Column: Incident Injection & Control */}
              <div className="incident-col" id="incident-control">
                <IncidentPanel
                  incident={incident}
                  onTriggerFailure={handleTriggerGridFailure}
                  onReset={handleReset}
                  activeCheckpointIndex={activeCheckpointIndex}
                  onNextCheckpoint={handleNextCheckpoint}
                  onOpenExplainability={() => setIsExplainDrawerOpen(true)}
                />
              </div>
            </div>
          </section>

          {/* C. RESILIENCE + CASCADE (Two-Column Analytics Area) */}
          <section className="dashboard-section-block" id="resilience-cascade">
            <div className="section-title-row">
              <span className="section-title-tag">RESILIENCE ANALYTICS</span>
              <h2 className="section-main-heading">Resilience Index Synthesis & Cascade Timeline</h2>
            </div>

            <div className="resilience-cascade-split-grid">
              {/* Left Column: Composite Resilience Card with Circular SVG Gauge */}
              <div className="resilience-col">
                <ResilienceCard resilience={resilience} />
              </div>

              {/* Right Column: Cascade Timeline Stepper */}
              <div className="cascade-col">
                <TimelineView
                  timeline={CASCADE_TIMELINE}
                  isIncidentActive={incident.is_active}
                  activeCheckpointIndex={activeCheckpointIndex}
                  onSelectCheckpoint={handleSelectCheckpoint}
                />
              </div>
            </div>
          </section>

          {/* D. WHAT-IF STRATEGY LAB (Horizontal Overview & Matrix) */}
          <section className="dashboard-section-block" id="strategy-lab">
            <div className="section-title-row">
              <span className="section-title-tag">DECISION SUPPORT SYSTEM</span>
              <h2 className="section-main-heading">What-If Strategy Simulation Lab</h2>
            </div>

            <StrategyMatrix
              strategies={WHAT_IF_STRATEGIES}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={setSelectedStrategyId}
            />
          </section>

          {/* E. INFRASTRUCTURE ASSETS CATALOG (Categorized Monitoring) */}
          <section className="dashboard-section-block" id="assets">
            <div className="section-title-row">
              <span className="section-title-tag">INFRASTRUCTURE TELEMETRY</span>
              <h2 className="section-main-heading">Subsystem Asset Monitoring Catalog</h2>
            </div>

            <AssetGrid
              assets={assets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={handleSelectAsset}
            />
          </section>

          {/* F. HOSPITAL CRITICAL SERVICES (Clinical Unit Continuity) */}
          <section className="dashboard-section-block" id="services">
            <div className="section-title-row">
              <span className="section-title-tag">CLINICAL CONTINUITY</span>
              <h2 className="section-main-heading">Critical Care Services Impact</h2>
            </div>

            <ServiceList
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={handleSelectService}
            />
          </section>

          {/* Footer Bar */}
          <footer className="dashboard-footer">
            <div className="footer-left">
              <span className="footer-brand">RESILIENCE<span style={{ color: 'var(--accent-cyan)' }}>OS</span></span>
              <span className="footer-copy">Hospital Infrastructure Resilience Command & Decision Support System</span>
            </div>
            <div className="footer-right font-mono">
              <span>R3F 3D Engine: Online</span>
              <span className="footer-sep">•</span>
              <span>11 Canonical Nodes Synchronized</span>
            </div>
          </footer>
        </main>
      </div>

      {/* 3. Causal Explanation Drawer (Overlay when opened) */}
      <CausalDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        explanationData={CAUSAL_EXPLANATION_DATA}
      />
    </div>
  )
}
