import { useState, useEffect, useRef } from 'react'
import { getWebSocketUrl } from '../config/api'

/**
 * Singleton Real-Time Connection Manager for ResilienceOS.
 * Ensures exactly ONE telemetry and ONE twin WebSocket connection
 * across the entire application lifecycle, handling React 19 StrictMode,
 * bounded-backoff reconnection, and Vite HMR without leaking connections.
 */
class RealtimeConnectionManager {
  constructor() {
    this.telemetryWs = null
    this.twinWs = null
    this.subscribers = new Set()
    this.subscribersCount = 0

    this.connectionStatus = 'disconnected'
    this.telemetry = null
    this.resilienceScore = null
    this.statusLabel = null
    this.lastUpdated = null
    this.latestTwinEvent = null

    this.retryTimer = null
    this.retryCount = 0
    this.teardownTimer = null
    this.initialRetryDelay = 1000
    this.maxRetryDelay = 10000
    this.backoffMultiplier = 1.5

    this.handleOnline = this.handleOnline.bind(this)
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this)
    this.listenersBound = false
  }

  bindWindowListeners() {
    if (this.listenersBound || typeof window === 'undefined') return
    window.addEventListener('online', this.handleOnline)
    document.addEventListener('visibilitychange', this.handleVisibilityChange)
    this.listenersBound = true
  }

  unbindWindowListeners() {
    if (!this.listenersBound || typeof window === 'undefined') return
    window.removeEventListener('online', this.handleOnline)
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    this.listenersBound = false
  }

  handleOnline() {
    if (this.connectionStatus !== 'connected' && this.subscribersCount > 0) {
      this.reconnect()
    }
  }

  handleVisibilityChange() {
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      this.connectionStatus !== 'connected' &&
      this.subscribersCount > 0
    ) {
      this.reconnect()
    }
  }

  getState() {
    return {
      telemetry: this.telemetry,
      resilienceScore: this.resilienceScore,
      statusLabel: this.statusLabel,
      connectionStatus: this.connectionStatus,
      lastUpdated: this.lastUpdated,
      latestTwinEvent: this.latestTwinEvent,
      isLive: this.connectionStatus === 'connected'
    }
  }

  notify(event = null) {
    const currentState = this.getState()
    for (const listener of this.subscribers) {
      try {
        listener(currentState, event)
      } catch {
        // Prevent subscriber error from disrupting other listeners
      }
    }
  }

  subscribe(listener) {
    this.subscribers.add(listener)
    this.subscribersCount++
    this.bindWindowListeners()

    // If a teardown was scheduled (e.g. from React StrictMode unmount/remount), cancel it immediately
    if (this.teardownTimer) {
      clearTimeout(this.teardownTimer)
      this.teardownTimer = null
    }

    // Connect if not already connected or connecting
    const isTelActive =
      this.telemetryWs &&
      (this.telemetryWs.readyState === WebSocket.OPEN ||
        this.telemetryWs.readyState === WebSocket.CONNECTING)
    const isTwinActive =
      this.twinWs &&
      (this.twinWs.readyState === WebSocket.OPEN ||
        this.twinWs.readyState === WebSocket.CONNECTING)

    if (!isTelActive || !isTwinActive) {
      this.connect()
    }

    return () => {
      this.subscribers.delete(listener)
      this.subscribersCount = Math.max(0, this.subscribersCount - 1)

      // When all subscribers are gone, schedule teardown with a short debounce
      // This prevents React 19 StrictMode and rapid route changes from tearing down
      // and recreating sockets within the same render tick.
      if (this.subscribersCount === 0) {
        if (this.teardownTimer) {
          clearTimeout(this.teardownTimer)
        }
        this.teardownTimer = setTimeout(() => {
          this.teardownTimer = null
          if (this.subscribersCount === 0) {
            this.disconnect()
          }
        }, 120)
      }
    }
  }

  safeClose(ws, reason = 'Client cleanup') {
    if (!ws) return
    ws.onmessage = null
    ws.onerror = null

    if (ws.readyState === WebSocket.OPEN) {
      ws.onclose = null
      try {
        ws.close(1000, reason)
      } catch {
        // Ignore
      }
    } else if (ws.readyState === WebSocket.CONNECTING) {
      // If closing while in flight, wait for open before closing to cleanly
      // notify backend without leaving half-open connections
      ws.onopen = () => {
        try {
          ws.close(1000, reason)
        } catch {
          // Ignore
        }
      }
      ws.onclose = null
      try {
        ws.close(1000, reason)
      } catch {
        // Ignore
      }
    }
  }

  syncStatus() {
    const isTelOpen = this.telemetryWs && this.telemetryWs.readyState === WebSocket.OPEN
    const isTwinOpen = this.twinWs && this.twinWs.readyState === WebSocket.OPEN

    if (isTelOpen || isTwinOpen) {
      this.connectionStatus = 'connected'
      this.retryCount = 0
    } else {
      const isTelConnecting =
        this.telemetryWs && this.telemetryWs.readyState === WebSocket.CONNECTING
      const isTwinConnecting =
        this.twinWs && this.twinWs.readyState === WebSocket.CONNECTING

      if (isTelConnecting || isTwinConnecting) {
        this.connectionStatus = this.retryCount > 0 ? 'reconnecting' : 'connecting'
      } else if (this.retryTimer !== null) {
        this.connectionStatus = 'reconnecting'
      } else {
        this.connectionStatus = 'disconnected'
      }
    }

    this.notify()
  }

  connect() {
    // If torn down with no subscribers, do not open
    if (this.subscribersCount === 0) return

    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }

    // 1. Manage Telemetry WebSocket
    const isTelActive =
      this.telemetryWs &&
      (this.telemetryWs.readyState === WebSocket.OPEN ||
        this.telemetryWs.readyState === WebSocket.CONNECTING)

    if (!isTelActive) {
      if (this.telemetryWs) {
        this.safeClose(this.telemetryWs)
        this.telemetryWs = null
      }

      try {
        const telemetryUrl = getWebSocketUrl('telemetry')
        const wsTel = new WebSocket(telemetryUrl)
        this.telemetryWs = wsTel

        wsTel.onopen = () => {
          this.syncStatus()
        }

        wsTel.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (!data || typeof data !== 'object') return

            const rawTelemetry = data.payload?.telemetry ?? data.telemetry ?? null
            const score =
              typeof data.payload?.resilience_score === 'number'
                ? data.payload.resilience_score
                : typeof data.resilience_score === 'number'
                ? data.resilience_score
                : null
            const label = data.payload?.status_label ?? data.status_label ?? null

            if (rawTelemetry) this.telemetry = rawTelemetry
            if (typeof score === 'number') this.resilienceScore = score
            if (typeof label === 'string' && label) this.statusLabel = label
            this.lastUpdated = new Date()

            this.notify({
              type: 'telemetry_tick',
              data: {
                telemetry: rawTelemetry,
                resilienceScore: score,
                statusLabel: label
              }
            })
          } catch {
            // Ignore malformed message
          }
        }

        wsTel.onerror = () => {
          this.syncStatus()
        }

        wsTel.onclose = () => {
          this.telemetryWs = null
          this.syncStatus()
          if (this.subscribersCount > 0) {
            this.scheduleReconnect()
          }
        }
      } catch {
        this.connectionStatus = 'error'
        this.notify()
        this.scheduleReconnect()
      }
    }

    // 2. Manage Twin WebSocket
    const isTwinActive =
      this.twinWs &&
      (this.twinWs.readyState === WebSocket.OPEN ||
        this.twinWs.readyState === WebSocket.CONNECTING)

    if (!isTwinActive) {
      if (this.twinWs) {
        this.safeClose(this.twinWs)
        this.twinWs = null
      }

      try {
        const twinUrl = getWebSocketUrl('twin')
        const wsTwin = new WebSocket(twinUrl)
        this.twinWs = wsTwin

        wsTwin.onopen = () => {
          this.syncStatus()
        }

        wsTwin.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            if (!data || typeof data !== 'object') return

            const eventType = data.type

            if (eventType === 'twin_state_snapshot') {
              const rawTelemetry = data.payload?.telemetry
              const score = data.payload?.resilience_score
              const label = data.payload?.status_label

              if (rawTelemetry) this.telemetry = rawTelemetry
              if (typeof score === 'number') this.resilienceScore = score
              if (typeof label === 'string' && label) this.statusLabel = label
              this.lastUpdated = new Date()

              this.notify({
                type: 'telemetry_tick',
                data: {
                  telemetry: rawTelemetry,
                  resilienceScore: score,
                  statusLabel: label
                }
              })
            } else if (eventType) {
              this.latestTwinEvent = data
              this.lastUpdated = new Date()

              if (eventType === 'hospital_reset') {
                const score = data.payload?.resilience_index
                const rawTel = data.payload?.telemetry
                if (typeof score === 'number') this.resilienceScore = score
                if (rawTel) this.telemetry = rawTel
                this.statusLabel = 'OPTIMAL'
              } else if (eventType === 'strategy_applied') {
                const projScore = data.payload?.projected_resilience_score
                if (typeof projScore === 'number') this.resilienceScore = projScore
              }

              this.notify({
                type: 'twin_event',
                data
              })
            }
          } catch {
            // Ignore malformed message
          }
        }

        wsTwin.onerror = () => {
          this.syncStatus()
        }

        wsTwin.onclose = () => {
          this.twinWs = null
          this.syncStatus()
          if (this.subscribersCount > 0) {
            this.scheduleReconnect()
          }
        }
      } catch {
        // Fallback to telemetry stream if twin fails
      }
    }

    this.syncStatus()
  }

  scheduleReconnect() {
    if (this.retryTimer !== null || this.subscribersCount === 0) return

    // If both sockets are already active/open, no reconnection needed
    const isTelOpen = this.telemetryWs && this.telemetryWs.readyState === WebSocket.OPEN
    const isTwinOpen = this.twinWs && this.twinWs.readyState === WebSocket.OPEN
    if (isTelOpen && isTwinOpen) return

    const currentRetry = this.retryCount
    const expDelay = this.initialRetryDelay * Math.pow(this.backoffMultiplier, currentRetry)
    const jitter = 0.8 + Math.random() * 0.4
    const delay = Math.min(expDelay * jitter, this.maxRetryDelay)

    this.retryCount = currentRetry + 1
    this.connectionStatus = 'reconnecting'
    this.notify()

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null
      if (this.subscribersCount > 0) {
        this.connect()
      }
    }, delay)
  }

  reconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    this.retryCount = 0

    if (this.telemetryWs) {
      this.safeClose(this.telemetryWs)
      this.telemetryWs = null
    }
    if (this.twinWs) {
      this.safeClose(this.twinWs)
      this.twinWs = null
    }

    this.connect()
  }

  disconnect() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
      this.retryTimer = null
    }
    if (this.teardownTimer) {
      clearTimeout(this.teardownTimer)
      this.teardownTimer = null
    }

    this.safeClose(this.telemetryWs)
    this.safeClose(this.twinWs)
    this.telemetryWs = null
    this.twinWs = null

    this.connectionStatus = 'disconnected'
    this.unbindWindowListeners()
    this.notify()
  }

  destroy() {
    this.subscribers.clear()
    this.subscribersCount = 0
    this.disconnect()
  }
}

// Global singleton instance
const realtimeManager = new RealtimeConnectionManager()

// Vite HMR clean teardown of sockets
if (typeof import.meta !== 'undefined' && import.meta.hot) {
  import.meta.hot.dispose(() => {
    realtimeManager.destroy()
  })
}

/**
 * Custom hook consuming the canonical ResilienceOS real-time WebSocket connection.
 * Connects to /ws/telemetry and /ws/twin natively with bounded-backoff reconnection.
 *
 * @param {object} options
 * @param {function} [options.onTelemetryTick] - Optional callback fired when telemetry tick arrives
 * @param {function} [options.onTwinEvent] - Optional callback fired when twin event arrives
 */
export function useResilienceRealtime(options = {}) {
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [state, setState] = useState(() => realtimeManager.getState())

  useEffect(() => {
    const unsubscribe = realtimeManager.subscribe((newState, event) => {
      setState(newState)

      if (event) {
        if (event.type === 'telemetry_tick' && optionsRef.current.onTelemetryTick) {
          optionsRef.current.onTelemetryTick(event.data)
        } else if (event.type === 'twin_event' && optionsRef.current.onTwinEvent) {
          optionsRef.current.onTwinEvent(event.data)
        }
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  return {
    telemetry: state.telemetry,
    resilienceScore: state.resilienceScore,
    statusLabel: state.statusLabel,
    connectionStatus: state.connectionStatus,
    lastUpdated: state.lastUpdated,
    latestTwinEvent: state.latestTwinEvent,
    reconnect: () => realtimeManager.reconnect(),
    isLive: state.connectionStatus === 'connected'
  }
}
