import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "firaza_orders.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"

# Hubungkan dengan modul Generative AI & Predictive AI di folder ai-engine (relatif terhadap repositori)
CAPSTONE_AI_DIR = BASE_DIR.parent / "ai-engine"
if CAPSTONE_AI_DIR.exists() and str(CAPSTONE_AI_DIR) not in sys.path:
    sys.path.insert(0, str(CAPSTONE_AI_DIR))

VALID_STATUSES = ["New", "Design/Preparation", "Production", "Completed"]
VALID_CATEGORIES = ["Ready Stock", "Custom Sajadah", "Custom Handuk", "Hampers", "Other"]

