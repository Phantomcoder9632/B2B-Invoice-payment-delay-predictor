"""
api.py — FastAPI server for the B2B Invoice Payment Delay Predictor
Run with:  uvicorn api:app --reload --port 8000  (from inside backend/)

Endpoints
─────────
GET  /              → health check
GET  /health        → model status + feature list
POST /predict       → single-company risk prediction
POST /batch         → batch prediction for multiple companies
GET  /stats         → dashboard summary stats
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
import uvicorn

from .inference import predict_single, predict_batch, _features, _model, DECISION_THRESHOLD

# ── App Setup ────────────────────────────────────────────
app = FastAPI(
    title="B2B Invoice Payment Delay Predictor API",
    description=(
        "XGBoost + Optuna Bayesian Optimization. "
        "Primary drivers: Public Listing Status (48.3%) and Sector Classification (51.7%). "
        "Financial metrics (Profit/Debt) have 0.0% predictive weight."
    ),
    version="2.0.0",
)

# ── CORS — allow the Vite dev server (port 5173) ─────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:5176",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:5176",
        "http://localhost:3000",
        "https://your-app-name.vercel.app", # Your specific Vercel URL
    ],
    allow_origin_regex=r"https://.*\.vercel\.app", # Allow all Vercel deployments (including previews)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Schemas ────────────────────────────

class PredictRequest(BaseModel):
    company_name:   str   = Field(..., example="NTPC Limited")
    disposed_cases: float = Field(..., ge=0, example=145)
    pending_cases:  float = Field(..., ge=0, example=110)
    is_public:      bool  = Field(..., example=True)
    debt_to_equity: Optional[float] = Field(default=0.0, example=0.95)
    profit_margin:  Optional[float] = Field(default=0.0, example=12.5)


class BatchPredictRequest(BaseModel):
    companies: list[PredictRequest]


# ── Endpoints ─────────────────────────────────────────────

@app.get("/", tags=["health"])
def root():
    return {
        "status": "online",
        "model":  "XGBoost Sector-Optimised v2.0",
        "tuning": "Optuna Bayesian Optimisation · 150 trials",
        "threshold": DECISION_THRESHOLD,
        "docs":   "/docs",
    }


@app.get("/health", tags=["health"])
def health():
    return {
        "model_loaded":      True,
        "n_features":        len(_features),
        "features":          _features,
        "decision_threshold": DECISION_THRESHOLD,
        "key_finding": (
            "Profit Margin and Debt-to-Equity have 0.0% predictive importance. "
            "Public Listing Status and Sector are the only drivers."
        ),
    }


@app.post("/predict", tags=["inference"])
def predict(req: PredictRequest):
    """
    Predict payment delay risk for a single CPSE.

    Returns a risk score (0–100), high/low risk classification,
    factor breakdown, and MSME-friendly recommendations.
    """
    try:
        result = predict_single(
            company_name   = req.company_name,
            disposed_cases = req.disposed_cases,
            pending_cases  = req.pending_cases,
            is_public      = req.is_public,
            debt_to_equity = req.debt_to_equity or 0.0,
            profit_margin  = req.profit_margin  or 0.0,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/batch", tags=["inference"])
def batch_predict(req: BatchPredictRequest):
    """
    Predict payment delay risk for multiple CPSEs at once.
    Accepts a JSON list of company objects, returns a list of results.
    """
    try:
        records = [
            {
                "company_name":   c.company_name,
                "disposed_cases": c.disposed_cases,
                "pending_cases":  c.pending_cases,
                "is_public":      c.is_public,
                "debt_to_equity": c.debt_to_equity or 0.0,
                "profit_margin":  c.profit_margin  or 0.0,
            }
            for c in req.companies
        ]
        results = predict_batch(records)
        high_risk = [r for r in results if r["is_high_risk"]]
        return {
            "total":     len(results),
            "high_risk": len(high_risk),
            "low_risk":  len(results) - len(high_risk),
            "results":   results,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats", tags=["dashboard"])
def stats():
    """
    Summary statistics for the dashboard.
    Based on the full 128-PSU dataset used during training.
    """
    return {
        "total_psus": 128,
        "model_accuracy":   0.6129,
        "model_recall":     0.880,
        "model_precision":  0.582,
        "decision_threshold": DECISION_THRESHOLD,
        "tuning_method":    "Optuna Bayesian Optimisation",
        "optuna_trials":    150,
        "train_samples":    102,
        "test_samples":     26,
        "n_features":       10,
        "top_features": [
            {"name": "Public Listing Status",   "importance": 48.3, "dominant": True},
            {"name": "Sector: Energy/Mining",   "importance": 28.1, "dominant": True},
            {"name": "Sector: Other Govt",      "importance": 14.8, "dominant": True},
            {"name": "Sector: Infrastructure",  "importance": 8.8,  "dominant": False},
            {"name": "Profit Margin",           "importance": 0.0,  "dominant": False},
            {"name": "Debt to Equity",          "importance": 0.0,  "dominant": False},
        ],
        "key_finding": (
            "Profit & Debt have 0.0% predictive weight. "
            "Government payment bottlenecks are structural and bureaucratic, not financial."
        ),
    }


# ── Entry Point ───────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)
