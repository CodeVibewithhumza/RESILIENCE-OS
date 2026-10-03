import { useState, useMemo, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Info,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Clock,
  Box,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Columns,
  Table
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import SimulationTelemetryTable from './SimulationTelemetryTable'
import { buildAssetsMap, buildTelemetryMatrixRows } from '../DigitalTwin3D/twinConstants'
import './StartSimulationView.css'

const CATEGORY_TILES = [
  {
    id: 'electrical',
    name: 'Electrical Failure',
    sub: 'Grid / Transformer / DG / UPS',
    icon: Zap,
    color: '#00F0FF'
  },
  {
    id: 'water',
    name: 'Water System',
    sub: 'Supply / Pump / Tank',
    icon: Droplets,
    color: '#00A3FF'
  },
  {
    id: 'hvac',
    name: 'HVAC System',
    sub: 'Chiller / AHU / Ducts',
    icon: Wind,
    color: '#14B8A6'
  },
  {
    id: 'gas',
    name: 'Medical Gas System',
    sub: 'Oxygen / Air / Vacuum',
    icon: Flame,
    color: '#A855F7'
  },
  {
    id: 'combined',
    name: 'Combined Scenario',
    sub: 'Multiple simultaneous failures',
    icon: AlertTriangle,
    color: '#FF4D4D'
  }
]

const INCIDENTS_BY_CATEGORY = {
  electrical: [
    {
      id: 'transformer',
      name: 'Primary Transformer Failure',
      desc: 'Loss of main transformer supply',
      asset_id: 'TRANSFORMER_01',
      failure_type: 'transformer_thermal_trip'
    },
    {
      id: 'grid',
      name: 'Grid Power Outage',
      desc: 'Loss of external grid supply',
      asset_id: 'GRID_MAIN',
      failure_type: 'complete_outage'
    },
    {
      id: 'gen',
      name: 'Generator Failure',
      desc: 'Backup generator fails to start',
      asset_id: 'GEN_01',
      failure_type: 'generator_failure'
    },
    {
      id: 'ups',
      name: 'UPS Battery Depletion',
      desc: 'UPS runtime exhausted',
      asset_id: 'UPS_CRITICAL',
      failure_type: 'battery_depletion'
    }
  ],
  water: [
    {
      id: 'water_pump',
      name: 'Booster Pump Cavitation',
      desc: 'Loss of potable water header pressure',
      asset_id: 'WATER_PUMP_STATION',
      failure_type: 'pump_cavitation'
    },
    {
      id: 'water_tank',
      name: 'Main Storage Tank Contamination',
      desc: 'Primary reservoir breach',
      asset_id: 'WATER_PUMP_STATION',
      failure_type: 'tank_contamination'
    }
  ],
  hvac: [
    {
      id: 'chiller_trip',
      name: 'HVAC Chiller Thermal Trip',
      desc: 'Loss of cleanroom surgical air cooling',
      asset_id: 'CHILLER_PLANT',
      failure_type: 'compressor_failure'
    }
  ],
  gas: [
    {
      id: 'o2_rupture',
      name: 'Cryogenic O2 Pipeline Rupture',
      desc: 'Pressure drop in main oxygen distribution line',
      asset_id: 'OXYGEN_MANIFOLD',
      failure_type: 'pressure_loss'
    }
  ],
  combined: [
    {
      id: 'combined_heatwave',
      name: 'Grid Blackout + DG Failure (Heatwave)',
      desc: 'Multi-system cascade with ambient heatwave stress',
      asset_id: 'GRID_MAIN',
      failure_type: 'lockout'
    }
  ]
}

export default function StartSimulationView({
  assets = [],
  services = [],
  incident = {},
  timeline = [],
  activeCheckpointIndex = 0,
  onSelectCheckpoint,
  onTriggerFailure,
  onReset,
  onNotify
}) {
  const [displayMode, setDisplayMode] = useState(() => {
    try {
      return localStorage.getItem('resilience_sim_display_mode') || 'split'
    } catch {
      return 'split'
    }
  })
  const handleSetDisplayMode = (mode) => {
    setDisplayMode(mode)
    try {
      localStorage.setItem('resilience_sim_display_mode', mode)
    } catch {}
  }
  const [selectedAssetId, setSelectedAssetId] = useState(null)

  // 1. Draggable Left Sidebar Resizer State (between configuration sidebar and 3D simulation area)
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('resilience_sim_left_sidebar_width')
      if (saved) {
        const val = parseFloat(saved)
        if (!isNaN(val) && val >= 240 && val <= 500) return val
      }
    } catch {}
    return 310
  })
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false)
  const isDraggingSidebarRef = useRef(false)
  const simMainGridRef = useRef(null)

  const handleSidebarPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingSidebarRef.current = true
    setIsDraggingSidebar(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleSidebarMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingSidebarRef.current = true
    setIsDraggingSidebar(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleSidebarTouchStart = (e) => {
    e.stopPropagation()
    isDraggingSidebarRef.current = true
    setIsDraggingSidebar(true)
  }

  // 2. Draggable Split-Pane Resizer State (User-controlled width for 3D Twin vs Telemetry Matrix)
  const [splitPercent, setSplitPercent] = useState(() => {
    try {
      const saved = localStorage.getItem('resilience_sim_split_ratio')
      if (saved) {
        const val = parseFloat(saved)
        if (!isNaN(val) && val >= 25 && val <= 75) return val
      }
    } catch {}
    return 56
  })
  const [isDraggingSplit, setIsDraggingSplit] = useState(false)
  const isDraggingRef = useRef(false)
  const splitWorkspaceRef = useRef(null)

  const handleSplitPointerDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDraggingSplit(true)
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleSplitMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDraggingSplit(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleSplitTouchStart = (e) => {
    e.stopPropagation()
    isDraggingRef.current = true
    setIsDraggingSplit(true)
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      // 1. Sidebar Resizer
      if (isDraggingSidebarRef.current && simMainGridRef.current) {
        const rect = simMainGridRef.current.getBoundingClientRect()
        if (rect && rect.width > 0) {
          const clientX =
            e.clientX !== undefined
              ? e.clientX
              : e.touches && e.touches[0]
              ? e.touches[0].clientX
              : undefined
          if (clientX !== undefined) {
            const rawWidth = clientX - rect.left
            const clampedWidth = Math.min(Math.max(rawWidth, 230), 480)
            setLeftSidebarWidth(Math.round(clampedWidth))
          }
        }
        return
      }

      // 2. Twin vs Matrix Resizer
      if (isDraggingRef.current && splitWorkspaceRef.current) {
        const rect = splitWorkspaceRef.current.getBoundingClientRect()
        if (!rect || rect.width <= 0) return

        const clientX =
          e.clientX !== undefined
            ? e.clientX
            : e.touches && e.touches[0]
            ? e.touches[0].clientX
            : undefined
        if (clientX === undefined) return

        const rawPct = ((clientX - rect.left) / rect.width) * 100
        const clampedPct = Math.min(Math.max(rawPct, 15), 85)
        setSplitPercent(Math.round(clampedPct * 10) / 10)
      }
    }

    const handlePointerUp = (e) => {
      if (isDraggingSidebarRef.current) {
        isDraggingSidebarRef.current = false
        setIsDraggingSidebar(false)
      }
      if (isDraggingRef.current) {
        isDraggingRef.current = false
        setIsDraggingSplit(false)
      }
      try {
        if (e?.pointerId !== undefined && e?.target?.hasPointerCapture?.(e.pointerId)) {
          e.target.releasePointerCapture(e.pointerId)
        }
      } catch {}
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
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
      localStorage.setItem('resilience_sim_split_ratio', splitPercent.toFixed(1))
    } catch {}
  }, [splitPercent])

function findCategoryAndIncident(incident) {
  if (!incident || !incident.is_active) return null

  if (incident.compound_heatwave) {
    return { category: 'combined', incidentId: 'combined_heatwave' }
  }

  const assetId = (incident.source_asset_id || '').toUpperCase()
  const failType = (incident.failure_type || '').toLowerCase()
  const title = (incident.title || '').toLowerCase()

  if (assetId.includes('GEN') || failType.includes('generator') || title.includes('generator')) {
    return { category: 'electrical', incidentId: 'gen' }
  }
  if (assetId.includes('GRID') || failType.includes('grid') || title.includes('grid')) {
    return { category: 'electrical', incidentId: 'grid' }
  }
  if (assetId.includes('UPS') || failType.includes('battery') || failType.includes('ups') || title.includes('ups') || title.includes('battery')) {
    return { category: 'electrical', incidentId: 'ups' }
  }
  if (assetId.includes('TRANSFORMER') || failType.includes('transformer') || title.includes('transformer')) {
    return { category: 'electrical', incidentId: 'transformer' }
  }
  if (assetId.includes('WATER') || failType.includes('water') || failType.includes('pump') || title.includes('water') || title.includes('pump')) {
    if (failType.includes('tank') || failType.includes('contamin') || title.includes('tank')) {
      return { category: 'water', incidentId: 'water_tank' }
    }
    return { category: 'water', incidentId: 'water_pump' }
  }
  if (assetId.includes('CHILLER') || assetId.includes('HVAC') || failType.includes('chiller') || failType.includes('hvac') || title.includes('chiller') || title.includes('hvac')) {
    return { category: 'hvac', incidentId: 'chiller_trip' }
  }
  if (assetId.includes('OXYGEN') || assetId.includes('GAS') || failType.includes('oxygen') || failType.includes('gas') || title.includes('oxygen') || title.includes('gas')) {
    return { category: 'gas', incidentId: 'o2_rupture' }
  }

  return null
}

  const matchedActive = useMemo(() => findCategoryAndIncident(incident), [incident])

  const [selectedCategory, setSelectedCategory] = useState(() => {
    return matchedActive?.category || 'electrical'
  })
  const [selectedIncident, setSelectedIncident] = useState(() => {
    return matchedActive?.incidentId || 'transformer'
  })

  // Synchronize category & incident selection whenever an active incident is running or changes
  useEffect(() => {
    if (matchedActive) {
      setSelectedCategory(matchedActive.category)
      setSelectedIncident(matchedActive.incidentId)
    }
  }, [matchedActive])

  const [severity, setSeverity] = useState('Full Failure')
  const [startTime, setStartTime] = useState('Immediate (T = 0)')
  const [duration, setDuration] = useState('2 Hours')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAutoStepping, setIsAutoStepping] = useState(false)

  const isIncidentActive = Boolean(incident?.is_active)
  const currentIncidentsList = INCIDENTS_BY_CATEGORY[selectedCategory] || INCIDENTS_BY_CATEGORY.electrical

  // Synchronized telemetry matrix state for Option A & Option B
  const assetsMap = useMemo(() => {
    return buildAssetsMap(assets, services, incident)
  }, [assets, services, incident])

  const matrixRows = useMemo(() => {
    return buildTelemetryMatrixRows(assetsMap, incident)
  }, [assetsMap, incident])

  const crisisAssetCount = useMemo(() => {
    return matrixRows.filter(
      (r) => r.status === 'failed' || r.status === 'critical' || r.status === 'degraded'
    ).length
  }, [matrixRows])

  // Auto-switch selected incident to match category
  const handleCategorySelect = (catId) => {
    setSelectedCategory(catId)
    const list = INCIDENTS_BY_CATEGORY[catId]
    if (list && list.length > 0) {
      setSelectedIncident(list[0].id)
    }
  }

  // Auto-play timeline progression loop when isAutoStepping is active
  useEffect(() => {
    if (!isAutoStepping || !isIncidentActive || !timeline || timeline.length === 0) return

    const timer = setInterval(() => {
      if (onSelectCheckpoint) {
        const nextIdx = (activeCheckpointIndex + 1) % timeline.length
        onSelectCheckpoint(nextIdx)
      }
    }, 3500)

    return () => clearInterval(timer)
  }, [isAutoStepping, isIncidentActive, timeline, activeCheckpointIndex, onSelectCheckpoint])

  // Launch Simulation handler
  const handleLaunch = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)

    const list = INCIDENTS_BY_CATEGORY[selectedCategory] || INCIDENTS_BY_CATEGORY.electrical
    const foundInc = list.find((i) => i.id === selectedIncident) || list[0]

    const payload = {
      asset_id: foundInc.asset_id,
      failure_type: foundInc.failure_type,
      severity: severity.toLowerCase().includes('full') ? 'high' : 'medium',
      duration_minutes: duration.includes('2') ? 120 : 60,
      compound_heatwave: selectedCategory === 'combined'
    }

    try {
      if (onTriggerFailure) {
        const res = await onTriggerFailure(payload)
        if (res && res.success) {
          setIsAutoStepping(true)
        }
      }
    } catch (err) {
      if (onNotify) {
        onNotify(`Simulation failed: ${err.message}`, 'error')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset simulation handler
  const handleResetClick = async () => {
    setIsAutoStepping(false)
    if (onReset) {
      await onReset()
    }
  }

  // Current selected asset matching user scenario choice
  const targetAssetId = useMemo(() => {
    const found = currentIncidentsList.find((i) => i.id === selectedIncident)
    return found?.asset_id || 'TRANSFORMER_01'
  }, [currentIncidentsList, selectedIncident])

  // Effective timeline items to render in the scrubber
  const timelineNodes = useMemo(() => {
    if (Array.isArray(timeline) && timeline.length > 0) {
      return timeline
    }
    return [
      { t_offset_min: 0, title: 'Failure Injected' },
      { t_offset_min: 2, title: 'ATS Transfer' },
      { t_offset_min: 5, title: 'Generator Start' },
      { t_offset_min: 10, title: 'Load Transfer' },
      { t_offset_min: 20, title: 'Service Impact' }
    ]
  }, [timeline])

  // Count active impact numbers
  const servicesAtRiskCount = services.filter((s) => s.at_risk).length || (isIncidentActive ? 2 : 0)
  const affectedAssetsCount = (incident?.affected_asset_ids?.length || 0) + (isIncidentActive ? 1 : 0)

  return (
    <div className="start-sim-page">
      {/* 1. TOP 5 CATEGORY TILES */}
      <section className="sim-categories-row">
        {CATEGORY_TILES.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          return (
            <div
              key={cat.id}
              className={`sim-cat-tile ${isActive ? 'is-active' : ''}`}
              onClick={() => handleCategorySelect(cat.id)}
            >
              <div className="sim-cat-icon-wrap" style={{ color: cat.color }}>
                <Icon size={18} />
              </div>
              <div className="sim-cat-text-col">
                <span className="sim-cat-name">{cat.name}</span>
                <span className="sim-cat-sub">{cat.sub}</span>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. MAIN SPLIT: Left Controls & Right 3D Visual + Timeline */}
      <section
        ref={simMainGridRef}
        className={`sim-main-grid ${isDraggingSidebar ? 'is-sidebar-resizing' : ''}`}
      >
        {/* Left Controls Column */}
        <aside
          className="sim-left-controls"
          style={{ width: `${leftSidebarWidth}px`, flex: `0 0 ${leftSidebarWidth}px` }}
        >
          {/* Section 1: Select Incident Scenario */}
          <div className="sim-panel-box">
            <div className="sim-panel-title">1. Select Incident Scenario</div>
            <div className="sim-incident-radio-list">
              {currentIncidentsList.map((inc) => {
                const isSelected = selectedIncident === inc.id
                return (
                  <div
                    key={inc.id}
                    className={`sim-radio-card ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedIncident(inc.id)}
                  >
                    <div className="sim-radio-left-icon">
                      {selectedCategory === 'electrical' && <Zap size={14} style={{ color: '#00F0FF' }} />}
                      {selectedCategory === 'water' && <Droplets size={14} style={{ color: '#00A3FF' }} />}
                      {selectedCategory === 'hvac' && <Wind size={14} style={{ color: '#14B8A6' }} />}
                      {selectedCategory === 'gas' && <Flame size={14} style={{ color: '#A855F7' }} />}
                      {selectedCategory === 'combined' && <AlertTriangle size={14} style={{ color: '#FF4D4D' }} />}
                    </div>
                    <div className="sim-radio-meta">
                      <span className="sim-radio-title">{inc.name}</span>
                      <span className="sim-radio-desc">{inc.desc}</span>
                    </div>
                    <span className="sim-radio-indicator" />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Section 2: Configure Parameters */}
          <div className="sim-panel-box">
            <div className="sim-panel-title">2. Configure Parameters</div>
            <div className="sim-params-form">
              <div className="sim-field-row">
                <span className="sim-field-lbl">Severity</span>
                <select
                  className="sim-select font-mono"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                >
                  <option value="Full Failure">Full Failure</option>
                  <option value="Partial (50%)">Partial (50%)</option>
                  <option value="Intermittent">Intermittent</option>
                </select>
              </div>

              <div className="sim-field-row">
                <span className="sim-field-lbl">Start Time</span>
                <select
                  className="sim-select font-mono"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                >
                  <option value="Immediate (T = 0)">Immediate (T = 0)</option>
                  <option value="T + 5 min">T + 5 min</option>
                  <option value="T + 15 min">T + 15 min</option>
                </select>
              </div>

              <div className="sim-field-row">
                <span className="sim-field-lbl">Duration</span>
                <select
                  className="sim-select font-mono"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="2 Hours">2 Hours</option>
                  <option value="1 Hour">1 Hour</option>
                  <option value="4 Hours">4 Hours</option>
                </select>
              </div>

              <button
                type="button"
                className="sim-advanced-link"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              >
                <ChevronRight size={12} className={isAdvancedOpen ? 'rotate-90' : ''} />
                <span>Advanced Parameters</span>
              </button>
            </div>
          </div>

          {/* Section 3: Run Simulation CTA */}
          <div className="sim-panel-box run-sim-box">
            <div className="sim-panel-title">3. Launch Simulation</div>
            {isIncidentActive ? (
              <div className="sim-active-control-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="sim-active-badge" style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="hud-dot dot-red" style={{ animation: 'pulse 1.5s infinite' }} />
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#EF4444' }}>Simulation Active ({incident.source_asset_id})</span>
                </div>
                <button
                  type="button"
                  className="sim-start-cta-btn"
                  style={{ background: '#10B981', borderColor: '#10B981' }}
                  onClick={handleResetClick}
                >
                  <RotateCcw size={16} />
                  <span>Restore Operational Baseline</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                className={`sim-start-cta-btn ${isSubmitting ? 'is-loading' : ''}`}
                onClick={handleLaunch}
                disabled={isSubmitting}
              >
                <Play size={16} fill="currentColor" />
                <span>{isSubmitting ? 'Simulating Cascade...' : 'Start Simulation'}</span>
              </button>
            )}
          </div>
        </aside>

        {/* Draggable Vertical Resizer Handle between Left Controls & Digital Twin Workspace */}
        <div
          className={`sim-sidebar-divider-handle ${isDraggingSidebar ? 'is-active' : ''}`}
          onPointerDown={handleSidebarPointerDown}
          onMouseDown={handleSidebarMouseDown}
          onTouchStart={handleSidebarTouchStart}
          onDoubleClick={() => setLeftSidebarWidth(310)}
          title="Drag left or right to resize configuration sidebar (Double-click to reset)"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="sim-split-accent-bar" />
          <div className="divider-grip-indicator">
            <span className="grip-dot" />
            <span className="grip-dot" />
            <span className="grip-dot" />
          </div>
        </div>

        {/* Right Main Area: 3D Visual + Timeline & Expected Impact */}
        <div className="sim-right-workspace">
          {/* Main Visual: Digital Twin Canvas + Dedicated External Telemetry Matrix */}
          <div className="sim-visual-card">
            <div className="sim-visual-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sim-visual-title">Live Digital Twin Simulation</span>
                {isIncidentActive && (
                  <span
                    style={{
                      fontSize: '10px',
                      background: '#EF4444',
                      color: '#fff',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontWeight: 700,
                      letterSpacing: '0.04em'
                    }}
                  >
                    DISRUPTION ACTIVE
                  </span>
                )}
              </div>

              {/* Option A: View Mode Switcher */}
              <div className="sim-view-mode-switcher">
                <button
                  type="button"
                  className={`sim-view-mode-btn ${displayMode === 'split' ? 'is-active' : ''}`}
                  onClick={() => handleSetDisplayMode('split')}
                  title="Side-by-Side: 3D Twin on Left + Telemetry Matrix on Right"
                >
                  <Columns size={13} />
                  <span>Split View</span>
                </button>

                <button
                  type="button"
                  className={`sim-view-mode-btn ${displayMode === 'twin' ? 'is-active' : ''}`}
                  onClick={() => handleSetDisplayMode('twin')}
                  title="Full-Width 3D Digital Twin View"
                >
                  <Box size={13} />
                  <span>3D Twin</span>
                </button>

                <button
                  type="button"
                  className={`sim-view-mode-btn ${displayMode === 'table' ? 'is-active' : ''}`}
                  onClick={() => handleSetDisplayMode('table')}
                  title="Full-Width Comprehensive Telemetry Matrix"
                >
                  <Table size={13} />
                  <span>Telemetry Table</span>
                  {crisisAssetCount > 0 && (
                    <span className="sim-mode-badge-counter">{crisisAssetCount}</span>
                  )}
                </button>
              </div>

              <div className="sim-status-legend">
                <span className="legend-item"><span className="leg-dot leg-normal" /> Normal</span>
                <span className="legend-item"><span className="leg-dot leg-degraded" /> Degraded</span>
                <span className="legend-item"><span className="leg-dot leg-failed" /> Failed</span>
                <span className="legend-item"><span className="leg-dot leg-backup" /> Backup</span>
              </div>
            </div>

            {/* Option B: Synchronized Layout Dispatcher with Draggable Splitter Handle */}
            {displayMode === 'split' && (
              <div
                ref={splitWorkspaceRef}
                className={`sim-split-workspace ${isDraggingSplit ? 'is-resizing' : ''}`}
              >
                {/* Left Resizable Column: 3D Digital Twin */}
                <div
                  className="sim-split-canvas-col"
                  style={{
                    width: `calc(${splitPercent}% - 9px)`,
                    flex: `0 0 calc(${splitPercent}% - 9px)`,
                    maxWidth: `calc(${splitPercent}% - 9px)`
                  }}
                >
                  <div className="sim-canvas-viewport is-split-mode">
                    <TwinContainer
                      assets={assets}
                      services={services}
                      incident={incident}
                      selectedAssetId={selectedAssetId}
                      onSelectAsset={setSelectedAssetId}
                      filterSubsystem="all"
                      hudMode={isIncidentActive ? 'alerts' : 'smart'}
                      autoOpenInspector={false}
                      enableInternalMatrix={false}
                    />
                  </div>
                </div>

                {/* Draggable Splitter Divider Handle Bar */}
                <div
                  className={`sim-split-divider-handle ${isDraggingSplit ? 'is-active' : ''}`}
                  onPointerDown={handleSplitPointerDown}
                  onMouseDown={handleSplitMouseDown}
                  onTouchStart={handleSplitTouchStart}
                  onDoubleClick={() => setSplitPercent(55)}
                  title="Drag left or right to resize panels (Double-click to reset)"
                  role="separator"
                  aria-orientation="vertical"
                  aria-valuenow={Math.round(splitPercent)}
                >
                  <div className="sim-split-accent-bar" />
                  <div className="divider-grip-indicator">
                    <span className="grip-dot" />
                    <span className="grip-dot" />
                    <span className="grip-dot" />
                  </div>
                </div>

                {/* Right Resizable Column: Telemetry Matrix */}
                <div
                  className="sim-split-table-col"
                  style={{
                    width: `calc(${100 - splitPercent}% - 9px)`,
                    flex: `0 0 calc(${100 - splitPercent}% - 9px)`,
                    maxWidth: `calc(${100 - splitPercent}% - 9px)`
                  }}
                >
                  <SimulationTelemetryTable
                    matrixRows={matrixRows}
                    crisisAssetCount={crisisAssetCount}
                    selectedAssetId={selectedAssetId}
                    onSelectAsset={setSelectedAssetId}
                    compactMode={true}
                  />
                </div>
              </div>
            )}

            {displayMode === 'twin' && (
              <div className="sim-canvas-viewport is-fullwidth">
                <TwinContainer
                  assets={assets}
                  services={services}
                  incident={incident}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                  filterSubsystem="all"
                  hudMode={isIncidentActive ? 'alerts' : 'smart'}
                  autoOpenInspector={false}
                  enableInternalMatrix={false}
                />
              </div>
            )}

            {displayMode === 'table' && (
              <div className="sim-table-fullscreen-wrap">
                <SimulationTelemetryTable
                  matrixRows={matrixRows}
                  crisisAssetCount={crisisAssetCount}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={setSelectedAssetId}
                  compactMode={false}
                />
              </div>
            )}
          </div>

          {/* Bottom Row: Simulation Timeline + Expected Impact Preview */}
          <div className="sim-bottom-row-grid">
            {/* Interactive Simulation Timeline track */}
            <div className="sim-timeline-box">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div className="sim-timeline-title">Simulation Timeline & Cascade Scrubbing</div>
                {isIncidentActive && (
                  <button
                    type="button"
                    onClick={() => setIsAutoStepping(!isAutoStepping)}
                    className="sim-autostep-btn"
                  >
                    {isAutoStepping ? <Pause size={11} /> : <Play size={11} fill="currentColor" />}
                    <span>{isAutoStepping ? 'Pause Auto-Step' : 'Auto-Step Sequence'}</span>
                  </button>
                )}
              </div>

              <div className="sim-nodes-track">
                {/* Visual track progress line */}
                <div className="sim-track-progress-bar">
                  <div
                    className="sim-track-progress-fill"
                    style={{
                      width: `${(activeCheckpointIndex / Math.max(timelineNodes.length - 1, 1)) * 100}%`
                    }}
                  />
                </div>
                {timelineNodes.map((step, idx) => {
                  const isActive = idx === activeCheckpointIndex
                  const isPast = idx < activeCheckpointIndex
                  return (
                    <div
                      key={`step-${idx}`}
                      className={`sim-node-step ${isActive ? 'node-active' : ''} ${isPast ? 'node-past' : ''}`}
                      onClick={() => onSelectCheckpoint && onSelectCheckpoint(idx)}
                      title={`Jump to T+${step.t_offset_min} min milestone`}
                    >
                      <div className="node-dot-indicator">
                        <span className="node-dot" />
                      </div>
                      <span className="node-time font-mono">
                        T+{step.t_offset_min}m
                      </span>
                      <span className="node-label">
                        {step.title || `Milestone ${idx + 1}`}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Expected Impact (Preview) 3 KPI cards */}
            <div className="sim-expected-impact-box">
              <div className="impact-box-header">
                <span className="impact-box-title">Live Cascade Impact</span>
                <Info size={12} className="panel-info-icon" />
              </div>

              <div className="impact-cards-grid">
                <div className="impact-metric-card card-red">
                  <div className="impact-icon-wrap icon-red">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">{servicesAtRiskCount}</span>
                    <span className="impact-lbl">Services At Risk</span>
                  </div>
                </div>

                <div className="impact-metric-card card-gold">
                  <div className="impact-icon-wrap icon-gold">
                    <Box size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">{affectedAssetsCount}</span>
                    <span className="impact-lbl">Affected Assets</span>
                  </div>
                </div>

                <div className="impact-metric-card card-blue">
                  <div className="impact-icon-wrap icon-blue">
                    <Clock size={15} />
                  </div>
                  <div className="impact-metric-info">
                    <span className="impact-num font-mono">
                      {isIncidentActive ? `T+${timelineNodes[activeCheckpointIndex]?.t_offset_min || 0}m` : '0 min'}
                    </span>
                    <span className="impact-lbl">Active Time Offset</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
