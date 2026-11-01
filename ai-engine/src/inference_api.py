from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.llm_extractor import LocalLLMOrderExtractor
from src.rag_engine import LocalOpenSourceRAGEngine
from src.schemas import (
    AnalyzeOrderRequest,
    AnalyzeOrderResponse,
    ClassificationResult,
)
from src.train_classifier import OrderClassifier

classifier = OrderClassifier()
extractor = LocalLLMOrderExtractor()
rag_engine = LocalOpenSourceRAGEngine()


@asynccontextmanager
async def lifespan(app: FastAPI):
    classifier.load()
    rag_engine.build_or_load_index()
    yield


app = FastAPI(
    title="Toko Firaza AI Order Management & Local RAG — Inference API",
    description=(
        "Inference API untuk Klasifikasi Kategori Pesanan (Predictive AI), "
        "Ekstraksi Order + Kartu Ucapan (Generative AI), serta Sistem RAG Katalog "
        "100% Lokal Open-Source Tanpa API Proprietary — Tim DB15-G009"
    ),
    version="1.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RAGQueryRequest(BaseModel):
    query: str = Field(
        ...,
        min_length=3,
        description="Pertanyaan seputar katalog produk, ukuran, warna, aturan bordir, atau SOP Toko Firaza",
    )
    top_k: int = Field(default=2, ge=1, le=5)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "team_id": "DB15-G009",
        "classifier_loaded": classifier.pipeline is not None,
        "rag_vector_db": rag_engine.vector_backend,
        "llm_model": extractor.model_name,
        "proprietary_api_used": False,
    }


@app.post("/api/v1/ai/classify", response_model=ClassificationResult)
def classify_order_endpoint(payload: AnalyzeOrderRequest):
    """Endpoint cepat khusus Predictive AI (klasifikasi 5 kategori pesanan)."""
    return classifier.predict(payload.raw_message)


@app.post("/api/v1/ai/analyze-order", response_model=AnalyzeOrderResponse)
def analyze_order_endpoint(payload: AnalyzeOrderRequest):
    """
    Endpoint utama AI-Assisted Order Management (Predictive AI + RAG + Generative AI):
    1. Menjalankan Predictive AI (Scikit-Learn) untuk mendeteksi kategori pesanan.
    2. Menjalankan Retrieval (RAG) dari Vector Database Katalog Toko Firaza.
    3. Menjalankan Generative AI (LLM Lokal On-Premise / Fallback) untuk mengekstrak JSON Order Summary & Kartu Ucapan.
    """
    prediction = classifier.predict(payload.raw_message)
    retrieved_docs = rag_engine.retrieve(payload.raw_message, top_k=2)
    rag_context_str = "\n".join([f"- {d['title']}: {d['content']}" for d in retrieved_docs])

    extraction, used_fallback = extractor.extract(
        raw_message=payload.raw_message,
        predicted_category=prediction.category,
        generate_greeting_card=payload.generate_greeting_card,
        rag_context=rag_context_str,
    )

    return AnalyzeOrderResponse(
        status="success",
        prediction=prediction,
        extraction=extraction,
        meta={
            "classifier_model": "tfidf-svm-calibrated-v1",
            "llm_model": extractor.model_name,
            "rag_vector_db": rag_engine.vector_backend,
            "rag_retrieved_doc_ids": [d["doc_id"] for d in retrieved_docs],
            "used_fallback": used_fallback,
            "proprietary_api_used": False,
        },
    )


@app.post("/api/v1/ai/rag-catalog")
def rag_catalog_endpoint(payload: RAGQueryRequest):
    """
    Endpoint Side Quest RAG (Retrieval-Augmented Generation):
    Menjawab pertanyaan seputar katalog, ukuran, warna, aturan bordir, dan SOP Toko Firaza
    menggunakan Vector Database lokal + Open-Source SLM/LLM lokal (tanpa API proprietary).
    """
    return rag_engine.generate_rag_answer(user_query=payload.query, top_k=payload.top_k)
