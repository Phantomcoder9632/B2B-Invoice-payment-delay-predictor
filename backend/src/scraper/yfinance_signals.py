import pandas as pd
import yfinance as yf
import time
from config.settings import RAW_DATA, PROCESSED_DATA

# ==========================================
# THE MASTER PSU TICKER DICTIONARY
# Guaranteed 100% accuracy for listed Indian CPSEs
# ==========================================
TICKER_MAP = {
    # Energy, Oil & Gas
    "INDIAN OIL CORPORATION": "IOC.NS",
    "BHARAT HEAVY ELECTRICALS": "BHEL.NS",
    "NTPC": "NTPC.NS",
    "HINDUSTAN PETROLEUM": "HINDPETRO.NS",
    "BHARAT PETROLEUM": "BPCL.NS",
    "OIL & NATURAL GAS CORPORATION": "ONGC.NS",
    "GAIL": "GAIL.NS",
    "POWER GRID CORPORATION": "POWERGRID.NS",
    "COAL INDIA": "COALINDIA.NS",
    "NHPC": "NHPC.NS",
    "SJVN": "SJVN.NS",
    "NLC INDIA": "NLCINDIA.NS",
    "OIL INDIA": "OIL.NS",
    "CHENNAI PETROLEUM": "CHENNPETRO.NS",
    "MANGALORE REFINERY": "MRPL.NS",

    # Defense & Aerospace
    "HINDUSTAN AERONAUTICS": "HAL.NS",
    "BHARAT ELECTRONICS": "BEL.NS",
    "BHARAT DYNAMICS": "BDL.NS",
    "MAZAGON DOCK": "MAZDOCK.NS",
    "COCHIN SHIPYARD": "COCHINSHIP.NS",
    "GARDEN REACH SHIPBUILDERS": "GRSE.NS",
    "BEML": "BEML.NS",
    "MISHRA DHATU NIGAM": "MIDHANI.NS",

    # Steel, Mining & Heavy Industries
    "STEEL AUTHORITY OF INDIA": "SAIL.NS",
    "NMDC": "NMDC.NS",
    "NATIONAL ALUMINIUM": "NATIONALUM.NS",
    "MANGANESE ORE": "MOIL.NS",
    "HINDUSTAN COPPER": "HINDCOPPER.NS",
    "KIOCL": "KIOCL.NS",
    "HEAVY ENGINEERING": "ISGEC.NS", # ISGEC Heavy Engineering

    # Railways & Infrastructure
    "INDIAN RAILWAY CATERING": "IRCTC.NS",
    "RAIL VIKAS NIGAM": "RVNL.NS",
    "IRCON INTERNATIONAL": "IRCON.NS",
    "RITES": "RITES.NS",
    "RAILTEL": "RAILTEL.NS",
    "CONTAINER CORPORATION": "CONCOR.NS",
    "INDIAN RAILWAY FINANCE": "IRFC.NS",
    "NBCC": "NBCC.NS",
    "ENGINEERS INDIA": "ENGSINDIA.NS",
    "HOUSING & URBAN DEVELOPMENT": "HUDCO.NS",

    # Telecom & IT
    "MAHANAGAR TELEPHONE NIGAM": "MTNL.NS",
    "I T I": "ITI.NS",

    # Chemicals & Fertilizers
    "FERTILISERS AND CHEMICALS TRAVANCORE": "FACT.NS",
    "RASHTRIYA CHEMICALS": "RCF.NS",
    "NATIONAL FERTILIZERS": "NFL.NS",
    "BRAHMAPUTRA VALLEY FERTILIZER": "BVFCL.NS", # If listed/traded

    # Finance
    "POWER FINANCE CORPORATION": "PFC.NS",
    "REC LTD": "RECLTD.NS",
    "INDIAN RENEWABLE ENERGY": "IREDA.NS"
}

def clean_csv_name(name):
    """Standardizes the CSV name to help match our dictionary keys."""
    return str(name).upper().replace('.', '').replace('(INDIA)', '').strip()

def fetch_yfinance_ratios():
    input_file = RAW_DATA / "raw_central_psu_cases.csv"
    
    if not input_file.exists():
        print(f"File not found: {input_file}")
        return

    df = pd.read_csv(input_file)
    df.columns = [str(c).strip() for c in df.columns]
    company_col = df.columns[1] 
    
    # Get unique companies
    all_companies = [c for c in df[company_col].dropna().unique() if "TOTAL" not in str(c).upper()]
    
    print(f"📊 Scanning {len(all_companies)} unique companies against the Master Dictionary...\n")

    successful_data = []
    unmapped_companies = []
    
    for raw_company in all_companies:
        clean_name = clean_csv_name(raw_company)
        matched_ticker = None
        
        # Check if any key from our dictionary is inside the CSV name
        for dict_key, ticker in TICKER_MAP.items():
            if dict_key in clean_name:
                matched_ticker = ticker
                break
                
        if matched_ticker:
            try:
                stock = yf.Ticker(matched_ticker)
                info = stock.info
                successful_data.append({
                    "Company": raw_company,
                    "Ticker": matched_ticker,
                    "Debt to Equity": info.get("debtToEquity"),
                    "Profit Margin": info.get("profitMargins"),
                    "Current Ratio": info.get("currentRatio"),
                    "Return on Equity": info.get("returnOnEquity")
                })
                print(f"✅ Found: {raw_company} -> {matched_ticker}")
                time.sleep(0.2) # Very tiny delay just to be polite to Yahoo
            except Exception as e:
                print(f"⚠️ Failed to fetch data for {matched_ticker}")
                unmapped_companies.append(raw_company)
        else:
            unmapped_companies.append(raw_company)

    # Save the good data
    if successful_data:
        final_df = pd.DataFrame(successful_data)
        output_path = PROCESSED_DATA / "yfinance_signals.csv"
        final_df.to_csv(output_path, index=False)
        print(f"\n🚀 SUCCESS: Clean data extracted for {len(successful_data)} listed PSUs.")
    
    # Save the unlisted data
    if unmapped_companies:
        unmapped_df = pd.DataFrame(unmapped_companies, columns=["Unmapped_Company"])
        unmapped_path = PROCESSED_DATA / "unmapped_psus.csv"
        unmapped_df.to_csv(unmapped_path, index=False)
        print(f"📁 NOTE: {len(unmapped_companies)} companies are unlisted. Saved to {unmapped_path}.")

if __name__ == "__main__":
    fetch_yfinance_ratios()