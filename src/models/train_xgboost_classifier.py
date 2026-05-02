import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def prepare_and_train_classifier():
    print("🔄 1. Loading and Merging Datasets...")
    
    samadhaan_df = pd.read_csv(RAW_DATA / "raw_central_psu_cases.csv")
    yfinance_df = pd.read_csv(PROCESSED_DATA / "yfinance_signals.csv")
    
    samadhaan_df = samadhaan_df.rename(columns={
        samadhaan_df.columns[1]: 'Company',
        samadhaan_df.columns[3]: 'Disposed_Cases',
        samadhaan_df.columns[4]: 'Pending_Cases'
    })
    
    samadhaan_df = samadhaan_df.dropna(subset=['Company'])
    samadhaan_df = samadhaan_df[~samadhaan_df['Company'].str.contains("TOTAL", case=False)]
    merged_df = pd.merge(samadhaan_df, yfinance_df, on="Company", how="left")
    
    print("🧹 2. Imputing Missing Financials...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    financial_features = ['Debt to Equity', 'Profit Margin', 'Current Ratio']
    
    for col in financial_features:
        if col in merged_df.columns:
            merged_df[col] = merged_df[col].fillna(merged_df[col].median())
        else:
            merged_df[col] = 0.0
            
    print("🎯 3. Engineering the Target Variable (High vs. Low Risk)...")
    
    # Clean the counts
    merged_df['Disposed_Cases'] = pd.to_numeric(merged_df['Disposed_Cases'], errors='coerce').fillna(0)
    merged_df['Pending_Cases'] = pd.to_numeric(merged_df['Pending_Cases'], errors='coerce').fillna(0)
    merged_df['Total_Cases'] = merged_df['Disposed_Cases'] + merged_df['Pending_Cases']
    
    # Filter out companies with no cases
    model_df = merged_df[merged_df['Total_Cases'] > 0].copy()
    
    # Calculate Risk Ratio
    model_df['Delay_Risk_Ratio'] = model_df['Pending_Cases'] / model_df['Total_Cases']
    
    # THE LABEL: 1 if High Risk (> 50% delayed), 0 if Low Risk
    model_df['High_Risk_Flag'] = (model_df['Delay_Risk_Ratio'] > 0.50).astype(int)
    
    baseline_risk = model_df['High_Risk_Flag'].mean() * 100
    print(f"   -> Analyzed {len(model_df)} companies.")
    print(f"   -> Baseline: {baseline_risk:.1f}% of CPSEs are classified as High Risk.")

    print("🧠 4. Training the XGBoost Risk Classifier...")
    
    # Select our X (Features) and Y (Target)
    features = ['Is_Public', 'Debt to Equity', 'Profit Margin']
    X = model_df[features]
    y = model_df['High_Risk_Flag']
    
    # Split into Training (80%) and Testing (20%) data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    # Initialize and Train XGBoost
    # scale_pos_weight helps if the data is unbalanced
    clf = xgb.XGBClassifier(
        n_estimators=100, 
        learning_rate=0.1, 
        max_depth=4, 
        random_state=42,
        eval_metric='logloss'
    )
    
    clf.fit(X_train, y_train)
    
    # Make Predictions on the unseen Test Set
    y_pred = clf.predict(X_test)
    
    print("\n=======================================================")
    print("🎉 XGBOOST MODEL TRAINING COMPLETE")
    print("=======================================================")
    
    accuracy = accuracy_score(y_test, y_pred)
    print(f"\n🎯 MODEL ACCURACY: {accuracy * 100:.2f}%")
    if accuracy > 0.70:
         print("   ✅ Massive improvement! Classification is the correct approach for this data.")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk (0)', 'High Risk (1)']))
    
    print("\n⚖️ FEATURE IMPORTANCE (What drives the AI's decision?):")
    importances = clf.feature_importances_
    for feature, imp in zip(features, importances):
        print(f"   -> {feature}: {imp * 100:.1f}%")

if __name__ == "__main__":
    prepare_and_train_classifier()