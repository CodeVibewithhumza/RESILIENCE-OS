/**
 * ResilienceOS — Canonical Deterministic Initial Mock Data
 * Strictly aligned with backend schemas:
 * - models/infrastructure.py (InfrastructureAsset, AssetType, OperationalStatus)
 * - models/service.py (HospitalService, ServiceType, ServiceStatus)
 * - models/resilience.py (ResilienceIndexBreakdown, SubScores)
 * - models/incident.py (IncidentState, TimelineEvent, FailureInjectionRequest)
 * - models/strategy.py (StrategyResult, WhatIfComparison, StrategyType)
 * - models/telemetry.py (HospitalTelemetrySnapshot)
 * - simulation/explanation_engine.py (CausalExplanationEngine)
 */

export const INITIAL_ASSETS = [
  {
    id: "GRID_MAIN",
    name: "City Utility 11kV Grid Feed",
    type: "grid",
    location: "Substation / Utility Yard",
    floor: 0,
    nominal_capacity: 1200.0,
    available_capacity: 1200.0,
    current_load: 750.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { voltage_v: 11000 }
  },
  {
    id: "TRANSFORMER_01",
    name: "Main Distribution Transformer T1",
    type: "transformer",
    location: "Substation Room A",
    floor: 0,
    nominal_capacity: 800.0,
    available_capacity: 800.0,
    current_load: 430.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 98.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 48.5,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { role: "Feeds Main Switchboard" }
  },
  {
    id: "TRANSFORMER_02",
    name: "Emergency Transformer T2",
    type: "transformer",
    location: "Substation Room B",
    floor: 0,
    nominal_capacity: 800.0,
    available_capacity: 800.0,
    current_load: 320.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 99.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 42.0,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { role: "Feeds Emergency Switchboard" }
  },
  {
    id: "MAIN_BUS",
    name: "Main Switchboard (MSB)",
    type: "main_bus",
    location: "Main Electrical Switchroom",
    floor: 0,
    nominal_capacity: 1000.0,
    available_capacity: 1000.0,
    current_load: 430.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { bus_type: "General Services" }
  },
  {
    id: "EMERGENCY_BUS",
    name: "Emergency Switchboard (ESB)",
    type: "emergency_bus",
    location: "Emergency Electrical Switchroom",
    floor: 0,
    nominal_capacity: 600.0,
    available_capacity: 600.0,
    current_load: 320.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { bus_type: "Essential Life-Safety" }
  },
  {
    id: "GEN_01",
    name: "Primary Diesel Generator 1",
    type: "generator",
    location: "Generator Bay 1",
    floor: 0,
    nominal_capacity: 750.0,
    available_capacity: 750.0,
    current_load: 0.0,
    capacity_unit: "kW",
    status: "offline",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: 95.0,
    battery_level_pct: null,
    temperature_c: 24.0,
    pressure_psi: null,
    runtime_remaining_min: 720.0,
    metadata: { rating_kva: 750, warmup_seconds: 10 }
  },
  {
    id: "GEN_02",
    name: "Auxiliary Diesel Generator 2",
    type: "generator",
    location: "Generator Bay 2",
    floor: 0,
    nominal_capacity: 500.0,
    available_capacity: 500.0,
    current_load: 0.0,
    capacity_unit: "kW",
    status: "offline",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: 90.0,
    battery_level_pct: null,
    temperature_c: 23.5,
    pressure_psi: null,
    runtime_remaining_min: 600.0,
    metadata: { rating_kva: 500, warmup_seconds: 15 }
  },
  {
    id: "UPS_CRITICAL",
    name: "Static Double-Conversion UPS",
    type: "ups",
    location: "Central UPS / Battery Room",
    floor: 0,
    nominal_capacity: 250.0,
    available_capacity: 250.0,
    current_load: 120.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: 100.0,
    temperature_c: 21.0,
    pressure_psi: null,
    runtime_remaining_min: 45.0,
    metadata: { battery_type: "VRLA AGM Bank", autotransfer_ms: 0 }
  },
  {
    id: "CHILLER_PLANT",
    name: "HVAC Chiller & AHU Plant",
    type: "chiller_hvac",
    location: "HVAC Plant Roof Deck",
    floor: 4,
    nominal_capacity: 400.0,
    available_capacity: 400.0,
    current_load: 280.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 96.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 7.2,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { chilled_water_temp_c: 7.2, ambient_rating_c: 42.0 }
  },
  {
    id: "OXYGEN_MANIFOLD",
    name: "Central Liquid Oxygen Tank & Header",
    type: "oxygen_system",
    location: "Cryogenic Gas Yard",
    floor: 0,
    nominal_capacity: 100.0,
    available_capacity: 100.0,
    current_load: 45.0,
    capacity_unit: "PSI",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: 55.0,
    runtime_remaining_min: 4320.0,
    metadata: { reserve_hours: 72.0, tank_level_pct: 89.0 }
  },
  {
    id: "WATER_PUMP_STATION",
    name: "Potable & Booster Water Pumps",
    type: "water_pump",
    location: "Utility Pump Basement",
    floor: 0,
    nominal_capacity: 100.0,
    available_capacity: 100.0,
    current_load: 35.0,
    capacity_unit: "PSI",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: 60.0,
    runtime_remaining_min: null,
    metadata: { storage_tank_level_pct: 88.0 }
  },
  // --- CLINICAL HOSPITAL ASSETS (Master Documentation Part V & XXVII) ---
  {
    id: "ICU_BED_01",
    name: "ICU Bed Pod 01 — Cardiac Care",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 5.0,
    available_capacity: 5.0,
    current_load: 3.2,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.2,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-8821",
      ventilator_active: true,
      spo2_pct: 98,
      heart_rate_bpm: 74,
      infusion_pumps_active: 3,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_BED_02",
    name: "ICU Bed Pod 02 — Neuro Intensive Care",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 5.0,
    available_capacity: 5.0,
    current_load: 3.5,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.0,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-9043",
      ventilator_active: true,
      spo2_pct: 97,
      heart_rate_bpm: 82,
      infusion_pumps_active: 4,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_BED_03",
    name: "ICU Bed Pod 03 — Trauma Resuscitation",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 5.0,
    available_capacity: 5.0,
    current_load: 3.1,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.5,
    pressure_psi: 54.8,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-7712",
      ventilator_active: true,
      spo2_pct: 99,
      heart_rate_bpm: 68,
      infusion_pumps_active: 2,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_BED_04",
    name: "ICU Bed Pod 04 — Post-Surgical Recovery",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 5.0,
    available_capacity: 5.0,
    current_load: 2.8,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.4,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-6520",
      ventilator_active: false,
      spo2_pct: 96,
      heart_rate_bpm: 78,
      infusion_pumps_active: 2,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_BED_05",
    name: "ICU Bed Pod 05 — Isolation Suite (Negative Pressure)",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 6.0,
    available_capacity: 6.0,
    current_load: 4.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 20.8,
    pressure_psi: 55.2,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-3199",
      ventilator_active: true,
      spo2_pct: 95,
      heart_rate_bpm: 88,
      hepa_differential_pa: -12.5,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_BED_06",
    name: "ICU Bed Pod 06 — High-Dependency Unit",
    type: "icu_bed",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 5.0,
    available_capacity: 5.0,
    current_load: 2.9,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.3,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      patient_id: "PT-4401",
      ventilator_active: false,
      spo2_pct: 98,
      heart_rate_bpm: 72,
      infusion_pumps_active: 3,
      power_feed: "UPS_CRITICAL / ESB",
      gas_feed: "OXYGEN_MANIFOLD"
    }
  },
  {
    id: "ICU_NURSE_STATION",
    name: "ICU Central Telemetry Command Desk",
    type: "nurse_station",
    location: "ICU Wing B, Level 3",
    floor: 3,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 4.2,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.0,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { telemetry_monitors: 8, duty_staff: 6 }
  },
  {
    id: "OT_SUITE_01",
    name: "Operating Theatre 1 — Main Surgical Suite",
    type: "operating_theatre",
    location: "Surgical Wing, Level 2",
    floor: 2,
    nominal_capacity: 25.0,
    available_capacity: 25.0,
    current_load: 16.5,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 19.5,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      case_type: "Emergency Laparotomy",
      surgeon: "Dr. A. Vance",
      anesthesia_machine: "Active",
      surgical_lights_lux: 160000,
      power_feed: "EMERGENCY_BUS / UPS"
    }
  },
  {
    id: "OT_SUITE_02",
    name: "Operating Theatre 2 — Cardiovascular Suite",
    type: "operating_theatre",
    location: "Surgical Wing, Level 2",
    floor: 2,
    nominal_capacity: 30.0,
    available_capacity: 30.0,
    current_load: 18.2,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 19.0,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      case_type: "Coronary Bypass (CABG)",
      surgeon: "Dr. S. Reynolds",
      heart_lung_machine: "Standby Active",
      power_feed: "EMERGENCY_BUS / UPS"
    }
  },
  {
    id: "WARD_ROOM_101",
    name: "Inpatient Ward Room 101",
    type: "ward_room",
    location: "East Wing Wards, Level 2",
    floor: 2,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 4.0,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.5,
    pressure_psi: 50.0,
    runtime_remaining_min: null,
    metadata: { beds_occupied: 2, total_beds: 2 }
  },
  {
    id: "WARD_ROOM_102",
    name: "Inpatient Ward Room 102",
    type: "ward_room",
    location: "East Wing Wards, Level 2",
    floor: 2,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 3.8,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.4,
    pressure_psi: 50.0,
    runtime_remaining_min: null,
    metadata: { beds_occupied: 2, total_beds: 2 }
  },
  {
    id: "WARD_ROOM_103",
    name: "Inpatient Ward Room 103",
    type: "ward_room",
    location: "East Wing Wards, Level 2",
    floor: 2,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 4.1,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.6,
    pressure_psi: 50.0,
    runtime_remaining_min: null,
    metadata: { beds_occupied: 2, total_beds: 2 }
  },
  {
    id: "WARD_ROOM_104",
    name: "Inpatient Ward Room 104",
    type: "ward_room",
    location: "East Wing Wards, Level 2",
    floor: 2,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 3.9,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.5,
    pressure_psi: 50.0,
    runtime_remaining_min: null,
    metadata: { beds_occupied: 1, total_beds: 2 }
  },
  {
    id: "WARD_NURSE_STATION",
    name: "Ward Level 2 Nurse Station",
    type: "nurse_station",
    location: "East Wing Wards, Level 2",
    floor: 2,
    nominal_capacity: 6.0,
    available_capacity: 6.0,
    current_load: 3.1,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.2,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { call_bells_active: 0 }
  },
  {
    id: "ED_BAY_01",
    name: "Emergency Trauma Bay 01 (Resuscitation)",
    type: "emergency_bay",
    location: "Emergency Trauma Ground Level",
    floor: 1,
    nominal_capacity: 12.0,
    available_capacity: 12.0,
    current_load: 6.5,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.8,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: {
      triage_level: "Level 1 Resuscitation",
      defibrillator_status: "Armed & Ready",
      oxygen_flow_lpm: 15
    }
  },
  {
    id: "ED_BAY_02",
    name: "Emergency Trauma Bay 02",
    type: "emergency_bay",
    location: "Emergency Trauma Ground Level",
    floor: 1,
    nominal_capacity: 10.0,
    available_capacity: 10.0,
    current_load: 5.2,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 21.9,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: { triage_level: "Level 2 Emergent", oxygen_flow_lpm: 10 }
  },
  {
    id: "ED_BAY_03",
    name: "Emergency Acute Bay 03",
    type: "emergency_bay",
    location: "Emergency Trauma Ground Level",
    floor: 1,
    nominal_capacity: 10.0,
    available_capacity: 10.0,
    current_load: 4.8,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.0,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: { triage_level: "Level 3 Urgent" }
  },
  {
    id: "ED_BAY_04",
    name: "Emergency Triage Assessment Bay 04",
    type: "emergency_bay",
    location: "Emergency Ground Level",
    floor: 1,
    nominal_capacity: 8.0,
    available_capacity: 8.0,
    current_load: 3.5,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 2,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 22.1,
    pressure_psi: 55.0,
    runtime_remaining_min: null,
    metadata: { triage_intake_rate: "8 pts/hr" }
  },
  {
    id: "AMBULANCE_INTAKE",
    name: "Ambulance Intake & Decontamination Bay",
    type: "ambulance_bay",
    location: "Ground Level Emergency Port",
    floor: 1,
    nominal_capacity: 6.0,
    available_capacity: 6.0,
    current_load: 2.2,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: null,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { ambulance_bays_open: 3 }
  },
  {
    id: "ADMIN_OPS",
    name: "Hospital Operations & Incident Command",
    type: "admin_hub",
    location: "Administration Wing, Level 1",
    floor: 1,
    nominal_capacity: 20.0,
    available_capacity: 20.0,
    current_load: 11.4,
    capacity_unit: "kW",
    status: "normal",
    health_score: 100.0,
    redundancy_level: 1,
    fuel_level_pct: null,
    battery_level_pct: null,
    temperature_c: 23.0,
    pressure_psi: null,
    runtime_remaining_min: null,
    metadata: { active_consoles: 12, telecom_status: "Online" }
  }
];

export const INITIAL_SERVICES = [
  {
    id: "SERVICE_ICU",
    name: "Intensive Care Unit (ICU)",
    type: "icu",
    location: "Wing B, Level 3",
    floor: 3,
    criticality: 5,
    min_required_capacity_pct: 80.0,
    status: "full_operation",
    service_continuity_pct: 100.0,
    estimated_active_patients: 24,
    required_power_kw: 150.0,
    requires_hvac_cooling: true,
    requires_medical_gas: true,
    requires_pressurized_water: true,
    at_risk: false,
    risk_reason: null,
    backup_priority: 1,
    metadata: { ventilated_patients: 18 }
  },
  {
    id: "SERVICE_OT",
    name: "Operating Theatres (OT 1-4)",
    type: "operating_theatre",
    location: "Surgical Wing, Level 2",
    floor: 2,
    criticality: 5,
    min_required_capacity_pct: 85.0,
    status: "full_operation",
    service_continuity_pct: 100.0,
    estimated_active_patients: 12,
    required_power_kw: 180.0,
    requires_hvac_cooling: true,
    requires_medical_gas: true,
    requires_pressurized_water: true,
    at_risk: false,
    risk_reason: null,
    backup_priority: 1,
    metadata: { active_surgeries: 4 }
  },
  {
    id: "SERVICE_ER",
    name: "Emergency Trauma Department",
    type: "emergency_dept",
    location: "Ground Level Triage",
    floor: 1,
    criticality: 5,
    min_required_capacity_pct: 75.0,
    status: "full_operation",
    service_continuity_pct: 100.0,
    estimated_active_patients: 32,
    required_power_kw: 120.0,
    requires_hvac_cooling: true,
    requires_medical_gas: true,
    requires_pressurized_water: true,
    at_risk: false,
    risk_reason: null,
    backup_priority: 1,
    metadata: { triage_bays_active: 8 }
  },
  {
    id: "SERVICE_WARD",
    name: "General Inpatient Wards (A & B)",
    type: "general_ward",
    location: "East Wing, Level 2",
    floor: 2,
    criticality: 3,
    min_required_capacity_pct: 60.0,
    status: "full_operation",
    service_continuity_pct: 100.0,
    estimated_active_patients: 94,
    required_power_kw: 220.0,
    requires_hvac_cooling: true,
    requires_medical_gas: false,
    requires_pressurized_water: true,
    at_risk: false,
    risk_reason: null,
    backup_priority: 3,
    metadata: { total_beds: 120 }
  },
  {
    id: "SERVICE_ADMIN",
    name: "Administrative & Facilities",
    type: "admin_facility",
    location: "Administration Tower, Level 1",
    floor: 1,
    criticality: 1,
    min_required_capacity_pct: 40.0,
    status: "full_operation",
    service_continuity_pct: 100.0,
    estimated_active_patients: 0,
    required_power_kw: 80.0,
    requires_hvac_cooling: true,
    requires_medical_gas: false,
    requires_pressurized_water: false,
    at_risk: false,
    risk_reason: null,
    backup_priority: 5,
    metadata: { workstation_count: 65 }
  }
];

export const INITIAL_RESILIENCE = {
  overall_score: 94.5,
  status_label: "OPTIMAL",
  status_color: "#10B981",
  delta_from_baseline: 0.0,
  sub_scores: {
    service_continuity: 100.0,
    backup_margin: 92.5,
    stability_factor: 100.0,
    recovery_readiness: 85.0
  },
  weights: {
    service_continuity: 0.40,
    backup_margin: 0.25,
    stability_factor: 0.20,
    recovery_readiness: 0.15
  }
};

export const DISRUPTED_RESILIENCE = {
  overall_score: 48.2,
  status_label: "CRITICAL",
  status_color: "#EF4444",
  delta_from_baseline: -46.3,
  sub_scores: {
    service_continuity: 62.4,
    backup_margin: 38.0,
    stability_factor: 40.0,
    recovery_readiness: 52.0
  },
  weights: {
    service_continuity: 0.40,
    backup_margin: 0.25,
    stability_factor: 0.20,
    recovery_readiness: 0.15
  }
};

export const INITIAL_INCIDENT_STATE = {
  incident_id: "INC-GRID_MAIN-01",
  is_active: false,
  source_asset_id: "GRID_MAIN",
  severity: "high",
  current_time_offset_min: 0,
  affected_asset_ids: [
    "GRID_MAIN",
    "TRANSFORMER_01",
    "TRANSFORMER_02",
    "MAIN_BUS",
    "EMERGENCY_BUS",
    "UPS_CRITICAL",
    "GEN_01",
    "CHILLER_PLANT"
  ],
  affected_service_ids: [
    "SERVICE_ADMIN",
    "SERVICE_WARD",
    "SERVICE_ICU",
    "SERVICE_OT",
    "SERVICE_ER"
  ],
  estimated_unmitigated_blackout_min: 20.0,
  active_mitigation_strategy: null
};

export const ACTIVE_INCIDENT_STATE = {
  incident_id: "INC-GRID_MAIN-01",
  is_active: true,
  source_asset_id: "GRID_MAIN",
  severity: "high",
  current_time_offset_min: 0,
  affected_asset_ids: [
    "GRID_MAIN",
    "TRANSFORMER_01",
    "TRANSFORMER_02",
    "MAIN_BUS",
    "EMERGENCY_BUS",
    "UPS_CRITICAL",
    "GEN_01",
    "CHILLER_PLANT"
  ],
  affected_service_ids: [
    "SERVICE_ADMIN",
    "SERVICE_WARD",
    "SERVICE_ICU",
    "SERVICE_OT",
    "SERVICE_ER"
  ],
  estimated_unmitigated_blackout_min: 20.0,
  active_mitigation_strategy: null
};

export const DISRUPTED_ASSETS = INITIAL_ASSETS.map((asset) => {
  if (asset.id === "GRID_MAIN") {
    return { ...asset, status: "failed", available_capacity: 0.0, current_load: 0.0, health_score: 0.0 };
  }
  if (asset.id === "TRANSFORMER_01" || asset.id === "TRANSFORMER_02") {
    return { ...asset, status: "failed", available_capacity: 0.0, current_load: 0.0, health_score: 0.0 };
  }
  if (asset.id === "MAIN_BUS") {
    return { ...asset, status: "degraded", available_capacity: 200.0, current_load: 200.0, health_score: 50.0 };
  }
  if (asset.id === "EMERGENCY_BUS") {
    return { ...asset, status: "degraded", available_capacity: 450.0, current_load: 410.0, health_score: 75.0 };
  }
  if (asset.id === "UPS_CRITICAL") {
    return { ...asset, status: "normal", current_load: 220.0, runtime_remaining_min: 35.0, battery_level_pct: 78.0 };
  }
  if (asset.id === "GEN_01") {
    return { ...asset, status: "starting", current_load: 0.0, health_score: 100.0 };
  }
  if (asset.id === "CHILLER_PLANT") {
    return { ...asset, status: "degraded", current_load: 120.0, health_score: 65.0, temperature_c: 12.5 };
  }
  return asset;
});

export const DISRUPTED_SERVICES = INITIAL_SERVICES.map((svc) => {
  if (svc.id === "SERVICE_ADMIN") {
    return {
      ...svc,
      status: "compromised",
      service_continuity_pct: 10.0,
      at_risk: true,
      risk_reason: "Loss of Main Bus electrical supply"
    };
  }
  if (svc.id === "SERVICE_WARD") {
    return {
      ...svc,
      status: "reduced_capacity",
      service_continuity_pct: 40.0,
      at_risk: true,
      risk_reason: "Main bus curtailment; HVAC degraded"
    };
  }
  if (svc.id === "SERVICE_ICU") {
    return {
      ...svc,
      status: "full_operation",
      service_continuity_pct: 95.0,
      at_risk: true,
      risk_reason: "Running on UPS battery reserve (~35 min remaining before blackout)"
    };
  }
  if (svc.id === "SERVICE_OT") {
    return {
      ...svc,
      status: "critical_only",
      service_continuity_pct: 85.0,
      at_risk: true,
      risk_reason: "HVAC chiller capacity dropping; non-critical surgeries paused"
    };
  }
  if (svc.id === "SERVICE_ER") {
    return {
      ...svc,
      status: "full_operation",
      service_continuity_pct: 90.0,
      at_risk: true,
      risk_reason: "Operating on emergency bus"
    };
  }
  return svc;
});

export const CASCADE_TIMELINE = [
  {
    t_offset_min: 0,
    title: "Primary Failure Detected",
    description: "Outage triggered on GRID_MAIN. ATS transfer initiated to battery UPS.",
    affected_node_ids: ["GRID_MAIN", "MAIN_BUS", "EMERGENCY_BUS", "UPS_CRITICAL"],
    system_resilience_score: 68.5,
    service_impact_summary: "ICU & OT on battery power; Admin dropped; Wards running at 40%."
  },
  {
    t_offset_min: 5,
    title: "Generator Transfer & Thermal Rise",
    description: "GEN-01 online. Chiller plant running at 40% capacity. OT ambient temperature rising +1.8°C.",
    affected_node_ids: ["GEN_01", "CHILLER_PLANT", "SERVICE_OT"],
    system_resilience_score: 58.0,
    service_impact_summary: "Elective surgeries halted in OT. ICU environmental cooling strained."
  },
  {
    t_offset_min: 10,
    title: "Secondary Bus Overload Warning",
    description: "Emergency bus load reaches 92% capacity. Fuel burn rate: 85 L/hr.",
    affected_node_ids: ["EMERGENCY_BUS", "GEN_01"],
    system_resilience_score: 46.5,
    service_impact_summary: "Operating theatre chiller cutoff imminent without load shedding."
  },
  {
    t_offset_min: 20,
    title: "Critical Reserve Boundary",
    description: "Unmitigated battery reserve depleted. Generator fuel margin down to 45 mins. Cascading blackout imminent.",
    affected_node_ids: ["UPS_CRITICAL", "SERVICE_ICU", "SERVICE_OT", "SERVICE_ER"],
    system_resilience_score: 28.0,
    service_impact_summary: "Simulated reserve reaches the configured threshold for ICU-supporting infrastructure; human decision-support review is recommended."
  }
];

export const WHAT_IF_STRATEGIES = [
  {
    strategy_id: "strat_c",
    strategy_name: "Dynamic Rebalance + HVAC Throttle",
    strategy_code: "Strategy C",
    projected_resilience_score: 86.4,
    resilience_breakdown: {
      overall_score: 86.4,
      status_label: "OPTIMAL",
      status_color: "#10B981",
      sub_scores: {
        service_continuity: 96.0,
        backup_margin: 82.0,
        stability_factor: 85.0,
        recovery_readiness: 78.0
      }
    },
    icu_continuity_pct: 100.0,
    emergency_continuity_pct: 100.0,
    operating_theatre_continuity_pct: 95.0,
    general_ward_continuity_pct: 60.0,
    backup_runtime_remaining_hours: 6.2,
    non_critical_load_shed_kw: 240.0,
    estimated_recovery_time_min: 25.0,
    pros: [
      "Preserves 100% ICU & Emergency continuity",
      "Extends generator fuel runtime to 6.2 hours",
      "Maintains ward habitability via partial HVAC duty cycle"
    ],
    cons: [
      "Minor temperature drift (+1.5°C) in non-critical administrative corridors"
    ],
    risk_level: "Low",
    recommendation_rank: 1,
    is_recommended: true
  },
  {
    strategy_id: "strat_b",
    strategy_name: "Priority ICU Load Shedding",
    strategy_code: "Strategy B",
    projected_resilience_score: 72.5,
    resilience_breakdown: {
      overall_score: 72.5,
      status_label: "STABLE",
      status_color: "#3B82F6",
      sub_scores: {
        service_continuity: 82.0,
        backup_margin: 70.0,
        stability_factor: 68.0,
        recovery_readiness: 65.0
      }
    },
    icu_continuity_pct: 100.0,
    emergency_continuity_pct: 90.0,
    operating_theatre_continuity_pct: 70.0,
    general_ward_continuity_pct: 0.0,
    backup_runtime_remaining_hours: 4.8,
    non_critical_load_shed_kw: 430.0,
    estimated_recovery_time_min: 45.0,
    pros: [
      "Guarantees 100% ICU power",
      "Rapid automated execution (<1 min)"
    ],
    cons: [
      "Severe disruption to general wards (total blackout)",
      "Non-emergency surgeries aborted"
    ],
    risk_level: "Medium",
    recommendation_rank: 2,
    is_recommended: false
  },
  {
    strategy_id: "strat_d",
    strategy_name: "Mobile Auxiliary Generator Dispatch",
    strategy_code: "Strategy D",
    projected_resilience_score: 68.0,
    resilience_breakdown: {
      overall_score: 68.0,
      status_label: "DEGRADED",
      status_color: "#F59E0B",
      sub_scores: {
        service_continuity: 76.0,
        backup_margin: 78.0,
        stability_factor: 60.0,
        recovery_readiness: 50.0
      }
    },
    icu_continuity_pct: 100.0,
    emergency_continuity_pct: 85.0,
    operating_theatre_continuity_pct: 80.0,
    general_ward_continuity_pct: 50.0,
    backup_runtime_remaining_hours: 8.0,
    non_critical_load_shed_kw: 100.0,
    estimated_recovery_time_min: 60.0,
    pros: [
      "Adds 500kW supplemental off-grid generation",
      "High ultimate runtime (8+ hours)"
    ],
    cons: [
      "45-60 minute physical deployment & cable hookup latency",
      "Traffic and logistics dependency"
    ],
    risk_level: "Medium",
    recommendation_rank: 3,
    is_recommended: false
  },
  {
    strategy_id: "strat_e",
    strategy_name: "Medical Gas & O2 Conservation",
    strategy_code: "Strategy E",
    projected_resilience_score: 64.0,
    resilience_breakdown: {
      overall_score: 64.0,
      status_label: "DEGRADED",
      status_color: "#F59E0B",
      sub_scores: {
        service_continuity: 70.0,
        backup_margin: 62.0,
        stability_factor: 64.0,
        recovery_readiness: 58.0
      }
    },
    icu_continuity_pct: 90.0,
    emergency_continuity_pct: 80.0,
    operating_theatre_continuity_pct: 60.0,
    general_ward_continuity_pct: 40.0,
    backup_runtime_remaining_hours: 3.5,
    non_critical_load_shed_kw: 180.0,
    estimated_recovery_time_min: 40.0,
    pros: [
      "Conserves header line pressure above 45 PSI",
      "Protects critical ventilator supply"
    ],
    cons: [
      "Elective surgical procedures cancelled",
      "Requires manual valve manifold operations"
    ],
    risk_level: "Medium",
    recommendation_rank: 4,
    is_recommended: false
  },
  {
    strategy_id: "strat_f",
    strategy_name: "Partial Ward Evacuation Protocol",
    strategy_code: "Strategy F",
    projected_resilience_score: 51.0,
    resilience_breakdown: {
      overall_score: 51.0,
      status_label: "DEGRADED",
      status_color: "#F59E0B",
      sub_scores: {
        service_continuity: 55.0,
        backup_margin: 58.0,
        stability_factor: 48.0,
        recovery_readiness: 40.0
      }
    },
    icu_continuity_pct: 95.0,
    emergency_continuity_pct: 70.0,
    operating_theatre_continuity_pct: 50.0,
    general_ward_continuity_pct: 0.0,
    backup_runtime_remaining_hours: 5.5,
    non_critical_load_shed_kw: 350.0,
    estimated_recovery_time_min: 120.0,
    pros: [
      "Reduces hospital occupancy by 60%",
      "Shrinks required cooling and power envelope"
    ],
    cons: [
      "High clinical transit risk for recovering patients",
      "Severe emergency transport strain"
    ],
    risk_level: "High",
    recommendation_rank: 5,
    is_recommended: false
  },
  {
    strategy_id: "strat_a",
    strategy_name: "Baseline / Unmitigated Trajectory",
    strategy_code: "Strategy A",
    projected_resilience_score: 28.0,
    resilience_breakdown: {
      overall_score: 28.0,
      status_label: "CRITICAL",
      status_color: "#EF4444",
      sub_scores: {
        service_continuity: 35.0,
        backup_margin: 18.0,
        stability_factor: 25.0,
        recovery_readiness: 30.0
      }
    },
    icu_continuity_pct: 65.0,
    emergency_continuity_pct: 60.0,
    operating_theatre_continuity_pct: 40.0,
    general_ward_continuity_pct: 10.0,
    backup_runtime_remaining_hours: 0.4,
    non_critical_load_shed_kw: 0.0,
    estimated_recovery_time_min: 180.0,
    pros: [
      "Zero operator configuration delay"
    ],
    cons: [
      "High risk of catastrophic ICU blackout in <30 minutes",
      "Battery exhaustion imminent"
    ],
    risk_level: "Critical",
    recommendation_rank: 6,
    is_recommended: false
  }
];

export const CAUSAL_EXPLANATION_DATA = {
  SERVICE_ICU: {
    service_id: "SERVICE_ICU",
    service_name: "Intensive Care Unit (ICU)",
    failed_asset_id: "GRID_MAIN",
    failed_asset_name: "City Utility 11kV Grid Feed",
    dependency_path: ["GRID_MAIN", "TRANSFORMER_02", "EMERGENCY_BUS", "SERVICE_ICU"],
    causal_steps: [
      "City Utility Grid stopped supplying 11kV primary power to Emergency Transformer T2.",
      "Emergency Transformer T2 ceased feeding Essential Life-Safety Bus (ESB).",
      "Emergency Bus is drawing solely from Static Battery UPS; runtime decaying towards 0 minutes.",
      "ICU 24-bed critical life-support faces complete power loss if battery is exhausted without generator support."
    ],
    summary: "Intensive Care Unit (ICU) is at risk because upstream failure of City Utility Grid propagated across 3 dependency layers: City Utility Grid ➔ Transformer T2 ➔ Emergency Bus ➔ ICU."
  },
  SERVICE_OT: {
    service_id: "SERVICE_OT",
    service_name: "Operating Theatres (OT 1-4)",
    failed_asset_id: "GRID_MAIN",
    failed_asset_name: "City Utility 11kV Grid Feed",
    dependency_path: ["GRID_MAIN", "TRANSFORMER_01", "MAIN_BUS", "CHILLER_PLANT", "SERVICE_OT"],
    causal_steps: [
      "City Utility Grid stopped supplying power to Main Distribution Transformer T1.",
      "Main Switchboard (MSB) voltage dropped, throttling Chiller Plant cooling output to 40%.",
      "Chiller Plant unable to maintain surgical climate control standards in OT Suites 1-4.",
      "Ambient operating theatre temperature rising +1.8°C above sterility safety threshold."
    ],
    summary: "Operating Theatres are compromised via cascading thermal failure: Grid ➔ Transformer T1 ➔ Main Bus ➔ Chiller Plant ➔ Operating Theatres."
  },
  strategy_recommendation: {
    recommended_strategy: "Strategy C",
    strategy_name: "Dynamic Rebalance + HVAC Throttle",
    decision_factors: [
      "Preserves 100% of critical life-support services (ICU & Emergency Department).",
      "Protects surgical suite stability in Operating Theatres (continuity: 95%).",
      "Extends total backup generator & battery runtime to 6.2 hours.",
      "Achieves optimal trade-off by shedding 240 kW of non-critical load (Administrative & corridor cooling) while maintaining ward habitability.",
      "Fastest implementation timeline (<2 minutes via automated BMS switch commands)."
    ],
    summary: "Strategy C (Dynamic Rebalance + HVAC Throttle) is mathematically ranked #1 because it maximizes critical patient safety while minimizing cascading electrical exhaustion."
  }
};

export const INITIAL_TELEMETRY = {
  grid_voltage_v: 415.0,
  grid_frequency_hz: 50.0,
  grid_power_kw: 650.0,
  generator_1_kw: 0.0,
  generator_1_fuel_pct: 95.0,
  generator_2_kw: 0.0,
  generator_2_fuel_pct: 90.0,
  ups_load_kw: 120.0,
  ups_battery_pct: 100.0,
  ups_estimated_runtime_min: 45.0,
  chiller_cooling_output_kw: 300.0,
  chiller_temp_c: 7.2,
  ambient_temp_c: 34.5,
  oxygen_manifold_psi: 55.0,
  oxygen_reserve_hours: 72.0,
  water_pump_pressure_psi: 60.0,
  water_tank_level_pct: 88.0,
  total_hospital_load_kw: 750.0,
  critical_load_kw: 320.0,
  non_critical_load_kw: 430.0
};
