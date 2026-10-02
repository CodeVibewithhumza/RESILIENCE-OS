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
  CheckCircle2,
  Sun,
  Moon,
  SlidersHorizontal
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
  HydroWaterPump,
  ExteriorUtilityRiserTower,
  AmbulanceAccessGroundApron
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
function RadarScanWave({ isLight = false }) {
  const waveRef = useRef()

  useFrame(({ clock }) => {
    if (waveRef.current) {
      const t = (clock.getElapsedTime() * 0.4) % 1.0
      const radius = 2 + t * 26
      waveRef.current.scale.set(radius, radius, 1)
      waveRef.current.material.opacity = (1 - t) * (isLight ? 0.22 : 0.35)
    }
  })

  return (
    <mesh ref={waveRef} position={[2, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.96, 1.0, 64]} />
      <meshBasicMaterial color={isLight ? '#0284C7' : '#00F0FF'} side={THREE.DoubleSide} transparent opacity={isLight ? 0.22 : 0.3} />
    </mesh>
  )
}

/**
 * 100% Orthogonal Industrial Manhattan Pipeline & Riser System
 * Generates strictly axis-aligned (left, down, up, right) straight pipe segments
 * with 90-degree corner elbow fittings and animated traveling photon pulses.
 * Absolutely NO diagonal shortcut lines.
 */
function OrthogonalPipeline({
  start,
  end,
  type = 'power',
  color = '#00F0FF',
  isSevered = false,
  isDegraded = false,
  speed = 1.8,
  index = 0,
  isLight = false
}) {
  const pulseRef = useRef()
  const photon1Ref = useRef()
  const photon2Ref = useRef()

  // 1. Generate strictly 90° axis-aligned Manhattan waypoints
  const { segments, elbows, totalLength } = useMemo(() => {
    const x1 = start[0], y1 = start[1], z1 = start[2]
    const x2 = end[0], y2 = end[1], z2 = end[2]

    const yElev1 = y1 + 0.35
    const yElev2 = y2 + 0.35

    const isYard1 = x1 >= 6.5
    const isYard2 = x2 >= 6.5
    const isTower1 = x1 < 6.5
    const isTower2 = x2 < 6.5

    const rawWaypoints = []

    // CASE A: Intra-Yard (both source and consumer in the utility plant yard)
    if (isYard1 && isYard2) {
      const p0 = new THREE.Vector3(x1, yElev1, z1)
      if (Math.abs(z1 - z2) < 0.08) {
        // Purely straight along X
        const p1 = new THREE.Vector3(x2, yElev1, z2)
        rawWaypoints.push(p0, p1)
      } else if (Math.abs(x1 - x2) < 0.08) {
        // Purely straight along Z
        const p1 = new THREE.Vector3(x2, yElev1, z2)
        rawWaypoints.push(p0, p1)
      } else {
        // Route via yard utility pipe trench at intermediate X
        const xTrench = 11.4 + ((index % 3) - 1) * 0.2
        const p1 = new THREE.Vector3(xTrench, yElev1, z1) // along X
        const p2 = new THREE.Vector3(xTrench, yElev1, z2) // along Z
        const p3 = new THREE.Vector3(x2, yElev2, z2)       // along X
        rawWaypoints.push(p0, p1, p2, p3)
      }
    }
    // CASE B: Utility Yard to Hospital Tower (Major Supply Feeder Pipelines!)
    else if (isYard1 && isTower2) {
      // Designate parallel vertical tracks in MEP riser shaft (x = 5.2) by utility type
      let baseZ = 0.0
      if (type === 'medical_gas') baseZ = 0.95
      else if (type === 'critical_power') baseZ = -0.95
      else if (type === 'emergency_power') baseZ = -1.35
      else if (type === 'generator_backup') baseZ = -0.5
      else if (type === 'high_voltage') baseZ = -1.7
      else if (type === 'power') baseZ = -0.15
      else baseZ = 0.4

      const zRiser = baseZ + ((index % 3) - 1) * 0.12
      const xRiser = 5.2
      // Overhead gantry bridge elevation across the yard
      const yGantry = 1.6 + ((index % 4) * 0.22)

      // Strict sequence of 1-axis straight movements:
      // 0: Equipment takeoff
      const p0 = new THREE.Vector3(x1, yElev1, z1)
      // 1: Rise vertically UP to gantry rack
      const p1 = new THREE.Vector3(x1, yGantry, z1)
      // 2: Run along Z into the designated pipe rack track
      const p2 = new THREE.Vector3(x1, yGantry, zRiser)
      // 3: Run along X across overhead gantry bridge into MEP riser shaft
      const p3 = new THREE.Vector3(xRiser, yGantry, zRiser)
      // 4: Rise vertically UP (or drop) inside shaft to destination floor elevation
      const p4 = new THREE.Vector3(xRiser, yElev2, zRiser)
      // 5: Run along Z down the corridor to room's Z coordinate
      const p5 = new THREE.Vector3(xRiser, yElev2, z2)
      // 6: Run along X directly into target medical device / bed / OT
      const p6 = new THREE.Vector3(x2, yElev2, z2)

      rawWaypoints.push(p0, p1, p2, p3, p4, p5, p6)
    }
    // CASE C: Intra-Tower or Building to Yard
    else {
      const xRiser = 5.2
      const zRiser = 0.0 + ((index % 3) - 1) * 0.18
      const p0 = new THREE.Vector3(x1, yElev1, z1)

      if (Math.abs(yElev1 - yElev2) < 0.1) {
        // Same floor: 2-segment L-route along corridor
        const p1 = new THREE.Vector3(x1, yElev1, z2)
        const p2 = new THREE.Vector3(x2, yElev2, z2)
        rawWaypoints.push(p0, p1, p2)
      } else {
        // Multi-floor: route via riser shaft
        const p1 = new THREE.Vector3(xRiser, yElev1, z1)
        const p2 = new THREE.Vector3(xRiser, yElev1, zRiser)
        const p3 = new THREE.Vector3(xRiser, yElev2, zRiser)
        const p4 = new THREE.Vector3(xRiser, yElev2, z2)
        const p5 = new THREE.Vector3(x2, yElev2, z2)
        rawWaypoints.push(p0, p1, p2, p3, p4, p5)
      }
    }

    // Filter duplicate or zero-length points
    const waypoints = []
    for (let i = 0; i < rawWaypoints.length; i++) {
      const pt = rawWaypoints[i]
      if (waypoints.length === 0) {
        waypoints.push(pt)
      } else {
        const prev = waypoints[waypoints.length - 1]
        if (pt.distanceTo(prev) > 0.04) {
          waypoints.push(pt)
        }
      }
    }

    // Build straight cylinder segments
    const segs = []
    let totLen = 0
    const upVector = new THREE.Vector3(0, 1, 0)

    for (let i = 0; i < waypoints.length - 1; i++) {
      const pA = waypoints[i]
      const pB = waypoints[i + 1]
      const dir = pB.clone().sub(pA)
      const len = dir.length()
      if (len < 0.04) continue

      const mid = pA.clone().add(pB).multiplyScalar(0.5)
      const quat = new THREE.Quaternion().setFromUnitVectors(upVector, dir.clone().normalize())
      segs.push({
        start: pA,
        end: pB,
        mid,
        quaternion: quat,
        length: len,
        startDist: totLen
      })
      totLen += len
    }

    // Corner elbow joint positions (all intermediate waypoints where direction changes)
    const elbowsList = []
    for (let i = 1; i < waypoints.length - 1; i++) {
      elbowsList.push(waypoints[i])
    }

    return { segments: segs, elbows: elbowsList, totalLength: totLen }
  }, [start, end, type, index])

  // Radius sizing per utility type
  const { outerRad, innerRad, pulseRad } = useMemo(() => {
    if (type === 'medical_gas') return { outerRad: 0.042, innerRad: 0.024, pulseRad: 0.055 }
    if (type === 'high_voltage') return { outerRad: 0.052, innerRad: 0.028, pulseRad: 0.065 }
    if (type === 'critical_power' || type === 'emergency_power') return { outerRad: 0.046, innerRad: 0.025, pulseRad: 0.06 }
    if (type === 'generator_backup') return { outerRad: 0.046, innerRad: 0.025, pulseRad: 0.06 }
    return { outerRad: 0.038, innerRad: 0.020, pulseRad: 0.05 }
  }, [type])

  const beamColor = isSevered ? '#DC2626' : isDegraded ? '#F59E0B' : color

  // Traveling photon animation along piecewise orthogonal path
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * speed
    if (pulseRef.current) {
      if (isSevered) {
        pulseRef.current.opacity = 0.2 + Math.sin(t * 12) * 0.15
      } else if (isDegraded) {
        pulseRef.current.opacity = 0.5 + Math.sin(t * 6) * 0.3
      } else {
        pulseRef.current.opacity = 0.75 + Math.sin(t * 3) * 0.2
      }
    }

    if (!isSevered && totalLength > 0.1 && segments.length > 0) {
      // Photon 1
      const dist1 = (t * 2.2) % totalLength
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (dist1 >= seg.startDist && dist1 <= seg.startDist + seg.length) {
          const localProg = (dist1 - seg.startDist) / seg.length
          if (photon1Ref.current) {
            photon1Ref.current.position.copy(seg.start).lerp(seg.end, localProg)
          }
          break
        }
      }

      // Photon 2 (offset by 50% along total path)
      const dist2 = (t * 2.2 + totalLength * 0.5) % totalLength
      for (let i = 0; i < segments.length; i++) {
        const seg = segments[i]
        if (dist2 >= seg.startDist && dist2 <= seg.startDist + seg.length) {
          const localProg = (dist2 - seg.startDist) / seg.length
          if (photon2Ref.current) {
            photon2Ref.current.position.copy(seg.start).lerp(seg.end, localProg)
          }
          break
        }
      }
    }
  })

  return (
    <group>
      {/* 1. Straight Cylindrical Pipeline Segments (Outer Sleeve + Inner Fluid/Energy Core) */}
      {segments.map((seg, sIdx) => (
        <group key={`seg-${sIdx}`} position={seg.mid} quaternion={seg.quaternion}>
          {/* Metallic Industrial Pipe Sleeve */}
          <mesh>
            <cylinderGeometry args={[outerRad, outerRad, seg.length, 10]} />
            <meshStandardMaterial
              color={isLight ? '#64748B' : '#0F172A'}
              roughness={isLight ? 0.18 : 0.2}
              metalness={0.9}
              transparent
              opacity={isLight ? 0.55 : 0.45}
            />
          </mesh>

          {/* Inner Glowing Fluid / Power Stream */}
          <mesh>
            <cylinderGeometry args={[innerRad, innerRad, seg.length, 8]} />
            <meshBasicMaterial
              ref={sIdx === 0 ? pulseRef : null}
              color={beamColor}
              transparent
              opacity={isSevered ? 0.2 : 0.88}
            />
          </mesh>
        </group>
      ))}

      {/* 2. 90-Degree Corner Elbow Joint Fittings with Illuminated Collar */}
      {elbows.map((pt, eIdx) => (
        <group key={`elbow-${eIdx}`} position={pt}>
          <mesh>
            <sphereGeometry args={[outerRad * 1.35, 12, 12]} />
            <meshStandardMaterial color={isLight ? '#475569' : '#1E293B'} metalness={0.95} roughness={0.15} />
          </mesh>
          <mesh>
            <sphereGeometry args={[outerRad * 0.95, 8, 8]} />
            <meshBasicMaterial color={beamColor} transparent opacity={isSevered ? 0.2 : 0.65} />
          </mesh>
        </group>
      ))}

      {/* 3. Travelling Animated Photon 1 */}
      {!isSevered && (
        <mesh ref={photon1Ref}>
          <sphereGeometry args={[pulseRad, 10, 10]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )}

      {/* 4. Travelling Animated Photon 2 */}
      {!isSevered && (
        <mesh ref={photon2Ref}>
          <sphereGeometry args={[pulseRad * 0.85, 8, 8]} />
          <meshBasicMaterial color={beamColor} />
        </mesh>
      )}
    </group>
  )
}

// Backward compatibility alias
const DynamicEnergyBeam = OrthogonalPipeline

/**
 * Interactive Hospital Node with Procedural Mesh and Smart HUD Card
 */
function HospitalAssetNode({
  asset,
  topoDef,
  isSelected,
  onSelect,
  hudMode = 'smart',
  sourceAssetId = null,
  activeFloor = 'all'
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

  // Is this node the primary root cause of the crisis or actively distressed?
  const isSourceFailure = useMemo(() => {
    if (status === 'failed') return true
    if (sourceAssetId && (asset?.id === sourceAssetId || label === sourceAssetId) && (status === 'critical' || status === 'degraded')) {
      return true
    }
    return false
  }, [sourceAssetId, asset?.id, label, status])

  // Compact, human-friendly short label to avoid horizontal crowding
  const shortLabel = useMemo(() => {
    if (meshType === 'icu_bed') return `ICU ${bedNumber || label.replace('ICU_BED_', '')}`
    if (meshType === 'operating_theatre') return `OT ${label.replace('OT_SUITE_', '')}`
    if (meshType === 'emergency_bay') return `ED ${bayNumber || label.replace('ED_BAY_', '')}`
    if (meshType === 'ward_bed') return `Room ${roomNumber || label.replace('WARD_ROOM_', '')}`
    if (meshType === 'nurse_station') return 'Nurse Stn'
    if (meshType === 'admin_hub') return 'Admin Ops'
    if (meshType === 'ambulance_bay') return 'Ambulance'
    if (meshType === 'transformer') return 'Transformer'
    if (meshType === 'generator') return 'Diesel Gen'
    if (meshType === 'ups') return 'UPS Battery'
    if (meshType === 'chiller') return 'Chiller'
    if (meshType === 'oxygen') return 'Cryo O2'
    if (meshType === 'water_pump') return 'Water Pump'
    if (meshType === 'switchgear') return 'Main Bus'
    if (meshType === 'substation') return '11kV Grid'
    return label.replace(/_/g, ' ')
  }, [meshType, bedNumber, roomNumber, bayNumber, label])

  // Anti-Collision 3D Height Staggering:
  // Alternates elevations between adjacent beds and rooms so tags never overlap in perspective view
  const tagYOffset = useMemo(() => {
    if (meshType === 'substation') return 3.4
    if (meshType === 'oxygen') return 2.8
    if (meshType === 'chiller') return 2.6
    if (meshType === 'generator') return 2.1
    if (meshType === 'transformer') return 2.4
    if (meshType === 'ups') return 2.3
    if (meshType === 'switchgear') return 2.0
    if (meshType === 'water_pump') return 2.2

    // Alternate elevations between adjacent beds so neighboring tags don't touch
    if (meshType === 'icu_bed') {
      const n = parseInt(bedNumber, 10) || 1
      return n % 2 === 1 ? 1.85 : 2.45
    }
    if (meshType === 'emergency_bay') {
      const n = parseInt(bayNumber, 10) || 1
      return n % 2 === 1 ? 1.85 : 2.4
    }
    if (meshType === 'ward_bed') {
      const n = parseInt(roomNumber, 10) || 1
      return n % 2 === 1 ? 1.85 : 2.4
    }
    if (meshType === 'operating_theatre') {
      return label.includes('02') ? 2.45 : 1.9
    }
    return 2.1
  }, [meshType, bedNumber, bayNumber, roomNumber, label])

  // SMART HUD VISIBILITY (Combined Option 1 & 2):
  // - If hovered or clicked: ALWAYS show tag!
  // - If primary failure source: ALWAYS show tag in 3D (e.g. Transformer 01)!
  // - If activeFloor === 'all' (Campus Overview):
  //   Keep 3D building clean and pristine! (Floor summary badges on slabs + Side matrix show the data).
  // - If activeFloor !== 'all' (Single Floor Drill-down):
  //   Show tags for the 4-6 assets on THIS focused floor!
  const isTagVisible = useMemo(() => {
    if (hovered || isSelected) return true
    if (isSourceFailure) return true
    if (hudMode === 'all') return true
    if (activeFloor !== 'all') {
      return topoDef.floorId === activeFloor
    }
    return false
  }, [hovered, isSelected, isSourceFailure, hudMode, activeFloor, topoDef.floorId])

  // Wide telemetry pill expands only on hover, selection, root failure, or critical distress
  const showTelemetryPill = hovered || isSelected || isSourceFailure || status === 'critical' || status === 'failed'

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

      {/* 3D Hologram Floating Tag with Staggered Height */}
      {isTagVisible && (
        <Html
          position={[0, tagYOffset, 0]}
          center
          distanceFactor={22}
          zIndexRange={[100, 0]}
        >
          <div
            className={`twin-hologram-hud ${isSelected ? 'is-selected' : ''} ${
              hovered ? 'is-hovered' : ''
            } ${isSourceFailure ? 'is-source-failure' : ''} status-${status}`}
            onClick={handleClick}
          >
            <div className="hud-header">
              <span
                className={`hud-status-beacon ${isSourceFailure ? 'beacon-alert-pulse' : ''}`}
                style={{
                  backgroundColor: statusColor,
                  boxShadow: `0 0 8px ${statusColor}`
                }}
              />
              <span className="hud-label-id">{shortLabel}</span>
              {isSourceFailure && (
                <span className="hud-source-badge font-mono">
                  {status === 'failed' ? 'FAILED' : 'ALARM'}
                </span>
              )}
              {showTelemetryPill && primaryTelemetry && (
                <span className="hud-metric-pill font-mono">{primaryTelemetry}</span>
              )}
            </div>

            {/* Leader Stem Line */}
            <div className="hud-leader-line" />

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
  cameraPreset = 'isometric',
  theme = 'dark',
  sourceAssetId = null,
  floorSummaries = {},
  onSelectFloor = null
}) {
  const controlsRef = useRef()
  const isLight = theme === 'light'

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

      {/* 3D Canvas Background & Fog */}
      <color attach="background" args={[isLight ? '#EBF1F6' : '#060B17']} />
      <fog attach="fog" args={[isLight ? '#EBF1F6' : '#060B17', 28, 120]} />

      {/* Atmospheric Space Lighting */}
      <ambientLight
        intensity={isLight ? 1.35 : xrayMode ? 0.45 : 0.95}
        color={isLight ? '#FFFFFF' : '#0B132B'}
      />
      <directionalLight
        position={[15, 28, 20]}
        intensity={isLight ? 2.1 : 1.7}
        color={isLight ? '#FFFDF5' : '#F8FAFC'}
        castShadow
      />
      <directionalLight
        position={[-15, -10, -12]}
        intensity={isLight ? 0.65 : 0.45}
        color={isLight ? '#BAE6FD' : '#38BDF8'}
      />
      <directionalLight
        position={[0, 20, -18]}
        intensity={isLight ? 0.75 : 0.65}
        color={isLight ? '#E2E8F0' : '#818CF8'}
      />

      {/* Cyber Floating Dust Particles */}
      {showParticles && (
        <Sparkles
          count={120}
          scale={[34, 18, 34]}
          size={2.4}
          speed={0.4}
          color={isLight ? '#0284C7' : '#00F0FF'}
          opacity={isLight ? 0.22 : 0.35}
        />
      )}

      {/* Radar Sonar Wave */}
      <RadarScanWave isLight={isLight} />

      {/* Campus Ground Grid */}
      <gridHelper
        args={[46, 46, '#0284C7', isLight ? '#CBD5E1' : '#0F172A']}
        position={[0, -0.16, 0]}
      />

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
              isLight={isLight}
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
                  borderLeft: `3px solid ${floorSummaries[floor.id]?.badgeColor || floor.color}`,
                  backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(6, 11, 23, 0.9)',
                  color: isLight ? '#0F172A' : '#F8FAFC',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  if (onSelectFloor) onSelectFloor(floor.id)
                }}
                title={`Click to focus on ${floor.name}`}
              >
                <span className="slab-level-num" style={{ color: floorSummaries[floor.id]?.badgeColor || floor.color }}>
                  L{floor.level}
                </span>
                <span className="slab-name" style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}>
                  {floor.shortName}
                </span>
                {floorSummaries[floor.id]?.badgeText && (
                  <span
                    className="slab-summary-pill"
                    style={{
                      backgroundColor: `${floorSummaries[floor.id].badgeColor}22`,
                      color: floorSummaries[floor.id].badgeColor,
                      borderColor: `${floorSummaries[floor.id].badgeColor}55`
                    }}
                  >
                    {floorSummaries[floor.id].badgeText}
                  </span>
                )}
              </div>
            </Html>
          </group>
        )
      })}

      {/* Hospital Rooftop with Helipad & Air Ambulance */}
      {(activeFloor === 'all' || activeFloor === 'floor_3') && (
        <HospitalRooftop showRoof={showWalls} xrayMode={xrayMode} isLight={isLight} />
      )}

      {/* Realistic Industrial Utility & Infrastructure Yard */}
      {(activeFloor === 'all' || activeFloor === 'floor_0') && (
        <group>
          <IndustrialPlantYard xrayMode={xrayMode} isLight={isLight} />
          <Html position={[11.6, 0.4, 7.2]} center distanceFactor={22} zIndexRange={[50, 0]}>
            <div
              className="floor-slab-label-tag"
              style={{
                borderLeft: `3px solid ${floorSummaries['floor_0']?.badgeColor || '#00F0FF'}`,
                backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(6, 11, 23, 0.9)',
                color: isLight ? '#0F172A' : '#F8FAFC',
                cursor: 'pointer'
              }}
              onClick={(e) => {
                e.stopPropagation()
                if (onSelectFloor) onSelectFloor('floor_0')
              }}
              title="Click to focus on Utility Yard"
            >
              <span className="slab-level-num" style={{ color: floorSummaries['floor_0']?.badgeColor || '#00F0FF' }}>
                L0
              </span>
              <span className="slab-name" style={{ color: isLight ? '#0F172A' : '#F8FAFC' }}>
                Utility & Substation Plant
              </span>
              {floorSummaries['floor_0']?.badgeText && (
                <span
                  className="slab-summary-pill"
                  style={{
                    backgroundColor: `${floorSummaries['floor_0'].badgeColor}22`,
                    color: floorSummaries['floor_0'].badgeColor,
                    borderColor: `${floorSummaries['floor_0'].badgeColor}55`
                  }}
                >
                  {floorSummaries['floor_0'].badgeText}
                </span>
              )}
            </div>
          </Html>
        </group>
      )}

      {/* Exterior Architectural MEP Vertical Utility Riser Tower & Service Bridge (x = 5.2) */}
      <ExteriorUtilityRiserTower xrayMode={xrayMode} activeFloor={activeFloor} isLight={isLight} />

      {/* Ambulance Ground Access Apron on Hospital West Side (Emergency Intake) */}
      <AmbulanceAccessGroundApron isLight={isLight} />

      {/* Dynamic 100% Orthogonal Industrial Manhattan Pipelines & Risers */}
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
            <OrthogonalPipeline
              key={`conn-${idx}`}
              index={idx}
              start={fromDef.position}
              end={toDef.position}
              type={conn.type}
              color={conn.color}
              isSevered={isSevered}
              isDegraded={isDegraded}
              speed={conn.speed || 1.8}
              isLight={isLight}
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
            sourceAssetId={sourceAssetId}
            activeFloor={activeFloor}
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
  incident = null,
  selectedAssetId: controlledSelectedAssetId,
  onSelectAsset,
  filterSubsystem = 'all',
  viewMode = '3d',
  activeLayers = {},
  theme: controlledTheme,
  onToggleTheme: controlledToggleTheme,
  hudMode: controlledHudMode,
  autoOpenInspector = false,
  enableInternalMatrix = true
}) {
  const [internalSelectedAssetId, setInternalSelectedAssetId] = useState(null)
  const selectedAssetId =
    controlledSelectedAssetId !== undefined ? controlledSelectedAssetId : internalSelectedAssetId

  const handleSelectAsset = (id) => {
    setInternalSelectedAssetId(id)
    if (id) {
      setIsInspectorOpen(true)
    } else {
      setIsInspectorOpen(false)
    }
    if (onSelectAsset) {
      onSelectAsset(id)
    }
  }

  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeFloor, setActiveFloor] = useState('all')
  const [cameraPreset, setCameraPreset] = useState('isometric')
  const [showConduits, setShowConduits] = useState(true)
  const [hudMode, setHudMode] = useState(controlledHudMode || 'smart')

  useEffect(() => {
    if (controlledHudMode) setHudMode(controlledHudMode)
  }, [controlledHudMode])
  const [showParticles, setShowParticles] = useState(true)
  const [showWalls, setShowWalls] = useState(true)
  const [xrayMode, setXrayMode] = useState(false)
  const [isDroneTour, setIsDroneTour] = useState(false)
  const [isInspectorOpen, setIsInspectorOpen] = useState(false)
  const [isMatrixOpen, setIsMatrixOpen] = useState(false)
  const [matrixFilter, setMatrixFilter] = useState('all')
  const [isMuted, setIsMuted] = useState(false)
  const [simulatedOverrides, setSimulatedOverrides] = useState({})

  // 3D Viewport Theme (Light / Dark)
  const [internalTheme, setInternalTheme] = useState(() => {
    return (
      localStorage.getItem('twin_3d_theme') ||
      document.documentElement.getAttribute('data-theme') ||
      'dark'
    )
  })

  const twinTheme = controlledTheme !== undefined ? controlledTheme : internalTheme

  // Sync with global theme changes if toggled elsewhere
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const docTheme = document.documentElement.getAttribute('data-theme')
      if (docTheme && (docTheme === 'light' || docTheme === 'dark')) {
        setInternalTheme(docTheme)
      }
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    })
    return () => observer.disconnect()
  }, [])

  const handleToggleTheme = () => {
    soundEngine.playSelect()
    if (controlledToggleTheme) {
      controlledToggleTheme()
    } else {
      const nextTheme = twinTheme === 'dark' ? 'light' : 'dark'
      setInternalTheme(nextTheme)
      localStorage.setItem('twin_3d_theme', nextTheme)
    }
  }

  // Derive category directly from parent filterSubsystem (no duplicate buttons!)
  const activeCategory = useMemo(() => {
    if (filterSubsystem === 'electrical') return 'power'
    if (filterSubsystem === 'water' || filterSubsystem === 'hvac') return 'mechanical'
    if (filterSubsystem === 'gas') return 'gas'
    if (filterSubsystem === 'services') return 'clinical'
    return 'all'
  }, [filterSubsystem])

  // Sync mute state
  useEffect(() => {
    soundEngine.muted = isMuted
  }, [isMuted])

  // Fast map lookup with active crisis simulation overrides applied
  const assetsMap = useMemo(() => {
    const map = {}

    // Seed with rich default topology specifications for all modeled assets
    Object.entries(ASSET_TOPOLOGY_DEFS).forEach(([id, def]) => {
      map[id] = {
        id,
        name: def.subsystem || def.label,
        status: 'normal',
        health_score: 100,
        current_load: 0,
        capacity_unit: 'kW',
        ...def
      }
    })

    // Overlay live backend assets
    assets.forEach((a) => {
      map[a.id] = { ...(map[a.id] || {}), ...a }
    })

    // Overlay clinical services health onto matching clinical beds/rooms/wings
    if (Array.isArray(services) && services.length > 0) {
      const svcMap = new Map(services.map((s) => [s.id, s]))
      Object.entries(ASSET_TOPOLOGY_DEFS).forEach(([id, def]) => {
        if (def.serviceId && svcMap.has(def.serviceId)) {
          const s = svcMap.get(def.serviceId)
          if (s.at_risk || s.status === 'compromised' || s.status === 'critical_only' || (typeof s.service_continuity_pct === 'number' && s.service_continuity_pct < 90)) {
            const isCritical = s.status === 'compromised' || (s.service_continuity_pct != null && s.service_continuity_pct < 50)
            map[id] = {
              ...map[id],
              status: isCritical ? 'critical' : 'degraded',
              health_score: typeof s.service_continuity_pct === 'number' ? s.service_continuity_pct : 60,
              serviceStatus: s.status,
              serviceContinuity: s.service_continuity_pct
            }
          }
        }
      })
    }

    // Overlay active incident overrides directly on source and affected assets
    if (incident?.is_active) {
      if (incident.source_asset_id && map[incident.source_asset_id]) {
        map[incident.source_asset_id] = {
          ...map[incident.source_asset_id],
          status: 'failed',
          health_score: 0.0
        }
      }
      if (Array.isArray(incident.affected_asset_ids)) {
        incident.affected_asset_ids.forEach((affId) => {
          if (map[affId] && affId !== incident.source_asset_id) {
            if (map[affId].status === 'normal') {
              map[affId] = {
                ...map[affId],
                status: 'degraded',
                health_score: Math.min(map[affId].health_score || 100, 50.0)
              }
            }
          }
        })
      }
    }

    // Overlay active crisis simulation overrides
    Object.entries(simulatedOverrides).forEach(([id, override]) => {
      if (map[id]) {
        map[id] = { ...map[id], ...override }
      } else {
        map[id] = { id, status: 'normal', ...override }
      }
    })

    return map
  }, [assets, services, incident, simulatedOverrides])

  const selectedDef = selectedAssetId ? ASSET_TOPOLOGY_DEFS[selectedAssetId] : null
  const selectedAsset = selectedAssetId ? assetsMap[selectedAssetId] : null

  // Auto-open inspector drawer whenever an asset ID is selected
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

  // Floor-level smart summary stats for Option 2 Level-of-Detail
  const floorSummaries = useMemo(() => {
    const summaries = {}
    const floorIds = ['floor_3', 'floor_2', 'floor_1', 'floor_0']

    floorIds.forEach((fId) => {
      const assetsOnFloor = Object.entries(ASSET_TOPOLOGY_DEFS)
        .filter(([, def]) => def.floorId === fId)
        .map(([id]) => assetsMap[id] || { id, status: 'normal' })

      const failed = assetsOnFloor.filter((a) => a.status === 'failed').length
      const critical = assetsOnFloor.filter((a) => a.status === 'critical').length
      const degraded = assetsOnFloor.filter((a) => a.status === 'degraded').length
      const total = assetsOnFloor.length

      let badgeText = 'All Nominal'
      let badgeColor = '#10B981'
      let badgeStatus = 'normal'

      if (failed > 0) {
        badgeText = `${failed} FAILED`
        badgeColor = '#EF4444'
        badgeStatus = 'failed'
      } else if (critical > 0) {
        badgeText = `${critical} Critical Alerts`
        badgeColor = '#EF4444'
        badgeStatus = 'critical'
      } else if (degraded > 0) {
        badgeText = `${degraded}/${total} Degraded`
        badgeColor = '#F59E0B'
        badgeStatus = 'degraded'
      }

      summaries[fId] = {
        total,
        failed,
        critical,
        degraded,
        badgeText,
        badgeColor,
        badgeStatus
      }
    })

    return summaries
  }, [assetsMap])

  // Telemetry Matrix Table Data Rows (Option 1)
  const matrixRows = useMemo(() => {
    return Object.entries(ASSET_TOPOLOGY_DEFS).map(([id, def]) => {
      const asset = assetsMap[id] || {}
      const status = asset.status || 'normal'

      let telemetry = null
      if (asset.metadata?.ventilator_active) telemetry = 'Ventilator: ON'
      else if (asset.metadata?.spo2_pct) telemetry = `SpO2: ${asset.metadata.spo2_pct}%`
      else if (asset.current_load != null && asset.capacity_unit) {
        telemetry = `${asset.current_load.toFixed(0)} ${asset.capacity_unit}`
      } else if (asset.fuel_level_pct != null) telemetry = `${asset.fuel_level_pct}% Fuel`
      else if (asset.battery_level_pct != null) telemetry = `${asset.battery_level_pct}% Bat`
      else if (asset.temperature_c != null) telemetry = `${asset.temperature_c}°C`
      else if (asset.pressure_psi != null) telemetry = `${asset.pressure_psi} PSI`

      let shortName = def.label
      if (def.meshType === 'icu_bed') shortName = `ICU Bed ${def.bedNumber}`
      else if (def.meshType === 'operating_theatre') shortName = `OT Suite ${def.label.replace('OT_SUITE_', '')}`
      else if (def.meshType === 'emergency_bay') shortName = `Trauma Bay ${def.bayNumber}`
      else if (def.meshType === 'ward_bed') shortName = `Ward Room ${def.roomNumber}`
      else if (def.meshType === 'nurse_station') shortName = 'Nurse Station'
      else if (def.meshType === 'admin_hub') shortName = 'Admin Operations'
      else if (def.meshType === 'ambulance_bay') shortName = 'Ambulance Intake'
      else if (def.meshType === 'transformer') shortName = 'Primary Transformer'
      else if (def.meshType === 'generator') shortName = 'Diesel Generator'
      else if (def.meshType === 'ups') shortName = 'Critical Battery UPS'
      else if (def.meshType === 'chiller') shortName = 'Chiller Plant'
      else if (def.meshType === 'oxygen') shortName = 'Cryo O2 Manifold'
      else if (def.meshType === 'water_pump') shortName = 'Water Pump Station'
      else if (def.meshType === 'switchgear') shortName = 'Main Power Bus'
      else if (def.meshType === 'substation') shortName = '11kV Grid Main'

      const floorBadge =
        def.floorId === 'floor_3'
          ? 'L3'
          : def.floorId === 'floor_2'
          ? 'L2'
          : def.floorId === 'floor_1'
          ? 'L1'
          : 'L0'

      return {
        id,
        shortName,
        subsystem: def.subsystem || def.label,
        floorId: def.floorId,
        floorBadge,
        status,
        healthScore: asset.health_score != null ? asset.health_score : 100,
        telemetryText: telemetry || 'Nominal',
        isSourceFailure:
          (incident?.source_asset_id &&
            (id === incident.source_asset_id || def.label === incident.source_asset_id)) ||
          status === 'failed'
      }
    })
  }, [assetsMap, incident])

  const crisisAssetCount = useMemo(() => {
    return matrixRows.filter(
      (r) => r.status === 'failed' || r.status === 'critical' || r.status === 'degraded'
    ).length
  }, [matrixRows])

  const filteredMatrixRows = useMemo(() => {
    return matrixRows.filter((row) => {
      if (matrixFilter === 'critical') {
        return row.status === 'failed' || row.status === 'critical' || row.status === 'degraded'
      }
      if (matrixFilter === 'floor_3') return row.floorId === 'floor_3'
      if (matrixFilter === 'floor_2') return row.floorId === 'floor_2'
      if (matrixFilter === 'floor_1') return row.floorId === 'floor_1'
      if (matrixFilter === 'floor_0') return row.floorId === 'floor_0'
      return true
    })
  }, [matrixRows, matrixFilter])

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
      className={`twin-master-panel ${isFullscreen ? 'is-fullscreen-twin' : ''} theme-${twinTheme}`}
      data-theme={twinTheme}
      id="twin-viewport"
    >
      {/* 1. Sleek Single-Line Command Bar */}
      <div className="twin-header-compact">
        {/* Left: Branding & Status */}
        <div className="twin-title-group">
          <div className="twin-status-beacon" />
          <span className="twin-compact-title">HOSPITAL DIGITAL TWIN 3D</span>
          <span className="twin-live-tag">LIVE BIM SYNC</span>
          <span className="twin-nodes-count font-mono">{stats.normalCount} Nodes Online</span>
        </div>

        {/* Center: Segmented Floor Switcher */}
        <div className="twin-floor-pills">
          <button
            type="button"
            className={`floor-pill-btn ${activeFloor === 'all' ? 'active' : ''}`}
            onClick={() => handleSelectFloor('all')}
          >
            All Floors
          </button>
          {FLOOR_DEFINITIONS.map((floor) => (
            <button
              key={floor.id}
              type="button"
              className={`floor-pill-btn ${activeFloor === floor.id ? 'active' : ''}`}
              onClick={() => handleSelectFloor(floor.id)}
            >
              <span className="floor-color-dot" style={{ backgroundColor: floor.color }} />
              {floor.shortName}
            </button>
          ))}
        </div>

        {/* Right: Essential 3D Viewport Controls */}
        <div className="twin-actions-compact">
          <button
            type="button"
            className={`twin-compact-btn ${isDroneTour ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playSelect()
              setIsDroneTour(!isDroneTour)
            }}
            title={isDroneTour ? 'Pause Drone Tour' : 'Start Cinematic 360 Drone Tour'}
          >
            {isDroneTour ? <Pause size={12} /> : <Play size={12} />}
            <span>Drone</span>
          </button>

          <button
            type="button"
            className={`twin-compact-btn ${xrayMode ? 'active' : ''}`}
            onClick={() => {
              soundEngine.playSelect()
              setXrayMode(!xrayMode)
            }}
            title="Toggle X-Ray CAD Blueprint Mode"
          >
            <SparklesIcon size={12} />
            <span>X-Ray</span>
          </button>

          <button
            type="button"
            className={`twin-compact-btn ${showConduits ? 'active' : ''}`}
            onClick={() => setShowConduits(!showConduits)}
            title="Toggle Conduit Energy Lines"
          >
            <Activity size={12} />
            <span>Conduits</span>
          </button>

          {/* Option 1: Live Side Telemetry Matrix Toggle (when internal matrix is enabled) */}
          {enableInternalMatrix && (
            <button
              type="button"
              className={`twin-compact-btn ${isMatrixOpen ? 'active' : ''}`}
              onClick={() => {
                soundEngine.playSelect()
                setIsMatrixOpen(!isMatrixOpen)
              }}
              title="Toggle Live Asset Telemetry Matrix"
            >
              <SlidersHorizontal size={12} />
              <span>Matrix</span>
              {crisisAssetCount > 0 && (
                <span className="matrix-badge-counter">{crisisAssetCount}</span>
              )}
            </button>
          )}

          {/* Light / Dark Theme Switcher */}
          <button
            type="button"
            className={`twin-compact-btn theme-toggle-btn ${twinTheme === 'light' ? 'is-light active' : ''}`}
            onClick={handleToggleTheme}
            title={twinTheme === 'light' ? 'Switch to Dark Cyber Theme' : 'Switch to Clean Daylight Theme'}
          >
            {twinTheme === 'light' ? <Sun size={12} style={{ color: '#EAB308' }} /> : <Moon size={12} />}
            <span>{twinTheme === 'light' ? 'Light' : 'Dark'}</span>
          </button>

          <div className="camera-select-wrapper">
            <Camera size={12} style={{ color: 'var(--text-muted)' }} />
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

          <button
            type="button"
            className="twin-compact-btn icon-only"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
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
            toneMappingExposure: twinTheme === 'light' ? 1.05 : 1.15
          }}
        >
          <DigitalTwinScene
            assetsMap={assetsMap}
            selectedAssetId={selectedAssetId}
            onSelectNode={handleSelectAsset}
            showConduits={showConduits}
            hudMode={hudMode}
            showParticles={showParticles}
            showWalls={showWalls}
            xrayMode={xrayMode}
            isDroneTour={isDroneTour}
            activeFloor={activeFloor}
            activeCategory={activeCategory}
            cameraPreset={cameraPreset}
            theme={twinTheme}
            sourceAssetId={incident?.source_asset_id}
            floorSummaries={floorSummaries}
            onSelectFloor={handleSelectFloor}
          />
        </Canvas>

        {/* Option 1: Live Side Telemetry Matrix Panel (when internal matrix is enabled) */}
        {enableInternalMatrix && isMatrixOpen && (
          <div className="twin-side-matrix-panel">
            <div className="matrix-header">
              <div className="matrix-title-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="matrix-title">TELEMETRY MATRIX</span>
                  {crisisAssetCount > 0 && (
                    <span className="matrix-alert-counter">{crisisAssetCount} ALERTS</span>
                  )}
                </div>
                <button
                  type="button"
                  className="matrix-close-btn"
                  onClick={() => setIsMatrixOpen(false)}
                  title="Close Telemetry Matrix"
                >
                  &times;
                </button>
              </div>

              {/* Floor / Category Quick Tabs */}
              <div className="matrix-tabs-row">
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setMatrixFilter('all')
                    handleSelectFloor('all')
                  }}
                >
                  All ({matrixRows.length})
                </button>
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'critical' ? 'active' : ''}`}
                  onClick={() => setMatrixFilter('critical')}
                >
                  Alerts ({crisisAssetCount})
                </button>
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'floor_3' ? 'active' : ''}`}
                  onClick={() => {
                    setMatrixFilter('floor_3')
                    handleSelectFloor('floor_3')
                  }}
                >
                  L3 ICU
                </button>
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'floor_2' ? 'active' : ''}`}
                  onClick={() => {
                    setMatrixFilter('floor_2')
                    handleSelectFloor('floor_2')
                  }}
                >
                  L2 Wards
                </button>
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'floor_1' ? 'active' : ''}`}
                  onClick={() => {
                    setMatrixFilter('floor_1')
                    handleSelectFloor('floor_1')
                  }}
                >
                  L1 ED
                </button>
                <button
                  type="button"
                  className={`matrix-tab-btn ${matrixFilter === 'floor_0' ? 'active' : ''}`}
                  onClick={() => {
                    setMatrixFilter('floor_0')
                    handleSelectFloor('floor_0')
                  }}
                >
                  L0 Plant
                </button>
              </div>
            </div>

            {/* Matrix Rows List */}
            <div className="matrix-list-body">
              {filteredMatrixRows.map((row) => (
                <div
                  key={row.id}
                  className={`matrix-row-card status-${row.status} ${
                    selectedAssetId === row.id ? 'is-selected' : ''
                  }`}
                  onClick={() => {
                    soundEngine.playSelect()
                    handleSelectAsset(row.id)
                    handleSelectFloor(row.floorId || 'all')
                  }}
                  title={`Click to inspect ${row.shortName}`}
                >
                  <div className="matrix-left-col">
                    <span
                      className="matrix-status-dot"
                      style={{
                        backgroundColor: STATUS_COLORS[row.status] || '#10B981',
                        boxShadow: `0 0 6px ${STATUS_COLORS[row.status] || '#10B981'}`
                      }}
                    />
                    <div className="matrix-text-col">
                      <div className="matrix-name-row">
                        <span className="matrix-asset-title">{row.shortName}</span>
                        <span className="matrix-floor-chip">{row.floorBadge}</span>
                      </div>
                      <span className="matrix-sub-text">{row.subsystem}</span>
                    </div>
                  </div>

                  <div className="matrix-right-col">
                    <span className="matrix-telemetry-text">{row.telemetryText}</span>
                    <span className={`matrix-status-pill status-${row.status}`}>
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
              <button
                className="inspector-close-btn"
                onClick={() => {
                  setIsInspectorOpen(false)
                  handleSelectAsset(null)
                }}
                title="Back to Telemetry Matrix"
              >
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
                        <span className="metric-label">Pressure</span>
                        <span className="metric-val font-mono">{selectedAsset.pressure_psi} PSI</span>
                      </div>
                    )}
                    {selectedAsset.metadata?.fuel_level_pct != null && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Diesel Reserve</span>
                        <span className="metric-val font-mono" style={{ color: '#EAB308' }}>
                          {selectedAsset.metadata.fuel_level_pct}% ({selectedAsset.metadata.endurance_hours}h)
                        </span>
                      </div>
                    )}
                    {selectedAsset.metadata?.irradiance && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Solar Irradiance</span>
                        <span className="metric-val font-mono" style={{ color: '#F59E0B' }}>
                          {selectedAsset.metadata.irradiance}
                        </span>
                      </div>
                    )}
                    {selectedAsset.metadata?.medevac_status && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Flight Operations</span>
                        <span className="metric-val font-mono" style={{ color: '#10B981' }}>
                          {selectedAsset.metadata.medevac_status}
                        </span>
                      </div>
                    )}
                    {selectedAsset.metadata?.certification && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Safety Standard</span>
                        <span className="metric-val font-mono" style={{ color: '#EF4444' }}>
                          {selectedAsset.metadata.certification}
                        </span>
                      </div>
                    )}
                    {selectedAsset.metadata?.air_bar && (
                      <div className="inspector-metric-card">
                        <span className="metric-label">Air / Vacuum</span>
                        <span className="metric-val font-mono" style={{ color: '#00F0FF' }}>
                          {selectedAsset.metadata.air_bar} / {selectedAsset.metadata.vacuum_bar} Bar
                        </span>
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
