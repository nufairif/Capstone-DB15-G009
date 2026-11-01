import json
import os
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import Normalizer
from sklearn.pipeline import FeatureUnion, make_pipeline

from src.train_classifier import preprocess_text

DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_LLM_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")


class LocalOpenSourceRAGEngine:
    """
    Sistem RAG 100% Open-Source Lokal untuk Katalog & SOP Toko Firaza.
    Memenuhi Side Quest Dicoding:
    - Model Embedding Open-Source Lokal
    - Vector Database Lokal (FAISS / Persisted Cosine Index)
    - Model Generation SLM/LLM Open-Source Lokal (On-Premise via Ollama)
    """

    def __init__(
        self,
        kb_path: Optional[Path] = None,
        index_path: Optional[Path] = None,
        ollama_url: str = DEFAULT_OLLAMA_URL,
        llm_model: str = DEFAULT_LLM_MODEL,
    ):
        base_dir = Path(__file__).resolve().parent.parent
        self.kb_path = kb_path or (base_dir / "data" / "firaza_knowledge_base.json")
        self.index_path = index_path or (base_dir / "models" / "firaza_vector_store.joblib")
        self.ollama_url = ollama_url.rstrip("/")
        self.llm_model = llm_model

        self.documents: List[Dict[str, str]] = []
        self.embedding_pipeline = None
        self.doc_vectors: Optional[np.ndarray] = None
        self.faiss_index = None
        self.vector_backend = "local-cosine-vector-db"

    def build_or_load_index(self, force_rebuild: bool = False):
        """Membangun atau memuat Vector Database lokal dari Knowledge Base Toko Firaza."""
        if not force_rebuild and self.index_path.exists():
            saved = joblib.load(self.index_path)
            if len(saved.get("documents", [])) == 75 and saved.get("version") == "v2":
                self.documents = saved["documents"]
                self.embedding_pipeline = saved["embedding_pipeline"]
                self.doc_vectors = saved["doc_vectors"]
                self._init_faiss_if_available()
                return self

        with open(self.kb_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        # Beri bobot ekstra (3x) pada judul dokumen & doc_id agar dokumen Katalog Utama (CAT/SKU/FAQ)
        # lebih diprioritaskan ketika query menanyakan kata kunci spesifik seperti 'ukuran', 'harga', 'garansi'.
        corpus = [
            preprocess_text(
                f"{doc['title']} {doc['title']} {doc['title']} {doc['category']} {doc['content']}"
            )
            for doc in self.documents
        ]

        transformer_list: Any = [
            ("word", TfidfVectorizer(ngram_range=(1, 2), sublinear_tf=True)),
            ("char", TfidfVectorizer(analyzer="char_wb", ngram_range=(3, 5), sublinear_tf=True)),
        ]
        self.embedding_pipeline = make_pipeline(
            FeatureUnion(transformer_list),
            Normalizer(copy=False),
        )
        vectors_raw: Any = self.embedding_pipeline.fit_transform(corpus)
        vectors = vectors_raw.toarray() if hasattr(vectors_raw, "toarray") else vectors_raw
        self.doc_vectors = np.asarray(vectors, dtype=np.float32)

        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "version": "v2",
                "documents": self.documents,
                "embedding_pipeline": self.embedding_pipeline,
                "doc_vectors": self.doc_vectors,
            },
            self.index_path,
        )
        self._init_faiss_if_available()
        return self

    def _init_faiss_if_available(self):
        """Jika library `faiss` tersedia, gunakan FAISS IndexFlatIP sebagai Vector DB."""
        if self.doc_vectors is None:
            return
        try:
            import faiss  # type: ignore

            dim = self.doc_vectors.shape[1]
            index = faiss.IndexFlatIP(dim)
            index.add(self.doc_vectors)
            self.faiss_index = index
            self.vector_backend = "faiss-cpu-IndexFlatIP"
        except ImportError:
            self.faiss_index = None
            self.vector_backend = "scikit-cosine-vector-store"

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Mencari dokumen katalog/SOP paling relevan dari Vector Database."""
        if self.doc_vectors is None or self.embedding_pipeline is None:
            self.build_or_load_index()
        if self.doc_vectors is None or self.embedding_pipeline is None:
            raise RuntimeError("Vector database belum diinisialisasi.")

        cleaned_query = preprocess_text(query)
        q_raw: Any = self.embedding_pipeline.transform([cleaned_query])
        q_arr = q_raw.toarray() if hasattr(q_raw, "toarray") else q_raw
        q_vec = np.asarray(q_arr, dtype=np.float32)

        if self.faiss_index is not None:
            scores, indices = self.faiss_index.search(q_vec, top_k)
            top_indices = indices[0]
            top_scores = scores[0]
        else:
            sims = np.dot(self.doc_vectors, q_vec[0])
            top_indices = np.argsort(sims)[::-1][:top_k]
            top_scores = sims[top_indices]

        results = []
        for idx, score in zip(top_indices, top_scores):
            doc = self.documents[int(idx)]
            results.append({
                "doc_id": doc["doc_id"],
                "title": doc["title"],
                "category": doc["category"],
                "content": doc["content"],
                "similarity_score": round(float(score), 4),
            })
        return results

    def generate_rag_answer(self, user_query: str, top_k: int = 3) -> Dict[str, Any]:
        """
        Menjalankan alur lengkap RAG (Retrieve dari Vector DB -> Generate dengan Local Open-Source LLM via Ollama)
        lengkap dengan Guardrail Ketat (menolak pertanyaan di luar topik Toko Firaza).
        """
        retrieved_docs = self.retrieve(user_query, top_k=top_k)
        max_sim = max((float(d["similarity_score"]) for d in retrieved_docs), default=0.0)

        # GUARDRAIL LAYER 1: Jika skor kemiripan vektor di bawah ambang batas (< 0.18),
        # berarti pertanyaan di luar konteks katalog Toko Firaza (misal: tanya resep nasi goreng, cuaca, politik, dll.)
        if max_sim < 0.18:
            return {
                "query": user_query,
                "answer": (
                    "Maaf, pertanyaan tersebut berada di luar ruang lingkup layanan Toko Firaza. "
                    "Saya hanya dapat menjawab pertanyaan seputar Katalog Sajadah Custom, Handuk Personalisasi, "
                    "Paket Hampers, Ukuran, Warna, Harga, dan SOP Produksi Toko Firaza."
                ),
                "retrieved_documents": [],
                "meta": {
                    "vector_db_backend": self.vector_backend,
                    "generation_model": self.llm_model,
                    "used_on_premise_llm": False,
                    "guardrail_blocked": True,
                    "max_similarity_score": round(max_sim, 4),
                    "proprietary_api_used": False,
                },
            }

        # Filter hanya dokumen yang relevan (similarity >= 0.15)
        relevant_docs = [d for d in retrieved_docs if float(d["similarity_score"]) >= 0.15]
        context_block = "\n\n".join(
            [f"[{d['doc_id']}] {d['title']}:\n{d['content']}" for d in relevant_docs]
        )

        rag_system_prompt = (
            "Anda adalah asisten layanan pelanggan resmi Toko Firaza. "
            "Dokumen di bawah ini adalah kutipan resmi dari Katalog & SOP Toko Firaza yang relevan dengan pertanyaan pengguna. "
            "Tugas Anda adalah menjawab pertanyaan pengguna secara langsung, jelas, dan ramah HANYA menggunakan fakta yang tertulis pada dokumen di bawah ini. "
            "Jangan mengarang angka, ukuran, atau kebijakan di luar dokumen berikut.\n\n"
            f"=== DOKUMEN RESMI TOKO FIRAZA ===\n{context_block}"
        )

        used_local_llm = False
        answer_text = ""

        # Coba panggil Local SLM/LLM (Ollama on-premise)
        try:
            payload = {
                "model": self.llm_model,
                "messages": [
                    {"role": "system", "content": rag_system_prompt},
                    {"role": "user", "content": user_query},
                ],
                "stream": False,
                "options": {"temperature": 0.0, "num_predict": 300},
            }
            req = urllib.request.Request(
                url=f"{self.ollama_url}/api/chat",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                body = json.loads(resp.read().decode("utf-8"))
                answer_text = body["message"]["content"].strip()
                used_local_llm = True

                # GUARDRAIL LAYER 2: Potong jika LLM mencoba menambahkan "Namun, saya bisa..." setelah menolak
                for trigger in ["Namun, saya bisa", "Namun saya bisa", "Tetapi saya bisa", "Namun, berikut"]:
                    if trigger in answer_text:
                        answer_text = answer_text.split(trigger)[0].strip()
        except (urllib.error.URLError, TimeoutError, ConnectionError, KeyError, json.JSONDecodeError):
            best_doc = relevant_docs[0] if relevant_docs else None
            if best_doc:
                answer_text = f"Berdasarkan {best_doc['title']}: {best_doc['content']}"
            else:
                answer_text = "Maaf, informasi belum ditemukan pada katalog Toko Firaza."

        return {
            "query": user_query,
            "answer": answer_text,
            "retrieved_documents": relevant_docs,
            "meta": {
                "vector_db_backend": self.vector_backend,
                "generation_model": self.llm_model,
                "used_on_premise_llm": used_local_llm,
                "guardrail_blocked": False,
                "max_similarity_score": round(max_sim, 4),
                "proprietary_api_used": False,
            },
        }
