/**
 * 3D Digital Twin Constants and Geometric Definitions
 * Preserves exact asset IDs from frontend/src/mock/hospitalInitialData.js
 */

export const STATUS_COLORS = {
  normal: '#10B981',    // Stable Emerald
  degraded: '#F59E0B',  // Amber Caution
  critical: '#EF4444',  // Coral Alert
  failed: '#DC2626',    // Crimson Failure
  offline: '#4B5563',   // Muted Slate
  starting: '#06B6D4'   // Cyan Transitional
}

export const STATUS_EMISSIVE = {
  normal: '#059669',
  degraded: '#D97706',
  critical: '#DC2626',
  failed: '#991B1B',
  offline: '#1F2937',
  starting: '#0891B2'
}

export const ASSET_TOPOLOGY_DEFS = {
  GRID_MAIN: {
    position: [-8.5, 0, 0],
    category: 'power',
    subsystem: 'Primary Power Feed',
    label: 'GRID_MAIN',
    meshType: 'substation',
    zone: 'Substation Yard'
  },
  TRANSFORMER_01: {
    position: [-4.8, 0, -2.8],
    category: 'power',
    subsystem: 'Substation Step-Down A',
    label: 'TRANSFORMER_01',
    meshType: 'transformer',
    zone: 'Substation Yard'
  },
  TRANSFORMER_02: {
    position: [-4.8, 0, 2.8],
    category: 'power',
    subsystem: 'Substation Step-Down B',
    label: 'TRANSFORMER_02',
    meshType: 'transformer',
    zone: 'Substation Yard'
  },
  MAIN_BUS: {
    position: [-0.8, 0, -2.8],
    category: 'switchgear',
    subsystem: 'Main Switchboard (MSB)',
    label: 'MAIN_BUS',
    meshType: 'switchgear',
    zone: 'Switchgear Hall'
  },
  EMERGENCY_BUS: {
    position: [-0.8, 0, 2.8],
    category: 'switchgear',
    subsystem: 'Emergency Switchboard (ESB)',
    label: 'EMERGENCY_BUS',
    meshType: 'switchgear',
    zone: 'Switchgear Hall'
  },
  GEN_01: {
    position: [-0.8, 0, 6.6],
    category: 'generation',
    subsystem: 'Standby Generator 1',
    label: 'GEN_01',
    meshType: 'generator',
    zone: 'Generator Yard'
  },
  GEN_02: {
    position: [-0.8, 0, -6.6],
    category: 'generation',
    subsystem: 'Standby Generator 2',
    label: 'GEN_02',
    meshType: 'generator',
    zone: 'Generator Yard'
  },
  UPS_CRITICAL: {
    position: [2.8, 0, 2.8],
    category: 'generation',
    subsystem: 'Central UPS Battery Bank',
    label: 'UPS_CRITICAL',
    meshType: 'ups',
    zone: 'Switchgear Hall'
  },
  CHILLER_PLANT: {
    position: [6.0, 0, -3.4],
    category: 'mechanical',
    subsystem: 'HVAC Chiller & AHU Plant',
    label: 'CHILLER_PLANT',
    meshType: 'chiller',
    zone: 'Mechanical Plant Deck'
  },
  OXYGEN_MANIFOLD: {
    position: [6.0, 0, 4.0],
    category: 'medical_gas',
    subsystem: 'Medical Cryo-Oxygen Yard',
    label: 'OXYGEN_MANIFOLD',
    meshType: 'oxygen',
    zone: 'Medical Gas Yard'
  },
  WATER_PUMP_STATION: {
    position: [6.0, 0, 0.3],
    category: 'mechanical',
    subsystem: 'Potable & Booster Water',
    label: 'WATER_PUMP_STATION',
    meshType: 'water_pump',
    zone: 'Mechanical Plant Deck'
  }
}

export const DEPENDENCY_CONNECTIONS = [
  { from: 'GRID_MAIN', to: 'TRANSFORMER_01', type: 'high_voltage', color: '#00F0FF', label: '11kV Feed 1' },
  { from: 'GRID_MAIN', to: 'TRANSFORMER_02', type: 'high_voltage', color: '#00F0FF', label: '11kV Feed 2' },
  { from: 'TRANSFORMER_01', to: 'MAIN_BUS', type: 'power', color: '#38BDF8', label: '415V Bus Feed' },
  { from: 'TRANSFORMER_02', to: 'EMERGENCY_BUS', type: 'emergency_power', color: '#F59E0B', label: 'Essential Feed' },
  { from: 'GEN_01', to: 'EMERGENCY_BUS', type: 'generator_backup', color: '#EAB308', label: 'Diesel Gen 1 Link' },
  { from: 'GEN_02', to: 'MAIN_BUS', type: 'generator_backup', color: '#EAB308', label: 'Diesel Gen 2 Link' },
  { from: 'EMERGENCY_BUS', to: 'UPS_CRITICAL', type: 'critical_power', color: '#F59E0B', label: 'UPS Inverter Supply' },
  { from: 'MAIN_BUS', to: 'CHILLER_PLANT', type: 'mechanical_power', color: '#38BDF8', label: 'HVAC Compressor Power' },
  { from: 'UPS_CRITICAL', to: 'OXYGEN_MANIFOLD', type: 'life_safety', color: '#10B981', label: 'Cryo-Heater Power' },
  { from: 'EMERGENCY_BUS', to: 'WATER_PUMP_STATION', type: 'utility_power', color: '#60A5FA', label: 'Booster Pump Power' }
]

export const ZONE_DEFINITIONS = [
  {
    id: 'substation',
    name: '11kV Primary Substation Yard',
    center: [-6.6, -0.05, 0],
    size: [6.5, 7.8],
    color: '#00F0FF',
    accent: '#0284C7'
  },
  {
    id: 'switchgear',
    name: 'Main & Emergency Switchgear Hall',
    center: [0.9, -0.05, 0],
    size: [5.2, 7.8],
    color: '#818CF8',
    accent: '#4F46E5'
  },
  {
    id: 'generation_north',
    name: 'Standby Generator Bay 1',
    center: [-0.8, -0.05, 6.6],
    size: [4.2, 3.4],
    color: '#F59E0B',
    accent: '#D97706'
  },
  {
    id: 'generation_south',
    name: 'Standby Generator Bay 2',
    center: [-0.8, -0.05, -6.6],
    size: [4.2, 3.4],
    color: '#F59E0B',
    accent: '#D97706'
  },
  {
    id: 'mechanical_plant',
    name: 'Mechanical & Cryogenic Life-Safety Wing',
    center: [6.0, -0.05, 0.4],
    size: [4.6, 12.0],
    color: '#10B981',
    accent: '#059669'
  }
]

export const CAMERA_PRESETS = {
  isometric: {
    name: 'Default Isometric',
    position: [0, 15, 18],
    target: [0, 0.5, 0]
  },
  substation: {
    name: 'Primary Substation',
    position: [-10, 8, 8],
    target: [-6.5, 0.8, 0]
  },
  switchgear: {
    name: 'Switchgear & UPS',
    position: [2, 7, 9],
    target: [0.5, 0.6, 0]
  },
  generators: {
    name: 'Generator Bays',
    position: [-2, 9, 12],
    target: [-0.8, 0.8, 5.0]
  },
  mechanical: {
    name: 'Mechanical & Life-Safety',
    position: [11, 8, 5],
    target: [5.8, 0.8, 0.5]
  },
  topdown: {
    name: "Bird's Eye Plan",
    position: [0, 24, 0.001],
    target: [0, 0, 0]
  }
}
