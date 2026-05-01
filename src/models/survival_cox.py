import pandas as pd
from lifelines import CoxPHFitter
import matplotlib.pyplot as plt
from config.settings import PROCESSED_DATA

def train_survival_engine():
    df = pd.read_csv(PROCESSED_DATA / "survival_baseline_features.csv")
    
    # 1. Select features that actually vary
    # We drop 'sector_baseline_recovery' because it's constant for now
    model_cols = ['days_elapsed', 'event', 'amount']
    df_model = df[model_cols].copy()
    
    # 2. Add a tiny bit of random noise to 'amount' if needed 
    # (Sometimes government data has duplicate amounts that cause ties)
    df_model['amount'] = df_model['amount'] + (df_model['amount'] * 0.0001)

    # 3. Initialize and fit
    cph = CoxPHFitter(penalizer=0.1) # Penalizer adds stability
    
    print("Training Cox Proportional Hazards model (Baseline)...")
    try:
        cph.fit(df_model, duration_col='days_elapsed', event_col='event')
        cph.print_summary()
        
        # 4. Save the impact chart
        plt.figure(figsize=(10, 6))
        cph.plot()
        plt.title("Impact of Invoice Amount on Payment Hazard")
        plt.tight_layout()
        plt.savefig("data/processed/hazard_ratios.png")
        print("\nModel trained successfully. Plot saved to data/processed/hazard_ratios.png")
        
    except Exception as e:
        print(f"Model still failing: {e}")
        print("Tip: Check if 'event' column has both 0s and 1s.")

    return cph

if __name__ == "__main__":
    train_survival_engine()