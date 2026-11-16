import re
from collections import Counter
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.feature_extraction.text import CountVectorizer

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

ORDER_INTENT_KEYWORDS = {
    "pesen",
    "pesan",
    "order",
    "beli",
    "checkout",
    "pcs",
    "paket",
    "box",
    "bordir",
    "custom",
    "nama",
    "tulisan",
    "font",
    "sajadah",
    "handuk",
    "hampers",
    "kado",
    "souvenir",
    "ready",
}

NON_ORDER_INQUIRY_KEYWORDS = {
    "alamat",
    "lokasi",
    "dimana",
    "ongkir",
    "ongkos kirim",
    "cuci",
    "perawatan",
    "jam buka",
    "garansi",
    "komplain",
    "resi",
    "lacak",
    "terima kasih",
    "makasih",
}


def preprocess_text(text: str) -> str:
    """Membersihkan teks dan menormalisasi singkatan umum pelanggan."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", " ", text)
    tokens = text.split()
    normalized = [SLANG_MAP.get(tok, tok) for tok in tokens]
    return " ".join(normalized)


class System1DecisionModel:
    """
    System 1 Decision Model (Fast Triage < 2ms):
    Sesuai arahan Advisor, model klasifikasi 5 kategori terpisah tidak dikembangkan lagi.
    Lapisan System 1 ini melakukan penyaringan cepat (heuristik + normalisasi slang)
    untuk mendeteksi pesan non-pesanan ('Other') agar tidak membuang token & waktu GPU
    sebelum meneruskan pesan pesanan nyata ke System 2 (GenAI Instructor + vLLM/Ollama).
    """

    def evaluate(self, raw_message: str) -> Dict[str, Any]:
        normalized = preprocess_text(raw_message)
        tokens = set(normalized.split())

        has_qty = bool(re.search(r"\b\d+\s*(?:pcs|paket|box|set|lembar|biji|buah)?\b", normalized))
        order_hits = tokens.intersection(ORDER_INTENT_KEYWORDS)
        inquiry_hits = [kw for kw in NON_ORDER_INQUIRY_KEYWORDS if kw in normalized]

        # Short-circuit sebagai 'Other' hanya jika jelas pertanyaan umum / sapaan tanpa niat beli
        is_pure_non_order = (
            (len(inquiry_hits) > 0 and not has_qty and len(order_hits.intersection({"pesen", "pesan", "order", "beli", "pcs", "paket"})) == 0)
            or (len(tokens) <= 4 and len(order_hits) == 0 and not has_qty)
        )

        if is_pure_non_order:
            return {
                "route_to_llm": False,
                "category": "Other",
                "confidence": 0.92,
                "reason": "System 1 mendeteksi pertanyaan umum / sapaan tanpa spesifikasi pesanan.",
                "normalized_text": normalized,
            }

        return {
            "route_to_llm": True,
            "category": None,
            "confidence": None,
            "reason": "Diteruskan ke System 2 (GenAI Instructor) untuk ekstraksi terstruktur & kategorisasi.",
            "normalized_text": normalized,
        }


class OrderAggregationService:
    """
    Layanan agregasi berbasis Scikit-Learn (`CountVectorizer` + statistik numerik)
    untuk meringkas pola pesanan, frekuensi kata kunci kustomisasi, serta distribusi kategori
    tanpa melatih pipeline klasifikasi 5 kategori terpisah.
    """

    def aggregate_texts(self, messages: List[str], top_n: int = 10) -> Dict[str, Any]:
        if not messages:
            return {"total_documents": 0, "top_keywords": []}

        cleaned = [preprocess_text(m) for m in messages if m and m.strip()]
        if not cleaned:
            return {"total_documents": 0, "top_keywords": []}

        vectorizer = CountVectorizer(ngram_range=(1, 2), max_features=200)
        matrix = vectorizer.fit_transform(cleaned)
        counts = np.asarray(matrix.sum(axis=0)).ravel()
        vocab = vectorizer.get_feature_names_out()

        top_indices = np.argsort(counts)[::-1][:top_n]
        top_keywords = [
            {"term": str(vocab[idx]), "count": int(counts[idx])}
            for idx in top_indices
            if counts[idx] > 0
        ]
        return {
            "total_documents": len(cleaned),
            "vocabulary_size": len(vocab),
            "top_keywords": top_keywords,
        }

    def aggregate_records(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Menghitung fungsi agregasi kategori dan metrik ringkasan dari daftar data/pesanan."""
        categories = [str(r.get("category", "Other")) for r in records]
        cat_counts = dict(Counter(categories))
        texts = [str(r.get("text") or r.get("raw_message") or "") for r in records]
        text_stats = self.aggregate_texts(texts, top_n=8)
        return {
            "total_records": len(records),
            "category_distribution": cat_counts,
            **text_stats,
        }


def build_classification_result(
    category: OrderCategory,
    confidence: float = 0.95,
) -> ClassificationResult:
    """Membangun objek `ClassificationResult` dari hasil GenAI / System 1 agar kontrak API tetap konsisten."""
    all_cats: List[OrderCategory] = [
        "Ready Stock",
        "Custom Sajadah",
        "Custom Handuk",
        "Hampers",
        "Other",
    ]
    remainder = max(0.0, round(1.0 - confidence, 4))
    other_prob = round(remainder / max(1, len(all_cats) - 1), 4)
    probs = {
        cat: (round(confidence, 4) if cat == category else other_prob)
        for cat in all_cats
    }
    return ClassificationResult(
        category=category,
        confidence=round(confidence, 4),
        all_probabilities=probs,
    )
