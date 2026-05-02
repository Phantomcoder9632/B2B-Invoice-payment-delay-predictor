import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def train_ultimate_ensemble():
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
    
    print("🧹 2. Imputing and Scaling Core Features...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    financial_features = ['Debt to Equity', 'Profit Margin']
    
    for col in financial_features:
        if col in merged_df.columns:
            merged_df[col] = merged_df[col].fillna(merged_df[col].median())
        else:
            merged_df[col] = 0.0

    print("🧪 3. Advanced Feature Engineering (Interaction Terms)...")
    # Creating new synthetic columns to expose hidden mathematical patterns
    merged_df['Profit_Debt_Interaction'] = merged_df['Profit Margin'] * merged_df['Debt to Equity']
    # Adding a tiny number (0.001) to avoid dividing by zero
    merged_df['Profit_per_Debt'] = merged_df['Profit Margin'] / (merged_df['Debt to Equity'] + 0.001) 
            
    print("🎯 4. Engineering Target Variable...")
    merged_df['Disposed_Cases'] = pd.to_numeric(merged_df['Disposed_Cases'], errors='coerce').fillna(0)
    merged_df['Pending_Cases'] = pd.to_numeric(merged_df['Pending_Cases'], errors='coerce').fillna(0)
    merged_df['Total_Cases'] = merged_df['Disposed_Cases'] + merged_df['Pending_Cases']
    
    model_df = merged_df[merged_df['Total_Cases'] > 0].copy()
    model_df['Delay_Risk_Ratio'] = model_df['Pending_Cases'] / model_df['Total_Cases']
    model_df['High_Risk_Flag'] = (model_df['Delay_Risk_Ratio'] > 0.50).astype(int)

    # We now have 5 features instead of 3
    features = ['Is_Public', 'Debt to Equity', 'Profit Margin', 'Profit_Debt_Interaction', 'Profit_per_Debt']
    X = model_df[features]
    y = model_df['High_Risk_Flag']
    
    # Standardize the data (crucial for Logistic Regression)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    print("🧬 5. Applying SMOTE (Synthesizing Data)...")
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_scaled, y)
    
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.20, random_state=42)
    
    print("🧠 6. Assembling the AI 'Board of Directors' (Voting Classifier)...")
    
    # Model 1: The Optimized XGBoost
    model_xgb = xgb.XGBClassifier(n_estimators=100, learning_rate=0.05, max_depth=3, random_state=42, eval_metric='logloss')
    
    # Model 2: Random Forest (Great at handling noisy data)
    model_rf = RandomForestClassifier(n_estimators=100, max_depth=3, random_state=42)
    
    # Model 3: Logistic Regression (Great at finding simple linear trends)
    model_lr = LogisticRegression(random_state=42, max_iter=500)
    
    # The Ensemble: They vote on the outcome using 'soft' voting (averaging their probabilities)
    ensemble = VotingClassifier(
        estimators=[('xgb', model_xgb), ('rf', model_rf), ('lr', model_lr)],
        voting='soft'
    )
    
    ensemble.fit(X_train, y_train)
    
    # We will keep the 45% threshold tuning because it worked well for recall
    y_pred_proba = ensemble.predict_proba(X_test)[:, 1]
    CUSTOM_THRESHOLD = 0.45
    y_pred_custom = (y_pred_proba >= CUSTOM_THRESHOLD).astype(int)
    
    print("\n=======================================================")
    print("🎉 ENSEMBLE MODEL (XGB + RF + LR + FEATURE ENG)")
    print("=======================================================")
    
    accuracy = accuracy_score(y_test, y_pred_custom)
    print(f"🎯 FINAL MODEL ACCURACY: {accuracy * 100:.2f}%")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred_custom, target_names=['Low Risk (0)', 'High Risk (1)']))

if __name__ == "__main__":
    train_ultimate_ensemble()