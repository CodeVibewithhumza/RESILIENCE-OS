import { useState } from 'react'
import {
  LayoutDashboard,
  Layers,
  AlertOctagon,
  ShieldCheck,
  Sliders,
  Server,
  HeartPulse,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Radio,
  Activity
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({
  activeSection = 'overview',
  onNavigate,
  incidentActive = false
}) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const navItems = [
    {
      id: 'overview',
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
      id: 'incident-control',
      label: 'Incident Simulation',
      icon: AlertOctagon,
      badge: incidentActive ? 'ACTIVE' : null,
      badgeType: incidentActive ? 'critical' : 'normal'
    },
    {
      id: 'resilience-cascade',
      label: 'Risk & Resilience',
      icon: ShieldCheck,
      badge: null
    },
    {
      id: 'strategy-lab',
      label: 'What-if Analysis',
      icon: Sliders,
      badge: '6 Labs'
    },
    {
      id: 'assets',
      label: 'Assets Catalog',
      icon: Server,
      badge: '11'
    },
    {
      id: 'services',
      label: 'Critical Services',
      icon: HeartPulse,
      badge: '5'
    }
  ]

  const placeholderItems = [
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      badge: 'Read-only'
    },
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
      {/* Sidebar Header with Facility Indicator */}
      <div className="sidebar-top">
        <div className="sidebar-facility-info">
          <div className="sidebar-pulse-indicator">
            <span className="sidebar-pulse-dot" />
            <Activity size={16} className="sidebar-pulse-icon" />
          </div>
          {!isCollapsed && (
            <div className="facility-meta">
              <span className="facility-title">CENTRAL MEDICAL</span>
              <span className="facility-sub">Level 1 Trauma Facility</span>
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

      {/* Main Navigation Section */}
      <nav className="sidebar-nav">
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

        {/* System & Support Group (Visual Placeholders without fake actions) */}
        <div className="sidebar-nav-group">
          {!isCollapsed && (
            <span className="sidebar-group-label">System Views</span>
          )}
          <ul className="sidebar-menu">
            {placeholderItems.map((item) => {
              const Icon = item.icon

              return (
                <li key={item.id}>
                  <div
                    className="sidebar-nav-btn is-placeholder"
                    title={isCollapsed ? `${item.label} (System)` : undefined}
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
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* Sidebar Footer Live Telemetry Snapshot */}
      {!isCollapsed && (
        <div className="sidebar-footer">
          <div className="sidebar-telemetry-box">
            <div className="telemetry-header">
              <Radio size={12} className="telemetry-icon" />
              <span>Digital Twin Engine</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">State:</span>
              <span className="telemetry-val font-mono" style={{ color: 'var(--status-normal)' }}>
                SYNCHRONIZED
              </span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">Nodes:</span>
              <span className="telemetry-val font-mono">11 Active Topo</span>
            </div>
            <div className="telemetry-row">
              <span className="telemetry-key">Subsystems:</span>
              <span className="telemetry-val font-mono">5 Monitored</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}
