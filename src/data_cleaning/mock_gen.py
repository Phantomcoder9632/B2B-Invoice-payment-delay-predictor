import pandas as pd
import numpy as np
from config.settings import INTERIM_DATA, EXTERNAL_DATA

def generate_mock_tofler_data():
    # Load the unique names produced by your normalizer
    try:
        companies = pd.read_csv(INTERIM_DATA / "unique_companies_to_lookup.csv")
    except FileNotFoundError:
        print("Run name_normalizer.py first!")
        return

    # Generate random but realistic financial metrics
    mock_data = {
        "normalized_name": companies["normalized_name"],
        "revenue_cr": np.random.uniform(10, 5000, size=len(companies)),
        "debt_equity_ratio": np.random.uniform(0.1, 5.0, size=len(companies)),
        "net_profit_margin": np.random.uniform(-5, 20, size=len(companies)),
        "credit_rating_score": np.random.randint(300, 900, size=len(companies))
    }

    df_mock = pd.DataFrame(mock_data)
    df_mock.to_csv(EXTERNAL_DATA / "tofler_financials_MOCK.csv", index=False)
    print("MOCK Tofler data generated. Use this to build the model logic.")

if __name__ == "__main__":
    generate_mock_tofler_data()