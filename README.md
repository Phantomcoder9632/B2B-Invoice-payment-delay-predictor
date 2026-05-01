# B2B Invoice Payment Delay Predictor

**A Pro-active MSME Credit-Risk Research Tool**

This project implements a machine learning system designed to predict payment delays in B2B invoices. By leveraging Survival Analysis (Time-to-Event modeling), it goes beyond simple binary classification to predict when a payment is likely to occur, providing a "Hazard Ratio" for B2B entities.

---

## 🏗 Project Architecture & Workflow

The system follows a modular pipeline designed for data lineage and research reproducibility:

- **Ingestion**: Automated Playwright scripts navigate the MSME Samadhaan portal to harvest sector-wise payment data.
- **Processing**: Raw HTML/Table data is cleaned and mapped to unique identifiers (CIN/Udyam).
- **Signal Generation**: Feature engineering transforms static counts into survival durations and success ratios.
- **Modeling**: A Cox Proportional Hazards (CPH) model estimates the probability of payment over time.
- **Service**: A FastAPI backend serves these predictions as real-time risk scores.

---

## 📂 File Structure

```
B2B-invoice-payment-delay-predictor/
├── data/
│   ├── raw/                # Scraped summary CSVs (Central PSU, Railways)
│   ├── processed/          # Cleaned datasets for modeling & HR plots
├── src/
│   ├── scraper/
│   │   ├── samadhaan_main.py      # STABLE: Aggregate PSU summary scraper
│   │   └── discovery_engine.py    # UTILITY: Analyzes portal report structures
│   ├── features/
│   │   └── signal_generator.py    # Logic for duration and event calculation
│   └── models/
│       └── survival_cox.py        # CoxPH implementation & evaluation
├── config/
│   └── settings.py                # Path management & global constants
├── app/
│   └── api/                       # FastAPI backbone (Planned)
├── requirements.txt               # Python 3.14+ dependencies
└── README.md
```

---

## ✅ Achievements & Milestones

### 1. Automated Data Extraction
- Developed a stable Playwright-based scraper (`samadhaan_main.py`) that handles nested iframes and ASP.NET postbacks.
- Successfully mapped and extracted data for 295+ Central PSUs and government entities.

### 2. Survival Model Baseline
- Implemented a Cox Proportional Hazards model using the lifelines library.
- Achieved a Concordance Index ($C$) of 0.67 on initial signals, providing a strong baseline for non-random prediction.
- Generated Hazard Ratio (HR) visualizations demonstrating the impact of invoice amounts on payment probability.

### 3. Engineering Robustness
- Established a Zero-Footprint workflow: The system operates with standardized data folders and configuration paths, ensuring the model is portable.

---

## 📈 Technical Implementation Details

The core of the prediction relies on the Partial Likelihood of the Cox Model:

$$h(t|x) = h_0(t)\exp\left(\sum_{i=1}^{n}\beta_i x_i\right)$$

**Key Components:**
- **Baseline Hazard** ($h_0(t)$): Represents the "risk" of payment delay over time for an average entity.
- **Partial Log-Likelihood**: Optimized to $-590.29$ during the latest training run.

---

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
- Copy `.env.example` to `.env`
- Update API keys and database URLs

### 3. Data Pipeline
- Place raw files in `data/raw/`
- Run data cleaning modules from `src/data_cleaning/`
- Processed data will be saved to `data/processed/`

### 4. Run the Application

**API Server:**
```bash
python -m uvicorn app.api:app --reload
```

**Dashboard:**
```bash
streamlit run app/dashboard.py
```

---

## 🚀 Remaining Roadmap

### Phase 1: Feature Enrichment (Current)
- Integrate Tofler API financial metrics (Profit Margin, Debt-to-Equity) to replace simulated baseline features.
- Implement Interval Censoring logic to handle binned data from the "Age-Category" reports.

### Phase 2: System Integration
- **FastAPI Backbone**: Develop `/predict` endpoints for real-time risk assessment.
- **Trust Matrix**: A visualization dashboard to rank companies from "Platinum" (Safe) to "Critical" (High Risk).

### Phase 3: Research Output
- Finalize a pro-active predictive model capable of assisting in credit-term negotiations for MSMEs.

---

## Key Features

- **Data Scraping**: Automated extraction from Samadhaan portal
- **Data Integration**: Merges Samadhaan data with Tofler API and RBI reports
- **Feature Engineering**: Generates asymmetry ratios and quarter-end flags
- **Survival Analysis**: Cox Proportional Hazards model for time-to-event prediction
- **Interpretability**: Hazard Ratio visualizations and Trust Matrix rankings

## Dependencies

- **Data**: pandas, numpy, openpyxl
- **ML**: scikit-learn, xgboost, lifelines, shap
- **Web**: FastAPI, Streamlit, Selenium, Playwright
- **Viz**: matplotlib, seaborn, plotly

## Development

- Format code with Black: `black src/`
- Lint with Flake8: `flake8 src/`
- Run tests: `pytest`

---

## Project Status

**Lead Developer**: Bikram Hawladar  
**Status**: Active Development (Research Phase)

---

## Notes

- Keep `.env` files out of version control
- Use CIN as primary company identifier
- Maintain data lineage through interim folder
