import pandas as pd
import numpy as np
from lifelines import CoxPHFitter
from config.settings import RAW_DATA, PROCESSED_DATA
import warnings
warnings.filterwarnings("ignore") # Suppress pandas warnings for cleaner output

def prepare_and_train_model():
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
    
    print("🧹 2. Imputing Missing Financials for Unlisted PSUs...")
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    financial_features = ['Debt to Equity', 'Profit Margin', 'Current Ratio']
    
    for col in financial_features:
        if col in merged_df.columns:
            median_val = merged_df[col].median()
            merged_df[col] = merged_df[col].fillna(median_val)
        else:
            merged_df[col] = 0.0
            
    print("⚙️ 3. Applying 'Efficiency-Adjusted Backlog' Math...")
    
    invoice_records = []
    
    for _, row in merged_df.iterrows():
        try:
            disposed = float(row['Disposed_Cases'])
            pending = float(row['Pending_Cases'])
        except ValueError:
            continue
            
        total_cases = disposed + pending
        if total_cases == 0:
            continue # Skip companies with absolutely zero data
            
        # --- THE PROXY MATH ---
        # 1.0 means perfect clearance, 0.0 means terrible clearance
        efficiency_score = disposed / total_cases 
        
        # Highly efficient = 45 days. Inefficient = up to 120 days.
        paid_base_duration = 45 + ((1 - efficiency_score) * 75) 
        
        # Highly efficient pending = 90 days. Inefficient pending = up to 365 days.
        pending_base_duration = 90 + ((1 - efficiency_score) * 275) 

        company_features = {
            'Company': row['Company'],
            'Is_Public': row['Is_Public'],
            'Debt_to_Equity': row['Debt to Equity'],
            'Profit_Margin': row['Profit Margin']
        }
        
        # Unroll Disposed Cases (Event = 1)
        for _ in range(int(disposed)):
            record = company_features.copy()
            # Add a tiny bit of natural variance (+/- 10%) so the AI doesn't overfit
            record['Duration'] = paid_base_duration * np.random.uniform(0.9, 1.1) 
            record['Event'] = 1 
            invoice_records.append(record)
            
        # Unroll Pending Cases (Event = 0 / Censored)
        for _ in range(int(pending)):
            record = company_features.copy()
            record['Duration'] = pending_base_duration * np.random.uniform(0.9, 1.1)
            record['Event'] = 0 
            invoice_records.append(record)

    survival_df = pd.DataFrame(invoice_records)
    print(f"   -> Generated {len(survival_df)} efficiency-adjusted invoices.")
    
    print("🧠 4. Training Advanced Cox Proportional Hazards Model...")
    
    cph = CoxPHFitter(penalizer=0.01) # Lowered penalizer since data is less random now
    train_df = survival_df.drop(columns=['Company'])
    
    try:
        cph.fit(train_df, duration_col='Duration', event_col='Event')
        
        print("\n=======================================================")
        print("🎉 ADVANCED MODEL TRAINING COMPLETE")
        print("=======================================================")
        
        # Calculate Concordance natively
        concordance = cph.concordance_index_
        print(f"\n📈 MODEL CONCORDANCE INDEX (ACCURACY): {concordance:.4f}")
        if concordance > 0.70:
            print("   ✅ Outstanding! The proxy math successfully mapped financials to time.")
        
        print("\n⚖️ HAZARD RATIOS (Impact on Payment Speed):")
        weights_df = cph.summary[['exp(coef)', 'p', 'coef lower 95%', 'coef upper 95%']]
        print(weights_df)
        
    except Exception as e:
        print(f"❌ Model training failed. Error: {e}")

if __name__ == "__main__":
    prepare_and_train_model()