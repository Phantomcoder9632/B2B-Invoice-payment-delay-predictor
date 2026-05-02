# B2B Invoice Payment Delay Predictor for MSMEs

**An Advanced ML Survival Model for MSME Payment Risk Assessment**

This project is an advanced Machine Learning Survival Model designed to predict payment delays for Micro, Small, and Medium Enterprises (MSMEs) when dealing with Central Public Sector Undertakings (CPSEs). By combining historical grievance data with real-time corporate financial signals, the system estimates the *Probability of Default/Delay* over time.

---

## 🚀 Current Status: Data Engineering Complete

The foundational data pipeline has been established, merging government delay records with external financial health metrics.

### Phase 1 Achievements

1. **MSME Samadhaan Scraper**: Successfully extracted aggregate grievance records (Amounts, Disposed Cases, Pending Cases) for Central PSUs.

2. **External Signal Pipeline (`yfinance`)**: 
   - Built a robust, dictionary-mapped scraper to pull real-time financial ratios (Debt-to-Equity, Profit Margins, Return on Equity) for major listed PSUs (e.g., IOCL, BHEL, NTPC).
   - Engineered a fallback system that successfully identifies and isolates unlisted/100% government-owned entities (e.g., BSNL, Air India) for future data imputation.

---

## � Repository Structure

```text
B2B_Payment_Predictor/
│
├── config/
│   └── settings.py              # Directory paths and global variables
│
├── data/
│   ├── raw/                     # Original scraped data (raw_central_psu_cases.csv)
│   └── processed/               # Cleaned data (yfinance_signals.csv, unmapped_psus.csv)
│
├── src/
│   ├── scraper/
│   │   ├── samadhaan_scraper.py # Extracts MSME delay counts
│   │   └── yfinance_signals.py  # Extracts corporate financial ratios
│   │
│   └── models/                  # (Upcoming) ML model training scripts
│
├── requirements.txt             # Project dependencies (lifelines, yfinance, etc.)
└── README.md
```

---

## 🛠️ Tech Stack

- **Language**: Python 3.10+
- **Data Extraction**: yfinance, Playwright (deprecated for this use case), BeautifulSoup
- **Data Processing**: Pandas, NumPy
- **Machine Learning**: lifelines (Cox Proportional Hazards Model) - In Progress
- **Frontend**: FastAPI, Streamlit - Planned

---

## 📊 Next Steps (Phase 2: Modeling)

1. **Data Merging**: Combine `raw_central_psu_cases.csv` with `yfinance_signals.csv`.

2. **Imputation Strategy**: Assign an `Is_Public` flag and apply Sector Median Imputation for the unlisted PSUs isolated in `unmapped_psus.csv`.

3. **Feature Engineering**: Calculate the 'Hazard Ratio' proxy using Total Pending Cases vs. Disposed Cases.

4. **Model Training**: Train the lifelines Cox Proportional Hazards Model to output survival curves for invoice payment probability.

---

## ⚙️ Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
- Update `config/settings.py` with appropriate data paths
- Set up API keys if using external data sources

### 3. Run Data Extraction
```bash
# Extract MSME grievance data
python -m src.scraper.samadhaan_scraper

# Extract financial signals from yfinance
python -m src.scraper.yfinance_signals
```

### 4. Data Processing
```bash
# Processed data will be generated in data/processed/
# - yfinance_signals.csv: Financial ratios for listed PSUs
# - unmapped_psus.csv: Unlisted/government-owned entities for imputation
```
