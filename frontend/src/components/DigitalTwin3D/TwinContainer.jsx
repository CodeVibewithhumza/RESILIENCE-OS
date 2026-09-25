import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, Html, Sparkles } from '@react-three/drei'
import * as THREE from 'three'
import {
  Layers,
  HeartPulse,
  Zap,
  Activity,
  Maximize2,
  Minimize2,
  Radio,
  Eye,
  Camera,
  Flame,
  Droplets,
  Wind,
  Bed,
  Info,
  ChevronRight,
  Building,
  AlertTriangle,
  Play,
  Pause,
  Volume2,
  VolumeX,
  RefreshCw,
  Sparkles as SparklesIcon,
  ShieldAlert,
  CheckCircle2
} from 'lucide-react'
import {
  STATUS_COLORS,
  STATUS_EMISSIVE,
  FLOOR_DEFINITIONS,
  ASSET_TOPOLOGY_DEFS,
  DEPENDENCY_CONNECTIONS,
  CAMERA_PRESETS
} from './twinConstants'
import {
  HospitalFloorPlinth,
  HospitalRooftop,
  IndustrialPlantYard,
  ICUBedMesh,
  OperatingTheatreMesh,
  EmergencyTraumaBayMesh,
  GeneralWardBedMesh,
  NurseStationMesh,
  AdminHubMesh,
  AmbulanceBayMesh,
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
// 1. WEB AUDIO SYNTHESIZER FOR ZERO-LATENCY SCI-FI SOUND EFFECTS
// ============================================================================

class TwinSoundEngine {
  constructor() {
    this.ctx = null
    this.muted = false
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        this.ctx = new AudioContext()
      }
    }
  }

  playSelect() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(580, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.1)
    } catch {}
  }

  playAlert() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc.frequency.setValueAtTime(880, this.ctx.currentTime + 0.1)
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.26)
    } catch {}
  }

  playRestore() {
    if (this.muted) return
    this.init()
    if (!this.ctx) return
    try {
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(440, this.ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(659.25, this.ctx.currentTime + 0.12)
      osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.24)
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start()
      osc.stop(this.ctx.currentTime + 0.3)
    } catch {}
  }
}

const soundEngine = new TwinSoundEngine()

// ============================================================================
// 2. 3D VISUAL EFFECTS & DYNAMIC SCENE HELPERS
// ============================================================================

/**
 * Animated Ground Selection Holographic Reticle & Light Column
 */
function TargetReticle({ position = [0, 0, 0], status = 'normal' }) {
  const outerRingRef = useRef()
  const innerRingRef = useRef()
  const color = STATUS_COLORS[status] || '#00F0FF'

  useFrame((_, delta) => {
    if (outerRingRef.current) outerRingRef.current.rotation.z += delta * 1.5
    if (innerRingRef.current) innerRingRef.current.rotation.z -= delta * 2.2
  })

  return (
    <group position={position}>
      {/* Outer Hologram Ring */}
      <mesh ref={outerRingRef} position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.45, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.85} />
      </mesh>

      {/* Inner Fast Hologram Ring */}
      <mesh ref={innerRingRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 0.95, 6]} />
        <meshBasicMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.6} />
      </mesh>

      {/* Ground Projection Disc */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.4, 32]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.15} />
      </mesh>

      {/* Vertical Hologram Beacon Light Pillar */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.2, 3.2, 16, 1, true]} />
        <meshBasicMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

/**
 * Futuristic Sonar Radar Scan Wave expanding from Central Plant Core
 */
function RadarScanWave() {
  const waveRef = useRef()

  useFrame(({ clock }) => {
    if (waveRef.current) {
      const t = (clock.getElapsedTime() * 0.4) % 1.0
      const radius = 2 + t * 26
      waveRef.current.scale.set(radius, radius, 1)
      waveRef.current.material.opacity = (1 - t) * 0.35
    }
  })

  return (
    <mesh ref={waveRef} position={[2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.96, 1.0, 64]} />
      <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} transparent opacity={0.3} />
    </mesh>
  )
}

/**
 * Procedural Dynamic Conduit Energy & Life-Safety Beam with Animated Travelling Photon Particles
 */
function DynamicEnergyBeam({ start, end, color = '#00F0FF', isSevered = false, isDegraded = false, speed = 1.8 }) {
  const pulseRef = useRef()
  const photon1Ref = useRef()
  const photon2Ref = useRef()

  const { position, quaternion, length, p1, p2 } = useMemo(() => {
    const pt1 = new THREE.Vector3(...start)
    const pt2 = new THREE.Vector3(...end)
    pt1.y += 0.35
    pt2.y += 0.35
    const mid = pt1.clone().add(pt2).multiplyScalar(0.5)
    const dir = pt2.clone().sub(pt1)
    const len = dir.length()
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())
    return { position: mid, quaternion: q, length: len, p1: pt1, p2: pt2 }
  }, [start, end])

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed
    if (pulseRef.current) {
      if (isSevered) {
        pulseRef.current.opacity = 0.2 + Math.sin(t * 12) * 0.15
      } else if (isDegraded) {
        pulseRef.current.opacity = 0.5 + Math.sin(t * 6) * 0.3
      } else {
        pulseRef.current.opacity = 0.7 + Math.sin(t * 3) * 0.2
      }
    }

    // Move traveling photons along the conduit
    if (photon1Ref.current && !isSevered) {
      const prog1 = (t * 0.4) % 1.0
      photon1Ref.current.position.y = (prog1 - 0.5) * length
    }
    if (photon2Ref.current && !isSevered) {
      const prog2 = ((t * 0.4) + 0.5) % 1.0
      photon2Ref.current.position.y = (prog2 - 0.5) * length
    }
  })

  const beamColor = isSevered ? '#DC2626' : isDegraded ? '#F59E0B' : color

  return (
    <group position={position} quaternion={quaternion}>
      {/* Outer Protective Conduit Sleeve */}
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, length, 8]} />
        <meshStandardMaterial
          color="#0F172A"
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.35}
        />
      </mesh>

      {/* Inner Glowing Fluid / Energy Core */}
      <mesh>
        <cylinderGeometry args={[0.022, 0.022, length, 6]} />
        <meshBasicMaterial
          ref={pulseRef}
          color={beamColor}
          transparent
          opacity={isSevered ? 0.2 : 0.85}
        />
      </mesh>

      {/* Travelling Photon Pulse 1 */}
      {!isSevered && (
        <mesh ref={photon1Ref}>
          <sphereGeometry args={[0.055, 8, 8]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )}

      {/* Travelling Photon Pulse 2 */}
      {!isSevered && (
        <mesh ref={photon2Ref}>
          <sphereGeometry args={[0.045, 8, 8]} />
          <meshBasicMaterial color={beamColor} />
        </mesh>
      )}
    </group>
  )
}

/**
 * Interactive Hospital Node with Procedural Mesh and Smart HUD Card
 */
function HospitalAssetNode({
  asset,
  topoDef,
  isSelected,
  onSelect,
  hudMode = 'smart'
}) {
  const [hovered, setHovered] = useState(false)
  const status = asset?.status || 'normal'
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal
  const { position, meshType, label, subsystem, bedNumber, roomNumber, bayNumber } = topoDef

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
    soundEngine.playSelect()
    onSelect(asset?.id || label)
  }

  // Derive quick primary telemetry reading
  const primaryTelemetry = useMemo(() => {
    if (!asset) return null
    if (asset.metadata?.ventilator_active) return 'Ventilator: ON'
    if (asset.metadata?.spo2_pct) return `SpO2: ${asset.metadata.spo2_pct}%`
    if (asset.current_load != null && asset.capacity_unit) {
      return `${asset.current_load.toFixed(0)} ${asset.capacity_unit}`
    }
    if (asset.fuel_level_pct != null) return `${asset.fuel_level_pct}% Fuel`
    if (asset.battery_level_pct != null) return `${asset.battery_level_pct}% Bat`
    if (asset.temperature_c != null) return `${asset.temperature_c}°C`
    if (asset.pressure_psi != null) return `${asset.pressure_psi} PSI`
    return null
  }, [asset])

  // SMART HUD VISIBILITY RULE
  const isTagVisible =
    hudMode === 'all' ||
    (hudMode === 'alerts' && (status === 'critical' || status === 'failed' || status === 'degraded')) ||
    (hudMode === 'smart' && (hovered || isSelected || status === 'critical' || status === 'failed'))

  return (
    <group position={position}>
      {/* Selection Floor Reticle */}
      {isSelected && <TargetReticle position={[0, 0, 0]} status={status} />}

      {/* Procedural Mesh Dispatcher */}
      <group
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {meshType === 'icu_bed' && (
          <ICUBedMesh
            status={status}
            isSelected={isSelected}
            hovered={hovered}
            bedNumber={bedNumber}
          />
        )}
        {meshType === 'operating_theatre' && (
          <OperatingTheatreMesh status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'emergency_bay' && (
          <EmergencyTraumaBayMesh
            status={status}
            isSelected={isSelected}
            hovered={hovered}
            bayNumber={bayNumber}
          />
        )}
        {meshType === 'ward_bed' && (
          <GeneralWardBedMesh
            status={status}
            isSelected={isSelected}
            hovered={hovered}
            roomNumber={roomNumber}
          />
        )}
        {meshType === 'nurse_station' && (
          <NurseStationMesh status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'admin_hub' && (
          <AdminHubMesh status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'ambulance_bay' && <AmbulanceBayMesh status={status} />}
        {meshType === 'substation' && (
          <SubstationPylon status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'transformer' && (
          <TransformerUnit status={status} isSelected={isSelected} hovered={hovered} />
        )}
        {meshType === 'switchgear' && (
          <SwitchgearRack status={status} isSelected={isSelected} hovered={hovered} />
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

      {/* Critical / Selected Glow */}
      {(isSelected || status === 'critical' || status === 'failed') && (
        <pointLight
          position={[0, 1.2, 0]}
          color={statusColor}
          intensity={isSelected ? 1.6 : 1.0}
          distance={3.5}
        />
      )}

      {/* 3D Hologram Floating Tag */}
      {isTagVisible && (
        <Html
          position={[0, meshType === 'substation' ? 3.4 : meshType === 'icu_bed' ? 2.2 : 2.0, 0]}
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

            {(hovered || isSelected) && (
              <div className="hud-drawer-expanded">
                <div className="hud-subsystem">{subsystem}</div>
                {asset?.metadata?.patient_id && (
                  <div className="hud-patient-tag">Patient: {asset.metadata.patient_id}</div>
                )}
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
 * Camera Orbit Controller Rig with Cinematic Drone Tour Mode
 */
function CameraRig({ cameraPreset, isDroneTour, controlsRef }) {
  const { camera } = useThree()
  const tourAngleRef = useRef(0)

  useEffect(() => {
    if (!isDroneTour) {
      const preset = CAMERA_PRESETS[cameraPreset] || CAMERA_PRESETS.isometric
      if (controlsRef.current) {
        camera.position.set(...preset.position)
        controlsRef.current.target.set(...preset.target)
        controlsRef.current.update()
      }
    }
  }, [cameraPreset, isDroneTour, camera, controlsRef])

  useFrame((_, delta) => {
    if (isDroneTour && controlsRef.current) {
      tourAngleRef.current += delta * 0.22
      const radius = 28
      const x = Math.cos(tourAngleRef.current) * radius + 2.0
      const z = Math.sin(tourAngleRef.current) * radius
      const y = 14 + Math.sin(tourAngleRef.current * 0.8) * 5

      camera.position.lerp(new THREE.Vector3(x, y, z), 0.05)
      controlsRef.current.target.lerp(new THREE.Vector3(2.0, 3.5, 0), 0.05)
      controlsRef.current.update()
    }
  })

  return null
}

/**
 * Main 3D Hospital Digital Twin Scene Root
 */
function DigitalTwinScene({
  assetsMap,
  selectedAssetId,
  onSelectNode,
  showConduits = true,
  hudMode = 'smart',
  showParticles = true,
  showWalls = true,
  xrayMode = false,
  isDroneTour = false,
  activeFloor = 'all',
  activeCategory = 'all',
  cameraPreset = 'isometric'
}) {
  const controlsRef = useRef()

  // Filter visible nodes based on active floor and category
  const visibleNodes = useMemo(() => {
    return Object.entries(ASSET_TOPOLOGY_DEFS).filter(([, def]) => {
      if (activeFloor !== 'all' && def.floorId !== activeFloor) return false
      if (activeCategory === 'all') return true
      if (
        activeCategory === 'clinical' &&
        (def.category === 'clinical' ||
          def.category === 'surgical' ||
          def.category === 'emergency' ||
          def.category === 'ward')
      )
        return true
      if (
        activeCategory === 'power' &&
        (def.category === 'power' ||
          def.category === 'switchgear' ||
          def.category === 'generation')
      )
        return true
      if (activeCategory === 'gas' && def.category === 'medical_gas') return true
      if (activeCategory === 'mechanical' && def.category === 'mechanical') return true
      return false
    })
  }, [activeFloor, activeCategory])

  return (
    <>
      <CameraRig
        cameraPreset={cameraPreset}
        isDroneTour={isDroneTour}
        controlsRef={controlsRef}
      />

      {/* Atmospheric Space Lighting */}
      <ambientLight intensity={xrayMode ? 0.45 : 0.95} color="#0B132B" />
      <directionalLight position={[15, 28, 20]} intensity={1.7} color="#F8FAFC" castShadow />
      <directionalLight position={[-15, -10, -12]} intensity={0.45} color="#38BDF8" />
      <directionalLight position={[0, 20, -18]} intensity={0.65} color="#818CF8" />

      {/* Cyber Floating Dust Particles */}
      {showParticles && (
        <Sparkles
          count={120}
          scale={[34, 18, 34]}
          size={2.4}
          speed={0.4}
          color="#00F0FF"
          opacity={0.35}
        />
      )}

      {/* Radar Sonar Wave */}
      <RadarScanWave />

      {/* Campus Ground Grid */}
      <gridHelper args={[46, 46, '#0284C7', '#0F172A']} position={[0, -0.16, 0]} />

      {/* Hospital Architectural Slabs & Rooms */}
      {FLOOR_DEFINITIONS.filter((f) => f.level > 0).map((floor) => {
        const isIsolated = activeFloor === floor.id
        const isDimmed = activeFloor !== 'all' && activeFloor !== floor.id
        if (activeFloor !== 'all' && activeFloor !== floor.id) return null

        return (
          <group key={floor.id}>
            <HospitalFloorPlinth
              floorDef={floor}
              isIsolated={isIsolated}
              isDimmed={isDimmed}
              showWalls={showWalls}
              xrayMode={xrayMode}
            />

            {/* Department Floor Banner on Slab Edge */}
            <Html
              position={[-8.8, floor.elevation + 0.3, 5.8]}
              center
              distanceFactor={22}
              zIndexRange={[50, 0]}
            >
              <div
                className="floor-slab-label-tag"
                style={{
                  borderLeft: `3px solid ${floor.color}`,
                  backgroundColor: 'rgba(6, 11, 23, 0.88)'
                }}
              >
                <span className="slab-level-num" style={{ color: floor.color }}>
                  L{floor.level}
                </span>
                <span className="slab-name">{floor.shortName}</span>
              </div>
            </Html>
          </group>
        )
      })}

      {/* Hospital Rooftop with Helipad & Air Ambulance */}
      {(activeFloor === 'all' || activeFloor === 'floor_3') && (
        <HospitalRooftop showRoof={showWalls} xrayMode={xrayMode} />
      )}

      {/* Realistic Industrial Utility & Infrastructure Yard */}
      {(activeFloor === 'all' || activeFloor === 'floor_0') && (
        <group>
          <IndustrialPlantYard xrayMode={xrayMode} />
          <Html position={[11.6, 0.4, 7.2]} center distanceFactor={22} zIndexRange={[50, 0]}>
            <div
              className="floor-slab-label-tag"
              style={{
                borderLeft: '3px solid #00F0FF',
                backgroundColor: 'rgba(6, 11, 23, 0.88)'
              }}
            >
              <span className="slab-level-num" style={{ color: '#00F0FF' }}>
                L0
              </span>
              <span className="slab-name">Utility & Substation Plant</span>
            </div>
          </Html>
        </group>
      )}

      {/* Dynamic Conduit Energy & Gas Beams */}
      {showConduits &&
        DEPENDENCY_CONNECTIONS.map((conn, idx) => {
          const fromDef = ASSET_TOPOLOGY_DEFS[conn.from]
          const toDef = ASSET_TOPOLOGY_DEFS[conn.to]
          if (!fromDef || !toDef) return null

          if (
            activeFloor !== 'all' &&
            fromDef.floorId !== activeFloor &&
            toDef.floorId !== activeFloor
          ) {
            return null
          }

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
              speed={conn.speed || 1.8}
            />
          )
        })}

      {/* Hospital Assets & Equipment Nodes */}
      {visibleNodes.map(([id, def]) => {
        const asset = assetsMap[id] || { id, status: 'normal', name: def.subsystem }
        const isSelected = selectedAssetId === id
        return (
          <HospitalAssetNode
            key={id}
            asset={asset}
            topoDef={def}
            isSelected={isSelected}
            onSelect={onSelectNode}
            hudMode={hudMode}
          />
        )
      })}

      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.06}
        minDistance={4}
        maxDistance={55}
        maxPolarAngle={Math.PI / 2 + 0.05}
      />
    </>
  )
}

// ============================================================================
// 3. MAIN COMPONENT CONTAINER & HUD CONTROLS
// ============================================================================

export default function TwinContainer({
  assets = [],
  services = [],
  selectedAssetId,
  onSelectAsset
}) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeFloor, setActiveFloor] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')
  const [cameraPreset, setCameraPreset] = useState('isometric')
  const [showConduits, setShowConduits] = useState(true)
  const [hudMode, setHudMode] = useState('smart') // 'smart' | 'alerts' | 'all'
  const [showParticles, setShowParticles] = useState(true)
  const [showWalls, setShowWalls] = useState(true)
  const [xrayMode, setXrayMode] = useState(false)
  const [isDroneTour, setIsDroneTour] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [activeScenario, setActiveScenario] = useState(null) // 'grid_trip' | 'o2_rupture' | 'chiller_trip' | null
  const [simulatedOverrides, setSimulatedOverrides] = useState({})

  // Sync mute state
  useEffect(() => {
    soundEngine.muted = isMuted
  }, [isMuted])

  // Fast map lookup with active crisis simulation overrides applied
  const assetsMap = useMemo(() => {
    const map = {}
    assets.forEach((a) => {
      map[a.id] = { ...a, ...(simulatedOverrides[a.id] || {}) }
    })
    // Also include any simulated assets not in initial array
    Object.entries(simulatedOverrides).forEach(([id, override]) => {
      if (!map[id]) {
        map[id] = { id, status: 'normal', ...override }
      }
    })
    return map
  }, [assets, simulatedOverrides])

  const selectedDef = selectedAssetId ? ASSET_TOPOLOGY_DEFS[selectedAssetId] : null
  const selectedAsset = selectedAssetId ? assetsMap[selectedAssetId] : null

  // Auto-open inspector drawer when selecting an asset
  useEffect(() => {
    if (selectedAssetId) {
      setIsInspectorOpen(true)
    }
  }, [selectedAssetId])

  // Aggregate statistics
  const stats = useMemo(() => {
    const totalAssets = Object.keys(ASSET_TOPOLOGY_DEFS).length
    const normalCount = Object.keys(ASSET_TOPOLOGY_DEFS).filter(
      (id) => (assetsMap[id]?.status || 'normal') === 'normal'
    ).length
    const criticalCount = Object.keys(ASSET_TOPOLOGY_DEFS).filter(
      (id) => assetsMap[id]?.status === 'critical' || assetsMap[id]?.status === 'failed'
    ).length
    const icuBeds = Object.values(ASSET_TOPOLOGY_DEFS).filter((d) => d.category === 'clinical').length
    return { totalAssets, normalCount, criticalCount, icuBeds }
  }, [assetsMap])

  // Floor Selection Handler
  const handleSelectFloor = (floorId) => {
    setIsDroneTour(false)
    setActiveFloor(floorId)
    soundEngine.playSelect()
    if (floorId === 'all') {
      setCameraPreset('isometric')
    } else if (floorId === 'floor_3') {
      setCameraPreset('floor_3')
    } else if (floorId === 'floor_2') {
      setCameraPreset('floor_2')
    } else if (floorId === 'floor_1') {
      setCameraPreset('floor_1')
    } else if (floorId === 'floor_0') {
      setCameraPreset('floor_0')
    }
  }

  // CRISIS SCENARIO SIMULATION TRIGGERS ("Aaag Laga De" Interactive Scenarios)
  const triggerScenario = (scenarioKey) => {
    if (activeScenario === scenarioKey) {
      // Toggle off / Restore Nominal
      setActiveScenario(null)
      setSimulatedOverrides({})
      soundEngine.playRestore()
      return
    }

    setActiveScenario(scenarioKey)
    soundEngine.playAlert()

    if (scenarioKey === 'grid_trip') {
      // 11kV Grid Trip: Grid Fails, Diesel Gen 1 auto-starts, ESB supplies UPS & ICU
      setSimulatedOverrides({
        GRID_MAIN: { status: 'failed', current_load: 0, health_score: 0 },
        TRANSFORMER_01: { status: 'failed', current_load: 0, health_score: 10 },
        TRANSFORMER_02: { status: 'failed', current_load: 0, health_score: 10 },
        MAIN_BUS: { status: 'degraded', current_load: 180, health_score: 60 },
        GEN_01: { status: 'normal', current_load: 540, fuel_level_pct: 94, health_score: 98 },
        GEN_02: { status: 'starting', current_load: 0, fuel_level_pct: 90, health_score: 95 },
        EMERGENCY_BUS: { status: 'normal', current_load: 540, health_score: 95 },
        UPS_CRITICAL: { status: 'normal', battery_level_pct: 99, health_score: 100 }
      })
      handleSelectFloor('floor_0')
    } else if (scenarioKey === 'o2_rupture') {
      // Cryo Oxygen Rupture: Pressure drops to critical, ICU Bed 1 & 5 flash alarms
      setSimulatedOverrides({
        OXYGEN_MANIFOLD: { status: 'critical', pressure_psi: 14.2, health_score: 25 },
        ICU_BED_01: {
          status: 'critical',
          health_score: 40,
          metadata: { patient_id: 'P-9841', ventilator_active: true, spo2_pct: 88, heart_rate_bpm: 128 }
        },
        ICU_BED_05: {
          status: 'critical',
          health_score: 35,
          metadata: { patient_id: 'P-9845', ventilator_active: true, spo2_pct: 85, heart_rate_bpm: 136 }
        }
      })
      handleSelectFloor('floor_3')
    } else if (scenarioKey === 'chiller_trip') {
      // HVAC Chiller Trip: OT Cleanrooms lose laminar air cooling
      setSimulatedOverrides({
        CHILLER_PLANT: { status: 'failed', temperature_c: 48, health_score: 15 },
        OT_SUITE_01: { status: 'degraded', health_score: 55 },
        OT_SUITE_02: { status: 'degraded', health_score: 55 }
      })
      handleSelectFloor('floor_2')
    }
  }

  return (
    <div
      className={`twin-master-panel ${isFullscreen ? 'is-fullscreen-twin' : ''}`}
      id="twin-viewport"
    >
      {/* 1. Header Command Bar */}
      <div className="twin-header">
        <div className="twin-title-group">
          <div className="twin-header-icon-badge">
            <Building size={18} style={{ color: 'var(--accent-cyan)' }} />
          </div>
          <div>
            <div className="twin-title">
              <span>HOSPITAL DIGITAL TWIN 3D MAP</span>
              <span className="live-telemetry-badge">
                <Radio size={10} className="pulse-icon" />
                LIVE BIM SYNC
              </span>
            </div>
            <div className="twin-subtitle">
              Multi-Tier BIM Topology: 6 ICU Beds, Surgical Cleanrooms, Trauma Bays & 11kV Substation Yard
            </div>
          </div>
        </div>

        {/* Stats Pill, Audio & Cinema Controls */}
        <div className="twin-header-actions">
          {/* Drone Tour Mode Button */}
          <button
            className={`twin-drone-tour-btn ${isDroneTour ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playSelect()
              setIsDroneTour(!isDroneTour)
            }}
            title={isDroneTour ? 'Pause Drone Fly-Around Tour' : 'Start Cinematic 360 Drone Tour'}
          >
            {isDroneTour ? <Pause size={13} /> : <Play size={13} />}
            <span>{isDroneTour ? 'Touring Campus' : '🎥 Drone Tour'}</span>
          </button>

          {/* Sound Toggle */}
          <button
            className="twin-audio-toggle-btn"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Audio Feedback' : 'Mute Audio Feedback'}
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} style={{ color: 'var(--accent-cyan)' }} />}
          </button>

          <div className="twin-stats-pill">
            <span style={{ color: 'var(--status-normal)' }}>{stats.normalCount} Online</span>
            <span className="pill-divider" />
            {stats.criticalCount > 0 ? (
              <span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>
                {stats.criticalCount} At Risk
              </span>
            ) : (
              <span style={{ color: 'var(--accent-cyan)' }}>6 ICU Beds Active</span>
            )}
          </div>

          <button
            className="twin-toggle-inspector-btn"
            onClick={() => {
              soundEngine.playSelect()
              setIsInspectorOpen(!isInspectorOpen)
            }}
            title="Toggle Asset Telemetry Inspector"
          >
            <Info size={14} />
            <span>Inspector</span>
          </button>

          <button
            className="twin-fullscreen-btn"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </div>

      {/* 2. Interactive Crisis Simulation Injection Bar ("Aaag Laga De" Scenarios) */}
      <div className="twin-scenario-bar">
        <div className="scenario-label-group">
          <ShieldAlert size={14} style={{ color: '#F59E0B' }} />
          <span className="scenario-bar-title">CRISIS SIMULATOR:</span>
        </div>
        <div className="scenario-buttons-group">
          <button
            className={`scenario-btn ${activeScenario === 'grid_trip' ? 'active alert-grid' : ''}`}
            onClick={() => triggerScenario('grid_trip')}
            title="Simulate 11kV Grid Blackout & Diesel Generator Auto-Start"
          >
            <Zap size={12} />
            <span>💥 11kV Grid Trip</span>
          </button>
          <button
            className={`scenario-btn ${activeScenario === 'o2_rupture' ? 'active alert-o2' : ''}`}
            onClick={() => triggerScenario('o2_rupture')}
            title="Simulate Cryogenic Oxygen Line Rupture and ICU Bed Hypoxia"
          >
            <Flame size={12} />
            <span>🚨 Cryo O2 Rupture</span>
          </button>
          <button
            className={`scenario-btn ${activeScenario === 'chiller_trip' ? 'active alert-chiller' : ''}`}
            onClick={() => triggerScenario('chiller_trip')}
            title="Simulate HVAC Chiller Failure in Surgical Cleanrooms"
          >
            <Wind size={12} />
            <span>🔥 Chiller Overheat</span>
          </button>
          {activeScenario && (
            <button
              className="scenario-btn restore-btn"
              onClick={() => {
                setActiveScenario(null)
                setSimulatedOverrides({})
                soundEngine.playRestore()
              }}
              title="Reset All Systems to Nominal 100% Healthy State"
            >
              <CheckCircle2 size={12} style={{ color: '#10B981' }} />
              <span>🛡️ Restore Normal</span>
            </button>
          )}
        </div>

        {/* Live Scenario Marquee Ticker */}
        {activeScenario && (
          <div className="scenario-active-badge">
            <Radio size={11} className="pulse-icon" style={{ color: '#EF4444' }} />
            <span>
              {activeScenario === 'grid_trip' && 'CRISIS ACTIVE: 11kV Grid Blackout! GEN_01 running, ESB active.'}
              {activeScenario === 'o2_rupture' && 'CRISIS ACTIVE: Cryo O2 Drop! ICU Bed 01 & 05 Ventilator Alarms.'}
              {activeScenario === 'chiller_trip' && 'CRISIS ACTIVE: Chiller Cooling Failure! OT Suite Cleanrooms Degraded.'}
            </span>
          </div>
        )}
      </div>

      {/* 3. Hospital Floor & Department Cutaway Bar */}
      <div className="twin-floor-bar">
        <div className="floor-bar-label">
          <Layers size={13} style={{ color: 'var(--accent-cyan)' }} />
          <span>FLOORS:</span>
        </div>
        <div className="floor-buttons-group">
          <button
            className={`floor-tab-btn ${activeFloor === 'all' ? 'active' : ''}`}
            onClick={() => handleSelectFloor('all')}
          >
            🏥 Full Campus (All Floors)
          </button>
          {FLOOR_DEFINITIONS.map((floor) => (
            <button
              key={floor.id}
              className={`floor-tab-btn ${activeFloor === floor.id ? 'active' : ''}`}
              onClick={() => handleSelectFloor(floor.id)}
              style={{
                borderColor: activeFloor === floor.id ? floor.color : undefined
              }}
            >
              <span className="floor-color-dot" style={{ backgroundColor: floor.color }} />
              {floor.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* 4. Subsystem Quick-Filters & View Options Bar */}
      <div className="twin-filter-bar">
        <div className="filter-bar-group">
          <span className="filter-label">Filter:</span>
          <button
            className={`filter-pill ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            All Assets
          </button>
          <button
            className={`filter-pill ${activeCategory === 'clinical' ? 'active' : ''}`}
            onClick={() => setActiveCategory('clinical')}
          >
            <HeartPulse size={12} />
            ICU Beds & Clinical
          </button>
          <button
            className={`filter-pill ${activeCategory === 'power' ? 'active' : ''}`}
            onClick={() => setActiveCategory('power')}
          >
            <Zap size={12} />
            Power & Backup
          </button>
          <button
            className={`filter-pill ${activeCategory === 'gas' ? 'active' : ''}`}
            onClick={() => setActiveCategory('gas')}
          >
            <Flame size={12} />
            Medical Oxygen
          </button>
          <button
            className={`filter-pill ${activeCategory === 'mechanical' ? 'active' : ''}`}
            onClick={() => setActiveCategory('mechanical')}
          >
            <Wind size={12} />
            HVAC & Water
          </button>
        </div>

        {/* View Options Toggle Controls */}
        <div className="view-toggles-group">
          {/* Smart HUD Density Mode Dropdown */}
          <div className="hud-mode-wrapper">
            <Eye size={13} style={{ color: 'var(--accent-cyan)' }} />
            <select
              className="hud-mode-dropdown font-mono"
              value={hudMode}
              onChange={(e) => setHudMode(e.target.value)}
              title="Change 3D Hologram Tag Density"
            >
              <option value="smart">Smart HUD (Hover / Select)</option>
              <option value="alerts">Alerts Only</option>
              <option value="all">Show All Tags</option>
            </select>
          </div>

          <button
            className={`view-toggle-icon ${xrayMode ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playSelect()
              setXrayMode(!xrayMode)
            }}
            title="Toggle X-Ray CAD Blueprint Mode"
          >
            <SparklesIcon size={13} />
            <span>X-Ray BIM</span>
          </button>

          <button
            className={`view-toggle-icon ${showConduits ? 'active' : ''}`}
            onClick={() => setShowConduits(!showConduits)}
            title="Toggle Conduit Energy Lines"
          >
            <Activity size={13} />
            <span>Conduits</span>
          </button>

          <button
            className={`view-toggle-icon ${showWalls ? 'active' : ''}`}
            onClick={() => setShowWalls(!showWalls)}
            title="Toggle Glass Architecture Walls"
          >
            <Building size={13} />
            <span>Walls</span>
          </button>

          {/* Camera Preset Dropdown */}
          <div className="camera-select-wrapper">
            <Camera size={13} style={{ color: 'var(--text-muted)' }} />
            <select
              className="camera-dropdown font-mono"
              value={cameraPreset}
              onChange={(e) => {
                setIsDroneTour(false)
                setCameraPreset(e.target.value)
              }}
            >
              {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Main 3D Canvas Viewport */}
      <div className="twin-canvas-container">
        <Canvas
          shadows
          camera={{ position: [2, 22, 26], fov: 42, near: 0.1, far: 160 }}
          gl={{
            antialias: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.15
          }}
        >
          <DigitalTwinScene
            assetsMap={assetsMap}
            selectedAssetId={selectedAssetId}
            onSelectNode={onSelectAsset}
            showConduits={showConduits}
            hudMode={hudMode}
            showParticles={showParticles}
            showWalls={showWalls}
            xrayMode={xrayMode}
            isDroneTour={isDroneTour}
            activeFloor={activeFloor}
            activeCategory={activeCategory}
            cameraPreset={cameraPreset}
          />
        </Canvas>

        {/* Floating Quick Legend */}
        <div className="twin-overlay-legend">
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: STATUS_COLORS.normal }} />
            <span>Normal</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: STATUS_COLORS.degraded }} />
            <span>Degraded</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: STATUS_COLORS.critical }} />
            <span>Critical / Alert</span>
          </div>
          <div className="legend-item">
            <span className="legend-badge" style={{ backgroundColor: STATUS_COLORS.failed }} />
            <span>Failed</span>
          </div>
        </div>
      </div>

      {/* 6. Rich Slide-In Asset & Bed Inspector Drawer */}
      {isInspectorOpen && (
        <div className="twin-inspector-drawer">
          <div className="inspector-header">
            <div className="inspector-title-row">
              <span className="inspector-tag font-mono">ASSET TELEMETRY & CLINICAL PROFILE</span>
              <button className="inspector-close-btn" onClick={() => setIsInspectorOpen(false)}>
                &times;
              </button>
            </div>
            <h3 className="inspector-asset-name">
              {selectedAsset?.name || selectedDef?.subsystem || 'Select any ICU Bed or Asset'}
            </h3>
            <div className="inspector-meta-row">
              <span className="font-mono" style={{ color: 'var(--accent-cyan)' }}>
                {selectedAssetId || 'NO_SELECTION'}
              </span>
              {selectedDef?.floor != null && (
                <span className="badge badge-normal font-mono">Level {selectedDef.floor}</span>
              )}
              {selectedDef?.zone && (
                <span className="badge badge-outline font-mono">{selectedDef.zone}</span>
              )}
            </div>
          </div>

          <div className="inspector-body">
            {selectedAsset ? (
              <>
                {/* Status Indicator Banner */}
                <div
                  className="inspector-status-banner"
                  style={{
                    backgroundColor: `rgba(${
                      selectedAsset.status === 'critical' || selectedAsset.status === 'failed'
                        ? '239, 68, 68, 0.15'
                        : selectedAsset.status === 'degraded'
                        ? '245, 158, 11, 0.15'
                        : '16, 185, 129, 0.15'
                    })`,
                    borderLeft: `4px solid ${
                      STATUS_COLORS[selectedAsset.status] || STATUS_COLORS.normal
                    }`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="hud-status-beacon"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[selectedAsset.status] || STATUS_COLORS.normal
                      }}
                    />
                    <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>
                      Status: {selectedAsset.status}
                    </span>
                  </div>
                  <span className="font-mono">Health: {selectedAsset.health_score || 100}%</span>
                </div>

                {/* Patient / Clinical Metadata for ICU Beds */}
                {selectedAsset.metadata?.patient_id && (
                  <div className="inspector-section">
                    <div className="inspector-section-heading">
                      <HeartPulse size={14} style={{ color: '#EF4444' }} />
                      <span>Active Patient & Life Support Monitoring</span>
                    </div>
                    <div className="inspector-grid-2col">
                      <div className="inspector-metric-card">
                        <span className="metric-label">Patient ID</span>
                        <span className="metric-val font-mono">{selectedAsset.metadata.patient_id}</span>
                      </div>
                      <div className="inspector-metric-card">
                        <span className="metric-label">Ventilator State</span>
                        <span
                          className="metric-val font-mono"
                          style={{
                            color: selectedAsset.metadata.ventilator_active ? '#10B981' : '#64748B'
                          }}
                        >
                          {selectedAsset.metadata.ventilator_active ? 'ACTIVE (18 bpm)' : 'STANDBY'}
                        </span>
                      </div>
                      <div className="inspector-metric-card">
                        <span className="metric-label">Oxygen Saturation</span>
                        <span className="metric-val font-mono" style={{ color: '#00F0FF' }}>
                          {selectedAsset.metadata.spo2_pct}% SpO2
                        </span>
                      </div>
                      <div className="inspector-metric-card">
                        <span className="metric-label">Heart Rate</span>
                        <span className="metric-val font-mono" style={{ color: '#F59E0B' }}>
                          {selectedAsset.metadata.heart_rate_bpm} BPM
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Primary Telemetry & Power Infrastructure Feed */}
                <div className="inspector-section">
                  <div className="inspector-section-heading">
                    <Zap size={14} style={{ color: '#F59E0B' }} />
                    <span>Infrastructure & Power Feed</span>
                  </div>
                  <div className="inspector-grid-2col">
                    <div className="inspector-metric-card">
                      <span className="metric-label">Power Draw</span>
                      <span className="metric-val font-mono">
                        {selectedAsset.current_load?.toFixed(1) || 0} {selectedAsset.capacity_unit || 'kW'}
                      </span>
                    </div>
                    <div className="inspector-metric-card">
                      <span className="metric-label">Power Source</span>
                      <span className="metric-val font-mono" style={{ color: 'var(--accent-cyan)' }}>
                        {selectedAsset.metadata?.power_feed || selectedDef?.powerSource || 'Main Grid / Bus'}
                      </span>
                    </div>
                    {selectedAsset.temperature_c != null && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Temperature</span>
                        <span className="metric-val font-mono">{selectedAsset.temperature_c}°C</span>
                      </div>
                    )}
                    {selectedAsset.pressure_psi != null && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Gas Pressure</span>
                        <span className="metric-val font-mono">{selectedAsset.pressure_psi} PSI</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="inspector-actions">
                  <button
                    className="inspector-action-btn"
                    onClick={() => {
                      if (selectedDef?.floorId) {
                        handleSelectFloor(selectedDef.floorId)
                      }
                    }}
                  >
                    <Building size={14} />
                    <span>Isolate Level {selectedDef?.floor || 0}</span>
                  </button>
                  <button
                    className="inspector-action-btn primary"
                    onClick={() => {
                      const element = document.getElementById('dependency-graph')
                      if (element) element.scrollIntoView({ behavior: 'smooth' })
                    }}
                  >
                    <Activity size={14} />
                    <span>Trace Dependency Path</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="inspector-empty-state">
                <Info size={32} style={{ color: 'var(--accent-cyan)', opacity: 0.6 }} />
                <p>
                  Click on any 3D ICU Bed, Operating Theatre, ED Bay, or Infrastructure Asset to inspect live telemetry and clinical life-support state.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
