import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from imblearn.over_sampling import SMOTE
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def train_ultimate_classifier():
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
    
    print("🧹 2. Imputing Core Features...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    
    # We drop Current Ratio and ROE because the AI proved they are 0% useful
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

    features = ['Is_Public', 'Debt to Equity', 'Profit Margin']
    X = model_df[features]
    y = model_df['High_Risk_Flag']
    
    print("🧬 4. Applying SMOTE (Synthesizing Data)...")
    # SMOTE will generate synthetic examples to balance and enrich the training data
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X, y)
    print(f"   -> Original dataset size: {len(X)}. Synthesized dataset size: {len(X_resampled)}")
    
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.20, random_state=42)
    
    print("🧠 5. Training Final XGBoost Model with Tuned Thresholds...")
    
    # Using the best parameters we found in the previous GridSearch
    clf = xgb.XGBClassifier(
        n_estimators=200, 
        learning_rate=0.1, 
        max_depth=4, 
        subsample=0.8,
        colsample_bytree=1.0,
        random_state=42,
        eval_metric='logloss'
    )
    
    clf.fit(X_train, y_train)
    
    # --- THRESHOLD TUNING ---
    # Instead of predict(), we get the raw probabilities
    y_pred_proba = clf.predict_proba(X_test)[:, 1] # Probability of being High Risk
    
    # We lower the barrier. If it's even 45% sure, we flag it as High Risk.
    CUSTOM_THRESHOLD = 0.45
    y_pred_custom = (y_pred_proba >= CUSTOM_THRESHOLD).astype(int)
    
    print("\n=======================================================")
    print("🎉 ULTIMATE XGBOOST MODEL (SMOTE + THRESHOLD TUNING)")
    print("=======================================================")
    
    accuracy = accuracy_score(y_test, y_pred_custom)
    print(f"🎯 FINAL MODEL ACCURACY: {accuracy * 100:.2f}%")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred_custom, target_names=['Low Risk (0)', 'High Risk (1)']))

if __name__ == "__main__":
    train_ultimate_classifier()