import { useState, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import {
  Layers,
  Box,
  Thermometer,
  Gauge,
  Fuel,
  BatteryCharging,
  Clock,
  X,
  Compass,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Radio,
  Eye,
  Camera,
  ShieldCheck
} from 'lucide-react'
import {
  STATUS_COLORS,
  ASSET_TOPOLOGY_DEFS,
  DEPENDENCY_CONNECTIONS,
  ZONE_DEFINITIONS,
  CAMERA_PRESETS
} from './twinConstants'
import {
  SubstationPylon,
  TransformerUnit,
  SwitchgearRack,
  IndustrialGenerator,
  BatteryStorageRack,
  ChillerCoolingTower,
  CryoOxygenYard,
  HydroWaterPump
} from './EquipmentMeshes'
import './TwinContainer.css'

// ============================================================================
// 3D Subcomponents & VFX
// ============================================================================

/**
 * Animated Ground Selection Holographic Reticle & Light Beam
 */
function TargetReticle({ position = [0, 0, 0], status = 'normal' }) {
  const outerRingRef = useRef()
  const innerRingRef = useRef()
  const beamRef = useRef()
  const color = STATUS_COLORS[status] || '#00F0FF'

  useFrame((_, delta) => {
    if (outerRingRef.current) outerRingRef.current.rotation.z += delta * 1.5
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 2.2
  })

  return (
    <group position={position}>
      {/* Outer Hologram Ring */}
      <mesh ref={outerRingRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 1.55, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Inner Fast Hologram Ring */}
      <mesh ref={innerRingRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 6]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>

      {/* Ground Projection Disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.15} />
      </mesh>

      {/* Vertical Hologram Beacon Light Pillar */}
      <mesh ref={beamRef} position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.08, 0.25, 4.5, 16, 1, true]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.2} />
      </mesh>
    </group>
  )
}

/**
 * Procedural Dynamic Conduit Energy Beam
 */
function DynamicEnergyBeam({ start, end, color = '#00F0FF', isSevered = false, isDegraded = false }) {
  const pulseRef = useRef()

  const { position, quaternion, length } = useMemo(() => {
    const p1 = new THREE.Vector3(...start)
    const p2 = new THREE.Vector3(...end)
    // Offset slightly above floor to connect at machinery bus level
    p1.y += 0.5
    p2.y += 0.5
    const mid = p1.clone().add(p2).multiplyScalar(0.5)
    const dir = p2.clone().sub(p1)
    const len = dir.length()
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())
    return { position: mid, quaternion: q, length: len }
  }, [start, end])

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime()
      if (isSevered) {
        pulseRef.current.opacity = 0.2 + Math.sin(t * 12) * 0.15
      } else if (isDegraded) {
        pulseRef.current.opacity = 0.5 + Math.sin(t * 6) * 0.3
      } else {
        pulseRef.current.opacity = 0.7 + Math.sin(t * 3) * 0.2
      }
    }
  })

  const beamColor = isSevered ? '#DC2626' : isDegraded ? '#F59E0B' : color

  return (
    <group position={position} quaternion={quaternion}>
      {/* Outer Glass Protective Conduit Sleeve */}
      <mesh>
        <cylinderGeometry args={[0.06, 0.06, length, 12]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.4}
        />
      </mesh>

      {/* Inner Glowing Laser / Energy Fluid Core */}
      <mesh>
        <cylinderGeometry args={[0.03, 0.03, length, 8]} />
        <meshBasicMaterial
          ref={pulseRef}
          color={beamColor}
          transparent
          opacity={isSevered ? 0.2 : 0.85}
        />
      </mesh>

      {/* Floating Sparkles along active healthy beams */}
      {!isSevered && (
        <pointLight
          position={[0, 0, 0]}
          color={beamColor}
          intensity={0.4}
          distance={2.5}
        />
      )}
    </group>
  )
}

/**
 * Subsystem Concrete Foundation Pads & Glowing Perimeter Lines
 */
function SubsystemFoundationZones() {
  return (
    <group>
      {ZONE_DEFINITIONS.map((zone) => {
        const [w, d] = zone.size
        return (
          <group key={zone.id} position={zone.center}>
            {/* Ground Plinth Foundation */}
            <mesh position={[0, -0.04, 0]}>
              <boxGeometry args={[w, 0.08, d]} />
              <meshStandardMaterial
                color="#0B1120"
                roughness={0.9}
                metalness={0.1}
              />
            </mesh>

            {/* Glowing Zone Perimeter Boundary Strip */}
            <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[w, d]} />
              <meshBasicMaterial
                color={zone.color}
                wireframe
                transparent
                opacity={0.18}
              />
            </mesh>

            {/* Corner Neon Accent Brackets */}
            {[-w / 2, w / 2].map((cx, i) =>
              [-d / 2, d / 2].map((cz, j) => (
                <mesh key={`corner-${i}-${j}`} position={[cx, 0.04, cz]}>
                  <boxGeometry args={[0.35, 0.08, 0.35]} />
                  <meshBasicMaterial color={zone.color} transparent opacity={0.6} />
                </mesh>
              ))
            )}
          </group>
        )
      })}
    </group>
  )
}

/**
 * Individual Node with Procedural Mesh and 3D Hologram HUD
 */
function InfrastructureAssetNode({
  asset,
  topoDef,
  isSelected,
  onSelect,
  showLabels = true
}) {
  const [hovered, setHovered] = useState(false)
  const status = asset?.status || 'normal'
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal
  const { position, meshType, label, subsystem } = topoDef

  const handlePointerOver = (e) => {
    e.stopPropagation()
    setHovered(true)
    document.body.style.cursor = 'pointer'
  }

  const handlePointerOut = () => {
    setHovered(false)
    document.body.style.cursor = 'auto'
  }

  const handleClick = (e) => {
    e.stopPropagation()
    onSelect(asset?.id || label)
  }

  // Derive quick primary telemetry reading
  const primaryTelemetry = useMemo(() => {
    if (!asset) return null
    if (asset.current_load != null && asset.capacity_unit) {
      return `${asset.current_load.toFixed(0)} ${asset.capacity_unit}`
    }
    if (asset.fuel_level_pct != null) return `${asset.fuel_level_pct}% Fuel`
    if (asset.battery_level_pct != null) return `${asset.battery_level_pct}% Bat`
    if (asset.temperature_c != null) return `${asset.temperature_c}°C`
    if (asset.pressure_psi != null) return `${asset.pressure_psi} PSI`
    return null
  }, [asset])

  return (
    <group position={position}>
      {/* Holographic Selection Reticle on Floor */}
      {isSelected && <TargetReticle position={[0, 0, 0]} status={status} />}

      {/* Interactive Mesh Hitbox & Procedural Equipment Model */}
      <group
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {meshType === 'substation' && (
          <SubstationPylon status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'transformer' && (
          <TransformerUnit
            status={status}
            isSelected={isSelected}
            hovered={hovered}
            isEmergency={label === 'TRANSFORMER_02'}
          />
        )}
        {meshType === 'switchgear' && (
          <SwitchgearRack
            status={status}
            isSelected={isSelected}
            hovered={hovered}
            isEmergency={label === 'EMERGENCY_BUS'}
          />
        )}
        {meshType === 'generator' && (
          <IndustrialGenerator status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'ups' && (
          <BatteryStorageRack status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'chiller' && (
          <ChillerCoolingTower status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'oxygen' && (
          <CryoOxygenYard status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'water_pump' && (
          <HydroWaterPump status={status} isSelected={isSelected} hovered={hovered} />
        )}
      </group>

      {/* Dynamic Localized Point Light for critical/disrupted glow */}
      {(isSelected || status === 'critical' || status === 'failed') && (
        <pointLight
          position={[0, 1.2, 0]}
          color={statusColor}
          intensity={isSelected ? 1.4 : 0.8}
          distance={3.5}
        />
      )}

      {/* Floating 3D Holographic HUD Tag */}
      {showLabels && (
        <Html
          position={[0, meshType === 'substation' ? 3.3 : 2.2, 0]}
          center
          distanceFactor={18}
          zIndexRange={[100, 0]}
        >
          <div
            className={`twin-hologram-hud ${isSelected ? 'is-selected' : ''} ${
              hovered ? 'is-hovered' : ''
            } status-${status}`}
            onClick={handleClick}
          >
            {/* Top Indicator Header */}
            <div className="hud-header">
              <span
                className="hud-status-beacon"
                style={{
                  backgroundColor: statusColor,
                  boxShadow: `0 0 8px ${statusColor}`
                }}
              />
              <span className="hud-label-id">{label}</span>
              {primaryTelemetry && (
                <span className="hud-metric-pill font-mono">{primaryTelemetry}</span>
              )}
            </div>

            {/* Sub-text details shown on hover or when selected */}
            {(hovered || isSelected) && (
              <div className="hud-drawer-expanded">
                <div className="hud-subsystem">{subsystem}</div>
                <div className="hud-health-bar-wrapper">
                  <div
                    className="hud-health-bar-fill"
                    style={{
                      width: `${asset?.health_score || 100}%`,
                      backgroundColor: statusColor
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  )
}

/**
 * Camera Orbit Controller with Preset Handling
 */
function CameraRig({ cameraPreset, controlsRef }) {
  const { camera } = useThree()

  useEffect(() => {
    const preset = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.isometric
    if (controlsRef.current) {
      camera.position.set(...preset.position)
      controlsRef.current.target.set(...preset.target)
      controlsRef.current.update()
    }
  }, [cameraPreset, camera, controlsRef])

  return null
}

/**
 * Main 3D Scene Root
 */
function DigitalTwinScene({
  assetsMap,
  selectedAssetId,
  onSelectNode,
  showConduits = true,
  showLabels = true,
  showParticles = true,
  activeFilter = 'all',
  cameraPreset = 'isometric'
}) {
  const controlsRef = useRef()

  // Filter visible nodes based on active toolbar category
  const visibleNodes = useMemo(() => {
    return Object.entries(ASSET_TOPOLOGY_DEFS).filter(([, def]) => {
      if (activeFilter === 'all') return true
      if (activeFilter === 'power' && (def.category === 'power' || def.category === 'switchgear')) return true
      if (activeFilter === 'generation' && def.category === 'generation') return true
      if (activeFilter === 'mechanical' && def.category === 'mechanical') return true
      if (activeFilter === 'medical_gas' && def.category === 'medical_gas') return true
      return false
    })
  }, [activeFilter])

  return (
    <>
      <CameraRig cameraPreset={cameraPreset} controlsRef={controlsRef} />

      {/* Atmospheric Space Lighting */}
      <ambientLight intensity={0.8} color="#0B132B" />
      <directionalLight position={[15, 25, 18]} intensity={1.4} color="#F8FAFC" castShadow />
      <directionalLight position={[-15, -10, -12]} intensity={0.4} color="#38BDF8" />
      <directionalLight position={[0, 20, -15]} intensity={0.6} color="#818CF8" />

      {/* Cyber Floating Dust Particles */}
      {showParticles && (
        <Sparkles
          count={120}
          scale={[28, 12, 28]}
          size={2.2}
          speed={0.4}
          color="#00F0FF"
          opacity={0.35}
        />
      )}

      {/* Dual Cyber Matrix Grid Ground */}
      <gridHelper args={[32, 32, '#0284C7', '#0F172A']} position={[0, -0.01, 0]} />
      <gridHelper args={[32, 64, '#1E293B', '#090D16']} position={[0, -0.02, 0]} />

      {/* Ground Foundation Zones */}
      <SubsystemFoundationZones />

      {/* Dynamic Conduit Energy Beams */}
      {showConduits &&
        DEPENDENCY_CONNECTIONS.map((conn, idx) => {
          const fromDef = ASSET_TOPOLOGY_DEFS[conn.from]
          const toDef = ASSET_TOPOLOGY_DEFS[conn.to]
          if (!fromDef || !toDef) return null

          const sourceAsset = assetsMap[conn.from]
          const isSevered = sourceAsset?.status === 'failed' || sourceAsset?.status === 'offline'
          const isDegraded = sourceAsset?.status === 'degraded' || sourceAsset?.status === 'starting'

          return (
            <DynamicEnergyBeam
              key={`conn-${idx}`}
              start={fromDef.position}
              end={toDef.position}
              color={conn.color}
              isSevered={isSevered}
              isDegraded={isDegraded}
            />
          )
        })}

      {/* 11 Procedural Infrastructure Asset Models */}
      {visibleNodes.map(([id, topoDef]) => {
        const asset = assetsMap[id]
        const isSelected = selectedAssetId === id

        return (
          <InfrastructureAssetNode
            key={id}
            asset={asset}
            topoDef={topoDef}
            isSelected={isSelected}
            onSelect={onSelectNode}
            showLabels={showLabels}
          />
        )
      })}

      {/* High Performance Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={6}
        maxDistance={42}
        target={[0, 0.5, 0]}
      />
    </>
  )
}

// ============================================================================
// Master Container Component (TwinContainer)
// ============================================================================

export default function TwinContainer({
  assets = [],
  selectedAssetId: externalSelectedAssetId,
  onSelectAsset
}) {
  const [internalSelectedId, setInternalSelectedId] = useState(null)
  const [showInspector, setShowInspector] = useState(true)
  const [activeFilter, setActiveFilter] = useState('all')
  const [cameraPreset, setCameraPreset] = useState('isometric')
  const [showConduits, setShowConduits] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showParticles, setShowParticles] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef()

  const activeSelectedId =
    externalSelectedAssetId !== undefined
      ? externalSelectedAssetId
      : internalSelectedId

  const handleSelectNode = (nodeId) => {
    const nextId = activeSelectedId === nodeId ? null : nodeId
    if (onSelectAsset) {
      onSelectAsset(nextId)
    } else {
      setInternalSelectedId(nextId)
    }
  }

  // Fast asset lookup by ID
  const assetsMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => {
      map[a.id] = a
    })
    return map
  }, [assets])

  const selectedAsset = activeSelectedId ? assetsMap[activeSelectedId] : null
  const selectedTopo = activeSelectedId ? ASSET_TOPOLOGY_DEFS[activeSelectedId] : null

  // Aggregated live campus KPIs
  const campusStats = useMemo(() => {
    let totalLoadKW = 0
    let normalCount = 0
    let alertCount = 0
    assets.forEach((a) => {
      if (a.current_load && a.capacity_unit === 'kW') totalLoadKW += a.current_load
      if (a.status === 'normal') normalCount++
      else if (a.status === 'failed' || a.status === 'critical' || a.status === 'degraded') alertCount++
    })
    return { totalLoadKW, normalCount, alertCount }
  }, [assets])

  // Fullscreen toggle handler
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className={`twin-master-panel ${isFullscreen ? 'is-fullscreen-twin' : ''}`}
      id="digital-twin-module"
    >
      {/* 1. Header Command Bar */}
      <div className="twin-header">
        <div className="twin-title-group">
          <div className="twin-header-icon-badge">
            <Layers size={17} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="twin-title">
              <span>HOSPITAL DIGITAL TWIN 3D</span>
              <span className="live-telemetry-badge">
                <Radio size={10} className="pulse-icon" /> LIVE SYNC
              </span>
            </div>
            <div className="twin-subtitle">
              Physically-Engineered Infrastructure Topology & Real-Time Telemetry Twin
            </div>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="twin-header-actions">
          {/* Quick Metrics Ticker */}
          <div className="twin-stats-pill font-mono">
            <span>
              ⚡ <strong>{campusStats.totalLoadKW.toFixed(0)} kW</strong> Campus Load
            </span>
            <span className="pill-divider" />
            <span style={{ color: campusStats.alertCount > 0 ? '#EF4444' : '#10B981' }}>
              {campusStats.alertCount > 0 ? `⚠ ${campusStats.alertCount} Disruptions` : `✓ 11/11 Stable`}
            </span>
          </div>

          <button
            type="button"
            className="twin-toggle-inspector-btn font-mono"
            onClick={() => setShowInspector(!showInspector)}
            title="Toggle Right Inspector Sidebar"
          >
            {showInspector ? 'Hide Inspector' : 'Show Inspector'}
            {selectedAsset && <span className="inspector-active-dot" />}
          </button>

          <button
            type="button"
            className="twin-action-icon-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Sub-Toolbar (Filters & Camera Presets) */}
      <div className="twin-sub-toolbar">
        {/* Layer Filters */}
        <div className="twin-filter-group">
          <span className="filter-label">LAYER:</span>
          {[
            { id: 'all', label: 'All Assets' },
            { id: 'power', label: '⚡ Substation & MSB' },
            { id: 'generation', label: '⛽ Gen & UPS' },
            { id: 'mechanical', label: '❄ HVAC & Chiller' },
            { id: 'medical_gas', label: '🫁 Medical Gas' }
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`twin-filter-chip ${activeFilter === f.id ? 'is-active' : ''}`}
              onClick={() => setActiveFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Camera View Switcher */}
        <div className="twin-camera-presets">
          <span className="filter-label">
            <Camera size={11} style={{ marginRight: 3 }} /> CAMERA:
          </span>
          {Object.entries(CAMERA_PRESETS).map(([key, p]) => (
            <button
              key={key}
              type="button"
              className={`twin-camera-chip ${cameraPreset === key ? 'is-active' : ''}`}
              onClick={() => setCameraPreset(key)}
              title={p.name}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Split Grid: 3D Canvas Viewport + Asset Inspector Sidebar */}
      <div className={`twin-viewport-grid ${!showInspector ? 'inspector-hidden' : ''}`}>
        {/* 3D Canvas Area */}
        <div className="twin-canvas-wrapper">
          <Canvas
            shadows
            camera={{ position: [0, 15, 18], fov: 42 }}
            onPointerMissed={() => handleSelectNode(null)}
          >
            <DigitalTwinScene
              assetsMap={assetsMap}
              selectedAssetId={activeSelectedId}
              onSelectNode={handleSelectNode}
              showConduits={showConduits}
              showLabels={showLabels}
              showParticles={showParticles}
              activeFilter={activeFilter}
              cameraPreset={cameraPreset}
            />
          </Canvas>

          {/* On-Canvas Quick Overlay Buttons (Conduits, Labels, Particles) */}
          <div className="twin-canvas-overlay-toggles">
            <button
              type="button"
              className={`overlay-toggle-btn ${showConduits ? 'is-on' : ''}`}
              onClick={() => setShowConduits(!showConduits)}
              title="Toggle Energy Conduit Beams"
            >
              <Zap size={11} /> Conduits: {showConduits ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              className={`overlay-toggle-btn ${showLabels ? 'is-on' : ''}`}
              onClick={() => setShowLabels(!showLabels)}
              title="Toggle 3D Hologram Labels"
            >
              <Eye size={11} /> HUD Labels: {showLabels ? 'ON' : 'OFF'}
            </button>
            <button
              type="button"
              className={`overlay-toggle-btn ${showParticles ? 'is-on' : ''}`}
              onClick={() => setShowParticles(!showParticles)}
              title="Toggle Atmospheric Cyber Dust Particles"
            >
              <Activity size={11} /> Particles: {showParticles ? 'ON' : 'OFF'}
            </button>
          </div>

          {/* Canvas Navigation Hint */}
          <div className="twin-canvas-controls-hint">
            Rotate: <kbd>Left Click + Drag</kbd> | Pan: <kbd>Right Click + Drag</kbd> | Zoom: <kbd>Scroll</kbd> | Select: <kbd>Click Machine</kbd>
          </div>
        </div>

        {/* Right Asset Inspector Sidebar */}
        {showInspector && (
          <div className="twin-inspector-sidebar">
            <div className="inspector-sidebar-title">
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Box size={14} style={{ color: 'var(--accent-cyan)' }} />
                <span>Node Telemetry Inspector</span>
              </div>
              {selectedAsset && (
                <button
                  type="button"
                  className="close-drawer-btn"
                  onClick={() => handleSelectNode(null)}
                  title="Deselect Node"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {selectedAsset ? (
              <div className="inspector-selected-card">
                {/* Node Identity Card Header */}
                <div className="inspector-selected-header">
                  <div>
                    <div className="inspector-selected-id font-mono">{selectedAsset.id}</div>
                    <div className="inspector-selected-name">{selectedAsset.name}</div>
                  </div>
                  <span
                    className={`badge badge-${selectedAsset.status || 'normal'} font-mono`}
                    style={{ textTransform: 'uppercase', fontSize: 9 }}
                  >
                    {selectedAsset.status || 'normal'}
                  </span>
                </div>

                {/* Subsystem & Location */}
                <div className="inspector-location-box">
                  <div className="location-row">
                    <span className="loc-label">Subsystem:</span>
                    <strong className="loc-val">{selectedTopo?.subsystem || 'General'}</strong>
                  </div>
                  <div className="location-row">
                    <span className="loc-label">Facility Zone:</span>
                    <span className="loc-val">{selectedTopo?.zone || 'Main Campus'}</span>
                  </div>
                  <div className="location-row">
                    <span className="loc-label">Physical Room:</span>
                    <span className="loc-val">{selectedAsset.location} (Floor {selectedAsset.floor})</span>
                  </div>
                </div>

                {/* Core Telemetry Grid (Load, Capacity, Health, Redundancy) */}
                <div className="inspector-field-grid">
                  <div className="inspector-field-cell">
                    <span className="inspector-field-label">Current Load</span>
                    <span className="inspector-field-val font-mono">
                      {selectedAsset.current_load} {selectedAsset.capacity_unit}
                    </span>
                  </div>
                  <div className="inspector-field-cell">
                    <span className="inspector-field-label">Available Cap</span>
                    <span className="inspector-field-val font-mono">
                      {selectedAsset.available_capacity} {selectedAsset.capacity_unit}
                    </span>
                  </div>
                  <div className="inspector-field-cell">
                    <span className="inspector-field-label">Health Score</span>
                    <span
                      className="inspector-field-val font-mono"
                      style={{
                        color:
                          selectedAsset.health_score > 80
                            ? 'var(--status-normal)'
                            : selectedAsset.health_score > 50
                            ? 'var(--status-warning)'
                            : 'var(--status-critical)'
                      }}
                    >
                      {selectedAsset.health_score?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="inspector-field-cell">
                    <span className="inspector-field-label">Redundancy</span>
                    <span className="inspector-field-val font-mono">
                      Level {selectedAsset.redundancy_level}
                    </span>
                  </div>
                </div>

                {/* Specific Subsystem Telemetry Details */}
                <div className="inspector-sensor-details">
                  <div className="sensor-section-label">Subsystem Sensor Channels:</div>
                  {selectedAsset.fuel_level_pct != null && (
                    <div className="sensor-row">
                      <span className="sensor-title">
                        <Fuel size={12} style={{ color: 'var(--status-warning)' }} /> Fuel Storage Level:
                      </span>
                      <strong className="font-mono sensor-value">
                        {selectedAsset.fuel_level_pct}%
                      </strong>
                    </div>
                  )}
                  {selectedAsset.battery_level_pct != null && (
                    <div className="sensor-row">
                      <span className="sensor-title">
                        <BatteryCharging size={12} style={{ color: 'var(--accent-cyan)' }} /> Battery Charge:
                      </span>
                      <strong className="font-mono sensor-value">
                        {selectedAsset.battery_level_pct}%
                      </strong>
                    </div>
                  )}
                  {selectedAsset.temperature_c != null && (
                    <div className="sensor-row">
                      <span className="sensor-title">
                        <Thermometer size={12} style={{ color: 'var(--status-critical)' }} /> Core Temperature:
                      </span>
                      <strong className="font-mono sensor-value">
                        {selectedAsset.temperature_c}°C
                      </strong>
                    </div>
                  )}
                  {selectedAsset.pressure_psi != null && (
                    <div className="sensor-row">
                      <span className="sensor-title">
                        <Gauge size={12} style={{ color: 'var(--accent-cyan)' }} /> Header Pressure:
                      </span>
                      <strong className="font-mono sensor-value">
                        {selectedAsset.pressure_psi} PSI
                      </strong>
                    </div>
                  )}
                  {selectedAsset.runtime_remaining_min != null && (
                    <div className="sensor-row">
                      <span className="sensor-title">
                        <Clock size={12} style={{ color: 'var(--text-muted)' }} /> Autonomy Runtime:
                      </span>
                      <strong className="font-mono sensor-value">
                        {selectedAsset.runtime_remaining_min} min
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="inspector-empty-state">
                <div className="empty-icon-halo">
                  <Compass size={32} style={{ color: 'var(--accent-cyan)' }} />
                </div>
                <div>
                  <strong style={{ color: 'var(--text-primary)', fontSize: 12 }}>
                    SELECT A 3D MACHINE
                  </strong>
                  <p style={{ marginTop: 6, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.5 }}>
                    Click any procedural equipment node in the 3D campus twin to inspect live electrical load, cooling output, fuel reserves, and health telemetry.
                  </p>
                </div>

                {/* Quick Pick Node Pills */}
                <div style={{ width: '100%', marginTop: 8 }}>
                  <div className="quick-pick-header">
                    Quick Pick Node:
                  </div>
                  <div className="quick-pick-chips">
                    {Object.keys(ASSET_TOPOLOGY_DEFS).map((id) => {
                      const ast = assetsMap[id]
                      const sColor = STATUS_COLORS[ast?.status || 'normal']
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => handleSelectNode(id)}
                          className="quick-pick-btn font-mono"
                        >
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              backgroundColor: sColor
                            }}
                          />
                          <span>{id}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 4. Footer Bar: Status Legend & Subsystem Indicators */}
      <div className="twin-footer-bar">
        <div className="twin-legend-items">
          <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: 4, fontSize: 10 }}>
            STATUS LEGEND:
          </span>
          {Object.entries(STATUS_COLORS).map(([st, col]) => (
            <div key={st} className="twin-legend-item">
              <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: col }} />
              <span style={{ textTransform: 'capitalize' }}>{st}</span>
            </div>
          ))}
        </div>

        <div className="twin-disclaimer font-mono">
          <ShieldCheck size={12} style={{ color: 'var(--accent-cyan)', marginRight: 4 }} />
          <span>Interactive WebGL Digital Twin — Three.js + R3F</span>
        </div>
      </div>
    </div>
  )
}
