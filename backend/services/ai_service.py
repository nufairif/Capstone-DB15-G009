import csv
import json
import subprocess
import urllib.request
from config import CAPSTONE_AI_DIR

from src.llm_extractor import LocalLLMOrderExtractor
from src.rag_engine import LocalOpenSourceRAGEngine
from src.schemas import AnalyzeOrderRequest, AnalyzeOrderResponse, ClassificationResult
from src.train_classifier import OrderClassifier

# Inisialisasi engine AI dari proyek Gen AI lokal
classifier = OrderClassifier()
extractor = LocalLLMOrderExtractor()
rag_engine = LocalOpenSourceRAGEngine()


def query_rag_catalog(query: str, top_k: int = 4):
    """Menjalankan query ke RAG katalog produk Toko Firaza."""
    fresh_rag = LocalOpenSourceRAGEngine().build_or_load_index()
    return fresh_rag.generate_rag_answer(user_query=query, top_k=top_k)


def check_ollama_running() -> bool:
    """Mengecek apakah service Ollama lokal aktif."""
    try:
        with urllib.request.urlopen(f"{extractor.ollama_url}/api/tags", timeout=1.5) as resp:
            return resp.status == 200
    except Exception:
        return False


def ensure_ollama_running():
    """Menyalakan server 'ollama serve' secara otomatis di background jika belum aktif."""
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
    """Memuat pipeline model klasifikasi, indeks vektor RAG, dan menyalakan Ollama saat server startup."""
    ensure_ollama_running()
    classifier.load()
    rag_engine.build_or_load_index()


def get_dataset_overview(sample_limit: int = 15):
    """
    Menampilkan bukti nyata penggunaan seluruh dataset (3.675 baris/dokumen)
    beserta metrik evaluasi model (Precision, Recall, F1-Score, Confusion Matrix)
    dan sampel langsung dari file dataset di folder capstone/data.
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
    if kb_json.exists():
        with open(kb_json, "r", encoding="utf-8") as f:
            kb_data = json.load(f)
            kb_count = len(kb_data)
            kb_samples = kb_data[:10]

    metrics = {}
    if metrics_json.exists():
        with open(metrics_json, "r", encoding="utf-8") as f:
            metrics = json.load(f)

    # Informasi jumlah fitur kosakata TF-IDF yang dipelajari dari 2.400 data latih
    vocab_info = {}
    if classifier.pipeline is not None:
        try:
            fu = classifier.pipeline.named_steps["features"]
            word_vec = dict(fu.transformer_list)["word_tfidf"]
            char_vec = dict(fu.transformer_list)["char_tfidf"]
            vocab_info = {
                "word_ngrams_learned": len(word_vec.vocabulary_),
                "char_ngrams_learned": len(char_vec.vocabulary_),
                "total_features_in_svm": len(word_vec.vocabulary_) + len(char_vec.vocabulary_),
            }
        except Exception:
            pass

    return {
        "counts": {
            "train_classification_csv": train_count,
            "test_classification_csv": test_count,
            "extraction_dataset_json": ext_train_count,
            "extraction_test_set_json": ext_test_count,
            "rag_knowledge_base_json": kb_count,
            "grand_total_records": train_count + test_count + ext_train_count + ext_test_count + kb_count,
        },
        "model_vocabulary_proof": vocab_info,
        "evaluation_metrics": metrics,
        "samples": {
            "classification": train_samples,
            "extraction": ext_samples,
            "knowledge_base": kb_samples,
        },
    }

