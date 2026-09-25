/**
 * 3D Digital Twin Constants, Layout Topology & Hospital Model Specifications
 * Aligned with Master Documentation Part V (Hospital Model) & Part XXVII (3D Digital Twin)
 */

export const STATUS_COLORS = {
  normal: '#10B981',    // Emerald Green
  degraded: '#F59E0B',  // Amber Caution
  critical: '#EF4444',  // Coral Alert
  failed: '#DC2626',    // Crimson Failure
  offline: '#64748B',   // Muted Slate
  starting: '#06B6D4',  // Cyan Transitional
  recovering: '#38BDF8' // Sky Blue Recovery
}

export const STATUS_EMISSIVE = {
  normal: '#059669',
  degraded: '#D97706',
  critical: '#DC2626',
  failed: '#991B1B',
  offline: '#1F2937',
  starting: '#0891B2',
  recovering: '#0284C7'
}

/**
 * Hospital Floor Elevation Levels & Architectural Profiles
 */
export const FLOOR_DEFINITIONS = [
  {
    id: 'floor_3',
    level: 3,
    name: 'Level 3 — Intensive Care Unit (ICU Wing)',
    shortName: 'Level 3: ICU Wing',
    badge: 'Criticality 5',
    elevation: 7.2,
    color: '#EF4444',
    subsystem: 'Intensive Care Life-Support',
    description: '6 Private ICU Bed cubicles with mechanical ventilators, vital signs monitors, infusion pumps & central telemetry nurse station.',
    assetsCount: 7
  },
  {
    id: 'floor_2',
    level: 2,
    name: 'Level 2 — Surgical Suites (OT) & Wards',
    shortName: 'Level 2: OT & Wards',
    badge: 'Criticality 5 & 3',
    elevation: 3.6,
    color: '#8B5CF6',
    subsystem: 'Surgical Theatres & Inpatient Wards',
    description: 'Operating Theatres 1 & 2 with dual luminaire lights and anesthesia stations, plus Inpatient Ward Rooms 101–104.',
    assetsCount: 7
  },
  {
    id: 'floor_1',
    level: 1,
    name: 'Level 1 — Emergency Trauma (ED) & Admin',
    shortName: 'Level 1: ED & Admin',
    badge: 'Criticality 5 & 1',
    elevation: 0.0,
    color: '#3B82F6',
    subsystem: 'Emergency Trauma & Hospital Operations',
    description: 'Emergency Trauma Resuscitation Bays 1–4, Ambulance Intake Bay, and Hospital Operations Command Center.',
    assetsCount: 6
  },
  {
    id: 'floor_0',
    level: 0,
    name: 'Level 0 — Plant & Infrastructure Yard',
    shortName: 'Level 0: Utility Yard',
    badge: 'Infrastructure Core',
    elevation: -0.1,
    color: '#00F0FF',
    subsystem: 'Primary Power, Generation, Gas, HVAC & Water',
    description: '11kV Grid feed, Transformers, Main & Emergency Switchgear, Standby Diesel Generators, UPS Battery Bank, Liquid Oxygen, Water Pumps, Chiller Plant.',
    assetsCount: 11
  }
]

/**
 * Complete Asset 3D Topology Coordinates & Mesh Types
 * Preserves exact asset IDs matching backend and frontend state engines
 */
export const ASSET_TOPOLOGY_DEFS = {
  // ==========================================
  // LEVEL 3: INTENSIVE CARE UNIT (ICU) WING (Elevation Y = 7.2)
  // ==========================================
  ICU_BED_01: {
    position: [-4.6, 7.2, -3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 1 (Cardiac Care)',
    label: 'ICU_BED_01',
    meshType: 'icu_bed',
    bedNumber: '01',
    zone: 'ICU Cardiac Pod 1',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_BED_02: {
    position: [-1.6, 7.2, -3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 2 (Neuro Intensive)',
    label: 'ICU_BED_02',
    meshType: 'icu_bed',
    bedNumber: '02',
    zone: 'ICU Neuro Pod 2',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_BED_03: {
    position: [1.4, 7.2, -3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 3 (Trauma Critical)',
    label: 'ICU_BED_03',
    meshType: 'icu_bed',
    bedNumber: '03',
    zone: 'ICU Trauma Pod 3',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_BED_04: {
    position: [-4.6, 7.2, 3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 4 (Post-Surgical)',
    label: 'ICU_BED_04',
    meshType: 'icu_bed',
    bedNumber: '04',
    zone: 'ICU Recovery Pod 4',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_BED_05: {
    position: [-1.6, 7.2, 3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 5 (Isolation Suite)',
    label: 'ICU_BED_05',
    meshType: 'icu_bed',
    bedNumber: '05',
    zone: 'ICU Isolation Suite 5',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_BED_06: {
    position: [1.4, 7.2, 3.0],
    category: 'clinical',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Bed 6 (High-Dependency)',
    label: 'ICU_BED_06',
    meshType: 'icu_bed',
    bedNumber: '06',
    zone: 'ICU HDU Pod 6',
    serviceId: 'SERVICE_ICU',
    powerSource: 'UPS_CRITICAL / ESB',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ICU_NURSE_STATION: {
    position: [4.2, 7.2, 0.0],
    category: 'clinical_support',
    department: 'icu',
    floor: 3,
    floorId: 'floor_3',
    subsystem: 'ICU Central Telemetry Desk',
    label: 'ICU_NURSE_STATION',
    meshType: 'nurse_station',
    zone: 'ICU Nurse Central',
    serviceId: 'SERVICE_ICU',
    powerSource: 'EMERGENCY_BUS',
    gasSource: null
  },

  // ==========================================
  // LEVEL 2: SURGICAL THEATRES & GENERAL WARDS (Elevation Y = 3.6)
  // ==========================================
  OT_SUITE_01: {
    position: [-4.6, 3.6, -2.8],
    category: 'surgical',
    department: 'surgical',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Operating Theatre 1 (General/Ortho)',
    label: 'OT_SUITE_01',
    meshType: 'operating_theatre',
    zone: 'OT Cleanroom 1',
    serviceId: 'SERVICE_OT',
    powerSource: 'EMERGENCY_BUS / UPS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  OT_SUITE_02: {
    position: [-4.6, 3.6, 2.8],
    category: 'surgical',
    department: 'surgical',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Operating Theatre 2 (Cardiovascular)',
    label: 'OT_SUITE_02',
    meshType: 'operating_theatre',
    zone: 'OT Cleanroom 2',
    serviceId: 'SERVICE_OT',
    powerSource: 'EMERGENCY_BUS / UPS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  WARD_ROOM_101: {
    position: [1.2, 3.6, -3.0],
    category: 'ward',
    department: 'wards',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Inpatient Ward Room 101',
    label: 'WARD_ROOM_101',
    meshType: 'ward_bed',
    roomNumber: '101',
    zone: 'East Wing Ward Room 101',
    serviceId: 'SERVICE_WARD',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },
  WARD_ROOM_102: {
    position: [4.0, 3.6, -3.0],
    category: 'ward',
    department: 'wards',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Inpatient Ward Room 102',
    label: 'WARD_ROOM_102',
    meshType: 'ward_bed',
    roomNumber: '102',
    zone: 'East Wing Ward Room 102',
    serviceId: 'SERVICE_WARD',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },
  WARD_ROOM_103: {
    position: [1.2, 3.6, 3.0],
    category: 'ward',
    department: 'wards',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Inpatient Ward Room 103',
    label: 'WARD_ROOM_103',
    meshType: 'ward_bed',
    roomNumber: '103',
    zone: 'East Wing Ward Room 103',
    serviceId: 'SERVICE_WARD',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },
  WARD_ROOM_104: {
    position: [4.0, 3.6, 3.0],
    category: 'ward',
    department: 'wards',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Inpatient Ward Room 104',
    label: 'WARD_ROOM_104',
    meshType: 'ward_bed',
    roomNumber: '104',
    zone: 'East Wing Ward Room 104',
    serviceId: 'SERVICE_WARD',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },
  WARD_NURSE_STATION: {
    position: [-1.0, 3.6, 0.0],
    category: 'clinical_support',
    department: 'wards',
    floor: 2,
    floorId: 'floor_2',
    subsystem: 'Ward Central Nurse Station',
    label: 'WARD_NURSE_STATION',
    meshType: 'nurse_station',
    zone: 'Ward Nurse Central',
    serviceId: 'SERVICE_WARD',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },

  // ==========================================
  // LEVEL 1: EMERGENCY TRAUMA (ED) & ADMIN (Elevation Y = 0.0)
  // ==========================================
  ED_BAY_01: {
    position: [-4.6, 0.0, -2.8],
    category: 'emergency',
    department: 'emergency',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Trauma Resuscitation Bay 1',
    label: 'ED_BAY_01',
    meshType: 'emergency_bay',
    bayNumber: '01',
    zone: 'Emergency Trauma Bay 1',
    serviceId: 'SERVICE_ER',
    powerSource: 'EMERGENCY_BUS / UPS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ED_BAY_02: {
    position: [-1.6, 0.0, -2.8],
    category: 'emergency',
    department: 'emergency',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Trauma Resuscitation Bay 2',
    label: 'ED_BAY_02',
    meshType: 'emergency_bay',
    bayNumber: '02',
    zone: 'Emergency Trauma Bay 2',
    serviceId: 'SERVICE_ER',
    powerSource: 'EMERGENCY_BUS / UPS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ED_BAY_03: {
    position: [-4.6, 0.0, 2.8],
    category: 'emergency',
    department: 'emergency',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Acute Treatment Bay 3',
    label: 'ED_BAY_03',
    meshType: 'emergency_bay',
    bayNumber: '03',
    zone: 'Emergency Acute Bay 3',
    serviceId: 'SERVICE_ER',
    powerSource: 'EMERGENCY_BUS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  ED_BAY_04: {
    position: [-1.6, 0.0, 2.8],
    category: 'emergency',
    department: 'emergency',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Triage Assessment Bay 4',
    label: 'ED_BAY_04',
    meshType: 'emergency_bay',
    bayNumber: '04',
    zone: 'Emergency Triage Bay 4',
    serviceId: 'SERVICE_ER',
    powerSource: 'EMERGENCY_BUS',
    gasSource: 'OXYGEN_MANIFOLD'
  },
  AMBULANCE_INTAKE: {
    position: [-9.2, 0.0, 0.0],
    category: 'emergency_support',
    department: 'emergency',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Ambulance Intake & Canopy',
    label: 'AMBULANCE_INTAKE',
    meshType: 'ambulance_bay',
    zone: 'Ambulance Port',
    serviceId: 'SERVICE_ER',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },
  ADMIN_OPS: {
    position: [2.8, 0.0, 0.0],
    category: 'admin',
    department: 'admin',
    floor: 1,
    floorId: 'floor_1',
    subsystem: 'Hospital Operations Command Hub',
    label: 'ADMIN_OPS',
    meshType: 'admin_hub',
    zone: 'Administration Wing',
    serviceId: 'SERVICE_ADMIN',
    powerSource: 'MAIN_BUS',
    gasSource: null
  },

  // ==========================================
  // LEVEL 0: UTILITY & LIFE-SAFETY PLANT YARD (Elevation Y = 0.0, Right Wing)
  // ==========================================
  GRID_MAIN: {
    position: [14.8, 0.0, -4.8],
    category: 'power',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: '11kV Primary Grid Feed',
    label: 'GRID_MAIN',
    meshType: 'substation',
    zone: 'Substation Yard',
    powerSource: 'City Utility Grid'
  },
  TRANSFORMER_01: {
    position: [11.4, 0.0, -4.8],
    category: 'power',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Substation Step-Down T1',
    label: 'TRANSFORMER_01',
    meshType: 'transformer',
    zone: 'Substation Yard',
    powerSource: 'GRID_MAIN'
  },
  TRANSFORMER_02: {
    position: [11.4, 0.0, -2.0],
    category: 'power',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Emergency Step-Down T2',
    label: 'TRANSFORMER_02',
    meshType: 'transformer',
    zone: 'Substation Yard',
    powerSource: 'GRID_MAIN'
  },
  MAIN_BUS: {
    position: [8.4, 0.0, -4.8],
    category: 'switchgear',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Main Switchboard (MSB)',
    label: 'MAIN_BUS',
    meshType: 'switchgear',
    zone: 'Electrical Switchroom',
    powerSource: 'TRANSFORMER_01 / GEN_02'
  },
  EMERGENCY_BUS: {
    position: [8.4, 0.0, -2.0],
    category: 'switchgear',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Emergency Switchboard (ESB)',
    label: 'EMERGENCY_BUS',
    meshType: 'switchgear',
    zone: 'Electrical Switchroom',
    powerSource: 'TRANSFORMER_02 / GEN_01'
  },
  GEN_01: {
    position: [14.8, 0.0, 1.8],
    category: 'generation',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Standby Generator 1 (750kVA)',
    label: 'GEN_01',
    meshType: 'generator',
    zone: 'Generator Bay 1'
  },
  GEN_02: {
    position: [14.8, 0.0, 5.0],
    category: 'generation',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Standby Generator 2 (500kVA)',
    label: 'GEN_02',
    meshType: 'generator',
    zone: 'Generator Bay 2'
  },
  UPS_CRITICAL: {
    position: [8.4, 0.0, 1.8],
    category: 'generation',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Central Static UPS Battery Bank',
    label: 'UPS_CRITICAL',
    meshType: 'ups',
    zone: 'UPS Room',
    powerSource: 'EMERGENCY_BUS'
  },
  CHILLER_PLANT: {
    position: [11.4, 0.0, 5.0],
    category: 'mechanical',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'HVAC Chiller & AHU Plant',
    label: 'CHILLER_PLANT',
    meshType: 'chiller',
    zone: 'Mechanical Deck',
    powerSource: 'MAIN_BUS'
  },
  OXYGEN_MANIFOLD: {
    position: [8.4, 0.0, 5.0],
    category: 'medical_gas',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Cryogenic Liquid Oxygen Tank',
    label: 'OXYGEN_MANIFOLD',
    meshType: 'oxygen',
    zone: 'Medical Gas Yard',
    powerSource: 'UPS_CRITICAL'
  },
  WATER_PUMP_STATION: {
    position: [11.4, 0.0, 1.8],
    category: 'mechanical',
    department: 'utilities',
    floor: 0,
    floorId: 'floor_0',
    subsystem: 'Potable & Booster Water Pumps',
    label: 'WATER_PUMP_STATION',
    meshType: 'water_pump',
    zone: 'Pump Basement',
    powerSource: 'EMERGENCY_BUS'
  }
}

/**
 * Dynamic Conduits Routing with Pulse Speed and Color Codes
 */
export const DEPENDENCY_CONNECTIONS = [
  // Primary & Emergency Electrical Power Grid Links
  { from: 'GRID_MAIN', to: 'TRANSFORMER_01', type: 'high_voltage', color: '#00F0FF', label: '11kV Primary Feed', speed: 2.2 },
  { from: 'GRID_MAIN', to: 'TRANSFORMER_02', type: 'high_voltage', color: '#00F0FF', label: '11kV Emergency Feed', speed: 2.2 },
  { from: 'TRANSFORMER_01', to: 'MAIN_BUS', type: 'power', color: '#38BDF8', label: '415V Main Distribution', speed: 1.8 },
  { from: 'TRANSFORMER_02', to: 'EMERGENCY_BUS', type: 'emergency_power', color: '#F59E0B', label: '415V Essential Feed', speed: 1.8 },
  { from: 'GEN_01', to: 'EMERGENCY_BUS', type: 'generator_backup', color: '#EAB308', label: 'Diesel Gen 1 Link', speed: 1.5 },
  { from: 'GEN_02', to: 'MAIN_BUS', type: 'generator_backup', color: '#EAB308', label: 'Diesel Gen 2 Link', speed: 1.5 },
  { from: 'EMERGENCY_BUS', to: 'UPS_CRITICAL', type: 'critical_power', color: '#F59E0B', label: 'UPS Inverter Supply', speed: 2.0 },
  
  // Plant Equipment Power Feeds
  { from: 'MAIN_BUS', to: 'CHILLER_PLANT', type: 'mechanical_power', color: '#38BDF8', label: 'HVAC Chiller Power', speed: 1.4 },
  { from: 'UPS_CRITICAL', to: 'OXYGEN_MANIFOLD', type: 'life_safety', color: '#10B981', label: 'Cryo Vaporizer Power', speed: 1.6 },
  { from: 'EMERGENCY_BUS', to: 'WATER_PUMP_STATION', type: 'utility_power', color: '#60A5FA', label: 'Booster Pump Power', speed: 1.4 },

  // Hospital Conduits -> Level 3 ICU Wing
  { from: 'UPS_CRITICAL', to: 'ICU_BED_01', type: 'critical_power', color: '#F59E0B', label: 'ICU 01 UPS Power', speed: 1.8 },
  { from: 'UPS_CRITICAL', to: 'ICU_BED_02', type: 'critical_power', color: '#F59E0B', label: 'ICU 02 UPS Power', speed: 1.8 },
  { from: 'UPS_CRITICAL', to: 'ICU_BED_03', type: 'critical_power', color: '#F59E0B', label: 'ICU 03 UPS Power', speed: 1.8 },
  { from: 'UPS_CRITICAL', to: 'ICU_BED_04', type: 'critical_power', color: '#F59E0B', label: 'ICU 04 UPS Power', speed: 1.8 },
  { from: 'UPS_CRITICAL', to: 'ICU_BED_05', type: 'critical_power', color: '#F59E0B', label: 'ICU 05 UPS Power', speed: 1.8 },
  { from: 'UPS_CRITICAL', to: 'ICU_BED_06', type: 'critical_power', color: '#F59E0B', label: 'ICU 06 UPS Power', speed: 1.8 },
  { from: 'OXYGEN_MANIFOLD', to: 'ICU_BED_01', type: 'medical_gas', color: '#10B981', label: 'ICU 01 O2 Line', speed: 1.2 },
  { from: 'OXYGEN_MANIFOLD', to: 'ICU_BED_02', type: 'medical_gas', color: '#10B981', label: 'ICU 02 O2 Line', speed: 1.2 },
  { from: 'OXYGEN_MANIFOLD', to: 'ICU_BED_05', type: 'medical_gas', color: '#10B981', label: 'ICU 05 Isolation O2', speed: 1.2 },

  // Hospital Conduits -> Level 2 Surgical Theatres & Wards
  { from: 'EMERGENCY_BUS', to: 'OT_SUITE_01', type: 'critical_power', color: '#F59E0B', label: 'OT 1 Essential Power', speed: 1.8 },
  { from: 'EMERGENCY_BUS', to: 'OT_SUITE_02', type: 'critical_power', color: '#F59E0B', label: 'OT 2 Essential Power', speed: 1.8 },
  { from: 'OXYGEN_MANIFOLD', to: 'OT_SUITE_01', type: 'medical_gas', color: '#10B981', label: 'OT 1 Anesthesia O2', speed: 1.2 },
  { from: 'OXYGEN_MANIFOLD', to: 'OT_SUITE_02', type: 'medical_gas', color: '#10B981', label: 'OT 2 Anesthesia O2', speed: 1.2 },
  { from: 'MAIN_BUS', to: 'WARD_ROOM_101', type: 'power', color: '#38BDF8', label: 'Ward 101 Power', speed: 1.4 },
  { from: 'MAIN_BUS', to: 'WARD_ROOM_102', type: 'power', color: '#38BDF8', label: 'Ward 102 Power', speed: 1.4 },

  // Hospital Conduits -> Level 1 Emergency Trauma & Admin
  { from: 'EMERGENCY_BUS', to: 'ED_BAY_01', type: 'critical_power', color: '#F59E0B', label: 'ED Trauma 1 Power', speed: 1.8 },
  { from: 'EMERGENCY_BUS', to: 'ED_BAY_02', type: 'critical_power', color: '#F59E0B', label: 'ED Trauma 2 Power', speed: 1.8 },
  { from: 'OXYGEN_MANIFOLD', to: 'ED_BAY_01', type: 'medical_gas', color: '#10B981', label: 'ED 01 O2 Line', speed: 1.2 },
  { from: 'MAIN_BUS', to: 'ADMIN_OPS', type: 'power', color: '#38BDF8', label: 'Admin Command Power', speed: 1.4 }
]

/**
 * Camera View Angle Presets & Drone Fly-Around Orbit
 */
export const CAMERA_PRESETS = {
  isometric: {
    name: 'Overview (Campus 3D)',
    position: [2, 22, 26],
    target: [2.0, 3.5, 0]
  },
  floor_3: {
    name: 'Level 3: ICU Wing (Beds 1–6)',
    position: [-0.5, 14, 12],
    target: [-0.5, 7.2, 0]
  },
  floor_2: {
    name: 'Level 2: Surgical OT & Wards',
    position: [-1, 10, 11],
    target: [-0.5, 3.6, 0]
  },
  floor_1: {
    name: 'Level 1: Emergency & Admin',
    position: [-2, 7.5, 10],
    target: [-1.0, 0.0, 0]
  },
  floor_0: {
    name: 'Level 0: Plant & Utilities',
    position: [15, 8.5, 11],
    target: [11.5, 0.0, 0]
  },
  cinematic_side: {
    name: 'Cinematic Low Angle',
    position: [-14, 8, 16],
    target: [2.0, 4.0, 0]
  },
  topdown: {
    name: 'Architectural Blueprint Plan',
    position: [2.0, 32, 0.001],
    target: [2.0, 0, 0]
  }
}
