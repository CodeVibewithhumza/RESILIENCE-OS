import { useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Html } from '@react-three/drei'
import * as THREE from 'three'
import {
  Layers,
  Box,
  Info,
  Activity,
  Zap,
  Thermometer,
  Gauge,
  Fuel,
  BatteryCharging,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Compass
} from 'lucide-react'
import './TwinContainer.css'

// ============================================================================
// Canonical 3D Layout Coordinates and Geometric Definitions for 11 Assets
// Preserving exact asset IDs from frontend/src/mock/hospitalInitialData.js
// ============================================================================

export const STATUS_COLORS = {
  normal: '#10B981',    // Stable Emerald
  degraded: '#F59E0B',  // Amber Caution
  critical: '#EF4444',  // Coral Alert
  failed: '#DC2626',    // Crimson Failure
  offline: '#4B5563',   // Muted Slate
  starting: '#06B6D4'   // Cyan Transitional
}

const ASSET_TOPOLOGY_DEFS = {
  GRID_MAIN: {
    position: [-8.5, 0.6, 0],
    geometryType: 'cylinder',
    args: [0.9, 1.0, 1.2, 16],
    height: 1.2,
    subsystem: 'Primary Power',
    label: 'GRID_MAIN'
  },
  TRANSFORMER_01: {
    position: [-4.8, 0.55, -2.8],
    geometryType: 'box',
    args: [1.3, 1.1, 1.1],
    height: 1.1,
    subsystem: 'Substation A',
    label: 'TRANSFORMER_01'
  },
  TRANSFORMER_02: {
    position: [-4.8, 0.55, 2.8],
    geometryType: 'box',
    args: [1.3, 1.1, 1.1],
    height: 1.1,
    subsystem: 'Substation B',
    label: 'TRANSFORMER_02'
  },
  MAIN_BUS: {
    position: [-1.0, 0.35, -2.8],
    geometryType: 'box',
    args: [2.2, 0.6, 0.9],
    height: 0.6,
    subsystem: 'Distribution MSB',
    label: 'MAIN_BUS'
  },
  EMERGENCY_BUS: {
    position: [-1.0, 0.35, 2.8],
    geometryType: 'box',
    args: [2.2, 0.6, 0.9],
    height: 0.6,
    subsystem: 'Emergency ESB',
    label: 'EMERGENCY_BUS'
  },
  GEN_01: {
    position: [-1.0, 0.6, 6.2],
    geometryType: 'box',
    args: [1.8, 1.2, 1.2],
    height: 1.2,
    subsystem: 'Standby Generation',
    label: 'GEN_01'
  },
  GEN_02: {
    position: [-1.0, 0.6, -6.2],
    geometryType: 'box',
    args: [1.8, 1.2, 1.2],
    height: 1.2,
    subsystem: 'Standby Generation',
    label: 'GEN_02'
  },
  UPS_CRITICAL: {
    position: [2.8, 0.5, 2.8],
    geometryType: 'box',
    args: [1.3, 0.9, 1.1],
    height: 0.9,
    subsystem: 'UPS Battery Bank',
    label: 'UPS_CRITICAL'
  },
  CHILLER_PLANT: {
    position: [5.5, 0.7, -3.2],
    geometryType: 'box',
    args: [2.0, 1.4, 1.5],
    height: 1.4,
    subsystem: 'HVAC Cooling',
    label: 'CHILLER_PLANT'
  },
  OXYGEN_MANIFOLD: {
    position: [5.5, 0.75, 3.8],
    geometryType: 'cylinder',
    args: [0.65, 0.65, 1.5, 16],
    height: 1.5,
    subsystem: 'Medical Cryo-Gas',
    label: 'OXYGEN_MANIFOLD'
  },
  WATER_PUMP_STATION: {
    position: [5.5, 0.55, 0.3],
    geometryType: 'box',
    args: [1.5, 1.0, 1.2],
    height: 1.0,
    subsystem: 'Water Utilities',
    label: 'WATER_PUMP_STATION'
  }
}

// Frontend presentation topology for Phase 1; backend graph will become source of truth during integration.
// Deterministic Simulated Dependency Connections
const DEPENDENCY_CONNECTIONS = [
  { from: 'GRID_MAIN', to: 'TRANSFORMER_01' },
  { from: 'GRID_MAIN', to: 'TRANSFORMER_02' },
  { from: 'TRANSFORMER_01', to: 'MAIN_BUS' },
  { from: 'TRANSFORMER_02', to: 'EMERGENCY_BUS' },
  { from: 'GEN_01', to: 'EMERGENCY_BUS' },
  { from: 'GEN_02', to: 'MAIN_BUS' },
  { from: 'EMERGENCY_BUS', to: 'UPS_CRITICAL' },
  { from: 'MAIN_BUS', to: 'CHILLER_PLANT' },
  { from: 'UPS_CRITICAL', to: 'OXYGEN_MANIFOLD' },
  { from: 'EMERGENCY_BUS', to: 'WATER_PUMP_STATION' }
]

// ============================================================================
// 3D Subcomponents
// ============================================================================

/**
 * 3D Conduit Beam connecting source and target nodes
 */
function ConduitBeam({ start, end, isSevered = false, isDegraded = false }) {
  const { position, quaternion, length } = useMemo(() => {
    const p1 = new THREE.Vector3(...start)
    const p2 = new THREE.Vector3(...end)
    const mid = p1.clone().add(p2).multiplyScalar(0.5)
    const dir = p2.clone().sub(p1)
    const len = dir.length()
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())
    return { position: mid, quaternion: q, length: len }
  }, [start, end])

  const beamColor = isSevered ? '#DC2626' : isDegraded ? '#F59E0B' : '#38BDF8'
  const beamEmissive = isSevered ? '#7F1D1D' : isDegraded ? '#B45309' : '#0284C7'
  const beamOpacity = isSevered ? 0.35 : 0.8

  return (
    <mesh position={position} quaternion={quaternion}>
      <cylinderGeometry args={[0.035, 0.035, length, 8]} />
      <meshStandardMaterial
        color={beamColor}
        emissive={beamEmissive}
        emissiveIntensity={0.5}
        transparent
        opacity={beamOpacity}
      />
    </mesh>
  )
}

/**
 * Individual 3D Infrastructure Node representing an asset
 */
function InfrastructureNode({
  asset,
  topoDef,
  isSelected,
  onSelect
}) {
  const [hovered, setHovered] = useState(false)
  const status = asset?.status || 'normal'
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal
  const { position, geometryType, args, height, label } = topoDef

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

  return (
    <group position={position}>
      {/* Selection Halo Ring on Floor */}
      {isSelected && (
        <mesh position={[0, -height / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.35, 32]} />
          <meshBasicMaterial color="#00F0FF" side={THREE.DoubleSide} transparent opacity={0.9} />
        </mesh>
      )}

      {/* Main Technical Geometry */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        {geometryType === 'cylinder' ? (
          <cylinderGeometry args={args} />
        ) : (
          <boxGeometry args={args} />
        )}
        <meshStandardMaterial
          color={statusColor}
          emissive={isSelected ? '#00F0FF' : hovered ? statusColor : '#000000'}
          emissiveIntensity={isSelected ? 0.45 : hovered ? 0.3 : 0.0}
          roughness={0.35}
          metalness={0.3}
        />
      </mesh>

      {/* Floating 3D Micro-Label */}
      <Html position={[0, height / 2 + 0.45, 0]} center distanceFactor={16}>
        <div className={`twin-3d-label ${isSelected ? 'is-selected-label' : ''}`}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: statusColor,
              display: 'inline-block',
              boxShadow: `0 0 6px ${statusColor}`
            }}
          />
          <span>{label}</span>
        </div>
      </Html>
    </group>
  )
}

/**
 * 3D Scene Root
 */
function DigitalTwinScene({
  assetsMap,
  selectedAssetId,
  onSelectNode
}) {
  return (
    <>
      <ambientLight intensity={0.65} />
      <directionalLight position={[12, 22, 16]} intensity={0.9} />
      <directionalLight position={[-12, -8, -10]} intensity={0.3} />

      {/* Ground Coordinate Grid */}
      <gridHelper args={[26, 26, '#1E293B', '#0F172A']} position={[0, 0, 0]} />

      {/* Dependency Connections */}
      {DEPENDENCY_CONNECTIONS.map((conn, idx) => {
        const fromDef = ASSET_TOPOLOGY_DEFS[conn.from]
        const toDef = ASSET_TOPOLOGY_DEFS[conn.to]
        if (!fromDef || !toDef) return null

        const sourceAsset = assetsMap[conn.from]
        const isSevered = sourceAsset?.status === 'failed' || sourceAsset?.status === 'offline'
        const isDegraded = sourceAsset?.status === 'degraded' || sourceAsset?.status === 'starting'

        return (
          <ConduitBeam
            key={`conn-${idx}`}
            start={fromDef.position}
            end={toDef.position}
            isSevered={isSevered}
            isDegraded={isDegraded}
          />
        )
      })}

      {/* 11 Infrastructure Asset Nodes */}
      {Object.entries(ASSET_TOPOLOGY_DEFS).map(([id, topoDef]) => {
        const asset = assetsMap[id]
        const isSelected = selectedAssetId === id

        return (
          <InfrastructureNode
            key={id}
            asset={asset}
            topoDef={topoDef}
            isSelected={isSelected}
            onSelect={onSelectNode}
          />
        )
      })}

      {/* Isometric Command Orbit Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={8}
        maxDistance={38}
        target={[0, 0.6, 0]}
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
  // Support both external selection from App.jsx and internal selection
  const [internalSelectedId, setInternalSelectedId] = useState(null)
  const activeSelectedId = externalSelectedAssetId !== undefined
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

  return (
    <div className="twin-master-panel" id="digital-twin-module">
      {/* 1. Header Bar */}
      <div className="twin-header">
        <div className="twin-title-group">
          <Layers size={17} color="var(--accent-cyan)" />
          <span className="twin-title">DIGITAL TWIN</span>
          <span className="twin-subtitle">Simulated Dependency Topology</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="meta-badge" style={{ fontSize: 10 }}>
            <Box size={11} /> 11 Topo Nodes
          </span>
          <span className="meta-badge" style={{ fontSize: 10 }}>
            <Compass size={11} /> Interactive Orbit
          </span>
        </div>
      </div>

      {/* 2. Split Grid: 3D Canvas + Asset Inspector */}
      <div className="twin-viewport-grid">
        {/* 3D Canvas Area */}
        <div className="twin-canvas-wrapper">
          <Canvas
            camera={{ position: [0, 14, 18], fov: 42 }}
            onPointerMissed={() => handleSelectNode(null)}
          >
            <DigitalTwinScene
              assetsMap={assetsMap}
              selectedAssetId={activeSelectedId}
              onSelectNode={handleSelectNode}
            />
          </Canvas>

          {/* Canvas Navigation Hint */}
          <div className="twin-canvas-controls-hint">
            Rotate: Left Click + Drag | Pan: Right Click + Drag | Zoom: Scroll
          </div>
        </div>

        {/* Right Inspector Sidebar */}
        <div className="twin-inspector-sidebar">
          <div className="inspector-sidebar-title">
            <span>Asset Inspector</span>
            {selectedAsset && (
              <button
                type="button"
                className="close-drawer-btn"
                onClick={() => handleSelectNode(null)}
                title="Deselect asset"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {selectedAsset ? (
            <div className="inspector-selected-card">
              <div className="inspector-selected-header">
                <div>
                  <div className="inspector-selected-id">{selectedAsset.id}</div>
                  <div className="inspector-selected-name">{selectedAsset.name}</div>
                </div>
                <span
                  className={`status-pill status-${selectedAsset.status || 'normal'}`}
                  style={{ textTransform: 'uppercase', fontSize: 10 }}
                >
                  {selectedAsset.status || 'normal'}
                </span>
              </div>

              {/* Subsystem & Location */}
              <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                <strong>Subsystem:</strong> {selectedTopo?.subsystem || 'General'}
                <br />
                <strong>Location:</strong> {selectedAsset.location} (Floor {selectedAsset.floor})
              </div>

              {/* Core Telemetry Grid */}
              <div className="inspector-field-grid">
                <div className="inspector-field-cell">
                  <span className="inspector-field-label">Current Load</span>
                  <span className="inspector-field-val">
                    {selectedAsset.current_load} {selectedAsset.capacity_unit}
                  </span>
                </div>
                <div className="inspector-field-cell">
                  <span className="inspector-field-label">Available Cap</span>
                  <span className="inspector-field-val">
                    {selectedAsset.available_capacity} {selectedAsset.capacity_unit}
                  </span>
                </div>
                <div className="inspector-field-cell">
                  <span className="inspector-field-label">Health Score</span>
                  <span
                    className="inspector-field-val"
                    style={{
                      color:
                        selectedAsset.health_score > 80
                          ? 'var(--status-normal)'
                          : selectedAsset.health_score > 50
                          ? 'var(--status-degraded)'
                          : 'var(--status-failed)'
                    }}
                  >
                    {selectedAsset.health_score?.toFixed(1)}%
                  </span>
                </div>
                <div className="inspector-field-cell">
                  <span className="inspector-field-label">Redundancy</span>
                  <span className="inspector-field-val">
                    Level {selectedAsset.redundancy_level}
                  </span>
                </div>
              </div>

              {/* Specific Subsystem Telemetry Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                {selectedAsset.fuel_level_pct != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Fuel size={12} color="var(--accent-amber)" /> Fuel Level:
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedAsset.fuel_level_pct}%
                    </strong>
                  </div>
                )}
                {selectedAsset.battery_level_pct != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <BatteryCharging size={12} color="var(--accent-cyan)" /> Battery Reserve:
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedAsset.battery_level_pct}%
                    </strong>
                  </div>
                )}
                {selectedAsset.temperature_c != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Thermometer size={12} color="var(--status-critical)" /> Temperature:
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedAsset.temperature_c}°C
                    </strong>
                  </div>
                )}
                {selectedAsset.pressure_psi != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Gauge size={12} color="var(--accent-cyan)" /> Header Pressure:
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedAsset.pressure_psi} PSI
                    </strong>
                  </div>
                )}
                {selectedAsset.runtime_remaining_min != null && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color="var(--text-muted)" /> Runtime Left:
                    </span>
                    <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                      {selectedAsset.runtime_remaining_min} min
                    </strong>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="inspector-empty-state">
              <Info size={32} color="var(--text-muted)" />
              <div>
                <strong>NO ASSET SELECTED</strong>
                <p style={{ marginTop: 4, color: 'var(--text-muted)', fontSize: 11, lineHeight: 1.4 }}>
                  Click any 3D node in the digital twin topology to inspect live load, capacity, health, and redundancy telemetry.
                </p>
              </div>

              {/* Quick Select Buttons */}
              <div style={{ width: '100%', marginTop: 8 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6, textAlign: 'left' }}>
                  Quick Inspect Node:
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.keys(ASSET_TOPOLOGY_DEFS).map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => handleSelectNode(id)}
                      className="meta-badge"
                      style={{
                        cursor: 'pointer',
                        fontSize: 9,
                        padding: '2px 6px',
                        background: 'var(--bg-subtle)'
                      }}
                    >
                      {id}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Bar: Status Legend & Disclaimer */}
      <div className="twin-footer-bar">
        <div className="twin-legend-items">
          <span style={{ fontWeight: 700, color: 'var(--text-muted)', marginRight: 4 }}>
            STATUS LEGEND:
          </span>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.normal }} />
            <span>Normal</span>
          </div>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.degraded }} />
            <span>Degraded</span>
          </div>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.critical }} />
            <span>Critical</span>
          </div>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.failed }} />
            <span>Failed</span>
          </div>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.starting }} />
            <span>Starting</span>
          </div>
          <div className="twin-legend-item">
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: STATUS_COLORS.offline }} />
            <span>Offline</span>
          </div>
        </div>

        <div className="twin-disclaimer">
          Visualization reflects simulated infrastructure state.
        </div>
      </div>
    </div>
  )
}
