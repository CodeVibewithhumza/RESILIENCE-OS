import { useState, useEffect } from 'react'
import {
  Activity,
  Clock,
  RotateCcw,
  Radio,
  Server,
  HeartPulse,
  AlertTriangle
} from 'lucide-react'
import './Header.css'

export default function Header({
  resilience,
  scenarioName = 'BASELINE 100% OPERATIONAL',
  assetsCount = 11,
  servicesCount = 5,
  alertsCount = 0,
  connectionStatus = 'disconnected',
  lastUpdated = null,
  onReconnect,
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
  const statusSub = isCritical
    ? 'Grid Disruption Active'
    : alertsCount > 0
    ? `${alertsCount} Active Alerts`
    : 'All systems nominal'

  const isLive = connectionStatus === 'connected'
  const isConnecting = connectionStatus === 'connecting'
  const isReconnecting = connectionStatus === 'reconnecting'

  const connLabel = isLive
    ? 'LIVE'
    : isConnecting
    ? 'CONNECTING'
    : isReconnecting
    ? 'RECONNECTING'
    : 'OFFLINE'

  const connColor = isLive
    ? 'var(--status-normal)'
    : isConnecting || isReconnecting
    ? 'var(--status-warning)'
    : 'var(--text-muted)'

  const connSub = isLive
    ? '1s Telemetry'
    : isConnecting
    ? 'Connecting...'
    : isReconnecting
    ? 'Auto-retrying'
    : 'Demo Fallback'

  return (
    <header className="cmd-header">
      {/* LEFT: Compact ResilienceOS Identity & Command Center Title */}
      <div className="cmd-header-left">
        <div className="cmd-identity-block">
          <div className="cmd-heartbeat-box">
            <Activity size={18} className="cmd-heartbeat-icon" />
          </div>
          <div className="cmd-brand-titles">
            <div className="cmd-brand-row">
              <span className="cmd-brand-text">
                RESILIENCE<span className="cmd-brand-accent">OS</span>
              </span>
              <span className="cmd-center-tag">OPERATIONS COMMAND CENTER</span>
            </div>
            <span className="cmd-tagline">
              Real-time Monitoring • Predict • Simulate • Strengthen
            </span>
          </div>
        </div>
      </div>

      {/* CENTER & RIGHT: Telemetry, Scenario, Status, Counts, Clock & Reset */}
      <div className="cmd-header-right">
        {/* Scenario Indicator */}
        <div className="cmd-telemetry-item cmd-scenario-item" title="Current Active Scenario">
          <Radio size={12} className="cmd-scenario-icon" />
          <div className="cmd-item-col">
            <span className="cmd-label">Scenario</span>
            <span className="cmd-value cmd-scenario-text font-mono">
              {scenarioName.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="cmd-sep" />

        {/* System Status Indicator with Subtitle */}
        <div
          className={`cmd-telemetry-item cmd-status-item ${isCritical ? 'is-critical-status' : ''}`}
          title="Overall Infrastructure Operational Status"
        >
          <span
            className="status-dot status-dot-pulse"
            style={{ backgroundColor: statusColor }}
          />
          <div className="cmd-item-col">
            <div className="cmd-status-headline-row">
              <span className="cmd-label">System Status:</span>
              <span className="cmd-status-bold" style={{ color: statusColor }}>
                {statusLabel}
              </span>
            </div>
            <span className="cmd-sub-status font-mono">{statusSub}</span>
          </div>
        </div>

        <div className="cmd-sep" />

        {/* Real-Time WebSocket Telemetry Stream Indicator */}
        <div
          className={`cmd-telemetry-item cmd-connection-item is-conn-${connectionStatus}`}
          title={
            isLive
              ? `Real-Time Telemetry Stream Connected (1s sync)${lastUpdated ? ` • Last updated: ${lastUpdated.toLocaleTimeString()}` : ''}`
              : isConnecting
              ? 'Connecting to ResilienceOS WebSocket Telemetry stream...'
              : isReconnecting
              ? 'Reconnecting to ResilienceOS WebSocket Telemetry stream (click to retry)...'
              : 'WebSocket Telemetry Disconnected — Running in Demo Fallback Mode (click to retry)'
          }
          onClick={!isLive && onReconnect ? onReconnect : undefined}
          style={{ cursor: !isLive && onReconnect ? 'pointer' : 'default' }}
        >
          <span
            className={`status-dot ${isLive || isConnecting || isReconnecting ? 'status-dot-pulse' : ''}`}
            style={{ backgroundColor: connColor }}
          />
          <div className="cmd-item-col">
            <div className="cmd-status-headline-row">
              <span className="cmd-label">Stream:</span>
              <span className="cmd-status-bold font-mono" style={{ color: connColor }}>
                {connLabel}
              </span>
            </div>
            <span className="cmd-sub-status font-mono">{connSub}</span>
          </div>
        </div>

        <div className="cmd-sep" />

        {/* Quick Resource Counters: Assets, Services, Alerts */}
        <div className="cmd-counters-group">
          {/* Assets Count */}
          <div className="cmd-counter-pill" title="Total Monitored Infrastructure Assets">
            <Server size={11} className="cmd-counter-icon" />
            <span className="cmd-counter-val font-mono">{assetsCount}</span>
            <span className="cmd-counter-lbl">Assets</span>
          </div>

          {/* Services Count */}
          <div className="cmd-counter-pill" title="Monitored Clinical Care Units">
            <HeartPulse size={11} className="cmd-counter-icon" />
            <span className="cmd-counter-val font-mono">{servicesCount}</span>
            <span className="cmd-counter-lbl">Services</span>
          </div>

          {/* Alerts Count */}
          <div
            className={`cmd-counter-pill ${alertsCount > 0 ? 'is-alert-pill' : ''}`}
            title="Active Infrastructure System Alerts"
          >
            <AlertTriangle
              size={11}
              style={{
                color: alertsCount > 0 ? 'var(--status-critical)' : 'var(--status-normal)'
              }}
            />
            <span
              className="cmd-counter-val font-mono"
              style={{
                color: alertsCount > 0 ? 'var(--status-critical)' : 'var(--text-primary)'
              }}
            >
              {alertsCount}
            </span>
            <span className="cmd-counter-lbl">Alerts</span>
          </div>
        </div>

        <div className="cmd-sep" />

        {/* Live UTC Clock */}
        <div className="cmd-telemetry-item cmd-clock-item" title="Coordinated Universal Time">
          <Clock size={12} className="cmd-clock-icon" />
          <span className="cmd-value font-mono">{timeStr} UTC</span>
        </div>

        {/* Reset Baseline Action Button */}
        <button
          type="button"
          className="cmd-reset-btn"
          onClick={onReset}
          title="Reset hospital digital twin to 100% operational baseline"
        >
          <RotateCcw size={12} className="cmd-reset-icon" />
          <span>Reset Baseline</span>
        </button>
      </div>
    </header>
  )
}
