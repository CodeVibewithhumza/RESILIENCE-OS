import { getApiBaseUrl } from '../config/api'

/**
 * Frontend API client for Risk Assessment and Resilience Index endpoints.
 * Interacts with FastAPI backend services:
 * - GET /api/risk/summary
 * - GET /api/resilience/breakdown
 * - GET /api/risk/assets/{asset_id}
 * - GET /api/risk/services/{service_id}
 */

/**
 * Fetches the campus-wide incident risk summary including asset risks,
 * service vulnerabilities, threshold violations, and narrative synthesis.
 *
 * Endpoint: GET /api/risk/summary
 *
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getRiskSummary() {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/risk/summary`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Network error: Backend unavailable'
    }
  }
}

/**
 * Fetches canonical Resilience Index breakdown with normalized sub-scores
 * and component weights.
 *
 * Endpoint: GET /api/resilience/breakdown
 *
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getResilienceBreakdown() {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/resilience/breakdown`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Network error: Backend unavailable'
    }
  }
}

/**
 * Fetches risk assessment for a specific infrastructure asset.
 *
 * Endpoint: GET /api/risk/assets/{asset_id}
 *
 * @param {string} assetId
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getAssetRisk(assetId) {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/risk/assets/${encodeURIComponent(assetId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Network error: Backend unavailable'
    }
  }
}

/**
 * Fetches risk assessment for a specific hospital clinical service.
 *
 * Endpoint: GET /api/risk/services/{service_id}
 *
 * @param {string} serviceId
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getServiceRisk(serviceId) {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/risk/services/${encodeURIComponent(serviceId)}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `HTTP ${response.status}: ${response.statusText}`
      }
    }

    const data = await response.json()
    return {
      success: true,
      data,
      error: null
    }
  } catch (err) {
    return {
      success: false,
      data: null,
      error: err?.message || 'Network error: Backend unavailable'
    }
  }
}
