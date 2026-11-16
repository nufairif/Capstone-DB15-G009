import csv
import json
import subprocess
import urllib.request
from config import CAPSTONE_AI_DIR, LLM_API_KEY, LLM_BASE_URL

from src.llm_extractor import (
    LLMServiceUnavailableError,
    LocalLLMOrderExtractor,
    StructuredContractError,
)
from src.observability import is_langfuse_configured, telemetry_store
from src.rag_engine import LocalOpenSourceRAGEngine
from src.schemas import AnalyzeOrderRequest, AnalyzeOrderResponse, ClassificationResult
from src.system1_decision import (
    OrderAggregationService,
    System1DecisionModel,
    build_classification_result,
)

# Inisialisasi engine AI terbaru (tanpa model klasifikasi 5 kategori terpisah & tanpa 9router)
extractor = LocalLLMOrderExtractor()
rag_engine = LocalOpenSourceRAGEngine()
system1_model = System1DecisionModel()
aggregator = OrderAggregationService()


def query_rag_catalog(query: str, top_k: int = 4, category_filter: str | None = None):
    """Menjalankan query ke RAG katalog produk Toko Firaza (LlamaIndex + ChromaDB)."""
    if rag_engine.index is None:
        rag_engine.build_or_load_index()
    return rag_engine.generate_rag_answer(
        user_query=query,
        top_k=top_k,
        category_filter=category_filter,
    )


def check_llm_running() -> bool:
    """Mengecek apakah endpoint LLM (vLLM via Ngrok atau Ollama lokal) aktif."""
    models_url = f"{extractor.base_url.rstrip('/')}/models"
    try:
        req = urllib.request.Request(
            models_url,
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "ngrok-skip-browser-warning": "true",
            },
        )
        with urllib.request.urlopen(req, timeout=2.0) as resp:
            return resp.status == 200
    except Exception:
        return False


def check_ollama_running() -> bool:
    """Alias kompatibilitas untuk pengecekan server LLM lokal Ollama."""
    try:
        with urllib.request.urlopen("http://localhost:11434/api/tags", timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_ollama_running():
    """Menyalakan 'ollama serve' lokal hanya jika LLM_BASE_URL mengarah ke localhost:11434."""
    if "localhost:11434" not in LLM_BASE_URL and "127.0.0.1:11434" not in LLM_BASE_URL:
        return
    if check_ollama_running():
        return
    try:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception:
        pass


def init_ai_models():
    """Memuat indeks vektor ChromaDB (LlamaIndex) dan mengecek kesiapan endpoint LLM."""
    ensure_ollama_running()
    rag_engine.build_or_load_index()


def get_dataset_overview(sample_limit: int = 15):
    """
    Menampilkan ringkasan dataset (3.675 baris/dokumen), hasil agregasi Scikit-Learn
    (`OrderAggregationService`), dan telemetri observabilitas (Langfuse / Cost Metric).
    """
    data_dir = CAPSTONE_AI_DIR / "data"
    models_dir = CAPSTONE_AI_DIR / "models"

    train_csv = data_dir / "train_classification.csv"
    test_csv = data_dir / "test_classification.csv"
    ext_train_json = data_dir / "extraction_dataset.json"
    ext_test_json = data_dir / "extraction_test_set.json"
    kb_json = data_dir / "firaza_knowledge_base.json"
    metrics_json = models_dir / "evaluation_metrics.json"

    train_samples = []
    train_count = 0
    if train_csv.exists():
        with open(train_csv, "r", encoding="utf-8") as f:
            reader = list(csv.DictReader(f))
            train_count = len(reader)
            train_samples = reader[:sample_limit]

    test_count = 0
    if test_csv.exists():
        with open(test_csv, "r", encoding="utf-8") as f:
            test_count = sum(1 for _ in csv.DictReader(f))

    ext_train_count = 0
    ext_samples = []
    if ext_train_json.exists():
        with open(ext_train_json, "r", encoding="utf-8") as f:
            ext_data = json.load(f)
            ext_train_count = len(ext_data)
            ext_samples = ext_data[:5]

    ext_test_count = 0
    if ext_test_json.exists():
        with open(ext_test_json, "r", encoding="utf-8") as f:
            ext_test_count = len(json.load(f))

    kb_count = 0
    kb_samples = []
    kb_data = []
    if kb_json.exists():
        with open(kb_json, "r", encoding="utf-8") as f:
            kb_data = json.load(f)
            kb_count = len(kb_data)
            kb_samples = kb_data[:10]

    metrics = {}
    if metrics_json.exists():
        with open(metrics_json, "r", encoding="utf-8") as f:
            metrics = json.load(f)

    # Fungsi agregasi Scikit-Learn pada sampel dataset & knowledge base
    aggregation_summary = aggregator.aggregate_records(
        [{"text": r.get("text", ""), "category": r.get("category", "Other")} for r in train_samples]
        + [{"text": d.get("content", ""), "category": d.get("category", "Other")} for d in kb_data]
    )

    return {
        "counts": {
            "train_classification_csv": train_count,
            "test_classification_csv": test_count,
            "extraction_dataset_json": ext_train_count,
            "extraction_test_set_json": ext_test_count,
            "rag_knowledge_base_json": kb_count,
            "grand_total_records": train_count + test_count + ext_train_count + ext_test_count + kb_count,
        },
        "sklearn_aggregation": aggregation_summary,
        "telemetry": telemetry_store.summary(),
        "architecture_info": {
            "structured_output": "Instructor + Pydantic v2",
            "rag_framework": "LlamaIndex + ChromaDB",
            "observability": "Langfuse" if is_langfuse_configured() else "Local Telemetry (Langfuse ready)",
            "decision_routing": "System 1 Decision Model + GenAI System 2",
            "separate_5class_classifier": False,
            "llm_endpoint": extractor.base_url,
            "llm_model": extractor.model_name,
        },
        "evaluation_metrics": metrics,
        "samples": {
            "classification": train_samples,
            "extraction": ext_samples,
            "knowledge_base": kb_samples,
        },
    }
