// Ground-truth mock data — Corrected per Research Findings
// Accuracy: 61.29% | Recall: 88.0% | Threshold: 0.46
// Feature Importance: Public Listing (48.3%), Sector (51.7%), Financial Metrics (0.0%)

export const COMPANIES = [
  { id: 1,  name: "BSNL",       ticker: "—",         sector: "Other_Govt_Services", disposed: 280, pending: 200, pp: 72, de: 1.85, pm: -8.2,  score: 95, conf: 0.94, isPublic: false },
  { id: 2,  name: "Air India",  ticker: "—",         sector: "Other_Govt_Services", disposed: 190, pending: 140, pp: 68, de: 2.10, pm: -12.5, score: 92, conf: 0.91, isPublic: false },
  { id: 3,  name: "NTPC",       ticker: "NTPC.NS",   sector: "Energy_Mining",        disposed: 145, pending: 110, pp: 55, de: 0.95, pm: 12.5,  score: 78, conf: 0.87, isPublic: true  },
  { id: 4,  name: "BHEL",       ticker: "BHEL.NS",   sector: "Infrastructure",       disposed: 160, pending: 108, pp: 48, de: 0.88, pm: 4.2,   score: 62, conf: 0.81, isPublic: true  },
  { id: 5,  name: "ONGC",       ticker: "ONGC.NS",   sector: "Energy_Mining",        disposed: 210, pending: 122, pp: 45, de: 0.72, pm: 18.3,  score: 58, conf: 0.76, isPublic: true  },
  { id: 6,  name: "IOC",        ticker: "IOC.NS",    sector: "Energy_Mining",        disposed: 240, pending: 118, pp: 42, de: 0.65, pm: 8.7,   score: 52, conf: 0.79, isPublic: true  },
  { id: 7,  name: "BPCL",       ticker: "BPCL.NS",   sector: "Energy_Mining",        disposed: 195, pending: 85,  pp: 38, de: 0.60, pm: 10.1,  score: 45, conf: 0.72, isPublic: true  },
  { id: 8,  name: "GAIL",       ticker: "GAIL.NS",   sector: "Energy_Mining",        disposed: 178, pending: 62,  pp: 32, de: 0.45, pm: 14.8,  score: 38, conf: 0.68, isPublic: true  },
  { id: 9,  name: "HAL",        ticker: "HAL.NS",    sector: "Defense_Aerospace",    disposed: 145, pending: 40,  pp: 25, de: 0.35, pm: 18.9,  score: 22, conf: 0.91, isPublic: true  },
  { id: 10, name: "SAIL",       ticker: "SAIL.NS",   sector: "Infrastructure",       disposed: 180, pending: 38,  pp: 18, de: 0.55, pm: 6.5,   score: 20, conf: 0.88, isPublic: true  },
]

export const SECTORS = [
  { name: "Energy & Mining",    risk: 65, count: 32 },
  { name: "Infrastructure",     risk: 45, count: 28 },
  { name: "Other Govt Svcs",    risk: 35, count: 24 },
  { name: "Financial Services", risk: 20, count: 18 },
  { name: "Defense & Aero",     risk: 10, count: 26 },
]

// CORRECTED Feature Importance (Research Ground Truth)
// Public Listing + Sector = 100% | Financial Metrics = 0.0%
export const FEATURES = [
  { name: "Public Listing Status",  val: 48.3, dominant: true,  note: "PRIMARY DRIVER" },
  { name: "Sector: Energy/Mining",  val: 28.1, dominant: true,  note: "PRIMARY DRIVER" },
  { name: "Sector: Other Govt",     val: 14.8, dominant: true,  note: "PRIMARY DRIVER" },
  { name: "Sector: Infrastructure", val: 8.8,  dominant: false, note: "Secondary" },
  { name: "Profit Margin",          val: 0.0,  dominant: false, note: "NEGLIGIBLE" },
  { name: "Debt to Equity",         val: 0.0,  dominant: false, note: "NEGLIGIBLE" },
  { name: "Sector Rel. Profit",     val: 0.0,  dominant: false, note: "NEGLIGIBLE" },
]

// CORRECTED Model Metrics (Research Ground Truth)
export const MODEL_METRICS = {
  accuracy:   "61.29%",
  recall:     "88.0%",
  precision:  "58.2%",
  f1Score:    "70.1%",
  threshold:  "0.46",
  tuning:     "Optuna (Bayesian)",
  trials:     "150",
  trainSize:  "102",
  testSize:   "26",
  features:   "10",
}

export const HYPERPARAMS = [
  ["n_estimators", "245"],
  ["max_depth", "5"],
  ["learning_rate", "0.08"],
  ["subsample", "0.80"],
  ["colsample_bytree", "0.85"],
  ["gamma", "1.5"],
  ["min_child_weight", "2"],
  ["Optuna Trials", "150"],
  ["Decision Threshold", "0.46"],
  ["Features", "10"],
]

export const SECTOR_MEDIANS = {
  Energy_Mining:       { de: 0.72, pm: 12.5 },
  Infrastructure:      { de: 0.68, pm: 5.5  },
  Defense_Aerospace:   { de: 0.35, pm: 16.2 },
  Financial_Services:  { de: 0.30, pm: 14.5 },
  Other_Govt_Services: { de: 1.20, pm: 2.8  },
}

export const BATCH_SAMPLE = [
  { name: "NTPC",    disposed: 145, pending: 110, de: 0.95, pm: 12.5,  ticker: "NTPC.NS"  },
  { name: "SAIL",    disposed: 180, pending: 38,  de: 0.55, pm: 6.5,   ticker: "SAIL.NS"  },
  { name: "HAL",     disposed: 145, pending: 40,  de: 0.35, pm: 18.9,  ticker: "HAL.NS"   },
  { name: "BSNL",    disposed: 280, pending: 200, de: 1.85, pm: -8.2,  ticker: "—"        },
  { name: "GAIL",    disposed: 178, pending: 62,  de: 0.45, pm: 14.8,  ticker: "GAIL.NS"  },
]

// Aliases used by DashboardScreen
export const PSU_LIST = COMPANIES

export const SECTOR_STATS = [
  { name: "Energy & Mining",    rate: 65, count: 32, color: "#DC2626" },
  { name: "Infrastructure",     rate: 45, count: 28, color: "#EA580C" },
  { name: "Other Govt Services",rate: 35, count: 24, color: "#D97706" },
  { name: "Financial Services", rate: 20, count: 18, color: "#CA8A04" },
  { name: "Defense & Aero",     rate: 10, count: 26, color: "#16A34A" },
]
