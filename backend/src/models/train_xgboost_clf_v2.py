import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, classification_report
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def train_optimized_classifier():
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
    
    print("🧹 2. Imputing EXPANDED Financial Features...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    
    # WE ADDED CURRENT RATIO AND RETURN ON EQUITY HERE
    financial_features = ['Debt to Equity', 'Profit Margin', 'Current Ratio', 'Return on Equity']
    
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

    print("🧠 4. Setting up Grid Search Optimization...")
    # Now using 5 features instead of 3
    features = ['Is_Public', 'Debt to Equity', 'Profit Margin', 'Current Ratio', 'Return on Equity']
    
    # Ensure columns exist before selecting
    valid_features = [f for f in features if f in model_df.columns]
    X = model_df[valid_features]
    y = model_df['High_Risk_Flag']
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    # ---------------------------------------------------------
    # THE OPTIMIZER (GridSearchCV)
    # This will test 108 different versions of XGBoost to find the best one
    # ---------------------------------------------------------
    param_grid = {
        'max_depth': [3, 4, 5],
        'learning_rate': [0.01, 0.05, 0.1],
        'n_estimators': [50, 100, 200],
        'subsample': [0.8, 1.0],
        'colsample_bytree': [0.8, 1.0]
    }
    
    xgb_base = xgb.XGBClassifier(random_state=42, eval_metric='logloss')
    
    print("   -> Running 108 background simulations. This might take 10-20 seconds...")
    grid_search = GridSearchCV(estimator=xgb_base, param_grid=param_grid, cv=5, scoring='accuracy', n_jobs=-1)
    grid_search.fit(X_train, y_train)
    
    best_model = grid_search.best_estimator_
    print(f"\n⚙️ BEST PARAMETERS FOUND:\n   {grid_search.best_params_}")
    
    # Evaluate the optimized model
    y_pred = best_model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print("\n=======================================================")
    print("🎉 OPTIMIZED XGBOOST MODEL COMPLETE")
    print("=======================================================")
    print(f"🎯 NEW MODEL ACCURACY: {accuracy * 100:.2f}%")
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk (0)', 'High Risk (1)']))
    
    print("\n⚖️ FEATURE IMPORTANCE:")
    importances = best_model.feature_importances_
    for feature, imp in zip(valid_features, importances):
        print(f"   -> {feature}: {imp * 100:.1f}%")

if __name__ == "__main__":
    train_optimized_classifier()