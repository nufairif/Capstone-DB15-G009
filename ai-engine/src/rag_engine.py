import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import chromadb
from llama_index.core import Document, StorageContext, VectorStoreIndex
from llama_index.core.base.embeddings.base import BaseEmbedding
from llama_index.core.postprocessor import SimilarityPostprocessor
from llama_index.core.retrievers import VectorIndexRetriever
from llama_index.core.vector_stores import ExactMatchFilter, MetadataFilters
from llama_index.llms.openai_like import OpenAILike
from llama_index.vector_stores.chroma import ChromaVectorStore
from pydantic import PrivateAttr
from sklearn.feature_extraction.text import HashingVectorizer

from src.observability import (
    estimate_llm_cost,
    observe_span,
    telemetry_store,
    update_langfuse_observation,
)
from src.system1_decision import preprocess_text

DEFAULT_LLM_BASE_URL = os.getenv(
    "LLM_BASE_URL",
    os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/") + "/v1",
)
if not DEFAULT_LLM_BASE_URL.rstrip("/").endswith("/v1"):
    DEFAULT_LLM_BASE_URL = DEFAULT_LLM_BASE_URL.rstrip("/") + "/v1"

DEFAULT_LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")
DEFAULT_LLM_MODEL = os.getenv("LLM_MODEL", os.getenv("OLLAMA_MODEL", "llama3.2:3b"))
DEFAULT_EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")


class LocalHashingFallbackEmbedding(BaseEmbedding):
    """
    Fallback embedding deterministik (384-dim) berbasis Scikit-Learn HashingVectorizer
    jika model HuggingFace tidak dapat diunduh secara offline.
    """

    _vectorizer: HashingVectorizer = PrivateAttr()

    def __init__(self, n_features: int = 384, **kwargs: Any):
        super().__init__(**kwargs)
        self._vectorizer = HashingVectorizer(
            n_features=n_features,
            ngram_range=(1, 2),
            alternate_sign=False,
            norm="l2",
        )

    def _embed(self, text: str) -> List[float]:
        cleaned = preprocess_text(text)
        vec = self._vectorizer.transform([cleaned]).toarray()[0]
        return [float(x) for x in vec]

    def _get_query_embedding(self, query: str) -> List[float]:
        return self._embed(query)

    def _get_text_embedding(self, text: str) -> List[float]:
        return self._embed(text)

    async def _aget_query_embedding(self, query: str) -> List[float]:
        return self._embed(query)

    async def _aget_text_embedding(self, text: str) -> List[float]:
        return self._embed(text)


class LocalOpenSourceRAGEngine:
    """
    Sistem RAG Berbasis LlamaIndex + ChromaDB Vector Database:
    - Vector Store: ChromaDB PersistentClient (menggantikan FAISS sesuai arahan Advisor)
    - Orkestrasi RAG: LlamaIndex (`VectorStoreIndex`, `VectorIndexRetriever`, `MetadataFilters`)
    - Embedding: HuggingFace `all-MiniLM-L6-v2` (dengan fallback deterministik Scikit-Learn jika offline)
    - Generation LLM: Endpoint OpenAI-compatible (vLLM di Google Colab via Ngrok atau Ollama lokal)
    - Observability: Tracing & metrik melalui Langfuse
    """

    def __init__(
        self,
        kb_path: Optional[Path] = None,
        chroma_dir: Optional[Path] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        llm_model: Optional[str] = None,
        embed_model_name: Optional[str] = None,
    ):
        base_dir = Path(__file__).resolve().parent.parent
        self.kb_path = kb_path or (base_dir / "data" / "firaza_knowledge_base.json")
        env_chroma = os.getenv("CHROMA_PERSIST_DIR", "").strip()
        self.chroma_dir = chroma_dir or (
            Path(env_chroma) if env_chroma else (base_dir / "models" / "chroma_db")
        )
        raw_url = (base_url or os.getenv("LLM_BASE_URL") or DEFAULT_LLM_BASE_URL).rstrip("/")
        if not raw_url.endswith("/v1"):
            raw_url = f"{raw_url}/v1"
        self.base_url = raw_url
        self.api_key = api_key or os.getenv("LLM_API_KEY", DEFAULT_LLM_API_KEY)
        self.llm_model = llm_model or os.getenv("LLM_MODEL", DEFAULT_LLM_MODEL)
        self.embed_model_name = embed_model_name or os.getenv("EMBED_MODEL", DEFAULT_EMBED_MODEL)

        self.documents: List[Dict[str, str]] = []
        self.embed_model: Optional[BaseEmbedding] = None
        self.embed_backend_label: str = self.embed_model_name
        self.chroma_client = None
        self.chroma_collection = None
        self.vector_store: Optional[ChromaVectorStore] = None
        self.index: Optional[VectorStoreIndex] = None
        self.vector_backend = "llamaindex-chromadb"

    def _init_embed_model(self) -> BaseEmbedding:
        if self.embed_model is not None:
            return self.embed_model

        use_local_fast = os.getenv("RAG_USE_HASHING_EMBEDDING", "false").lower() == "true"
        if not use_local_fast:
            try:
                from llama_index.embeddings.huggingface import HuggingFaceEmbedding

                self.embed_model = HuggingFaceEmbedding(model_name=self.embed_model_name)
                self.embed_backend_label = self.embed_model_name
                return self.embed_model
            except Exception:
                pass

        self.embed_model = LocalHashingFallbackEmbedding(n_features=384)
        self.embed_backend_label = "scikit-hashing-384d-fallback"
        return self.embed_model

    def _init_llm(self) -> OpenAILike:
        timeout_sec = float(os.getenv("LLM_TIMEOUT_SECONDS", "15"))
        return OpenAILike(
            model=self.llm_model,
            api_base=self.base_url,
            api_key=self.api_key,
            context_window=4096,
            max_tokens=320,
            temperature=0.0,
            is_chat_model=True,
            is_function_calling_model=False,
            max_retries=1,
            timeout=timeout_sec,
            default_headers={"ngrok-skip-browser-warning": "true"},
        )

    def build_or_load_index(self, force_rebuild: bool = False):
        """Membangun atau memuat Vector Database ChromaDB melalui LlamaIndex."""
        with open(self.kb_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        embed_model = self._init_embed_model()
        self.chroma_dir.mkdir(parents=True, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(path=str(self.chroma_dir))

        # Pisahkan nama koleksi berdasarkan jenis embedding agar dimensi selalu konsisten
        collection_name = (
            "firaza_kb_hf"
            if "fallback" not in self.embed_backend_label
            else "firaza_kb_hash"
        )

        if force_rebuild:
            try:
                self.chroma_client.delete_collection(name=collection_name)
            except Exception:
                pass

        self.chroma_collection = self.chroma_client.get_or_create_collection(
            name=collection_name,
            embedding_function=None,
            metadata={"hnsw:space": "cosine"},
        )
        self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
        storage_context = StorageContext.from_defaults(vector_store=self.vector_store)

        existing_count = self.chroma_collection.count()
        if existing_count == len(self.documents) and not force_rebuild:
            self.index = VectorStoreIndex.from_vector_store(
                self.vector_store,
                storage_context=storage_context,
                embed_model=embed_model,
            )
            return self

        if existing_count > 0 and existing_count != len(self.documents):
            try:
                self.chroma_client.delete_collection(name=collection_name)
                self.chroma_collection = self.chroma_client.get_or_create_collection(
                    name=collection_name,
                    embedding_function=None,
                    metadata={"hnsw:space": "cosine"},
                )
                self.vector_store = ChromaVectorStore(chroma_collection=self.chroma_collection)
                storage_context = StorageContext.from_defaults(vector_store=self.vector_store)
            except Exception:
                pass

        llama_docs = [
            Document(
                text=f"{doc['title']} ({doc['category']}): {doc['content']}",
                doc_id=doc["doc_id"],
                metadata={
                    "doc_id": doc["doc_id"],
                    "title": doc["title"],
                    "category": doc["category"],
                    "raw_content": doc["content"],
                },
            )
            for doc in self.documents
        ]
        self.index = VectorStoreIndex.from_documents(
            llama_docs,
            storage_context=storage_context,
            embed_model=embed_model,
        )
        return self

    @observe_span(name="rag-chromadb-retrieve", as_type="retriever")
    def retrieve(
        self,
        query: str,
        top_k: int = 3,
        category_filter: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Mencari dokumen katalog/SOP relevan dari ChromaDB melalui LlamaIndex VectorIndexRetriever."""
        if self.index is None:
            self.build_or_load_index()
        if self.index is None:
            raise RuntimeError("ChromaDB index belum diinisialisasi.")

        filters = None
        if category_filter:
            filters = MetadataFilters(
                filters=[ExactMatchFilter(key="category", value=category_filter)]
            )

        retriever = VectorIndexRetriever(
            index=self.index,
            similarity_top_k=top_k,
            filters=filters,
        )
        nodes = retriever.retrieve(query)

        results: List[Dict[str, Any]] = []
        for node_with_score in nodes:
            meta = node_with_score.node.metadata or {}
            score = float(node_with_score.score or 0.0)
            results.append(
                {
                    "doc_id": meta.get("doc_id", node_with_score.node.node_id),
                    "title": meta.get("title", "Dokumen Katalog"),
                    "category": meta.get("category", "Other"),
                    "content": meta.get("raw_content", node_with_score.node.get_content()),
                    "similarity_score": round(score, 4),
                }
            )
        update_langfuse_observation(
            output={"retrieved_doc_ids": [r["doc_id"] for r in results]},
            metadata={"vector_db_backend": self.vector_backend, "top_k": top_k},
        )
        return results

    @observe_span(name="rag-llamaindex-answer", as_type="chain")
    def generate_rag_answer(
        self,
        user_query: str,
        top_k: int = 3,
        category_filter: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Menjalankan alur lengkap RAG (Retrieve dari ChromaDB via LlamaIndex -> Generate via vLLM/Ollama)
        dengan Guardrail ketat dan tracing Langfuse.
        """
        t_start = time.perf_counter()
        retrieved_docs = self.retrieve(user_query, top_k=top_k, category_filter=category_filter)
        max_sim = max((float(d["similarity_score"]) for d in retrieved_docs), default=0.0)

        is_hf = "fallback" not in self.embed_backend_label
        threshold = 0.35 if is_hf else 0.46

        if max_sim < threshold:
            elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
            resp_payload = {
                "query": user_query,
                "answer": (
                    "Maaf, pertanyaan tersebut berada di luar ruang lingkup layanan Toko Firaza. "
                    "Saya hanya dapat menjawab pertanyaan seputar Katalog Sajadah Custom, Handuk Personalisasi, "
                    "Paket Hampers, Ukuran, Warna, Harga, dan SOP Produksi Toko Firaza."
                ),
                "retrieved_documents": [],
                "meta": {
                    "vector_db_backend": self.vector_backend,
                    "embedding_model": self.embed_backend_label,
                    "generation_model": self.llm_model,
                    "llm_endpoint": self.base_url,
                    "used_on_premise_llm": False,
                    "guardrail_blocked": True,
                    "max_similarity_score": round(max_sim, 4),
                    "latency_ms": elapsed_ms,
                    "proprietary_api_used": False,
                },
            }
            telemetry_store.record({"latency_ms": elapsed_ms, "total_tokens": 0, "estimated_cost_idr": 0.0})
            update_langfuse_observation(output=resp_payload["answer"], metadata=resp_payload["meta"])
            return resp_payload

        # Gunakan SimilarityPostprocessor-style filtering
        doc_threshold = 0.20 if is_hf else 0.10
        relevant_docs = [d for d in retrieved_docs if float(d["similarity_score"]) >= doc_threshold]
        if not relevant_docs and retrieved_docs:
            relevant_docs = retrieved_docs[:1]

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
        prompt_tokens = 0
        completion_tokens = 0

        try:
            from llama_index.core.llms import ChatMessage, MessageRole

            llm = self._init_llm()
            chat_resp = llm.chat(
                [
                    ChatMessage(role=MessageRole.SYSTEM, content=rag_system_prompt),
                    ChatMessage(role=MessageRole.USER, content=user_query),
                ]
            )
            answer_text = (chat_resp.message.content or "").strip()
            used_local_llm = True

            raw_resp = getattr(chat_resp, "raw", None)
            usage = getattr(raw_resp, "usage", None) if raw_resp else None
            if usage:
                prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
                completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0)

            for trigger in ["Namun, saya bisa", "Namun saya bisa", "Tetapi saya bisa", "Namun, berikut"]:
                if trigger in answer_text:
                    answer_text = answer_text.split(trigger)[0].strip()
        except Exception:
            best_doc = relevant_docs[0] if relevant_docs else None
            if best_doc:
                answer_text = f"Berdasarkan {best_doc['title']}: {best_doc['content']}"
            else:
                answer_text = "Maaf, informasi belum ditemukan pada katalog Toko Firaza."

        elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
        cost_info = estimate_llm_cost(prompt_tokens, completion_tokens)
        meta = {
            **cost_info,
            "vector_db_backend": self.vector_backend,
            "embedding_model": self.embed_backend_label,
            "generation_model": self.llm_model,
            "llm_endpoint": self.base_url,
            "used_on_premise_llm": used_local_llm,
            "guardrail_blocked": False,
            "max_similarity_score": round(max_sim, 4),
            "latency_ms": elapsed_ms,
            "proprietary_api_used": False,
        }
        telemetry_store.record(meta)
        update_langfuse_observation(
            output=answer_text,
            model=self.llm_model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            metadata=meta,
        )

        return {
            "query": user_query,
            "answer": answer_text,
            "retrieved_documents": relevant_docs,
            "meta": meta,
        }
