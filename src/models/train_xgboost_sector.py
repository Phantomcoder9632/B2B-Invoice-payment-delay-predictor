import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def categorize_sector(company_name):
    """Smart heuristic to guess the sector based on the company's name."""
    name = str(company_name).upper()
    if any(word in name for word in ['POWER', 'OIL', 'COAL', 'ENERGY', 'GAS', 'PETROLEUM', 'NTPC', 'ONGC']):
        return 'Energy_Mining'
    elif any(word in name for word in ['RAIL', 'PORT', 'HIGHWAY', 'CONSTRUCTION', 'INFRA', 'STEEL']):
        return 'Infrastructure'
    elif any(word in name for word in ['BANK', 'FINANCE', 'INSURANCE', 'FUND']):
        return 'Financial_Services'
    elif any(word in name for word in ['AERO', 'DEFENCE', 'DEFENSE', 'AVIATION', 'DYNAMICS', 'HAL']):
        return 'Defense_Aerospace'
    else:
        return 'Other_Govt_Services'

def train_sector_model():
    print("🔄 1. Loading Datasets...")
    samadhaan_df = pd.read_csv(RAW_DATA / "raw_central_psu_cases.csv")
    yfinance_df = pd.read_csv(PROCESSED_DATA / "yfinance_signals.csv")
    
    samadhaan_df = samadhaan_df.rename(columns={
        samadhaan_df.columns[1]: 'Company',
        samadhaan_df.columns[3]: 'Disposed_Cases',
        samadhaan_df.columns[4]: 'Pending_Cases'
    }).dropna(subset=['Company'])
    samadhaan_df = samadhaan_df[~samadhaan_df['Company'].str.contains("TOTAL", case=False)]
    
    merged_df = pd.merge(samadhaan_df, yfinance_df, on="Company", how="left")
    
    print("🏭 2. Engineering New Feature: Industry Sectors...")
    # Apply our smart categorization function
    merged_df['Sector'] = merged_df['Company'].apply(categorize_sector)
    
    # ONE-HOT ENCODING: Turn the text categories into binary columns (0s and 1s)
    merged_df = pd.get_dummies(merged_df, columns=['Sector'], drop_first=False)
    
    # Impute missing financial data
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    financial_features = ['Debt to Equity', 'Profit Margin']
    for col in financial_features:
        if col in merged_df.columns:
            merged_df[col] = merged_df[col].fillna(merged_df[col].median())
        else:
            merged_df[col] = 0.0
            
    print("🎯 3. Engineering Target Variable...")
    merged_df['Disposed_Cases'] = pd.to_numeric(merged_df['Disposed_Cases'], errors='coerce').fillna(0)
    merged_df['Pending_Cases'] = pd.to_numeric(merged_df['Pending_Cases'], errors='coerce').fillna(0)
    merged_df['Total_Cases'] = merged_df['Disposed_Cases'] + merged_df['Pending_Cases']
    
    model_df = merged_df[merged_df['Total_Cases'] > 0].copy()
    model_df['Delay_Risk_Ratio'] = model_df['Pending_Cases'] / model_df['Total_Cases']
    model_df['High_Risk_Flag'] = (model_df['Delay_Risk_Ratio'] > 0.50).astype(int)

    # Compile the final feature list (Financials + Sector Binary Columns)
    sector_cols = [col for col in model_df.columns if col.startswith('Sector_')]
    features = ['Is_Public', 'Debt to Equity', 'Profit Margin'] + sector_cols
    
    X = model_df[features]
    y = model_df['High_Risk_Flag']
    
    # Convert booleans to integers for XGBoost (Pandas get_dummies uses True/False by default now)
    X[sector_cols] = X[sector_cols].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    print("🧠 4. Training Sector-Aware XGBoost Classifier...")
    clf = xgb.XGBClassifier(
        n_estimators=150, 
        learning_rate=0.05, 
        max_depth=3, 
        random_state=42,
        eval_metric='logloss'
    )
    clf.fit(X_train, y_train)
    
    y_pred = clf.predict(X_test)
    
    print("\n=======================================================")
    print("🎉 SECTOR-AWARE MODEL COMPLETE")
    print("=======================================================")
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"🎯 FINAL MODEL ACCURACY: {accuracy * 100:.2f}%")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk (0)', 'High Risk (1)']))
    
    print("\n⚖️ FEATURE IMPORTANCE (Did Sectors matter?):")
    importances = clf.feature_importances_
    # Sort features by importance
    feat_imp = pd.DataFrame({'Feature': features, 'Importance': importances * 100})
    feat_imp = feat_imp.sort_values(by='Importance', ascending=False)
    for _, row in feat_imp.iterrows():
        print(f"   -> {row['Feature']}: {row['Importance']:.1f}%")

if __name__ == "__main__":
    train_sector_model()