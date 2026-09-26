import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
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
import RiskResilienceView from './components/RiskResilience/RiskResilienceView'
import ReportsView from './components/Reports/ReportsView'
import SettingsView from './components/Settings/SettingsView'
import StartSimulationView from './components/StartSimulation/StartSimulationView'
import { useResilienceRealtime } from './hooks/useResilienceRealtime'
import { getApiBaseUrl } from './config/api'
import { getWhatIfAnalysis, injectFailure } from './services/simulationApi'
import { getServiceExplanation } from './services/explainabilityApi'
import {
  INITIAL_ASSETS,
  INITIAL_SERVICES,
  INITIAL_RESILIENCE,
  DISRUPTED_ASSETS,
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

  // Navigation state for sidebar active indicator (dashboard, digital-twin, start-simulation, what-if, incident-timeline, risk-resilience, reports, settings)
  const [activeSection, setActiveSection] = useState('dashboard')

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
  const handleReset = useCallback(() => {
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
      fetch(`${baseUrl}/api/hospital/reset`, { method: 'POST' }).catch(() => {})
    } catch {
      // Offline fallback
    }

    setTimeout(() => {
      fetchWhatIfAnalysis()
    }, 200)
  }, [fetchWhatIfAnalysis])

  // Event callback: Synchronize incoming real-time telemetry and resilience score
  const handleTelemetryTick = useCallback(({ telemetry: tel, resilienceScore: score, statusLabel: label }) => {
    if (typeof score === 'number') {
      setResilience((prev) => {
        const lbl = label || prev.status_label || 'OPTIMAL'
        const color = getStatusColor(lbl)
        const delta = Number((score - 94.5).toFixed(1))
        return {
          ...prev,
          overall_score: score,
          status_label: lbl,
          status_color: color,
          delta_from_baseline: delta
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

  useEffect(() => {
    if (!isLive) {
      hasHydratedRef.current = false
      return
    }

    if (hasHydratedRef.current) return
    hasHydratedRef.current = true

    let isCancelled = false

    async function hydrateState() {
      try {
        const baseUrl = getApiBaseUrl()
        const res = await fetch(`${baseUrl}/api/hospital/state`)
        if (!res.ok) return
        const data = await res.json()
        if (isCancelled || !data) return

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

          try {
            const [assetsRes, servicesRes] = await Promise.all([
              fetch(`${baseUrl}/api/assets`),
              fetch(`${baseUrl}/api/services`)
            ])

            if (assetsRes.ok) {
              const liveAssets = await assetsRes.json()
              if (!isCancelled && Array.isArray(liveAssets) && liveAssets.length > 0) {
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
              if (!isCancelled && Array.isArray(liveServices) && liveServices.length > 0) {
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
            // Fallback: Ensure source asset is marked failed from incident
            if (!isCancelled) {
              setAssets((prev) =>
                prev.map((a) => (a.id === sourceAssetId ? { ...a, status: 'failed', health_score: 0.0 } : a))
              )
            }
          }
        }
      } catch {
        // Fallback to existing mock state on error
      }
    }

    hydrateState()

    return () => {
      isCancelled = true
    }
  }, [isLive])

  // Active backend incident timeline is used when available; CASCADE_TIMELINE remains fallback
  const effectiveTimeline = incident?.timeline && incident.timeline.length > 0
    ? incident.timeline
    : CASCADE_TIMELINE

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
            is_active: true
          }))
        }
        if (res.data.resilience_index) {
          setResilience((prev) => ({
            ...prev,
            ...res.data.resilience_index
          }))
        }
        fetchWhatIfAnalysis()
        return { success: true, data: res.data }
      } else {
        return {
          success: false,
          error: res.error || 'Failed to inject failure into digital twin'
        }
      }
    } catch (err) {
      return {
        success: false,
        error: err?.message || 'Network error injecting failure'
      }
    }
  }, [fetchWhatIfAnalysis])

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
      setAssets(getAssetsForCheckpoint(true, nextIdx))
    }
  }

  const handleSelectCheckpoint = (idx) => {
    setActiveCheckpointIndex(idx)
    if (incident.is_active) {
      setAssets(getAssetsForCheckpoint(true, idx))
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
        connectionStatus={connectionStatus}
        lastUpdated={lastUpdated}
        onReconnect={reconnect}
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
          {/* VIEW ROUTING BASED ON ACTIVE SECTION */}
          {activeSection === 'dashboard' && (
            <>
              {/* A. Premium Home / Overview Landing Screen */}
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

              {/* B. DIGITAL TWIN + INCIDENT CONTROL */}
              <section className="dashboard-section-block" id="digital-twin">
                <div className="section-title-row">
                  <span className="section-title-tag">PRIMARY VISUALIZATION & CONTROL</span>
                  <h2 className="section-main-heading">Digital Twin Topology & Incident Injection</h2>
                </div>

                <div className="twin-incident-split-grid">
                  <div className="twin-col">
                    <TwinContainer
                      assets={assets}
                      services={services}
                      selectedAssetId={selectedAssetId}
                      onSelectAsset={handleSelectAsset}
                    />
                  </div>
                  <div className="incident-col" id="incident-control">
                    <IncidentPanel
                      incident={incident}
                      onTriggerFailure={handleTriggerFailure}
                      onReset={handleReset}
                      activeCheckpointIndex={activeCheckpointIndex}
                      onNextCheckpoint={handleNextCheckpoint}
                      onOpenExplainability={handleOpenExplainability}
                    />
                  </div>
                </div>
              </section>

              {/* C. RESILIENCE + CASCADE */}
              <section className="dashboard-section-block" id="resilience-cascade">
                <div className="section-title-row">
                  <span className="section-title-tag">RESILIENCE ANALYTICS</span>
                  <h2 className="section-main-heading">Resilience Index Synthesis & Cascade Timeline</h2>
                </div>

                <div className="resilience-cascade-split-grid">
                  <div className="resilience-col">
                    <ResilienceCard resilience={resilience} />
                  </div>
                  <div className="cascade-col">
                    <TimelineView
                      timeline={effectiveTimeline}
                      isIncidentActive={incident.is_active}
                      activeCheckpointIndex={activeCheckpointIndex}
                      onSelectCheckpoint={handleSelectCheckpoint}
                    />
                  </div>
                </div>
              </section>

              {/* D. WHAT-IF STRATEGY LAB */}
              <section className="dashboard-section-block" id="strategy-lab">
                <div className="section-title-row">
                  <span className="section-title-tag">DECISION SUPPORT SYSTEM</span>
                  <h2 className="section-main-heading">What-If Strategy Simulation Lab</h2>
                </div>

                <StrategyMatrix
                  strategies={effectiveStrategies}
                  selectedStrategyId={selectedStrategyId}
                  onSelectStrategy={setSelectedStrategyId}
                  whatIfData={whatIfData}
                  isLoading={whatIfLoading}
                  error={whatIfError}
                  onRefresh={fetchWhatIfAnalysis}
                  isIncidentActive={incident.is_active}
                />
              </section>

              {/* E. INFRASTRUCTURE ASSETS CATALOG */}
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

              {/* F. HOSPITAL CRITICAL SERVICES */}
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
            </>
          )}

          {activeSection === 'digital-twin' && (
            <section className="dashboard-section-block">
              <div className="section-title-row">
                <span className="section-title-tag">3D SPATIAL RECONSTRUCTION</span>
                <h2 className="section-main-heading">Hospital BIM Digital Twin & Subsystem Nodes</h2>
              </div>
              <TwinContainer
                assets={assets}
                services={services}
                selectedAssetId={selectedAssetId}
                onSelectAsset={handleSelectAsset}
              />
              <AssetGrid
                assets={assets}
                selectedAssetId={selectedAssetId}
                onSelectAsset={handleSelectAsset}
              />
            </section>
          )}

          {activeSection === 'start-simulation' && (
            <StartSimulationView
              assets={assets}
              services={services}
              incident={incident}
              onTriggerFailure={handleTriggerFailure}
              onReset={handleReset}
            />
          )}

          {activeSection === 'what-if' && (
            <section className="dashboard-section-block">
              <div className="section-title-row">
                <span className="section-title-tag">MULTI-CRITERIA DECISION ANALYSIS</span>
                <h2 className="section-main-heading">What-If Strategy Simulation & TOPSIS Ranking</h2>
              </div>
              <StrategyMatrix
                strategies={effectiveStrategies}
                selectedStrategyId={selectedStrategyId}
                onSelectStrategy={setSelectedStrategyId}
                whatIfData={whatIfData}
                isLoading={whatIfLoading}
                error={whatIfError}
                onRefresh={fetchWhatIfAnalysis}
                isIncidentActive={incident.is_active}
              />
            </section>
          )}

          {activeSection === 'incident-timeline' && (
            <section className="dashboard-section-block">
              <div className="section-title-row">
                <span className="section-title-tag">CASCADE PROPAGATION</span>
                <h2 className="section-main-heading">Incident Horizon & Cascade Timeline</h2>
              </div>
              <div className="twin-incident-split-grid">
                <div className="twin-col">
                  <TimelineView
                    timeline={effectiveTimeline}
                    isIncidentActive={incident.is_active}
                    activeCheckpointIndex={activeCheckpointIndex}
                    onSelectCheckpoint={handleSelectCheckpoint}
                  />
                </div>
                <div className="incident-col">
                  <IncidentPanel
                    incident={incident}
                    onTriggerFailure={handleTriggerFailure}
                    onReset={handleReset}
                    activeCheckpointIndex={activeCheckpointIndex}
                    onNextCheckpoint={handleNextCheckpoint}
                    onOpenExplainability={handleOpenExplainability}
                  />
                </div>
              </div>
            </section>
          )}

          {activeSection === 'risk-resilience' && (
            <RiskResilienceView
              resilience={resilience}
              assets={assets}
              services={services}
            />
          )}

          {activeSection === 'reports' && (
            <ReportsView
              resilience={resilience}
              incident={incident}
              assets={assets}
            />
          )}

          {activeSection === 'settings' && (
            <SettingsView onReset={handleReset} />
          )}

          {/* Footer Bar */}
          <footer className="dashboard-footer">
            <div className="footer-left-info">
              <span className="footer-brand">RESILIENCE<span style={{ color: 'var(--accent-cyan)' }}>OS</span></span>
              <span className="footer-badge font-mono">v1.0-PRODUCTION</span>
              <span className="footer-disclaimer">Hospital Infrastructure Digital Twin & Resilience Decision Engine</span>
            </div>
            <div className="footer-right font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              <span>{assets.length} Monitored Graph Nodes</span>
              <span style={{ margin: '0 8px' }}>•</span>
              <span style={{ color: isLive ? 'var(--status-normal)' : 'var(--text-muted)' }}>
                {isLive
                  ? '● WebSocket Telemetry 1s Sync (LIVE)'
                  : connectionStatus === 'connecting' || connectionStatus === 'reconnecting'
                  ? '◐ Connecting Stream...'
                  : '○ Offline (Fallback Demo Data)'}
              </span>
            </div>
          </footer>
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
    </div>
  )
}
