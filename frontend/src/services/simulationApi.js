import { getApiBaseUrl } from '../config/api'

/**
 * Fetches real-time What-If strategy evaluation and multi-attribute
 * decision analysis (MCDA) comparison from the backend simulation engine.
 *
 * Endpoint: GET /api/simulation/what-if
 *
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function getWhatIfAnalysis() {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/simulation/what-if`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
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
 * Injects a simulated equipment failure and triggers cascading propagation across
 * hospital infrastructure and clinical healthcare delivery systems.
 *
 * Endpoint: POST /api/failures/inject
 *
 * @param {object} requestData - FailureInjectionRequest payload
 * @returns {Promise<{ success: boolean, data: object|null, error: string|null }>}
 */
export async function injectFailure(requestData) {
  try {
    const baseUrl = getApiBaseUrl()
    const response = await fetch(`${baseUrl}/api/failures/inject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(requestData)
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
