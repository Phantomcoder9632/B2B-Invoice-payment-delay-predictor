// helpers.js — Shared utility functions

import { SECTOR_MEDIANS } from './data/mockData'

export const scoreColor = (s) =>
  s >= 81 ? "#DC2626" : s >= 61 ? "#EA580C" : s >= 31 ? "#D97706" : "#16A34A"

export const scoreLabel = (s) =>
  s >= 81 ? "Critical Risk" : s >= 61 ? "High Risk" : s >= 31 ? "Medium Risk" : "Low Risk"

export const scoreBg = (s) =>
  s >= 81 ? "#FEF2F2" : s >= 61 ? "#FFF7ED" : s >= 31 ? "#FFFBEB" : "#F0FDF4"

export const sectorShort = (s) =>
  ({
    Energy_Mining: "Energy",
    Infrastructure: "Infra",
    Defense_Aerospace: "Defense",
    Financial_Services: "Finance",
    Other_Govt_Services: "Govt",
  })[s] || s

export function classifySector(name) {
  const n = name.toUpperCase()
  if (/POWER|OIL|COAL|ENERGY|GAS|NTPC|ONGC|BPCL|GAIL/.test(n)) return "Energy_Mining"
  if (/RAIL|PORT|HIGHWAY|STEEL|SAIL|BHEL|RVNL|IRCON/.test(n))   return "Infrastructure"
  if (/BANK|FINANCE|INSURANCE|SBI|BOB|UNION/.test(n))             return "Financial_Services"
  if (/AERO|DEFENCE|AVIATION|HAL|BEL/.test(n))                   return "Defense_Aerospace"
  return "Other_Govt_Services"
}

// Corrected: threshold = 0.46, primary drivers = public listing + sector
export function simulateRisk({ name, disposed, pending, de, pm, isPublic }) {
  const d = parseInt(disposed) || 0
  const p = parseInt(pending)  || 0
  const deF = parseFloat(de)   || 0
  const pmF = parseFloat(pm)   || 0
  const pub = isPublic === "true" || isPublic === true || isPublic === 1
  const total = d + p
  const pp = total > 0 ? (p / total) * 100 : 0
  const sector = classifySector(name)
  const med = SECTOR_MEDIANS[sector]

  // Score primarily driven by public status and sector (not financials)
  let score = 20
  score += pp * 0.35
  if (!pub) score += 30                           // Public listing is dominant
  if (sector === "Energy_Mining")       score += 15
  if (sector === "Other_Govt_Services") score += 18
  if (sector === "Defense_Aerospace")   score -= 8
  // Financial metrics contribute negligibly (matching 0.0% importance)
  if (deF > med.de * 2) score += 3
  if (pmF < 0)          score += 4
  score = Math.min(99, Math.max(5, Math.round(score)))

  // Classify with threshold 0.46 not 0.50
  const delayRiskRatio = total > 0 ? p / total : 0
  const isHighRisk = score >= 46   // score/100 > 0.46 → matches model threshold

  const factors = [
    {
      label: "Public Listing Status",
      detail: pub ? "Listed (accountability ↑)" : "Unlisted (structural risk ↑)",
      impact: pub ? 1 : -1,
      weight: "48.3% importance",
    },
    {
      label: "Sector Classification",
      detail: sector.replace(/_/g, " "),
      impact: sector === "Defense_Aerospace" ? 1 : sector === "Energy_Mining" || sector === "Other_Govt_Services" ? -1 : 0,
      weight: "51.7% importance",
    },
    {
      label: "Pending Cases Ratio",
      detail: `${pp.toFixed(1)}% of total (threshold: 46%)`,
      impact: isHighRisk ? -1 : 1,
      weight: "Context signal",
    },
    {
      label: "Profit Margin",
      detail: `${pmF.toFixed(1)}% — Negligible impact`,
      impact: 0,
      weight: "0.0% importance",
    },
    {
      label: "Debt/Equity Ratio",
      detail: `${deF.toFixed(2)}x — Negligible impact`,
      impact: 0,
      weight: "0.0% importance",
    },
  ]

  const recs = []
  if (!pub) recs.push("⚠️ Unlisted entity — Public accountability absent. Demand advance payments.")
  if (sector === "Energy_Mining") recs.push("Sector culture shows structural payment delays. Shorten payment terms to 15 days.")
  if (sector === "Other_Govt_Services") recs.push("Govt services sector has bureaucratic bottlenecks. Consider escrow accounts.")
  if (score >= 61) recs.push("Request 30–50% advance payment before invoice submission.")
  if (score >= 61) recs.push("Set up supply chain finance or invoice discounting.")
  if (recs.length === 0) recs.push("Standard 30-day payment terms are safe. Listed entity with good sector profile.")

  const insight = !pub
    ? "This CPSE is unlisted — lacking public accountability. Our research shows this is the strongest predictor of payment delays."
    : sector === "Defense_Aerospace"
    ? "Defense sector CPSEs show the best payment discipline. Risk is structurally low."
    : `${sector.replace(/_/g, " ")} sector exhibits bureaucratic payment culture.`

  return {
    score,
    sector,
    pp: pp.toFixed(1),
    delayRiskRatio: delayRiskRatio.toFixed(3),
    isHighRisk,
    isPublic: pub,
    factors,
    recs,
    insight,
    conf: 0.72 + Math.random() * 0.2,
  }
}
