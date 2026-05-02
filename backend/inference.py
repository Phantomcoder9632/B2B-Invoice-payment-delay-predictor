"""
inference.py — Loads the trained XGBoost model and builds the feature vector
for a single-company or batch prediction request.

Model: backend/models/xgboost_risk_model.pkl
Features: backend/models/model_features.pkl
"""

import joblib
import numpy as np
import pandas as pd
from pathlib import Path

# ── Paths ────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH   = BASE_DIR / "models" / "xgboost_risk_model.pkl"
FEATURES_PATH = BASE_DIR / "models" / "model_features.pkl"

# ── Load once at import time (not on every request) ──────
_model    = joblib.load(MODEL_PATH)
_features = joblib.load(FEATURES_PATH)   # list of feature names the model was trained on

# Decision threshold found by Optuna threshold-tuning step
DECISION_THRESHOLD = 0.46

# Sector medians (from training data) used to compute relative features
SECTOR_MEDIANS = {
    "Energy_Mining":       {"Debt to Equity": 0.72,  "Profit Margin": 12.5},
    "Infrastructure":      {"Debt to Equity": 0.68,  "Profit Margin": 5.5},
    "Defense_Aerospace":   {"Debt to Equity": 0.35,  "Profit Margin": 16.2},
    "Financial_Services":  {"Debt to Equity": 0.30,  "Profit Margin": 14.5},
    "Other_Govt_Services": {"Debt to Equity": 1.20,  "Profit Margin": 2.8},
}

ALL_SECTORS = [
    "Energy_Mining",
    "Infrastructure",
    "Defense_Aerospace",
    "Financial_Services",
    "Other_Govt_Services",
]


def classify_sector(company_name: str) -> str:
    """Heuristic sector classifier — mirrors training script logic."""
    name = company_name.upper()
    if any(w in name for w in ["POWER", "OIL", "COAL", "ENERGY", "GAS", "PETROLEUM", "NTPC", "ONGC", "BPCL", "GAIL"]):
        return "Energy_Mining"
    if any(w in name for w in ["RAIL", "PORT", "HIGHWAY", "CONSTRUCTION", "INFRA", "STEEL", "SAIL", "BHEL", "RVNL", "IRCON"]):
        return "Infrastructure"
    if any(w in name for w in ["BANK", "FINANCE", "INSURANCE", "FUND", "SBI", "BOB", "UNION"]):
        return "Financial_Services"
    if any(w in name for w in ["AERO", "DEFENCE", "DEFENSE", "AVIATION", "DYNAMICS", "HAL", "BEL"]):
        return "Defense_Aerospace"
    return "Other_Govt_Services"


def _build_feature_row(
    company_name: str,
    disposed_cases: float,
    pending_cases: float,
    is_public: bool,
    debt_to_equity: float = 0.0,
    profit_margin: float  = 0.0,
) -> pd.DataFrame:
    """Reconstruct the exact feature vector the XGBoost model expects."""

    sector = classify_sector(company_name)
    med    = SECTOR_MEDIANS[sector]

    # Sector-relative features (same engineering as training script)
    sector_rel_profit = profit_margin  - med["Profit Margin"]
    sector_rel_debt   = debt_to_equity - med["Debt to Equity"]

    # Base row (all sector dummies start at 0)
    row = {
        "Is_Public":             int(is_public),
        "Debt to Equity":        debt_to_equity,
        "Profit Margin":         profit_margin,
        "Sector_Relative_Profit": sector_rel_profit,
        "Sector_Relative_Debt":  sector_rel_debt,
    }

    # One-hot sector columns — only the matching sector is 1
    for s in ALL_SECTORS:
        col = f"Sector_{s}"
        row[col] = 1 if s == sector else 0

    # Build a DataFrame aligned to _features list (adds any missing cols as 0)
    df = pd.DataFrame([row])
    for col in _features:
        if col not in df.columns:
            df[col] = 0
    df = df[_features]   # enforce correct column order

    return df, sector


def predict_single(
    company_name: str,
    disposed_cases: float,
    pending_cases: float,
    is_public: bool,
    debt_to_equity: float = 0.0,
    profit_margin: float  = 0.0,
) -> dict:
    """
    Run inference for one company.
    Returns a dict matching the API response schema.
    """
    total_cases = disposed_cases + pending_cases
    delay_risk_ratio = pending_cases / total_cases if total_cases > 0 else 0.0

    df, sector = _build_feature_row(
        company_name, disposed_cases, pending_cases,
        is_public, debt_to_equity, profit_margin,
    )

    # Predicted probability of High Risk
    proba = float(_model.predict_proba(df)[0][1])
    is_high_risk = proba >= DECISION_THRESHOLD

    # Convert probability to a 0–100 risk score for the UI gauge
    risk_score = int(round(proba * 100))

    # Feature importances from model
    importances = _model.feature_importances_
    feat_imp = sorted(
        zip(_features, importances * 100),
        key=lambda x: -x[1],
    )

    # Build human-readable factor breakdown
    factors = []
    for feat, imp in feat_imp[:7]:
        impact = 0
        if feat == "Is_Public":
            impact = 1 if is_public else -1
        elif feat.startswith("Sector_") and "Relative" not in feat:
            matched_sector = feat.replace("Sector_", "")
            impact = 1 if matched_sector == "Defense_Aerospace" else -1 if matched_sector in ("Energy_Mining", "Other_Govt_Services") else 0
        factors.append({
            "label":      feat,
            "importance": round(float(imp), 1),
            "impact":     impact,
        })

    # Recommendations
    recs = []
    if not is_public:
        recs.append("⚠️ Unlisted entity — demand 30–50% advance payment before delivery.")
    if sector == "Energy_Mining":
        recs.append("Energy/Mining sector shows structural delays — shorten payment terms to 15 days.")
    if sector == "Other_Govt_Services":
        recs.append("Govt Services sector has bureaucratic bottlenecks — consider escrow accounts.")
    if is_high_risk:
        recs.append("Set up supply chain finance or invoice discounting to reduce exposure.")
        recs.append("Insert penalty clauses for late payment in the contract.")
    if not recs:
        recs.append("Standard 30-day payment terms are safe for this entity.")

    insight = (
        "This CPSE is unlisted — our model found this is the strongest predictor of payment delays (48.3% importance)."
        if not is_public
        else (
            "Defense sector CPSEs show the best payment discipline. Risk is structurally low."
            if sector == "Defense_Aerospace"
            else f"{sector.replace('_', ' ')} sector exhibits structural/bureaucratic payment culture."
        )
    )

    return {
        "company_name":      company_name,
        "sector":            sector,
        "is_public":         is_public,
        "delay_risk_ratio":  round(delay_risk_ratio, 4),
        "pending_pct":       round(delay_risk_ratio * 100, 1),
        "risk_probability":  round(proba, 4),
        "risk_score":        risk_score,
        "is_high_risk":      is_high_risk,
        "decision_threshold": DECISION_THRESHOLD,
        "model_confidence":  round(proba if is_high_risk else 1 - proba, 4),
        "factors":           factors,
        "recommendations":   recs,
        "insight":           insight,
    }


def predict_batch(records: list[dict]) -> list[dict]:
    """Run inference for a list of company records."""
    return [predict_single(**r) for r in records]
