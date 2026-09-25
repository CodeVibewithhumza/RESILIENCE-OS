/**
 * Backend API and WebSocket configuration resolver for ResilienceOS.
 * Respects environment variables and provides sensible local development fallbacks.
 */

export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')
  }

  if (typeof window !== 'undefined') {
    const { hostname, port, protocol } = window.location
    // Local Vite dev server fallback to standard FastAPI backend port
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      if (port === '5173' || port === '5174' || port === '3000' || port === '4173') {
        return 'http://localhost:8000'
      }
    }
    // Reverse proxy container / production origin
    return `${protocol}//${window.location.host}`
  }

  return 'http://localhost:8000'
}

export function getWebSocketUrl(endpoint = 'telemetry') {
  const cleanEndpoint = endpoint.replace(/^\/+/, '')
  const path = `/ws/${cleanEndpoint}`

  if (import.meta.env.VITE_WS_URL) {
    const base = import.meta.env.VITE_WS_URL.replace(/\/+$/, '')
    return `${base}${path}`
  }

  const apiBase = getApiBaseUrl()
  const wsBase = apiBase.replace(/^http:/i, 'ws:').replace(/^https:/i, 'wss:')
  return `${wsBase}${path}`
}
