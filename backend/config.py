import os
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ROOT_DIR = BASE_DIR.parent
DB_PATH = BASE_DIR / "firaza_orders.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"

# Muat environment variables dari root .env jika tersedia
try:
    from dotenv import load_dotenv

    env_file = ROOT_DIR / ".env"
    if env_file.exists():
        load_dotenv(env_file)
except ImportError:
    pass

# Hubungkan dengan modul Generative AI & System 1 di folder ai-engine
CAPSTONE_AI_DIR = ROOT_DIR / "ai-engine"
if CAPSTONE_AI_DIR.exists() and str(CAPSTONE_AI_DIR) not in sys.path:
    sys.path.insert(0, str(CAPSTONE_AI_DIR))

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")
LLM_MODEL = os.getenv("LLM_MODEL", "llama3.2:3b")
CHROMA_PERSIST_DIR = os.getenv(
    "CHROMA_PERSIST_DIR", str(CAPSTONE_AI_DIR / "models" / "chroma_db")
)

LANGFUSE_PUBLIC_KEY = os.getenv("LANGFUSE_PUBLIC_KEY", "")
LANGFUSE_SECRET_KEY = os.getenv("LANGFUSE_SECRET_KEY", "")
LANGFUSE_HOST = os.getenv("LANGFUSE_HOST", "https://cloud.langfuse.com")

VALID_STATUSES = ["New", "Design/Preparation", "Production", "Completed"]
VALID_CATEGORIES = ["Ready Stock", "Custom Sajadah", "Custom Handuk", "Hampers", "Other"]
