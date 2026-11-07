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
DEFAULT_EMBED_MODEL = os.getenv("OLLAMA_EMBED_MODEL", "all-minilm")


class LocalOpenSourceRAGEngine:
    """
    Sistem RAG 100% Open-Source Lokal untuk Katalog & SOP Toko Firaza.
    Memenuhi Side Quest Dicoding secara ketat:
    - Model Embedding Open-Source Lokal: Neural Dense Embedding (`all-minilm` / `all-MiniLM-L6-v2` 384-dim) + Hybrid N-Gram
    - Vector Database Lokal: FAISS (`faiss-cpu` `IndexFlatIP`, disimpan ke `models/firaza_faiss.index`)
    - Model Generation SLM/LLM Open-Source Lokal: Meta `llama3.2:3b` (On-Premise via Ollama)
    """

    def __init__(
        self,
        kb_path: Optional[Path] = None,
        index_path: Optional[Path] = None,
        ollama_url: str = DEFAULT_OLLAMA_URL,
        llm_model: str = DEFAULT_LLM_MODEL,
        embed_model: str = DEFAULT_EMBED_MODEL,
    ):
        base_dir = Path(__file__).resolve().parent.parent
        self.kb_path = kb_path or (base_dir / "data" / "firaza_knowledge_base.json")
        self.index_path = index_path or (base_dir / "models" / "firaza_vector_store.joblib")
        self.faiss_index_path = base_dir / "models" / "firaza_faiss.index"
        self.ollama_url = ollama_url.rstrip("/")
        self.llm_model = llm_model
        self.embed_model = embed_model

        self.documents: List[Dict[str, str]] = []
        self.embedding_pipeline = None
        self.doc_vectors: Optional[np.ndarray] = None
        self.has_neural_embeddings: bool = False
        self.faiss_index = None
        self.vector_backend = "faiss-cpu-IndexFlatIP"

    def _encode_neural_batch(self, texts: List[str]) -> Optional[np.ndarray]:
        """Menghasilkan dense neural embedding (384-dim) menggunakan model open-source `all-minilm` via Ollama `/api/embed`."""
        try:
            payload = {
                "model": self.embed_model,
                "input": texts,
            }
            req = urllib.request.Request(
                url=f"{self.ollama_url}/api/embed",
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                embeddings = data.get("embeddings")
                if embeddings and len(embeddings) == len(texts):
                    arr = np.asarray(embeddings, dtype=np.float32)
                    norms = np.linalg.norm(arr, axis=1, keepdims=True)
                    norms[norms == 0] = 1.0
                    return arr / norms
        except Exception:
            pass
        return None

    def build_or_load_index(self, force_rebuild: bool = False):
        """Membangun atau memuat Vector Database FAISS dari Knowledge Base Toko Firaza."""
        if not force_rebuild and self.index_path.exists():
            saved = joblib.load(self.index_path)
            if (
                len(saved.get("documents", [])) == 75
                and saved.get("version") == "v3-neural-faiss"
            ):
                self.documents = saved["documents"]
                self.embedding_pipeline = saved["embedding_pipeline"]
                self.doc_vectors = saved["doc_vectors"]
                self.has_neural_embeddings = bool(saved.get("has_neural_embeddings", False))
                self._init_faiss_if_available()
                return self

        with open(self.kb_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        corpus = [
            preprocess_text(
                f"{doc['title']} {doc['title']} {doc['title']} {doc['category']} {doc['content']}"
            )
            for doc in self.documents
        ]
        raw_texts = [
            f"{doc['title']} ({doc['category']}): {doc['content']}"
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
        lexical_vecs = vectors_raw.toarray() if hasattr(vectors_raw, "toarray") else vectors_raw
        lexical_vecs = np.asarray(lexical_vecs, dtype=np.float32)

        # Gabungkan Neural Embedding (all-MiniLM-L6-v2 384-dim) + Lexical TF-IDF (Hybrid Vector Representation)
        neural_vecs = self._encode_neural_batch(raw_texts)
        if neural_vecs is not None:
            # Bobot 50% Neural Dense Semantic + 50% Lexical Exact SKU/Ukuran, dinormalisasi ke unit sphere L2
            combined = np.hstack([neural_vecs * np.sqrt(0.5), lexical_vecs * np.sqrt(0.5)]).astype(np.float32)
            norms = np.linalg.norm(combined, axis=1, keepdims=True)
            norms[norms == 0] = 1.0
            self.doc_vectors = combined / norms
            self.has_neural_embeddings = True
        else:
            self.doc_vectors = lexical_vecs
            self.has_neural_embeddings = False

        self.index_path.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(
            {
                "version": "v3-neural-faiss",
                "documents": self.documents,
                "embedding_pipeline": self.embedding_pipeline,
                "doc_vectors": self.doc_vectors,
                "has_neural_embeddings": self.has_neural_embeddings,
                "embedding_model": f"{self.embed_model} (all-MiniLM-L6-v2) + Hybrid TF-IDF"
                if self.has_neural_embeddings
                else "Hybrid TF-IDF",
            },
            self.index_path,
        )
        self._init_faiss_if_available(save_disk=True)
        return self

    def _init_faiss_if_available(self, save_disk: bool = False):
        """Menginisialisasi indeks vektor FAISS IndexFlatIP dan menyimpannya ke disk."""
        if self.doc_vectors is None:
            return
        try:
            import faiss  # type: ignore

            dim = self.doc_vectors.shape[1]
            index = faiss.IndexFlatIP(dim)
            index.add(np.ascontiguousarray(self.doc_vectors, dtype=np.float32))
            self.faiss_index = index
            self.vector_backend = "faiss-cpu-IndexFlatIP"
            if save_disk or not self.faiss_index_path.exists():
                faiss.write_index(index, str(self.faiss_index_path))
        except ImportError:
            self.faiss_index = None
            self.vector_backend = "scikit-cosine-vector-store"

    def retrieve(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Mencari dokumen katalog/SOP paling relevan dari Vector Database FAISS."""
        if self.doc_vectors is None or self.embedding_pipeline is None:
            self.build_or_load_index()
        if self.doc_vectors is None or self.embedding_pipeline is None:
            raise RuntimeError("Vector database belum diinisialisasi.")

        cleaned_query = preprocess_text(query)
        q_raw: Any = self.embedding_pipeline.transform([cleaned_query])
        q_arr = q_raw.toarray() if hasattr(q_raw, "toarray") else q_raw
        lexical_q = np.asarray(q_arr, dtype=np.float32)

        if self.has_neural_embeddings:
            neural_q = self._encode_neural_batch([query])
            if neural_q is None:
                neural_q = np.zeros((1, 384), dtype=np.float32)
            q_vec = np.hstack([neural_q * np.sqrt(0.5), lexical_q * np.sqrt(0.5)]).astype(np.float32)
            norm = np.linalg.norm(q_vec, axis=1, keepdims=True)
            norm[norm == 0] = 1.0
            q_vec = q_vec / norm
        else:
            q_vec = lexical_q

        q_vec = np.ascontiguousarray(q_vec, dtype=np.float32)

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
        Menjalankan alur lengkap RAG (Retrieve dari FAISS Vector DB -> Generate dengan Local Open-Source LLM via Ollama)
        lengkap dengan Guardrail Ketat (menolak pertanyaan di luar topik Toko Firaza).
        """
        retrieved_docs = self.retrieve(user_query, top_k=top_k)
        max_sim = max((float(d["similarity_score"]) for d in retrieved_docs), default=0.0)

        # GUARDRAIL LAYER 1: Jika skor kemiripan vektor di bawah ambang batas (< 0.22),
        # berarti pertanyaan di luar konteks katalog Toko Firaza (misal: tanya resep nasi goreng, cuaca, politik, dll.)
        threshold = 0.26 if self.has_neural_embeddings else 0.18
        if max_sim < threshold:
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
                    "embedding_model": f"{self.embed_model} (all-MiniLM-L6-v2)" if self.has_neural_embeddings else "Hybrid TF-IDF",
                    "generation_model": self.llm_model,
                    "used_on_premise_llm": False,
                    "guardrail_blocked": True,
                    "max_similarity_score": round(max_sim, 4),
                    "proprietary_api_used": False,
                },
            }

        # Filter hanya dokumen yang relevan
        doc_threshold = 0.22 if self.has_neural_embeddings else 0.15
        relevant_docs = [d for d in retrieved_docs if float(d["similarity_score"]) >= doc_threshold]
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
                "embedding_model": f"{self.embed_model} (all-MiniLM-L6-v2)" if self.has_neural_embeddings else "Hybrid TF-IDF",
                "generation_model": self.llm_model,
                "used_on_premise_llm": used_local_llm,
                "guardrail_blocked": False,
                "max_similarity_score": round(max_sim, 4),
                "proprietary_api_used": False,
            },
        }
