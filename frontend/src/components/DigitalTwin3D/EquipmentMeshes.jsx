import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { STATUS_COLORS, STATUS_EMISSIVE } from './twinConstants'

/**
 * 1. Substation Pylon & Grid Feed (GRID_MAIN)
 */
export function SubstationPylon({ status = 'normal', isSelected = false, hovered = false }) {
  const beaconRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime()
      beaconRef.current.intensity = status === 'failed' || status === 'critical'
        ? 1.8 + Math.sin(t * 10) * 1.5
        : 0.8 + Math.sin(t * 3) * 0.5
    }
  })

  return (
    <group>
      {/* Heavy Substation Foundation Pad */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[2.0, 0.05, 2.0]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.4} />
      </mesh>

      {/* Main Steel Lattice / Tower Columns */}
      {[-0.6, 0.6].map((x, i) =>
        [-0.6, 0.6].map((z, j) => (
          <mesh key={`pylon-leg-${i}-${j}`} position={[x, 1.2, z]}>
            <cylinderGeometry args={[0.04, 0.06, 2.0, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Lattice Cross Braces */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.2, 0.04, 1.2]} />
        <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <boxGeometry args={[1.0, 0.04, 1.0]} />
        <meshStandardMaterial color="#64748B" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Cross-arm gantries for high-voltage transmission */}
      <mesh position={[0, 2.1, 0]}>
        <boxGeometry args={[2.4, 0.1, 0.25]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[2.0, 0.08, 0.22]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Ceramic Insulator Strings (Glowing with electrical arc corona) */}
      {[-0.9, 0, 0.9].map((xOffset, idx) => (
        <group key={`insulator-${idx}`} position={[xOffset, 2.1, 0]}>
          <mesh position={[0, -0.25, 0]}>
            <cylinderGeometry args={[0.08, 0.06, 0.45, 12]} />
            <meshStandardMaterial
              color="#38BDF8"
              emissive={status === 'failed' ? '#DC2626' : '#0284C7'}
              emissiveIntensity={status === 'failed' ? 0.8 : 0.4}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>
          <mesh position={[0, -0.48, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#E0F2FE" />
          </mesh>
        </group>
      ))}

      {/* Substation Control & Metering Transformer Core on Plinth */}
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.1, 0.65, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.25}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>

      {/* Top Warning Beacon / Lightning Rod */}
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
        <meshStandardMaterial color="#E2E8F0" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0, 2.85, 0]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshBasicMaterial color={status === 'failed' ? '#EF4444' : '#06B6D4'} />
      </mesh>
      <pointLight
        ref={beaconRef}
        position={[0, 2.85, 0]}
        color={status === 'failed' ? '#EF4444' : '#00F0FF'}
        distance={4.5}
      />
    </group>
  )
}

/**
 * 2. Step-Down Distribution Transformer (TRANSFORMER_01, TRANSFORMER_02)
 */
export function TransformerUnit({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  return (
    <group>
      {/* Plinth Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 1.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* Main Corrugated Transformer Oil Tank */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.3, 0.9, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.35}
          metalness={0.5}
        />
      </mesh>

      {/* Left Cooling Radiator Fins */}
      {[-0.35, -0.15, 0.05, 0.25].map((z, idx) => (
        <mesh key={`rad-l-${idx}`} position={[-0.72, 0.65, z]}>
          <boxGeometry args={[0.12, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Right Cooling Radiator Fins */}
      {[-0.35, -0.15, 0.05, 0.25].map((z, idx) => (
        <mesh key={`rad-r-${idx}`} position={[0.72, 0.65, z]}>
          <boxGeometry args={[0.12, 0.75, 0.08]} />
          <meshStandardMaterial color="#475569" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}

      {/* Cylindrical Oil Conservator Drum on Top */}
      <mesh position={[0, 1.25, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.1, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Buchholz relay / connecting pipe */}
      <mesh position={[0.3, 1.15, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.25, 8]} />
        <meshStandardMaterial color="#64748B" metalness={0.8} />
      </mesh>

      {/* Triple High-Voltage Primary Bushings */}
      {[-0.35, 0, 0.35].map((x, idx) => (
        <group key={`bushing-${idx}`} position={[x, 1.15, 0.25]}>
          <mesh>
            <cylinderGeometry args={[0.06, 0.09, 0.35, 12]} />
            <meshStandardMaterial
              color="#A5F3FC"
              emissive={status === 'failed' ? '#DC2626' : '#0891B2'}
              emissiveIntensity={0.35}
              roughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.9} roughness={0.1} />
          </mesh>
        </group>
      ))}

      {/* Marshalling Box / Temperature Gauge */}
      <mesh position={[0, 0.6, 0.58]}>
        <boxGeometry args={[0.35, 0.45, 0.06]} />
        <meshStandardMaterial color="#0F172A" metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.65, 0.62]}>
        <circleGeometry args={[0.09, 16]} />
        <meshBasicMaterial color={status === 'failed' ? '#EF4444' : '#10B981'} />
      </mesh>
    </group>
  )
}

/**
 * 3. Switchboard & Busbar Assembly (MAIN_BUS, EMERGENCY_BUS)
 */
export function SwitchgearRack({ status = 'normal', isSelected = false, hovered = false, isEmergency = false }) {
  const ledRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  useFrame(({ clock }) => {
    if (ledRef.current) {
      const t = clock.getElapsedTime()
      ledRef.current.emissiveIntensity = 0.5 + Math.sin(t * 4) * 0.3
    }
  })

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[2.5, 0.16, 1.1]} />
        <meshStandardMaterial color="#0F172A" roughness={0.8} />
      </mesh>

      {/* Main Switchgear Enclosure Cabinet */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[2.3, 1.0, 0.9]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>

      {/* Individual Modular Tier Cabinets / Breaker Compartments */}
      {[-0.75, -0.25, 0.25, 0.75].map((x, idx) => (
        <group key={`breaker-${idx}`} position={[x, 0.65, 0.46]}>
          {/* Compartment Door Frame */}
          <mesh>
            <boxGeometry args={[0.42, 0.85, 0.02]} />
            <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Digital Status Readout */}
          <mesh position={[0, 0.25, 0.02]}>
            <boxGeometry args={[0.28, 0.12, 0.01]} />
            <meshBasicMaterial color="#0284C7" />
          </mesh>
          {/* Breaker Handle */}
          <mesh position={[0, -0.05, 0.04]} rotation={[0, 0, idx % 2 === 0 ? 0.3 : -0.3]}>
            <boxGeometry args={[0.04, 0.18, 0.05]} />
            <meshStandardMaterial color={isEmergency ? '#F59E0B' : '#E2E8F0'} metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Overhead Busbar Trunking Enclosure */}
      <mesh position={[0, 1.22, 0]}>
        <boxGeometry args={[2.4, 0.16, 0.5]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Glowing Busbar LED Activity Strip */}
      <mesh ref={ledRef} position={[0, 1.22, 0.26]}>
        <boxGeometry args={[2.2, 0.05, 0.02]} />
        <meshStandardMaterial
          color={isEmergency ? '#F59E0B' : '#00F0FF'}
          emissive={isEmergency ? '#D97706' : '#0891B2'}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  )
}

/**
 * 4. Industrial Diesel Standby Generator (GEN_01, GEN_02)
 */
export function IndustrialGenerator({ status = 'normal', isSelected = false, hovered = false }) {
  const fanRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'
  const isRunning = status === 'normal' || status === 'degraded'

  useFrame((_, delta) => {
    if (fanRef.current && isRunning) {
      fanRef.current.rotation.z += delta * 18
    }
  })

  return (
    <group>
      {/* Heavy Steel Skid Base with Fuel Tank Undercarriage */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[2.0, 0.24, 1.3]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Generator Sound-Attenuated Weather Enclosure */}
      <mesh position={[0, 0.75, 0]}>
        <boxGeometry args={[1.8, 1.0, 1.1]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.5}
        />
      </mesh>

      {/* Front Radiator Cooling Cowl */}
      <mesh position={[0.91, 0.75, 0]}>
        <boxGeometry args={[0.04, 0.8, 0.9]} />
        <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Animated Radiator Cooling Fan Blades */}
      <group position={[0.93, 0.75, 0]}>
        <mesh ref={fanRef}>
          <circleGeometry args={[0.32, 6]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} roughness={0.2} wireframe />
        </mesh>
      </group>

      {/* Top Exhaust Muffler Drum */}
      <mesh position={[-0.3, 1.38, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.16, 0.16, 0.9, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Vertical Chrome Exhaust Stack */}
      <mesh position={[-0.65, 1.7, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.65, 16]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Rain Cap / Exhaust Flap */}
      <mesh position={[-0.65, 2.05, 0.04]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.14, 0.02, 0.16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.8} />
      </mesh>

      {/* Fuel Level Sight Glass Glow on Base */}
      <mesh position={[0, 0.12, 0.66]}>
        <boxGeometry args={[0.8, 0.08, 0.02]} />
        <meshBasicMaterial color="#F59E0B" />
      </mesh>
    </group>
  )
}

/**
 * 5. Static Double-Conversion UPS Battery Rack (UPS_CRITICAL)
 */
export function BatteryStorageRack({ status = 'normal', isSelected = false, hovered = false }) {
  const pulseRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  useFrame(({ clock }) => {
    if (pulseRef.current) {
      const t = clock.getElapsedTime()
      pulseRef.current.emissiveIntensity = 0.4 + Math.sin(t * 3.5) * 0.35
    }
  })

  return (
    <group>
      {/* Plinth */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[1.5, 0.16, 1.2]} />
        <meshStandardMaterial color="#0F172A" roughness={0.8} />
      </mesh>

      {/* UPS Inverter & Battery Cabinet */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.3, 1.0, 1.0]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.25}
          metalness={0.6}
        />
      </mesh>

      {/* 4-Tier Battery Module Shelves (Glass-front look) */}
      {[0.3, 0.52, 0.74, 0.96].map((y, idx) => (
        <group key={`shelf-${idx}`} position={[0, y, 0.51]}>
          <mesh>
            <boxGeometry args={[1.1, 0.16, 0.02]} />
            <meshStandardMaterial color="#0F172A" metalness={0.8} />
          </mesh>
          {/* LED Charge Bar */}
          <mesh ref={idx === 3 ? pulseRef : null} position={[0, 0, 0.015]}>
            <boxGeometry args={[0.9, 0.05, 0.01]} />
            <meshStandardMaterial
              color="#00F0FF"
              emissive="#06B6D4"
              emissiveIntensity={0.6}
            />
          </mesh>
        </group>
      ))}

      {/* Top Extraction Hood with Ventilation Grille */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[1.34, 0.1, 1.04]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>
      {[-0.3, 0, 0.3].map((x, idx) => (
        <mesh key={`ups-fan-${idx}`} position={[x, 1.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 12]} />
          <meshStandardMaterial color="#0F172A" metalness={0.8} wireframe />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 6. HVAC Chiller & Cooling Tower Deck (CHILLER_PLANT)
 */
export function ChillerCoolingTower({ status = 'normal', isSelected = false, hovered = false }) {
  const fanRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  useFrame((_, delta) => {
    if (fanRef.current && status !== 'failed') {
      fanRef.current.rotation.z += delta * 12
    }
  })

  return (
    <group>
      {/* Heavy Vibration Inertia Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 1.6]} />
        <meshStandardMaterial color="#1E293B" roughness={0.7} />
      </mesh>

      {/* Dual Cylindrical Evaporator & Condenser Shells */}
      <mesh position={[0, 0.45, -0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 1.9, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh position={[0, 0.45, 0.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.26, 0.26, 1.9, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Central Centrifugal Compressor Motor Housing */}
      <mesh position={[0, 0.88, 0]}>
        <cylinderGeometry args={[0.28, 0.28, 0.6, 20]} />
        <meshStandardMaterial color="#0F172A" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Refrigerant Suction & Discharge Elbows */}
      <mesh position={[0, 0.7, -0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 12]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0.7, 0.2]}>
        <cylinderGeometry args={[0.08, 0.08, 0.35, 12]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.4} />
      </mesh>

      {/* Rooftop AHU Fan Shroud & Cowl */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.45, 0.5, 0.35, 20]} />
        <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
      </mesh>

      {/* Animated Chiller Cooling Fan Blades */}
      <group position={[0, 1.44, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={fanRef}>
          <circleGeometry args={[0.38, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.8} wireframe />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 7. Cryogenic Liquid Oxygen Vacuum Tank & Vaporizer Yard (OXYGEN_MANIFOLD)
 */
export function CryoOxygenYard({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  return (
    <group>
      {/* Cryogenic Yard Foundation */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 1.8]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* Main Vertical Double-Walled Vacuum Oxygen Tank */}
      <mesh position={[-0.3, 0.95, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 1.3, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
          emissiveIntensity={isSelected ? 0.6 : 0.2}
          roughness={0.2}
          metalness={0.7}
        />
      </mesh>

      {/* Hemispherical Dome Caps (Top & Bottom) */}
      <mesh position={[-0.3, 1.6, 0]}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#F8FAFC" metalness={0.8} roughness={0.15} />
      </mesh>
      <mesh position={[-0.3, 0.3, 0]} rotation={[Math.PI, 0, 0]}>
        <sphereGeometry args={[0.42, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.7} />
      </mesh>

      {/* 4 Structural Tank Support Legs */}
      {[-0.6, 0.0].map((x, i) =>
        [-0.3, 0.3].map((z, j) => (
          <mesh key={`tank-leg-${i}-${j}`} position={[x, 0.3, z]}>
            <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
        ))
      )}

      {/* Ambient Aluminum Star-Fin Vaporizers beside the tank */}
      {[0.35, 0.65].map((x, idx) => (
        <group key={`vap-${idx}`} position={[x, 0.75, 0]}>
          <mesh>
            <boxGeometry args={[0.18, 1.2, 0.6]} />
            <meshStandardMaterial
              color="#94A3B8"
              emissive="#38BDF8"
              emissiveIntensity={0.25}
              metalness={0.9}
              roughness={0.2}
            />
          </mesh>
        </group>
      ))}

      {/* Interconnecting Frost Line Header */}
      <mesh position={[0.05, 0.4, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} rotation={[0, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#38BDF8" emissive="#0284C7" emissiveIntensity={0.5} />
      </mesh>
    </group>
  )
}

/**
 * 8. Water Booster Pump Station (WATER_PUMP_STATION)
 */
export function HydroWaterPump({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissive = STATUS_EMISSIVE[status] || '#000000'

  return (
    <group>
      {/* Inertia Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 1.4]} />
        <meshStandardMaterial color="#1E293B" roughness={0.8} />
      </mesh>

      {/* Twin Horizontal Centrifugal Pumps */}
      {[-0.35, 0.35].map((z, idx) => (
        <group key={`pump-${idx}`} position={[0, 0.45, z]}>
          {/* Electric Induction Motor Body */}
          <mesh position={[-0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.6, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={isSelected ? '#00F0FF' : hovered ? emissive : '#000000'}
              emissiveIntensity={isSelected ? 0.6 : 0.2}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>
          {/* Motor Fan Cowl */}
          <mesh position={[-0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.17, 0.17, 0.1, 16]} />
            <meshStandardMaterial color="#0F172A" metalness={0.7} />
          </mesh>
          {/* Centrifugal Pump Volute Casing */}
          <mesh position={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.22, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Vertical Discharge Riser */}
          <mesh position={[0.15, 0.28, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.35, 12]} />
            <meshStandardMaterial color="#60A5FA" metalness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Stainless Steel Suction & Discharge Manifolds */}
      <mesh position={[0.15, 0.72, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.07, 1.1, 16]} />
        <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Analog Pressure Gauge */}
      <mesh position={[0.15, 0.88, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 16]} rotation={[0, 0, Math.PI / 2]} />
        <meshBasicMaterial color={status === 'failed' ? '#EF4444' : '#10B981'} />
      </mesh>
    </group>
  )
}
