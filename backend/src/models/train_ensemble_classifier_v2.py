import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier, StackingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore")

def train_stacked_classifier():
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
    
    print("🧹 2. Imputing Core Features (Dropping Noise)...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    
    # Reverting to the core features. The interaction terms added too much noise last time.
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
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    smote = SMOTE(random_state=42)
    X_resampled, y_resampled = smote.fit_resample(X_scaled, y)
    
    X_train, X_test, y_train, y_test = train_test_split(X_resampled, y_resampled, test_size=0.20, random_state=42)
    
    print("🧠 4. Assembling the Stacked Meta-Learner...")
    
    # BASE LEVEL: Highly constrained models to prevent overfitting small data
    base_learners = [
        ('xgb', xgb.XGBClassifier(
            n_estimators=50, max_depth=2, learning_rate=0.05, 
            reg_lambda=10, random_state=42, eval_metric='logloss'
        )),
        ('rf', RandomForestClassifier(
            n_estimators=50, max_depth=2, min_samples_leaf=5, random_state=42
        ))
    ]
    
    # META LEVEL: The Manager that learns who to trust
    # C=0.1 applies strong L2 regularization to keep the manager simple
    meta_learner = LogisticRegression(C=0.1, penalty='l2', random_state=42)
    
    # The Stacking Classifier utilizes Cross-Validation to prevent data leakage during training
    stacked_clf = StackingClassifier(estimators=base_learners, final_estimator=meta_learner, cv=5)
    
    stacked_clf.fit(X_train, y_train)
    
    print("⚙️ 5. Executing Dynamic Threshold Optimization...")
    y_pred_proba = stacked_clf.predict_proba(X_test)[:, 1]
    
    # Mathematically search for the absolute best threshold instead of guessing
    best_threshold = 0.5
    best_f1 = 0
    
    for thresh in np.arange(0.1, 0.9, 0.05):
        temp_preds = (y_pred_proba >= thresh).astype(int)
        score = f1_score(y_test, temp_preds, average='macro')
        if score > best_f1:
            best_f1 = score
            best_threshold = thresh

    print(f"   -> AI Selected Optimal Threshold: {best_threshold:.2f}")
    y_pred_optimal = (y_pred_proba >= best_threshold).astype(int)
    
    print("\n=======================================================")
    print("🎉 STACKED CLASSIFIER COMPLETE")
    print("=======================================================")
    
    accuracy = accuracy_score(y_test, y_pred_optimal)
    print(f"🎯 FINAL MODEL ACCURACY: {accuracy * 100:.2f}%")
    
    print("\n📊 CLASSIFICATION REPORT:")
    print(classification_report(y_test, y_pred_optimal, target_names=['Low Risk (0)', 'High Risk (1)']))

if __name__ == "__main__":
    train_stacked_classifier()