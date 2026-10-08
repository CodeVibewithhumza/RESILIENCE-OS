import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import IncidentTimelineView from './components/IncidentControl/IncidentTimelineView'
import CausalDrawer from './components/Explainability/CausalDrawer'
import WhatIfView from './components/StrategyLab/WhatIfView'
import Home from './components/Home/Home'
import DigitalTwinView from './components/DigitalTwin3D/DigitalTwinView'
import RiskResilienceView from './components/RiskResilience/RiskResilienceView'
import ReportsView from './components/Reports/ReportsView'
import SettingsView from './components/Settings/SettingsView'
import StartSimulationView from './components/StartSimulation/StartSimulationView'
import Toast from './components/common/Toast'
import { useResilienceRealtime } from './hooks/useResilienceRealtime'
import { getApiBaseUrl } from './config/api'
import { getWhatIfAnalysis, injectFailure, applyStrategy } from './services/simulationApi'
import { getServiceExplanation } from './services/explainabilityApi'
import {
  INITIAL_ASSETS,
  INITIAL_SERVICES,
  INITIAL_RESILIENCE,
  INITIAL_INCIDENT_STATE,
  CASCADE_TIMELINE,
  WHAT_IF_STRATEGIES,
  INITIAL_TELEMETRY
} from './mock/hospitalInitialData'
import './components/IncidentControl/IncidentControl.css'
import './App.css'

function getStatusColor(label) {
  switch (label?.toUpperCase()) {
    case 'OPTIMAL':
    case 'NORMAL':
      return '#10B981'
    case 'DEGRADED':
    case 'WARNING':
      return '#F59E0B'
    case 'CRITICAL':
    case 'FAILED':
      return '#EF4444'
    default:
      return '#10B981'
  }
}

/**
 * Defensively maps recognized numeric telemetry readings onto matching assets,
 * preserving all asset metadata, structure, and unmonitored assets.
 */
function updateAssetsWithTelemetry(baseAssets, tel) {
  if (!tel || typeof tel !== 'object') return baseAssets

  return baseAssets.map((asset) => {
    switch (asset.id) {
      case 'GRID_MAIN': {
        const patch = {}
        if (typeof tel.grid_power_kw === 'number') {
          patch.current_load = tel.grid_power_kw
        }
        if (typeof tel.grid_voltage_v === 'number' || typeof tel.grid_frequency_hz === 'number') {
          patch.metadata = {
            ...asset.metadata,
            ...(typeof tel.grid_voltage_v === 'number' ? { voltage_v: tel.grid_voltage_v } : {}),
            ...(typeof tel.grid_frequency_hz === 'number' ? { frequency_hz: tel.grid_frequency_hz } : {})
          }
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'GEN_01': {
        const patch = {}
        if (typeof tel.generator_1_kw === 'number') {
          patch.current_load = tel.generator_1_kw
        }
        if (typeof tel.generator_1_fuel_pct === 'number') {
          patch.fuel_level_pct = tel.generator_1_fuel_pct
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'GEN_02': {
        const patch = {}
        if (typeof tel.generator_2_kw === 'number') {
          patch.current_load = tel.generator_2_kw
        }
        if (typeof tel.generator_2_fuel_pct === 'number') {
          patch.fuel_level_pct = tel.generator_2_fuel_pct
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'UPS_CRITICAL': {
        const patch = {}
        if (typeof tel.ups_load_kw === 'number') {
          patch.current_load = tel.ups_load_kw
        }
        if (typeof tel.ups_battery_pct === 'number') {
          patch.battery_level_pct = tel.ups_battery_pct
        }
        if (typeof tel.ups_estimated_runtime_min === 'number') {
          patch.runtime_remaining_min = tel.ups_estimated_runtime_min
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'CHILLER_PLANT': {
        const patch = {}
        if (typeof tel.chiller_cooling_output_kw === 'number') {
          patch.current_load = tel.chiller_cooling_output_kw
        }
        if (typeof tel.chiller_temp_c === 'number') {
          patch.temperature_c = tel.chiller_temp_c
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'OXYGEN_MANIFOLD': {
        const patch = {}
        if (typeof tel.oxygen_manifold_psi === 'number') {
          patch.pressure_psi = tel.oxygen_manifold_psi
        }
        if (typeof tel.oxygen_reserve_hours === 'number') {
          patch.runtime_remaining_min = tel.oxygen_reserve_hours * 60
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      case 'WATER_PUMP_STATION': {
        const patch = {}
        if (typeof tel.water_pump_pressure_psi === 'number') {
          patch.pressure_psi = tel.water_pump_pressure_psi
        }
        if (typeof tel.water_tank_level_pct === 'number') {
          patch.metadata = {
            ...asset.metadata,
            storage_tank_level_pct: tel.water_tank_level_pct
          }
        }
        return Object.keys(patch).length > 0 ? { ...asset, ...patch } : asset
      }

      default:
        return asset
    }
  })
}

/**
 * Resolves deterministic asset state for a given cascade checkpoint index.
 * Accurately models electrical, thermal, and mechanical dependency propagation across all 8 crisis scenarios.
 * When a mitigation strategy has been applied, reflects the stabilized/recovered physical state across all forward checkpoints.
 */
function getAssetsForCheckpoint(incident, timeline, checkpointIdx = 0, baseAssets = INITIAL_ASSETS) {
  if (!incident || !incident.is_active) return INITIAL_ASSETS

  const milestone = Array.isArray(timeline) && timeline[checkpointIdx]
    ? timeline[checkpointIdx]
    : null

  const affectedNodeIds = new Set(milestone?.affected_node_ids || [])
  const sourceAssetId = incident.source_asset_id
  const isHeatwave = Boolean(incident.compound_heatwave)
  const activeStrat = incident.active_mitigation_strategy

  return baseAssets.map((asset) => {
    // 1. The active incident's source failure node remains isolated/failed
    if (asset.id === sourceAssetId) {
      // If alternate feed or bypass strategy applied, source remains isolated while secondary feeds the hospital
      return {
        ...asset,
        status: 'failed',
        health_score: 0.0,
        available_capacity: 0.0,
        current_load: 0.0
      }
    }

    // --- STRATEGY-MITIGATED RECOVERY (If a strategy is active, physical assets stabilize) ---
    if (activeStrat) {
      if (asset.id === 'GEN_01') {
        return { ...asset, status: 'normal', health_score: 98.0, current_load: activeStrat === 'strat_a' ? 480.0 : 320.0 }
      }
      if (asset.id === 'GEN_02') {
        return { ...asset, status: activeStrat === 'strat_b' || activeStrat === 'strat_f' ? 'normal' : 'standby', health_score: 100.0, current_load: activeStrat === 'strat_b' ? 400.0 : 0.0 }
      }
      if (asset.id === 'TRANSFORMER_02') {
        return { ...asset, status: 'normal', health_score: 100.0, current_load: activeStrat === 'strat_c' ? 380.0 : 320.0 }
      }
      if (asset.id === 'EMERGENCY_BUS') {
        return { ...asset, status: 'normal', health_score: 100.0, available_capacity: 600.0 }
      }
      if (asset.id === 'MAIN_BUS') {
        return { ...asset, status: 'normal', health_score: 95.0, available_capacity: 500.0 }
      }
      if (asset.id === 'UPS_CRITICAL') {
        return { ...asset, status: 'normal', health_score: 95.0, battery_level_pct: 95, current_load: 220.0 }
      }
      if (asset.id === 'CHILLER_PLANT') {
        return { ...asset, status: 'normal', health_score: 95.0, temperature_c: 7.2, current_load: 180.0 }
      }
      if (asset.id === 'WATER_PUMP_STATION') {
        return { ...asset, status: 'normal', health_score: 98.0, pressure_psi: 60.0 }
      }
      if (asset.id === 'OXYGEN_MANIFOLD') {
        return { ...asset, status: 'normal', health_score: 100.0, pressure_psi: 55.0 }
      }
      return { ...asset, status: 'normal', health_score: 100.0 }
    }

    // --- UNMITIGATED CASCADE: SCENARIO 1 & 8: GRID OUTAGE / COMPOUND HEATWAVE ---
    if (sourceAssetId === 'GRID_MAIN') {
      if (asset.id === 'TRANSFORMER_01' || asset.id === 'TRANSFORMER_02') {
        return { ...asset, status: 'failed', health_score: 0.0, current_load: 0.0, available_capacity: 0.0 }
      }
      if (asset.id === 'MAIN_BUS') {
        return { ...asset, status: 'degraded', health_score: 10.0, current_load: 0.0, available_capacity: 0.0 }
      }
      if (asset.id === 'GEN_01') {
        if (isHeatwave) {
          return { ...asset, status: 'failed', health_score: 0.0, current_load: 0.0 }
        }
        const isStarting = checkpointIdx === 0
        return {
          ...asset,
          status: isStarting ? 'starting' : 'normal',
          health_score: isStarting ? 100.0 : 95.0,
          current_load: isStarting ? 0.0 : 320.0
        }
      }
      if (asset.id === 'UPS_CRITICAL') {
        const batPct = isHeatwave
          ? (checkpointIdx === 0 ? 90 : checkpointIdx === 1 ? 50 : checkpointIdx === 2 ? 15 : 0)
          : (checkpointIdx === 0 ? 95 : checkpointIdx === 1 ? 82 : checkpointIdx === 2 ? 55 : 15)
        const isCrit = batPct < 20
        return {
          ...asset,
          status: isCrit ? 'critical' : 'normal',
          health_score: batPct,
          battery_level_pct: batPct,
          current_load: 220.0
        }
      }
      if (asset.id === 'CHILLER_PLANT') {
        const health = isHeatwave ? 0.0 : (checkpointIdx === 0 ? 50.0 : checkpointIdx === 1 ? 45.0 : checkpointIdx === 2 ? 35.0 : 20.0)
        return {
          ...asset,
          status: isHeatwave || checkpointIdx >= 3 ? 'critical' : 'degraded',
          health_score: health,
          current_load: isHeatwave ? 0.0 : 120.0
        }
      }
      if (asset.id === 'WATER_PUMP_STATION') {
        return { ...asset, status: isHeatwave ? 'degraded' : 'normal', health_score: isHeatwave ? 40.0 : 100.0 }
      }
      if (asset.id === 'OXYGEN_MANIFOLD') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
    }

    // --- SCENARIO 2: TRANSFORMER 1 TRIP ---
    if (sourceAssetId === 'TRANSFORMER_01') {
      if (asset.id === 'GRID_MAIN') return { ...asset, status: 'normal', health_score: 100.0, current_load: 350.0 }
      if (asset.id === 'TRANSFORMER_02') return { ...asset, status: 'normal', health_score: 100.0, current_load: 320.0 }
      if (asset.id === 'MAIN_BUS') return { ...asset, status: 'degraded', health_score: 30.0, current_load: 0.0, available_capacity: 0.0 }
      if (asset.id === 'EMERGENCY_BUS') return { ...asset, status: 'normal', health_score: 90.0 }
      if (asset.id === 'GEN_01') return { ...asset, status: checkpointIdx === 0 ? 'starting' : 'normal', health_score: 95.0, current_load: 320.0 }
      if (asset.id === 'UPS_CRITICAL') return { ...asset, status: 'normal', battery_level_pct: 95, current_load: 220.0 }
      if (asset.id === 'CHILLER_PLANT') return { ...asset, status: 'degraded', health_score: 50.0, current_load: 120.0 }
    }

    // --- SCENARIO 3: GENERATOR FAILURE ---
    if (sourceAssetId === 'GEN_01' || sourceAssetId === 'GEN_02') {
      if (asset.id === 'GEN_02' && sourceAssetId === 'GEN_01') {
        return { ...asset, status: checkpointIdx > 0 ? 'starting' : 'offline', health_score: 100.0 }
      }
      if (asset.id === 'GRID_MAIN' || asset.id === 'TRANSFORMER_01' || asset.id === 'TRANSFORMER_02') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
      if (asset.id === 'UPS_CRITICAL') {
        return { ...asset, status: 'normal', health_score: 95.0, battery_level_pct: 95 }
      }
    }

    // --- SCENARIO 4: UPS BATTERY DEPLETION ---
    if (sourceAssetId === 'UPS_CRITICAL') {
      if (asset.id === 'EMERGENCY_BUS') {
        return { ...asset, status: 'degraded', health_score: 60.0 }
      }
      if (asset.id === 'GRID_MAIN' || asset.id === 'TRANSFORMER_01' || asset.id === 'TRANSFORMER_02') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
    }

    // --- SCENARIO 5: CHILLER THERMAL TRIP ---
    if (sourceAssetId === 'CHILLER_PLANT') {
      const temps = [12.0, 24.5, 28.0, 34.0]
      if (asset.id === 'CHILLER_PLANT') {
        return { ...asset, status: 'failed', health_score: 0.0, current_load: 0.0, temperature_c: temps[Math.min(checkpointIdx, 3)] }
      }
      if (asset.id !== 'CHILLER_PLANT') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
    }

    // --- SCENARIO 6: CRYOGENIC O2 PIPELINE RUPTURE ---
    if (sourceAssetId === 'OXYGEN_MANIFOLD') {
      const pressures = [18.0, 8.0, 2.0, 0.0]
      if (asset.id === 'OXYGEN_MANIFOLD') {
        return { ...asset, status: 'failed', health_score: 0.0, pressure_psi: pressures[Math.min(checkpointIdx, 3)] }
      }
      if (asset.id !== 'OXYGEN_MANIFOLD') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
    }

    // --- SCENARIO 7: WATER PUMP CAVITATION / TANK CONTAMINATION ---
    if (sourceAssetId === 'WATER_PUMP_STATION') {
      const pressures = [8.0, 4.0, 0.0, 0.0]
      if (asset.id === 'WATER_PUMP_STATION') {
        return { ...asset, status: 'failed', health_score: 0.0, pressure_psi: pressures[Math.min(checkpointIdx, 3)] }
      }
      if (asset.id !== 'WATER_PUMP_STATION') {
        return { ...asset, status: 'normal', health_score: 100.0 }
      }
    }

    // Generic fallback for affected nodes
    if (affectedNodeIds.has(asset.id)) {
      return {
        ...asset,
        status: checkpointIdx >= 3 ? 'critical' : 'degraded',
        health_score: checkpointIdx >= 3 ? 35.0 : 50.0
      }
    }

    return {
      ...asset,
      status: 'normal',
      health_score: typeof asset.health_score === 'number' && asset.health_score > 70
        ? asset.health_score
        : 100.0
    }
  })
}

/**
 * Resolves tiered, priority-weighted clinical service continuity across checkpoints.
 * Accurately models specific physical dependencies for each failure scenario.
 * When a mitigation strategy is applied, protects all clinical services at full operation across the timeline.
 */
function getServicesForCheckpoint(incident, timeline, checkpointIdx = 0, baseServices = INITIAL_SERVICES) {
  if (!incident || !incident.is_active) return INITIAL_SERVICES

  const milestone = Array.isArray(timeline) && timeline[checkpointIdx]
    ? timeline[checkpointIdx]
    : null

  const sourceAssetId = incident.source_asset_id
  const isHeatwave = Boolean(incident.compound_heatwave)
  const activeStrat = incident.active_mitigation_strategy
  const idx = Math.min(checkpointIdx, 3)

  // If a strategy is active, clinical continuity is sustained across all forward checkpoints!
  if (activeStrat) {
    const isShed = activeStrat === 'strat_b'
    return baseServices.map((svc) => {
      if (svc.id === 'SERVICE_ICU') {
        return { ...svc, status: 'full_operation', at_risk: false, service_continuity_pct: 100.0, risk_reason: 'Mitigated: 100% ICU life-support secured' }
      }
      if (svc.id === 'SERVICE_ER') {
        return { ...svc, status: 'full_operation', at_risk: false, service_continuity_pct: 100.0, risk_reason: 'Mitigated: Trauma & emergency admissions protected' }
      }
      if (svc.id === 'SERVICE_OT') {
        return { ...svc, status: 'full_operation', at_risk: false, service_continuity_pct: isShed ? 85.0 : 98.0, risk_reason: 'Mitigated: Operating theatre sterile HVAC powered' }
      }
      if (svc.id === 'SERVICE_WARD') {
        return { ...svc, status: 'full_operation', at_risk: false, service_continuity_pct: isShed ? 60.0 : 85.0, risk_reason: 'Mitigated: Inpatient care stabilized' }
      }
      if (svc.id === 'SERVICE_ADMIN') {
        return { ...svc, status: isShed ? 'reduced_capacity' : 'full_operation', at_risk: false, service_continuity_pct: isShed ? 10.0 : 75.0, risk_reason: isShed ? 'Non-critical admin load shed' : 'Nominal' }
      }
      return { ...svc, status: 'full_operation', at_risk: false, service_continuity_pct: 100.0, risk_reason: null }
    })
  }

  // Dynamic service degradation curves tailored to each specific scenario
  let CURVES = {
    // Electrical Outages (Grid Outage, Transformer Trip)
    SERVICE_ICU: [95.0, 88.0, 70.0, 35.0],
    SERVICE_OT: [85.0, 75.0, 52.0, 28.0],
    SERVICE_ER: [90.0, 85.0, 70.0, 45.0],
    SERVICE_WARD: [40.0, 30.0, 20.0, 15.0],
    SERVICE_ADMIN: [10.0, 10.0, 5.0, 0.0]
  }

  if (isHeatwave) {
    CURVES = {
      SERVICE_ICU: [90.0, 60.0, 20.0, 0.0],
      SERVICE_OT: [70.0, 35.0, 10.0, 0.0],
      SERVICE_ER: [80.0, 50.0, 15.0, 0.0],
      SERVICE_WARD: [20.0, 10.0, 0.0, 0.0],
      SERVICE_ADMIN: [0.0, 0.0, 0.0, 0.0]
    }
  } else if (sourceAssetId === 'GEN_01' || sourceAssetId === 'GEN_02') {
    CURVES = {
      SERVICE_ICU: [85.0, 80.0, 65.0, 25.0],
      SERVICE_OT: [75.0, 65.0, 48.0, 20.0],
      SERVICE_ER: [85.0, 80.0, 65.0, 30.0],
      SERVICE_WARD: [80.0, 75.0, 60.0, 40.0],
      SERVICE_ADMIN: [85.0, 80.0, 70.0, 50.0]
    }
  } else if (sourceAssetId === 'UPS_CRITICAL') {
    CURVES = {
      SERVICE_ICU: [50.0, 45.0, 35.0, 20.0],
      SERVICE_OT: [45.0, 40.0, 30.0, 18.0],
      SERVICE_ER: [65.0, 55.0, 45.0, 30.0],
      SERVICE_WARD: [90.0, 85.0, 80.0, 70.0],
      SERVICE_ADMIN: [95.0, 90.0, 85.0, 80.0]
    }
  } else if (sourceAssetId === 'CHILLER_PLANT') {
    CURVES = {
      SERVICE_OT: [45.0, 32.0, 20.0, 10.0],
      SERVICE_ICU: [65.0, 52.0, 38.0, 20.0],
      SERVICE_WARD: [60.0, 50.0, 35.0, 18.0],
      SERVICE_ER: [75.0, 65.0, 48.0, 30.0],
      SERVICE_ADMIN: [80.0, 70.0, 60.0, 40.0]
    }
  } else if (sourceAssetId === 'OXYGEN_MANIFOLD') {
    CURVES = {
      SERVICE_ICU: [30.0, 22.0, 12.0, 5.0],
      SERVICE_OT: [35.0, 25.0, 15.0, 5.0],
      SERVICE_ER: [50.0, 38.0, 22.0, 10.0],
      SERVICE_WARD: [80.0, 70.0, 55.0, 40.0],
      SERVICE_ADMIN: [100.0, 100.0, 100.0, 100.0]
    }
  } else if (sourceAssetId === 'WATER_PUMP_STATION') {
    CURVES = {
      SERVICE_OT: [35.0, 25.0, 15.0, 10.0],
      SERVICE_ICU: [50.0, 40.0, 30.0, 15.0],
      SERVICE_WARD: [30.0, 20.0, 10.0, 5.0],
      SERVICE_ER: [60.0, 48.0, 35.0, 20.0],
      SERVICE_ADMIN: [20.0, 10.0, 5.0, 0.0]
    }
  }

  return baseServices.map((svc) => {
    if (CURVES[svc.id]) {
      const continuity = CURVES[svc.id][idx]
      const isCritical = continuity < 40
      return {
        ...svc,
        status: isCritical ? 'compromised' : continuity < 90 ? 'reduced_capacity' : 'full_operation',
        at_risk: continuity < 90,
        service_continuity_pct: continuity,
        risk_reason: milestone?.service_impact_summary || (
          svc.id === 'SERVICE_ICU' ? 'Clinical buffering on secondary reserves' :
          svc.id === 'SERVICE_OT' ? 'Surgical sterility & environmental constraint' :
          svc.id === 'SERVICE_WARD' ? 'Inpatient distribution degraded' :
          'Loss of upstream infrastructure header'
        )
      }
    }

    return {
      ...svc,
      status: 'full_operation',
      at_risk: false,
      service_continuity_pct: 100.0,
      risk_reason: null
    }
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

  // Phase 4: Toast feedback notification & reset operation state
  const [toast, setToast] = useState(null)
  const [isResetting, setIsResetting] = useState(false)

  const showToast = useCallback((message, type = 'info') => {
    setToast({ id: Date.now(), message, type })
  }, [])

  const hideToast = useCallback(() => {
    setToast(null)
  }, [])

  // Theme state: dark / light with persistence
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('resilience_theme') || 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('resilience_theme', theme)
  }, [theme])

  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }, [])

  // Navigation state for sidebar active indicator (dashboard, digital-twin, start-simulation, what-if, incident-timeline, risk-resilience, reports, settings)
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('resilience_sidebar_width')
      if (saved) {
        const val = parseInt(saved, 10)
        if (!isNaN(val) && val >= 130 && val <= 500) return val
      }
    } catch {}
    return 240
  })

  const handleResizeSidebarWidth = useCallback((newWidth) => {
    if (newWidth <= 75) {
      setSidebarCollapsed(true)
    } else {
      setSidebarCollapsed(false)
      setSidebarWidth(newWidth)
      try {
        localStorage.setItem('resilience_sidebar_width', String(newWidth))
      } catch {}
    }
  }, [])

  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const mainContentRef = useRef(null)

  // Keyboard shortcut Ctrl+B or Cmd+B to toggle sidebar collapse
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key?.toLowerCase() === 'b') {
        e.preventDefault()
        setSidebarCollapsed((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Auto-close mobile navigation drawer on section change or large viewport resize
  useEffect(() => {
    setMobileNavOpen(false)
  }, [activeSection])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileNavOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Scroll to top of main viewport when switching pages
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [activeSection])

  // Shared asset and service selection state
  const [selectedStrategyId, setSelectedStrategyId] = useState(null)
  const [selectedAssetId, setSelectedAssetId] = useState(null)
  const [selectedServiceId, setSelectedServiceId] = useState(null)

  // Phase 3: Canonical What-If Simulation State from backend MCDA engine
  const [whatIfData, setWhatIfData] = useState(null)
  const [whatIfLoading, setWhatIfLoading] = useState(false)
  const [whatIfError, setWhatIfError] = useState(null)

  // Phase 4D: Live Explainability State
  const [liveExplanations, setLiveExplanations] = useState({})
  const [isLoadingExplanations, setIsLoadingExplanations] = useState(false)
  const [explanationsError, setExplanationsError] = useState(null)

  // Fetch live causal explanations from backend for active incident
  const fetchExplanationsForIncident = useCallback(async (sourceAsset, affectedServices) => {
    if (!sourceAsset) {
      setLiveExplanations({})
      setExplanationsError(null)
      return
    }

    setIsLoadingExplanations(true)
    setExplanationsError(null)
    // Clear previous incident explanations immediately so old paths never linger
    setLiveExplanations({})

    const targets = affectedServices && affectedServices.length > 0
      ? affectedServices
      : ['SERVICE_ICU', 'SERVICE_OT']

    try {
      const results = await Promise.all(
        targets.map((sid) => getServiceExplanation(sid, sourceAsset))
      )

      const newExplanations = {}
      let hasSuccess = false
      results.forEach((res) => {
        if (res.success && res.data?.service_id) {
          newExplanations[res.data.service_id] = res.data
          hasSuccess = true
        }
      })

      if (hasSuccess) {
        setLiveExplanations(newExplanations)
        setExplanationsError(null)
      } else {
        setExplanationsError('Unable to load causal explanations for affected services.')
      }
    } catch (err) {
      setExplanationsError(err?.message || 'Error loading causal explanations.')
    } finally {
      setIsLoadingExplanations(false)
    }
  }, [])

  // Auto-fetch/clear explanations when active incident changes
  useEffect(() => {
    if (incident.is_active && incident.source_asset_id) {
      fetchExplanationsForIncident(incident.source_asset_id, incident.affected_service_ids)
    } else {
      setLiveExplanations({})
      setExplanationsError(null)
    }
  }, [
    incident.is_active,
    incident.source_asset_id,
    incident.incident_id,
    incident.affected_service_ids,
    fetchExplanationsForIncident
  ])

  // Open explainability drawer and ensure current incident explanations are loaded
  const handleOpenExplainability = useCallback(() => {
    setIsExplainDrawerOpen(true)
    if (incident.is_active && incident.source_asset_id) {
      if (Object.keys(liveExplanations).length === 0 && !isLoadingExplanations) {
        fetchExplanationsForIncident(incident.source_asset_id, incident.affected_service_ids)
      }
    }
  }, [
    incident.is_active,
    incident.source_asset_id,
    incident.affected_service_ids,
    liveExplanations,
    isLoadingExplanations,
    fetchExplanationsForIncident
  ])

  // Controlled fetch of What-If Simulation Analysis
  const fetchWhatIfAnalysis = useCallback(async () => {
    setWhatIfLoading(true)
    setWhatIfError(null)
    try {
      const res = await getWhatIfAnalysis()
      if (res.success && res.data) {
        setWhatIfData(res.data)
        setWhatIfError(null)
      } else {
        setWhatIfError(res.error || 'Failed to fetch What-If simulation')
      }
    } catch (err) {
      setWhatIfError(err?.message || 'Network error fetching What-If simulation')
    } finally {
      setWhatIfLoading(false)
    }
  }, [])

  // Reset to 100% normal baseline
  const handleReset = useCallback(async () => {
    if (isResetting) return
    setIsResetting(true)

    setIncident(INITIAL_INCIDENT_STATE)
    setResilience(INITIAL_RESILIENCE)
    setAssets(INITIAL_ASSETS)
    setServices(INITIAL_SERVICES)
    setActiveCheckpointIndex(0)
    setSelectedStrategyId(null)
    setSelectedAssetId(null)
    setSelectedServiceId(null)
    setLiveExplanations({})
    setExplanationsError(null)
    setIsExplainDrawerOpen(false)

    try {
      const baseUrl = getApiBaseUrl()
      await fetch(`${baseUrl}/api/hospital/reset`, { method: 'POST' }).catch(() => {})
    } catch {
      // Offline fallback
    }

    showToast('Hospital digital twin restored to 100% operational baseline', 'success')

    setTimeout(() => {
      fetchWhatIfAnalysis()
      setIsResetting(false)
    }, 250)
  }, [isResetting, showToast, fetchWhatIfAnalysis])

  // Event callback: Synchronize incoming real-time telemetry and resilience score
  const handleTelemetryTick = useCallback(({ telemetry: tel, resilienceScore: score, statusLabel: label, deltaFromBaseline: delta, subScores }) => {
    if (typeof score === 'number') {
      setResilience((prev) => {
        const lbl = label || prev.status_label || 'OPTIMAL'
        const color = getStatusColor(lbl)
        // Prefer backend-provided delta_from_baseline; do not fabricate frontend baseline
        const effectiveDelta = typeof delta === 'number'
          ? delta
          : prev.delta_from_baseline
        return {
          ...prev,
          overall_score: score,
          status_label: lbl,
          status_color: color,
          delta_from_baseline: effectiveDelta,
          ...(subScores ? { sub_scores: subScores } : {})
        }
      })
    }

    if (tel) {
      setAssets((prev) => updateAssetsWithTelemetry(prev, tel))
    }
  }, [])

  // Event callback: Process live digital twin state events (failure_injected, asset_state_changed, service_health_changed, cascade_triggered, reset, strategy)
  const handleTwinEvent = useCallback((event) => {
    if (!event) return
    const { type, payload = {} } = event

    if (type === 'failure_injected') {
      const inc = payload.incident || {}
      const sourceAssetId = payload.asset_id || payload.target_node_id || inc.source_asset_id || 'GRID_MAIN'
      const failureType = payload.failure_type || inc.failure_type || 'complete_outage'
      const severity = payload.severity || inc.severity || 'high'

      setIncident((prev) => ({
        ...prev,
        is_active: true,
        source_asset_id: sourceAssetId,
        incident_id: payload.incident_id || inc.incident_id || prev.incident_id || 'INC-LIVE-01',
        failure_type: failureType,
        severity: severity,
        affected_asset_ids: Array.isArray(inc.affected_asset_ids) && inc.affected_asset_ids.length > 0
          ? inc.affected_asset_ids
          : [sourceAssetId],
        affected_service_ids: Array.isArray(inc.affected_service_ids)
          ? inc.affected_service_ids
          : (prev.affected_service_ids || []),
        timeline: Array.isArray(inc.timeline) && inc.timeline.length > 0
          ? inc.timeline
          : prev.timeline,
        current_time_offset_min: typeof inc.current_time_offset_min === 'number'
          ? inc.current_time_offset_min
          : 0,
        estimated_unmitigated_blackout_min: typeof inc.estimated_unmitigated_blackout_min === 'number'
          ? inc.estimated_unmitigated_blackout_min
          : 20.0
      }))

      // Update source asset matching payload.asset_id to failed
      setAssets((prev) =>
        prev.map((asset) => {
          if (asset.id === sourceAssetId) {
            return {
              ...asset,
              status: 'failed',
              health_score: 0.0,
              available_capacity: 0.0
            }
          }
          return asset
        })
      )

      // Refresh What-If analysis for live failure
      fetchWhatIfAnalysis()
    } else if (type === 'asset_state_changed') {
      const targetId = payload.asset_id || payload.target_node_id || event.target_node_id
      const newStatus = payload.new_status
      if (targetId && newStatus) {
        setAssets((prev) =>
          prev.map((asset) => {
            if (asset.id === targetId) {
              const patch = { status: newStatus }
              if (newStatus === 'failed') {
                patch.health_score = 0.0
                patch.available_capacity = 0.0
              } else if (newStatus === 'normal') {
                patch.health_score = 100.0
              } else if (newStatus === 'degraded' && (asset.health_score == null || asset.health_score > 60)) {
                patch.health_score = 50.0
              }
              return { ...asset, ...patch }
            }
            return asset
          })
        )
      }
    } else if (type === 'service_health_changed') {
      const serviceId = payload.service_id || payload.target_node_id || event.target_node_id
      if (serviceId) {
        setServices((prev) =>
          prev.map((service) => {
            if (service.id === serviceId) {
              return {
                ...service,
                ...(payload.status ? { status: payload.status } : {}),
                ...(typeof payload.service_continuity_pct === 'number' ? { service_continuity_pct: payload.service_continuity_pct } : {}),
                ...(typeof payload.at_risk === 'boolean' ? { at_risk: payload.at_risk } : {}),
                ...(payload.risk_reason !== undefined ? { risk_reason: payload.risk_reason } : {})
              }
            }
            return service
          })
        )
      }
    } else if (type === 'cascade_triggered') {
      if (payload.cascade_path || payload.timeline) {
        setIncident((prev) => ({
          ...prev,
          ...(payload.cascade_path ? { cascade_path: payload.cascade_path } : {}),
          ...(Array.isArray(payload.timeline) && payload.timeline.length > 0 ? { timeline: payload.timeline } : {})
        }))
      }
    } else if (type === 'what_if_simulation_completed' || type === 'strategy_applied') {
      fetchWhatIfAnalysis()
    } else if (type === 'hospital_reset') {
      handleReset()
    }
  }, [handleReset, fetchWhatIfAnalysis])

  // Real-time canonical WebSocket connection layer
  const {
    telemetry,
    resilienceScore,
    statusLabel,
    connectionStatus,
    lastUpdated,
    latestTwinEvent,
    reconnect,
    isLive
  } = useResilienceRealtime({
    onTelemetryTick: handleTelemetryTick,
    onTwinEvent: handleTwinEvent
  })

  // Initial / Reconnect Hydration from backend authoritative state
  const hasHydratedRef = useRef(false)

  // Reusable authoritative state hydration from backend
  const fetchHospitalState = useCallback(async () => {
    try {
      const baseUrl = getApiBaseUrl()
      const res = await fetch(`${baseUrl}/api/hospital/state`)
      if (!res.ok) return
      const data = await res.json()
      if (!data) return

      // 1. Unconditionally sync authoritative Resilience Index from backend
      if (data.resilience_index) {
        setResilience((prev) => ({
          ...prev,
          overall_score: typeof data.resilience_index.overall_score === 'number'
            ? data.resilience_index.overall_score
            : prev.overall_score,
          status_label: data.resilience_index.status_label || prev.status_label,
          status_color: data.resilience_index.status_color || prev.status_color,
          delta_from_baseline: typeof data.resilience_index.delta_from_baseline === 'number'
            ? data.resilience_index.delta_from_baseline
            : prev.delta_from_baseline,
          sub_scores: data.resilience_index.sub_scores || prev.sub_scores
        }))
      }

      // 2. Unconditionally sync telemetry onto assets
      if (data.telemetry) {
        setAssets((prev) => updateAssetsWithTelemetry(prev, data.telemetry))
      }

      // 3. Unconditionally fetch and synchronize live assets and services from backend
      try {
        const [assetsRes, servicesRes] = await Promise.all([
          fetch(`${baseUrl}/api/assets`),
          fetch(`${baseUrl}/api/services`)
        ])

        if (assetsRes.ok) {
          const liveAssets = await assetsRes.json()
          if (Array.isArray(liveAssets) && liveAssets.length > 0) {
            const liveMap = new Map(liveAssets.map((a) => [a.id, a]))
            setAssets((prev) =>
              prev.map((asset) => {
                const live = liveMap.get(asset.id)
                if (live) {
                  return {
                    ...asset,
                    status: live.status || asset.status,
                    health_score: typeof live.health_score === 'number' ? live.health_score : asset.health_score,
                    current_load: typeof live.current_load === 'number' ? live.current_load : asset.current_load,
                    available_capacity: typeof live.available_capacity === 'number' ? live.available_capacity : asset.available_capacity
                  }
                }
                return asset
              })
            )
          }
        }

        if (servicesRes.ok) {
          const liveServices = await servicesRes.json()
          if (Array.isArray(liveServices) && liveServices.length > 0) {
            const liveSvcMap = new Map(liveServices.map((s) => [s.id, s]))
            setServices((prev) =>
              prev.map((svc) => {
                const live = liveSvcMap.get(svc.id)
                if (live) {
                  return {
                    ...svc,
                    status: live.status || svc.status,
                    service_continuity_pct: typeof live.service_continuity_pct === 'number' ? live.service_continuity_pct : svc.service_continuity_pct,
                    at_risk: typeof live.at_risk === 'boolean' ? live.at_risk : svc.at_risk,
                    risk_reason: live.risk_reason !== undefined ? live.risk_reason : svc.risk_reason
                  }
                }
                return svc
              })
            )
          }
        }
      } catch {
        // Handled defensively
      }

      // 4. Synchronize incident state
      if (data.is_incident_active && data.active_incident) {
        const inc = data.active_incident
        const sourceAssetId = inc.source_asset_id || 'GRID_MAIN'

        setIncident((prev) => ({
          ...prev,
          is_active: true,
          source_asset_id: sourceAssetId,
          incident_id: inc.incident_id || prev.incident_id || 'INC-LIVE-01',
          failure_type: inc.failure_type || 'complete_outage',
          severity: inc.severity || 'high',
          affected_asset_ids: Array.isArray(inc.affected_asset_ids) && inc.affected_asset_ids.length > 0
            ? inc.affected_asset_ids
            : prev.affected_asset_ids,
          affected_service_ids: Array.isArray(inc.affected_service_ids) && inc.affected_service_ids.length > 0
            ? inc.affected_service_ids
            : prev.affected_service_ids,
          timeline: Array.isArray(inc.timeline) && inc.timeline.length > 0
            ? inc.timeline
            : prev.timeline,
          current_time_offset_min: inc.current_time_offset_min || 0,
          estimated_unmitigated_blackout_min: inc.estimated_unmitigated_blackout_min || 20.0
        }))
      } else if (!data.is_incident_active) {
        setIncident((prev) => ({
          ...prev,
          is_active: false
        }))
      }
    } catch {
      // Fallback to existing mock state on error
    }
  }, [])

  useEffect(() => {
    if (!isLive) {
      hasHydratedRef.current = false
      return
    }

    if (hasHydratedRef.current) return
    hasHydratedRef.current = true

    fetchHospitalState()
  }, [isLive, fetchHospitalState])

  // Active backend incident timeline is used when available; when a strategy is applied, provides the mitigated progression
  const effectiveTimeline = useMemo(() => {
    if (!incident?.is_active) return CASCADE_TIMELINE
    const activeStrat = incident.active_mitigation_strategy
    if (!activeStrat) {
      return incident?.timeline && incident.timeline.length > 0
        ? incident.timeline
        : CASCADE_TIMELINE
    }

    const stratCode = (activeStrat.replace('strat_', '').toUpperCase()) || 'C'
    return [
      {
        t_offset_min: 0,
        title: `T+0 min: Strategy ${stratCode} Dispatched`,
        description: `Automated response protocols activated. Initial fault isolation and emergency failover engaged.`,
        affected_node_ids: [incident.source_asset_id],
        service_impact_summary: 'Critical ICU and Emergency circuits protected.',
        system_resilience_score: 86.0
      },
      {
        t_offset_min: 5,
        title: `T+5 min: Secondary Circuits Synchronized`,
        description: `Alternative feeds and backup generation stabilized. Non-critical loads rebalanced.`,
        affected_node_ids: [incident.source_asset_id],
        service_impact_summary: 'Full ICU & Surgical OT continuity sustained at 100%.',
        system_resilience_score: 92.0
      },
      {
        t_offset_min: 10,
        title: `T+10 min: Sustained Operational Redundancy`,
        description: `Facility operating under stable containment. Continuous backup runtime verified.`,
        affected_node_ids: [],
        service_impact_summary: 'Zero clinical disruption across all acute departments.',
        system_resilience_score: 94.0
      },
      {
        t_offset_min: 20,
        title: `T+20 min: Hospital Baseline Recovery Verified`,
        description: `All primary and auxiliary life-safety envelopes operating in optimal resilience mode.`,
        affected_node_ids: [],
        service_impact_summary: 'Facility stabilized. Mitigation protocol fully effective.',
        system_resilience_score: 96.0
      }
    ]
  }, [incident])

  // Dynamic failure injection handler: sends configured payload to backend engine
  const handleTriggerFailure = useCallback(async (customPayload) => {
    setActiveCheckpointIndex(0)

    const payload = customPayload || {
      asset_id: 'GRID_MAIN',
      failure_type: 'complete_outage',
      severity: 'high',
      duration_minutes: 120,
      compound_heatwave: false
    }

    try {
      const res = await injectFailure(payload)
      if (res.success && res.data) {
        // Use backend response as the authoritative initial state
        if (res.data.incident) {
          setIncident((prev) => ({
            ...prev,
            ...res.data.incident,
            is_active: true,
            active_mitigation_strategy: null
          }))
        }
        if (res.data.resilience_index) {
          setResilience((prev) => ({
            ...prev,
            ...res.data.resilience_index
          }))
        }
        fetchWhatIfAnalysis()
        const sourceName = res.data.incident?.source_asset_id || payload.asset_id
        showToast(`Disruption active on ${sourceName} — cascade simulation started`, 'warning')
        return { success: true, data: res.data }
      } else {
        const errText = res.error || 'Failed to inject failure into digital twin'
        showToast(errText, 'error')
        return {
          success: false,
          error: errText
        }
      }
    } catch (err) {
      const errText = err?.message || 'Network error injecting failure'
      showToast(errText, 'error')
      return {
        success: false,
        error: errText
      }
    }
  }, [fetchWhatIfAnalysis, showToast])

  // Dynamic response strategy application handler
  const handleApplyStrategy = useCallback(async (strategyId) => {
    try {
      const res = await applyStrategy(strategyId)
      if (res.success && res.data) {
        showToast(res.data.message || `Strategy ${strategyId} applied successfully!`, 'success')
        const targetResilience = res.data.new_resilience_score || 92
        setResilience((prev) => ({
          ...prev,
          overall_score: targetResilience
        }))
        const updatedIncident = {
          ...incident,
          active_mitigation_strategy: strategyId
        }
        setIncident(updatedIncident)

        // Immediately update physical assets and clinical services to reflect the mitigated state
        setAssets(getAssetsForCheckpoint(updatedIncident, effectiveTimeline, activeCheckpointIndex, INITIAL_ASSETS))
        setServices(getServicesForCheckpoint(updatedIncident, effectiveTimeline, activeCheckpointIndex, INITIAL_SERVICES))

        // Refresh hospital state and what-if comparison to reflect recovery
        await fetchHospitalState()
        await fetchWhatIfAnalysis()
        return { success: true, data: res.data }
      } else {
        const errText = res.error || 'Failed to apply strategy'
        showToast(errText, 'error')
        return { success: false, error: errText }
      }
    } catch (err) {
      const errText = err?.message || 'Network error applying strategy'
      showToast(errText, 'error')
      return { success: false, error: errText }
    }
  }, [incident, effectiveTimeline, activeCheckpointIndex, fetchHospitalState, fetchWhatIfAnalysis, showToast])

  // Controlled fetch: when entering what-if view, or initial load for dashboard
  useEffect(() => {
    if (activeSection === 'what-if' || activeSection === 'dashboard') {
      fetchWhatIfAnalysis()
    }
  }, [activeSection, fetchWhatIfAnalysis])

  // Controlled fetch: when active incident state toggles
  const prevIncidentActiveRef = useRef(incident.is_active)
  useEffect(() => {
    if (incident.is_active !== prevIncidentActiveRef.current) {
      fetchWhatIfAnalysis()
    }
    prevIncidentActiveRef.current = incident.is_active
  }, [incident.is_active, fetchWhatIfAnalysis])

  // Canonical What-If Strategies: Real backend data when available, WHAT_IF_STRATEGIES fallback
  const effectiveStrategies = (whatIfData?.strategies && whatIfData.strategies.length > 0)
    ? whatIfData.strategies
    : WHAT_IF_STRATEGIES

  // Phase 4D: Live Explainability Data (100% backend-driven, no static CAUSAL_EXPLANATION_DATA)
  const effectiveExplanationData = useMemo(() => {
    const data = { ...liveExplanations }

    // Enrich CausalDrawer with real backend What-If strategy recommendation explanation if available
    if (whatIfData?.causal_explanation || (whatIfData?.strategies && whatIfData.strategies.length > 0)) {
      const recStrategy = whatIfData.strategies?.find(
        (s) => s.is_recommended || s.strategy_id === whatIfData.recommended_strategy_id
      ) || whatIfData.strategies?.[0]

      data.strategy_recommendation = {
        recommended_strategy: recStrategy ? recStrategy.strategy_code : (whatIfData.recommended_strategy_id || 'Recommended Strategy'),
        strategy_name: recStrategy ? recStrategy.strategy_name : 'Optimal Response Intervention',
        decision_factors: (recStrategy?.pros && recStrategy.pros.length > 0)
          ? recStrategy.pros
          : [
              `Projected resilience: ${recStrategy?.projected_resilience_score?.toFixed(1) || '0.0'}/100`,
              `ICU continuity secured: ${recStrategy?.icu_continuity_pct?.toFixed(0) || '0'}%`,
              `Backup runtime: ${recStrategy?.backup_runtime_remaining_hours?.toFixed(1) || '0.0'} hours`,
              `Load shed: ${recStrategy?.non_critical_load_shed_kw?.toFixed(0) || '0'} kW`
            ],
        summary: whatIfData.causal_explanation || recStrategy?.trade_off_summary || 'Multi-criteria decision analysis identified this strategy as optimal.'
      }
    }

    return data
  }, [liveExplanations, whatIfData])

  // Step through deterministic cascade checkpoints (T+0 -> T+5 -> T+10 -> T+20)
  const handleNextCheckpoint = () => {
    const nextIdx = Math.min(activeCheckpointIndex + 1, effectiveTimeline.length - 1)
    setActiveCheckpointIndex(nextIdx)
    if (incident.is_active) {
      setAssets(getAssetsForCheckpoint(incident, effectiveTimeline, nextIdx, INITIAL_ASSETS))
      setServices(getServicesForCheckpoint(incident, effectiveTimeline, nextIdx, INITIAL_SERVICES))
      if (incident.active_mitigation_strategy) {
        const score = effectiveTimeline[nextIdx]?.system_resilience_score || 92
        setResilience((prev) => ({ ...prev, overall_score: score }))
      }
    }
  }

  const handleSelectCheckpoint = (idx) => {
    setActiveCheckpointIndex(idx)
    if (incident.is_active) {
      setAssets(getAssetsForCheckpoint(incident, effectiveTimeline, idx, INITIAL_ASSETS))
      setServices(getServicesForCheckpoint(incident, effectiveTimeline, idx, INITIAL_SERVICES))
      if (incident.active_mitigation_strategy) {
        const score = effectiveTimeline[idx]?.system_resilience_score || 92
        setResilience((prev) => ({ ...prev, overall_score: score }))
      }
    }
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

  // Fix 2: Dynamic Header Scenario Title derived from active incident
  const scenarioTitle = useMemo(() => {
    if (!incident?.is_active) {
      return 'Baseline 100% Operational'
    }
    if (incident.source_asset_id === 'GRID_MAIN') {
      return 'Catastrophic Main Grid Outage (Active Cascade)'
    }
    if (incident.title) {
      return `Active Cascade: ${incident.title}`
    }
    return `Active Cascade: ${incident.source_asset_id || 'Subsystem'} Disruption`
  }, [incident?.is_active, incident?.source_asset_id, incident?.title])

  return (
    <div className="dashboard-shell" data-theme={theme}>
      {/* 1. Left Persistent / Off-canvas Command Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={(sec) => setActiveSection(sec)}
        incidentActive={incident.is_active}
        isCollapsed={sidebarCollapsed}
        isMobileOpen={mobileNavOpen}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onCloseMobile={() => setMobileNavOpen(false)}
        width={sidebarCollapsed ? 68 : sidebarWidth}
        onResizeWidth={handleResizeSidebarWidth}
      />

      {/* Mobile Drawer Backdrop Overlay */}
      {mobileNavOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setMobileNavOpen(false)}
          aria-label="Close navigation overlay"
        />
      )}

      {/* 2. Main Content Workspace: Header + Page Content */}
      <div className="dashboard-body-container">
        {/* Global Operations Header spanning main content */}
        <Header
          activeSection={activeSection}
          resilience={resilience}
          scenarioName={scenarioTitle}
          assetsCount={assets.length}
          servicesCount={services.length}
          alertsCount={activeAlertsCount}
          connectionStatus={connectionStatus}
          lastUpdated={lastUpdated}
          theme={theme}
          onToggleTheme={handleToggleTheme}
          onReconnect={reconnect}
          onReset={handleReset}
          isResetting={isResetting}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
          onToggleMobileNav={() => setMobileNavOpen((prev) => !prev)}
          incident={incident}
          assets={assets}
          services={services}
          timeline={effectiveTimeline}
          onNavigate={(sec) => setActiveSection(sec)}
          onSelectAsset={handleSelectAsset}
          onSelectService={handleSelectService}
        />

        {/* Center Main Application Scroll View */}
        <main ref={mainContentRef} className="dashboard-main-content">
          {/* VIEW ROUTING BASED ON ACTIVE SECTION */}
          {activeSection === 'dashboard' && (
            <Home
              resilience={resilience}
              assets={assets}
              services={services}
              incident={incident}
              connectionStatus={connectionStatus}
              lastUpdated={lastUpdated}
              telemetry={telemetry || INITIAL_TELEMETRY}
              latestTwinEvent={latestTwinEvent}
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectAsset={handleSelectAsset}
            />
          )}

          {activeSection === 'digital-twin' && (
            <DigitalTwinView
              assets={assets}
              services={services}
              selectedAssetId={selectedAssetId}
              onSelectAsset={handleSelectAsset}
              onOpenExplainability={handleOpenExplainability}
            />
          )}

          {activeSection === 'start-simulation' && (
            <StartSimulationView
              assets={assets}
              services={services}
              incident={incident}
              timeline={effectiveTimeline}
              activeCheckpointIndex={activeCheckpointIndex}
              onSelectCheckpoint={handleSelectCheckpoint}
              onTriggerFailure={handleTriggerFailure}
              onReset={handleReset}
              onNotify={showToast}
            />
          )}

          {activeSection === 'what-if' && (
            <WhatIfView
              strategies={effectiveStrategies}
              selectedStrategyId={selectedStrategyId}
              onSelectStrategy={setSelectedStrategyId}
              whatIfData={whatIfData}
              isLoading={whatIfLoading}
              error={whatIfError}
              onRefresh={fetchWhatIfAnalysis}
              onApplyStrategy={handleApplyStrategy}
              onTriggerFailure={handleTriggerFailure}
              onReset={handleReset}
              isIncidentActive={incident.is_active}
              incident={incident}
              assets={assets}
              services={services}
              onNotify={showToast}
            />
          )}

          {activeSection === 'incident-timeline' && (
            <IncidentTimelineView
              incident={incident}
              timeline={effectiveTimeline}
              activeCheckpointIndex={activeCheckpointIndex}
              onSelectCheckpoint={handleSelectCheckpoint}
              onNextCheckpoint={handleNextCheckpoint}
              onOpenExplainability={handleOpenExplainability}
              onReset={handleReset}
              assets={assets}
              services={services}
              resilience={resilience}
            />
          )}

          {activeSection === 'risk-resilience' && (
            <RiskResilienceView
              resilience={resilience}
              assets={assets}
              services={services}
              incident={incident}
              onNavigate={(sec) => setActiveSection(sec)}
              onSelectAsset={handleSelectAsset}
              onNotify={showToast}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsView
              resilience={resilience}
              incident={incident}
              assets={assets}
              onNotify={showToast}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView
              onReset={handleReset}
              theme={theme}
              onSetTheme={setTheme}
              onNotify={showToast}
              assets={assets}
              resilience={resilience}
              incident={incident}
              onNavigate={setActiveSection}
            />
          )}
        </main>
      </div>

      {/* 3. Causal Explanation Drawer (Overlay when opened) */}
      <CausalDrawer
        isOpen={isExplainDrawerOpen}
        onClose={() => setIsExplainDrawerOpen(false)}
        explanationData={effectiveExplanationData}
        isLoading={isLoadingExplanations}
        error={explanationsError}
      />

      {/* 4. Feedback Toast Container */}
      <Toast toast={toast} onClose={hideToast} />
    </div>
  )
}
