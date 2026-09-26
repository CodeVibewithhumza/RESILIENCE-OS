import { useState, useEffect } from 'react'
import {
  Sun,
  Moon,
  Bell,
  RotateCcw,
  Radio,
  ChevronDown
} from 'lucide-react'
import './Header.css'

const PAGE_TITLES = {
  'dashboard': {
    title: 'Dashboard',
    subtitle: 'Real-time view of hospital infrastructure resilience (Simulated)'
  },
  'digital-twin': {
    title: 'Digital Twin',
    subtitle: '3D BIM Visualization & Infrastructure Subsystem Topology'
  },
  'start-simulation': {
    title: 'Start Simulation',
    subtitle: 'Configure and inject infrastructure failure cascades'
  },
  'what-if': {
    title: 'What-if Analysis',
    subtitle: 'Multi-Criteria Decision Analysis & Strategy Evaluation'
  },
  'incident-timeline': {
    title: 'Incident Timeline',
    subtitle: 'Temporal cascade propagation & incident milestone tracking'
  },
  'risk-resilience': {
    title: 'Risk & Resilience',
    subtitle: 'Infrastructure vulnerability assessment & resilience analytics'
  },
  'reports': {
    title: 'Reports',
    subtitle: 'Generate and export resilience & incident audit reports'
  },
  'settings': {
    title: 'Settings',
    subtitle: 'Hospital infrastructure configuration & simulation parameters'
  }
}

export default function Header({
  activeSection = 'dashboard',
  resilience,
  scenarioName = 'BASELINE 100% OPERATIONAL',
  assetsCount = 52,
  servicesCount = 8,
  alertsCount = 0,
  connectionStatus = 'disconnected',
  lastUpdated = null,
  theme = 'dark',
  onToggleTheme,
  onReconnect,
  onReset,
  isResetting = false
}) {
  const [timeStr, setTimeStr] = useState('')
  const [dateStr, setDateStr] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      // e.g. 10:24 AM
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      // e.g. 20 Sep 2026
      setDateStr(now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const pageInfo = PAGE_TITLES[activeSection] || PAGE_TITLES['dashboard']
  const isLive = connectionStatus === 'connected'

  return (
    <header className="cmd-header">
      {/* LEFT: Dynamic Page Title & Subtitle */}
      <div className="cmd-header-left">
        <h1 className="header-page-title">{pageInfo.title}</h1>
        <span className="header-page-subtitle">{pageInfo.subtitle}</span>
      </div>

      {/* RIGHT: Theme Toggle, Date, Time, Notifications, User/Team, Baseline Reset */}
      <div className="cmd-header-right">
        {/* Reset Baseline Action Button */}
        <button
          type="button"
          className="header-action-btn header-reset-btn"
          onClick={onReset}
          disabled={isResetting}
          title="Reset hospital digital twin to 100% operational baseline"
        >
          <RotateCcw size={13} className={`header-btn-icon ${isResetting ? 'animate-spin' : ''}`} />
          <span>{isResetting ? 'Resetting...' : 'Reset Baseline'}</span>
        </button>

        {/* Live Stream Status Pill */}
        <div
          className={`header-stream-pill ${isLive ? 'is-live' : 'is-standby'}`}
          onClick={!isLive && onReconnect ? onReconnect : undefined}
          title={isLive ? 'Live 1s WebSocket Telemetry' : 'Click to reconnect stream'}
        >
          <span className={`stream-dot ${isLive ? 'stream-dot-pulse' : ''}`} />
          <span className="stream-text font-mono">{isLive ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        <div className="header-divider" />

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="header-icon-btn theme-toggle-btn"
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun size={16} className="theme-icon sun-icon" />
          ) : (
            <Moon size={16} className="theme-icon moon-icon" />
          )}
        </button>

        {/* Live Date */}
        <div className="header-meta-item header-date font-mono">
          {dateStr || '20 Sep 2026'}
        </div>

        {/* Live Clock */}
        <div className="header-meta-item header-time font-mono">
          {timeStr || '10:24 AM'}
        </div>

        {/* Notification Bell */}
        <div className="header-bell-wrapper" title={`${alertsCount} Active Alerts`}>
          <button type="button" className="header-icon-btn header-bell-btn">
            <Bell size={16} />
            {alertsCount > 0 && (
              <span className="header-bell-badge">{alertsCount}</span>
            )}
          </button>
        </div>

        {/* User / Team Avatar Pill */}
        <div className="header-user-pill">
          <div className="user-avatar-circle">RH</div>
          <span className="user-team-name">Team Mode</span>
          <ChevronDown size={14} className="user-chevron" />
        </div>
      </div>
    </header>
  )
}
