import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { STATUS_COLORS, STATUS_EMISSIVE } from './twinConstants'

// ============================================================================
// 1. HOSPITAL REALISTIC ARCHITECTURAL STRUCTURE & BIM SLABS
// ============================================================================

/**
 * Realistic Architectural Floor Level with Room Partitions, Cleanrooms, Corridors & Wayfinding
 */
export function HospitalFloorPlinth({
  floorDef,
  isIsolated = false,
  isDimmed = false,
  showWalls = true,
  xrayMode = false,
  isLight = false
}) {
  const { elevation, color, level } = floorDef
  const buildingWidth = 14.8
  const buildingDepth = 11.0
  const slabThickness = 0.22

  return (
    <group position={[-1.2, elevation, 0]}>
      {/* 1. Structural Concrete Floor Slab with Chamfered Edges */}
      <mesh position={[0, -slabThickness / 2, 0]}>
        <boxGeometry args={[buildingWidth, slabThickness, buildingDepth]} />
        <meshStandardMaterial
          color={xrayMode ? '#030712' : isLight ? '#F1F5F9' : '#0B132B'}
          roughness={isLight ? 0.5 : 0.7}
          metalness={isLight ? 0.2 : 0.4}
          transparent
          opacity={xrayMode ? 0.35 : isDimmed ? 0.12 : 0.96}
          wireframe={xrayMode}
        />
      </mesh>

      {/* 2. Medical Anti-Bacterial Clean Floor Finish (Vinyl/Epoxy) */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[buildingWidth - 0.2, buildingDepth - 0.2]} />
        <meshStandardMaterial
          color={
            level === 3
              ? (isLight ? '#E0F2FE' : '#0B1E38') // ICU Medical Ice-Blue / Deep Slate Blue
              : level === 2
                ? (isLight ? '#ECFDF5' : '#0A192F') // Surgical Sterile Mint / Navy
                : (isLight ? '#F8FAFC' : '#0D1527') // ED Cleanroom Pearl / Charcoal
          }
          roughness={isLight ? 0.3 : 0.2}
          metalness={isLight ? 0.2 : 0.5}
          transparent={isDimmed || xrayMode}
          opacity={xrayMode ? 0.2 : isDimmed ? 0.1 : 0.94}
        />
      </mesh>

      {/* 3. Glowing Floor Boundary Perimeter Ribbon */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[buildingWidth, buildingDepth]} />
        <meshBasicMaterial
          color={color}
          wireframe
          transparent
          opacity={isDimmed ? 0.05 : isIsolated || xrayMode ? 0.65 : 0.25}
        />
      </mesh>

      {/* 4. Central Hallway Wayfinding Corridor Strip with Ambient Guide Glow */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[buildingWidth - 1.2, 1.4]} />
        <meshStandardMaterial
          color="#0284C7"
          emissive="#0284C7"
          emissiveIntensity={xrayMode ? 0.4 : 0.15}
          roughness={0.3}
          transparent
          opacity={isDimmed ? 0.04 : 0.35}
        />
      </mesh>

      {/* Corridor Cross-Intersection Wayfinding Lines */}
      {[-3.0, 3.0].map((x, idx) => (
        <mesh key={`cross-corridor-${idx}`} position={[x, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, buildingDepth - 1.4]} />
          <meshStandardMaterial
            color="#0369A1"
            roughness={0.4}
            transparent
            opacity={isDimmed ? 0.03 : 0.2}
          />
        </mesh>
      ))}

      {/* 5. Architectural Interior Room Partitions */}
      {showWalls && (
        <group>
          {/* LEVEL 3: ICU Glass Pod Cubicles & Partitions */}
          {level === 3 && (
            <group>
              {/* North Pod Dividers (Between ICU Beds 1, 2, 3) */}
              {[-3.1, -0.1, 2.9].map((x, i) => (
                <group key={`icu-div-n-${i}`} position={[x, 1.1, -3.2]}>
                  <mesh>
                    <boxGeometry args={[0.08, 2.2, 3.6]} />
                    <meshPhysicalMaterial
                      color="#38BDF8"
                      transparent
                      opacity={xrayMode ? 0.1 : isDimmed ? 0.04 : 0.22}
                      roughness={0.1}
                      transmission={0.85}
                      thickness={0.3}
                      wireframe={xrayMode}
                    />
                  </mesh>
                  {/* Aluminum Glass Frame Headers */}
                  <mesh position={[0, 1.08, 0]}>
                    <boxGeometry args={[0.1, 0.06, 3.6]} />
                    <meshStandardMaterial color="#334155" metalness={0.8} />
                  </mesh>
                  {/* Bedside Privacy Shade Stripe */}
                  <mesh position={[0, -0.1, 0]}>
                    <boxGeometry args={[0.082, 0.6, 3.5]} />
                    <meshPhysicalMaterial
                      color="#0284C7"
                      transparent
                      opacity={xrayMode ? 0.05 : isDimmed ? 0.02 : 0.18}
                      roughness={0.3}
                    />
                  </mesh>
                </group>
              ))}

              {/* South Pod Dividers (Between ICU Beds 4, 5, 6) */}
              {[-3.1, -0.1, 2.9].map((x, i) => (
                <group key={`icu-div-s-${i}`} position={[x, 1.1, 3.2]}>
                  <mesh>
                    <boxGeometry args={[0.08, 2.2, 3.6]} />
                    <meshPhysicalMaterial
                      color="#38BDF8"
                      transparent
                      opacity={xrayMode ? 0.1 : isDimmed ? 0.04 : 0.22}
                      roughness={0.1}
                      transmission={0.85}
                      thickness={0.3}
                      wireframe={xrayMode}
                    />
                  </mesh>
                  <mesh position={[0, 1.08, 0]}>
                    <boxGeometry args={[0.1, 0.06, 3.6]} />
                    <meshStandardMaterial color="#334155" metalness={0.8} />
                  </mesh>
                </group>
              ))}

              {/* Corridor Glass Sliding Door Partitions */}
              {[-4.6, -1.6, 1.4].map((x, i) => (
                <group key={`icu-door-n-${i}`} position={[x, 1.1, -1.4]}>
                  <mesh>
                    <boxGeometry args={[1.5, 2.2, 0.06]} />
                    <meshPhysicalMaterial
                      color="#38BDF8"
                      transparent
                      opacity={xrayMode ? 0.08 : isDimmed ? 0.03 : 0.16}
                      roughness={0.1}
                      transmission={0.85}
                    />
                  </mesh>
                  {/* Door Handle */}
                  <mesh position={[0.6, -0.1, 0.05]}>
                    <boxGeometry args={[0.04, 0.35, 0.04]} />
                    <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
                  </mesh>
                </group>
              ))}
            </group>
          )}

          {/* LEVEL 2: Operating Theatre Enclosed Sterile Suites & Ward Partitions */}
          {level === 2 && (
            <group>
              {/* Surgical Wing Dividing Wall (Separates OT from Wards) */}
              <mesh position={[-1.2, 1.1, 0]}>
                <boxGeometry args={[0.12, 2.2, buildingDepth - 0.4]} />
                <meshStandardMaterial
                  color="#1E293B"
                  roughness={0.6}
                  metalness={0.3}
                  wireframe={xrayMode}
                />
              </mesh>
              {/* Wall Between OT 1 and OT 2 Cleanrooms */}
              <mesh position={[-4.5, 1.1, 0]}>
                <boxGeometry args={[6.5, 2.2, 0.12]} />
                <meshStandardMaterial
                  color="#1E293B"
                  roughness={0.6}
                  metalness={0.3}
                  wireframe={xrayMode}
                />
              </mesh>
              {/* OT Observation Window (Lead Glass) */}
              <mesh position={[-4.5, 1.2, 0]}>
                <boxGeometry args={[2.4, 1.0, 0.14]} />
                <meshPhysicalMaterial
                  color="#00F0FF"
                  transparent
                  opacity={0.3}
                  transmission={0.9}
                  roughness={0.1}
                />
              </mesh>
              {/* Ward Room Partitions */}
              {[2.6].map((x, i) => (
                <mesh key={`ward-div-${i}`} position={[x, 1.1, -3.2]}>
                  <boxGeometry args={[0.08, 2.2, 3.4]} />
                  <meshStandardMaterial color="#334155" roughness={0.7} wireframe={xrayMode} />
                </mesh>
              ))}
              {[2.6].map((x, i) => (
                <mesh key={`ward-div-s-${i}`} position={[x, 1.1, 3.2]}>
                  <boxGeometry args={[0.08, 2.2, 3.4]} />
                  <meshStandardMaterial color="#334155" roughness={0.7} wireframe={xrayMode} />
                </mesh>
              ))}
            </group>
          )}

          {/* LEVEL 1: Emergency Trauma Bay Dividers & Admin Hub */}
          {level === 1 && (
            <group>
              {/* Trauma Bays Dividers */}
              {[-3.1].map((x, i) => (
                <mesh key={`ed-div-n-${i}`} position={[x, 1.0, -3.0]}>
                  <boxGeometry args={[0.06, 2.0, 3.2]} />
                  <meshStandardMaterial color="#475569" roughness={0.6} wireframe={xrayMode} />
                </mesh>
              ))}
              {[-3.1].map((x, i) => (
                <mesh key={`ed-div-s-${i}`} position={[x, 1.0, 3.0]}>
                  <boxGeometry args={[0.06, 2.0, 3.2]} />
                  <meshStandardMaterial color="#475569" roughness={0.6} wireframe={xrayMode} />
                </mesh>
              ))}
              {/* Admin Wing Glass Wall */}
              <mesh position={[0.2, 1.1, 0]}>
                <boxGeometry args={[0.08, 2.2, 7.2]} />
                <meshPhysicalMaterial
                  color="#38BDF8"
                  transparent
                  opacity={xrayMode ? 0.08 : isDimmed ? 0.04 : 0.22}
                  roughness={0.1}
                  transmission={0.8}
                  wireframe={xrayMode}
                />
              </mesh>
            </group>
          )}

          {/* Exterior Rear Glass Curtain Wall (North Facade) */}
          <mesh position={[0, 1.1, -buildingDepth / 2 + 0.06]}>
            <boxGeometry args={[buildingWidth, 2.2, 0.08]} />
            <meshPhysicalMaterial
              color="#38BDF8"
              transparent
              opacity={xrayMode ? 0.08 : isDimmed ? 0.03 : 0.14}
              roughness={0.1}
              transmission={0.85}
              thickness={0.3}
              wireframe={xrayMode}
            />
          </mesh>
          {/* Exterior West Glass Curtain Wall */}
          <mesh position={[-buildingWidth / 2 + 0.06, 1.1, 0]}>
            <boxGeometry args={[0.08, 2.2, buildingDepth]} />
            <meshPhysicalMaterial
              color="#38BDF8"
              transparent
              opacity={xrayMode ? 0.08 : isDimmed ? 0.03 : 0.14}
              roughness={0.1}
              transmission={0.85}
              thickness={0.3}
              wireframe={xrayMode}
            />
          </mesh>
        </group>
      )}

      {/* 6. Structural Columns with Architectural Chamfer */}
      {[-buildingWidth / 2 + 0.35, 0, buildingWidth / 2 - 0.35].map((cx, i) =>
        [-buildingDepth / 2 + 0.35, buildingDepth / 2 - 0.35].map((cz, j) => (
          <mesh key={`col-${i}-${j}`} position={[cx, 1.1, cz]}>
            <boxGeometry args={[0.3, 2.2, 0.3]} />
            <meshStandardMaterial
              color={isLight ? '#64748B' : '#334155'}
              metalness={0.7}
              roughness={0.3}
              transparent={isDimmed || xrayMode}
              opacity={xrayMode ? 0.3 : isDimmed ? 0.2 : 0.95}
              wireframe={xrayMode}
            />
          </mesh>
        ))
      )}

      {/* 7. Vertical Utility Riser Shaft Core (Right edge) */}
      <group position={[6.5, 1.1, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 2.2, 2.8]} />
          <meshStandardMaterial
            color={isLight ? '#CBD5E1' : '#0F172A'}
            roughness={0.7}
            metalness={0.4}
            transparent={isDimmed || xrayMode}
            opacity={xrayMode ? 0.2 : isDimmed ? 0.2 : 0.92}
            wireframe={xrayMode}
          />
        </mesh>
        <mesh position={[-0.76, 0, 0]}>
          <boxGeometry args={[0.04, 2.0, 2.4]} />
          <meshPhysicalMaterial
            color="#38BDF8"
            transparent
            opacity={xrayMode ? 0.05 : isDimmed ? 0.05 : 0.35}
            roughness={0.1}
          />
        </mesh>
        {/* Vertical Color-Coded Conduit Risers */}
        {[-0.7, -0.2, 0.3, 0.8].map((zOffset, idx) => (
          <mesh key={`riser-pipe-${idx}`} position={[-0.35, 0, zOffset]}>
            <cylinderGeometry args={[0.04, 0.04, 2.2, 10]} />
            <meshBasicMaterial
              color={
                idx === 0
                  ? '#F59E0B' // Emergency Power Riser
                  : idx === 1
                    ? '#10B981' // Medical Gas O2 Riser
                    : idx === 2
                      ? '#38BDF8' // Normal Power Riser
                      : '#00F0FF' // Telemetry Fiber Bus
              }
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/**
 * 3D Emergency Air-Ambulance Helicopter Parked on Helipad
 */
function AirAmbulanceHelicopter() {
  const rotorRef = useRef()
  const tailRotorRef = useRef()

  useFrame((_, delta) => {
    if (rotorRef.current) rotorRef.current.rotation.y += delta * 24
    if (tailRotorRef.current) tailRotorRef.current.rotation.x += delta * 30
  })

  return (
    <group position={[-2.5, 0.35, 0]} rotation={[0, 0.3, 0]}>
      {/* Helicopter Main Fuselage */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.3, 0.75, 2.4]} />
        <meshStandardMaterial color="#DC2626" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* Cockpit Nose & Glass Windshield */}
      <mesh position={[0, 0.45, 1.25]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[1.2, 0.65, 0.8]} />
        <meshPhysicalMaterial
          color="#38BDF8"
          transmission={0.8}
          transparent
          opacity={0.4}
          roughness={0.1}
        />
      </mesh>

      {/* White Emergency Medical Stripe & Cross */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[1.32, 0.22, 1.6]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>

      {/* Landing Skids */}
      {[-0.6, 0.6].map((x, i) => (
        <group key={`skid-${i}`}>
          <mesh position={[x, 0.05, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 2.4, 8]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          <mesh position={[x, 0.22, -0.5]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
          <mesh position={[x, 0.22, 0.5]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 8]} />
            <meshStandardMaterial color="#0F172A" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Tail Boom & Fin */}
      <mesh position={[0, 0.6, -1.9]}>
        <cylinderGeometry args={[0.12, 0.2, 1.8, 10]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>
      <mesh position={[0, 0.95, -2.8]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.06, 0.6, 0.35]} />
        <meshStandardMaterial color="#DC2626" />
      </mesh>

      {/* Tail Rotor */}
      <group position={[0.08, 1.0, -2.9]}>
        <mesh ref={tailRotorRef}>
          <boxGeometry args={[0.02, 0.55, 0.06]} />
          <meshBasicMaterial color="#E2E8F0" />
        </mesh>
      </group>

      {/* Main Rotor Mast & Spinning Blades */}
      <mesh position={[0, 0.95, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.35, 12]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} />
      </mesh>
      <group position={[0, 1.12, 0]} ref={rotorRef}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.14, 0.04, 3.6]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
        <mesh position={[0, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[0.14, 0.04, 3.6]} />
          <meshBasicMaterial color="#0F172A" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Hospital Rooftop Structure with Helipad, AHU Condensers, Solar Arrays & Aviation Beacon
 */
export function HospitalRooftop({ showRoof = true, xrayMode = false, isLight = false }) {
  const beaconRef = useRef()

  useFrame(({ clock }) => {
    if (beaconRef.current) {
      const t = clock.getElapsedTime()
      beaconRef.current.intensity = Math.sin(t * 5) > 0.5 ? 2.5 : 0.2
    }
  })

  if (!showRoof) return null
  const buildingWidth = 14.8
  const buildingDepth = 11.0
  const elevation = 10.8

  return (
    <group position={[-1.2, elevation, 0]}>
      {/* Rooftop Base Slab */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[buildingWidth, 0.2, buildingDepth]} />
        <meshStandardMaterial
          color={isLight ? '#CBD5E1' : '#0F172A'}
          roughness={0.8}
          metalness={0.3}
          wireframe={xrayMode}
        />
      </mesh>

      {/* Parapet Perimeter Safety Walls */}
      <mesh position={[0, 0.35, -buildingDepth / 2 + 0.1]}>
        <boxGeometry args={[buildingWidth, 0.7, 0.2]} />
        <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} />
      </mesh>
      <mesh position={[0, 0.35, buildingDepth / 2 - 0.1]}>
        <boxGeometry args={[buildingWidth, 0.7, 0.2]} />
        <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} />
      </mesh>
      <mesh position={[-buildingWidth / 2 + 0.1, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, buildingDepth]} />
        <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} />
      </mesh>
      <mesh position={[buildingWidth / 2 - 0.1, 0.35, 0]}>
        <boxGeometry args={[0.2, 0.7, buildingDepth]} />
        <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} />
      </mesh>

      {/* 1. Emergency Trauma Helipad Platform */}
      <group position={[-2.5, 0.02, 0]}>
        {/* Helipad Octagonal Landing Pad */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.6, 8]} />
          <meshStandardMaterial color={isLight ? '#334155' : '#1E293B'} roughness={0.4} metalness={0.5} />
        </mesh>

        {/* Helipad Yellow Outer Ring */}
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[3.2, 3.4, 32]} />
          <meshBasicMaterial color="#EAB308" />
        </mesh>

        {/* Helipad Neon White Inner Ring */}
        <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.0, 2.15, 32]} />
          <meshBasicMaterial color="#F8FAFC" />
        </mesh>

        {/* Large Bold [ H ] Helipad Marking */}
        {/* Left bar of H */}
        <mesh position={[-0.6, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 1.8]} />
          <meshBasicMaterial color="#F8FAFC" />
        </mesh>
        {/* Right bar of H */}
        <mesh position={[0.6, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 1.8]} />
          <meshBasicMaterial color="#F8FAFC" />
        </mesh>
        {/* Crossbar of H */}
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 0.28]} />
          <meshBasicMaterial color="#F8FAFC" />
        </mesh>

        {/* Helipad Perimeter Green & Amber Aviation Landing Lights (16 perimeter beacons) */}
        {[...Array(16)].map((_, i) => {
          const angle = (i * Math.PI) / 8
          const x = Math.cos(angle) * 3.45
          const z = Math.sin(angle) * 3.45
          const isAmber = i % 4 === 0
          return (
            <group key={`helipad-light-${i}`} position={[x, 0.08, z]}>
              <mesh>
                <cylinderGeometry args={[0.035, 0.045, 0.12, 8]} />
                <meshStandardMaterial color="#0F172A" metalness={0.8} />
              </mesh>
              <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[0.042, 8, 8]} />
                <meshBasicMaterial color={isAmber ? '#F59E0B' : '#10B981'} />
              </mesh>
            </group>
          )
        })}

        {/* Helipad Cantilevered Steel Safety Catch Netting */}
        {[...Array(8)].map((_, i) => {
          const angle = (i * Math.PI) / 4 + Math.PI / 8
          const x = Math.cos(angle) * 3.8
          const z = Math.sin(angle) * 3.8
          return (
            <mesh key={`safety-net-${i}`} position={[x, -0.08, z]} rotation={[0.2, angle, 0]}>
              <boxGeometry args={[1.6, 0.04, 0.45]} />
              <meshStandardMaterial color="#475569" wireframe transparent opacity={0.6} />
            </mesh>
          )
        })}

        {/* Helipad Perimeter Touchdown Floodlights */}
        {[-2.8, 2.8].map((fx, idx) => (
          <group key={`floodlight-${idx}`} position={[fx, 0.1, -2.6]} rotation={[0.4, idx === 0 ? 0.6 : -0.6, 0]}>
            <mesh>
              <cylinderGeometry args={[0.04, 0.05, 0.6, 8]} />
              <meshStandardMaterial color="#334155" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.32, 0.08]} rotation={[0.5, 0, 0]}>
              <boxGeometry args={[0.18, 0.12, 0.14]} />
              <meshStandardMaterial color="#0F172A" />
            </mesh>
            <mesh position={[0, 0.32, 0.15]} rotation={[0.5, 0, 0]}>
              <circleGeometry args={[0.07, 16]} />
              <meshBasicMaterial color="#FEF08A" />
            </mesh>
          </group>
        ))}

        {/* Animated Weather Windsock Mast */}
        <group position={[3.1, 0.0, -1.8]}>
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 1.8, 8]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.9} />
          </mesh>
          {/* Top Obstruction Beacon */}
          <mesh position={[0, 1.85, 0]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#EF4444" />
          </mesh>
          {/* Windsock Cone */}
          <mesh position={[0.22, 1.68, 0]} rotation={[0, 0, -Math.PI / 2 + 0.15]}>
            <coneGeometry args={[0.14, 0.55, 12, 1, true]} />
            <meshStandardMaterial color="#EA580C" side={THREE.DoubleSide} />
          </mesh>
        </group>

        {/* Parked Medevac Air Ambulance Helicopter */}
        <AirAmbulanceHelicopter />
      </group>

      {/* 2. Solar Photovoltaic Panels Array */}
      <group position={[3.2, 0.2, -3.2]}>
        {[-0.8, 0.8].map((x, i) =>
          [-0.6, 0.6].map((z, j) => (
            <group key={`solar-${i}-${j}`} position={[x, 0, z]} rotation={[-0.3, 0, 0]}>
              <mesh>
                <boxGeometry args={[1.3, 0.05, 0.9]} />
                <meshStandardMaterial color="#0284C7" metalness={0.9} roughness={0.1} />
              </mesh>
              <mesh position={[0, 0.03, 0]}>
                <planeGeometry args={[1.2, 0.8]} />
                <meshBasicMaterial color="#0369A1" wireframe />
              </mesh>
            </group>
          ))
        )}
      </group>

      {/* 3. Rooftop Industrial AHU HVAC Ducts & Condenser Units */}
      <group position={[3.2, 0.5, 3.0]}>
        <mesh>
          <boxGeometry args={[2.2, 0.9, 1.6]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        {/* Protective Intake Louver Fins */}
        {[-0.3, 0, 0.3].map((yOff, lIdx) => (
          <mesh key={`louver-${lIdx}`} position={[0, yOff, 0.81]}>
            <boxGeometry args={[2.0, 0.04, 0.02]} />
            <meshStandardMaterial color="#1E293B" metalness={0.8} />
          </mesh>
        ))}
        {[-0.5, 0.5].map((x, idx) => (
          <group key={`ahu-fan-${idx}`} position={[x, 0.5, 0]}>
            <cylinderGeometry args={[0.3, 0.3, 0.15, 16]} />
            <meshStandardMaterial color="#0F172A" />
            <mesh position={[0, 0.1, 0]}>
              <ringGeometry args={[0.26, 0.3, 16]} />
              <meshBasicMaterial color="#64748B" wireframe />
            </mesh>
          </group>
        ))}
      </group>

      {/* 4. Satellite Comms Antenna & Microwave Dish */}
      <group position={[5.4, 0.2, 3.2]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 8]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.1, 0.15]} rotation={[0.4, 0, 0]}>
          <sphereGeometry args={[0.42, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#F8FAFC" side={THREE.DoubleSide} metalness={0.6} />
        </mesh>
      </group>

      {/* 5. Elevator Motor Penthouse & Aviation Strobe Beacon */}
      <mesh position={[6.5, 0.85, 0]}>
        <boxGeometry args={[1.6, 1.7, 2.8]} />
        <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} metalness={0.6} />
      </mesh>
      {/* Access Door */}
      <mesh position={[5.68, 0.65, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.8, 1.3]} />
        <meshStandardMaterial color="#334155" metalness={0.7} />
      </mesh>
      {/* Strobe Beacon Mast */}
      <mesh position={[6.5, 2.4, 0]}>
        <cylinderGeometry args={[0.04, 0.07, 1.8, 8]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
      </mesh>
      {/* Glowing Strobe Beacon Sphere */}
      <mesh position={[6.5, 3.35, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#EF4444" />
      </mesh>
      <pointLight
        ref={beaconRef}
        position={[6.5, 3.35, 0]}
        color="#EF4444"
        intensity={2.0}
        distance={12}
      />
    </group>
  )
}

/**
 * Realistic Industrial Infrastructure & Utility Plant Yard
 */
export function IndustrialPlantYard({ xrayMode = false, isLight = false }) {
  const yardWidth = 10.4
  const yardDepth = 14.0
  const yardCenter = [11.6, 0, 0]

  return (
    <group position={yardCenter}>
      {/* Reinforced Concrete Yard Foundation Pad */}
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[yardWidth, 0.12, yardDepth]} />
        <meshStandardMaterial
          color={isLight ? '#E2E8F0' : '#0B1120'}
          roughness={0.85}
          metalness={0.2}
          wireframe={xrayMode}
        />
      </mesh>

      {/* Yellow Safety Hazard Perimeter Curb */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[yardWidth, yardDepth]} />
        <meshBasicMaterial color="#EAB308" wireframe transparent opacity={0.35} />
      </mesh>

      {/* Reinforced Concrete Blast Deflection Wall Between Transformers */}
      <mesh position={[3.2, 0.9, -4.0]}>
        <boxGeometry args={[3.8, 1.8, 0.24]} />
        <meshStandardMaterial color={isLight ? '#64748B' : '#1E293B'} roughness={0.7} metalness={0.3} />
      </mesh>

      {/* High-Voltage Hazard Signs on Blast Wall */}
      <mesh position={[3.2, 1.3, -3.87]}>
        <planeGeometry args={[0.8, 0.4]} />
        <meshBasicMaterial color="#EAB308" />
      </mesh>

      {/* Transformer Gravel Oil-Catch Basins */}
      {[-2.5, -5.5].map((z, bIdx) => (
        <mesh key={`gravel-${bIdx}`} position={[3.2, 0.02, z]}>
          <boxGeometry args={[2.2, 0.04, 2.2]} />
          <meshStandardMaterial color="#334155" roughness={0.9} />
        </mesh>
      ))}

      {/* Industrial Utility Pipe Trench with Steel Grating */}
      <mesh position={[-0.2, 0.02, 0]}>
        <boxGeometry args={[1.2, 0.03, yardDepth - 1.2]} />
        <meshStandardMaterial color="#1E293B" wireframe metalness={0.8} />
      </mesh>

      {/* High-Voltage Chain-Link Security Fence */}
      <mesh position={[0, 0.75, -yardDepth / 2 + 0.1]}>
        <boxGeometry args={[yardWidth, 1.5, 0.04]} />
        <meshStandardMaterial color={isLight ? '#64748B' : '#475569'} wireframe transparent opacity={0.45} />
      </mesh>
      <mesh position={[yardWidth / 2 - 0.1, 0.75, 0]}>
        <boxGeometry args={[0.04, 1.5, yardDepth]} />
        <meshStandardMaterial color={isLight ? '#64748B' : '#475569'} wireframe transparent opacity={0.45} />
      </mesh>
      <mesh position={[0, 0.75, yardDepth / 2 - 0.1]}>
        <boxGeometry args={[yardWidth, 1.5, 0.04]} />
        <meshStandardMaterial color={isLight ? '#64748B' : '#475569'} wireframe transparent opacity={0.45} />
      </mesh>

      {/* Overhead Steel Pipe & Cable Gantry Bridge Connecting Yard to Building */}
      <group position={[-yardWidth / 2 - 1.2, 0, 0]}>
        <mesh position={[0, 1.6, -1.6]}>
          <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 1.6, 1.6]}>
          <cylinderGeometry args={[0.06, 0.06, 3.2, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 3.1, 0]}>
          <boxGeometry args={[2.8, 0.15, 3.6]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        {/* Overhead Heavy Cable Trays & High-Pressure Gas Pipes */}
        <mesh position={[0, 3.3, -0.7]}>
          <boxGeometry args={[3.0, 0.12, 0.28]} />
          <meshStandardMaterial color="#F59E0B" metalness={0.7} />
        </mesh>
        <mesh position={[0, 3.3, 0.7]}>
          <cylinderGeometry args={[0.09, 0.09, 3.0, 12]} rotation={[0, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#10B981" metalness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Exterior Architectural MEP Vertical Utility Riser Tower & Service Bridge
 * Sits at x = 5.2 on the Hospital East Facade, housing vertical riser conduits
 * connecting from Ground Utility Yard up to Level 3 ICU.
 */
export function ExteriorUtilityRiserTower({ xrayMode = false, activeFloor = 'all', isLight = false }) {
  const riserHeight = 11.2
  const riserX = 5.2

  return (
    <group position={[riserX, 0, 0]}>
      {/* 1. Structural Steel Frame Corner Columns */}
      {[-0.6, 0.6].map((cx, i) =>
        [-1.4, 1.4].map((cz, j) => (
          <mesh key={`riser-col-${i}-${j}`} position={[cx, riserHeight / 2, cz]}>
            <boxGeometry args={[0.12, riserHeight, 0.12]} />
            <meshStandardMaterial color={isLight ? '#64748B' : '#334155'} metalness={0.85} roughness={0.2} />
          </mesh>
        ))
      )}

      {/* 2. Horizontal Catwalk Platforms at Floor Levels (L1, L2, L3, Roof) */}
      {[0.0, 3.6, 7.2, 10.8].map((yLevel, pIdx) => (
        <group key={`catwalk-${pIdx}`} position={[0, yLevel, 0]}>
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[1.3, 0.12, 2.9]} />
            <meshStandardMaterial color={isLight ? '#94A3B8' : '#1E293B'} metalness={0.9} roughness={0.3} />
          </mesh>
          {/* Steel Safety Handrails */}
          <mesh position={[0.62, 0.55, 0]}>
            <boxGeometry args={[0.04, 0.85, 2.8]} />
            <meshStandardMaterial color="#94A3B8" wireframe metalness={0.8} />
          </mesh>
          {/* Floor Level Marker Beacon */}
          <mesh position={[0.65, 0.2, 1.3]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial color="#00F0FF" />
          </mesh>
        </group>
      ))}

      {/* 3. Semi-Transparent Glass Inspection Panels */}
      <mesh position={[0.62, riserHeight / 2, 0]}>
        <boxGeometry args={[0.04, riserHeight - 0.4, 2.7]} />
        <meshPhysicalMaterial
          color="#38BDF8"
          transmission={0.85}
          transparent
          opacity={xrayMode ? 0.08 : 0.22}
          roughness={0.1}
          metalness={0.4}
        />
      </mesh>

      {/* 4. Exterior Caged Service Maintenance Ladder */}
      <group position={[-0.65, 0, 0]}>
        {[-0.18, 0.18].map((lz, idx) => (
          <mesh key={`ladder-rail-${idx}`} position={[0, riserHeight / 2, lz]}>
            <cylinderGeometry args={[0.02, 0.02, riserHeight, 8]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        ))}
        {/* Rungs every 0.6m */}
        {[...Array(18)].map((_, rIdx) => (
          <mesh key={`rung-${rIdx}`} position={[0, 0.4 + rIdx * 0.6, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.36, 6]} rotation={[Math.PI / 2, 0, 0]} />
            <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
          </mesh>
        ))}
      </group>

      {/* 5. Overhead High-Voltage & Medical Pipe Rack Bridge to Yard */}
      <group position={[1.5, 2.2, 0]}>
        {/* Horizontal Steel Truss Beams */}
        <mesh position={[0, 0, -1.0]}>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.85} />
        </mesh>
        <mesh position={[0, 0, 1.0]}>
          <boxGeometry args={[2.8, 0.1, 0.1]} />
          <meshStandardMaterial color="#475569" metalness={0.85} />
        </mesh>
        {/* Cross Trays */}
        {[-1.0, 0, 1.0].map((tx, tIdx) => (
          <mesh key={`tray-${tIdx}`} position={[tx, 0.06, 0]}>
            <boxGeometry args={[0.1, 0.04, 2.0]} />
            <meshStandardMaterial color="#E2E8F0" metalness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/**
 * Ambulance Ground Access Apron on Hospital West Side (Emergency Intake)
 */
export function AmbulanceAccessGroundApron({ isLight = false }) {
  return (
    <group position={[-8.8, 0.01, 0]}>
      {/* Asphalt Access Road */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[4.2, 11.0]} />
        <meshStandardMaterial color={isLight ? '#334155' : '#0A0F1D'} roughness={0.9} />
      </mesh>

      {/* Red & Yellow Diagonal Chevron Markings for Emergency Bay Intake */}
      {[-3.0, 0, 3.0].map((cz, idx) => (
        <group key={`chevron-${idx}`} position={[0, 0.012, cz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3.2, 2.2]} />
            <meshBasicMaterial color="#DC2626" wireframe transparent opacity={0.5} />
          </mesh>
          {/* Yellow Boundary Stripe */}
          <mesh position={[-1.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 2.2]} />
            <meshBasicMaterial color="#EAB308" />
          </mesh>
          <mesh position={[1.6, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.15, 2.2]} />
            <meshBasicMaterial color="#EAB308" />
          </mesh>
        </group>
      ))}

      {/* Concrete Curb Separators */}
      <mesh position={[-2.15, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.16, 11.0]} />
        <meshStandardMaterial color={isLight ? '#CBD5E1' : '#334155'} />
      </mesh>
    </group>
  )
}

// ============================================================================
// 2. DETAILED CLINICAL & INFRASTRUCTURE ASSET 3D MESHES
// ============================================================================

/**
 * High-Fidelity ICU Bed Suite (ICU_BED_01 to ICU_BED_06)
 * Features articulated chassis, IV infusion stand, bedside ventilator with glowing screen,
 * and multi-parameter monitor with animated ECG pulse.
 */
export function ICUBedMesh({ status = 'normal', isSelected = false, hovered = false, bedNumber = '01' }) {
  const ecgCanvasRef = useRef()
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal
  const emissiveColor = STATUS_EMISSIVE[status] || '#000000'

  useFrame(({ clock }) => {
    if (ecgCanvasRef.current) {
      const t = clock.getElapsedTime()
      if (status === 'critical' || status === 'failed') {
        ecgCanvasRef.current.opacity = 0.4 + Math.sin(t * 14) * 0.4
      } else {
        ecgCanvasRef.current.opacity = 0.8 + Math.sin(t * 4) * 0.2
      }
    }
  })

  return (
    <group>
      {/* 1. 3D Glowing Status Beacon Pin */}
      <group position={[0, 2.1, -0.8]}>
        <mesh>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.1, 0.16, 16]} />
          <meshBasicMaterial color={statusColor} side={THREE.DoubleSide} transparent opacity={0.75} />
        </mesh>
      </group>

      {/* 2. Bed Base & Hydraulic Chassis */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[1.1, 0.16, 2.05]} />
        <meshStandardMaterial color="#1E293B" metalness={0.6} roughness={0.3} />
      </mesh>

      {/* 3. Articulated Mattress Platform (Head section raised for ICU patient) */}
      <group position={[0, 0.38, 0]}>
        {/* Raised Backrest */}
        <mesh position={[0, 0.18, -0.45]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.96, 0.16, 0.85]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.6} />
        </mesh>
        {/* Ergonomic Contour Pillow */}
        <mesh position={[0, 0.33, -0.72]} rotation={[0.32, 0, 0]}>
          <boxGeometry args={[0.65, 0.1, 0.32]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.4} />
        </mesh>
        {/* Lower Mattress Body */}
        <mesh position={[0, 0.05, 0.38]}>
          <boxGeometry args={[0.96, 0.16, 1.05]} />
          <meshStandardMaterial color="#F1F5F9" roughness={0.6} />
        </mesh>
        {/* Sterile Blue Blanket Cover */}
        <mesh position={[0, 0.15, 0.42]}>
          <boxGeometry args={[0.98, 0.06, 0.95]} />
          <meshStandardMaterial color="#0284C7" roughness={0.7} />
        </mesh>
      </group>

      {/* 4. Chrome Articulating Safety Side Rails */}
      {[-0.54, 0.54].map((x, idx) => (
        <mesh key={`rail-${idx}`} position={[x, 0.54, 0]}>
          <boxGeometry args={[0.04, 0.24, 1.45]} />
          <meshStandardMaterial color="#94A3B8" metalness={0.9} roughness={0.1} />
        </mesh>
      ))}

      {/* 5. Headboard with Integrated Status Indicator Lightbar */}
      <mesh position={[0, 0.65, -1.04]}>
        <boxGeometry args={[1.06, 0.5, 0.08]} />
        <meshStandardMaterial
          color={statusColor}
          emissive={isSelected ? '#00F0FF' : hovered ? emissiveColor : statusColor}
          emissiveIntensity={isSelected ? 0.8 : 0.3}
          metalness={0.4}
        />
      </mesh>

      {/* 6. Bedside IV Infusion Pump Stand (Left Side) */}
      <group position={[-0.75, 0, -0.45]}>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.9, 8]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
        </mesh>
        <mesh position={[0, 1.88, 0]}>
          <boxGeometry args={[0.28, 0.02, 0.04]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
        </mesh>
        {/* IV Fluid Saline Bags */}
        {[-0.09, 0.09].map((offset, i) => (
          <mesh key={`iv-bag-${i}`} position={[offset, 1.74, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.18, 8]} />
            <meshPhysicalMaterial color="#38BDF8" transmission={0.9} transparent opacity={0.75} />
          </mesh>
        ))}
        {/* Multi-Channel Syringe Infusion Pump Unit */}
        <mesh position={[0, 1.25, 0]}>
          <boxGeometry args={[0.2, 0.28, 0.16]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      </group>

      {/* 7. Bedside Mechanical Ventilator (Right Side) */}
      <group position={[0.75, 0, -0.35]}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.32, 0.9, 0.32]} />
          <meshStandardMaterial color="#1E293B" metalness={0.6} />
        </mesh>
        {/* Angled Ventilator Touchscreen */}
        <mesh position={[0, 1.02, 0.12]} rotation={[-0.35, 0, 0]}>
          <boxGeometry args={[0.28, 0.22, 0.04]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        <mesh position={[0, 1.02, 0.145]} rotation={[-0.35, 0, 0]}>
          <planeGeometry args={[0.24, 0.17]} />
          <meshBasicMaterial color={status === 'failed' ? '#EF4444' : '#00F0FF'} />
        </mesh>
        {/* Flexible Dual Breathing Hose to Patient */}
        <mesh position={[-0.18, 0.75, 0.18]}>
          <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} rotation={[0.4, 0, 0.4]} />
          <meshStandardMaterial color="#38BDF8" roughness={0.3} />
        </mesh>
      </group>

      {/* 8. Wall-Mounted Multi-Parameter Vital Signs Monitor with Pulsing Screen */}
      <group position={[-0.48, 1.25, -1.02]}>
        <mesh position={[0, 0.05, 0.14]} rotation={[0.1, 0.22, 0]}>
          <boxGeometry args={[0.4, 0.28, 0.05]} />
          <meshStandardMaterial color="#0F172A" metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.05, 0.17]} rotation={[0.1, 0.22, 0]}>
          <planeGeometry args={[0.36, 0.24]} />
          <meshBasicMaterial
            ref={ecgCanvasRef}
            color={status === 'failed' || status === 'critical' ? '#EF4444' : '#10B981'}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* 9. Overhead Medical Gas Ceiling Dropper Pendant */}
      <group position={[0, 2.2, 0]}>
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.4, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
        </mesh>
        {/* Color-Coded Medical Gas Quick-Connect Outlets */}
        {[-0.05, 0, 0.05].map((x, idx) => (
          <mesh key={`gas-drop-${idx}`} position={[x, -0.22, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 6]} />
            <meshBasicMaterial
              color={
                idx === 0
                  ? '#10B981' // Green Oxygen
                  : idx === 1
                    ? '#EAB308' // Yellow Vacuum Suction
                    : '#38BDF8' // Blue Nitrous / Air
              }
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}

/**
 * Operating Theatre Suite (OT_SUITE_01, OT_SUITE_02)
 * Features dual surgical luminaire lightheads with volumetric downlight cones,
 * operating table, anesthesia workstation, and digital imaging PACS monitor.
 */
export function OperatingTheatreMesh({ status = 'normal', isSelected = false, hovered = false }) {
  const surgicalLightRef = useRef()
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal

  useFrame(({ clock }) => {
    if (surgicalLightRef.current) {
      const t = clock.getElapsedTime()
      surgicalLightRef.current.intensity = status === 'failed' ? 0.3 : 1.8 + Math.sin(t * 2) * 0.2
    }
  })

  return (
    <group>
      {/* 3D Status Beacon */}
      <group position={[0, 2.4, 0]}>
        <mesh>
          <sphereGeometry args={[0.085, 16, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      </group>

      {/* Sterile Green Cleanroom Antistatic Floor Zone */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.3, 32]} />
        <meshStandardMaterial color="#064E3B" roughness={0.25} metalness={0.4} />
      </mesh>

      {/* Central Stainless Steel Operating Table */}
      <group position={[0, 0, 0]}>
        {/* Hydraulic Base Column */}
        <mesh position={[0, 0.28, 0]}>
          <cylinderGeometry args={[0.24, 0.32, 0.56, 16]} />
          <meshStandardMaterial color="#64748B" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Sub-frame Chassis */}
        <mesh position={[0, 0.58, 0]}>
          <boxGeometry args={[0.8, 0.12, 1.95]} />
          <meshStandardMaterial color="#0F172A" metalness={0.7} />
        </mesh>
        {/* Conductive Carbon-Fiber Surgical Table Top */}
        <mesh position={[0, 0.66, 0]}>
          <boxGeometry args={[0.72, 0.06, 1.88]} />
          <meshStandardMaterial color="#1E293B" roughness={0.4} />
        </mesh>
      </group>

      {/* Dual Articulating Overhead Surgical Luminaire Lights with Volumetric Downlight Glow */}
      <group position={[0, 2.1, 0]}>
        {/* Central Ceiling Mount */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.15, 0.15, 0.2, 16]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.8} />
        </mesh>
        {/* Lighthead 1 */}
        <mesh position={[-0.6, -0.35, -0.45]} rotation={[0.4, 0.3, 0]}>
          <cylinderGeometry args={[0.35, 0.38, 0.09, 24]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.8} />
        </mesh>
        <mesh position={[-0.6, -0.4, -0.45]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.32, 24]} />
          <meshBasicMaterial color="#F0FDF4" />
        </mesh>
        <pointLight
          ref={surgicalLightRef}
          position={[-0.6, -0.5, -0.45]}
          color="#E0F2FE"
          intensity={1.8}
          distance={4.5}
        />

        {/* Lighthead 2 */}
        <mesh position={[0.6, -0.4, 0.45]} rotation={[-0.35, -0.3, 0]}>
          <cylinderGeometry args={[0.28, 0.3, 0.09, 20]} />
          <meshStandardMaterial color="#F8FAFC" metalness={0.8} />
        </mesh>
        <mesh position={[0.6, -0.45, 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.26, 20]} />
          <meshBasicMaterial color="#F0FDF4" />
        </mesh>
      </group>

      {/* Anesthesia Workstation & Monitor Cart */}
      <group position={[-1.35, 0, -0.75]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[0.55, 1.2, 0.46]} />
          <meshStandardMaterial color="#1E293B" metalness={0.6} />
        </mesh>
        {/* Dual Gas Flowmeters */}
        <mesh position={[0, 1.2, 0.12]}>
          <boxGeometry args={[0.42, 0.26, 0.04]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        <mesh position={[0, 1.2, 0.145]}>
          <planeGeometry args={[0.38, 0.22]} />
          <meshBasicMaterial color="#10B981" />
        </mesh>
      </group>

      {/* Wall PACS Imaging Diagnostic Monitor */}
      <group position={[1.4, 1.2, 0]}>
        <mesh>
          <boxGeometry args={[0.06, 0.55, 0.9]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        <mesh position={[-0.035, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[0.82, 0.48]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Emergency Trauma Resuscitation Bay (ED_BAY_01 to ED_BAY_04)
 */
export function EmergencyTraumaBayMesh({ status = 'normal', isSelected = false, hovered = false, bayNumber = '01' }) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      {/* 3D Status Beacon */}
      <group position={[0, 1.9, -0.7]}>
        <mesh>
          <sphereGeometry args={[0.075, 16, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      </group>

      {/* Emergency Mobile Gurney Stretcher */}
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.88, 0.26, 1.85]} />
          <meshStandardMaterial color="#E2E8F0" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[0.8, 0.14, 1.78]} />
          <meshStandardMaterial color="#0284C7" roughness={0.5} />
        </mesh>
        {/* Stretcher Swivel Wheels */}
        {[-0.38, 0.38].map((x, i) =>
          [-0.75, 0.75].map((z, j) => (
            <mesh key={`wheel-${i}-${j}`} position={[x, 0.06, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 8]} />
              <meshStandardMaterial color="#0F172A" />
            </mesh>
          ))
        )}
      </group>

      {/* Emergency Red Crash Cart with Defibrillator */}
      <group position={[-0.72, 0, -0.35]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.38, 0.8, 0.38]} />
          <meshStandardMaterial color="#DC2626" roughness={0.4} />
        </mesh>
        {/* Defibrillator with Monitor Screen */}
        <mesh position={[0, 0.92, 0]}>
          <boxGeometry args={[0.28, 0.18, 0.24]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
        <mesh position={[0, 0.92, 0.13]}>
          <planeGeometry args={[0.22, 0.14]} />
          <meshBasicMaterial color="#00F0FF" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Inpatient General Ward Room Bed (WARD_ROOM_101 to WARD_ROOM_104)
 */
export function GeneralWardBedMesh({ status = 'normal', isSelected = false, hovered = false, roomNumber = '101' }) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      <group position={[0, 1.7, -0.85]}>
        <mesh>
          <sphereGeometry args={[0.065, 16, 16]} />
          <meshBasicMaterial color={statusColor} />
        </mesh>
      </group>

      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.96, 0.15, 1.95]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <boxGeometry args={[0.88, 0.18, 1.86]} />
        <meshStandardMaterial color="#F8FAFC" />
      </mesh>
      <mesh position={[0, 0.42, 0.35]}>
        <boxGeometry args={[0.9, 0.04, 1.1]} />
        <meshStandardMaterial color="#6366F1" />
      </mesh>
      <mesh position={[0, 0.55, -0.98]}>
        <boxGeometry args={[0.98, 0.42, 0.06]} />
        <meshStandardMaterial color={statusColor} />
      </mesh>
      {/* Bedside Locker Cabinet */}
      <mesh position={[0.7, 0.35, -0.6]}>
        <boxGeometry args={[0.38, 0.7, 0.38]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
    </group>
  )
}

/**
 * Central Nurse Monitoring Command Desk
 */
export function NurseStationMesh({ status = 'normal', isSelected = false, hovered = false }) {
  const statusColor = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      {/* Curved Modern Command Console */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[1.8, 0.95, 0.8]} />
        <meshStandardMaterial color="#0F172A" metalness={0.5} />
      </mesh>
      {/* Neon Trim Ribbon */}
      <mesh position={[0, 0.05, 0.41]}>
        <boxGeometry args={[1.76, 0.06, 0.04]} />
        <meshBasicMaterial color={statusColor} />
      </mesh>
      {/* Triple Central Telemetry Workstation Screens */}
      {[-0.55, 0, 0.55].map((x, idx) => (
        <group key={`mon-${idx}`} position={[x, 1.05, 0.12]}>
          <mesh>
            <boxGeometry args={[0.42, 0.28, 0.04]} />
            <meshStandardMaterial color="#1E293B" />
          </mesh>
          <mesh position={[0, 0, 0.025]}>
            <planeGeometry args={[0.38, 0.24]} />
            <meshBasicMaterial color="#00F0FF" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/**
 * Hospital Operations & Admin Command Hub
 */
export function AdminHubMesh({ status = 'normal' }) {
  return (
    <group>
      <mesh position={[0, 0.38, 0]}>
        <boxGeometry args={[2.0, 0.76, 1.2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={`admin-mon-${i}`} position={[x, 0.9, 0]}>
          <boxGeometry args={[0.45, 0.28, 0.04]} />
          <meshStandardMaterial color="#0F172A" />
        </mesh>
      ))}
    </group>
  )
}

/**
 * Covered Ambulance Intake Bay with 3D Emergency Ambulance Vehicle
 */
export function AmbulanceBayMesh({ status = 'normal' }) {
  const flasherRef = useRef()

  useFrame(({ clock }) => {
    if (flasherRef.current) {
      const t = clock.getElapsedTime()
      flasherRef.current.intensity = Math.sin(t * 8) > 0 ? 2.0 : 0.2
    }
  })

  return (
    <group>
      {/* Asphalt Driveway Platform with Yellow Bay Chevron Markings */}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[3.2, 0.04, 3.8]} />
        <meshStandardMaterial color="#0F172A" roughness={0.9} />
      </mesh>

      {/* Overhead Steel Weather Canopy */}
      <mesh position={[0, 2.4, 0]}>
        <boxGeometry args={[3.2, 0.12, 3.8]} />
        <meshStandardMaterial color="#1E293B" metalness={0.6} />
      </mesh>
      {/* Canopy Support Columns */}
      {[-1.5, 1.5].map((x, i) =>
        [-1.8, 1.8].map((z, j) => (
          <mesh key={`canopy-col-${i}-${j}`} position={[x, 1.2, z]}>
            <cylinderGeometry args={[0.06, 0.06, 2.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
        ))
      )}

      {/* Illuminated RED EMERGENCY ENTRANCE Sign */}
      <group position={[0, 2.5, 1.85]}>
        <mesh>
          <boxGeometry args={[1.2, 0.25, 0.05]} />
          <meshBasicMaterial color="#DC2626" />
        </mesh>
      </group>

      {/* 3D Detailed Emergency Ambulance Van */}
      <group position={[0, 0, 0]}>
        {/* Chassis & Body */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.3, 0.9, 2.4]} />
          <meshStandardMaterial color="#F8FAFC" roughness={0.2} metalness={0.4} />
        </mesh>
        {/* Front Cab / Windshield */}
        <mesh position={[0, 0.55, 0.85]} rotation={[0.2, 0, 0]}>
          <boxGeometry args={[1.26, 0.7, 0.7]} />
          <meshPhysicalMaterial color="#38BDF8" transmission={0.8} transparent opacity={0.4} />
        </mesh>
        {/* Red Emergency Reflective Side Stripes */}
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[1.32, 0.18, 2.4]} />
          <meshStandardMaterial color="#DC2626" />
        </mesh>
        {/* Roof Emergency Lightbar */}
        <mesh position={[0, 1.05, 0.4]}>
          <boxGeometry args={[0.9, 0.1, 0.25]} />
          <meshBasicMaterial color="#EF4444" />
        </mesh>
        <pointLight
          ref={flasherRef}
          position={[0, 1.2, 0.4]}
          color="#EF4444"
          intensity={1.8}
          distance={6}
        />
        {/* Wheels */}
        {[-0.68, 0.68].map((x, i) =>
          [-0.7, 0.7].map((z, j) => (
            <mesh key={`amb-wheel-${i}-${j}`} position={[x, 0.22, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
              <meshStandardMaterial color="#0F172A" roughness={0.8} />
            </mesh>
          ))
        )}
      </group>
    </group>
  )
}

// ============================================================================
// 3. UTILITY & INFRASTRUCTURE PLANT MESHES
// ============================================================================

/**
 * 1. Substation High-Voltage Pylon & Grid Feed (GRID_MAIN)
 */
export function SubstationPylon({ status = 'normal', isSelected = false, hovered = false }) {
  const sparkRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  useFrame(({ clock }) => {
    if (sparkRef.current) {
      const t = clock.getElapsedTime()
      sparkRef.current.intensity = status === 'normal' ? 1.0 + Math.sin(t * 10) * 0.5 : 0.1
    }
  })

  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.2, 0.2, 2.2]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      {/* High-Voltage Steel Lattice Pylon Legs */}
      {[-0.6, 0.6].map((x, i) =>
        [-0.6, 0.6].map((z, j) => (
          <mesh key={`pylon-leg-${i}-${j}`} position={[x, 1.2, z]}>
            <cylinderGeometry args={[0.04, 0.06, 2.2, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>
        ))
      )}
      {/* High-Voltage Crossarm */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[2.5, 0.12, 0.25]} />
        <meshStandardMaterial color="#334155" metalness={0.8} />
      </mesh>
      {/* Ceramic Insulator Stacks */}
      {[-0.9, 0, 0.9].map((x, idx) => (
        <group key={`insul-${idx}`} position={[x, 2.05, 0]}>
          <mesh>
            <cylinderGeometry args={[0.08, 0.08, 0.35, 8]} />
            <meshStandardMaterial color="#78716C" roughness={0.3} metalness={0.7} />
          </mesh>
        </group>
      ))}
      {/* 11kV Grid Feed Step Transformer Terminal Box */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[1.15, 0.75, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.6} />
      </mesh>
      <pointLight ref={sparkRef} position={[0, 2.3, 0]} color="#00F0FF" intensity={1.0} distance={4.5} />
    </group>
  )
}

/**
 * 2. Step-Down Distribution Transformer (TRANSFORMER_01, TRANSFORMER_02)
 */
export function TransformerUnit({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.8, 0.2, 1.6]} />
        <meshStandardMaterial color="#1E293B" />
      </mesh>
      {/* Main Core Tank with Radiator Cooling Fins */}
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.35, 1.0, 1.15]} />
        <meshStandardMaterial color={color} roughness={0.35} metalness={0.5} />
      </mesh>
      {/* Conservator Oil Drum on Top */}
      <mesh position={[0, 1.35, -0.2]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.18, 0.18, 1.2, 16]} />
        <meshStandardMaterial color="#475569" metalness={0.8} />
      </mesh>
      {/* High-Voltage Ceramic Bushings */}
      {[-0.38, 0, 0.38].map((x, idx) => (
        <mesh key={`bushing-${idx}`} position={[x, 1.45, 0.2]}>
          <cylinderGeometry args={[0.045, 0.07, 0.42, 10]} />
          <meshStandardMaterial color="#CBD5E1" metalness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 3. Switchgear & Bus Racks (MAIN_BUS, EMERGENCY_BUS)
 */
export function SwitchgearRack({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.6, 1.6, 0.85]} />
        <meshStandardMaterial color={color} metalness={0.6} />
      </mesh>
      {/* Metering Display Ribbon */}
      <mesh position={[0, 0.8, 0.44]}>
        <boxGeometry args={[1.4, 0.1, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  )
}

/**
 * 4. Industrial Diesel Generator (GEN_01, GEN_02) with High-Speed Spinning Radiator Fan
 */
export function IndustrialGenerator({ status = 'normal', isSelected = false, hovered = false }) {
  const fanRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  useFrame((_, delta) => {
    if (fanRef.current && (status === 'normal' || status === 'starting' || isSelected)) {
      fanRef.current.rotation.y += delta * 18
    }
  })

  return (
    <group>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[2.1, 0.2, 1.4]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      {/* Acoustic Enclosure Sound Hood */}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[1.8, 1.0, 1.15]} />
        <meshStandardMaterial color={color} metalness={0.4} />
      </mesh>
      {/* Exhaust Silencer Stack */}
      <mesh position={[-0.6, 1.5, 0]}>
        <cylinderGeometry args={[0.09, 0.09, 0.75, 12]} />
        <meshStandardMaterial color="#1E293B" metalness={0.9} />
      </mesh>
      {/* Spinning Engine Radiator Fan Blades */}
      <group position={[0.55, 1.25, 0]}>
        <mesh ref={fanRef}>
          <boxGeometry args={[0.45, 0.02, 0.1]} />
          <meshBasicMaterial color="#38BDF8" />
        </mesh>
      </group>
    </group>
  )
}

/**
 * 5. Static UPS & Battery Storage Rack (UPS_CRITICAL)
 */
export function BatteryStorageRack({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      <mesh position={[0, 0.8, 0]}>
        <boxGeometry args={[1.25, 1.6, 0.95]} />
        <meshStandardMaterial color={color} metalness={0.7} />
      </mesh>
      {[0.38, 0.8, 1.22].map((y, idx) => (
        <mesh key={`bat-${idx}`} position={[0, y, 0.49]}>
          <boxGeometry args={[0.98, 0.18, 0.04]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

/**
 * 6. HVAC Chiller & Cooling Towers (CHILLER_PLANT) with Rotating Condenser Fans
 */
export function ChillerCoolingTower({ status = 'normal', isSelected = false, hovered = false }) {
  const fanRef = useRef()
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  useFrame((_, delta) => {
    if (fanRef.current && status === 'normal') {
      fanRef.current.rotation.y += delta * 12
    }
  })

  return (
    <group>
      <mesh position={[0, 0.7, 0]}>
        <boxGeometry args={[1.6, 1.3, 1.4]} />
        <meshStandardMaterial color={color} metalness={0.6} />
      </mesh>
      <mesh position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 0.25, 16]} />
        <meshStandardMaterial color="#0F172A" />
      </mesh>
      <mesh ref={fanRef} position={[0, 1.48, 0]}>
        <boxGeometry args={[0.8, 0.02, 0.12]} />
        <meshBasicMaterial color="#38BDF8" />
      </mesh>
    </group>
  )
}

/**
 * 7. Cryogenic Liquid Oxygen Yard (OXYGEN_MANIFOLD) with Vapor Frost Plume
 */
export function CryoOxygenYard({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      {/* Vacuum-Insulated Cryogenic Storage Vessel */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.48, 0.48, 2.3, 24]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.2} />
      </mesh>
      <mesh position={[0, 2.4, 0]}>
        <sphereGeometry args={[0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} metalness={0.7} />
      </mesh>
      {/* Ambient Air Vaporizer Fin Array */}
      <mesh position={[0.78, 0.85, 0]}>
        <boxGeometry args={[0.32, 1.5, 0.65]} />
        <meshStandardMaterial color="#CBD5E1" metalness={0.9} />
      </mesh>
    </group>
  )
}

/**
 * 8. Potable & Booster Water Pump Station (WATER_PUMP_STATION)
 */
export function HydroWaterPump({ status = 'normal', isSelected = false, hovered = false }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.normal

  return (
    <group>
      {[-0.36, 0.36].map((x, idx) => (
        <group key={`pump-${idx}`} position={[x, 0.45, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.6, 16]} />
            <meshStandardMaterial color={color} metalness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

