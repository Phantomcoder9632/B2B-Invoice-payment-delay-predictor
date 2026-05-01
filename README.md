# B2B Invoice Payment Delay Predictor

A machine learning system to predict payment delays in B2B invoices using survival analysis and classification techniques.

## Project Structure

```
b2b-payment-prediction/
├── data/
│   ├── raw/                # Verbatim files: "Report.xls", "Report (1).xls", and raw scrapes
│   ├── interim/            # Output from name_cleaner.py (CIN mappings)
│   ├── external/           # Brother's Tofler API JSONs & RBI PDF reports
│   └── processed/          # The final "Gold Dataset" (merged Samadhaan + Tofler)
├── src/
│   ├── scraper/            # Browser-based extraction from Samadhaan portal
│   ├── data_cleaning/      # Pre-modeling data processing logic
│   ├── features/           # Feature engineering and signal generation
│   └── models/             # Prediction models (Cox, XGBoost, evaluation)
├── app/
│   ├── api.py              # FastAPI endpoints
│   └── dashboard.py        # Streamlit frontend
├── config/
│   └── settings.py         # Configuration constants
├── requirements.txt        # Project dependencies
├── .env                    # Environment variables (secret keys)
└── README.md               # This file
```

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

## Key Features

- **Data Scraping**: Automated extraction from Samadhaan portal
- **Data Integration**: Merges Samadhaan data with Tofler API and RBI reports
- **Feature Engineering**: Generates asymmetry ratios and quarter-end flags
- **Survival Analysis**: Cox Proportional Hazards model for time-to-event prediction
- **Classification**: XGBoost baseline for binary classification
- **Interpretability**: SHAP explanations and Trust Matrix visualizations

## Dependencies

- **Data**: pandas, numpy, openpyxl
- **ML**: scikit-learn, xgboost, lifelines, shap
- **Web**: FastAPI, Streamlit, Selenium, Playwright
- **Viz**: matplotlib, seaborn, plotly

## Development

- Format code with Black: `black src/`
- Lint with Flake8: `flake8 src/`
- Run tests: `pytest`

## Notes

- Keep `.env` files out of version control
- Use CIN as primary company identifier
- Maintain data lineage through interim folder
