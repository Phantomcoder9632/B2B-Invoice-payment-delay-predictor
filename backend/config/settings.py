import os
from pathlib import Path
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Path Logic
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

# Subfolders
RAW_DATA = DATA_DIR / "raw"
INTERIM_DATA = DATA_DIR / "interim"
EXTERNAL_DATA = DATA_DIR / "external"
PROCESSED_DATA = DATA_DIR / "processed"

# API Keys (For your brother's Tofler/RBI integration)
TOFLER_API_KEY = os.getenv("TOFLER_API_KEY")

# Create directories if they don't exist
for path in [RAW_DATA, INTERIM_DATA, EXTERNAL_DATA, PROCESSED_DATA]:
    path.mkdir(parents=True, exist_ok=True)