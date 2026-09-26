import {
  LayoutDashboard,
  Layers,
  PlayCircle,
  Sliders,
  Clock,
  ShieldCheck,
  FileText,
  Settings,
  Building2,
  Radio
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({
  activeSection = 'dashboard',
  onNavigate,
  incidentActive = false
}) {
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
      label: 'What-if Analysis',
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
      badge: null
    }
  ]

  const handleNavClick = (id) => {
    if (onNavigate) {
      onNavigate(id)
    }
  }

  return (
    <aside className="command-sidebar">
      {/* 1. Sidebar Top Domain Brand Header */}
      <div className="sidebar-top">
        <div className="sidebar-domain-info">
          <div className="sidebar-domain-badge">
            <Building2 size={18} className="sidebar-domain-icon" />
          </div>
          <div className="domain-meta">
            <span className="domain-title">
              Resilience<span className="domain-title-accent">OS</span>
            </span>
            <span className="domain-sub">Hospital Infrastructure Digital Twin</span>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Section */}
      <nav className="sidebar-nav">
        {/* CORE OPERATIONS */}
        <div className="sidebar-nav-group">
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
                  >
                    <Icon size={17} className="nav-btn-icon" />
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
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* SYSTEM */}
        <div className="sidebar-nav-group">
          <span className="sidebar-group-label">SYSTEM</span>
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
                  >
                    <Icon size={17} className="nav-btn-icon" />
                    <span className="nav-btn-label">{item.label}</span>
                    {item.badge && (
                      <span className="nav-btn-badge badge-subtle">
                        {item.badge}
                      </span>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* 3. Bottom Simulation Mode Card */}
      <div className="sidebar-footer">
        <div className="sidebar-sim-mode-card">
          <div className="sim-mode-status-row">
            <span className="sim-mode-dot" />
            <span className="sim-mode-title">SIMULATION MODE</span>
          </div>
          <span className="sim-mode-sub">Synthetic Infrastructure Data</span>
        </div>
      </div>
    </aside>
  )
}
