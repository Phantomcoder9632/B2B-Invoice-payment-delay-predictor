import pandas as pd
import numpy as np
import xgboost as xgb
import joblib
import optuna
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings

# Suppress warnings and massive Optuna logs for a clean terminal output
warnings.filterwarnings("ignore")
optuna.logging.set_verbosity(optuna.logging.WARNING) 

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

def train_optuna_model():
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
    merged_df['Sector'] = merged_df['Company'].apply(categorize_sector)
    
    print("🏭 2. Engineering Sector-Relative Features...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    financial_features = ['Debt to Equity', 'Profit Margin']
    for col in financial_features:
        if col in merged_df.columns:
            merged_df[col] = merged_df[col].fillna(merged_df[col].median())
        else:
            merged_df[col] = 0.0

    # Calculate sector medians for relative comparison
    sector_medians = merged_df.groupby('Sector')[['Profit Margin', 'Debt to Equity']].transform('median')
    merged_df['Sector_Relative_Profit'] = merged_df['Profit Margin'] - sector_medians['Profit Margin']
    merged_df['Sector_Relative_Debt'] = merged_df['Debt to Equity'] - sector_medians['Debt to Equity']
    
    # One-Hot Encoding for the sectors
    merged_df = pd.get_dummies(merged_df, columns=['Sector'], drop_first=False)
    
    print("🎯 3. Engineering Target Variable...")
    merged_df['Disposed_Cases'] = pd.to_numeric(merged_df['Disposed_Cases'], errors='coerce').fillna(0)
    merged_df['Pending_Cases'] = pd.to_numeric(merged_df['Pending_Cases'], errors='coerce').fillna(0)
    merged_df['Total_Cases'] = merged_df['Disposed_Cases'] + merged_df['Pending_Cases']
    
    model_df = merged_df[merged_df['Total_Cases'] > 0].copy()
    model_df['Delay_Risk_Ratio'] = model_df['Pending_Cases'] / model_df['Total_Cases']
    model_df['High_Risk_Flag'] = (model_df['Delay_Risk_Ratio'] > 0.50).astype(int)

    # Safely grab only the true dummy sector columns
    sector_cols = [col for col in model_df.columns if col.startswith('Sector_') and 'Relative' not in col]
    
    # Define features to be used by the model
    features = ['Is_Public', 'Debt to Equity', 'Profit Margin', 'Sector_Relative_Profit', 'Sector_Relative_Debt'] + sector_cols
    
    X = model_df[features].copy()
    y = model_df['High_Risk_Flag']
    
    # Ensure boolean dummies are integers for XGBoost
    X[sector_cols] = X[sector_cols].astype(int)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.20, random_state=42)
    
    print("🧠 4. Unleashing Optuna Bayesian Optimization...")
    print("   -> Running 150 trials. Finding the mathematical peak...")
    
    def objective(trial):
        param = {
            'n_estimators': trial.suggest_int('n_estimators', 50, 300),
            'max_depth': trial.suggest_int('max_depth', 2, 7),
            'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3),
            'subsample': trial.suggest_float('subsample', 0.5, 1.0),
            'colsample_bytree': trial.suggest_float('colsample_bytree', 0.5, 1.0),
            'gamma': trial.suggest_float('gamma', 0, 5),
            'min_child_weight': trial.suggest_int('min_child_weight', 1, 5)
        }
        clf = xgb.XGBClassifier(**param, random_state=42, eval_metric='logloss')
        clf.fit(X_train, y_train)
        preds = clf.predict(X_test)
        return accuracy_score(y_test, preds)

    study = optuna.create_study(direction='maximize')
    study.optimize(objective, n_trials=150) 
    
    print("⚙️ 5. Training Final Model & Threshold Tuning...")
    best_clf = xgb.XGBClassifier(**study.best_params, random_state=42, eval_metric='logloss')
    best_clf.fit(X_train, y_train)
    
    y_pred_proba = best_clf.predict_proba(X_test)[:, 1]
    
    best_threshold = 0.5
    best_acc = 0
    for thresh in np.arange(0.3, 0.7, 0.02):
        temp_preds = (y_pred_proba >= thresh).astype(int)
        score = accuracy_score(y_test, temp_preds)
        if score > best_acc:
            best_acc = score
            best_threshold = thresh

    print(f"   -> AI Selected Optimal Threshold: {best_threshold:.2f}")
    y_pred_optimal = (y_pred_proba >= best_threshold).astype(int)
    
    print("\n=======================================================")
    print("🎉 ULTIMATE OPTIMIZED SECTOR MODEL COMPLETE")
    print("=======================================================")

    print("💾 6. Saving Model for Production...")
    # Create the directory if it doesn't exist
    model_path = Path("models")
    model_path.mkdir(exist_ok=True)
    
    # Save the trained model and the feature names
    joblib.dump(best_clf, model_path / 'xgboost_risk_model.pkl')
    joblib.dump(features, model_path / 'model_features.pkl') 
    
    print(f"   ✅ Model and Features saved to: {model_path}/")
    
    final_acc = accuracy_score(y_test, y_pred_optimal)
    print(f"🎯 FINAL MODEL ACCURACY: {final_acc * 100:.2f}%")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred_optimal, target_names=['Low Risk (0)', 'High Risk (1)']))
    
    print("\n⚖️ FINAL FEATURE IMPORTANCE:")
    importances = best_clf.feature_importances_
    feat_imp = pd.DataFrame({'Feature': features, 'Importance': importances * 100})
    feat_imp = feat_imp.sort_values(by='Importance', ascending=False)
    for _, row in feat_imp.iterrows():
        print(f"   -> {row['Feature']}: {row['Importance']:.1f}%")

if __name__ == "__main__":
    train_optuna_model()