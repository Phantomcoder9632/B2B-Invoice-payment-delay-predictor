import pandas as pd
import re
from config.settings import RAW_DATA, INTERIM_DATA

def clean_name(name):
    if not isinstance(name, str): 
        return ""
    
    name = name.upper()
    # 1. Remove specific unit details
    name = re.sub(r"[-–,].*", "", name)
    # 2. Standardize legal suffixes
    name = re.sub(r"\b(PVT LTD|PRIVATE LIMITED|LTD|LIMITED|LLP|CORP)\b", "", name)
    # 3. Remove special characters
    name = re.sub(r"[^\w\s]", "", name)
    return name.strip()

def generate_tofler_list(input_filename):
    # Read the CSV
    df = pd.read_csv(RAW_DATA / input_filename)
    
    # BASED ON YOUR SNIPPET: The names are in the SECOND column (Index 1)
    # The column name in your file is literally the string '1'
    target_col = df.columns[1] 
    
    print(f"Normalizing column: {target_col} (Respondent Names)")
    
    # Apply cleaning
    df['normalized_name'] = df[target_col].apply(clean_name)
    
    # Filter: Keep only rows that actually contain text
    unique_companies = df[df['normalized_name'].str.len() > 2]
    unique_companies = unique_companies[['normalized_name']].drop_duplicates()
    
    output_file = INTERIM_DATA / "tofler_lookup_list.csv"
    unique_companies.to_csv(output_file, index=False)
    
    print(f"Success! Generated {len(unique_companies)} unique names for Tofler.")
    print("Preview of cleaned names:")
    print(unique_companies.head())

if __name__ == "__main__":
    generate_tofler_list("raw_central_psu_cases.csv")