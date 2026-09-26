import { useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  Maximize2,
  Navigation,
  Plus,
  Minus,
  Info,
  ChevronRight,
  Zap,
  TrendingUp,
  Share2
} from 'lucide-react'
import TwinContainer from '../DigitalTwin3D/TwinContainer'
import './RiskResilienceView.css'

export default function RiskResilienceView({ resilience, assets = [], services = [] }) {
  const [heatmapView, setHeatmapView] = useState('infra') // 'infra' | 'service'
  const [riskDistFilter, setRiskDistFilter] = useState('asset_type')
  const [resilienceStateFilter, setResilienceStateFilter] = useState('current')
  const [serviceFilter, setServiceFilter] = useState('all')

  const topKpis = [
    {
      id: 'kpi_resilience',
      name: 'Resilience Index',
      val: '82 / 100',
      trend: '↑ 6%',
      icon: ShieldCheck,
      iconColor: '#00F0FF',
      sparkColor: '#00F0FF',
      sparkPoints: '0,20 20,18 40,22 60,15 80,16 100,10 120,8'
    },
    {
      id: 'kpi_high_risk',
      name: 'High Risk Assets',
      val: '3',
      trend: '↑ 1',
      icon: AlertTriangle,
      iconColor: '#FF4D4D',
      sparkColor: '#FF4D4D',
      sparkPoints: '0,18 20,20 40,16 60,22 80,18 100,24 120,26'
    },
    {
      id: 'kpi_med_risk',
      name: 'Medium Risk Assets',
      val: '5',
      trend: '↓ 2',
      icon: AlertTriangle,
      iconColor: '#FFB800',
      sparkColor: '#FFB800',
      sparkPoints: '0,14 20,16 40,18 60,16 80,20 100,18 120,15'
    },
    {
      id: 'kpi_low_risk',
      name: 'Low Risk Assets',
      val: '44',
      trend: '↑ 4',
      icon: ShieldCheck,
      iconColor: '#00E5A3',
      sparkColor: '#00E5A3',
      sparkPoints: '0,18 20,16 40,18 60,14 80,15 100,12 120,10'
    },
    {
      id: 'kpi_services_risk',
      name: 'Critical Services Risk',
      val: '2 / 8',
      trend: '↑ 1',
      icon: Share2,
      iconColor: '#00A3FF',
      sparkColor: '#00A3FF',
      sparkPoints: '0,18 20,18 40,18 60,20 80,18 100,22 120,22'
    },
    {
      id: 'kpi_avg_recovery',
      name: 'Avg. Time to Recovery',
      val: '3.2 hours',
      trend: '↓ 28%',
      icon: Clock,
      iconColor: '#00F0FF',
      sparkColor: '#00F0FF',
      sparkPoints: '0,10 20,12 40,14 60,18 80,16 100,20 120,22'
    }
  ]

  const heatmapPins = [
    { id: 'TRANSFORMER', label: 'Transformer', status: 'High Risk', top: '38%', left: '33%', color: 'red' },
    { id: 'CHILLER', label: 'Chiller Plant', status: 'Medium Risk', top: '36%', left: '45%', color: 'amber' },
    { id: 'WATER_TANK', label: 'Water Tank', status: 'Medium Risk', top: '42%', left: '55%', color: 'amber' },
    { id: 'SERVICE_ICU', label: 'ICU', status: 'Low Risk', top: '49%', left: '23%', color: 'cyan' },
    { id: 'SERVICE_ER', label: 'Emergency', status: 'Normal', top: '59%', left: '32%', color: 'cyan' },
    { id: 'MED_GAS_PLANT', label: 'Medical Gas Plant', status: 'Low Risk', top: '53%', left: '57%', color: 'cyan' },
    { id: 'SERVICE_OT', label: 'OT', status: 'Medium Risk', top: '61%', left: '47%', color: 'amber' }
  ]

  const topRiskAssets = [
    { rank: 1, asset: 'Main Transformer', system: 'Electrical', level: 'High', score: 92 },
    { rank: 2, asset: 'Chiller-1', system: 'HVAC', level: 'High', score: 88 },
    { rank: 3, asset: 'Medical Gas Compressor', system: 'Medical Gas', level: 'High', score: 86 },
    { rank: 4, asset: 'DG-1 (Generator)', system: 'Electrical', level: 'Medium', score: 68 },
    { rank: 5, asset: 'Water Tank', system: 'Water', level: 'Medium', score: 62 }
  ]

  const serviceRiskOverview = [
    { service: 'ICU', status: 'At Risk', statusColor: '#FF4D4D', level: 'High', score: 62 },
    { service: 'OT', status: 'At Risk', statusColor: '#FF4D4D', level: 'High', score: 58 },
    { service: 'Emergency', status: 'Normal', statusColor: '#00E5A3', level: 'Medium', score: 74 },
    { service: 'Wards', status: 'Normal', statusColor: '#00E5A3', level: 'Low', score: 82 },
    { service: 'OPD', status: 'Normal', statusColor: '#00E5A3', level: 'Low', score: 85 },
    { service: 'Laboratory', status: 'Normal', statusColor: '#00E5A3', level: 'Low', score: 88 },
    { service: 'Radiology', status: 'Normal', statusColor: '#00E5A3', level: 'Low', score: 86 }
  ]

  return (
    <div className="risk-resilience-page">
      {/* 1. TOP 6 KPI CARDS */}
      <section className="risk-top-kpis-grid">
        {topKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <div key={kpi.id} className="risk-kpi-card">
              <div className="risk-kpi-left">
                <div className="risk-kpi-icon-wrap" style={{ color: kpi.iconColor }}>
                  <Icon size={16} />
                </div>
                <div className="risk-kpi-meta">
                  <span className="risk-kpi-name">{kpi.name}</span>
                  <div className="risk-kpi-val-row">
                    <span className="risk-kpi-val font-mono">{kpi.val}</span>
                    <span className={`risk-kpi-trend font-mono ${kpi.trend.includes('↓') ? 'trend-down' : 'trend-up'}`}>
                      {kpi.trend}
                    </span>
                  </div>
                </div>
              </div>

              <div className="risk-kpi-sparkline-wrap">
                <svg className="risk-kpi-sparkline" viewBox="0 0 120 30" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke={kpi.sparkColor}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={kpi.sparkPoints}
                  />
                </svg>
              </div>
            </div>
          )
        })}
      </section>

      {/* 2. MIDDLE 3-PANEL GRID: Heatmap (Left) + Risk Dist Donut & Resilience Components (Right) */}
      <section className="risk-middle-grid">
        {/* Left: 1. Risk Heatmap (Hospital Infrastructure) */}
        <div className="risk-heatmap-card">
          <div className="heatmap-header-row">
            <span className="heatmap-title">1. Risk Heatmap (Hospital Infrastructure)</span>
            <div className="heatmap-controls-right">
              <div className="heatmap-toggles">
                <button
                  type="button"
                  className={`hm-toggle-btn ${heatmapView === 'infra' ? 'is-active' : ''}`}
                  onClick={() => setHeatmapView('infra')}
                >
                  Infrastructure View
                </button>
                <button
                  type="button"
                  className={`hm-toggle-btn ${heatmapView === 'service' ? 'is-active' : ''}`}
                  onClick={() => setHeatmapView('service')}
                >
                  Service View
                </button>
              </div>
              <button type="button" className="heatmap-expand-btn"><Maximize2 size={12} /></button>
            </div>
          </div>

          <div className="heatmap-canvas-viewport">
            <TwinContainer
              assets={assets}
              services={services}
            />

            {/* Top-left Legend */}
            <div className="heatmap-legend-box">
              <div className="hm-leg-item"><span className="hm-dot" style={{ backgroundColor: '#FF4D4D' }} /> High Risk</div>
              <div className="hm-leg-item"><span className="hm-dot" style={{ backgroundColor: '#FFB800' }} /> Medium Risk</div>
              <div className="hm-leg-item"><span className="hm-dot" style={{ backgroundColor: '#00E5A3' }} /> Low Risk</div>
              <div className="hm-leg-item"><span className="hm-dot" style={{ backgroundColor: '#00F0FF' }} /> Normal</div>
            </div>

            {/* Risk Pins */}
            <div className="heatmap-pins-layer">
              {heatmapPins.map((pin) => (
                <div key={pin.id} className={`heatmap-hud-pin pin-${pin.color}`} style={{ top: pin.top, left: pin.left }}>
                  <span className="hm-pin-icon">
                    {pin.color === 'red' ? '⚠️' : '●'}
                  </span>
                  <div className="hm-pin-text">
                    <span className="hm-pin-name">{pin.label}</span>
                    <span className="hm-pin-status font-mono">{pin.status}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Compass HUD */}
            <div className="heatmap-compass-hud">
              <div className="compass-circle">
                <span className="compass-dir compass-n">N</span>
                <span className="compass-dir compass-e">E</span>
                <span className="compass-dir compass-s">S</span>
                <span className="compass-dir compass-w">W</span>
                <div className="compass-needle" />
              </div>
            </div>

            {/* Camera Controls */}
            <div className="heatmap-camera-controls">
              <button type="button" className="hm-ctrl-btn"><Maximize2 size={12} /></button>
              <button type="button" className="hm-ctrl-btn"><Navigation size={12} /></button>
              <button type="button" className="hm-ctrl-btn"><Plus size={12} /></button>
              <button type="button" className="hm-ctrl-btn"><Minus size={12} /></button>
            </div>
          </div>
        </div>

        {/* Right Stack: 2. Risk Distribution Donut & 3. Resilience Components */}
        <div className="risk-right-stack">
          {/* Card 2: Risk Distribution Donut */}
          <div className="risk-panel-card">
            <div className="panel-header-with-select">
              <span className="risk-panel-title">2. Risk Distribution</span>
              <select
                className="panel-select font-mono"
                value={riskDistFilter}
                onChange={(e) => setRiskDistFilter(e.target.value)}
              >
                <option value="asset_type">By Asset Type</option>
                <option value="severity">By Severity</option>
              </select>
            </div>

            <div className="risk-donut-split">
              <div className="donut-wrap">
                <svg className="donut-svg" viewBox="0 0 100 100">
                  {/* Total 52: High 3 (6%), Med 5 (10%), Low 12 (23%), Normal 32 (61%) */}
                  {/* Circ = 2 * PI * 36 = 226.2 */}
                  <circle
                    className="donut-arc"
                    cx="50"
                    cy="50"
                    r="36"
                    strokeWidth="12"
                    stroke="#00A3FF"
                    strokeDasharray="138 88.2"
                    strokeDashoffset="0"
                    fill="none"
                  />
                  <circle
                    className="donut-arc"
                    cx="50"
                    cy="50"
                    r="36"
                    strokeWidth="12"
                    stroke="#00E5A3"
                    strokeDasharray="52 174.2"
                    strokeDashoffset="-138"
                    fill="none"
                  />
                  <circle
                    className="donut-arc"
                    cx="50"
                    cy="50"
                    r="36"
                    strokeWidth="12"
                    stroke="#FFB800"
                    strokeDasharray="22.6 203.6"
                    strokeDashoffset="-190"
                    fill="none"
                  />
                  <circle
                    className="donut-arc"
                    cx="50"
                    cy="50"
                    r="36"
                    strokeWidth="12"
                    stroke="#FF4D4D"
                    strokeDasharray="13.6 212.6"
                    strokeDashoffset="-212.6"
                    fill="none"
                  />
                </svg>
                <div className="donut-center-meta">
                  <span className="donut-big-num font-mono">52</span>
                  <span className="donut-sub-txt">Total Assets</span>
                </div>
              </div>

              <div className="donut-legend-col font-mono">
                <div className="d-leg-row">
                  <div className="d-leg-left">
                    <span className="d-dot" style={{ backgroundColor: '#FF4D4D' }} />
                    <span>High Risk</span>
                  </div>
                  <span className="d-val" style={{ color: '#FF4D4D' }}>3 (6%)</span>
                </div>
                <div className="d-leg-row">
                  <div className="d-leg-left">
                    <span className="d-dot" style={{ backgroundColor: '#FFB800' }} />
                    <span>Medium Risk</span>
                  </div>
                  <span className="d-val" style={{ color: '#FFB800' }}>5 (10%)</span>
                </div>
                <div className="d-leg-row">
                  <div className="d-leg-left">
                    <span className="d-dot" style={{ backgroundColor: '#00E5A3' }} />
                    <span>Low Risk</span>
                  </div>
                  <span className="d-val" style={{ color: '#00E5A3' }}>12 (23%)</span>
                </div>
                <div className="d-leg-row">
                  <div className="d-leg-left">
                    <span className="d-dot" style={{ backgroundColor: '#00A3FF' }} />
                    <span>Normal</span>
                  </div>
                  <span className="d-val" style={{ color: '#00A3FF' }}>32 (61%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Resilience Components 5 Radial Dials */}
          <div className="risk-panel-card">
            <div className="panel-header-with-select">
              <div className="title-with-info">
                <span className="risk-panel-title">3. Resilience Components</span>
                <Info size={12} className="panel-info-icon" />
              </div>
              <select
                className="panel-select font-mono"
                value={resilienceStateFilter}
                onChange={(e) => setResilienceStateFilter(e.target.value)}
              >
                <option value="current">Current State</option>
                <option value="projected">Projected State</option>
              </select>
            </div>

            <div className="resilience-components-dials-row">
              {/* Dial 1: Capacity (C) 78 */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (78 / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">78</span>
                </div>
                <span className="r-dial-lbl">Capacity<br />(C)</span>
              </div>

              {/* Dial 2: Adaptability (A) 85 */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (85 / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">85</span>
                </div>
                <span className="r-dial-lbl">Adaptability<br />(A)</span>
              </div>

              {/* Dial 3: Backup (B) 80 */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (80 / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">80</span>
                </div>
                <span className="r-dial-lbl">Backup<br />(B)</span>
              </div>

              {/* Dial 4: Technical Health (T) 70 */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (70 / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">70</span>
                </div>
                <span className="r-dial-lbl">Technical Health<br />(T)</span>
              </div>

              {/* Dial 5: Utilization (U) 75 */}
              <div className="r-comp-dial-item">
                <div className="r-dial-svg-wrap">
                  <svg className="r-svg" viewBox="0 0 60 60">
                    <circle className="r-track" cx="30" cy="30" r="24" strokeWidth="5" fill="none" />
                    <circle
                      className="r-fill"
                      cx="30"
                      cy="30"
                      r="24"
                      strokeWidth="5"
                      stroke="#00F0FF"
                      fill="none"
                      strokeDasharray="150.8"
                      strokeDashoffset={150.8 - (75 / 100) * 150.8}
                    />
                  </svg>
                  <span className="r-dial-num font-mono">75</span>
                </div>
                <span className="r-dial-lbl">Utilization<br />(U)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. BOTTOM 3 CARDS ROW: 4. Top Risk Assets, 5. Service Risk Overview, 6. Resilience Trend */}
      <section className="risk-bottom-grid">
        {/* Card 4: Top Risk Assets */}
        <div className="risk-panel-card">
          <div className="panel-header-with-action">
            <span className="risk-panel-title">4. Top Risk Assets</span>
            <button type="button" className="view-all-link">View All &gt;</button>
          </div>

          <table className="risk-table font-mono">
            <thead>
              <tr>
                <th>Rank</th>
                <th className="th-left">Asset</th>
                <th>System</th>
                <th>Risk Level</th>
                <th>Risk Score</th>
              </tr>
            </thead>
            <tbody>
              {topRiskAssets.map((item) => (
                <tr key={item.rank}>
                  <td>{item.rank}</td>
                  <td className="td-left font-sans">{item.asset}</td>
                  <td>{item.system}</td>
                  <td>
                    <span className={`risk-badge badge-${item.level.toLowerCase()}`}>
                      {item.level}
                    </span>
                  </td>
                  <td className="font-bold">{item.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card 5: Service Risk Overview */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <span className="risk-panel-title">5. Service Risk Overview</span>
            <select
              className="panel-select font-mono"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="all">All Services</option>
              <option value="critical">Critical Only</option>
            </select>
          </div>

          <table className="risk-table font-mono">
            <thead>
              <tr>
                <th className="th-left">Service</th>
                <th>Current Status</th>
                <th>Risk Level</th>
                <th>Resilience Score</th>
              </tr>
            </thead>
            <tbody>
              {serviceRiskOverview.map((srv) => (
                <tr key={srv.service}>
                  <td className="td-left font-sans">{srv.service}</td>
                  <td>
                    <span className="status-inline">
                      <span className="dot" style={{ backgroundColor: srv.statusColor }} />
                      {srv.status}
                    </span>
                  </td>
                  <td>
                    <span className={`risk-badge badge-${srv.level.toLowerCase()}`}>
                      {srv.level}
                    </span>
                  </td>
                  <td className="font-bold">{srv.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Card 6: Resilience Trend Multi-line Chart */}
        <div className="risk-panel-card">
          <div className="panel-header-with-select">
            <span className="risk-panel-title">6. Resilience Trend</span>
            <select className="panel-select font-mono" defaultValue="24h">
              <option value="24h">Last 24 Hours</option>
              <option value="12h">Last 12 Hours</option>
            </select>
          </div>

          <div className="resilience-trend-chart-body">
            <div className="trend-y-axis font-mono">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="trend-svg-container">
              <svg className="trend-chart-svg" viewBox="0 0 200 90" preserveAspectRatio="none">
                <line x1="0" y1="5" x2="200" y2="5" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="26" x2="200" y2="26" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="48" x2="200" y2="48" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="69" x2="200" y2="69" stroke="var(--border-subtle)" strokeDasharray="3 3" />
                <line x1="0" y1="90" x2="200" y2="90" stroke="var(--border-subtle)" />

                {/* Overall Index (Cyan) */}
                <path d="M0,22 C40,18 80,24 120,16 C160,18 180,12 200,14" fill="none" stroke="#00F0FF" strokeWidth="2" />
                {/* Capacity (Blue) */}
                <path d="M0,28 C40,26 80,30 120,24 C160,25 180,20 200,22" fill="none" stroke="#00A3FF" strokeWidth="1.5" />
                {/* Adaptability (Orange) */}
                <path d="M0,35 C40,40 80,32 120,42 C160,35 180,30 200,32" fill="none" stroke="#FFB800" strokeWidth="1.5" />
                {/* Backup (Pink) */}
                <path d="M0,45 C40,40 80,48 120,44 C160,40 180,38 200,40" fill="none" stroke="#FF4D4D" strokeWidth="1.5" />
                {/* Technical Health (Purple) */}
                <path d="M0,52 C40,54 80,50 120,56 C160,50 180,48 200,50" fill="none" stroke="#A855F7" strokeWidth="1.5" />
                {/* Utilization (Gold) */}
                <path d="M0,60 C40,58 80,62 120,58 C160,54 180,52 200,55" fill="none" stroke="#FFD600" strokeWidth="1.5" />
              </svg>
              <div className="trend-x-axis font-mono">
                <span>12AM</span>
                <span>4AM</span>
                <span>8AM</span>
                <span>12PM</span>
                <span>4PM</span>
                <span>8PM</span>
              </div>
            </div>

            <div className="trend-legend-list font-mono">
              <div><span className="dot" style={{ backgroundColor: '#00F0FF' }} /> Overall Index</div>
              <div><span className="dot" style={{ backgroundColor: '#00A3FF' }} /> Capacity (C)</div>
              <div><span className="dot" style={{ backgroundColor: '#FFB800' }} /> Adaptability (A)</div>
              <div><span className="dot" style={{ backgroundColor: '#FF4D4D' }} /> Backup (B)</div>
              <div><span className="dot" style={{ backgroundColor: '#A855F7' }} /> Technical Health (T)</div>
              <div><span className="dot" style={{ backgroundColor: '#FFD600' }} /> Utilization (U)</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
