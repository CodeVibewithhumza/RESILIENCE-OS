import { useState, useEffect, useRef } from 'react'
import {
  Home,
  Box,
  PlayCircle,
  TrendingUp,
  Clock,
  ShieldCheck,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import './Sidebar.css'

export default function Sidebar({
  activeSection = 'dashboard',
  onNavigate,
  incidentActive = false,
  isCollapsed = false,
  isMobileOpen = false,
  onToggleCollapse,
  onCloseMobile,
  width,
  onResizeWidth
}) {
  const [isResizing, setIsResizing] = useState(false)
  const isResizingRef = useRef(false)

  const handleMouseDown = (e) => {
    e.preventDefault()
    e.stopPropagation()
    isResizingRef.current = true
    setIsResizing(true)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

  const handleTouchStart = (e) => {
    e.stopPropagation()
    isResizingRef.current = true
    setIsResizing(true)
  }

  const handleDoubleClick = () => {
    if (onToggleCollapse) {
      onToggleCollapse()
    } else if (onResizeWidth) {
      onResizeWidth(isCollapsed ? 240 : 68)
    }
  }

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!isResizingRef.current || !onResizeWidth) return
      const clientX = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0]?.clientX)
      if (clientX === undefined) return

      // Snap to collapsed below 105px, otherwise clamp between 130px and 450px
      if (clientX < 105) {
        onResizeWidth(68)
      } else {
        const clampedWidth = Math.min(Math.max(Math.round(clientX), 130), 450)
        onResizeWidth(clampedWidth)
      }
    }

    const handlePointerUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false
        setIsResizing(false)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', handlePointerMove)
    window.addEventListener('mouseup', handlePointerUp)
    window.addEventListener('touchmove', handlePointerMove, { passive: true })
    window.addEventListener('touchend', handlePointerUp)

    return () => {
      window.removeEventListener('mousemove', handlePointerMove)
      window.removeEventListener('mouseup', handlePointerUp)
      window.removeEventListener('touchmove', handlePointerMove)
      window.removeEventListener('touchend', handlePointerUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [onResizeWidth])
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      id: 'digital-twin',
      label: 'Digital Twin',
      icon: Box
    },
    {
      id: 'start-simulation',
      label: 'Start Simulation',
      icon: PlayCircle
    },
    {
      id: 'what-if',
      label: 'What-If Analysis',
      icon: TrendingUp
    },
    {
      id: 'incident-timeline',
      label: 'Incident Timeline',
      icon: Clock
    },
    {
      id: 'risk-resilience',
      label: 'Risk & Resilience',
      icon: ShieldCheck
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText
    }
  ]

  const systemItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
  ]

  const handleNavClick = (id) => {
    if (onNavigate) {
      onNavigate(id)
    }
    if (onCloseMobile) {
      onCloseMobile()
    }
  }

  return (
    <aside
      className={`command-sidebar ${isCollapsed ? 'is-collapsed' : ''} ${
        isMobileOpen ? 'is-mobile-open' : ''
      } ${isResizing ? 'is-resizing' : ''}`}
      style={!isCollapsed && width ? { width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` } : undefined}
      aria-label="Sidebar Navigation"
    >
      {/* Mobile Drawer Close Button */}
      {isMobileOpen && (
        <button
          type="button"
          className="sidebar-mobile-close-btn"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
        >
          <X size={18} />
        </button>
      )}

      {/* 1. Sidebar Top Domain Brand Header & Vector Hospital Skyline Logo */}
      <div className="sidebar-top-branding">
        <div
          className="sidebar-logo-graphic"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onToggleCollapse && onToggleCollapse()
            }
          }}
        >
          <svg
            width={isCollapsed ? '34' : '44'}
            height={isCollapsed ? '34' : '44'}
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="sidebar-brand-svg-logo"
          >
            {/* Left Wing Building */}
            <path
              d="M6 21H15V40H6V21Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <rect x="8.5" y="25" width="2.5" height="3" rx="0.5" fill="currentColor" />
            <rect x="8.5" y="30" width="2.5" height="3" rx="0.5" fill="currentColor" />
            <rect x="8.5" y="35" width="2.5" height="3" rx="0.5" fill="currentColor" />

            {/* Right Wing Building */}
            <path
              d="M33 18H42V40H33V18Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.08"
            />
            <rect x="36.5" y="22" width="2.5" height="3" rx="0.5" fill="currentColor" />
            <rect x="36.5" y="27.5" width="2.5" height="3" rx="0.5" fill="currentColor" />
            <rect x="36.5" y="33" width="2.5" height="3" rx="0.5" fill="currentColor" />

            {/* Center Main Hospital Tower */}
            <path
              d="M15 9H33V40H15V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="currentColor"
              fillOpacity="0.12"
            />

            {/* Medical Cross */}
            <rect x="22.25" y="13.5" width="3.5" height="11" rx="0.75" fill="currentColor" />
            <rect x="18.5" y="17.25" width="11" height="3.5" rx="0.75" fill="currentColor" />

            {/* Center Windows */}
            <rect x="18.5" y="27.5" width="3" height="3" rx="0.5" fill="currentColor" />
            <rect x="26.5" y="27.5" width="3" height="3" rx="0.5" fill="currentColor" />
            <rect x="18.5" y="33.5" width="3" height="3" rx="0.5" fill="currentColor" />
            <rect x="26.5" y="33.5" width="3" height="3" rx="0.5" fill="currentColor" />

            {/* Ground Baseline with Pulse / ECG Rhythm */}
            <path
              d="M3 41H12L14 38L16.5 44L19 39.5L21 41H45"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {(!isCollapsed || isMobileOpen) && (
          <div className="sidebar-brand-text">
            <div className="brand-main-title">
              Resilience<span className="brand-accent-text">OS</span>
            </div>
            <div className="brand-sub-line1">Hospital Infrastructure</div>
            <div className="brand-sub-line2">Digital Twin</div>
          </div>
        )}
      </div>

      {/* 2. Main Navigation Section */}
      <nav className="sidebar-nav">
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
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <Icon size={18} className="nav-btn-icon" />
                    {(!isCollapsed || isMobileOpen) && <span className="nav-btn-label">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {/* SYSTEM Header & Settings link */}
        <div className="sidebar-nav-group system-group">
          <div className="system-group-divider" />
          {(!isCollapsed || isMobileOpen) && <span className="sidebar-group-label">SYSTEM</span>}
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
                    title={isCollapsed && !isMobileOpen ? item.label : undefined}
                    aria-label={item.label}
                  >
                    <Icon size={18} className="nav-btn-icon" />
                    {(!isCollapsed || isMobileOpen) && <span className="nav-btn-label">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>

      {/* 3. Bottom Simulation Mode Badge & Collapse Toggle */}
      <div className="sidebar-footer">
        {(!isCollapsed || isMobileOpen) ? (
          <div className="sidebar-sim-mode-card">
            <div className="sim-mode-status-row">
              <span className="sim-mode-dot" />
              <span className="sim-mode-title">SIMULATION MODE</span>
            </div>
            <div className="sim-mode-sub">Synthetic Infrastructure Data</div>
            <div className="sim-mode-version">v0.1 • Prototype</div>
          </div>
        ) : (
          <div className="sidebar-sim-dot-only" title="Simulation Mode Active: Synthetic Infrastructure">
            <span className="sim-mode-dot" />
          </div>
        )}

        {/* Desktop / Laptop Collapse Toggle Button */}
        {onToggleCollapse && (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <span className="collapse-icon-wrap">
              {isCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </span>
            {!isCollapsed && (
              <>
                <span className="collapse-btn-text">Collapse Menu</span>
                <span className="collapse-shortcut-tag">Ctrl+B</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Draggable Sidebar Resizer Handle Bar */}
      {!isMobileOpen && (
        <div
          className={`sidebar-resizer-handle ${isResizing ? 'is-active' : ''}`}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClick}
          title="Drag horizontally to resize sidebar width (Double-click to toggle collapse)"
          role="separator"
          aria-orientation="vertical"
        >
          <div className="sidebar-resizer-line" />
        </div>
      )}
    </aside>
  )
}
