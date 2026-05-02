/**
 * api.js — Frontend HTTP client for the FastAPI backend (port 8000)
 *
 * All functions return a Promise that resolves to the JSON response,
 * or throws an Error with a user-friendly message if the request fails.
 */

const BASE_URL = "http://localhost:8000"

async function fetchJSON(path, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.detail || `Server error ${res.status}`)
    }

    return res.json()
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new Error(
        "Cannot reach the backend server. Make sure it is running:\n  cd backend && uvicorn api:app --reload --port 8000"
      )
    }
    throw err
  }
}

/** GET /health — check if the model is loaded */
export function checkHealth() {
  return fetchJSON("/health")
}

/** GET /stats — dashboard summary statistics */
export function fetchStats() {
  return fetchJSON("/stats")
}

/**
 * POST /predict — single-company risk prediction
 * @param {Object} payload
 * @param {string}  payload.company_name
 * @param {number}  payload.disposed_cases
 * @param {number}  payload.pending_cases
 * @param {boolean} payload.is_public
 * @param {number}  [payload.debt_to_equity]
 * @param {number}  [payload.profit_margin]
 */
export function predictSingle(payload) {
  return fetchJSON("/predict", {
    method: "POST",
    body: JSON.stringify({
      company_name:   payload.company_name,
      disposed_cases: Number(payload.disposed_cases),
      pending_cases:  Number(payload.pending_cases),
      is_public:      payload.is_public === true || payload.is_public === "true",
      debt_to_equity: Number(payload.debt_to_equity) || 0,
      profit_margin:  Number(payload.profit_margin)  || 0,
    }),
  })
}

/**
 * POST /batch — batch risk prediction
 * @param {Array} companies — array of company objects (same shape as predictSingle)
 */
export function predictBatch(companies) {
  return fetchJSON("/batch", {
    method: "POST",
    body: JSON.stringify({
      companies: companies.map(c => ({
        company_name:   c.company_name || c.name,
        disposed_cases: Number(c.disposed_cases || c.disposed),
        pending_cases:  Number(c.pending_cases  || c.pending),
        is_public:      c.is_public !== undefined
                          ? (c.is_public === true || c.is_public === "true")
                          : c.ticker !== "—",
        debt_to_equity: Number(c.debt_to_equity || c.de) || 0,
        profit_margin:  Number(c.profit_margin  || c.pm) || 0,
      })),
    }),
  })
}
