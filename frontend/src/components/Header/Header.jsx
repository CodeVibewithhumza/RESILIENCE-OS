import { useState, useEffect } from 'react'
import { Activity, Clock, RotateCcw, Radio } from 'lucide-react'
import './Header.css'

export default function Header({
  resilience,
  scenarioName = 'Baseline 100% Operational',
  onReset
}) {
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date()
    return now.toTimeString().split(' ')[0]
  })

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setTimeStr(now.toTimeString().split(' ')[0])
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const statusColor = resilience?.status_color || '#10B981'
  const statusLabel = resilience?.status_label || 'OPTIMAL'
  const isCritical = statusLabel === 'CRITICAL'

  return (
    <header className="app-header">
      {/* Left Branding Group */}
      <div className="header-branding">
        <div className="header-title-group">
          <div className="header-logo-icon">
            <Activity size={20} />
          </div>
          <span className="header-title">RESILIENCE<span className="header-title-highlight">OS</span></span>
          <span className="header-tag">Digital Twin</span>
        </div>

        <div className="header-divider" />
        <span className="header-subtitle">
          Infrastructure Resilience & Decision Support System
        </span>
      </div>

      {/* Right Metadata Indicators & Controls */}
      <div className="header-actions">
        {/* Scenario Mode Indicator */}
        <div className="header-meta-item">
          <Radio size={13} className="header-radio-icon" />
          <span className="header-meta-label">Scenario:</span>
          <span className="header-meta-value scenario-value">{scenarioName}</span>
        </div>

        {/* Operational Status Indicator */}
        <div className={`header-meta-item status-indicator-pill ${isCritical ? 'is-critical-pill' : ''}`}>
          <span
            className="status-dot status-dot-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <span className="header-meta-label">System Status:</span>
          <span className="header-meta-value" style={{ color: statusColor, fontWeight: 700 }}>
            {statusLabel}
          </span>
        </div>

        {/* Real-time System Clock */}
        <div className="header-meta-item clock-item">
          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
          <span className="header-meta-value font-mono">{timeStr} UTC</span>
        </div>

        {/* Reset Baseline Action */}
        <button
          type="button"
          className="header-reset-btn"
          onClick={onReset}
          title="Reset hospital digital twin to 100% baseline"
        >
          <RotateCcw size={13} />
          <span>Reset Baseline</span>
        </button>
      </div>
    </header>
  )
}
