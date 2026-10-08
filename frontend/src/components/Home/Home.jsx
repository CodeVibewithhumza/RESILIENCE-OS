import { useState, useMemo, useRef, useEffect } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  HeartPulse,
  Info,
  ChevronRight,
  ChevronDown,
  Maximize2,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import hospitalCampusImg from '../../assets/hospital_campus_twin.jpg'
import './Home.css'

// Helper function to build sharp polyline path (no curves, sharp up/down points)
function buildSharpPath(points) {
  if (!points || points.length === 0) return ''
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

export default function Home({
  resilience,
  assets = [],
  services = [],
  incident,
  connectionStatus = 'disconnected',
  lastUpdated = null,
  telemetry = null,
  latestTwinEvent = null,
  onNavigate,
  onSelectAsset
}) {
  const [campusViewMode, setCampusViewMode] = useState('campus') // 'campus' | 'building'
  const [activePinInspect, setActivePinInspect] = useState(null)

  // 4 Interactive Filter States for Dashboard Cards
  const [resilienceHorizon, setResilienceHorizon] = useState('24h') // '24h' | '12h' | '6h' | '1h'
  const [perfHorizon, setPerfHorizon] = useState('24h') // '24h' | '12h' | '7d' | '1h'
  const [utilizationFilter, setUtilizationFilter] = useState('current') // 'current' | 'peak' | 'avg' | 'min'
  const [riskFilter, setRiskFilter] = useState('by_system') // 'by_system' | 'by_severity' | 'by_dept'

  // Draggable Split-Pane Resizer for Middle Grid (Campus Twin ↔ Resilience & Performance)
  const [middleSplitPercent, setMiddleSplitPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('resilience_dashboard_split_ratio')
      if (saved) {
        const val = parseFloat(saved)
        if (!isNaN(val) && val >= 30 && val <= 75) return val
      }
    } catch {}
    return 60
  })
  const [isDraggingMiddle, setIsDraggingMiddle] = useState(false)
  const isDraggingMiddleRef = useRef(false)
  const middleGridRef = useRef(null)

  const handleMiddlePointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingMiddleRef.current = true
    setIsDraggingMiddle(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMiddleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingMiddleRef.current = true
    setIsDraggingMiddle(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleMiddleTouchStart = (e) => {
    e.stopPropagation()
    isDraggingMiddleRef.current = true
    setIsDraggingMiddle(true)
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isDraggingMiddleRef.current || !middleGridRef.current) return
      const rect = middleGridRef.current.getBoundingClientRect()
      if (!rect || rect.width <= 0) return

      const clientX =
        e.clientX !== undefined
          ? e.clientX
          : e.touches && e.touches[0]
          ? e.touches[0].clientX
          : undefined
      if (clientX === undefined) return

      const rawPct = ((clientX - rect.left) / rect.width) * 100
      const clampedPct = Math.min(Math.max(rawPct, 28), 72)
      setMiddleSplitPercent(Math.round(clampedPct * 10) / 10)
    }

    const handlePointerUp = (e) => {
      if (isDraggingMiddleRef.current) {
        isDraggingMiddleRef.current = false
        setIsDraggingMiddle(false)
        try {
          if (e?.pointerId !== undefined && e?.target?.hasPointerCapture?.(e.pointerId)) {
            e.target.releasePointerCapture(e.pointerId)
          }
        } catch {}
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: false })
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('resilience_dashboard_split_ratio', String(middleSplitPercent))
    } catch {}
  }, [middleSplitPercent])

  const totalAssets = assets.length || 31
  const totalServices = services.length || 5
  const operationalServices = services.filter((s) => s.status === 'full_operation' || (!s.at_risk && s.status !== 'suspended')).length || 5
  const atRiskServices = services.filter((s) => s.at_risk || s.status === 'reduced_capacity' || s.status === 'suspended').length
  const failedAssetsCount = assets.filter((a) => a.status === 'failed' || a.status === 'critical').length
  const degradedAssetsCount = assets.filter((a) => a.status === 'degraded' || a.status === 'starting').length

  const activeAlertsCount = (incident?.is_active ? (incident.affected_asset_ids?.length || 1) : 0) + atRiskServices + failedAssetsCount

  // Map assets for quick lookup
  const assetMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => {
      map[a.id] = a
    })
    return map
  }, [assets])

  // Subsystem Resilience and KPI values derived directly from live backend
  const powerAssets = assets.filter((a) =>
    ['grid', 'transformer', 'main_bus', 'emergency_bus', 'generator', 'ups'].includes(a.type) || a.subsystem === 'power'
  )
  const powerFailed = powerAssets.some((a) => a.status === 'failed' || a.status === 'critical')
  const powerDegraded = powerAssets.some((a) => a.status === 'degraded' || a.status === 'starting')
  const powerPct = typeof resilience?.subsystem_scores?.power === 'number'
    ? Math.round(resilience.subsystem_scores.power)
    : (powerFailed ? 42 : powerDegraded ? 68 : 96)

  const waterAsset = assetMap['WATER_PUMP_STATION']
  const waterFailed = waterAsset?.status === 'failed' || waterAsset?.status === 'critical'
  const waterDegraded = waterAsset?.status === 'degraded'
  const waterPct = typeof resilience?.subsystem_scores?.water === 'number'
    ? Math.round(resilience.subsystem_scores.water)
    : (waterFailed ? 35 : waterDegraded ? 65 : Math.round(waterAsset?.health_score ?? 96))

  const hvacAsset = assetMap['CHILLER_PLANT']
  const hvacFailed = hvacAsset?.status === 'failed' || hvacAsset?.status === 'critical'
  const hvacDegraded = hvacAsset?.status === 'degraded'
  const hvacPct = typeof resilience?.subsystem_scores?.hvac === 'number'
    ? Math.round(resilience.subsystem_scores.hvac)
    : (hvacFailed ? 30 : hvacDegraded ? 62 : Math.round(hvacAsset?.health_score ?? 98))

  const gasAsset = assetMap['OXYGEN_MANIFOLD']
  const gasFailed = gasAsset?.status === 'failed' || gasAsset?.status === 'critical'
  const gasDegraded = gasAsset?.status === 'degraded'
  const gasPct = typeof resilience?.subsystem_scores?.medical_gas === 'number'
    ? Math.round(resilience.subsystem_scores.medical_gas)
    : (gasFailed ? 25 : gasDegraded ? 60 : Math.round(gasAsset?.health_score ?? 98))

  // 1. DYNAMIC RESILIENCE INDEX DATA BASED ON FILTER
  const resilienceData = useMemo(() => {
    const liveScore = typeof resilience?.overall_score === 'number'
      ? Math.round(resilience.overall_score)
      : 82

    if (resilienceHorizon === '1h') {
      return {
        score: liveScore,
        status: incident?.is_active ? 'Degraded' : 'Stable',
        delta: '↑ 1%',
        sublabel: 'Overall infrastructure resilience (Last 1 Hour)',
        wavePath: 'M 2,11 L 24,11 L 42,6 L 58,14 L 76,5 L 94,14 L 112,6 L 130,13 L 148,5 L 166,14 L 184,6 L 202,14 L 220,5 L 238,13 L 256,6 L 274,14 L 292,7 L 306,12 L 318,11'
      }
    }
    if (resilienceHorizon === '6h') {
      return {
        score: Math.max(20, liveScore - 2),
        status: liveScore < 75 ? 'At Risk' : 'Stable',
        delta: '↓ 2%',
        sublabel: 'Overall infrastructure resilience (Last 6 Hours)',
        wavePath: 'M 2,11 L 22,11 L 38,4 L 52,15 L 68,5 L 84,14 L 100,4 L 116,16 L 132,5 L 148,14 L 164,3 L 180,16 L 196,4 L 212,14 L 228,5 L 244,15 L 260,4 L 276,14 L 292,6 L 306,13 L 318,11'
      }
    }
    if (resilienceHorizon === '12h') {
      return {
        score: Math.min(99, liveScore + 2),
        status: 'Stable',
        delta: '↑ 4%',
        sublabel: 'Overall infrastructure resilience (Last 12 Hours)',
        wavePath: 'M 2,11 L 20,11 L 34,5 L 48,14 L 62,6 L 76,13 L 92,4 L 106,15 L 122,6 L 136,14 L 152,4 L 168,15 L 184,5 L 198,13 L 214,6 L 228,14 L 244,4 L 258,14 L 274,6 L 290,13 L 304,7 L 318,11'
      }
    }
    // Default '24h'
    return {
      score: liveScore,
      status: resilience?.status_label === 'CRITICAL' ? 'Critical' : (resilience?.status_label === 'DEGRADED' || incident?.is_active) ? 'Degraded' : 'Stable',
      delta: typeof resilience?.delta_from_baseline === 'number'
        ? `${resilience.delta_from_baseline >= 0 ? '↑' : '↓'} ${Math.abs(Math.round(resilience.delta_from_baseline))}%`
        : '↑ 6%',
      sublabel: 'Overall infrastructure resilience (Last 24 Hours)',
      wavePath: 'M 2,11 L 16,11 L 28,6 L 40,14 L 54,5 L 68,13 L 82,7 L 96,15 L 110,4 L 124,14 L 138,6 L 152,13 L 166,3 L 180,15 L 194,6 L 208,14 L 222,5 L 236,13 L 250,7 L 264,15 L 278,5 L 292,13 L 306,7 L 318,11'
    }
  }, [resilience, incident, resilienceHorizon])

  // 2. DYNAMIC SYSTEM PERFORMANCE MULTI-LINE SHARP GRAPH DATA BASED ON FILTER
  const perfChartData = useMemo(() => {
    // Width 500, Height 262. Mathematical mapping: Y = 236 - (val / 100) * 220
    // Respective Y-axis levels:
    // Power -> 100 (Y=16), Water -> 75 (Y=71), HVAC -> 50 (Y=126), Medical Gas -> 25 (Y=181)
    if (perfHorizon === '12h') {
      const xPoints = [
        { x: 38, label: '8 AM' },
        { x: 111, label: '10 AM' },
        { x: 184, label: '12 PM' },
        { x: 258, label: '2 PM' },
        { x: 331, label: '4 PM' },
        { x: 404, label: '6 PM' },
        { x: 478, label: '8 PM' }
      ]
      const powerPts = [{ x: 38, y: 20.4 }, { x: 111, y: 16.0 }, { x: 184, y: 18.2 }, { x: 258, y: 16.0 }, { x: 331, y: 20.4 }, { x: 404, y: 16.0 }, { x: 478, y: 18.2 }]
      const waterPts = [{ x: 38, y: 73.2 }, { x: 111, y: 66.6 }, { x: 184, y: 71.0 }, { x: 258, y: 68.8 }, { x: 331, y: 75.4 }, { x: 404, y: 71.0 }, { x: 478, y: 68.8 }]
      const hvacPts  = [{ x: 38, y: 130.4 }, { x: 111, y: 121.6 }, { x: 184, y: 117.2 }, { x: 258, y: 119.4 }, { x: 331, y: 126.0 }, { x: 404, y: 130.4 }, { x: 478, y: 126.0 }]
      const gasPts   = [{ x: 38, y: 183.2 }, { x: 111, y: 176.6 }, { x: 184, y: 174.4 }, { x: 258, y: 181.0 }, { x: 331, y: 178.8 }, { x: 404, y: 185.4 }, { x: 478, y: 181.0 }]
      return {
        xPoints,
        power: { path: buildSharpPath(powerPts), points: powerPts },
        water: { path: buildSharpPath(waterPts), points: waterPts },
        hvac:  { path: buildSharpPath(hvacPts),  points: hvacPts },
        gas:   { path: buildSharpPath(gasPts),   points: gasPts }
      }
    }
    if (perfHorizon === '7d') {
      const xPoints = [
        { x: 38, label: 'Mon' },
        { x: 111, label: 'Tue' },
        { x: 184, label: 'Wed' },
        { x: 258, label: 'Thu' },
        { x: 331, label: 'Fri' },
        { x: 404, label: 'Sat' },
        { x: 478, label: 'Sun' }
      ]
      const powerPts = [{ x: 38, y: 18.2 }, { x: 111, y: 16.0 }, { x: 184, y: 20.4 }, { x: 258, y: 16.0 }, { x: 331, y: 18.2 }, { x: 404, y: 22.6 }, { x: 478, y: 16.0 }]
      const waterPts = [{ x: 38, y: 71.0 }, { x: 111, y: 68.8 }, { x: 184, y: 75.4 }, { x: 258, y: 66.6 }, { x: 331, y: 73.2 }, { x: 404, y: 68.8 }, { x: 478, y: 71.0 }]
      const hvacPts  = [{ x: 38, y: 126.0 }, { x: 111, y: 121.6 }, { x: 184, y: 128.2 }, { x: 258, y: 117.2 }, { x: 331, y: 123.8 }, { x: 404, y: 130.4 }, { x: 478, y: 126.0 }]
      const gasPts   = [{ x: 38, y: 181.0 }, { x: 111, y: 176.6 }, { x: 184, y: 185.4 }, { x: 258, y: 174.4 }, { x: 331, y: 183.2 }, { x: 404, y: 178.8 }, { x: 478, y: 181.0 }]
      return {
        xPoints,
        power: { path: buildSharpPath(powerPts), points: powerPts },
        water: { path: buildSharpPath(waterPts), points: waterPts },
        hvac:  { path: buildSharpPath(hvacPts),  points: hvacPts },
        gas:   { path: buildSharpPath(gasPts),   points: gasPts }
      }
    }
    if (perfHorizon === '1h') {
      const xPoints = [
        { x: 38, label: '10:00' },
        { x: 111, label: '10:15' },
        { x: 184, label: '10:30' },
        { x: 258, label: '10:45' },
        { x: 331, label: '11:00' },
        { x: 404, label: '11:15' },
        { x: 478, label: '11:30' }
      ]
      const powerPts = [{ x: 38, y: 18.2 }, { x: 111, y: 18.2 }, { x: 184, y: 16.0 }, { x: 258, y: 20.4 }, { x: 331, y: 18.2 }, { x: 404, y: 16.0 }, { x: 478, y: 18.2 }]
      const waterPts = [{ x: 38, y: 71.0 }, { x: 111, y: 73.2 }, { x: 184, y: 71.0 }, { x: 258, y: 68.8 }, { x: 331, y: 71.0 }, { x: 404, y: 68.8 }, { x: 478, y: 71.0 }]
      const hvacPts  = [{ x: 38, y: 126.0 }, { x: 111, y: 126.0 }, { x: 184, y: 123.8 }, { x: 258, y: 128.2 }, { x: 331, y: 126.0 }, { x: 404, y: 128.2 }, { x: 478, y: 126.0 }]
      const gasPts   = [{ x: 38, y: 181.0 }, { x: 111, y: 183.2 }, { x: 184, y: 181.0 }, { x: 258, y: 178.8 }, { x: 331, y: 181.0 }, { x: 404, y: 183.2 }, { x: 478, y: 181.0 }]
      return {
        xPoints,
        power: { path: buildSharpPath(powerPts), points: powerPts },
        water: { path: buildSharpPath(waterPts), points: waterPts },
        hvac:  { path: buildSharpPath(hvacPts),  points: hvacPts },
        gas:   { path: buildSharpPath(gasPts),   points: gasPts }
      }
    }
    // Default '24h' — Exact 2 Hours Gap (12 Timestamps across 24h timeline)
    // 12 AM, 2 AM, 4 AM, 6 AM, 8 AM, 10 AM, 12 PM, 2 PM, 4 PM, 6 PM, 8 PM, 10 PM
    const xPoints = [
      { x: 38, label: '12 AM' },
      { x: 78, label: '2 AM' },
      { x: 118, label: '4 AM' },
      { x: 158, label: '6 AM' },
      { x: 198, label: '8 AM' },
      { x: 238, label: '10 AM' },
      { x: 278, label: '12 PM' },
      { x: 318, label: '2 PM' },
      { x: 358, label: '4 PM' },
      { x: 398, label: '6 PM' },
      { x: 438, label: '8 PM' },
      { x: 478, label: '10 PM' }
    ]
    // Power -> Matches 100 level (Grid Y=16)
    const powerPts = [
      { x: 38, y: 20.4 },
      { x: 78, y: 16.0 },
      { x: 118, y: 22.6 },
      { x: 158, y: 18.2 },
      { x: 198, y: 16.0 },
      { x: 238, y: 20.4 },
      { x: 278, y: 16.0 },
      { x: 318, y: 18.2 },
      { x: 358, y: 22.6 },
      { x: 398, y: 16.0 },
      { x: 438, y: 20.4 },
      { x: 478, y: 16.0 }
    ]
    // Water -> Matches 75 level (Grid Y=71)
    const waterPts = [
      { x: 38, y: 73.2 },
      { x: 78, y: 66.6 },
      { x: 118, y: 71.0 },
      { x: 158, y: 75.4 },
      { x: 198, y: 68.8 },
      { x: 238, y: 71.0 },
      { x: 278, y: 64.4 },
      { x: 318, y: 68.8 },
      { x: 358, y: 75.4 },
      { x: 398, y: 71.0 },
      { x: 438, y: 73.2 },
      { x: 478, y: 68.8 }
    ]
    // HVAC -> Matches 50 level (Grid Y=126)
    const hvacPts = [
      { x: 38, y: 130.4 },
      { x: 78, y: 123.8 },
      { x: 118, y: 132.6 },
      { x: 158, y: 128.2 },
      { x: 198, y: 121.6 },
      { x: 238, y: 117.2 },
      { x: 278, y: 119.4 },
      { x: 318, y: 123.8 },
      { x: 358, y: 130.4 },
      { x: 398, y: 126.0 },
      { x: 438, y: 132.6 },
      { x: 478, y: 126.0 }
    ]
    // Medical Gas -> Matches 25 level (Grid Y=181)
    const gasPts = [
      { x: 38, y: 183.2 },
      { x: 78, y: 178.8 },
      { x: 118, y: 185.4 },
      { x: 158, y: 181.0 },
      { x: 198, y: 176.6 },
      { x: 238, y: 183.2 },
      { x: 278, y: 174.4 },
      { x: 318, y: 181.0 },
      { x: 358, y: 185.4 },
      { x: 398, y: 178.8 },
      { x: 438, y: 183.2 },
      { x: 478, y: 178.8 }
    ]
    return {
      xPoints,
      power: { path: buildSharpPath(powerPts), points: powerPts },
      water: { path: buildSharpPath(waterPts), points: waterPts },
      hvac:  { path: buildSharpPath(hvacPts),  points: hvacPts },
      gas:   { path: buildSharpPath(gasPts),   points: gasPts }
    }
  }, [perfHorizon])

  // 3. DYNAMIC INFRASTRUCTURE UTILIZATION DATA BASED ON FILTER
  const utilizationData = useMemo(() => {
    const livePower = typeof telemetry?.grid_power_kw === 'number'
      ? Math.min(100, Math.max(10, Math.round((telemetry.grid_power_kw / 1200) * 100)))
      : 68
    const liveWater = typeof telemetry?.water_tank_level_pct === 'number'
      ? Math.round(telemetry.water_tank_level_pct)
      : 54
    const liveHvac = typeof telemetry?.chiller_cooling_output_kw === 'number'
      ? Math.min(100, Math.max(15, Math.round((telemetry.chiller_cooling_output_kw / 650) * 100)))
      : 72
    const liveGas = typeof telemetry?.oxygen_manifold_psi === 'number'
      ? Math.min(100, Math.max(10, Math.round((telemetry.oxygen_manifold_psi / 60) * 100)))
      : 48

    if (utilizationFilter === 'peak') {
      return { power: 92, water: 88, hvac: 94, gas: 78 }
    }
    if (utilizationFilter === 'avg') {
      return { power: 64, water: 52, hvac: 68, gas: 46 }
    }
    if (utilizationFilter === 'min') {
      return { power: 35, water: 28, hvac: 40, gas: 22 }
    }
    // Default 'current' (matches Dark_Dashboard.jpeg: 68%, 54%, 72%, 48%)
    return { power: livePower, water: liveWater, hvac: liveHvac, gas: liveGas }
  }, [telemetry, utilizationFilter])

  // 4. DYNAMIC RISK DISTRIBUTION DATA BASED ON FILTER (BAR CHART / HISTOGRAM)
  const riskDistributionData = useMemo(() => {
    const totalCount = assets.length || 31
    const highCount = failedAssetsCount + (incident?.is_active ? 1 : 0)
    const medCount = degradedAssetsCount + atRiskServices
    const lowCount = Math.max(0, totalCount - highCount - medCount)
    const total = totalCount

    if (riskFilter === 'by_severity') {
      const bars = [
        { key: 'high', label: 'Critical (L1)', count: highCount, color: '#EF4444', rgb: '239, 68, 68', pct: total > 0 ? Math.round((highCount / total) * 100) : 0 },
        { key: 'med', label: 'Warning (L2)', count: medCount, color: '#F59E0B', rgb: '245, 158, 11', pct: total > 0 ? Math.round((medCount / total) * 100) : 0 },
        { key: 'low', label: 'Advisory (L3)', count: lowCount, color: '#00E5A3', rgb: '0, 229, 163', pct: total > 0 ? Math.round((lowCount / total) * 100) : 100 }
      ]
      return { total, high: bars[0], med: bars[1], low: bars[2], bars }
    }
    if (riskFilter === 'by_dept') {
      const icuRisk = atRiskServices + (incident?.is_active ? 1 : 0)
      const plantRisk = (powerFailed || waterFailed || hvacFailed || gasFailed ? 1 : 0)
      const wardCount = Math.max(0, total - icuRisk - plantRisk)
      const bars = [
        { key: 'icu', label: 'ICU & ER', count: icuRisk, color: '#EF4444', rgb: '239, 68, 68', pct: total > 0 ? Math.round((icuRisk / total) * 100) : 0 },
        { key: 'plant', label: 'Central Plant', count: plantRisk, color: '#F59E0B', rgb: '245, 158, 11', pct: total > 0 ? Math.round((plantRisk / total) * 100) : 0 },
        { key: 'wards', label: 'Inpatient', count: wardCount, color: '#00E5A3', rgb: '0, 229, 163', pct: total > 0 ? Math.round((wardCount / total) * 100) : 100 }
      ]
      return { total, high: bars[0], med: bars[1], low: bars[2], bars }
    }
    // Default 'by_system'
    const bars = [
      { key: 'high', label: 'High Risk', count: highCount, color: '#EF4444', rgb: '239, 68, 68', pct: total > 0 ? Math.round((highCount / total) * 100) : 0 },
      { key: 'med', label: 'Medium Risk', count: medCount, color: '#F59E0B', rgb: '245, 158, 11', pct: total > 0 ? Math.round((medCount / total) * 100) : 0 },
      { key: 'low', label: 'Low Risk', count: lowCount, color: '#00E5A3', rgb: '0, 229, 163', pct: total > 0 ? Math.round((lowCount / total) * 100) : 100 }
    ]
    return {
      total,
      high: bars[0],
      med: bars[1],
      low: bars[2],
      bars
    }
  }, [assets.length, failedAssetsCount, incident, degradedAssetsCount, atRiskServices, powerFailed, waterFailed, hvacFailed, gasFailed, riskFilter])

  // Top 5 KPI Cards (Exact match to Dark_Dashboard.jpeg)
  const topCards = [
    {
      id: 'power',
      name: 'Power System',
      icon: 'zap',
      iconClass: 'icon-cyan',
      pct: `${powerPct}%`,
      statusText: powerFailed ? 'Critical' : powerDegraded ? 'Degraded' : 'Normal',
      statusClass: powerFailed ? 'status-dot-critical' : powerDegraded ? 'status-dot-warning' : 'status-dot-normal',
      sparkPoints: '0,18 12,24 25,14 38,20 50,8 63,16 75,10 88,14 100,6',
      sparkColor: '#00F0FF',
      targetSec: 'digital-twin'
    },
    {
      id: 'water',
      name: 'Water System',
      icon: 'water',
      iconClass: 'icon-blue',
      pct: `${waterPct}%`,
      statusText: waterFailed ? 'Critical' : waterDegraded ? 'Degraded' : 'Normal',
      statusClass: waterFailed ? 'status-dot-critical' : waterDegraded ? 'status-dot-warning' : 'status-dot-normal',
      sparkPoints: '0,16 12,22 25,12 38,18 50,10 63,20 75,12 88,18 100,10',
      sparkColor: '#00A8FF',
      targetSec: 'digital-twin'
    },
    {
      id: 'hvac',
      name: 'HVAC System',
      icon: 'fan',
      iconClass: 'icon-teal',
      pct: `${hvacPct}%`,
      statusText: hvacFailed ? 'Critical' : hvacDegraded ? 'Degraded' : hvacAsset?.status === 'at_risk' ? 'At Risk' : 'Normal',
      statusClass: hvacFailed ? 'status-dot-critical' : (hvacDegraded || hvacAsset?.status === 'at_risk') ? 'status-dot-warning' : 'status-dot-normal',
      sparkPoints: hvacFailed
        ? '0,28 12,26 25,28 38,27 50,29 63,28 75,27 88,29 100,28'
        : hvacDegraded
        ? '0,22 12,24 25,20 38,22 50,26 63,20 75,24 88,22 100,24'
        : '0,14 12,12 25,16 38,10 50,14 63,8 75,12 88,10 100,8',
      sparkColor: hvacFailed ? '#EF4444' : (hvacDegraded || hvacAsset?.status === 'at_risk') ? '#F59E0B' : '#00E5A3',
      targetSec: 'digital-twin'
    },
    {
      id: 'gas',
      name: 'Medical Gas',
      icon: 'cylinder',
      iconClass: 'icon-cyan',
      pct: `${gasPct}%`,
      statusText: gasFailed ? 'Critical' : gasDegraded ? 'Degraded' : 'Normal',
      statusClass: gasFailed ? 'status-dot-critical' : gasDegraded ? 'status-dot-warning' : 'status-dot-normal',
      sparkPoints: '0,20 12,16 25,24 38,12 50,18 63,10 75,16 88,8 100,6',
      sparkColor: '#00F0FF',
      targetSec: 'digital-twin'
    },
    {
      id: 'services',
      name: 'Critical Services',
      icon: 'heart',
      iconClass: 'icon-red',
      pct: `${operationalServices} / ${totalServices}`,
      statusText: operationalServices < totalServices ? 'Degraded' : 'Online',
      statusClass: operationalServices < totalServices ? 'status-dot-warning' : 'status-dot-normal',
      sparkPoints: '0,14 12,16 25,12 38,18 50,12 63,16 75,12 88,14 100,12',
      sparkColor: '#00E5A3',
      targetSec: 'digital-twin'
    }
  ]

  // Dynamic live-bound pins for campus twin
  const overlayPins = useMemo(() => {
    const isTransformerDown = incident?.is_active && (incident.source_asset_id === 'TRANSFORMER_01' || incident.source_asset_id === 'GRID_MAIN')
    const isChillerDown = incident?.is_active && incident.source_asset_id === 'CHILLER_PLANT'
    const isIcuAtRisk = services.some((s) => s.id === 'SERVICE_ICU' && (s.at_risk || s.status === 'reduced_capacity'))

    return [
      // 1. Utility Block (Electrical Substation & Diesel Gens)
      {
        id: 'UTILITY_BLOCK',
        assetKey: 'GRID_MAIN',
        label: 'Utility Block',
        icon: '⚙',
        top: '37%',
        left: '23%',
        badgeClass: isTransformerDown ? 'pin-critical' : 'pin-utility',
        dotColor: isTransformerDown ? '#FF4D4D' : '#00F0FF',
        status: isTransformerDown ? 'Trip / Degraded' : '11kV Substation Active',
        desc: 'Substation & Standby Diesel Gens'
      },
      // 2. Emergency (Trauma Entrance Canopy)
      {
        id: 'EMERGENCY',
        assetKey: 'SERVICE_ER',
        label: 'Emergency',
        icon: '🚨',
        top: '52%',
        left: '57%',
        badgeClass: 'pin-er',
        dotColor: '#00F0FF',
        status: 'Trauma Unit Active',
        desc: 'Level 1 Trauma & Resuscitation'
      },
      // 3. OT (East Clinical Suites)
      {
        id: 'OT',
        assetKey: 'SERVICE_OT',
        label: 'OT',
        icon: '⚕',
        top: '43%',
        left: '63%',
        badgeClass: isTransformerDown ? 'pin-warning' : 'pin-ot',
        dotColor: isTransformerDown ? '#FFB800' : '#00F0FF',
        status: isTransformerDown ? 'Priority Bus Feed' : 'Surgical Suites Online',
        desc: 'Operating Theatres & Sterile Supply'
      },
      // 4. ICU (West Clinical Wing)
      {
        id: 'ICU',
        assetKey: 'SERVICE_ICU',
        label: 'ICU',
        icon: '♥',
        top: '42%',
        left: '39%',
        badgeClass: isIcuAtRisk ? 'pin-critical' : 'pin-icu',
        dotColor: isIcuAtRisk ? '#FF4D4D' : '#00F0FF',
        status: isIcuAtRisk ? 'At Risk (UPS Protected)' : '100% Operational',
        desc: 'Intensive Care Unit (Level 3)'
      },
      // 5. Main Hospital (Front Entrance & Reception)
      {
        id: 'MAIN_HOSPITAL',
        assetKey: 'MAIN_HOSPITAL',
        label: 'Main Hospital',
        icon: '+',
        top: '56%',
        left: '42%',
        badgeClass: 'pin-main-hospital',
        dotColor: isTransformerDown ? '#FFB800' : '#00F0FF',
        status: isTransformerDown ? 'Partial UPS Power' : 'Nominal Power',
        desc: 'Central Clinical Inpatient Building'
      },
      // 6. Utility Block (Liquid Oxygen Cryogenic Storage Bay)
      {
        id: 'MED_GAS_PLANT',
        assetKey: 'OXYGEN_MANIFOLD',
        label: 'Utility Block',
        icon: '🧪',
        top: '50%',
        left: '89%',
        badgeClass: 'pin-gas',
        dotColor: '#00F0FF',
        status: '94% Safe Line Pressure',
        desc: 'Cryogenic O2 Storage & Utility Bay'
      },
      // 7. HVAC Plant (Rooftop Chiller Plant & AHU Units)
      {
        id: 'HVAC_PLANT',
        assetKey: 'CHILLER_PLANT',
        label: 'HVAC Plant',
        icon: '⚙',
        top: '19%',
        left: '42.5%',
        badgeClass: isChillerDown ? 'pin-critical' : hvacDegraded ? 'pin-warning' : 'pin-hvac',
        dotColor: isChillerDown ? '#FF4D4D' : hvacDegraded ? '#FFB800' : '#00F0FF',
        status: isChillerDown ? 'Critical Trip' : hvacDegraded ? 'Degraded Capacity' : `${hvacPct}% Capacity (Nominal)`,
        desc: 'Chillers, AHUs & Air Handling'
      }
    ]
  }, [incident, services, hvacDegraded, hvacPct])

  const handlePinClick = (pin) => {
    if (onSelectAsset) {
      onSelectAsset(pin.assetKey)
    }
    setActivePinInspect(pin)
  }

  const handleNavigateToTwin = (assetKey) => {
    if (onSelectAsset && assetKey) {
      onSelectAsset(assetKey)
    }
    if (onNavigate) {
      onNavigate('digital-twin')
    }
  }

  return (
    <div className="dashboard-page">
      {/* 1. TOP 5 SUBSYSTEM KPI CARDS ROW */}
      <section className="dashboard-top-cards-row">
        {topCards.map((card) => {
          return (
            <div
              key={card.id}
              className="subsystem-kpi-card"
              onClick={() => onNavigate && onNavigate(card.targetSec)}
              role="button"
              tabIndex={0}
            >
              <div className="subsystem-kpi-left-group">
                <div className={`subsystem-icon-box ${card.iconClass}`}>
                  {card.icon === 'zap' && <Zap size={20} className="kpi-icon-svg" />}
                  {card.icon === 'water' && <Droplets size={20} className="kpi-icon-svg" />}
                  {card.icon === 'fan' && <Wind size={20} className="kpi-icon-svg" />}
                  {card.icon === 'cylinder' && (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="kpi-icon-svg">
                      <path d="M9 3h6v2H9z" />
                      <path d="M12 5v2" />
                      <rect x="7" y="7" width="10" height="14" rx="4" />
                      <line x1="7" y1="13" x2="17" y2="13" strokeDasharray="1 2" />
                    </svg>
                  )}
                  {card.icon === 'heart' && <HeartPulse size={20} className="kpi-icon-svg" />}
                </div>
                <div className="subsystem-info-col">
                  <div className="subsystem-header-row">
                    <span className="subsystem-name">{card.name}</span>
                    <ChevronRight size={13} className="subsystem-chevron" />
                  </div>
                  <div className="subsystem-val">{card.pct}</div>
                  <div className="subsystem-status-row">
                    <span className={`status-dot ${card.statusClass}`} />
                    <span className="subsystem-status-label">{card.statusText}</span>
                  </div>
                </div>
              </div>

              {/* Sparkline Visual at bottom */}
              <div className="subsystem-sparkline-wrap">
                <svg className="subsystem-sparkline" viewBox="0 0 100 30" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={card.sparkColor}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={card.sparkPoints}
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. MIDDLE TWO-COLUMN GRID: Campus Visual (Left) + Resilience Index & Performance (Right) */}
      <section
        ref={middleGridRef}
        className={`dashboard-middle-grid ${isDraggingMiddle ? 'is-resizing' : ''}`}
      >
        {/* Left: Campus Twin Card with Header toggles, interactive pins & Compass */}
        <div
          className="dashboard-campus-card"
          style={{
            width: `calc(${middleSplitPercent}% - 10px)`,
            flex: `0 0 calc(${middleSplitPercent}% - 10px)`,
            maxWidth: `calc(${middleSplitPercent}% - 10px)`
          }}
        >
          <div className="campus-card-header">
            <div className="campus-header-title-group">
              <div className="campus-title-with-icon">
                <div className="campus-header-icon-wrap">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 3v15" />
                  </svg>
                </div>
                <span className="campus-card-title">
                  {campusViewMode === 'campus'
                    ? 'Hospital Digital Twin (Campus View)'
                    : 'Hospital Digital Twin (Interactive 3D Building View)'}
                </span>
              </div>
              <span className="campus-card-subtitle">
                {campusViewMode === 'campus'
                  ? 'Live infrastructure state and key hospital services'
                  : 'Interactive 3D WebGL building & real-time telemetry model'}
              </span>
            </div>

            <div className="campus-header-controls">
              <div className="campus-view-toggles">
                <button
                  type="button"
                  className={`campus-view-pill ${campusViewMode === 'campus' ? 'is-active' : ''}`}
                  onClick={() => setCampusViewMode('campus')}
                >
                  Campus View
                </button>
                <button
                  type="button"
                  className={`campus-view-pill ${campusViewMode === 'building' ? 'is-active' : ''}`}
                  onClick={() => setCampusViewMode('building')}
                >
                  Building View
                </button>
              </div>
              <button
                type="button"
                className="campus-expand-btn"
                title="Open Full 3D Digital Twin Workspace"
                onClick={() => onNavigate && onNavigate('digital-twin')}
              >
                <Maximize2 size={13} />
              </button>
            </div>
          </div>

          <div className="campus-visual-container">
            {campusViewMode === 'campus' ? (
              <>
                <img
                  src={hospitalCampusImg}
                  alt="Hospital Campus Infrastructure Twin"
                  className="campus-image"
                />
                <div className="campus-vignette-overlay" />

                {/* 8 Interactive Pins */}
                {overlayPins.map((pin) => (
                  <div
                    key={pin.id}
                    className={`campus-pin-pill ${pin.badgeClass} ${activePinInspect?.id === pin.id ? 'is-active-pin' : ''}`}
                    style={{ top: pin.top, left: pin.left }}
                    onClick={() => handlePinClick(pin)}
                    title={`Click to inspect ${pin.label}`}
                  >
                    <span className="pin-icon-tag">{pin.icon}</span>
                    <span className="pin-title-text">{pin.label}</span>
                    <span className="pin-dot-indicator" style={{ backgroundColor: pin.dotColor }} />
                  </div>
                ))}

                {/* Pin Inspection Popover HUD */}
                {activePinInspect && (
                  <div className="pin-inspect-popover font-mono">
                    <div className="popover-header">
                      <span className="popover-title">{activePinInspect.label}</span>
                      <button
                        type="button"
                        className="popover-close"
                        onClick={() => setActivePinInspect(null)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="popover-desc">{activePinInspect.desc}</div>
                    <div className="popover-status">
                      <span className="popover-dot" style={{ backgroundColor: activePinInspect.dotColor }} />
                      <span>{activePinInspect.status}</span>
                    </div>
                    <button
                      type="button"
                      className="popover-cta-btn"
                      onClick={() => handleNavigateToTwin(activePinInspect.assetKey)}
                    >
                      <span>Open in 3D Digital Twin</span>
                      <ArrowUpRight size={12} />
                    </button>
                  </div>
                )}

                {/* Compass Rose Widget on Bottom-Left */}
                <div className="campus-compass-hud">
                  <div className="compass-circle">
                    <span className="compass-dir compass-n">N</span>
                    <span className="compass-dir compass-e">E</span>
                    <span className="compass-dir compass-s">S</span>
                    <span className="compass-dir compass-w">W</span>
                    <div className="compass-needle-wrapper">
                      <div className="compass-needle-north" />
                      <div className="compass-needle-south" />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              /* LIVE 3D TWIN EMBEDDED DIRECTLY IN DASHBOARD */
              <div className="dashboard-embedded-twin-wrap">
                <TwinContainer
                  assets={assets}
                  services={services}
                  incident={incident}
                  onSelectAsset={onSelectAsset}
                />
              </div>
            )}
          </div>
        </div>

        {/* Draggable Divider Handle (Invisible by default, reveals purple on hover/drag) */}
        <div
          className={`dashboard-split-divider-handle ${isDraggingMiddle ? 'is-active' : ''}`}
          onPointerDown={handleMiddlePointerDown}
          onMouseDown={handleMiddleMouseDown}
          onTouchStart={handleMiddleTouchStart}
          onDoubleClick={() => setMiddleSplitPercent(60)}
          title="Drag left or right to resize dashboard panels (Double-click to reset)"
          role="separator"
          aria-orientation="vertical"
          aria-valuenow={Math.round(middleSplitPercent)}
        >
          <div className="dashboard-split-accent-bar" />
          <div className="divider-grip-indicator">
            <span className="grip-dot" />
            <span className="grip-dot" />
            <span className="grip-dot" />
          </div>
        </div>

        {/* Right Stack: Resilience Index + System Performance */}
        <div
          className="dashboard-right-stack"
          style={{
            width: `calc(${100 - middleSplitPercent}% - 10px)`,
            flex: `0 0 calc(${100 - middleSplitPercent}% - 10px)`,
            maxWidth: `calc(${100 - middleSplitPercent}% - 10px)`
          }}
        >
          {/* Card 1: Resilience Index */}
          <div className="dashboard-panel-card resilience-card">
            <div className="panel-card-header">
              <div className="panel-title-with-info">
                <span className="panel-card-title">Resilience Index</span>
                <Info size={17} className="panel-info-icon" />
              </div>
              <div className="panel-select-wrapper">
                <select
                  className="panel-dropdown-select"
                  value={resilienceHorizon}
                  onChange={(e) => setResilienceHorizon(e.target.value)}
                  aria-label="Filter Resilience Index Timeframe"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="12h">Last 12 Hours</option>
                  <option value="6h">Last 6 Hours</option>
                  <option value="1h">Last 1 Hour</option>
                </select>
                <ChevronDown size={16} className="select-chevron-icon" />
              </div>
            </div>

            <div className="resilience-card-body">
              <div className="resilience-main-gauge-row">
                {/* Radial Semi-Circle / Full Gauge */}
                <div className="resilience-radial-gauge">
                  <svg className="radial-svg" viewBox="0 0 120 120">
                    <circle
                      className="radial-track"
                      cx="60"
                      cy="60"
                      r="46"
                      strokeWidth="11"
                      fill="none"
                    />
                    <circle
                      className="radial-progress"
                      cx="60"
                      cy="60"
                      r="46"
                      strokeWidth="11"
                      stroke="#00F0FF"
                      strokeLinecap="round"
                      fill="none"
                      strokeDasharray="289"
                      strokeDashoffset={289 - (resilienceData.score / 100) * 289}
                    />
                  </svg>
                  <div className="radial-center-stats">
                    <span className="radial-big-score font-mono">{resilienceData.score}</span>
                    <span className="radial-status-text">{resilienceData.status}</span>
                    <span className="radial-trend-text font-mono">{resilienceData.delta}</span>
                  </div>
                </div>

                {/* 4 Subsystem Progress Bars */}
                <div className="resilience-bars-col">
                  <div className="resilience-bar-item">
                    <div className="resilience-bar-meta">
                      <div className="bar-icon-name">
                        <Zap size={13} style={{ color: '#00F0FF' }} />
                        <span>Power</span>
                      </div>
                      <span className="bar-pct font-mono">{powerPct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${powerPct}%`, backgroundColor: '#00F0FF' }} />
                    </div>
                  </div>

                  <div className="resilience-bar-item">
                    <div className="resilience-bar-meta">
                      <div className="bar-icon-name">
                        <Droplets size={13} style={{ color: '#00A8FF' }} />
                        <span>Water</span>
                      </div>
                      <span className="bar-pct font-mono">{waterPct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${waterPct}%`, backgroundColor: '#00A8FF' }} />
                    </div>
                  </div>

                  <div className="resilience-bar-item">
                    <div className="resilience-bar-meta">
                      <div className="bar-icon-name">
                        <Wind size={13} style={{ color: hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3' }} />
                        <span>HVAC</span>
                      </div>
                      <span className="bar-pct font-mono">{hvacPct}%</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${hvacPct}%`,
                          backgroundColor: hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3'
                        }}
                      />
                    </div>
                  </div>

                  <div className="resilience-bar-item">
                    <div className="resilience-bar-meta">
                      <div className="bar-icon-name">
                        <div className="mini-gas-icon" style={{ color: '#A855F7' }}>🧪</div>
                        <span>Medical Gas</span>
                      </div>
                      <span className="bar-pct font-mono">{gasPct}%</span>
                    </div>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${gasPct}%`, backgroundColor: '#A855F7' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom wave trendline */}
              <div className="resilience-trend-subrow">
                <span className="resilience-trend-subtext">{resilienceData.sublabel}</span>
                <svg className="resilience-wave-svg" viewBox="0 0 320 20">
                  <path
                    d={resilienceData.wavePath}
                    fill="none"
                    stroke="#00E5A3"
                    strokeWidth="1.8"
                    strokeLinejoin="miter"
                    strokeMiterlimit="4"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Card 2: System Performance Multi-line Chart */}
          <div className="dashboard-panel-card system-perf-card">
            <div className="panel-card-header">
              <span className="panel-card-title">System Performance</span>
              <div className="panel-select-wrapper">
                <select
                  className="panel-dropdown-select"
                  value={perfHorizon}
                  onChange={(e) => setPerfHorizon(e.target.value)}
                  aria-label="Filter System Performance Timeframe"
                >
                  <option value="24h">Last 24 Hours</option>
                  <option value="12h">Last 12 Hours</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="1h">Real-time Live</option>
                </select>
                <ChevronDown size={16} className="select-chevron-icon" />
              </div>
            </div>

            <div className="system-perf-chart-body">
              {/* Full-width Expanded SVG Chart */}
              <div className="chart-canvas-wrapper">
                <svg className="perf-lines-svg" viewBox="0 0 500 262">
                  {/* Y-Axis Labels aligned with grid lines (55px expanded vertical spacing!) */}
                  <text x="24" y="16" dominantBaseline="central" textAnchor="end" className="chart-axis-label chart-y-label">100</text>
                  <text x="24" y="71" dominantBaseline="central" textAnchor="end" className="chart-axis-label chart-y-label">75</text>
                  <text x="24" y="126" dominantBaseline="central" textAnchor="end" className="chart-axis-label chart-y-label">50</text>
                  <text x="24" y="181" dominantBaseline="central" textAnchor="end" className="chart-axis-label chart-y-label">25</text>
                  <text x="24" y="236" dominantBaseline="central" textAnchor="end" className="chart-axis-label chart-y-label">0</text>

                  {/* Grid lines */}
                  <line x1="30" y1="16" x2="488" y2="16" className="chart-grid-line" strokeDasharray="3 3" />
                  <line x1="30" y1="71" x2="488" y2="71" className="chart-grid-line" strokeDasharray="3 3" />
                  <line x1="30" y1="126" x2="488" y2="126" className="chart-grid-line" strokeDasharray="3 3" />
                  <line x1="30" y1="181" x2="488" y2="181" className="chart-grid-line" strokeDasharray="3 3" />
                  <line x1="30" y1="236" x2="488" y2="236" className="chart-grid-baseline" />

                  {/* 1. Power Line (Cyan #00F0FF) - sharp up/down telemetry points */}
                  <path
                    d={perfChartData.power.path}
                    fill="none"
                    stroke="#00F0FF"
                    strokeWidth="1.8"
                    strokeLinejoin="miter"
                    strokeMiterlimit="4"
                    strokeLinecap="round"
                    className="perf-line-cyan"
                  />
                  {perfChartData.power.points.map((pt, idx) => (
                    <g key={`power-pt-${idx}`}>
                      <circle cx={pt.x} cy={pt.y} r="3" fill="none" stroke="#00F0FF" strokeWidth="0.8" opacity="0.3" />
                      <circle cx={pt.x} cy={pt.y} r="1.8" fill="#00F0FF" />
                    </g>
                  ))}

                  {/* 2. Water Line (Blue #00A8FF) - sharp up/down telemetry points */}
                  <path
                    d={perfChartData.water.path}
                    fill="none"
                    stroke="#00A8FF"
                    strokeWidth="1.8"
                    strokeLinejoin="miter"
                    strokeMiterlimit="4"
                    strokeLinecap="round"
                    className="perf-line-blue"
                  />
                  {perfChartData.water.points.map((pt, idx) => (
                    <g key={`water-pt-${idx}`}>
                      <circle cx={pt.x} cy={pt.y} r="3" fill="none" stroke="#00A8FF" strokeWidth="0.8" opacity="0.3" />
                      <circle cx={pt.x} cy={pt.y} r="1.8" fill="#00A8FF" />
                    </g>
                  ))}

                  {/* 3. HVAC Line (Green/Amber/Red based on status) */}
                  <path
                    d={perfChartData.hvac.path}
                    fill="none"
                    stroke={hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3'}
                    strokeWidth="1.8"
                    strokeLinejoin="miter"
                    strokeMiterlimit="4"
                    strokeLinecap="round"
                    className="perf-line-amber"
                  />
                  {perfChartData.hvac.points.map((pt, idx) => (
                    <g key={`hvac-pt-${idx}`}>
                      <circle cx={pt.x} cy={pt.y} r="3" fill="none" stroke={hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3'} strokeWidth="0.8" opacity="0.3" />
                      <circle cx={pt.x} cy={pt.y} r="1.8" fill={hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3'} />
                    </g>
                  ))}

                  {/* 4. Medical Gas Line (Purple #A855F7) - sharp up/down telemetry points */}
                  <path
                    d={perfChartData.gas.path}
                    fill="none"
                    stroke="#A855F7"
                    strokeWidth="1.8"
                    strokeLinejoin="miter"
                    strokeMiterlimit="4"
                    strokeLinecap="round"
                    className="perf-line-purple"
                  />
                  {perfChartData.gas.points.map((pt, idx) => (
                    <g key={`gas-pt-${idx}`}>
                      <circle cx={pt.x} cy={pt.y} r="3" fill="none" stroke="#A855F7" strokeWidth="0.8" opacity="0.3" />
                      <circle cx={pt.x} cy={pt.y} r="1.8" fill="#A855F7" />
                    </g>
                  ))}

                  {/* X-Axis Labels aligned with nodes (2 Hours gap) */}
                  {perfChartData.xPoints.map((item, idx) => (
                    <text
                      key={`x-lbl-${idx}`}
                      x={item.x}
                      y="254"
                      textAnchor="middle"
                      className="chart-axis-label chart-x-label"
                    >
                      {item.label}
                    </text>
                  ))}
                </svg>
              </div>

              {/* Chart Legend directly below the graph in a single line */}
              <div className="chart-legend-row">
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#00F0FF', boxShadow: '0 0 8px #00F0FF' }} />
                  <span>Power</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#00A8FF', boxShadow: '0 0 8px #00A8FF' }} />
                  <span>Water</span>
                </div>
                <div className="legend-item">
                  <span
                    className="legend-dot"
                    style={{
                      backgroundColor: hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3',
                      boxShadow: `0 0 8px ${hvacFailed ? '#EF4444' : hvacDegraded ? '#F59E0B' : '#00E5A3'}`
                    }}
                  />
                  <span>HVAC</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ backgroundColor: '#A855F7', boxShadow: '0 0 8px #A855F7' }} />
                  <span>Medical Gas</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM THREE-CARD ROW: Utilization + Risk Distribution + Key Metrics */}
      <section className="dashboard-bottom-grid">
        {/* Card 1: Infrastructure Utilization (4 Ring Dials) */}
        <div className="dashboard-panel-card utilization-card">
          <div className="panel-card-header">
            <div className="panel-title-with-info">
              <span className="panel-card-title">Infrastructure Utilization</span>
              <Info size={13} className="panel-info-icon" />
            </div>
            <div className="panel-select-wrapper">
              <select
                className="panel-dropdown-select"
                value={utilizationFilter}
                onChange={(e) => setUtilizationFilter(e.target.value)}
                aria-label="Filter Infrastructure Utilization Mode"
              >
                <option value="current">Current</option>
                <option value="peak">Peak Load</option>
                <option value="avg">Average (24h)</option>
                <option value="min">Minimum Load</option>
              </select>
              <ChevronDown size={11} className="select-chevron-icon" />
            </div>
          </div>

          <div className="utilization-rings-row">
            {/* Ring 1: Power Load */}
            <div className="util-ring-item">
              <div className="ring-svg-wrapper">
                <svg className="ring-svg" viewBox="0 0 70 70">
                  <circle className="ring-bg" cx="35" cy="35" r="28" strokeWidth="6" fill="none" />
                  <circle
                    className="ring-fg ring-cyan"
                    cx="35"
                    cy="35"
                    r="28"
                    strokeWidth="6"
                    stroke="#00F0FF"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 - (utilizationData.power / 100) * 175.9}
                  />
                </svg>
                <span className="ring-center-val font-mono">{utilizationData.power}%</span>
              </div>
              <span className="ring-label-text">Power Load</span>
            </div>

            {/* Ring 2: Water Usage */}
            <div className="util-ring-item">
              <div className="ring-svg-wrapper">
                <svg className="ring-svg" viewBox="0 0 70 70">
                  <circle className="ring-bg" cx="35" cy="35" r="28" strokeWidth="6" fill="none" />
                  <circle
                    className="ring-fg ring-blue"
                    cx="35"
                    cy="35"
                    r="28"
                    strokeWidth="6"
                    stroke="#00A8FF"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 - (utilizationData.water / 100) * 175.9}
                  />
                </svg>
                <span className="ring-center-val font-mono">{utilizationData.water}%</span>
              </div>
              <span className="ring-label-text">Water Usage</span>
            </div>

            {/* Ring 3: HVAC Load */}
            <div className="util-ring-item">
              <div className="ring-svg-wrapper">
                <svg className="ring-svg" viewBox="0 0 70 70">
                  <circle className="ring-bg" cx="35" cy="35" r="28" strokeWidth="6" fill="none" />
                  <circle
                    className="ring-fg ring-amber"
                    cx="35"
                    cy="35"
                    r="28"
                    strokeWidth="6"
                    stroke="#F59E0B"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 - (utilizationData.hvac / 100) * 175.9}
                  />
                </svg>
                <span className="ring-center-val font-mono">{utilizationData.hvac}%</span>
              </div>
              <span className="ring-label-text">HVAC Load</span>
            </div>

            {/* Ring 4: Gas Usage */}
            <div className="util-ring-item">
              <div className="ring-svg-wrapper">
                <svg className="ring-svg" viewBox="0 0 70 70">
                  <circle className="ring-bg" cx="35" cy="35" r="28" strokeWidth="6" fill="none" />
                  <circle
                    className="ring-fg ring-purple"
                    cx="35"
                    cy="35"
                    r="28"
                    strokeWidth="6"
                    stroke="#A855F7"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray="175.9"
                    strokeDashoffset={175.9 - (utilizationData.gas / 100) * 175.9}
                  />
                </svg>
                <span className="ring-center-val font-mono">{utilizationData.gas}%</span>
              </div>
              <span className="ring-label-text">Gas Usage</span>
            </div>
          </div>
        </div>

        {/* Card 2: Risk Distribution Bar Chart / Histogram */}
        <div className="dashboard-panel-card risk-dist-card">
          <div className="panel-card-header">
            <div className="panel-title-with-info">
              <span className="panel-card-title">Risk Distribution</span>
              <Info size={15} className="panel-info-icon" />
            </div>
            <div className="risk-header-actions">
              <span className="risk-total-chip font-mono">
                <span className="risk-total-num">{riskDistributionData.total}</span> Total
              </span>
              <div className="panel-select-wrapper">
                <select
                  className="panel-dropdown-select"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value)}
                  aria-label="Filter Risk Distribution Breakdown"
                >
                  <option value="by_system">By System</option>
                  <option value="by_severity">By Severity</option>
                  <option value="by_dept">By Department</option>
                </select>
                <ChevronDown size={16} className="select-chevron-icon" />
              </div>
            </div>
          </div>

          <div className="risk-histogram-content">
            <div className="risk-hist-y-axis font-mono">
              <span>6</span>
              <span>4</span>
              <span>2</span>
              <span>0</span>
            </div>

            <div className="risk-hist-canvas">
              {/* Reference Grid lines */}
              <div className="hist-grid-line line-6" />
              <div className="hist-grid-line line-4" />
              <div className="hist-grid-line line-2" />
              <div className="hist-grid-baseline" />

              {/* Vertical Histogram Bars */}
              <div className="risk-hist-bars-row">
                {riskDistributionData.bars.map((bar) => {
                  const maxScale = 6
                  const heightPct = Math.min(100, Math.max(14, Math.round((bar.count / maxScale) * 100)))
                  return (
                    <div key={bar.key} className="risk-hist-bar-col">
                      <div className="risk-bar-track">
                        <span className="risk-bar-val font-mono" style={{ color: bar.color }}>
                          {bar.count}
                        </span>
                        <div
                          className="risk-bar-pillar"
                          style={{
                            height: `${heightPct}%`,
                            background: `linear-gradient(180deg, ${bar.color} 0%, rgba(${bar.rgb || '239,68,68'}, 0.25) 100%)`,
                            borderTop: `2px solid ${bar.color}`,
                            boxShadow: `0 0 12px ${bar.color}44`
                          }}
                        />
                      </div>
                      <div className="risk-bar-footer">
                        <div className="risk-bar-tag">
                          <span
                            className="risk-color-dot"
                            style={{ backgroundColor: bar.color, boxShadow: `0 0 6px ${bar.color}` }}
                          />
                          <span className="risk-type-label">{bar.label}</span>
                        </div>
                        <span className="risk-pct-pill font-mono">{bar.pct}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Key Metrics (4 Tiles) */}
        <div className="dashboard-panel-card key-metrics-card">
          <div className="panel-card-header">
            <span className="panel-card-title">Key Metrics</span>
          </div>

          <div className="key-metrics-tiles-grid">
            <div className="metric-tile-item">
              <div className="metric-tile-icon-wrap icon-cyan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l8-4v18M13 21V3l6 3v15" />
                </svg>
              </div>
              <div className="metric-tile-number font-mono">{totalAssets}</div>
              <div className="metric-tile-name">Total Assets</div>
            </div>

            <div className="metric-tile-item">
              <div className="metric-tile-icon-wrap icon-blue">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="19" cy="5" r="2" />
                  <circle cx="5" cy="5" r="2" />
                  <circle cx="19" cy="19" r="2" />
                  <circle cx="5" cy="19" r="2" />
                  <path d="M7 6.5l3.5 3.5M17 6.5l-3.5 3.5M7 17.5l3.5-3.5M17 17.5l-3.5-3.5" />
                </svg>
              </div>
              <div className="metric-tile-number font-mono">6</div>
              <div className="metric-tile-name">Sub-systems</div>
            </div>

            <div className="metric-tile-item">
              <div className="metric-tile-icon-wrap icon-red">
                <AlertTriangle size={18} />
              </div>
              <div className="metric-tile-number font-mono" style={{ color: '#EF4444' }}>{activeAlertsCount}</div>
              <div className="metric-tile-name">Active Alerts</div>
            </div>

            <div className="metric-tile-item">
              <div className="metric-tile-icon-wrap icon-green">
                <ShieldCheck size={18} />
              </div>
              <div className="metric-tile-number font-mono" style={{ color: '#00E5A3' }}>
                {incident?.is_active ? '88%' : '98%'}
              </div>
              <div className="metric-tile-name">System Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
