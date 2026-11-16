from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.llm_extractor import (
    LLMServiceUnavailableError,
    LocalLLMOrderExtractor,
    StructuredContractError,
)
from src.observability import is_langfuse_configured, observe_span, telemetry_store
from src.rag_engine import LocalOpenSourceRAGEngine
from src.schemas import (
    AnalyzeOrderRequest,
    AnalyzeOrderResponse,
    ClassificationResult,
)
from src.system1_decision import System1DecisionModel, build_classification_result

extractor = LocalLLMOrderExtractor()
rag_engine = LocalOpenSourceRAGEngine()
system1 = System1DecisionModel()


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_engine.build_or_load_index()
    yield


app = FastAPI(
    title="Toko Firaza AI Order Management & RAG — Inference API",
    description=(
        "Inference API berbasis Instructor + Pydantic (vLLM/Ngrok atau Ollama), "
        "System 1 Decision Model, RAG LlamaIndex + ChromaDB, dan Observability Langfuse — Tim DB15-G009"
    ),
    version="2.0.0",
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
    top_k: int = Field(default=3, ge=1, le=5)
    category_filter: Optional[str] = None


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "team_id": "DB15-G009",
        "separate_5class_classifier": False,
        "system1_decision_active": True,
        "structured_output_engine": "instructor-pydantic",
        "rag_vector_db": rag_engine.vector_backend,
        "langfuse_enabled": is_langfuse_configured(),
        "llm_endpoint": extractor.base_url,
        "llm_model": extractor.model_name,
        "proprietary_api_used": False,
    }


@app.post("/api/v1/ai/classify", response_model=ClassificationResult)
def classify_order_endpoint(payload: AnalyzeOrderRequest):
    """Endpoint System 1 Decision Model (penyaringan cepat non-pesanan)."""
    s1 = system1.evaluate(payload.raw_message)
    if not s1["route_to_llm"]:
        return build_classification_result("Other", float(s1["confidence"] or 0.92))
    return build_classification_result("Custom Sajadah", 0.5)


@app.post("/api/v1/ai/analyze-order", response_model=AnalyzeOrderResponse)
@observe_span(name="inference-analyze-order", as_type="chain")
def analyze_order_endpoint(payload: AnalyzeOrderRequest):
    """
    Endpoint utama AI Order Management:
    1. System 1 Decision Model menyaring pesan non-pesanan.
    2. LlamaIndex + ChromaDB mengambil konteks katalog Toko Firaza.
    3. Instructor + Pydantic mengekstrak kategori & detail pesanan dalam satu kontrak JSON ketat.
    """
    retrieved_docs = rag_engine.retrieve(payload.raw_message, top_k=2)
    rag_context_str = "\n".join([f"- {d['title']}: {d['content']}" for d in retrieved_docs])

    try:
        extraction, llm_meta = extractor.extract(
            raw_message=payload.raw_message,
            generate_greeting_card=payload.generate_greeting_card,
            rag_context=rag_context_str,
        )
    except StructuredContractError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except LLMServiceUnavailableError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    prediction = build_classification_result(
        category=extraction.order_category,
        confidence=extraction.category_confidence,
    )

    return AnalyzeOrderResponse(
        status="success",
        prediction=prediction,
        extraction=extraction,
        meta={
            **llm_meta,
            "extraction_engine": "instructor-pydantic",
            "llm_model": extractor.model_name,
            "rag_vector_db": rag_engine.vector_backend,
            "rag_retrieved_doc_ids": [d["doc_id"] for d in retrieved_docs],
            "proprietary_api_used": False,
        },
    )


@app.post("/api/v1/ai/rag-catalog")
def rag_catalog_endpoint(payload: RAGQueryRequest):
    """Endpoint RAG berbasis LlamaIndex + ChromaDB + vLLM/Ollama."""
    return rag_engine.generate_rag_answer(
        user_query=payload.query,
        top_k=payload.top_k,
        category_filter=payload.category_filter,
    )


@app.get("/api/v1/ai/telemetry")
def telemetry_endpoint():
    return telemetry_store.summary()
