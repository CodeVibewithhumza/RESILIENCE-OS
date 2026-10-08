import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  Zap,
  Flame,
  Wind,
  Droplets,
  Search,
  Filter,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  HeartPulse,
  TrendingUp,
  Sliders,
  CheckCircle2,
  X,
  Gauge,
  Cpu,
  AlertOctagon,
  Sparkles
} from 'lucide-react'
import { getRiskSummary, getResilienceBreakdown } from '../../services/riskResilienceApi'
import './RiskResilienceView.css'

export default function RiskResilienceView({
  resilience = {},
  assets = [],
  services = [],
  incident = {},
  onNavigate,
  onSelectAsset,
  onNotify
}) {
  // --------------------------------------------------------------------------
  // 1. Backend Data State (Auto-Syncing)
  // --------------------------------------------------------------------------
  const [riskSummary, setRiskSummary] = useState(null)
  const [resilienceBreakdown, setResilienceBreakdown] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [apiError, setApiError] = useState(null)
  const [lastSyncedAt, setLastSyncedAt] = useState(null)

  // --------------------------------------------------------------------------
  // 2. Interactive UI Filters & Inspection
  // --------------------------------------------------------------------------
  const [assetSearchQuery, setAssetSearchQuery] = useState('')
  const [assetSubsystemFilter, setAssetSubsystemFilter] = useState('all') // 'all' | 'electrical' | 'hvac' | 'medgas' | 'water'
  const [riskDistFilter, setRiskDistFilter] = useState('severity') // 'severity' | 'subsystem'
  const [resilienceDisplayMode, setResilienceDisplayMode] = useState('gauges') // 'gauges' | 'formula'
  const [serviceFilter, setServiceFilter] = useState('all') // 'all' | 'critical'
  const [trendTimeframe, setTrendTimeframe] = useState('24h') // '24h' | '12h' | 'sim'
  const [inspectedItem, setInspectedItem] = useState(null) // { type: 'asset' | 'service', id: string, data: object }

  // --------------------------------------------------------------------------
  // 3. Auto-Fetch Data from Backend APIs (Autonomous Sync)
  // --------------------------------------------------------------------------
  const fetchBackendData = useCallback(async () => {
    try {
      const [riskRes, breakdownRes] = await Promise.all([
        getRiskSummary(),
        getResilienceBreakdown()
      ])

      let hasSuccess = false

      if (riskRes.success && riskRes.data) {
        setRiskSummary(riskRes.data)
        hasSuccess = true
      }

      if (breakdownRes.success && breakdownRes.data) {
        setResilienceBreakdown(breakdownRes.data)
        hasSuccess = true
      }

      if (hasSuccess) {
        setLastSyncedAt(new Date())
        setApiError(null)
      } else {
        setApiError(riskRes.error || breakdownRes.error || 'Backend service unavailable')
      }
    } catch (err) {
      setApiError(err?.message || 'Failed to connect to Risk & Resilience API')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-sync on mount, on state changes, and automatically every 5 seconds
  useEffect(() => {
    fetchBackendData()
    const autoSyncInterval = setInterval(() => {
      fetchBackendData()
    }, 5000)

    return () => clearInterval(autoSyncInterval)
  }, [incident?.is_active, incident?.source_asset_id, resilience?.overall_score, fetchBackendData])

  // --------------------------------------------------------------------------
  // 4. Subsystem Categorization & Data Synthesis
  // --------------------------------------------------------------------------
  const classifyAssetSubsystem = useCallback((asset) => {
    const type = (asset?.type || '').toLowerCase()
    const id = (asset?.id || '').toLowerCase()

    if (type.includes('grid') || type.includes('transformer') || type.includes('generator') || type.includes('ups') || type.includes('bus') || id.includes('grid') || id.includes('gen') || id.includes('trans') || id.includes('bus') || id.includes('ups')) {
      return { key: 'electrical', name: 'Electrical Power', icon: Zap, color: '#00F0FF' }
    }
    if (type.includes('chiller') || type.includes('hvac') || type.includes('cooling') || id.includes('chiller') || id.includes('ahu')) {
      return { key: 'hvac', name: 'Thermal & HVAC', icon: Flame, color: '#FFB800' }
    }
    if (type.includes('oxygen') || type.includes('gas') || type.includes('vacuum') || id.includes('oxygen') || id.includes('gas') || id.includes('med_air')) {
      return { key: 'medgas', name: 'Medical Gas', icon: Wind, color: '#00E5A3' }
    }
    if (type.includes('water') || type.includes('pump') || id.includes('water') || id.includes('tank')) {
      return { key: 'water', name: 'Water & Hydraulic', icon: Droplets, color: '#00A3FF' }
    }
    return { key: 'electrical', name: 'General Infra', icon: Layers, color: '#A855F7' }
  }, [])

  // Map of asset risk assessments from backend or computed fallback
  const assetRisksMap = useMemo(() => {
    if (riskSummary?.asset_risks && Object.keys(riskSummary.asset_risks).length > 0) {
      return riskSummary.asset_risks
    }
    const map = {}
    assets.forEach((a) => {
      const isFailed = a.status === 'failed'
      const isDegraded = a.status === 'degraded' || a.status === 'critical'
      const currentLoad = typeof a.current_load === 'number' ? a.current_load : 0
      const availCap = typeof a.available_capacity === 'number' && a.available_capacity > 0 ? a.available_capacity : (a.nominal_capacity || 100)
      const utilPct = Math.min(150, Math.round((currentLoad / availCap) * 100))

      let score = isFailed ? 1.0 : isDegraded ? 0.65 : utilPct > 90 ? 0.55 : utilPct > 75 ? 0.28 : 0.08
      let level = score >= 0.75 ? 'critical' : score >= 0.50 ? 'high' : score >= 0.25 ? 'medium' : 'low'

      map[a.id] = {
        asset_id: a.id,
        asset_name: a.name || a.id,
        asset_type: a.type || 'INFRASTRUCTURE',
        operational_status: a.status || 'normal',
        risk_score: score,
        risk_percentage: Math.round(score * 100),
        risk_level: level,
        capacity_utilization_pct: utilPct,
        redundancy_level: a.redundancy_level || (a.id === 'TRANSFORMER_01' || a.id === 'GEN_01' ? 2 : 1),
        violations: isFailed ? [{
          metric: 'operational_status',
          current_value: 0,
          threshold_limit: 1,
          violation_type: 'offline_standby',
          severity: 'critical',
          description: `Asset ${a.name || a.id} is offline/failed`
        }] : utilPct > 100 ? [{
          metric: 'current_load',
          current_value: currentLoad,
          threshold_limit: availCap,
          violation_type: 'capacity_overload',
          severity: 'high',
          description: `Load (${currentLoad}kW) exceeds capacity (${availCap}kW)`
        }] : [],
        contributing_factors: isFailed ? ['Physical component trip / severed line', 'Cascading loss of downstream feeder'] : []
      }
    })
    return map
  }, [riskSummary, assets])

  // Map of service risk assessments from backend or fallback
  const serviceRisksMap = useMemo(() => {
    if (riskSummary?.service_risks && Object.keys(riskSummary.service_risks).length > 0) {
      return riskSummary.service_risks
    }
    const map = {}
    services.forEach((s) => {
      const isComp = s.status === 'compromised'
      const isRed = s.status === 'reduced_capacity' || s.at_risk
      const cont = typeof s.service_continuity_pct === 'number' ? s.service_continuity_pct : 100
      let score = isComp ? 0.78 : isRed ? 0.48 : (100 - cont) / 100
      let level = score >= 0.75 ? 'critical' : score >= 0.50 ? 'high' : score >= 0.25 ? 'medium' : 'low'

      map[s.id] = {
        service_id: s.id,
        service_name: s.name || s.id,
        service_type: s.type || 'CLINICAL',
        criticality: s.criticality || (s.id === 'SERVICE_ICU' || s.id === 'SERVICE_OT' ? 5 : 3),
        service_status: s.status || 'full_operation',
        risk_score: score,
        risk_percentage: Math.round(score * 100),
        risk_level: level,
        service_continuity_pct: cont,
        primary_vulnerability: s.risk_reason || (isComp ? 'Loss of primary power & environmental HVAC feed' : 'Nominal operational status'),
        risk_reasons: s.risk_reason ? [s.risk_reason] : ['Nominal operational condition']
      }
    })
    return map
  }, [riskSummary, services])

  // Merged Assets with Subsystems & Risk
  const enrichedAssets = useMemo(() => {
    return assets.map((asset) => {
      const risk = assetRisksMap[asset.id] || {
        risk_score: 0.05,
        risk_percentage: 5,
        risk_level: 'low',
        capacity_utilization_pct: 0,
        violations: []
      }
      const subsystem = classifyAssetSubsystem(asset)
      return {
        ...asset,
        risk,
        subsystem
      }
    })
  }, [assets, assetRisksMap, classifyAssetSubsystem])

  // Filtered Assets for Table
  const filteredTableAssets = useMemo(() => {
    return enrichedAssets.filter((a) => {
      if (assetSubsystemFilter !== 'all' && a.subsystem.key !== assetSubsystemFilter) {
        return false
      }
      if (assetSearchQuery.trim()) {
        const q = assetSearchQuery.toLowerCase()
        const matchName = (a.name || '').toLowerCase().includes(q)
        const matchId = (a.id || '').toLowerCase().includes(q)
        const matchSys = (a.subsystem.name || '').toLowerCase().includes(q)
        if (!matchName && !matchId && !matchSys) return false
      }
      return true
    })
  }, [enrichedAssets, assetSubsystemFilter, assetSearchQuery])

  // Filtered Services based on Filter
  const enrichedServices = useMemo(() => {
    return services.map((srv) => {
      const risk = serviceRisksMap[srv.id] || {
        risk_score: 0.05,
        risk_percentage: 5,
        risk_level: 'low',
        service_continuity_pct: srv.service_continuity_pct || 100
      }
      return {
        ...srv,
        risk
      }
    })
  }, [services, serviceRisksMap])

  const filteredServices = useMemo(() => {
    return enrichedServices.filter((s) => {
      if (serviceFilter === 'critical' && (s.criticality || 3) < 4) {
        return false
      }
      return true
    })
  }, [enrichedServices, serviceFilter])

  // --------------------------------------------------------------------------
  // 5. Computed KPI Summary Values
  // --------------------------------------------------------------------------
  const overallResilienceScore = typeof resilienceBreakdown?.overall_score === 'number'
    ? Math.round(resilienceBreakdown.overall_score)
    : typeof resilience?.overall_score === 'number'
    ? Math.round(resilience.overall_score)
    : 82

  const resilienceStatusLabel = resilienceBreakdown?.status_label || resilience?.status_label || (overallResilienceScore >= 80 ? 'OPTIMAL' : overallResilienceScore >= 60 ? 'STABLE' : overallResilienceScore >= 40 ? 'DEGRADED' : 'CRITICAL')

  const overallRiskScore = typeof riskSummary?.overall_risk_percentage === 'number'
    ? Math.round(riskSummary.overall_risk_percentage)
    : typeof riskSummary?.overall_risk_score === 'number'
    ? Math.round(riskSummary.overall_risk_score * 100)
    : Math.max(0, 100 - overallResilienceScore)

  const overallRiskLevel = (riskSummary?.overall_risk_level || (overallRiskScore >= 75 ? 'critical' : overallRiskScore >= 50 ? 'high' : overallRiskScore >= 25 ? 'medium' : 'low')).toUpperCase()

  const highRiskCount = useMemo(() => {
    return Object.values(assetRisksMap).filter((r) => r.risk_level === 'critical' || r.risk_level === 'high').length
  }, [assetRisksMap])

  const mediumRiskCount = useMemo(() => {
    return Object.values(assetRisksMap).filter((r) => r.risk_level === 'medium').length
  }, [assetRisksMap])

  const criticalServicesAtRiskCount = useMemo(() => {
    if (riskSummary?.critical_services_at_risk) {
      return riskSummary.critical_services_at_risk.length
    }
    return Object.values(serviceRisksMap).filter((r) => (r.criticality >= 4 && (r.risk_level === 'critical' || r.risk_level === 'high' || r.service_status === 'compromised'))).length
  }, [riskSummary, serviceRisksMap])

  const totalCriticalServicesCount = useMemo(() => {
    return services.filter((s) => (s.criticality || 3) >= 4).length || 5
  }, [services])

  const totalViolationsCount = useMemo(() => {
    let count = 0
    Object.values(assetRisksMap).forEach((r) => {
      if (Array.isArray(r.violations)) count += r.violations.length
    })
    return count
  }, [assetRisksMap])

  const imminentCrossings = useMemo(() => {
    if (Array.isArray(riskSummary?.imminent_threshold_crossings)) {
      return riskSummary.imminent_threshold_crossings
    }
    const list = []
    if (incident?.is_active) {
      Object.values(assetRisksMap).forEach((a) => {
        if (a.time_to_threshold && (a.time_to_threshold.is_critical || a.time_to_threshold.estimated_time_remaining_min <= 15)) {
          list.push(a.time_to_threshold)
        }
      })
    }
    return list
  }, [riskSummary, assetRisksMap, incident?.is_active])

  // Top 6 KPI Cards Configuration (Clear, non-truncated titles)
  const kpiCards = [
    {
      id: 'kpi_resilience',
      name: 'Resilience Index',
      val: `${overallResilienceScore} / 100`,
      badge: resilienceStatusLabel,
      trend: resilienceBreakdown?.delta_from_baseline !== undefined ? `${resilienceBreakdown.delta_from_baseline >= 0 ? '↑' : '↓'} ${Math.abs(resilienceBreakdown.delta_from_baseline).toFixed(1)}%` : 'Baseline',
      trendClass: (resilienceBreakdown?.delta_from_baseline || 0) >= 0 ? 'trend-up' : 'trend-down',
      icon: ShieldCheck,
      iconColor: overallResilienceScore >= 75 ? '#00F0FF' : overallResilienceScore >= 50 ? '#FFB800' : '#FF4D4D',
      sparkColor: '#00F0FF',
      sparkPoints: '0,22 20,20 40,24 60,18 80,16 100,12 120,10'
    },
    {
      id: 'kpi_overall_risk',
      name: 'Campus Risk',
      val: `${overallRiskScore}%`,
      badge: overallRiskLevel,
      trend: overallRiskScore > 40 ? 'Elevated' : 'Nominal',
      trendClass: overallRiskScore > 40 ? 'trend-down' : 'trend-up',
      icon: ShieldAlert,
      iconColor: overallRiskScore >= 75 ? '#FF4D4D' : overallRiskScore >= 40 ? '#FFB800' : '#00E5A3',
      sparkColor: overallRiskScore >= 50 ? '#FF4D4D' : '#00E5A3',
      sparkPoints: '0,10 20,14 40,12 60,20 80,24 100,28 120,30'
    },
    {
      id: 'kpi_high_risk_assets',
      name: 'High Risk Assets',
      val: `${highRiskCount}`,
      badge: highRiskCount > 0 ? 'Action Req' : 'Normal',
      trend: highRiskCount > 0 ? `↑ ${highRiskCount} alert` : 'Stable',
      trendClass: highRiskCount > 0 ? 'trend-down' : 'trend-up',
      icon: AlertTriangle,
      iconColor: '#FF4D4D',
      sparkColor: '#FF4D4D',
      sparkPoints: '0,18 20,20 40,16 60,22 80,18 100,24 120,26'
    },
    {
      id: 'kpi_med_risk_assets',
      name: 'Medium Risk',
      val: `${mediumRiskCount}`,
      badge: `${mediumRiskCount} assets`,
      trend: 'Watchlist',
      trendClass: 'trend-neutral',
      icon: AlertOctagon,
      iconColor: '#FFB800',
      sparkColor: '#FFB800',
      sparkPoints: '0,14 20,16 40,18 60,16 80,20 100,18 120,15'
    },
    {
      id: 'kpi_crit_services',
      name: 'Critical Services',
      val: `${criticalServicesAtRiskCount} / ${totalCriticalServicesCount}`,
      badge: criticalServicesAtRiskCount > 0 ? 'Compromised' : 'Secured',
      trend: criticalServicesAtRiskCount > 0 ? 'Critical' : 'Nominal',
      trendClass: criticalServicesAtRiskCount > 0 ? 'trend-down' : 'trend-up',
      icon: HeartPulse,
      iconColor: criticalServicesAtRiskCount > 0 ? '#FF4D4D' : '#00A3FF',
      sparkColor: '#00A3FF',
      sparkPoints: '0,18 20,18 40,18 60,20 80,18 100,22 120,22'
    },
    {
      id: 'kpi_violations',
      name: 'Threshold Alerts',
      val: `${totalViolationsCount + imminentCrossings.length}`,
      badge: imminentCrossings.length > 0 ? `${imminentCrossings.length} Imminent` : 'Guarded',
      trend: imminentCrossings.length > 0 ? 'Depletion Risk' : 'Healthy',
      trendClass: imminentCrossings.length > 0 ? 'trend-down' : 'trend-up',
      icon: Clock,
      iconColor: imminentCrossings.length > 0 ? '#FF4D4D' : '#00E5A3',
      sparkColor: '#FF4D4D',
      sparkPoints: '0,10 20,12 40,14 60,18 80,16 100,20 120,24'
    }
  ]

  // --------------------------------------------------------------------------
  // 6. Sub-Score / Canonical Components Data
  // --------------------------------------------------------------------------
  const subScores = resilienceBreakdown?.sub_scores || resilience?.sub_scores || {
    service_continuity: 88,
    stability_factor: 85,
    backup_margin: 80,
    recovery_readiness: 75,
    resource_conservation: 90
  }

  const canonicalTerms = resilienceBreakdown?.sub_scores?.canonical || {
    c_continuity: (subScores.service_continuity || 88) / 100,
    a_availability: (subScores.stability_factor || 85) / 100,
    b_backup_margin: (subScores.backup_margin || 80) / 100,
    t_recovery_penalty: 1 - ((subScores.recovery_readiness || 75) / 100),
    u_resource_penalty: 1 - ((subScores.resource_conservation || 90) / 100),
    raw_score: overallResilienceScore
  }

  // --------------------------------------------------------------------------
  // 7. Dynamic Donut Calculation
  // --------------------------------------------------------------------------
  const donutData = useMemo(() => {
    const total = assets.length || 1
    if (riskDistFilter === 'severity') {
      const counts = {
        critical: Object.values(assetRisksMap).filter((r) => r.risk_level === 'critical').length,
        high: Object.values(assetRisksMap).filter((r) => r.risk_level === 'high').length,
        medium: Object.values(assetRisksMap).filter((r) => r.risk_level === 'medium').length,
        low: Object.values(assetRisksMap).filter((r) => r.risk_level === 'low').length
      }
      return [
        { label: 'Critical Risk', count: counts.critical, pct: Math.round((counts.critical / total) * 100), color: '#FF4D4D' },
        { label: 'High Risk', count: counts.high, pct: Math.round((counts.high / total) * 100), color: '#FF7338' },
        { label: 'Medium Risk', count: counts.medium, pct: Math.round((counts.medium / total) * 100), color: '#FFB800' },
        { label: 'Low / Normal', count: counts.low, pct: Math.round((counts.low / total) * 100), color: '#00E5A3' }
      ]
    } else {
      const sysCounts = { electrical: 0, hvac: 0, medgas: 0, water: 0 }
      enrichedAssets.forEach((a) => {
        if (sysCounts[a.subsystem.key] !== undefined) sysCounts[a.subsystem.key]++
        else sysCounts.electrical++
      })
      return [
        { label: 'Electrical Power', count: sysCounts.electrical, pct: Math.round((sysCounts.electrical / total) * 100), color: '#00F0FF' },
        { label: 'Thermal HVAC', count: sysCounts.hvac, pct: Math.round((sysCounts.hvac / total) * 100), color: '#FFB800' },
        { label: 'Medical Gas', count: sysCounts.medgas, pct: Math.round((sysCounts.medgas / total) * 100), color: '#00E5A3' },
        { label: 'Water Infrastructure', count: sysCounts.water, pct: Math.round((sysCounts.water / total) * 100), color: '#00A3FF' }
      ]
    }
  }, [riskDistFilter, assets.length, assetRisksMap, enrichedAssets])

  // Ranked Top Risk Assets
  const topRiskAssets = useMemo(() => {
    return [...filteredTableAssets]
      .sort((a, b) => (b.risk?.risk_score || 0) - (a.risk?.risk_score || 0))
  }, [filteredTableAssets])

  // Ranked Service Overview
  const topRiskServices = useMemo(() => {
    return [...filteredServices]
      .sort((a, b) => (b.risk?.risk_score || 0) - (a.risk?.risk_score || 0))
  }, [filteredServices])

  return (
    <div className="risk-resilience-page">
      {/* --------------------------------------------------------------------
          A. DISCREET LIVE STATUS BAR (Clean, non-intrusive auto-sync badge)
          -------------------------------------------------------------------- */}
      <div className="risk-live-status-bar">
        <div className="live-status-left font-mono">
          <span className={`live-pulse-dot ${apiError ? 'is-error' : 'is-connected'}`} />
          <span className="live-status-label">
            {apiError ? 'CACHE FALLBACK' : 'AUTONOMOUS FASTAPI SYNC ACTIVE'}
          </span>
        </div>
        {lastSyncedAt && (
          <span className="live-status-timestamp font-mono">
            Last auto-refresh: {lastSyncedAt.toLocaleTimeString()}
          </span>
        )}
      </div>

      {/* --------------------------------------------------------------------
          B. AI THREAT NARRATIVE (Only when incident active or risk elevated)
          -------------------------------------------------------------------- */}
      {(incident?.is_active || overallRiskScore >= 25 || imminentCrossings.length > 0) && (
        <section className={`risk-threat-narrative-banner ${overallRiskScore >= 50 ? 'banner-alert' : 'banner-info'}`}>
          <div className="threat-banner-left">
            <div className="threat-shield-glow">
              <Sparkles size={18} className="threat-sparkle-icon" />
            </div>
            <div className="threat-narrative-content">
              <div className="threat-narrative-title-row">
                <span className="threat-badge font-mono">
                  {overallRiskScore >= 40 || incident?.is_active ? 'AI RISK SYNTHESIS' : 'SYSTEM STATUS: NOMINAL'}
                </span>
                {(overallRiskScore >= 25 || incident?.is_active) && riskSummary?.highest_risk_asset && (
                  <span className="threat-tag tag-asset" onClick={() => {
                    const a = assets.find((x) => x.id === riskSummary.highest_risk_asset)
                    if (a) setInspectedItem({ type: 'asset', id: a.id, data: a })
                  }}>
                    Primary Threat: <strong>{riskSummary.highest_risk_asset}</strong>
                  </span>
                )}
                {(overallRiskScore >= 25 || incident?.is_active) && riskSummary?.highest_risk_service && (
                  <span className="threat-tag tag-service" onClick={() => {
                    const s = services.find((x) => x.id === riskSummary.highest_risk_service)
                    if (s) setInspectedItem({ type: 'service', id: s.id, data: s })
                  }}>
                    Vulnerable Service: <strong>{riskSummary.highest_risk_service}</strong>
                  </span>
                )}
              </div>
              <p className="threat-narrative-text">
                {riskSummary?.summary_narrative ||
                  (incident?.is_active
                    ? `Active incident on ${incident.source_asset_id || 'infrastructure'}. Cascading dependencies propagate across secondary distribution buses and clinical wings.`
                    : 'All infrastructure headers operating within nominal thermal, electrical, and pressure stability envelopes. Composite resilience baseline intact.')}
              </p>
            </div>
          </div>

          {/* Imminent Threshold Alerts Strip */}
          {imminentCrossings.length > 0 && (
            <div className="imminent-crossings-strip">
              <span className="imminent-label font-mono">
                <AlertTriangle size={12} /> IMMINENT DEPLETION:
              </span>
              <div className="imminent-items-row">
                {imminentCrossings.map((cross, idx) => (
                  <div key={idx} className="imminent-item-chip font-mono">
                    <span className="imm-asset">{cross.asset_id}</span>
                    <span className="imm-metric">{cross.metric_name}</span>
                    <span className="imm-time">
                      ⏱ {cross.estimated_time_remaining_min.toFixed(1)}m remaining
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* --------------------------------------------------------------------
          1. TOP 6 KPI CARDS (Live Dynamic Metrics, non-truncated titles)
          -------------------------------------------------------------------- */}
      <section className="risk-top-kpis-grid">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.id} className="risk-kpi-card">
              <div className="risk-kpi-left">
                <div className="risk-kpi-icon-wrap" style={{ color: kpi.iconColor, borderColor: `${kpi.iconColor}44` }}>
                  <Icon size={16} />
                </div>
                <div className="risk-kpi-meta">
                  <span className="risk-kpi-name">{kpi.name}</span>
                  <div className="risk-kpi-val-row">
                    <span className="risk-kpi-val font-mono">{kpi.val}</span>
                    <span className={`risk-kpi-badge font-mono ${kpi.trendClass}`}>
                      {kpi.badge}
                    </span>
                  </div>
                  <span className={`risk-kpi-trend font-mono ${kpi.trendClass}`}>
                    {kpi.trend}
                  </span>
                </div>
              </div>

              <div className="risk-kpi-sparkline-wrap">
                <svg className="risk-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={kpi.sparkColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={kpi.sparkPoints}
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </section>

      {/* --------------------------------------------------------------------
          2. MIDDLE SECTION: Card 1 (Risk Distribution Donut) & Card 2 (Resilience Components Breakdown)
          -------------------------------------------------------------------- */}
      <section className="risk-middle-grid">
        {/* Card 1: Risk Distribution Donut */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <span className="risk-panel-title">1. Campus Risk Distribution</span>
            <select
              className="panel-select font-mono"
              value={riskDistFilter}
              onChange={(e) => setRiskDistFilter(e.target.value)}
            >
              <option value="severity">By Severity Level</option>
              <option value="subsystem">By Subsystem</option>
            </select>
          </div>

          <div className="risk-donut-split">
            <div className="donut-wrap">
              <svg className="donut-svg" viewBox="0 0 100 100">
                {/* Background track circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  strokeWidth="11"
                  stroke="var(--bg-primary)"
                  fill="none"
                />
                {(() => {
                  let accumulatedOffset = 0
                  const totalCirc = 226.195
                  const activeSlices = donutData.filter((item) => item.pct > 0)

                  // If single slice dominates (e.g. 100% normal)
                  if (activeSlices.length === 1) {
                    return (
                      <circle
                        className="donut-arc"
                        cx="50"
                        cy="50"
                        r="36"
                        strokeWidth="11"
                        stroke={activeSlices[0].color}
                        fill="none"
                      />
                    )
                  }

                  return activeSlices.map((item, i) => {
                    const arcLen = (item.pct / 100) * totalCirc
                    const dashArray = `${arcLen} ${totalCirc - arcLen}`
                    const currentOffset = accumulatedOffset
                    accumulatedOffset -= arcLen
                    return (
                      <circle
                        key={i}
                        className="donut-arc"
                        cx="50"
                        cy="50"
                        r="36"
                        strokeWidth="11"
                        stroke={item.color}
                        strokeDasharray={dashArray}
                        strokeDashoffset={currentOffset}
                        fill="none"
                      />
                    )
                  })
                })()}
              </svg>
              <div className="donut-center-meta">
                <span className="donut-big-num font-mono">{assets.length || 0}</span>
                <span className="donut-sub-txt">Nodes</span>
              </div>
            </div>

            <div className="donut-legend-col font-mono">
              {donutData.map((item, idx) => (
                <div key={idx} className="d-leg-row">
                  <div className="d-leg-left">
                    <span className="d-dot" style={{ backgroundColor: item.color }} />
                    <span>{item.label}</span>
                  </div>
                  <span className="d-val" style={{ color: item.color }}>
                    {item.count} ({item.pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Card 2: Canonical Resilience Components Breakdown (Dials & Formula) */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <div className="title-with-info">
              <span className="risk-panel-title">2. Resilience Components Breakdown</span>
              <Info size={12} className="panel-info-icon" title="Canonical composite formulation: R = 100 * (w1*C + w2*A + w3*B - w4*T_norm - w5*U_norm)" />
            </div>
            <div className="view-mode-toggle-mini">
              <button
                type="button"
                className={`v-btn-mini ${resilienceDisplayMode === 'gauges' ? 'is-active' : ''}`}
                onClick={() => setResilienceDisplayMode('gauges')}
              >
                Gauges
              </button>
              <button
                type="button"
                className={`v-btn-mini ${resilienceDisplayMode === 'formula' ? 'is-active' : ''}`}
                onClick={() => setResilienceDisplayMode('formula')}
              >
                Formula Terms
              </button>
            </div>
          </div>

          {resilienceDisplayMode === 'gauges' ? (
            <div className="resilience-components-dials-row">
              {/* Dial 1: Service Continuity (Sc = 100 * C) 40% Weight */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (Math.min(100, subScores.service_continuity || 0) / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">{Math.round(subScores.service_continuity || 0)}</span>
                </div>
                <span className="r-dial-lbl">Service (C)<br /><strong>40% Wt</strong></span>
              </div>

              {/* Dial 2: Infrastructure Availability (Ap = 100 * A) 20% Weight */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00A3FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (Math.min(100, subScores.stability_factor || 0) / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">{Math.round(subScores.stability_factor || 0)}</span>
                </div>
                <span className="r-dial-lbl">Availability (A)<br /><strong>20% Wt</strong></span>
              </div>

              {/* Dial 3: Backup Margin (Rb = 100 * B) 25% Weight */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00E5A3"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (Math.min(100, subScores.backup_margin || 0) / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">{Math.round(subScores.backup_margin || 0)}</span>
                </div>
                <span className="r-dial-lbl">Backup (B)<br /><strong>25% Wt</strong></span>
              </div>

              {/* Dial 4: Recovery Readiness (Lr = 100 * (1 - T_norm)) 15% Weight */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#A855F7"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (Math.min(100, subScores.recovery_readiness || 0) / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">{Math.round(subScores.recovery_readiness || 0)}</span>
                </div>
                <span className="r-dial-lbl">Recovery (T)<br /><strong>15% Wt</strong></span>
              </div>

              {/* Dial 5: Resource Conservation (100 * (1 - U_norm)) */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#FFB800"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (Math.min(100, subScores.resource_conservation || 0) / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">{Math.round(subScores.resource_conservation || 0)}</span>
                </div>
                <span className="r-dial-lbl">Conservation (U)<br /><strong>Reserve</strong></span>
              </div>
            </div>
          ) : (
            <div className="resilience-formula-breakdown font-mono">
              <div className="formula-box">
                <code>R = 100 · (0.40·C + 0.20·A + 0.25·B - 0.15·T_norm) = <strong>{overallResilienceScore}</strong></code>
              </div>
              <div className="canonical-terms-grid">
                <div className="term-card">
                  <span className="term-sym">C (Continuity)</span>
                  <span className="term-val font-bold">{(canonicalTerms.c_continuity || 0.88).toFixed(2)}</span>
                  <span className="term-wt">wt: 40%</span>
                </div>
                <div className="term-card">
                  <span className="term-sym">A (Availability)</span>
                  <span className="term-val font-bold">{(canonicalTerms.a_availability || 0.85).toFixed(2)}</span>
                  <span className="term-wt">wt: 20%</span>
                </div>
                <div className="term-card">
                  <span className="term-sym">B (Backup)</span>
                  <span className="term-val font-bold">{(canonicalTerms.b_backup_margin || 0.80).toFixed(2)}</span>
                  <span className="term-wt">wt: 25%</span>
                </div>
                <div className="term-card">
                  <span className="term-sym">T_norm (Penalty)</span>
                  <span className="term-val font-bold">{(canonicalTerms.t_recovery_penalty || 0.15).toFixed(2)}</span>
                  <span className="term-wt">wt: 15%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Card 3: Resilience & Risk Trend Multi-line Chart */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <span className="risk-panel-title">3. Resilience & Risk Timeline Trend</span>
            <select
              className="panel-select font-mono"
              value={trendTimeframe}
              onChange={(e) => setTrendTimeframe(e.target.value)}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="12h">Last 12 Hours</option>
              <option value="sim">Simulation Horizon</option>
            </select>
          </div>

          <div className="resilience-trend-chart-body">
            <div className="trend-y-axis font-mono">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="trend-svg-container">
              <svg className="trend-chart-svg" viewBox="0 0 200 90" preserveAspectRatio="none">
                <line x1="0" y1="5" x2="200" y2="5" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="26" x2="200" y2="26" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="48" x2="200" y2="48" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="69" x2="200" y2="69" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="200" y2="90" stroke="var(--border-subtle)" />

                {/* Overall Resilience Index (Cyan) */}
                <path
                  d="M0,20 C40,16 80,24 120,18 C160,20 180,14 200,16"
                  fill="none"
                  stroke="#00F0FF"
                  strokeWidth="2.2"
                />
                {/* Critical Service Continuity (Blue) */}
                <path
                  d="M0,26 C40,24 80,28 120,22 C160,24 180,18 200,20"
                  fill="none"
                  stroke="#00A3FF"
                  strokeWidth="1.6"
                />
                {/* Infrastructure Availability (Green) */}
                <path
                  d="M0,32 C40,30 80,36 120,30 C160,28 180,24 200,26"
                  fill="none"
                  stroke="#00E5A3"
                  strokeWidth="1.6"
                />
                {/* Backup Margin (Amber) */}
                <path
                  d="M0,42 C40,38 80,48 120,44 C160,40 180,36 200,38"
                  fill="none"
                  stroke="#FFB800"
                  strokeWidth="1.6"
                />
                {/* Campus Risk Index (Red) */}
                <path
                  d="M0,75 C40,80 80,68 120,74 C160,70 180,78 200,76"
                  fill="none"
                  stroke="#FF4D4D"
                  strokeWidth="1.8"
                  strokeDasharray="4 2"
                />
              </svg>
              <div className="trend-x-axis font-mono">
                <span>12AM</span>
                <span>4AM</span>
                <span>8AM</span>
                <span>12PM</span>
                <span>4PM</span>
                <span>8PM</span>
              </div>
            </div>

            <div className="trend-legend-list font-mono">
              <div><span className="dot" style={{ backgroundColor: '#00F0FF' }} /> Resilience (R)</div>
              <div><span className="dot" style={{ backgroundColor: '#00A3FF' }} /> Continuity (C)</div>
              <div><span className="dot" style={{ backgroundColor: '#00E5A3' }} /> Availability (A)</div>
              <div><span className="dot" style={{ backgroundColor: '#FFB800' }} /> Backup (B)</div>
              <div><span className="dot" style={{ backgroundColor: '#FF4D4D' }} /> Risk Threat</div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          3. EXPANDED LOWER SECTION: Infrastructure Assets Table & Service Vulnerability Table
          -------------------------------------------------------------------- */}
      <section className="risk-bottom-grid">
        {/* Card 4: Top Risk Infrastructure Assets Table */}
        <div className="risk-panel-card">
          <div className="panel-header-with-action">
            <div className="title-with-search">
              <span className="risk-panel-title">4. Infrastructure Assets Risk Ranking</span>
              <span className="table-count-badge font-mono">{filteredTableAssets.length} Modeled</span>
            </div>

            <div className="table-filter-toolbar">
              <div className="table-search-box">
                <Search size={10} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={assetSearchQuery}
                  onChange={(e) => setAssetSearchQuery(e.target.value)}
                  className="table-search-input font-mono"
                />
                {assetSearchQuery && (
                  <button type="button" className="clear-search-btn" onClick={() => setAssetSearchQuery('')}>
                    <X size={10} />
                  </button>
                )}
              </div>

              <select
                className="panel-select font-mono"
                value={assetSubsystemFilter}
                onChange={(e) => setAssetSubsystemFilter(e.target.value)}
              >
                <option value="all">All Systems</option>
                <option value="electrical">⚡ Power</option>
                <option value="hvac">❄️ HVAC</option>
                <option value="medgas">💨 MedGas</option>
                <option value="water">💧 Water</option>
              </select>
            </div>
          </div>

          <div className="risk-table-wrap">
            <table className="risk-table font-mono">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th className="th-left">Asset</th>
                  <th>System</th>
                  <th>Status</th>
                  <th>Risk Level</th>
                  <th>Risk Score</th>
                </tr>
              </thead>
              <tbody>
                {topRiskAssets.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-table-cell">No matching assets found.</td>
                  </tr>
                ) : (
                  topRiskAssets.map((item, idx) => {
                    const r = item.risk || {}
                    return (
                      <tr
                        key={item.id}
                        className="clickable-table-row"
                        onClick={() => setInspectedItem({ type: 'asset', id: item.id, data: item })}
                      >
                        <td className="font-bold">{idx + 1}</td>
                        <td className="td-left font-sans">
                          <div className="cell-with-icon">
                            <span className="cell-name">{item.name || item.id}</span>
                          </div>
                        </td>
                        <td>{item.subsystem.name}</td>
                        <td>
                          <span className={`status-pill pill-${item.status || 'normal'}`}>
                            {item.status || 'normal'}
                          </span>
                        </td>
                        <td>
                          <span className={`risk-badge badge-${r.risk_level || 'low'}`}>
                            {r.risk_level?.toUpperCase() || 'LOW'}
                          </span>
                        </td>
                        <td className="font-bold">{r.risk_percentage || 0}%</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Card 5: Service Risk Overview Table */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <span className="risk-panel-title">5. Clinical Service Vulnerability</span>
            <select
              className="panel-select font-mono"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">All Services ({services.length})</option>
              <option value="critical">Critical Only (Crit 4-5)</option>
            </select>
          </div>

          <div className="risk-table-wrap">
            <table className="risk-table font-mono">
              <thead>
                <tr>
                  <th className="th-left">Service</th>
                  <th>Criticality</th>
                  <th>Continuity</th>
                  <th>Status</th>
                  <th>Risk Level</th>
                </tr>
              </thead>
              <tbody>
                {topRiskServices.map((srv) => {
                  const r = srv.risk || {}
                  const isCrit = (srv.criticality || 3) >= 4
                  return (
                    <tr
                      key={srv.id}
                      className="clickable-table-row"
                      onClick={() => setInspectedItem({ type: 'service', id: srv.id, data: srv })}
                    >
                      <td className="td-left font-sans">
                        <div className="cell-with-icon">
                          <span className="cell-name">{srv.name || srv.id}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`crit-stars ${isCrit ? 'is-high-crit' : ''}`}>
                          {'★'.repeat(srv.criticality || 3)}
                        </span>
                      </td>
                      <td className="font-bold">
                        {Math.round(r.service_continuity_pct || srv.service_continuity_pct || 100)}%
                      </td>
                      <td>
                        <span className={`status-pill pill-${srv.status || 'full_operation'}`}>
                          {srv.status || 'full_operation'}
                        </span>
                      </td>
                      <td>
                        <span className={`risk-badge badge-${r.risk_level || 'low'}`}>
                          {r.risk_level?.toUpperCase() || 'LOW'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------------------------
          4. DEEP RISK INSPECTION MODAL (When clicking any asset or service)
          -------------------------------------------------------------------- */}
      {inspectedItem && (
        <div className="risk-modal-backdrop" onClick={() => setInspectedItem(null)}>
          <div className="risk-inspection-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-col">
                <span className="modal-category font-mono">
                  {inspectedItem.type === 'asset' ? 'INFRASTRUCTURE ASSET RISK ASSESSMENT' : 'CLINICAL SERVICE VULNERABILITY'}
                </span>
                <h3 className="modal-name">{inspectedItem.data?.name || inspectedItem.id}</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setInspectedItem(null)}
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body font-mono">
              {inspectedItem.type === 'asset' ? (
                <>
                  <div className="modal-stats-grid">
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Risk Score</span>
                      <span className={`m-s-val text-${inspectedItem.data?.risk?.risk_level || 'low'}`}>
                        {inspectedItem.data?.risk?.risk_percentage || 0}% ({inspectedItem.data?.risk?.risk_level?.toUpperCase() || 'LOW'})
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Operational Status</span>
                      <span className={`m-s-val status-${inspectedItem.data?.status || 'normal'}`}>
                        {inspectedItem.data?.status || 'normal'}
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Load / Capacity</span>
                      <span className="m-s-val">
                        {inspectedItem.data?.current_load || 0} / {inspectedItem.data?.available_capacity || inspectedItem.data?.nominal_capacity || 0} kW
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Redundancy Architecture</span>
                      <span className="m-s-val">
                        {inspectedItem.data?.risk?.redundancy_level > 1 ? `N+${inspectedItem.data.risk.redundancy_level - 1} Dual Feeder` : 'Single Point of Failure (SPOF)'}
                      </span>
                    </div>
                  </div>

                  <div className="modal-section-block">
                    <span className="m-sec-title">
                      <AlertTriangle size={12} /> Active Threshold Violations ({inspectedItem.data?.risk?.violations?.length || 0})
                    </span>
                    {inspectedItem.data?.risk?.violations && inspectedItem.data.risk.violations.length > 0 ? (
                      <div className="m-violations-list">
                        {inspectedItem.data.risk.violations.map((v, i) => (
                          <div key={i} className="m-violation-card">
                            <div className="mv-header">
                              <span className="mv-type">{v.violation_type}</span>
                              <span className={`mv-sev badge-${v.severity}`}>{v.severity?.toUpperCase()}</span>
                            </div>
                            <p className="mv-desc font-sans">{v.description}</p>
                            <div className="mv-meta">
                              <span>Observed: <strong>{v.current_value} {v.unit}</strong></span>
                              <span>Limit: <strong>{v.threshold_limit} {v.unit}</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="m-empty-note font-sans">
                        <CheckCircle2 size={14} className="text-good" /> No threshold violations detected. Operating within safety bounds.
                      </div>
                    )}
                  </div>

                  {inspectedItem.data?.risk?.contributing_factors && inspectedItem.data.risk.contributing_factors.length > 0 && (
                    <div className="modal-section-block">
                      <span className="m-sec-title">Contributing Risk Factors</span>
                      <ul className="m-factors-list font-sans">
                        {inspectedItem.data.risk.contributing_factors.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="modal-stats-grid">
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Risk Score</span>
                      <span className={`m-s-val text-${inspectedItem.data?.risk?.risk_level || 'low'}`}>
                        {inspectedItem.data?.risk?.risk_percentage || 0}% ({inspectedItem.data?.risk?.risk_level?.toUpperCase() || 'LOW'})
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Criticality Level</span>
                      <span className="m-s-val is-high-crit">
                        Level {inspectedItem.data?.criticality || 3} ({'★'.repeat(inspectedItem.data?.criticality || 3)})
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Delivery Continuity</span>
                      <span className="m-s-val">
                        {inspectedItem.data?.service_continuity_pct || 100}% Active
                      </span>
                    </div>
                    <div className="m-stat-card">
                      <span className="m-s-lbl">Service Status</span>
                      <span className={`m-s-val status-${inspectedItem.data?.status || 'full_operation'}`}>
                        {inspectedItem.data?.status || 'full_operation'}
                      </span>
                    </div>
                  </div>

                  <div className="modal-section-block">
                    <span className="m-sec-title">Primary Vulnerability & Dependency Analysis</span>
                    <div className="m-vulnerability-box font-sans">
                      <p><strong>Impact Assessment:</strong> {inspectedItem.data?.risk?.primary_vulnerability || 'Nominal upstream delivery.'}</p>
                      {inspectedItem.data?.risk?.estimated_blackout_time_min && (
                        <p className="blackout-warning font-mono">
                          ⏱ Estimated Secondary Buffer Exhaustion: <strong>{inspectedItem.data.risk.estimated_blackout_time_min} minutes</strong>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              {onNavigate && (
                <button
                  type="button"
                  className="modal-action-btn primary"
                  onClick={() => {
                    setInspectedItem(null)
                    onNavigate('what-if')
                  }}
                >
                  <Sliders size={12} /> Evaluate Mitigation in Strategy Lab
                </button>
              )}
              <button
                type="button"
                className="modal-action-btn secondary"
                onClick={() => setInspectedItem(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
