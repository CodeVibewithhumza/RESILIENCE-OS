import { useState } from 'react'
import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  Sliders,
  Clock,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Building2
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({
  activeSection = 'dashboard',
  onNavigate,
  incidentActive = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'digital-twin',
      label: 'Digital Twin',
      icon: Layers,
      badge: '3D'
    },
    {
      id: 'start-simulation',
      label: 'Start Simulation',
      icon: PlayCircle,
      badge: incidentActive ? 'ACTIVE' : null,
      badgeType: incidentActive ? 'critical' : 'normal'
    },
    {
      id: 'what-if',
      label: 'What-If Analysis',
      icon: Sliders,
      badge: '6 Labs'
    },
    {
      id: 'incident-timeline',
      label: 'Incident Timeline',
      icon: Clock,
      badge: null
    },
    {
      id: 'risk-resilience',
      label: 'Risk & Resilience',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: null
    }
  ]

  const systemItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      badge: 'v1.0'
    }
  ]

  const handleNavClick = (id) => {
    if (onNavigate) {
      onNavigate(id)
    }
    const targetElement = document.getElementById(id)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <aside className={`command-sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* 1. Sidebar Top Domain Identity Card */}
      <div className="sidebar-top">
        <div className="sidebar-domain-info">
          <div className="sidebar-domain-badge">
            <Building2 size={16} className="sidebar-domain-icon" />
          </div>
          {!isCollapsed && (
            <div className="domain-meta">
              <span className="domain-title">Hospital Infrastructure</span>
              <span className="domain-sub">Digital Twin OS</span>
              <span className="domain-tagline">Predict • Prepare • Protect</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* 2. Main Navigation Section */}
      <nav className="sidebar-nav">
        {/* CORE OPERATIONS */}
        <div className="sidebar-nav-group">
          {!isCollapsed && (
            <span className="sidebar-group-label">Core Operations</span>
          )}
          <ul className="sidebar-menu">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={16} className="nav-btn-icon" />
                    {!isCollapsed && (
                      <>
                        <span className="nav-btn-label">{item.label}</span>
                        {item.badge && (
                          <span
                            className={`nav-btn-badge ${
                              item.badgeType === 'critical'
                                ? 'badge-critical'
                                : 'badge-subtle'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* SYSTEM VIEWS */}
        <div className="sidebar-nav-group">
          {!isCollapsed && (
            <span className="sidebar-group-label">System</span>
          )}
          <ul className="sidebar-menu">
            {systemItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={`sidebar-nav-btn ${isActive ? 'is-active' : ''}`}
                    onClick={() => handleNavClick(item.id)}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon size={16} className="nav-btn-icon" />
                    {!isCollapsed && (
                      <>
                        <span className="nav-btn-label">{item.label}</span>
                        <span className="nav-btn-badge badge-subtle">
                          {item.badge}
                        </span>
                      </>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* 3. Bottom Digital Twin Engine Status Panel */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-telemetry-box">
            <div className="telemetry-header">
              <Radio size={12} className="telemetry-icon" />
              <span>SIMULATION ENGINE</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">State:</span>
              <span
                className="telemetry-val font-mono"
                style={{
                  color: 'var(--status-normal)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5
                }}
              >
                <span
                  className="status-dot status-dot-pulse"
                  style={{ backgroundColor: 'var(--status-normal)', width: 6, height: 6 }}
                />
                SYNCHRONIZED
              </span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">Nodes:</span>
              <span className="telemetry-val font-mono">52 Monitored</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">Subsystems:</span>
              <span className="telemetry-val font-mono">6 Connected</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">Last Sync:</span>
              <span className="telemetry-val font-mono" style={{ color: 'var(--text-muted)' }}>
                Real-time 1s
              </span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
