import { useState, useMemo, useEffect } from 'react'
import {
  Zap,
  Droplets,
  Wind,
  Flame,
  AlertTriangle,
  Building,
  ChevronRight,
  ChevronDown,
  Box,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  Check,
  RefreshCw,
  Download,
  Info,
  ArrowRight,
  Activity,
  CheckCircle2
} from 'lucide-react'
import { getSimulationReport } from '../../services/simulationApi'
import './WhatIfView.css'

// Dynamic Scenario Strategy Profiles for each incident type
const SCENARIO_PROFILES = {
  grid: {
    unmitigatedBaselineScore: 24,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Use Backup Generator',
        desc: 'Start DG & isolate grid fault',
        color: 'teal',
        score: 88,
        icu: 100,
        ot: 90,
        er: 100,
        runtime: 6.5,
        loadShed: 150,
        servicesAtRisk: 0,
        affectedAssets: 4,
        timeToImpact: '~2 min',
        isRecommended: true,
        pros: [
          'Automatic transfer switch activates DG1 within 10 seconds',
          'Full uninterrupted power to ICU, Trauma ER, and Surgical OT',
          'Sustains essential ventilation and emergency lighting',
          'Fuel reserve buffer provides 6.5+ hours continuous generation'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'Ward', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 85, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 85, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Priority Load Shedding',
        desc: 'Shed non-clinical wings',
        color: 'blue',
        score: 78,
        icu: 100,
        ot: 70,
        er: 95,
        runtime: 8.5,
        loadShed: 420,
        servicesAtRisk: 1,
        affectedAssets: 8,
        timeToImpact: '~8 min',
        isRecommended: false,
        pros: [
          'Sheds administration, outpatient, and auxiliary lighting',
          'Extends total diesel fuel and UPS battery runtime to 8.5 hours',
          'Protects ICU life-support circuits from voltage sagging',
          'Reduces campus electrical demand by 420 kW'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 70, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 40, degraded: 30, atRisk: 0 },
          { label: 'OPD', normal: 10, degraded: 40, atRisk: 20 },
          { label: 'Lab', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 60, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Switch to Alternate Feeds',
        desc: 'Substation tie-in attempt',
        color: 'orange',
        score: 45,
        icu: 30,
        ot: 20,
        er: 60,
        runtime: 1.0,
        loadShed: 100,
        servicesAtRisk: 3,
        affectedAssets: 14,
        timeToImpact: '~15 min',
        isRecommended: false,
        pros: [
          'Attempts cross-substation 33kV utility tie-in',
          'External regional grid blacked out; limited throughput',
          'Inadequate for sustaining continuous ICU chiller operations',
          'Leaves hospital exposed to second-wave grid trips'
        ],
        bars: [
          { label: 'Emergency', normal: 60, degraded: 20, atRisk: 20 },
          { label: 'ICU', normal: 30, degraded: 40, atRisk: 30 },
          { label: 'OT', normal: 20, degraded: 30, atRisk: 50 },
          { label: 'Ward', normal: 30, degraded: 20, atRisk: 50 },
          { label: 'OPD', normal: 0, degraded: 20, atRisk: 80 },
          { label: 'Lab', normal: 30, degraded: 20, atRisk: 50 },
          { label: 'Radiology', normal: 30, degraded: 20, atRisk: 50 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'UPS Battery Extension',
        desc: 'Inverter conservation mode',
        color: 'purple',
        score: 68,
        icu: 100,
        ot: 50,
        er: 85,
        runtime: 4.5,
        loadShed: 200,
        servicesAtRisk: 1,
        affectedAssets: 6,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Maximizes critical UPS inverter duration',
          'Guarantees zero micro-second transfer blips to ventilators',
          'Requires auxiliary generators for long-duration recovery',
          'Isolates diagnostic imaging from primary battery bank'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 50, degraded: 30, atRisk: 0 },
          { label: 'Ward', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 30, degraded: 20, atRisk: 20 },
          { label: 'Lab', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 60, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Partial Shutdown',
        desc: 'Emergency wing isolation',
        color: 'pink',
        score: 60,
        icu: 85,
        ot: 40,
        er: 80,
        runtime: 5.0,
        loadShed: 350,
        servicesAtRisk: 2,
        affectedAssets: 9,
        timeToImpact: '~6 min',
        isRecommended: false,
        pros: [
          'Immediately locks down elective surgical suites',
          'Cuts non-essential chiller plant load',
          'Causes minor delays in outpatient diagnostics',
          'Stabilizes primary emergency bus'
        ],
        bars: [
          { label: 'Emergency', normal: 80, degraded: 20, atRisk: 0 },
          { label: 'ICU', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'OT', normal: 40, degraded: 30, atRisk: 10 },
          { label: 'Ward', normal: 40, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 10, degraded: 10, atRisk: 30 },
          { label: 'Lab', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 50, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Combined Grid Failover',
        desc: 'DG + selective shedding',
        color: 'cyan',
        score: 84,
        icu: 100,
        ot: 85,
        er: 95,
        runtime: 7.0,
        loadShed: 280,
        servicesAtRisk: 0,
        affectedAssets: 5,
        timeToImpact: '~3 min',
        isRecommended: false,
        pros: [
          'Coordinates DG1 auto-start with 280 kW non-critical load drop',
          'Sustains full OT sterile HVAC and ICU life support',
          'Provides 7.0 hours autonomous operations',
          'Optimized balance of clinical capacity and fuel burn'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'Ward', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 80, degraded: 10, atRisk: 0 }
        ]
      }
    ]
  },

  transformer: {
    unmitigatedBaselineScore: 28,
    recommendedCode: 'C',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Use Backup Generator',
        desc: 'Start DG and isolate fault',
        color: 'teal',
        score: 76,
        icu: 65,
        ot: 48,
        er: 100,
        runtime: 0.4,
        loadShed: 150,
        servicesAtRisk: 2,
        affectedAssets: 12,
        timeToImpact: '~8 min',
        isRecommended: false,
        pros: [
          'Maintains critical services (ICU, Emergency)',
          'Requires manual breaker isolation on Bus 1',
          'DG fuel consumption active while grid power is present',
          'Takes 8 minutes to synchronize'
        ],
        bars: [
          { label: 'Emergency', normal: 70, degraded: 20, atRisk: 10 },
          { label: 'ICU', normal: 65, degraded: 20, atRisk: 15 },
          { label: 'OT', normal: 48, degraded: 20, atRisk: 32 },
          { label: 'Ward', normal: 65, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 70, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 75, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Load Shedding',
        desc: 'Prioritize critical services',
        color: 'blue',
        score: 73,
        icu: 100,
        ot: 78,
        er: 95,
        runtime: 4.8,
        loadShed: 380,
        servicesAtRisk: 1,
        affectedAssets: 10,
        timeToImpact: '~12 min',
        isRecommended: false,
        pros: [
          'Immediate power stabilization for essential wings',
          'Extends UPS reserve runtime to 4.8h',
          'Guarantees uninterrupted ICU life support',
          'Reduces total feeder bus electrical stress'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 50, degraded: 28, atRisk: 0 },
          { label: 'Ward', normal: 40, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 0, degraded: 35, atRisk: 15 },
          { label: 'Lab', normal: 60, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 60, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Switch to Alternate Feeds',
        desc: 'Transfer to Transformer 2',
        color: 'orange',
        score: 92,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 50,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~2 min',
        isRecommended: true,
        pros: [
          'Instant bus-tie closure transfers full load to Transformer 2',
          '100% clinical capacity maintained across all hospital wings',
          'Zero generator fuel burn; utilizes nominal grid power',
          'Operating suites maintain full sterile positive pressure'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 85, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 95, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Use UPS Extension',
        desc: 'Extend UPS runtime',
        color: 'purple',
        score: 68,
        icu: 100,
        ot: 80,
        er: 90,
        runtime: 8.0,
        loadShed: 160,
        servicesAtRisk: 0,
        affectedAssets: 6,
        timeToImpact: '~15 min',
        isRecommended: false,
        pros: [
          'Extends UPS critical reserve buffer to 8 hours',
          'Protects sensitive diagnostic and imaging equipment',
          'Allows controlled transition time for maintenance crew',
          'Low operator intervention complexity'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 80, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 60, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 50, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 70, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 70, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Partial Shutdown',
        desc: 'Controlled service reduction',
        color: 'pink',
        score: 64,
        icu: 90,
        ot: 60,
        er: 85,
        runtime: 3.5,
        loadShed: 220,
        servicesAtRisk: 1,
        affectedAssets: 8,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Rapid isolation of non-essential clinical units',
          'Safeguards central hospital core infrastructure',
          'Reduces auxiliary cooling and water booster demand',
          'Controlled procedure for facility load containment'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 70, degraded: 20, atRisk: 0 },
          { label: 'OT', normal: 30, degraded: 30, atRisk: 0 },
          { label: 'Ward', normal: 45, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 20, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 55, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 55, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Combined Strategy',
        desc: 'Multi-system coordinated',
        color: 'cyan',
        score: 85,
        icu: 100,
        ot: 90,
        er: 95,
        runtime: 6.5,
        loadShed: 180,
        servicesAtRisk: 0,
        affectedAssets: 5,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Coordinated multi-system electrical and HVAC dispatch',
          'Prioritizes critical emergency admissions',
          'Reconfigures secondary utility circuits concurrently',
          'Robust cross-departmental containment framework'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'OT', normal: 40, degraded: 28, atRisk: 0 },
          { label: 'Ward', normal: 50, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 40, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 65, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 65, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  },

  generator: {
    unmitigatedBaselineScore: 32,
    recommendedCode: 'B',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'DG Crank Retry & Air Start',
        desc: 'Attempt emergency restart',
        color: 'teal',
        score: 40,
        icu: 40,
        ot: 20,
        er: 60,
        runtime: 0.5,
        loadShed: 50,
        servicesAtRisk: 3,
        affectedAssets: 11,
        timeToImpact: '~10 min',
        isRecommended: false,
        pros: [
          'Mechanical starter solenoid cycle attempted',
          'High risk of repeated startup stall if fuel line is locked',
          'Leaves critical ICU load dependent on draining UPS',
          'Incurring critical response time delays'
        ],
        bars: [
          { label: 'Emergency', normal: 60, degraded: 20, atRisk: 20 },
          { label: 'ICU', normal: 40, degraded: 30, atRisk: 30 },
          { label: 'OT', normal: 20, degraded: 30, atRisk: 50 },
          { label: 'Ward', normal: 40, degraded: 20, atRisk: 40 },
          { label: 'OPD', normal: 20, degraded: 20, atRisk: 60 },
          { label: 'Lab', normal: 40, degraded: 20, atRisk: 40 },
          { label: 'Radiology', normal: 40, degraded: 20, atRisk: 40 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Aggressive Load Shedding',
        desc: 'Preserve UPS buffer for ICU',
        color: 'blue',
        score: 82,
        icu: 100,
        ot: 80,
        er: 95,
        runtime: 6.0,
        loadShed: 450,
        servicesAtRisk: 0,
        affectedAssets: 7,
        timeToImpact: '~3 min',
        isRecommended: true,
        pros: [
          'Immediately sheds non-critical chiller and lab HVAC',
          'Triples remaining UPS battery runtime from 1.2h to 6.0h',
          'Guarantees 100% life-support continuity in ICU',
          'Buys critical window for mobile emergency generation arrival'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 80, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 50, degraded: 30, atRisk: 0 },
          { label: 'OPD', normal: 20, degraded: 30, atRisk: 20 },
          { label: 'Lab', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 60, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Secondary Grid Tie-in',
        desc: 'Utilize 11kV auxiliary feeder',
        color: 'orange',
        score: 89,
        icu: 100,
        ot: 95,
        er: 100,
        runtime: 12.0,
        loadShed: 80,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Locks in primary and secondary utility feeder synchronization',
          'Restores full campus baseline without generator dependency',
          'Maintains all surgical and diagnostic operations',
          'Requires external grid stability'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 90, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Deep UPS Extension',
        desc: 'Inverter load rationing',
        color: 'purple',
        score: 85,
        icu: 100,
        ot: 85,
        er: 90,
        runtime: 7.5,
        loadShed: 250,
        servicesAtRisk: 0,
        affectedAssets: 5,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Extends critical battery reserve buffer to 7.5 hours',
          'Maintains 100% ICU and NICU ventilator stability',
          'Throttles non-essential monitoring displays',
          'Ensures clean sine-wave power to imaging racks'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'Ward', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 40, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 75, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Surgical Hold Protocol',
        desc: 'Postpone elective OT suites',
        color: 'pink',
        score: 69,
        icu: 90,
        ot: 60,
        er: 85,
        runtime: 5.0,
        loadShed: 320,
        servicesAtRisk: 1,
        affectedAssets: 8,
        timeToImpact: '~6 min',
        isRecommended: false,
        pros: [
          'Suspends non-emergency operations to reduce power draw',
          'Protects ongoing emergency surgical procedures',
          'Reduces HVAC sterile air demand',
          'Controlled load containment protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'ICU', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'OT', normal: 60, degraded: 30, atRisk: 0 },
          { label: 'Ward', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 30, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 65, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 65, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Mobile DG Dispatch',
        desc: 'Deploy 500kVA mobile trailer',
        color: 'cyan',
        score: 80,
        icu: 95,
        ot: 75,
        er: 90,
        runtime: 5.5,
        loadShed: 200,
        servicesAtRisk: 0,
        affectedAssets: 6,
        timeToImpact: '~25 min',
        isRecommended: false,
        pros: [
          'Connects external mobile generator to Essential Bus',
          'Takes 25 minutes for physical hookup and sync',
          'Restores high-capacity emergency generation',
          'Sustains full emergency admissions'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'ICU', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OT', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 65, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 70, degraded: 15, atRisk: 0 }
        ]
      }
    ]
  },

  ups: {
    unmitigatedBaselineScore: 18,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'DG Direct Bus Sync',
        desc: 'Bypass UPS via DG online',
        color: 'teal',
        score: 91,
        icu: 100,
        ot: 95,
        er: 100,
        runtime: 10.0,
        loadShed: 100,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~1 min',
        isRecommended: true,
        pros: [
          'Forces immediate DG1 start to feed Essential Bus directly',
          'Prevents battery collapse before inverter shutdown',
          'Guarantees 100% ventilator and monitor survival',
          'Provides 10 hours continuous electrical headroom'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Lab', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 90, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Inverter Load Shedding',
        desc: 'Disconnect all non-criticals',
        color: 'blue',
        score: 65,
        icu: 70,
        ot: 40,
        er: 80,
        runtime: 1.5,
        loadShed: 280,
        servicesAtRisk: 2,
        affectedAssets: 9,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Drops non-essential inverter sub-circuits',
          'Extends depleted battery life by only 25 minutes',
          'Cannot sustain full operating theatre loads',
          'Requires fast auxiliary generation takeover'
        ],
        bars: [
          { label: 'Emergency', normal: 80, degraded: 20, atRisk: 0 },
          { label: 'ICU', normal: 70, degraded: 20, atRisk: 10 },
          { label: 'OT', normal: 40, degraded: 30, atRisk: 30 },
          { label: 'Ward', normal: 40, degraded: 20, atRisk: 20 },
          { label: 'OPD', normal: 10, degraded: 20, atRisk: 50 },
          { label: 'Lab', normal: 50, degraded: 20, atRisk: 20 },
          { label: 'Radiology', normal: 50, degraded: 20, atRisk: 20 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Bypass to Utility Bus',
        desc: 'Static bypass switch engage',
        color: 'orange',
        score: 88,
        icu: 98,
        ot: 90,
        er: 98,
        runtime: 12.0,
        loadShed: 60,
        servicesAtRisk: 0,
        affectedAssets: 4,
        timeToImpact: '~1 min',
        isRecommended: false,
        pros: [
          'Static bypass switch transfers load to clean utility grid',
          'Restores instantaneous power to critical clinical racks',
          'Eliminates UPS battery drain completely',
          'Leaves equipment temporarily unbuffered against grid spikes'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'OT', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'Lab', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 85, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Aux Battery Bank Coupler',
        desc: 'Tie in secondary DC bank',
        color: 'purple',
        score: 78,
        icu: 95,
        ot: 75,
        er: 90,
        runtime: 3.5,
        loadShed: 140,
        servicesAtRisk: 0,
        affectedAssets: 6,
        timeToImpact: '~3 min',
        isRecommended: false,
        pros: [
          'Connects standby DC battery rack to primary bus',
          'Provides 3.5 hours of emergency runtime buffer',
          'Smooth voltage regulation across medical electronics',
          'Allows controlled startup of backup diesel plant'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'ICU', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OT', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 65, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 75, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Diagnostic Wing Shutdown',
        desc: 'Isolate heavy MRI / CT loads',
        color: 'pink',
        score: 58,
        icu: 75,
        ot: 35,
        er: 70,
        runtime: 2.0,
        loadShed: 200,
        servicesAtRisk: 2,
        affectedAssets: 8,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Isolates high-current diagnostic imaging systems',
          'Protects ventilator circuits from sudden battery trip',
          'Severe reduction in surgical throughput',
          'Temporary emergency stabilization only'
        ],
        bars: [
          { label: 'Emergency', normal: 70, degraded: 20, atRisk: 10 },
          { label: 'ICU', normal: 75, degraded: 15, atRisk: 10 },
          { label: 'OT', normal: 35, degraded: 30, atRisk: 35 },
          { label: 'Ward', normal: 40, degraded: 20, atRisk: 20 },
          { label: 'OPD', normal: 10, degraded: 20, atRisk: 50 },
          { label: 'Lab', normal: 45, degraded: 25, atRisk: 20 },
          { label: 'Radiology', normal: 20, degraded: 30, atRisk: 40 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Coordinated DG & Bus Transfer',
        desc: 'DG sync + load rebalance',
        color: 'cyan',
        score: 94,
        icu: 100,
        ot: 98,
        er: 100,
        runtime: 9.5,
        loadShed: 120,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~2 min',
        isRecommended: false,
        pros: [
          'Simultaneously starts DG1 and opens battery breaker',
          'Seamless transition without clinical equipment reboot',
          'Full 100% capacity restored across ICU, ER, and OT',
          'Optimal multi-system resilience outcome'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'Lab', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 95, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  },

  water: {
    unmitigatedBaselineScore: 35,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Engage Auxiliary Pump 2',
        desc: 'Auto-start standby booster',
        color: 'teal',
        score: 95,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 20,
        servicesAtRisk: 0,
        affectedAssets: 1,
        timeToImpact: '~1 min',
        isRecommended: true,
        pros: [
          'Starts redundant booster pump 2 within 45 seconds',
          'Restores 60 PSI header pressure to surgical scrub & sterilizers',
          'Maintains chiller cooling tower condenser water feed',
          '100% normal clinical operation across all hospital floors'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OPD', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Gravity Reserve Tank Diversion',
        desc: 'Open rooftop header valves',
        color: 'blue',
        score: 80,
        icu: 100,
        ot: 85,
        er: 90,
        runtime: 8.0,
        loadShed: 40,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~3 min',
        isRecommended: false,
        pros: [
          'Gravity feed delivers 35 PSI to critical surgical wings',
          'Provides 8.0 hours of emergency water reserve',
          'Protects autoclave sterilization units',
          'Reduces reliance on booster electrical circuits'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'Ward', normal: 70, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 80, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Municipal Auxiliary Bypass',
        desc: 'Engage city secondary line',
        color: 'orange',
        score: 90,
        icu: 100,
        ot: 95,
        er: 98,
        runtime: 12.0,
        loadShed: 30,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Direct municipal bypass valve opened',
          'Stabilizes supply pressure across all hospital zones',
          'Low mechanical complexity',
          'Full clinical continuity maintained'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 90, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Non-Clinical Water Rationing',
        desc: 'Throttle OPD and gardens',
        color: 'purple',
        score: 72,
        icu: 95,
        ot: 65,
        er: 85,
        runtime: 6.5,
        loadShed: 10,
        servicesAtRisk: 1,
        affectedAssets: 5,
        timeToImpact: '~6 min',
        isRecommended: false,
        pros: [
          'Prioritizes sterile operating suites and hemodialysis',
          'Conserves remaining header volume',
          'Restricts auxiliary cooling bleed-off',
          'Controlled conservation protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'ICU', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OT', normal: 65, degraded: 25, atRisk: 0 },
          { label: 'Ward', normal: 55, degraded: 25, atRisk: 0 },
          { label: 'OPD', normal: 30, degraded: 30, atRisk: 20 },
          { label: 'Lab', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 70, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Chiller Water Recycle Mode',
        desc: 'Closed-loop condenser recirculation',
        color: 'pink',
        score: 76,
        icu: 90,
        ot: 75,
        er: 85,
        runtime: 5.0,
        loadShed: 80,
        servicesAtRisk: 1,
        affectedAssets: 4,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Prevents HVAC chiller trip from water starvation',
          'Protects hospital temperature regulation',
          'Lowers condenser water discharge rate by 60%',
          'Sustains essential surgical air handling'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'ICU', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'OT', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 65, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 50, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Combined Hydro Rebalance',
        desc: 'Pump 2 + gravity header sync',
        color: 'cyan',
        score: 92,
        icu: 100,
        ot: 95,
        er: 98,
        runtime: 10.0,
        loadShed: 35,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~2 min',
        isRecommended: false,
        pros: [
          'Automated pump transfer backed by rooftop gravity buffer',
          'Full hydraulic redundancy across all surgical theatres',
          'Zero interruption to central sterilization',
          'Robust multi-point water defense'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 95, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  },

  hvac: {
    unmitigatedBaselineScore: 30,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Start Backup Chiller Unit 2',
        desc: 'Engage 400-ton auxiliary plant',
        color: 'teal',
        score: 93,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 50,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~3 min',
        isRecommended: true,
        pros: [
          'Restores nominal 7.2°C chilled water supply loop',
          'Protects surgical OT sterile positive air pressure',
          'Prevents thermal runaway in critical data and UPS server rooms',
          '100% normal operations across all inpatient towers'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 90, degraded: 5, atRisk: 0 },
          { label: 'OPD', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 95, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Cross-Connect South Loop',
        desc: 'Tie in South Wing Chiller',
        color: 'blue',
        score: 85,
        icu: 100,
        ot: 88,
        er: 95,
        runtime: 10.0,
        loadShed: 120,
        servicesAtRisk: 0,
        affectedAssets: 4,
        timeToImpact: '~6 min',
        isRecommended: false,
        pros: [
          'Hydraulic crossover valves isolate faulted chiller loop',
          'South wing chiller operates at 90% load to cover critical zones',
          'Maintains ICU thermal comfort and positive pressure in OT 1-4',
          'Controlled load containment protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 88, degraded: 12, atRisk: 0 },
          { label: 'Ward', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 85, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Variable Air Volume (VAV) Throttle',
        desc: 'Modulate AHU cooling flow',
        color: 'orange',
        score: 70,
        icu: 80,
        ot: 60,
        er: 85,
        runtime: 6.0,
        loadShed: 160,
        servicesAtRisk: 1,
        affectedAssets: 6,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Reduces airflow to non-clinical zones to save thermal capacity',
          'Concentrates remaining cooling in ICU and NICU wards',
          'Operating theatres operate under reduced air exchange rates',
          'Stops chiller thermal runaway'
        ],
        bars: [
          { label: 'Emergency', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'ICU', normal: 80, degraded: 20, atRisk: 0 },
          { label: 'OT', normal: 60, degraded: 30, atRisk: 0 },
          { label: 'Ward', normal: 55, degraded: 25, atRisk: 0 },
          { label: 'OPD', normal: 30, degraded: 30, atRisk: 20 },
          { label: 'Lab', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 65, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Spot Cooling Deployment',
        desc: 'Deploy portable mobile AC',
        color: 'purple',
        score: 65,
        icu: 85,
        ot: 45,
        er: 75,
        runtime: 4.0,
        loadShed: 90,
        servicesAtRisk: 2,
        affectedAssets: 7,
        timeToImpact: '~15 min',
        isRecommended: false,
        pros: [
          'Deploys mobile spot coolers to primary server rooms & ICU',
          'Prevents diagnostic imaging shutdowns from overheating',
          'Cannot maintain sterile laminar airflow in OT suites',
          'Short-term mitigation measure'
        ],
        bars: [
          { label: 'Emergency', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'ICU', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'OT', normal: 45, degraded: 30, atRisk: 20 },
          { label: 'Ward', normal: 45, degraded: 25, atRisk: 10 },
          { label: 'OPD', normal: 25, degraded: 25, atRisk: 30 },
          { label: 'Lab', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 60, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Admin Zone HVAC Shutdown',
        desc: 'Isolate towers B & C',
        color: 'pink',
        score: 74,
        icu: 90,
        ot: 70,
        er: 88,
        runtime: 7.0,
        loadShed: 240,
        servicesAtRisk: 1,
        affectedAssets: 5,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Cuts 240 kW of non-clinical thermal cooling load',
          'Reroutes 100% of chilled water loop to core clinical suites',
          'ICU maintains nominal 21°C temperature setting',
          'Standard hospital containment protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 88, degraded: 12, atRisk: 0 },
          { label: 'ICU', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'OT', normal: 70, degraded: 25, atRisk: 0 },
          { label: 'Ward', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 30, degraded: 30, atRisk: 15 },
          { label: 'Lab', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Combined Thermal Rebalance',
        desc: 'Chiller 2 + VAV optimization',
        color: 'cyan',
        score: 89,
        icu: 100,
        ot: 92,
        er: 98,
        runtime: 9.0,
        loadShed: 140,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Brings Chiller 2 online with dynamic VAV airflow balancing',
          'Sustains full positive pressure in all surgical theatres',
          'Prevents electrical and thermal overloads',
          'Highly resilient multi-system response'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 92, degraded: 8, atRisk: 0 },
          { label: 'Ward', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Lab', normal: 90, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 90, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  },

  gas: {
    unmitigatedBaselineScore: 12,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Auto-Switch Cryo O2 Header B',
        desc: 'Engage secondary liquid O2 tank',
        color: 'teal',
        score: 98,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 1,
        timeToImpact: '~30 sec',
        isRecommended: true,
        pros: [
          'Automatic pneumatic manifold switchover to cryogenic tank B',
          'Instantly restores 55 PSI line pressure to ICU ventilators',
          'Zero medical air or oxygen interruption to surgery suites',
          'Provides 12+ hours continuous medical gas supply'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'High-Pressure Cylinder Bank',
        desc: 'Engage 24-cylinder reserve',
        color: 'blue',
        score: 88,
        icu: 100,
        ot: 90,
        er: 95,
        runtime: 6.0,
        loadShed: 10,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~2 min',
        isRecommended: false,
        pros: [
          'Manual/auto manifold coupler opens high-pressure gas reserve',
          'Protects all active ICU patients and emergency trauma bays',
          'Provides 6.0 hours duration before cylinder changeout required',
          'Reliable passive pneumatic defense'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'Ward', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'OPD', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 85, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Pipeline Isolation & Bypass',
        desc: 'Isolate ruptured manifold branch',
        color: 'orange',
        score: 84,
        icu: 95,
        ot: 85,
        er: 95,
        runtime: 8.0,
        loadShed: 20,
        servicesAtRisk: 0,
        affectedAssets: 4,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Sectional valve closes faulted cryogenic line branch',
          'Prevents loss of bulk liquid oxygen inventory',
          'Bypasses gas delivery directly to main hospital riser',
          'Sustains essential emergency flow'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OT', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'Ward', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 80, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 80, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'ICU Concentrator Direct Drive',
        desc: 'Deploy local PSA oxygen generators',
        color: 'purple',
        score: 75,
        icu: 90,
        ot: 60,
        er: 80,
        runtime: 5.0,
        loadShed: 30,
        servicesAtRisk: 1,
        affectedAssets: 5,
        timeToImpact: '~6 min',
        isRecommended: false,
        pros: [
          'Deploys point-of-care oxygen concentrators in ICU beds',
          'Decouples critical ventilators from pipeline pressure',
          'Elective surgeries must be halted',
          'Controlled patient safety protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 80, degraded: 20, atRisk: 0 },
          { label: 'ICU', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'OT', normal: 60, degraded: 30, atRisk: 10 },
          { label: 'Ward', normal: 60, degraded: 20, atRisk: 10 },
          { label: 'OPD', normal: 40, degraded: 30, atRisk: 20 },
          { label: 'Lab', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 70, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Ward Gas Flow Conservation',
        desc: 'Throttle general inpatient lines',
        color: 'pink',
        score: 68,
        icu: 85,
        ot: 50,
        er: 75,
        runtime: 4.0,
        loadShed: 40,
        servicesAtRisk: 2,
        affectedAssets: 6,
        timeToImpact: '~5 min',
        isRecommended: false,
        pros: [
          'Rations non-critical oxygen flow in general wards',
          'Maintains 50 PSI pressure in ICU and emergency trauma',
          'Requires portable cylinder monitoring in recovery units',
          'Temporary emergency containment'
        ],
        bars: [
          { label: 'Emergency', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'ICU', normal: 85, degraded: 15, atRisk: 0 },
          { label: 'OT', normal: 50, degraded: 35, atRisk: 15 },
          { label: 'Ward', normal: 50, degraded: 25, atRisk: 15 },
          { label: 'OPD', normal: 30, degraded: 25, atRisk: 30 },
          { label: 'Lab', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 65, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Coordinated Cryo Protocol',
        desc: 'Header B + cylinder bank sync',
        color: 'cyan',
        score: 92,
        icu: 100,
        ot: 95,
        er: 98,
        runtime: 10.0,
        loadShed: 15,
        servicesAtRisk: 0,
        affectedAssets: 2,
        timeToImpact: '~1 min',
        isRecommended: false,
        pros: [
          'Simultaneously switches to Header B and charges reserve bank',
          'Guarantees 100% medical oxygen & nitrous oxide delivery',
          'Zero clinical disruption in ICU and emergency admissions',
          'Optimal multi-layered medical gas resilience'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 90, degraded: 5, atRisk: 0 },
          { label: 'OPD', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Lab', normal: 95, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 95, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  },

  multiple: {
    unmitigatedBaselineScore: 10,
    recommendedCode: 'B',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Synchronize Dual DG Units',
        desc: 'Parallel DG1 + DG2 on Essential Bus',
        color: 'teal',
        score: 82,
        icu: 95,
        ot: 80,
        er: 95,
        runtime: 4.5,
        loadShed: 280,
        servicesAtRisk: 0,
        affectedAssets: 5,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Brings both diesel generators online in parallel synchronization',
          'Powers critical chillers, medical gas, and ICU life-support',
          'High fuel consumption under 42°C heatwave ambient load',
          'Provides 4.5 hours autonomous capacity'
        ],
        bars: [
          { label: 'Emergency', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'ICU', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'OT', normal: 80, degraded: 15, atRisk: 0 },
          { label: 'Ward', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 40, degraded: 30, atRisk: 10 },
          { label: 'Lab', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 75, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Campus Deep Load Shedding',
        desc: 'Shed OPD & admin to survive heatwave',
        color: 'blue',
        score: 86,
        icu: 100,
        ot: 90,
        er: 98,
        runtime: 7.5,
        loadShed: 520,
        servicesAtRisk: 0,
        affectedAssets: 6,
        timeToImpact: '~5 min',
        isRecommended: true,
        pros: [
          'Sheds 520 kW of non-clinical administrative and diagnostic load',
          'Prevents generator overheating in extreme 42°C heatwave',
          'Guarantees 100% ICU life-support and emergency trauma capability',
          'Extends diesel runtime to 7.5 hours'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'Ward', normal: 55, degraded: 30, atRisk: 0 },
          { label: 'OPD', normal: 10, degraded: 20, atRisk: 40 },
          { label: 'Lab', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'Radiology', normal: 65, degraded: 20, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Thermal & Electrical Reroute',
        desc: 'Cross-tie auxiliary feeders & chillers',
        color: 'orange',
        score: 89,
        icu: 100,
        ot: 92,
        er: 98,
        runtime: 8.0,
        loadShed: 380,
        servicesAtRisk: 0,
        affectedAssets: 4,
        timeToImpact: '~4 min',
        isRecommended: false,
        pros: [
          'Simultaneously transfers electrical tie and chiller water loops',
          'Isolates failed infrastructure without hospital-wide blackouts',
          'Maintains ICU positive pressure and operating theatre HVAC',
          'Robust multi-system containment'
        ],
        bars: [
          { label: 'Emergency', normal: 98, degraded: 2, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 92, degraded: 8, atRisk: 0 },
          { label: 'Ward', normal: 75, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 60, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 85, degraded: 10, atRisk: 0 },
          { label: 'Radiology', normal: 85, degraded: 10, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'Mobile Generator Fleet',
        desc: 'Deploy external 1000kVA units',
        color: 'purple',
        score: 80,
        icu: 90,
        ot: 75,
        er: 90,
        runtime: 5.0,
        loadShed: 200,
        servicesAtRisk: 0,
        affectedAssets: 7,
        timeToImpact: '~30 min',
        isRecommended: false,
        pros: [
          'Calls city emergency mobile generator fleet',
          'Takes 30 minutes for physical cable interconnect',
          'Provides heavy supplemental power during heatwave peak',
          'Reduces strain on stationary emergency units'
        ],
        bars: [
          { label: 'Emergency', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'ICU', normal: 90, degraded: 10, atRisk: 0 },
          { label: 'OT', normal: 75, degraded: 20, atRisk: 0 },
          { label: 'Ward', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'OPD', normal: 45, degraded: 25, atRisk: 10 },
          { label: 'Lab', normal: 70, degraded: 15, atRisk: 0 },
          { label: 'Radiology', normal: 70, degraded: 15, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Controlled Partial Evacuation',
        desc: 'Transfer non-criticals to partner hospital',
        color: 'pink',
        score: 65,
        icu: 70,
        ot: 40,
        er: 65,
        runtime: 3.5,
        loadShed: 450,
        servicesAtRisk: 2,
        affectedAssets: 10,
        timeToImpact: '~20 min',
        isRecommended: false,
        pros: [
          'Evacuates general ward patients to regional health partners',
          'Dramatically reduces building cooling and electrical load',
          'High logistical and transport complexity',
          'Extreme disaster response protocol'
        ],
        bars: [
          { label: 'Emergency', normal: 65, degraded: 25, atRisk: 10 },
          { label: 'ICU', normal: 70, degraded: 20, atRisk: 10 },
          { label: 'OT', normal: 40, degraded: 30, atRisk: 30 },
          { label: 'Ward', normal: 30, degraded: 30, atRisk: 40 },
          { label: 'OPD', normal: 10, degraded: 10, atRisk: 60 },
          { label: 'Lab', normal: 50, degraded: 25, atRisk: 15 },
          { label: 'Radiology', normal: 50, degraded: 25, atRisk: 15 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Coordinated Multi-System Protocol',
        desc: 'Dual DG + Reroute + Load Shed',
        color: 'cyan',
        score: 91,
        icu: 100,
        ot: 95,
        er: 100,
        runtime: 8.5,
        loadShed: 350,
        servicesAtRisk: 0,
        affectedAssets: 3,
        timeToImpact: '~3 min',
        isRecommended: false,
        pros: [
          'Integrates dual DG power, chiller cross-tie, and 350kW load drop',
          'Guarantees 100% ICU life-support and sterile OT air pressure',
          'Extends continuous autonomous operation to 8.5 hours',
          'Highest resilience rating for compound disaster events'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 95, degraded: 5, atRisk: 0 },
          { label: 'Ward', normal: 80, degraded: 15, atRisk: 0 },
          { label: 'OPD', normal: 65, degraded: 20, atRisk: 0 },
          { label: 'Lab', normal: 90, degraded: 5, atRisk: 0 },
          { label: 'Radiology', normal: 90, degraded: 5, atRisk: 0 }
        ]
      }
    ]
  },

  baseline: {
    unmitigatedBaselineScore: 94,
    recommendedCode: 'A',
    strategies: [
      {
        code: 'A',
        id: 'strat_a',
        name: 'Generator Standby Protocol',
        desc: 'Automated failover readiness',
        color: 'teal',
        score: 94,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: true,
        pros: [
          'Hospital operates at 100% nominal capacity on primary grid',
          'Generators DG1 & DG2 tested and standing by on auto-start',
          'UPS battery banks fully charged at 100% reserve (4.8h buffer)',
          'Zero active clinical vulnerabilities'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'B',
        id: 'strat_b',
        name: 'Load Shedding Readiness',
        desc: 'Pre-programmed breaker groups',
        color: 'blue',
        score: 92,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: false,
        pros: [
          'Load shed matrices mapped for emergency dispatch',
          'Non-critical circuits tagged for fast isolation',
          'Prepares infrastructure for sudden utility fluctuations',
          'Nominal operation across all clinical services'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'C',
        id: 'strat_c',
        name: 'Alternate Feed Ready',
        desc: 'Dual-substation live monitoring',
        color: 'orange',
        score: 95,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: false,
        pros: [
          'Secondary 33kV utility feeder energized and synchronized',
          'Instant automatic bus tie transfer ready upon primary loss',
          'Dual transformer redundancy verified',
          'Zero clinical disruption'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'D',
        id: 'strat_d',
        name: 'UPS Health Optimization',
        desc: 'Float charge and cell balance',
        color: 'purple',
        score: 94,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: false,
        pros: [
          'UPS battery cells operating at 100% capacity',
          'Static bypass circuits tested and active',
          'Instant sub-cycle power conditioning across surgical suites',
          'Hospital in full operational readiness'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'E',
        id: 'strat_e',
        name: 'Contingency Containment',
        desc: 'Disaster response protocols',
        color: 'pink',
        score: 90,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: false,
        pros: [
          'Pre-allocated emergency response protocols',
          'Medical gas reserve headers verified at 55 PSI',
          'Chiller plant operating at balanced 7.2°C setpoint',
          'Zero active hospital vulnerabilities'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      },
      {
        code: 'F',
        id: 'strat_f',
        name: 'Integrated Multi-System',
        desc: 'Campus-wide coordinated defense',
        color: 'cyan',
        score: 96,
        icu: 100,
        ot: 100,
        er: 100,
        runtime: 12.0,
        loadShed: 0,
        servicesAtRisk: 0,
        affectedAssets: 0,
        timeToImpact: 'Nominal',
        isRecommended: false,
        pros: [
          'Complete end-to-end multi-system monitoring active',
          'Electrical, water, HVAC, and medical gas headers synchronized',
          'Automated AI resilience failover enabled',
          'Peak baseline performance'
        ],
        bars: [
          { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
          { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
        ]
      }
    ]
  }
}

// Detect incident type key from incident state
function resolveIncidentType(incident, isIncidentActive) {
  if (!isIncidentActive || !incident) return 'baseline'
  if (incident.compound_heatwave) return 'multiple'

  const assetId = (incident.source_asset_id || '').toUpperCase()
  const failType = (incident.failure_type || '').toLowerCase()
  const title = (incident.title || '').toLowerCase()
  const desc = (incident.description || '').toLowerCase()

  if (assetId.includes('GRID') || title.includes('grid') || desc.includes('grid') || failType.includes('grid')) return 'grid'
  if (assetId.includes('TRANSFORMER') || title.includes('transformer') || desc.includes('transformer')) return 'transformer'
  if (assetId.includes('GEN') || title.includes('generator') || desc.includes('generator')) return 'generator'
  if (assetId.includes('UPS') || title.includes('ups') || desc.includes('ups') || title.includes('battery')) return 'ups'
  if (assetId.includes('WATER') || title.includes('water') || failType.includes('pump') || failType.includes('cavitation') || desc.includes('water') || desc.includes('pump')) return 'water'
  if (assetId.includes('CHILLER') || assetId.includes('HVAC') || title.includes('hvac') || title.includes('chiller') || failType.includes('thermal') || desc.includes('cooling') || desc.includes('chiller')) return 'hvac'
  if (assetId.includes('OXYGEN') || assetId.includes('GAS') || title.includes('oxygen') || title.includes('gas') || failType.includes('cryogenic') || desc.includes('pressure') || desc.includes('oxygen')) return 'gas'

  return 'transformer'
}

export default function WhatIfView({
  onSelectStrategy,
  whatIfData = null,
  onRefresh = null,
  onApplyStrategy = null,
  onReset = null,
  isIncidentActive = false,
  incident = {},
  assets = [],
  services = [],
  onNotify
}) {
  const [isExporting, setIsExporting] = useState(false)
  const [isApplied, setIsApplied] = useState(false)
  const [showDeltas, setShowDeltas] = useState(false)
  const [selectedDept, setSelectedDept] = useState('ICU')
  const [metricFilter, setMetricFilter] = useState('all') // 'all' | 'clinical' | 'resources'

  // Resolve scenario profile dynamically based on active incident!
  const currentScenarioKey = useMemo(() => {
    return resolveIncidentType(incident, isIncidentActive)
  }, [incident, isIncidentActive])

  const activeProfile = useMemo(() => {
    return SCENARIO_PROFILES[currentScenarioKey] || SCENARIO_PROFILES.transformer
  }, [currentScenarioKey])

  // Active strategy code: defaults to recommended code for this incident (e.g. C for Transformer, A for Grid/Gas, B for Generator)
  const [activeStrategyCode, setActiveStrategyCode] = useState(() => activeProfile.recommendedCode || 'A')

  // Auto-sync active strategy whenever incident changes
  useEffect(() => {
    const targetCode = activeProfile.recommendedCode || 'A'
    setActiveStrategyCode(targetCode)
    const card = activeProfile.strategies.find((s) => s.code === targetCode)
    if (onSelectStrategy && card) {
      onSelectStrategy(card.id)
    }
  }, [currentScenarioKey, activeProfile, onSelectStrategy])

  // Current strategies list for this specific incident
  const strategyCards = useMemo(() => {
    return activeProfile.strategies
  }, [activeProfile])

  // Get active strategy card object
  const activeStrategy = useMemo(() => {
    return strategyCards.find((s) => s.code === activeStrategyCode) || strategyCards[0]
  }, [strategyCards, activeStrategyCode])

  // Select a strategy card
  const handleSelectStrategy = (code) => {
    setActiveStrategyCode(code)
    const card = strategyCards.find((s) => s.code === code)
    if (onSelectStrategy && card) {
      onSelectStrategy(card.id)
    }
  }

  // Apply Selected Strategy to Backend
  const handleApplyActiveStrategy = async () => {
    if (!activeStrategy) return
    setIsApplied(true)
    const targetStrategyId = activeStrategy.id

    try {
      if (onApplyStrategy) {
        await onApplyStrategy(targetStrategyId)
      } else if (onNotify) {
        onNotify(`Strategy ${activeStrategyCode} (${activeStrategy.name}) applied successfully!`, 'success')
      }
    } catch (err) {
      if (onNotify) {
        onNotify(err?.message || 'Failed to apply strategy', 'error')
      }
    } finally {
      setTimeout(() => setIsApplied(false), 2500)
    }
  }

  // Export Results
  const handleExportResults = async () => {
    setIsExporting(true)
    try {
      const title = `What-If_Analysis_${incident.source_asset_id || 'Hospital'}_${new Date().toISOString().slice(0, 10)}`
      const reportRes = await getSimulationReport('markdown', title)
      
      const content = reportRes?.data || `# ResilienceOS What-If Simulation Report\nDate: ${new Date().toLocaleString()}\nIncident: ${incident.title || incident.source_asset_id || 'Nominal Baseline'}\nActive Strategy: Strategy ${activeStrategyCode} (${activeStrategy?.name})\nProjected Resilience Score: ${activeStrategy?.score}/100\nICU Continuity: ${activeStrategy?.icu}%\nOperating Theatres: ${activeStrategy?.ot}%\nRuntime Buffer: ${activeStrategy?.runtime}h\n`
      
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${title}.md`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      if (onNotify) {
        onNotify('Simulation comparison report exported successfully!', 'success')
      }
    } catch (err) {
      if (onNotify) {
        onNotify('Failed to export simulation report', 'error')
      }
    } finally {
      setIsExporting(false)
    }
  }

  // Dynamic Comparison table rows tailored to the active incident
  const comparisonRows = useMemo(() => {
    const unmitigatedScore = activeProfile.unmitigatedBaselineScore
    const strats = strategyCards

    const getVal = (stratCode, key, suffix = '', isNumeric = true) => {
      const st = strats.find((s) => s.code === stratCode)
      if (!st) return { val: '--', delta: null }
      const rawVal = st[key]
      return {
        val: `${rawVal}${suffix}`,
        raw: rawVal,
        isNumeric
      }
    }

    const allRows = [
      {
        id: 'resilience',
        category: 'clinical',
        metric: 'Resilience Index (0-100)',
        baseline: `${unmitigatedScore}`,
        baselineNum: unmitigatedScore,
        A: getVal('A', 'score'),
        B: getVal('B', 'score'),
        C: getVal('C', 'score'),
        D: getVal('D', 'score'),
        E: getVal('E', 'score'),
        F: getVal('F', 'score')
      },
      {
        id: 'icu',
        category: 'clinical',
        metric: 'ICU Continuity',
        baseline: isIncidentActive ? '0%' : '100%',
        baselineNum: isIncidentActive ? 0 : 100,
        A: getVal('A', 'icu', '%'),
        B: getVal('B', 'icu', '%'),
        C: getVal('C', 'icu', '%'),
        D: getVal('D', 'icu', '%'),
        E: getVal('E', 'icu', '%'),
        F: getVal('F', 'icu', '%')
      },
      {
        id: 'ot',
        category: 'clinical',
        metric: 'Operating Theatre (OT)',
        baseline: isIncidentActive ? '0%' : '100%',
        baselineNum: isIncidentActive ? 0 : 100,
        A: getVal('A', 'ot', '%'),
        B: getVal('B', 'ot', '%'),
        C: getVal('C', 'ot', '%'),
        D: getVal('D', 'ot', '%'),
        E: getVal('E', 'ot', '%'),
        F: getVal('F', 'ot', '%')
      },
      {
        id: 'er',
        category: 'clinical',
        metric: 'Emergency Room (ER)',
        baseline: isIncidentActive ? '20%' : '100%',
        baselineNum: isIncidentActive ? 20 : 100,
        A: getVal('A', 'er', '%'),
        B: getVal('B', 'er', '%'),
        C: getVal('C', 'er', '%'),
        D: getVal('D', 'er', '%'),
        E: getVal('E', 'er', '%'),
        F: getVal('F', 'er', '%')
      },
      {
        id: 'runtime',
        category: 'resources',
        metric: 'Backup Runtime Remaining',
        baseline: isIncidentActive ? (currentScenarioKey === 'ups' ? '0.1h' : '< 1.0h') : '12.0h',
        baselineNum: isIncidentActive ? 0.8 : 12.0,
        A: getVal('A', 'runtime', 'h'),
        B: getVal('B', 'runtime', 'h'),
        C: getVal('C', 'runtime', 'h'),
        D: getVal('D', 'runtime', 'h'),
        E: getVal('E', 'runtime', 'h'),
        F: getVal('F', 'runtime', 'h')
      },
      {
        id: 'loadshed',
        category: 'resources',
        metric: 'Non-Critical Load Shed',
        baseline: '0 kW',
        baselineNum: 0,
        A: getVal('A', 'loadShed', ' kW'),
        B: getVal('B', 'loadShed', ' kW'),
        C: getVal('C', 'loadShed', ' kW'),
        D: getVal('D', 'loadShed', ' kW'),
        E: getVal('E', 'loadShed', ' kW'),
        F: getVal('F', 'loadShed', ' kW')
      }
    ]

    if (metricFilter === 'clinical') {
      return allRows.filter((r) => r.category === 'clinical')
    }
    if (metricFilter === 'resources') {
      return allRows.filter((r) => r.category === 'resources')
    }
    return allRows
  }, [activeProfile, strategyCards, isIncidentActive, currentScenarioKey, metricFilter])

  // Baseline 100% normal bars
  const baselineBars = [
    { label: 'Emergency', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'ICU', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'OT', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'Ward', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'OPD', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'Lab', normal: 100, degraded: 0, atRisk: 0 },
    { label: 'Radiology', normal: 100, degraded: 0, atRisk: 0 }
  ]

  // Department drilldown details
  const departmentSpecs = useMemo(() => {
    const dept = selectedDept.toUpperCase()
    if (dept === 'ICU') {
      return {
        name: 'Intensive Care Unit (ICU)',
        subsystems: [
          { name: 'Mechanical Ventilators', status: 'Optimal', pct: 100 },
          { name: 'Hemodialysis Circuits', status: activeStrategy?.icu >= 90 ? 'Operational' : 'Restricted', pct: activeStrategy?.icu || 100 },
          { name: 'Patient Monitor Racks', status: 'Protected', pct: 100 },
          { name: 'Medical Oxygen Header', status: 'Nominal 55 PSI', pct: 100 }
        ]
      }
    }
    if (dept === 'OT') {
      return {
        name: 'Operating Theatres (OT 1-6)',
        subsystems: [
          { name: 'Cleanroom Sterile HVAC', status: activeStrategy?.ot >= 85 ? 'Positive Pressure Active' : 'Degraded Pressure', pct: activeStrategy?.ot || 85 },
          { name: 'Surgical Lighting Rigs', status: 'Online (UPS Buffer)', pct: 100 },
          { name: 'Anesthesia Machines', status: 'Protected', pct: 100 },
          { name: 'Autoclave Steam Sterilizers', status: activeStrategy?.ot >= 80 ? 'Active' : 'Standby', pct: activeStrategy?.ot || 80 }
        ]
      }
    }
    if (dept === 'EMERGENCY' || dept === 'ER') {
      return {
        name: 'Emergency Trauma Centre (ER)',
        subsystems: [
          { name: 'Trauma Bay Life-Support', status: '100% Full Power', pct: 100 },
          { name: 'Triage & Admissions Desk', status: 'Online', pct: 100 },
          { name: 'Point-of-Care Analyzers', status: 'Operational', pct: 95 },
          { name: 'Decontamination Shower Pumps', status: 'Standby Ready', pct: 100 }
        ]
      }
    }
    return {
      name: `${selectedDept} Department`,
      subsystems: [
        { name: 'Primary Electrical Feeder', status: 'Stabilized', pct: 85 },
        { name: 'Environmental Air Flow', status: 'Normal', pct: 80 },
        { name: 'Essential Diagnostic Terminals', status: 'Active', pct: 90 },
        { name: 'Emergency Auxiliary Lighting', status: '100% Online', pct: 100 }
      ]
    }
  }, [selectedDept, activeStrategy])

  return (
    <div className="whatif-page">
      {/* UPPER MAIN WORKSPACE: Left Telemetry Sidebar & Right Expanded Matrix Area */}
      <section className="whatif-workspace-grid">
        {/* Left Column: 1. Live Simulation Telemetry */}
        <aside className="whatif-left-col">
          {/* Card 1: Live Simulation Telemetry */}
          <div className="whatif-panel-card telemetry-panel-card">
            <div className="telemetry-header-row">
              <span className="whatif-panel-title">1. Live Simulation Telemetry</span>
              {isIncidentActive ? (
                <span className="telemetry-live-badge live-active font-mono">
                  <span className="telemetry-pulse-dot" /> LIVE INCIDENT
                </span>
              ) : (
                <span className="telemetry-live-badge live-baseline font-mono">
                  <Check size={10} /> BASELINE
                </span>
              )}
            </div>

            {isIncidentActive ? (
              <div className="telemetry-incident-content">
                <div className="telemetry-main-headline">
                  <AlertTriangle size={16} className="telemetry-alert-icon" />
                  <div className="tmh-text">
                    <span className="tmh-title">{incident.title || 'Live Failure Injected'}</span>
                    <span className="tmh-sub font-mono">Incident ID: {incident.incident_id || 'INC-LIVE-01'}</span>
                  </div>
                </div>

                <div className="telemetry-specs-list font-mono">
                  <div className="tspec-row">
                    <span className="tspec-key">Source Asset:</span>
                    <span className="tspec-val highlight-cyan">{incident.source_asset_id || 'GRID_MAIN'}</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Failure Mode:</span>
                    <span className="tspec-val">{incident.failure_type || 'complete_outage'}</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Severity:</span>
                    <span className="tspec-val highlight-red">{incident.severity || 'High / Critical'}</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Duration:</span>
                    <span className="tspec-val">{incident.duration_minutes ? `${incident.duration_minutes} min` : 'Continuous'}</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Heatwave:</span>
                    <span className="tspec-val">{incident.compound_heatwave ? 'Active (42°C Ambient)' : 'Nominal (24°C)'}</span>
                  </div>
                </div>

                {/* Impacted Clinical Services */}
                <div className="telemetry-impacted-block">
                  <span className="tib-title font-mono">Impacted Clinical Units:</span>
                  <div className="tib-tags">
                    {(incident.affected_service_ids && incident.affected_service_ids.length > 0
                      ? incident.affected_service_ids
                      : ['ICU', 'Emergency Room', 'Operating Theatres', 'HVAC Pressurization']
                    ).map((srv, idx) => (
                      <span key={idx} className="tib-tag font-mono">{srv}</span>
                    ))}
                  </div>
                </div>

                {/* Root Cause / Causal Explanation */}
                {incident.root_cause && (
                  <div className="telemetry-root-cause-box font-mono">
                    <span className="trc-label">Extracted Root Cause:</span>
                    <span className="trc-text">{incident.root_cause}</span>
                  </div>
                )}

                {onReset && (
                  <button
                    type="button"
                    className="reset-scenario-btn font-mono"
                    onClick={onReset}
                  >
                    <RotateCcw size={11} />
                    <span>Resolve & Restore Baseline</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="telemetry-baseline-content">
                <div className="tb-status-box">
                  <ShieldCheck size={26} className="tb-shield-icon" />
                  <div className="tb-status-meta">
                    <span className="tb-status-title">100% Operational Baseline</span>
                    <span className="tb-status-desc">All electrical, HVAC, and medical gas circuits are operating within nominal thresholds.</span>
                  </div>
                </div>

                <div className="tb-guidance-box font-mono">
                  <Info size={14} className="tb-info-icon" />
                  <span>Telemetry automatically streams here from the <strong>Start Simulation</strong> page whenever an incident is active.</span>
                </div>

                <div className="tb-specs-list font-mono">
                  <div className="tspec-row">
                    <span className="tspec-key">Primary Grid:</span>
                    <span className="tspec-val highlight-green">415V Nominal</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Backup Gen:</span>
                    <span className="tspec-val highlight-green">Standby Ready</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">UPS Banks:</span>
                    <span className="tspec-val highlight-green">Charged (4.8h)</span>
                  </div>
                  <div className="tspec-row">
                    <span className="tspec-key">Active Alarms:</span>
                    <span className="tspec-val">0 Active Faults</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Center/Expanded Main Column: 2. Select Strategies & 3. Expanded Comparison Matrix */}
        <div className="whatif-center-col">
          {/* 2. Select Response Strategies */}
          <div className="whatif-strategies-box">
            <div className="strategies-header-row">
              <span className="strategies-title">
                2. Select Response Strategy <span className="sub-note">(Click card to inspect & evaluate trade-offs)</span>
              </span>
            </div>

            <div className="strategy-cards-grid">
              {strategyCards.map((strat) => {
                const isSelected = activeStrategyCode === strat.code
                return (
                  <div
                    key={strat.code}
                    className={`strat-card strat-${strat.color} ${isSelected ? 'is-active-card is-checked' : ''}`}
                    onClick={() => handleSelectStrategy(strat.code)}
                  >
                    <div className="strat-card-top">
                      <div className="strat-code-badge">{strat.code}</div>
                      <span className={`strat-select-indicator ${isSelected ? 'is-selected' : ''}`}>
                        {isSelected && <Check size={11} />}
                      </span>
                    </div>
                    <div className="strat-card-name">{strat.name}</div>
                    <div className="strat-card-desc">{strat.desc}</div>
                    <div className="strat-card-footer font-mono">
                      <span className="scf-score">Index: {strat.score}</span>
                      <span className="scf-time">{strat.timeToImpact}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Expanded Strategy Comparison Results Table */}
          <div className="whatif-table-card expanded-table-card">
            <div className="table-header-row">
              <div className="table-title-group">
                <span className="table-title">3. Strategy Comparison Results Matrix</span>
                <div className="table-filter-pills font-mono">
                  <button
                    type="button"
                    className={`table-filter-btn ${metricFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setMetricFilter('all')}
                  >
                    All Metrics
                  </button>
                  <button
                    type="button"
                    className={`table-filter-btn ${metricFilter === 'clinical' ? 'active' : ''}`}
                    onClick={() => setMetricFilter('clinical')}
                  >
                    Clinical Continuity
                  </button>
                  <button
                    type="button"
                    className={`table-filter-btn ${metricFilter === 'resources' ? 'active' : ''}`}
                    onClick={() => setMetricFilter('resources')}
                  >
                    Resources & Runtime
                  </button>
                </div>
              </div>

              <div className="table-actions-group font-mono">
                <button
                  type="button"
                  className={`delta-toggle-btn ${showDeltas ? 'is-delta-active' : ''}`}
                  onClick={() => setShowDeltas(!showDeltas)}
                  title="Toggle Delta Differential view (shows ± improvement relative to unmitigated baseline)"
                >
                  <Activity size={12} />
                  <span>{showDeltas ? 'Showing Deltas (±)' : 'Show Baseline Deltas (±)'}</span>
                </button>

                <button
                  type="button"
                  className="export-results-btn font-mono"
                  onClick={handleExportResults}
                  disabled={isExporting}
                >
                  <Download size={11} />
                  <span>{isExporting ? 'Exporting...' : 'Export Results'}</span>
                </button>
              </div>
            </div>

            <div className="comparison-table-scroll">
              <table className="comparison-table expanded-matrix-table font-mono">
                <thead>
                  <tr>
                    <th className="th-metric">Evaluation Metric</th>
                    <th className="th-baseline">
                      No Action
                      <br />
                      <span className="th-sub">(Baseline)</span>
                    </th>
                    {strategyCards.map((st) => (
                      <th
                        key={st.code}
                        className={`th-clickable ${activeStrategyCode === st.code ? 'th-highlight' : ''}`}
                        onClick={() => handleSelectStrategy(st.code)}
                      >
                        <div className="th-col-header-wrap">
                          <span className="th-code-tag">{st.code}</span>
                          <span className="th-strat-title">{st.name}</span>
                        </div>
                        <span className="th-sub">{st.desc}</span>
                        {st.isRecommended && <span className="th-rec-star"> ★ Recommended</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.metric}>
                      <td className="td-metric">
                        <span className="metric-name">{row.metric}</span>
                      </td>
                      <td className="td-baseline">{row.baseline}</td>
                      {['A', 'B', 'C', 'D', 'E', 'F'].map((code) => {
                        const cell = row[code]
                        const isColSelected = activeStrategyCode === code
                        let deltaBadge = null

                        if (showDeltas && cell?.raw !== undefined && row.baselineNum !== undefined) {
                          const numVal = parseFloat(cell.raw)
                          const numBase = parseFloat(row.baselineNum)
                          if (!isNaN(numVal) && !isNaN(numBase)) {
                            const diff = numVal - numBase
                            if (diff !== 0) {
                              const isPositive = diff > 0
                              deltaBadge = (
                                <span className={`cell-delta-pill ${isPositive ? 'delta-pos' : 'delta-neg'}`}>
                                  {isPositive ? `+${diff.toFixed(0)}` : `${diff.toFixed(0)}`}
                                </span>
                              )
                            }
                          }
                        }

                        return (
                          <td
                            key={code}
                            className={`td-clickable ${isColSelected ? 'td-highlight' : ''}`}
                            onClick={() => handleSelectStrategy(code)}
                          >
                            <div className="cell-val-wrap">
                              <span className="cell-main-val">{cell.val}</span>
                              {deltaBadge}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM 3-COLUMN EXECUTIVE ANALYSIS DECK */}
      <section className="whatif-bottom-deck">
        {/* Bottom Card 1: Key Impact */}
        <div className="whatif-panel-card bottom-panel-card">
          <div className="bottom-panel-header">
            <span className="whatif-panel-title">
              Key Impact (Strategy {activeStrategyCode})
            </span>
            <span className="bp-badge font-mono">Live Projections</span>
          </div>

          <div className="key-impact-grid">
            <div className="key-impact-tile tile-red">
              <div className="tile-icon-wrap icon-red"><AlertTriangle size={15} /></div>
              <div className="tile-info">
                <span className="tile-num font-mono">{activeStrategy ? activeStrategy.servicesAtRisk : 0}</span>
                <span className="tile-lbl">Services At Risk</span>
              </div>
            </div>

            <div className="key-impact-tile tile-gold">
              <div className="tile-icon-wrap icon-gold"><Box size={15} /></div>
              <div className="tile-info">
                <span className="tile-num font-mono">{activeStrategy ? activeStrategy.affectedAssets : 0}</span>
                <span className="tile-lbl">Affected Assets</span>
              </div>
            </div>

            <div className="key-impact-tile tile-blue">
              <div className="tile-icon-wrap icon-blue"><Clock size={15} /></div>
              <div className="tile-info">
                <span className="tile-num font-mono">{activeStrategy ? activeStrategy.timeToImpact : 'Nominal'}</span>
                <span className="tile-lbl">Time to First Impact</span>
              </div>
            </div>

            <div className="key-impact-tile tile-green">
              <div className="tile-icon-wrap icon-green"><ShieldCheck size={15} /></div>
              <div className="tile-info">
                <span className="tile-num font-mono">{activeStrategy ? activeStrategy.score : 94}</span>
                <span className="tile-lbl">Resilience Index</span>
              </div>
            </div>
          </div>

          {/* Compact Strategic Highlights for Strategy */}
          <div className="key-impact-specs-list font-mono">
            <div className="tspec-row">
              <span className="tspec-key">Primary Focus:</span>
              <span className="tspec-val highlight-cyan">{activeStrategy?.name || 'Nominal Baseline'}</span>
            </div>
            <div className="tspec-row">
              <span className="tspec-key">Target ICU Continuity:</span>
              <span className="tspec-val highlight-green">{activeStrategy?.icu || 100}%</span>
            </div>
            <div className="tspec-row">
              <span className="tspec-key">Target OT Capacity:</span>
              <span className="tspec-val">{activeStrategy?.ot || 100}%</span>
            </div>
            <div className="tspec-row">
              <span className="tspec-key">Autonomous Runtime:</span>
              <span className="tspec-val highlight-green">{activeStrategy?.runtime || 12.0}h</span>
            </div>
          </div>
        </div>

        {/* Bottom Card 2: Service Level Impact & Department Drilldown */}
        <div className="whatif-panel-card bottom-panel-card">
          <div className="panel-title-with-legend">
            <div className="bottom-panel-header">
              <span className="whatif-panel-title">
                Service Level Impact (Strategy {activeStrategyCode})
              </span>
              <span className="bp-badge font-mono">Department Breakdown</span>
            </div>
            <div className="service-impact-legend">
              <span><span className="dot-g" /> Normal</span>
              <span><span className="dot-y" /> Degraded</span>
              <span><span className="dot-r" /> At Risk</span>
              <span><span className="dot-dr" /> Failed</span>
            </div>
          </div>

          {/* Stacked Vertical Bars */}
          <div className="service-bars-chart">
            <div className="chart-y-axis-nums font-mono">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>
            <div className="service-bars-container">
              {(activeStrategy ? activeStrategy.bars : baselineBars).map((bar) => {
                const isSelectedDept = selectedDept.toLowerCase() === bar.label.toLowerCase()
                return (
                  <div
                    key={bar.label}
                    className={`service-bar-col ${isSelectedDept ? 'bar-selected' : ''}`}
                    onClick={() => setSelectedDept(bar.label)}
                    title={`Click to inspect ${bar.label} department sub-systems`}
                  >
                    <div className="bar-stacked-track">
                      {bar.normal > 0 && (
                        <div className="bar-seg-normal" style={{ height: `${bar.normal}%` }} />
                      )}
                      {bar.degraded > 0 && (
                        <div className="bar-seg-deg" style={{ height: `${bar.degraded}%` }} />
                      )}
                      {bar.atRisk > 0 && (
                        <div className="bar-seg-risk" style={{ height: `${bar.atRisk}%` }} />
                      )}
                    </div>
                    <span className="bar-lbl">{bar.label}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Interactive Department Sub-system Detail Box */}
          <div className="dept-subsystems-drilldown font-mono">
            <div className="dsd-header">
              <span className="dsd-title">{departmentSpecs.name}:</span>
              <span className="dsd-click-hint">Click any bar to inspect</span>
            </div>
            <div className="dsd-items-grid">
              {departmentSpecs.subsystems.map((sub, idx) => (
                <div key={idx} className="dsd-item">
                  <span className="dsd-name">{sub.name}</span>
                  <span className="dsd-status font-bold">{sub.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Card 3: Recommended Strategy & Execution CTA */}
        <div className="whatif-panel-card bottom-panel-card rec-strategy-card">
          <div className="rec-header-row">
            <span className="whatif-panel-title">
              Strategy Response Protocol
            </span>
            {activeStrategy?.isRecommended ? (
              <span className="rec-badge font-mono">Recommended</span>
            ) : (
              <span className="rec-badge font-mono" style={{ background: 'rgba(0, 163, 255, 0.12)', color: '#0080FF', borderColor: '#0080FF' }}>
                {isIncidentActive ? 'Candidate' : 'Standby'}
              </span>
            )}
          </div>

          <div className="rec-title-row">
            <span className="rec-star">⭐</span>
            <span className="rec-strat-name">
              {activeStrategy
                ? `Strategy ${activeStrategyCode} - ${activeStrategy.name}`
                : 'Select an incident to evaluate response'}
            </span>
          </div>

          <div className="rec-bullets-list">
            {(activeStrategy ? activeStrategy.pros : [
              'Maintains 100% nominal operation across all clinical services',
              'Continuous monitoring of electrical, thermal, and medical gas headers',
              'Standby automated failover ready for unexpected grid disruptions',
              'Zero active clinical vulnerabilities'
            ]).map((pro, idx) => (
              <div key={idx} className="rec-bullet-item">
                <Check size={13} className="rec-check-icon" />
                <span>{pro}</span>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="apply-strategy-cta-btn"
            onClick={handleApplyActiveStrategy}
            disabled={!activeStrategy}
            style={{ opacity: activeStrategy ? 1 : 0.5, cursor: activeStrategy ? 'pointer' : 'not-allowed' }}
          >
            <Play size={14} fill="currentColor" />
            <span>
              {isApplied
                ? `Strategy ${activeStrategyCode} Applied!`
                : activeStrategy
                ? `Apply Strategy ${activeStrategyCode}`
                : 'Select Incident to Apply'}
            </span>
          </button>
        </div>
      </section>
    </div>
  )
}
