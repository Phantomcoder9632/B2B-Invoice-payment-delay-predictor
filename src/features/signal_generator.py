import pandas as pd
from datetime import datetime
from config.settings import RAW_DATA, PROCESSED_DATA

def generate_survival_features(input_file):
    # Read the raw scraper output
    df = pd.read_csv(RAW_DATA / input_file)
    
    # Rename columns for clarity based on your 0-8 index snippet
    df.columns = ['s_no', 'company_name', 'total_apps', 'rejected', 'disposed', 'pending', 'amount', 'last_updated', 'extra']
    
    # 1. Calculate the 'Event' (1 = Disposed/Paid, 0 = Pending)
    # If disposed cases exist for this company, it's a 'Success' event in survival terms
    df['event'] = df['disposed'].apply(lambda x: 1 if x > 0 else 0)
    
    # 2. Mocking 'Days Elapsed' until we scrape the specific filing dates
    # For now, we use a random distribution or a constant to build the logic
    import numpy as np
    df['days_elapsed'] = np.random.randint(30, 450, size=len(df))
    
    # 3. Sector Risk Score (From your Report.xls analysis)
    # Central PSUs have a ~19.2% recovery rate
    df['sector_baseline_recovery'] = 0.192 
    
    # Save as interim features
    output_path = PROCESSED_DATA / "survival_baseline_features.csv"
    df.to_csv(output_path, index=False)
    print(f"Features generated for {len(df)} companies in {output_path}")

if __name__ == "__main__":
    generate_survival_features("raw_central_psu_cases.csv")