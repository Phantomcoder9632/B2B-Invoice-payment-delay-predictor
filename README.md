# 🏢 B2B Invoice Payment Delay Predictor

> **Predicting MSME Payment Risks through Bureaucratic Heuristics + Data Science**  
> *Solving the capital stagnation crisis facing Indian MSMEs*

[![Python](https://img.shields.io/badge/Python-3.12%2B-blue?logo=python&style=for-the-badge)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/API-FastAPI-green?logo=fastapi&style=for-the-badge)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-cyan?logo=react&style=for-the-badge)](https://react.dev/)
[![XGBoost](https://img.shields.io/badge/ML-XGBoost-orange?logo=python&style=for-the-badge)](https://xgboost.readthedocs.io/)
[![Vite](https://img.shields.io/badge/Build-Vite-purple?logo=vite&style=for-the-badge)](https://vitejs.dev/)

---

## 🚀 **Quick Start** 

Get the application running in **2 minutes**:

```bash
# 1️⃣  Create Virtual Environment & Install Backend Dependencies
python -m venv venv
venv\Scripts\Activate
pip install -r backend/requirements.txt

# 2️⃣  Install Frontend Dependencies
cd frontend
npm install
cd ..

# 3️⃣  Start Backend (Terminal 1)
cd backend
uvicorn api:app --reload --port 8000

# 4️⃣  Start Frontend (Terminal 2)
cd frontend
npm run dev

# 5️⃣  Open Browser
# → Frontend: http://localhost:5175
# → API Docs: http://localhost:8000/docs
```

✅ **Done!** Both services are now running.

---

## 📋 **Table of Contents**

1. [🎯 The Problem](#-the-problem-context)
2. [💡 The Solution](#-the-solution-our-approach)
3. [🏗️ System Architecture](#%EF%B8%8F-system-architecture)
4. [📊 Complete Workflow](#-complete-data-workflow)
5. [🔧 Installation & Setup](#-installation--setup)
6. [🚀 Running the Application](#-running-the-application)
7. [📁 Project Structure](#-project-structure)
8. [🧪 API Endpoints](#-api-endpoints)
9. [🎨 Frontend Screens](#-frontend-screens)
10. [🔍 Key Insights](#-key-insights--research-findings)
11. [📚 Technology Stack](#-technology-stack)
12. [👨‍💻 Development](#-development)
13. [📝 License](#-license)

---

## 🎯 **The Problem: Context**

### The Unseen Crisis in Indian MSMEs

**Small and Medium Enterprises (MSMEs)** are the backbone of the Indian economy, contributing ~29% of GDP and employing millions. Yet they face a critical bottleneck:

> 💸 **"Capital Stagnation"** — Delayed payments from **Central Public Sector Enterprises (CPSEs)** for goods/services supplied.

#### The Numbers:
- 📊 **128+ Central PSUs** process invoices from MSMEs
- ⏳ **Thousands of pending cases** recorded on the MSME Samadhaan portal
- 💰 **Billions of rupees** stuck in delayed payment cycles
- 📉 **MSMEs suffer** due to cash flow shortages, unable to invest in growth

### The Research Question 🤔

**Does a government entity's *financial health* predict its payment behavior, or is the bottleneck purely *bureaucratic*?**

**Traditional Hypothesis:**
> *"If a company is financially healthy (high profit, low debt), it pays on time."*

**This project challenges that assumption.** 🚨

---

## 💡 **The Solution: Our Approach**

### The Core Research Insight ✨

After analyzing 128+ CPSEs across **5 years of payment history**, this project empirically proved:

#### 🎯 **Key Finding:**
**Financial metrics (Profit Margin, Debt-to-Equity) have *0.0% predictive weight* on payment delays.**

Instead, **two factors drive payment delays:**
1. 🏛️ **Public Accountability** (Is the entity publicly listed?)
2. 🏭 **Sector Classification** (Which industry sector?)

### Why This Matters

| Factor | Predictive Importance | Finding |
|--------|----------------------|---------|
| 📊 Debt-to-Equity Ratio | **0.0%** | ❌ Financial health is NOT a signal |
| 💰 Profit Margin | **0.0%** | ❌ Profitability is irrelevant |
| 🏛️ Public Listing Status | **48.3%** | ✅ **Regulatory scrutiny matters** |
| 🏭 Sector Classification | **51.7%** | ✅ **Structural bureaucracy varies by sector** |

### The Implication

**Payment delays are structural, not financial.** They stem from:
- Bureaucratic inefficiencies unique to each sector
- Regulatory oversight on listed vs. unlisted entities
- Administrative bottlenecks, not cash flow problems

---

## 🏗️ **System Architecture**

### End-to-End Data Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA ACQUISITION                         │
├──────────────────────────────────┬──────────────────────────┤
│  MSME Samadhaan Scraper          │  YFinance Scraper        │
│  (Grievance Data)                │  (Financial Signals)     │
│  • Disposed Cases                │  • Debt-to-Equity        │
│  • Pending Cases                 │  • Profit Margin         │
│  • Amount Involved               │  • ROE, P/B Ratio        │
└──────────────────────────────────┴──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                 DATA CLEANING & MERGING                     │
├──────────────────────────────────┬──────────────────────────┤
│  Name Normalization              │  Fuzzy Matching          │
│  (Remove unit details, etc.)     │  (thefuzz library)       │
│                                  │                          │
│  Left Join: Samadhaan Data       │                          │
│  Right Join: Financial Data      │                          │
└──────────────────────────────────┴──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               FEATURE ENGINEERING                           │
├──────────────────────────────────┬──────────────────────────┤
│  • Sector Categorization         │  • Is_Public Flag        │
│  • Sector-Relative Features      │  • Delay Risk Ratio      │
│  • One-Hot Encoding              │  • Target Variable       │
└──────────────────────────────────┴──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         MODEL TRAINING & OPTIMIZATION                       │
├──────────────────────────────────┬──────────────────────────┤
│  • XGBoost Classifier            │  • Optuna (150 trials)   │
│  • SMOTE Oversampling            │  • Bayesian Optimization │
│  • 80-20 Train-Test Split        │  • Hyperparameter Tune   │
└──────────────────────────────────┴──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  THRESHOLD OPTIMIZATION                     │
├──────────────────────────────────┬──────────────────────────┤
│  Optuna Threshold Tuning         │  Decision Threshold      │
│  (Maximize Recall: 88.0%)        │  = 0.46                  │
└──────────────────────────────────┴──────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               INFERENCE & RISK SCORING                      │
├──────────────────────────────────┬──────────────────────────┤
│  • Single Company Predictions    │  • Risk Score (0-100)    │
│  • Batch Predictions             │  • High/Low Risk Class   │
│  • Dashboard Analytics           │  • MSME Recommendations  │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 📊 **Complete Data Workflow**

### **PHASE 1: Data Collection & Ingestion**

#### 1.1 MSME Samadhaan Grievance Database

```python
# Source: https://samadhaan.msme.gov.in/
# Scraper: backend/src/scraper/samadhaan_main.py

Data Extracted per CPSE:
├── Company Name
├── Total Applications
├── Rejected Cases
├── Disposed Cases ✅ (Successfully resolved/paid)
├── Pending Cases ⏳ (Still awaiting payment)
├── Amount Involved 💰
└── Last Updated

Output: backend/data/raw/raw_central_psu_cases.csv
        (128+ Central PSUs with payment history)
```

#### 1.2 YFinance Corporate Financial Signals

```python
# Source: Yahoo Finance API
# Scraper: backend/src/scraper/yfinance_signals.py

Data Extracted per Listed CPSE:
├── Debt-to-Equity Ratio
├── Profit Margin
├── Return on Equity (ROE)
├── Price-to-Book Ratio
└── Industry Sector Classification

Output: backend/data/processed/yfinance_signals.csv
        (128 companies × 5 financial signals)
```

---

### **PHASE 2: Data Cleaning & Normalization**

#### 2.1 Name Normalization

```
Input (Dirty):   "HINDUSTAN PETROLEUM CORPORATION LTD, HAZIRA UNIT"
                  ↓ Cleaning Pipeline
Output (Clean):  "HINDUSTAN PETROLEUM CORPORATION"

Cleaning Steps:
✓ Uppercase standardization
✓ Remove unit-specific details
✓ Standardize legal suffixes (PVT LTD, LIMITED → remove)
✓ Remove special characters & extra spaces
✓ Trim whitespace
```

#### 2.2 Data Merging & Enrichment

```
Left Table:  Samadhaan Data (128 PSUs) ─┐
                                         ├─→ Fuzzy Match → Merged DataFrame
Right Table: YFinance Data (Financial) ─┘
                                         
Join Type: LEFT OUTER
├── Listed PSUs → Get financial data ✅
├── Unlisted PSUs → Set to NULL, impute with 0 🔄
└── Government-owned → Identify separately

Outcome Variables Created:
├── Total_Cases = Disposed + Pending
├── Delay_Risk_Ratio = Pending / Total
└── High_Risk_Flag = (Delay_Risk_Ratio > 0.46) ? 1 : 0 ⚠️
```

---

### **PHASE 3: Feature Engineering**

#### 3.1 Sector Categorization (5 Sectors)

| Sector | Keywords | Example |
|--------|----------|---------|
| 🔋 **Energy_Mining** | POWER, OIL, COAL, ENERGY, GAS, NTPC, ONGC | Indian Oil, NTPC |
| 🛣️ **Infrastructure** | RAIL, PORT, HIGHWAY, CONSTRUCTION, STEEL | RVNL, IRCON, SAIL |
| 🏦 **Financial_Services** | BANK, FINANCE, INSURANCE, FUND | SBI, BoB, LIC |
| ✈️ **Defense_Aerospace** | AERO, DEFENCE, AVIATION, HAL | HAL, BEL |
| 🏢 **Other_Govt_Services** | (Default category) | BSNL, Air India |

#### 3.2 Feature Matrix (10 Total Features)

```
📋 BASE FEATURES (3):
├── Is_Public: 1 = Listed on stock exchange, 0 = Unlisted
├── Debt_to_Equity: From YFinance
└── Profit_Margin: From YFinance

📊 SECTOR-RELATIVE FEATURES (2):
├── Sector_Relative_Profit = Company Profit - Sector Median
│   └── Identifies if company is better/worse than peers
└── Sector_Relative_Debt = Company Debt/Equity - Sector Median
    └── Shows if company more/less leveraged than peers

🏷️ CATEGORICAL FEATURES (5, One-Hot Encoded):
├── Sector_Energy_Mining [0/1]
├── Sector_Infrastructure [0/1]
├── Sector_Financial_Services [0/1]
├── Sector_Defense_Aerospace [0/1]
└── Sector_Other_Govt_Services [0/1]
    (Drop first = 4 sectors included, 1 is baseline)

🎯 TARGET VARIABLE:
├── 1 = HIGH RISK: Delay_Risk_Ratio > 46%
└── 0 = LOW RISK: Delay_Risk_Ratio ≤ 46%
```

---

### **PHASE 4: Model Training & Optimization**

#### 4.1 Bayesian Hyperparameter Tuning

```python
# Algorithm: XGBoost Classification (Binary)
# Optimizer: Optuna (Bayesian Search, 150 trials)

Hyperparameters Tuned:
├── n_estimators: 50-300 (boosting rounds)
├── max_depth: 2-7 (tree depth)
├── learning_rate: 0.01-0.3 (shrinkage)
├── subsample: 0.5-1.0 (row sampling)
├── colsample_bytree: 0.5-1.0 (feature sampling)
├── gamma: 0-5 (min loss reduction)
└── min_child_weight: 1-5 (min samples in leaf)

Data Split:
├── Train Set: 80% (pattern learning)
├── Test Set: 20% (evaluation)
└── Random State: 42 (reproducibility)

Evaluation Metric: Recall
└── Objective: Maximize recall for high-risk entities (Achieved: 88.0%) 🎯
```

---

### **PHASE 5: Threshold Optimization**

```
Optuna tuned decision threshold to maximize F1-score
┌─────────────────────────────────────────────────────┐
│  Optimal Decision Threshold = 0.46                  │
├─────────────────────────────────────────────────────┤
│  • Risk Score ≥ 0.46 → HIGH RISK ⚠️                 │
│  • Risk Score < 0.46  → LOW RISK ✅                 │
└─────────────────────────────────────────────────────┘

This threshold maximizes recall (catch risky entities)
while maintaining acceptable precision (minimize false alarms)
```

---

## 🔧 **Installation & Setup**

### Prerequisites

- **Python 3.12+** ([Download](https://www.python.org/downloads/))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **Git** (for version control)

### Step 1: Clone Repository

```bash
git clone https://github.com/yourusername/b2b-invoice-delay-predictor.git
cd b2b-invoice-delay-predictor
```

### Step 2: Backend Setup

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\Activate

# Install dependencies
pip install -r backend/requirements.txt
```

#### Backend Dependencies:

```
Core Stack:
- pandas>=2.2.0       (Data manipulation)
- numpy>=1.26.0       (Numerical computing)
- scikit-learn>=1.4.0 (ML utilities)

Model & Optimization:
- xgboost>=2.0.0      (Classification)
- optuna>=3.6.0       (Hyperparameter tuning)
- joblib>=1.3.0       (Model serialization)

API Server:
- fastapi>=0.110.0    (Web framework)
- uvicorn>=0.27.0     (ASGI server)

Data Pipeline:
- yfinance>=0.2.33    (Financial data)
- playwright>=1.41.0  (Web scraping)
- beautifulsoup4>=4.12.0 (HTML parsing)
- thefuzz>=0.22.0     (Name matching)
```

### Step 3: Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

cd ..
```

---

## 🚀 **Running the Application**

### Option 1: Run Both Services (Recommended)

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\Activate
uvicorn api:app --reload --port 8000
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Expected output:
```
VITE v8.0.10 ready in 200 ms
➜  Local: http://localhost:5175/
```

### Option 2: Run Backend Only (API Testing)

```bash
cd backend
uvicorn api:app --reload --port 8000
```

Access API documentation: **http://localhost:8000/docs** (Swagger UI)

---

## 📁 **Project Structure**

```
📦 B2B Invoice Payment Delay Predictor/
│
├── 📂 backend/
│   ├── api.py                           # FastAPI server (main entry point)
│   ├── inference.py                     # Model prediction logic
│   ├── requirements.txt                 # Python dependencies
│   │
│   ├── 📂 config/
│   │   └── settings.py                  # Configuration variables
│   │
│   ├── 📂 models/
│   │   ├── xgboost_risk_model.pkl       # Trained XGBoost model ✨
│   │   └── model_features.pkl           # Feature list
│   │
│   ├── 📂 data/
│   │   ├── raw/                         # Raw scraped data
│   │   └── processed/                   # Cleaned & processed data
│   │
│   └── 📂 src/
│       ├── 📂 scraper/                  # Web scrapers
│       │   ├── samadhaan_main.py        # MSME Samadhaan scraper
│       │   ├── yfinance_signals.py      # Financial data scraper
│       │   └── selectors.py             # CSS selectors
│       │
│       ├── 📂 data_cleaning/            # Data processing
│       │   ├── name_normalizer.py
│       │   ├── tofler_merger.py
│       │   └── mock_gen.py
│       │
│       ├── 📂 features/                 # Feature engineering
│       │   └── signal_generator.py
│       │
│       └── 📂 models/                   # Training scripts
│           ├── train_xgboost_sector_optimized.py  (Final model)
│           ├── train_cox_model_v1.py
│           ├── train_ensemble_classifier.py
│           └── ... (other experiments)
│
├── 📂 frontend/
│   ├── package.json                     # NPM dependencies
│   ├── vite.config.js                   # Vite configuration
│   ├── index.html                       # HTML entry point
│   ├── eslint.config.js                 # Linting config
│   │
│   └── 📂 src/
│       ├── main.jsx                     # React entry point
│       ├── App.jsx                      # Main app component
│       ├── api.js                       # API client (HTTP calls)
│       ├── helpers.js                   # Utility functions
│       ├── index.css                    # Global styles
│       │
│       ├── 📂 components/
│       │   ├── Navbar.jsx               # Navigation bar
│       │   ├── Tutorial.jsx             # Onboarding overlay
│       │   └── Shared.jsx               # Shared UI components
│       │
│       ├── 📂 screens/                  # Application pages
│       │   ├── DashboardScreen.jsx      # Analytics dashboard
│       │   ├── AnalyzerScreen.jsx       # Single company predictor
│       │   ├── BatchScreen.jsx          # Batch predictions
│       │   └── ModelScreen.jsx          # Model explanation
│       │
│       └── 📂 data/
│           └── mockData.js              # Mock data for testing
│
├── 📄 .gitignore                        # Git ignore rules
├── 📄 README.md                         # This file
└── 📄 PROJECT_WORKFLOW.md               # Detailed methodology
```

---

## 🧪 **API Endpoints**

All endpoints are documented in interactive Swagger UI: **http://localhost:8000/docs**

### Health Check

```http
GET /health
```

Response:
```json
{
  "model_loaded": true,
  "n_features": 10,
  "features": ["Is_Public", "Debt to Equity", ...],
  "decision_threshold": 0.46,
  "key_finding": "Profit Margin and Debt-to-Equity have 0.0% predictive importance..."
}
```

### Single Company Prediction

```http
POST /predict
Content-Type: application/json

{
  "company_name": "NTPC Limited",
  "disposed_cases": 145,
  "pending_cases": 110,
  "is_public": true,
  "debt_to_equity": 0.95,
  "profit_margin": 12.5
}
```

Response:
```json
{
  "company_name": "NTPC Limited",
  "risk_score": 72.3,
  "risk_class": "HIGH_RISK",
  "disposal_ratio": 0.569,
  "sector": "Energy_Mining",
  "key_drivers": {
    "Public Listing Status": "Listed (High Scrutiny) ⚠️",
    "Sector": "Energy_Mining (Bureaucratic challenges)"
  },
  "recommendations": [
    "Monitor payment timelines closely",
    "Consider partial advance payments",
    "Build contingency cash reserves"
  ]
}
```

### Batch Predictions

```http
POST /batch
Content-Type: application/json

{
  "companies": [
    { "company_name": "NTPC Limited", "disposed_cases": 145, ... },
    { "company_name": "SAIL Limited", "disposed_cases": 200, ... }
  ]
}
```

Response: Array of prediction objects

### Dashboard Statistics

```http
GET /stats
```

Returns sector-wise risk breakdown and key metrics.

---

## 🎨 **Frontend Screens**

### 1. **Dashboard Screen** 📊
- Sector-wise risk distribution (bar chart)
- Key statistics summary
- Model performance metrics

### 2. **Analyzer Screen** 🔍
- Single company risk prediction
- Risk score visualization
- Key driver breakdown
- MSME-friendly recommendations

### 3. **Batch Screen** 📋
- Upload CSV with multiple companies
- Batch predictions in one request
- Download results as CSV

### 4. **Model Screen** 🤖
- Detailed model explanation
- Research findings
- Hyperparameter details
- Threshold optimization story

---

## 🔍 **Key Insights & Research Findings**

### 🎯 Main Discovery: The Bureaucracy Paradox

**Question:** Does financial health predict payment delays?

**Answer:** ❌ **No.** Financial metrics have 0.0% predictive importance.

### 📊 Predictive Importance Breakdown

```
┌─────────────────────────────────────────┬──────────┐
│ Factor                                  │ Importance│
├─────────────────────────────────────────┼──────────┤
│ 🏛️  Public Listing Status (Is_Public)   │  48.3%   │ ✅ KEY
│ 🏭 Sector Classification                │  51.7%   │ ✅ KEY
│ 💰 Profit Margin                        │   0.0%   │ ❌ NONE
│ 📊 Debt-to-Equity Ratio                 │   0.0%   │ ❌ NONE
│ 🔄 Sector-Relative Features             │   0.0%   │ ❌ NONE
└─────────────────────────────────────────┴──────────┘
```

### 💡 What This Means

1. **Financial Health ≠ Payment Behavior**
   - A profitable company can still delay payments
   - A financially stressed company can pay on time
   - Money isn't the issue — structure is.

2. **Public Accountability Matters (48.3%)**
   - Listed companies face regulatory scrutiny
   - Stock market investors demand transparency
   - Payment delays directly impact stock price
   - **Result:** More efficient payment cycles

3. **Sector Bureaucracy Varies (51.7%)**
   - Infrastructure sector has different approval chains than Banking
   - Defense sector has stricter compliance workflows
   - Energy sector faces commodity price volatility
   - **Result:** Sector-specific payment patterns

### 🎯 Practical Implications for MSMEs

| If Supplier Deals With | Risk Level | Why | Recommendation |
|------------------------|-----------|-----|-----------------|
| Listed Bank | 🟢 **LOW** | Regulatory scrutiny | Confidence in payment |
| Unlisted Energy PSU | 🔴 **HIGH** | Bureaucratic bottlenecks | Require partial advance |
| Infrastructure CPSE | 🔴 **HIGH** | Complex approval process | Build cash reserves |
| Defense Contractor | 🔴 **HIGH** | Compliance overhead | Long payment cycles |

---

## 📚 **Technology Stack**

### Backend

| Component | Technology | Why |
|-----------|-----------|-----|
| **Web Framework** | FastAPI | Fast, async, auto-documentation |
| **Server** | Uvicorn | ASGI server for Python |
| **ML Model** | XGBoost | Gradient boosting, interpretable |
| **Optimization** | Optuna | Bayesian hyperparameter search |
| **Data** | Pandas + NumPy | Efficient data manipulation |
| **Serialization** | Joblib | Save/load trained models |
| **Scraping** | Playwright + BeautifulSoup | Modern web scraping |
| **CORS** | FastAPI Middleware | Cross-origin requests from frontend |

### Frontend

| Component | Technology | Why |
|-----------|-----------|-----|
| **Framework** | React 19 | Component-based UI |
| **Build Tool** | Vite | Ultra-fast development server |
| **Animations** | Framer Motion | Physics-based animations |
| **Charts** | Recharts | React charting library |
| **Icons** | Lucide-React | Beautiful, lightweight icons |
| **Styling** | Custom CSS | Fine-grained control, variables |
| **HTTP** | Fetch API | Native browser HTTP |

### Development

| Tool | Purpose |
|------|---------|
| **Git** | Version control |
| **ESLint** | Code quality (JavaScript) |
| **Pytest** | Unit testing (Python) |
| **Black** | Code formatting (Python) |

---

## 👨‍💻 **Development**

### Project Structure Explanation

#### Backend Pipeline Flow

```
User Input
    ↓
[api.py] — FastAPI endpoint
    ↓
[inference.py] — Feature engineering & prediction
    ↓
[xgboost_risk_model.pkl] — Trained model
    ↓
Risk Score + Recommendations
    ↓
JSON Response → Frontend
```

#### Frontend Component Hierarchy

```
App.jsx (Main Shell)
├── Navbar (Navigation)
├── Tutorial (Onboarding Overlay)
└── Screen Router
    ├── DashboardScreen
    ├── AnalyzerScreen
    ├── BatchScreen
    └── ModelScreen
```

### Running in Development Mode

#### Backend Development
```bash
cd backend
uvicorn api:app --reload --port 8000
```

The `--reload` flag enables:
- ✅ Auto-reload on code changes
- ✅ Debuggable error messages
- ✅ Interactive API docs at `/docs`

#### Frontend Development
```bash
cd frontend
npm run dev
```

Vite provides:
- ✅ Hot Module Replacement (HMR)
- ✅ Instant feedback on code changes
- ✅ Optimized bundle size

---

## 📝 **License**

This project is licensed under the **MIT License** — See [LICENSE](LICENSE) file for details.

**Attribution:** Built by **Bikram Hawladar**, 4th Year B.Tech, IIIT Dharwad

---

## 🙌 **Contributing**

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📞 **Support & Questions**

- 📧 Email: (connect.bikram9632@gmail.com)
- 🐙 GitHub Issues: [Create an issue](https://github.com/Phantomcoder9632/B2B-Invoice-payment-delay-predictor/issues)
- 📚 Documentation: See [PROJECT_WORKFLOW.md](backend/PROJECT_WORKFLOW.md) for technical details

---

## 🎉 **Acknowledgments**

- **MSME Samadhaan Portal** — For grievance data
- **Yahoo Finance** — For financial data
- **Optuna, XGBoost teams** — For excellent ML libraries
- **FastAPI & React communities** — For amazing frameworks

---

**Made with responsibility for Indian MSMEs**

<div align="center">

![Python](https://img.shields.io/badge/Made%20with-Python%20%2B%20React-blue?style=flat-square)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg?style=flat-square)

**⭐ If this project helped you, please consider giving it a star!**

</div>
