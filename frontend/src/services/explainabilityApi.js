import { getApiBaseUrl } from '../config/api'

/**
 * Frontend API client for Causal Explainability and Dependency Graph endpoints.
 * Interacts with FastAPI backend services:
 * - GET /api/explanations/{service_id}?failed_asset_id={failed_asset_id}
 * - GET /api/graph/bottlenecks
 * - GET /api/dependencies
 */

/**
 * Fetches causal dependency explanation for why a specific clinical service is at risk
 * following an upstream asset failure.
 *
 * Endpoint: GET /api/explanations/{service_id}?failed_asset_id={failed_asset_id}
 *
 * @param {string} serviceId - Clinical service identifier (e.g. 'SERVICE_ICU')
 * @param {string} [failedAssetId='GRID_MAIN'] - Upstream failure origin node (e.g. 'TRANSFORMER_01')
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getServiceExplanation(serviceId, failedAssetId = 'GRID_MAIN') {
  try {
    const baseUrl = getApiBaseUrl()
    const encodedServiceId = encodeURIComponent(serviceId)
    const encodedAssetId = encodeURIComponent(failedAssetId)
    const response = await fetch(
      `${baseUrl}/api/explanations/${encodedServiceId}?failed_asset_id=${encodedAssetId}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      }
    )

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson?.detail) {
          errorDetail = errJson.detail
        }
      } catch {
        // Non-JSON error response fallback
      }
      return {
        success: false,
        data: null,
        error: errorDetail
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
 * Fetches identified critical single points of failure (SPoFs) and vulnerability rankings.
 *
 * Endpoint: GET /api/graph/bottlenecks
 *
 * @returns {Promise<{ success: boolean, data: Array|null, error: string|null }>}
 */
export async function getBottlenecks() {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/graph/bottlenecks`, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    })

    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`
      try {
        const errJson = await response.json()
        if (errJson?.detail) {
          errorDetail = errJson.detail
        }
      } catch {
        // Non-JSON error response fallback
      }
      return {
        success: false,
        data: null,
        error: errorDetail
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
