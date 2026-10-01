import { useState, useMemo } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  X,
  Activity,
  Zap,
  ExternalLink,
  ChevronRight,
  Clock,
  Layers,
  Check
} from 'lucide-react'
import './Header.css'

export default function NotificationFlyout({
  isOpen,
  onClose,
  incident = {},
  assets = [],
  services = [],
  timeline = [],
  onNavigate,
  onSelectAsset,
  onSelectService
}) {
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'critical' | 'services' | 'assets'
  const [clearedIds, setClearedIds] = useState(new Set())

  // Generate dynamic notification alerts from active system state
  const notifications = useMemo(() => {
    const list = []

    // 1. Source Incident Alert (Highest Priority)
    if (incident?.is_active) {
      list.push({
        id: 'incident-root',
        type: 'critical',
        severity: 'critical',
        category: 'incident',
        title: `CRITICAL DISRUPTION: ${incident.source_asset_id || 'System Failure'}`,
        message:
          incident.title ||
          incident.description ||
          `Primary failure injected on ${incident.source_asset_id}. Active cascade underway.`,
        timestamp: 'Active Now',
        assetId: incident.source_asset_id,
        targetSection: 'start-simulation'
      })
    }

    // 2. Services At Risk Alerts
    if (Array.isArray(services)) {
      services.forEach((s) => {
        if (s.at_risk || s.status === 'compromised' || s.status === 'critical_only' || (typeof s.service_continuity_pct === 'number' && s.service_continuity_pct < 95)) {
          const isCompromised = s.status === 'compromised' || (s.service_continuity_pct != null && s.service_continuity_pct < 50)
          list.push({
            id: `service-${s.id}`,
            type: isCompromised ? 'critical' : 'warning',
            severity: isCompromised ? 'critical' : 'degraded',
            category: 'services',
            title: `${s.name || s.id} Compromised`,
            message: `Continuity at ${s.service_continuity_pct ?? 50}%. ${
              s.clinical_impact_summary || 'Clinical service running on emergency backup capacity.'
            }`,
            timestamp: 'T + 00:05',
            serviceId: s.id,
            targetSection: 'dashboard'
          })
        }
      })
    }

    // 3. Degraded / Failed Infrastructure Assets
    if (Array.isArray(assets)) {
      assets.forEach((a) => {
        if (a.status === 'failed' || a.status === 'critical' || a.status === 'degraded') {
          // Avoid duplicate of root failure
          if (a.id === incident?.source_asset_id && incident?.is_active) return

          const isFailed = a.status === 'failed' || a.status === 'critical'
          list.push({
            id: `asset-${a.id}`,
            type: isFailed ? 'critical' : 'warning',
            severity: a.status,
            category: 'assets',
            title: `${a.name || a.id} [${a.status.toUpperCase()}]`,
            message: `Health Score: ${Math.round(a.health_score || 0)}%. ${
              a.current_load ? `Load: ${a.current_load} ${a.capacity_unit || 'kW'}` : 'Operating under secondary stress.'
            }`,
            timestamp: 'Live Alert',
            assetId: a.id,
            targetSection: 'digital-twin'
          })
        }
      })
    }

    // 4. Milestone / Timeline Events if available
    if (Array.isArray(timeline) && timeline.length > 0 && incident?.is_active) {
      timeline.slice(0, 3).forEach((t, idx) => {
        list.push({
          id: `timeline-${idx}`,
          type: 'info',
          severity: 'info',
          category: 'timeline',
          title: `Milestone: ${t.title || `Phase ${idx + 1}`}`,
          message: t.description || `Cascade stage reached at T+${t.t_offset_min || idx * 5} min.`,
          timestamp: `T+${t.t_offset_min || 0}m`,
          targetSection: 'incident-timeline'
        })
      })
    }

    return list
  }, [incident, services, assets, timeline])

  // Filter out cleared alerts
  const activeAlerts = useMemo(() => {
    return notifications.filter((n) => !clearedIds.has(n.id))
  }, [notifications, clearedIds])

  // Category filtering
  const filteredAlerts = useMemo(() => {
    if (activeFilter === 'critical') {
      return activeAlerts.filter((n) => n.severity === 'critical' || n.severity === 'failed')
    }
    if (activeFilter === 'services') {
      return activeAlerts.filter((n) => n.category === 'services')
    }
    if (activeFilter === 'assets') {
      return activeAlerts.filter((n) => n.category === 'assets' || n.category === 'incident')
    }
    return activeAlerts
  }, [activeAlerts, activeFilter])

  const criticalCount = activeAlerts.filter(
    (n) => n.severity === 'critical' || n.severity === 'failed'
  ).length

  const handleClearAll = () => {
    const allIds = new Set(notifications.map((n) => n.id))
    setClearedIds(allIds)
  }

  const handleItemClick = (item) => {
    if (item.assetId && onSelectAsset) {
      onSelectAsset(item.assetId)
    }
    if (item.serviceId && onSelectService) {
      onSelectService(item.serviceId)
    }
    if (item.targetSection && onNavigate) {
      onNavigate(item.targetSection)
    }
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="header-notification-dropdown" onClick={(e) => e.stopPropagation()}>
      {/* 1. Header Bar */}
      <div className="notif-dropdown-header">
        <div className="notif-header-left">
          <div className="notif-title-row">
            <span className="notif-title">Command Notifications</span>
            {criticalCount > 0 ? (
              <span className="notif-badge-critical font-mono">
                {criticalCount} Critical
              </span>
            ) : (
              <span className="notif-badge-nominal font-mono">
                {activeAlerts.length} Active
              </span>
            )}
          </div>
          <span className="notif-subtitle">Real-time telemetry, service alerts & cascade events</span>
        </div>

        <div className="notif-header-actions">
          {activeAlerts.length > 0 && (
            <button
              type="button"
              className="notif-action-btn font-mono"
              onClick={handleClearAll}
              title="Acknowledge and clear alerts"
            >
              <Check size={12} />
              <span>Acknowledge All</span>
            </button>
          )}
          <button
            type="button"
            className="notif-close-btn"
            onClick={onClose}
            title="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 2. Filter Pills */}
      <div className="notif-filter-tabs">
        <button
          type="button"
          className={`notif-tab ${activeFilter === 'all' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          <span>All</span>
          <span className="notif-tab-count font-mono">{activeAlerts.length}</span>
        </button>

        <button
          type="button"
          className={`notif-tab notif-tab-crit ${activeFilter === 'critical' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('critical')}
        >
          <span>Critical</span>
          <span className="notif-tab-count font-mono">{criticalCount}</span>
        </button>

        <button
          type="button"
          className={`notif-tab ${activeFilter === 'services' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('services')}
        >
          <span>Services</span>
          <span className="notif-tab-count font-mono">
            {activeAlerts.filter((n) => n.category === 'services').length}
          </span>
        </button>

        <button
          type="button"
          className={`notif-tab ${activeFilter === 'assets' ? 'is-active' : ''}`}
          onClick={() => setActiveFilter('assets')}
        >
          <span>Assets</span>
          <span className="notif-tab-count font-mono">
            {activeAlerts.filter((n) => n.category === 'assets' || n.category === 'incident').length}
          </span>
        </button>
      </div>

      {/* 3. Notification Items List */}
      <div className="notif-list-body">
        {filteredAlerts.length === 0 ? (
          <div className="notif-empty-state">
            <div className="notif-empty-icon">
              <CheckCircle2 size={28} style={{ color: '#10B981' }} />
            </div>
            <div className="notif-empty-title">All Systems Nominal</div>
            <div className="notif-empty-desc">
              No active distress alerts matching current filter. Hospital infrastructure is operating within baseline parameters.
            </div>
          </div>
        ) : (
          filteredAlerts.map((item) => {
            const isCrit = item.severity === 'critical' || item.severity === 'failed'
            const isWarn = item.severity === 'degraded' || item.severity === 'warning'

            return (
              <div
                key={item.id}
                className={`notif-card-item severity-${item.severity}`}
                onClick={() => handleItemClick(item)}
                title="Click to inspect in system view"
              >
                <div className="notif-item-icon-col">
                  {isCrit ? (
                    <div className="notif-icon-circle icon-crit">
                      <AlertTriangle size={14} />
                    </div>
                  ) : isWarn ? (
                    <div className="notif-icon-circle icon-warn">
                      <Activity size={14} />
                    </div>
                  ) : (
                    <div className="notif-icon-circle icon-info">
                      <Clock size={14} />
                    </div>
                  )}
                </div>

                <div className="notif-item-content">
                  <div className="notif-item-header">
                    <span className="notif-item-title">{item.title}</span>
                    <span className="notif-item-time font-mono">{item.timestamp}</span>
                  </div>
                  <div className="notif-item-msg">{item.message}</div>
                </div>

                <div className="notif-item-arrow">
                  <ChevronRight size={14} />
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 4. Footer Quick Navigation Bar */}
      <div className="notif-dropdown-footer">
        <button
          type="button"
          className="notif-footer-link font-mono"
          onClick={() => {
            if (onNavigate) onNavigate('incident-timeline')
            if (onClose) onClose()
          }}
        >
          <span>View Incident Timeline</span>
          <ExternalLink size={12} />
        </button>

        <button
          type="button"
          className="notif-footer-link font-mono"
          onClick={() => {
            if (onNavigate) onNavigate('digital-twin')
            if (onClose) onClose()
          }}
        >
          <span>Inspect 3D Digital Twin</span>
          <ExternalLink size={12} />
        </button>
      </div>
    </div>
  )
}
