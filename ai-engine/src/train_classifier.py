import csv
import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, cast

import joblib
from sklearn.calibration import CalibratedClassifierCV
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.pipeline import FeatureUnion, Pipeline
from sklearn.svm import LinearSVC

from src.schemas import ClassificationResult, OrderCategory

# Kamus normalisasi singkatan belanja online Indonesia
SLANG_MAP = {
    "wrn": "warna",
    "wrna": "warna",
    "uk": "ukuran",
    "ukrn": "ukuran",
    "bdr": "bordir",
    "bordr": "bordir",
    "sjdh": "sajadah",
    "sajdah": "sajadah",
    "sejadah": "sajadah",
    "hndk": "handuk",
    "handk": "handuk",
    "anduk": "handuk",
    "hmpers": "hampers",
    "hamper": "hampers",
    "rdy": "ready",
    "brp": "berapa",
    "brpa": "berapa",
    "utk": "untuk",
    "bt": "buat",
    "dgn": "dengan",
    "psnan": "pesanan",
    "krtu": "kartu",
    "ucpan": "ucapan",
}


def preprocess_text(text: str) -> str:
    """Membersihkan teks dan menormalisasi singkatan umum pelanggan."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    normalized = [SLANG_MAP.get(tok, tok) for tok in tokens]
    return " ".join(normalized)


def load_csv_dataset(csv_path: Path) -> Tuple[List[str], List[str]]:
    texts, labels = [], []
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            texts.append(preprocess_text(row["text"]))
            labels.append(row["category"])
    return texts, labels


def build_classifier_pipeline() -> Pipeline:
    """
    Membangun pipeline NLP ringan & akurat:
    - Word TF-IDF (1-2 ngram) untuk konteks kata
    - Char_wb TF-IDF (3-5 ngram) untuk ketahanan terhadap typo
    - Calibrated LinearSVC untuk prediksi cepat + skor probabilitas (confidence)
    """
    transformer_list: Any = [
        (
            "word_tfidf",
            TfidfVectorizer(
                ngram_range=(1, 2),
                max_features=8000,
                sublinear_tf=True,
            ),
        ),
        (
            "char_tfidf",
            TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(3, 5),
                max_features=8000,
                sublinear_tf=True,
            ),
        ),
    ]
    features = FeatureUnion(transformer_list)

    base_svm = LinearSVC(C=1.0, random_state=42)
    calibrated_clf = CalibratedClassifierCV(estimator=base_svm, cv=5)

    return Pipeline([
        ("features", features),
        ("clf", calibrated_clf),
    ])


class OrderClassifier:
    """Wrapper inferensi Predictive AI untuk digunakan oleh Backend / FastAPI."""

    def __init__(self, model_path: Optional[Path] = None):
        base_dir = Path(__file__).resolve().parent.parent
        self.model_path = model_path or (base_dir / "models" / "order_classifier.joblib")
        self.pipeline = None

    def load(self):
        if not self.model_path.exists():
            raise FileNotFoundError(
                f"Model belum ditemukan di {self.model_path}. Jalankan `python -m src.train_classifier` terlebih dahulu."
            )
        self.pipeline = joblib.load(self.model_path)
        return self

    def predict(self, raw_message: str) -> ClassificationResult:
        if self.pipeline is None:
            self.load()
        if self.pipeline is None:
            raise RuntimeError("Model pipeline belum dimuat.")

        cleaned = preprocess_text(raw_message)
        probs = self.pipeline.predict_proba([cleaned])[0]
        classes = self.pipeline.classes_

        prob_dict: Dict[str, float] = {
            str(cls): round(float(prob), 4) for cls, prob in zip(classes, probs)
        }
        best_idx = int(probs.argmax())
        best_category = str(classes[best_idx])
        best_confidence = round(float(probs[best_idx]), 4)

        return ClassificationResult(
            category=cast(OrderCategory, best_category),
            confidence=best_confidence,
            all_probabilities=prob_dict,
        )


def train_and_evaluate():
    base_dir = Path(__file__).resolve().parent.parent
    data_dir = base_dir / "data"
    models_dir = base_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)

    train_path = data_dir / "train_classification.csv"
    test_path = data_dir / "test_classification.csv"

    if not train_path.exists() or not test_path.exists():
        print("[INFO] Dataset belum ada, menjalankan generator dataset otomatis...")
        from src.generate_dataset import main as generate_main
        generate_main()

    X_train, y_train = load_csv_dataset(train_path)
    X_test, y_test = load_csv_dataset(test_path)

    print(f"[INFO] Melatih model Predictive AI pada {len(X_train)} data latih...")
    pipeline = build_classifier_pipeline()
    pipeline.fit(X_train, y_train)

    y_pred = pipeline.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    report_str = classification_report(y_test, y_pred, digits=4)
    report_dict = classification_report(y_test, y_pred, output_dict=True)
    labels = sorted(list(set(y_test)))
    cm = confusion_matrix(y_test, y_pred, labels=labels).tolist()

    model_file = models_dir / "order_classifier.joblib"
    metrics_file = models_dir / "evaluation_metrics.json"

    joblib.dump(pipeline, model_file)

    metrics_payload = {
        "model_name": "tfidf-svm-calibrated-v1",
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "accuracy": round(float(acc), 4),
        "labels": labels,
        "confusion_matrix": cm,
        "classification_report": report_dict,
    }
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2, ensure_ascii=False)

    print("\n=== HASIL EVALUASI PREDICTIVE AI (TEST SET) ===")
    print(f"Accuracy: {acc * 100:.2f}%\n")
    print(report_str)
    print(f"[OK] Model disimpan di       : {model_file}")
    print(f"[OK] Metrik evaluasi disimpan: {metrics_file}")


if __name__ == "__main__":
    train_and_evaluate()
