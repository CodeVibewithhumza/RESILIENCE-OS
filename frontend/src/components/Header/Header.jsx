import { useState, useEffect } from 'react'
import { Activity, Clock, RotateCcw, Radio, ShieldCheck } from 'lucide-react'
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

  return (
    <header className="app-header">
      {/* Branding */}
      <div className="header-branding">
        <div className="header-title-group">
          <div className="header-logo-icon">
            <Activity size={20} />
          </div>
          <span className="header-title">RESILIENCE OS</span>
          <span className="header-tag">Digital Twin</span>
        </div>

        <div className="header-divider" />
        <span className="header-subtitle">
          Infrastructure Resilience & Decision Support System
        </span>
      </div>

      {/* Meta Indicators & Controls */}
      <div className="header-actions">
        {/* Scenario Mode Indicator */}
        <div className="header-meta-item">
          <Radio size={14} style={{ color: 'var(--accent-cyan)' }} />
          <span className="header-meta-label">Scenario:</span>
          <span className="header-meta-value">{scenarioName}</span>
        </div>

        {/* Operational Status Indicator */}
        <div className="header-meta-item">
          <span
            className="status-dot"
            style={{ backgroundColor: statusColor }}
          />
          <span className="header-meta-label">Status:</span>
          <span className="header-meta-value" style={{ color: statusColor }}>
            {statusLabel}
          </span>
        </div>

        {/* Local Clock */}
        <div className="header-meta-item">
          <Clock size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="header-meta-value font-mono">{timeStr}</span>
        </div>

        {/* Reset Control */}
        <button
          type="button"
          className="header-reset-btn"
          onClick={onReset}
          title="Reset hospital digital twin to 100% baseline"
        >
          <RotateCcw size={14} />
          <span>Reset Baseline</span>
        </button>
      </div>
    </header>
  )
}
