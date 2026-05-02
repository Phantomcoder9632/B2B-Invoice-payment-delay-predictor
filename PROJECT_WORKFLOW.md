# 🏭 B2B Invoice Payment Delay Predictor - Complete Workflow

## 📋 Executive Summary
A machine learning pipeline that predicts payment delays for invoices submitted by MSMEs to Central PSUs by analyzing **grievance data** + **corporate financial signals** using an **XGBoost sector-optimized classifier**.

---

## 🔄 **COMPLETE DATA WORKFLOW**

### **PHASE 1: DATA COLLECTION & INGESTION**

#### 1.1 **Source 1: MSME Samadhaan Grievance Database**
```
🌐 SCRAPER: src/scraper/samadhaan_main.py
├── Website: https://samadhaan.msme.gov.in/
├── Data Type: Grievance aggregates for Central PSUs
├── Extract:
│   ├── Company Name (S2)
│   ├── Total Applications (S3)
│   ├── Rejected Cases (S4)
│   ├── Disposed Cases (S5)
│   ├── Pending Cases (S6)
│   ├── Amount Involved (S7)
│   └── Last Updated (S8)
│
└── Output: data/raw/raw_central_psu_cases.csv
    (128+ Central PSUs with payment history)
```

**Key Metrics:**
- **Disposed Cases** = Successfully resolved/paid invoices ✅
- **Pending Cases** = Still awaiting payment ⏳
- **Delay Risk Ratio** = Pending / Total Cases

---

#### 1.2 **Source 2: YFinance Corporate Financial Signals**
```
🌐 SCRAPER: src/scraper/yfinance_signals.py
├── Data Source: Yahoo Finance (via yfinance library)
├── Ticker Mapping: 128 listed Indian Central PSUs
│   ├── Energy: IOC, NTPC, BHEL, ONGC, BPCL, GAIL...
│   ├── Defense: HAL, BEL, Mazagon Dock...
│   ├── Steel: SAIL, NMDC...
│   ├── Railways: IRCTC, RVNL, IRCON...
│   └── Banking: SBI, BoB, Union Bank...
│
├── Extract (Per Company):
│   ├── Debt to Equity Ratio
│   ├── Profit Margin
│   ├── Return on Equity (ROE)
│   ├── Price-to-Book Ratio
│   └── Industry Sector Classification
│
└── Output: data/processed/yfinance_signals.csv
    (128 companies × 5 financial signals)
```

**Financial Health Indicators:**
- **Debt to Equity ↓** = Better ability to pay
- **Profit Margin ↑** = More cash available
- **ROE ↑** = Efficient business operations

---

### **PHASE 2: DATA CLEANING & NORMALIZATION**

#### 2.1 **Name Normalization**
```
🔧 PROCESSOR: src/data_cleaning/name_normalizer.py
├── Input: raw_central_psu_cases.csv (dirty names)
│
├── Cleaning Steps:
│   ├── Uppercase standardization
│   ├── Remove unit-specific details (e.g., "Unit-A, Mumbai")
│   ├── Standardize legal suffixes (PVT LTD, LIMITED → remove)
│   ├── Remove special characters & extra spaces
│   └── Trim whitespace
│
├── Example:
│   Input:  "HINDUSTAN PETROLEUM CORPORATION LTD, HAZIRA UNIT"
│   Output: "HINDUSTAN PETROLEUM CORPORATION"
│
└── Output: data/interim/tofler_lookup_list.csv
    (Lookup table for Tofler API matching)
```

#### 2.2 **Data Merging & Enrichment**
```
🔗 MERGER: src/data_cleaning/tofler_merger.py
├── Merge on: Company Name (fuzzy matching via thefuzz)
│
├── Left Table: Samadhaan Data (128 PSUs)
├── Right Table: YFinance Data (Financial Signals)
│
├── Join Type: LEFT OUTER
│   ├── Listed PSUs → Get financial data ✅
│   ├── Unlisted PSUs → Set to NULL, impute with 0 🔄
│   └── Government-owned → Identify separately (e.g., BSNL, Air India)
│
├── Outcome Variables Created:
│   ├── Total_Cases = Disposed + Pending
│   ├── Delay_Risk_Ratio = Pending / Total
│   └── High_Risk_Flag = (Delay_Risk_Ratio > 0.50) ? 1 : 0  ⚠️
│
└── Output: Merged DataFrame (128 companies, 12+ features)
```

---

### **PHASE 3: FEATURE ENGINEERING**

#### 3.1 **Sector Categorization**
```
📊 LOGIC: train_xgboost_sector_optimized.py (lines 14-27)
├── Rules-based Heuristic Classification:
│
├── Sector 1: Energy_Mining
│   └── Keywords: POWER, OIL, COAL, ENERGY, GAS, NTPC, ONGC
│
├── Sector 2: Infrastructure  
│   └── Keywords: RAIL, PORT, HIGHWAY, CONSTRUCTION, STEEL
│
├── Sector 3: Financial_Services
│   └── Keywords: BANK, FINANCE, INSURANCE
│
├── Sector 4: Defense_Aerospace
│   └── Keywords: AERO, DEFENCE, AVIATION, HAL
│
└── Sector 5: Other_Govt_Services (default)
    └── All others default here
```

#### 3.2 **Feature Matrix Construction**
```
🧪 FEATURES ENGINEERED (10 total):
├── Base Features:
│   ├── Is_Public (1 = Listed, 0 = Unlisted)
│   ├── Debt_to_Equity (from YFinance)
│   └── Profit_Margin (from YFinance)
│
├── Sector-Relative Features (NEW):
│   ├── Sector_Relative_Profit 
│   │   = Company Profit - Sector Median Profit
│   │   (Is this company better/worse than peers?)
│   │
│   └── Sector_Relative_Debt
│       = Company Debt/Eq - Sector Median Debt/Eq
│       (Is this company more/less leveraged than peers?)
│
├── Categorical Features (One-Hot Encoded):
│   ├── Sector_Energy_Mining [0/1]
│   ├── Sector_Infrastructure [0/1]
│   ├── Sector_Financial_Services [0/1]
│   ├── Sector_Defense_Aerospace [0/1]
│   └── Sector_Other_Govt_Services [0/1]
│       (Drop first = 4 sectors included, 1 is baseline)
│
└── Target Variable: High_Risk_Flag
    ├── 1 = RISK (Delay_Risk_Ratio > 50%)
    └── 0 = SAFE (Delay_Risk_Ratio ≤ 50%)
```

**Why Sector-Relative Features?**
- ✅ Accounts for industry norms (e.g., Banks naturally have high debt)
- ✅ Identifies outliers within their sector
- ✅ Improves model generalization

---

### **PHASE 4: MODEL TRAINING & OPTIMIZATION**

#### 4.1 **Bayesian Hyperparameter Optimization (Optuna)**
```
🤖 MODEL: src/models/train_xgboost_sector_optimized.py
├── Algorithm: XGBoost Classification (Binary)
├── Optimization: Optuna (Bayesian Search)
├── Trials: 150 iterations
│
├── Hyperparameters Tuned:
│   ├── n_estimators: 50-300 (# of boosting rounds)
│   ├── max_depth: 2-7 (tree depth)
│   ├── learning_rate: 0.01-0.3 (shrinkage)
│   ├── subsample: 0.5-1.0 (row sampling)
│   ├── colsample_bytree: 0.5-1.0 (feature sampling)
│   ├── gamma: 0-5 (min loss reduction for split)
│   └── min_child_weight: 1-5 (min samples in leaf)
│
├── Data Split:
│   ├── Train Set: 80% (for learning patterns)
│   ├── Test Set: 20% (for evaluation) 
│   └── Random State: 42 (reproducibility)
│
├── Evaluation Metric: Accuracy
│   └── Objective: Maximize accuracy on test set
│
└── Output Models:
    ├── models/xgboost_risk_model.pkl
    │   (Trained XGBoost classifier)
    └── models/model_features.pkl
        (Feature names for inference)
```

#### 4.2 **Model Performance Metrics**
```
📊 OUTPUTS (After Training):
├── Accuracy Score: % correct predictions
├── Precision: Of predicted high-risk, how many are actually high-risk?
├── Recall: Of actual high-risk companies, how many did we catch?
├── F1-Score: Harmonic mean (for imbalanced data)
├── Confusion Matrix:
│   ├── True Positives (TP): Correctly identified risks
│   ├── False Positives (FP): False alarms
│   ├── True Negatives (TN): Correctly identified safe
│   └── False Negatives (FN): Missed risks (WORST CASE)
│
└── Feature Importance: Which features matter most?
    ├── Is_Public
    ├── Sector_Relative_Profit
    ├── Sector_Relative_Debt
    ├── Sector_Energy_Mining
    └── ... (others)
```

---

## 🎯 **PHASE 5: INFERENCE & PREDICTION PIPELINE**

### **5.1 Real-Time Prediction Flow**
```
USER INPUT (Frontend)
        ↓
┌───────────────────────────────────────────┐
│ Step 1: COLLECT COMPANY DATA              │
├───────────────────────────────────────────┤
│ Input Required:                           │
│ ├── Company Name (String)                 │
│ ├── Disposed Cases (Integer)              │
│ ├── Pending Cases (Integer)               │
│ └── Debt to Equity Ratio (Float)          │
│ └── Profit Margin % (Float)               │
└───────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────┐
│ Step 2: FEATURE ENGINEERING (Backend)     │
├───────────────────────────────────────────┤
│ ├── Identify sector from company name     │
│ ├── Calculate sector-relative metrics     │
│ ├── One-hot encode sector                 │
│ └── Create 10-dimensional feature vector  │
└───────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────┐
│ Step 3: MODEL INFERENCE                   │
├───────────────────────────────────────────┤
│ Input: Feature vector [10 dims]           │
│ Model: xgboost_risk_model.pkl             │
│ Output: Risk Class [0 or 1]               │
│         + Confidence Score [0-1]          │
└───────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────┐
│ Step 4: INTERPRETATION & DISPLAY          │
├───────────────────────────────────────────┤
│ IF Risk = 1 (HIGH RISK ⚠️):              │
│ ├── Color: RED                            │
│ ├── Message: "High payment delay risk"    │
│ ├── Recommendation: "Monitor closely"     │
│ └── Days to monitor: 30-60 days           │
│                                           │
│ IF Risk = 0 (LOW RISK ✅):               │
│ ├── Color: GREEN                          │
│ ├── Message: "Low payment delay risk"     │
│ ├── Recommendation: "Standard terms"      │
│ └── Expected payment: Within 30 days      │
└───────────────────────────────────────────┘
        ↓
FRONTEND DISPLAY (To User)
```

---

## 🎨 **FRONTEND ARCHITECTURE FOR MAXIMUM UX**

### **Recommended Tech Stack**
```
Frontend Framework: React.js or Vue.js
State Management: Redux or Vuex
API Framework: FastAPI (already stubbed)
Charting: Recharts, Chart.js, or Plotly
UI Components: Material-UI, Tailwind CSS
Real-time Updates: WebSockets (optional)
Authentication: JWT tokens (for enterprise)
```

---

### **SCREEN 1: Dashboard (Home)**
```
┌─────────────────────────────────────────────────────────────┐
│          B2B Invoice Payment Delay Predictor               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📊 QUICK STATS CARDS (Top Row)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Total    │  │ High     │  │ Low      │  │ Accuracy │  │
│  │ Companies│  │ Risk PSUs│  │ Risk PSUs│  │ Score    │  │
│  │   128    │  │   34     │  │   94     │  │  87.5%   │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│  📈 SECTOR RISK BREAKDOWN (Center)                         │
│  ├─ Energy & Mining         [████████░░] 65% High-Risk   │
│  ├─ Infrastructure          [██████░░░░] 45% High-Risk   │
│  ├─ Financial Services      [███░░░░░░░] 20% High-Risk   │
│  ├─ Defense & Aerospace     [█░░░░░░░░░] 10% High-Risk   │
│  └─ Other Govt Services     [████░░░░░░] 35% High-Risk   │
│                                                             │
│  🔴 TOP 10 HIGHEST RISK COMPANIES                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Company Name  │ Pending % │ D/E Ratio │ Risk Score  │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 1. BSNL       │   72%     │   1.85    │   95/100 🔴 │  │
│  │ 2. Air India  │   68%     │   2.10    │   92/100 🔴 │  │
│  │ 3. NTPC       │   55%     │   0.95    │   78/100 🟠 │  │
│  │ ...           │   ...     │   ...     │   ...       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  [🔍 Search Company]  [📋 View All]  [📥 Export Report]   │
└─────────────────────────────────────────────────────────────┘
```

---

### **SCREEN 2: Single Company Analyzer**
```
┌─────────────────────────────────────────────────────────────┐
│ Company Risk Assessment Tool                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  INPUT FORM (Left Side - 40%)                             │
│  ┌──────────────────────────────────┐                     │
│  │ Company Name*                    │                     │
│  │ [Search dropdown v] (Auto-fill)  │                     │
│  ├──────────────────────────────────┤                     │
│  │ Disposed Cases*       [_____]    │                     │
│  │ Pending Cases*        [_____]    │                     │
│  │ Debt/Equity Ratio     [_____]    │                     │
│  │ Profit Margin %       [_____]    │                     │
│  │                                  │                     │
│  │ [🔍 Auto-Fetch from API] or     │                     │
│  │ [📤 Import from Excel]           │                     │
│  │                                  │                     │
│  └──────────────────────────────────┘                     │
│  [📊 Predict Risk]  [🔄 Reset]                            │
│                                                             │
│  PREDICTION OUTPUT (Right Side - 60%)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 RISK ASSESSMENT RESULT               │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │                                                      │  │
│  │         Risk Score: 78 / 100  🔴 HIGH RISK        │  │
│  │         ████████████████░░░░░░░░░░░░░░░░            │  │
│  │                                                      │  │
│  │  🎯 PREDICTION: This company has HIGH probability  │  │
│  │     of payment delays on invoices.                  │  │
│  │                                                      │  │
│  │  📊 KEY FACTORS:                                    │  │
│  │  ├─ Pending Cases: 72% of total (Negative ⬇️)    │  │
│  │  ├─ Debt/Equity: 1.85x (Above avg ⬇️)             │  │
│  │  ├─ Profit Margin: 8.5% (Below sector ⬇️)         │  │
│  │  ├─ Sector: Energy_Mining (High-risk ⬇️)          │  │
│  │  └─ Public Status: Listed (Neutral ➡️)            │  │
│  │                                                      │  │
│  │  💡 RECOMMENDATIONS:                                │  │
│  │  ✓ Request partial advance payments                 │  │
│  │  ✓ Shorten payment terms (15-20 days vs 45)       │  │
│  │  ✓ Set up escrow account                           │  │
│  │  ✓ Monitor cash flow monthly                        │  │
│  │  ✓ Consider supply chain finance options           │  │
│  │                                                      │  │
│  │  📈 TREND (Last 12 months):                         │  │
│  │     Risk Score: ↗️  (Getting worse)                │  │
│  │     Pending %: ↗️   (More invoices pending)       │  │
│  │                                                      │  │
│  │  [📥 Download Detailed Report] [📧 Share]          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **SCREEN 3: Batch Upload & Analysis**
```
┌─────────────────────────────────────────────────────────────┐
│ Batch Risk Assessment                                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📤 UPLOAD OPTIONS                                         │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Upload CSV/Excel file:  [Choose File]  [📤 Upload] │  │
│  │                                                     │  │
│  │ Required Columns:                                   │  │
│  │ ├─ company_name                                     │  │
│  │ ├─ disposed_cases                                   │  │
│  │ ├─ pending_cases                                    │  │
│  │ ├─ debt_to_equity                                   │  │
│  │ └─ profit_margin                                    │  │
│  │                                                     │  │
│  │ [📥 Download Template] [📝 Sample Data]            │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  🔄 PROCESSING STATUS                                      │
│  Processing: 45/128 companies [████████░░░] 35%          │
│                                                             │
│  📊 RESULTS TABLE (Real-time updating)                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ # │ Company    │ Risk │ Confidence │ Pending% │ Action│ │
│  ├───────────────────────────────────────────────────────┤ │
│  │ 1 │ NTPC       │ 🔴   │    87%    │  55%   │ [More]│ │
│  │ 2 │ IOC        │ 🟠   │    72%    │  42%   │ [More]│ │
│  │ 3 │ SAIL       │ 🟢   │    92%    │  18%   │ [More]│ │
│  │ 4 │ HAL        │ 🟢   │    85%    │  25%   │ [More]│ │
│  │ ... rows auto-populate as processing completes ...    │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  📥 EXPORT OPTIONS                                         │
│  [💾 Download CSV]  [📊 PDF Report]  [📧 Email Results]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

### **SCREEN 4: Model Performance & Analytics**
```
┌─────────────────────────────────────────────────────────────┐
│ Model Performance Dashboard                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📈 MODEL METRICS                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Accuracy │  │ Precision│  │  Recall  │  │ F1-Score │ │
│  │  87.5%   │  │  84.2%   │  │  89.1%   │  │  86.6%   │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                             │
│  🎯 CONFUSION MATRIX                                       │
│  ┌─────────────────────────────────────────────────────┐  │
│  │                 Predicted                           │  │
│  │           Negative    │    Positive                │  │
│  │ ┌─────────────────────────────────────────────┐   │  │
│  │A│         94           │        6              │   │  │
│  │c│    (True Negative)   │  (False Positive)    │   │  │
│  │t├─────────────────────────────────────────────┤   │  │
│  │u│         8            │       20              │   │  │
│  │a│    (False Negative)  │  (True Positive)     │   │  │
│  │l└─────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  │ Interpretation:                                    │  │
│  │ • Model correctly predicted 114/128 cases (89%)  │  │
│  │ • Missed 8 actual high-risk companies (FN)       │  │
│  │ • False alarm rate: 6 low-risk called high       │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  📊 FEATURE IMPORTANCE RANKING                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Feature                    │ Importance │ Impact    │  │
│  ├──────────────────────────────────────────────────────┤  │
│  │ 1. Sector_Relative_Debt    │ ████████░░ │ 23.4%  │  │
│  │ 2. Sector_Energy_Mining    │ █████░░░░░ │ 15.2%  │  │
│  │ 3. Profit_Margin           │ ████░░░░░░ │ 12.8%  │  │
│  │ 4. Debt_to_Equity          │ ███░░░░░░░ │  9.1%  │  │
│  │ 5. Sector_Relative_Profit  │ ██░░░░░░░░ │  7.3%  │  │
│  │ ... (others < 5%)          │ ░░░░░░░░░░ │ 32.2%  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  🔄 MODEL UPDATES                                         │
│  Last Trained: 2024-05-02 14:32 UTC                       │
│  Training Time: 8 minutes 34 seconds                       │
│  Dataset Size: 128 companies, 10 features                 │
│  Optuna Trials: 150 / 150 completed                       │
│  [🔄 Retrain Model]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 **BACKEND API ENDPOINTS** (FastAPI)

### **1. Single Prediction**
```http
POST /api/v1/predict
Content-Type: application/json

Request:
{
  "company_name": "NTPC LIMITED",
  "disposed_cases": 145,
  "pending_cases": 110,
  "debt_to_equity": 0.95,
  "profit_margin": 12.5
}

Response:
{
  "company_name": "NTPC LIMITED",
  "risk_score": 78,
  "risk_class": "HIGH_RISK",
  "confidence": 0.87,
  "pending_percentage": 43.1,
  "sector": "Energy_Mining",
  "key_factors": [
    {"factor": "Pending_Cases_High", "impact": -0.23},
    {"factor": "Sector_Energy_Mining", "impact": -0.18},
    {"factor": "Debt_Below_Sector_Avg", "impact": +0.12}
  ],
  "recommendations": [
    "Request partial advance payments",
    "Shorten payment terms to 20 days",
    "Set up escrow account"
  ],
  "predicted_payment_days": 45
}
```

---

### **2. Batch Prediction**
```http
POST /api/v1/predict/batch
Content-Type: multipart/form-data

Request:
- file: <CSV uploaded file>

Response:
{
  "job_id": "batch_20240502_001",
  "status": "PROCESSING",
  "progress": 45,
  "total": 128,
  "predictions": [
    {
      "company_name": "NTPC",
      "risk_score": 78,
      "risk_class": "HIGH_RISK"
    },
    ...
  ]
}
```

---

### **3. Model Info**
```http
GET /api/v1/model/info

Response:
{
  "model_name": "XGBoost Sector Optimized",
  "version": "2.0",
  "last_trained": "2024-05-02T14:32:00Z",
  "accuracy": 0.875,
  "precision": 0.842,
  "recall": 0.891,
  "f1_score": 0.866,
  "training_samples": 128,
  "features": 10,
  "hyperparameters": {
    "n_estimators": 245,
    "max_depth": 5,
    "learning_rate": 0.08,
    "subsample": 0.8,
    "colsample_bytree": 0.85
  }
}
```

---

### **4. Company Database**
```http
GET /api/v1/companies
GET /api/v1/companies?sector=Energy_Mining
GET /api/v1/companies/{company_id}

Response:
{
  "total": 128,
  "companies": [
    {
      "id": 1,
      "name": "NTPC",
      "sector": "Energy_Mining",
      "ticker": "NTPC.NS",
      "disposed_cases": 145,
      "pending_cases": 110,
      "debt_to_equity": 0.95,
      "profit_margin": 12.5,
      "last_risk_assessment": "2024-05-01",
      "risk_score": 78
    },
    ...
  ]
}
```

---

## 🎯 **KEY DECISION LOGIC FOR FRONTEND**

### **Risk Severity Thresholds**
```
Risk Score ≤ 30:  🟢 GREEN   (Low Risk)
Risk Score 31-60: 🟡 YELLOW  (Medium Risk)
Risk Score 61-80: 🟠 ORANGE  (High Risk)
Risk Score ≥ 81:  🔴 RED     (Critical Risk)
```

### **Recommendation Engine**
```
IF (High_Risk_Flag == 1) AND (Pending_Pct > 60%):
   → Recommend: "Request 50% advance payment"

IF (Debt_to_Equity > Sector_Median * 1.5):
   → Recommend: "Verify liquidity situation"

IF (Profit_Margin < 5%):
   → Recommend: "Monitor quarterly for deterioration"

IF (Sector == Energy_Mining):
   → Recommend: "Watch for commodity price impacts"
```

---

## 📊 **DATA FLOW DIAGRAM**

```
┌──────────────────┐
│ MSME Samadhaan   │
│   Web Scraper    │
└────────┬─────────┘
         │ (Grievance Data)
         ↓
    ┌────────────┐
    │  Raw Data  │
    │   CSV      │
    └────┬───────┘
         │
         ↓ (Clean Names)
    ┌──────────────────┐
    │ Name Normalizer  │
    └────┬─────────────┘
         │
         ↓
    ┌───────────────────┐      ┌──────────────────┐
    │ Normalized Names  │      │ YFinance Scraper │
    └────────┬──────────┘      │ (Financial Data) │
             │                 └────────┬─────────┘
             │                          │
             └──────────┬───────────────┘
                        │ (Merge)
                        ↓
              ┌──────────────────────┐
              │   Merged Dataset     │
              │ (Company + Financial)│
              └──────────┬───────────┘
                         │
           ┌─────────────┼─────────────┐
           │ Feature Engine            │
           │ (Sector, Relative Metrics)│
           └──────────────┬────────────┘
                          │
                          ↓
                  ┌─────────────────┐
                  │ Feature Matrix  │
                  │ (10 dimensions) │
                  └────────┬────────┘
                           │
      ┌────────────────────┼────────────────────┐
      │                    │                    │
      ↓                    ↓                    ↓
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │ Training │       │   Test   │       │Validation│
   │ Set 80%  │       │ Set 20%  │       │ Optional │
   └────┬─────┘       └────┬─────┘       └──────────┘
        │                  │
        └──────────┬───────┘
                   │
                   ↓
        ┌────────────────────────┐
        │ Optuna Optimization    │
        │ (150 trials)           │
        │ XGBoost Classifier     │
        └──────┬─────────────────┘
               │
               ↓
        ┌─────────────────────┐
        │ Best Model Saved    │
        │ .pkl file           │
        └──────┬──────────────┘
               │
        ┌──────┴──────┐
        │             │
        ↓             ↓
   ┌────────────┐ ┌──────────────┐
   │  Frontend  │ │   API Server │
   │  (React)   │ │   (FastAPI)  │
   └────────────┘ └──────────────┘
        ↑             ↓
        └─────────────┘
      (Real-time Predictions)
```

---

## 🚀 **FRONTEND TECH RECOMMENDATIONS**

### **For Production-Grade Interactive UI:**

```
1. Frontend Framework:
   ├─ React.js (Recommended) - Large ecosystem
   └─ Vue.js - Faster learning curve

2. UI Component Library:
   ├─ Material-UI (React) - Professional look
   ├─ Chakra UI (React) - Accessibility
   └─ Vuetify (Vue) - Comprehensive

3. Data Visualization:
   ├─ Recharts - React charts
   ├─ Chart.js - Simple & lightweight
   └─ Plotly - Interactive 3D plots

4. State Management:
   ├─ Redux (React) - Scalable
   └─ Vuex (Vue) - Built-in pattern

5. Form Handling:
   ├─ Formik (React)
   ├─ React Hook Form (React) - Lightweight
   └─ VeeValidate (Vue)

6. HTTP Client:
   └─ Axios - Promise-based API calls

7. Styling:
   ├─ Tailwind CSS - Utility-first
   ├─ Styled Components (React)
   └─ SCSS/SASS - Professional

8. Authentication:
   ├─ JWT tokens from backend
   ├─ Auth0 - Enterprise SSO
   └─ Firebase Auth

9. Deployment:
   ├─ Vercel (React native)
   ├─ Netlify - Simple deployment
   ├─ AWS Amplify
   └─ Azure App Service (Enterprise)
```

---

## 💡 **NEXT STEPS**

### **To Build the Frontend:**
1. ✅ Set up React + TypeScript project
2. ✅ Create API integration layer (axios)
3. ✅ Build Dashboard screen
4. ✅ Build Company Analyzer screen
5. ✅ Build Batch Upload screen
6. ✅ Build Analytics/Performance screen
7. ✅ Add authentication & role-based access
8. ✅ Deploy to Vercel/Netlify

Would you like me to generate the **React frontend starter code** with all these screens?

