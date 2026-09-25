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
