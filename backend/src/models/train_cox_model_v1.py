import pandas as pd
import numpy as np
from lifelines import CoxPHFitter
from config.settings import RAW_DATA, PROCESSED_DATA

# Ensure you have lifelines installed: pip install lifelines

def prepare_and_train_model():
    print("🔄 1. Loading and Merging Datasets...")
    
    # 1. Load Data
    samadhaan_df = pd.read_csv(RAW_DATA / "raw_central_psu_cases.csv")
    yfinance_df = pd.read_csv(PROCESSED_DATA / "yfinance_signals.csv")
    
    # Clean Samadhaan columns based on the structure we saw earlier
    # Assuming Column 1 is Name, Column 3 is Disposed, Column 4 is Pending
    samadhaan_df = samadhaan_df.rename(columns={
        samadhaan_df.columns[1]: 'Company',
        samadhaan_df.columns[3]: 'Disposed_Cases',
        samadhaan_df.columns[4]: 'Pending_Cases'
    })
    
    # Drop rows without a company name or "Total" rows
    samadhaan_df = samadhaan_df.dropna(subset=['Company'])
    samadhaan_df = samadhaan_df[~samadhaan_df['Company'].str.contains("TOTAL", case=False)]

    # 2. Merge Data (Left join to keep all Samadhaan records)
    merged_df = pd.merge(samadhaan_df, yfinance_df, on="Company", how="left")
    
    print("🧹 2. Imputing Missing Financials for Unlisted PSUs...")
    
    # Create the Is_Public flag (1 if we found a Ticker, 0 if it's unlisted like BSNL)
    merged_df['Is_Public'] = merged_df['Ticker'].notna().astype(int)
    
    # Features we want to use in the model
    financial_features = ['Debt to Equity', 'Profit Margin', 'Current Ratio']
    
    # Smart Imputation: Fill missing values with the median of the listed companies
    for col in financial_features:
        if col in merged_df.columns:
            median_val = merged_df[col].median()
            merged_df[col] = merged_df[col].fillna(median_val)
        else:
            # If a column completely failed to pull, fill with 0 to prevent errors
            merged_df[col] = 0.0
            
    print("⚙️ 3. Expanding Aggregate Data into Invoice-Level Rows...")
    
    # Survival models need row-level data: Duration (T) and Event Observed (E)
    # Event = 1 (Paid/Disposed), Event = 0 (Pending/Censored)
    invoice_records = []
    
    for _, row in merged_df.iterrows():
        try:
            disposed = int(row['Disposed_Cases'])
            pending = int(row['Pending_Cases'])
        except ValueError:
            continue # Skip bad data
            
        # Extract features for this specific company
        company_features = {
            'Company': row['Company'],
            'Is_Public': row['Is_Public'],
            'Debt_to_Equity': row['Debt to Equity'],
            'Profit_Margin': row['Profit Margin']
        }
        
        # Simulate Disposed Invoices (E=1). Assume paid between 30 and 90 days.
        for _ in range(disposed):
            record = company_features.copy()
            record['Duration'] = np.random.uniform(30, 90)
            record['Event'] = 1 
            invoice_records.append(record)
            
        # Simulate Pending Invoices (E=0). Assume they have been waiting 90 to 365 days.
        for _ in range(pending):
            record = company_features.copy()
            record['Duration'] = np.random.uniform(90, 365)
            record['Event'] = 0 
            invoice_records.append(record)

    # Convert to DataFrame
    survival_df = pd.DataFrame(invoice_records)
    print(f"   -> Generated {len(survival_df)} synthetic invoice records for training.")
    
    print("🧠 4. Training Cox Proportional Hazards Model...")
    
    # Initialize the model
    cph = CoxPHFitter(penalizer=0.1) # Penalizer helps with collinearity
    
    # Fit the model
    # We drop 'Company' because CoxPH only takes numerical features
    train_df = survival_df.drop(columns=['Company'])
    
    try:
        cph.fit(train_df, duration_col='Duration', event_col='Event')
        
        print("\n=======================================================")
        print("🎉 MODEL TRAINING COMPLETE. SUMMARY STATISTICS:")
        print("=======================================================")
        cph.print_summary()
        
        # Save the model weights for our future UI Dashboard
        weights_df = cph.summary[['exp(coef)', 'p']]
        print("\nHazard Ratios (exp(coef)):")
        print("Note: < 1.0 means LOWER chance of getting paid (Higher Delay Risk)")
        print("Note: > 1.0 means HIGHER chance of getting paid (Faster Payments)")
        print(weights_df)
        
    except Exception as e:
        print(f"❌ Model training failed. Error: {e}")

if __name__ == "__main__":
    prepare_and_train_model()