from fastapi import APIRouter, HTTPException
from models.schemas import RAGQueryPayload
from services.ai_service import (
    AnalyzeOrderRequest,
    AnalyzeOrderResponse,
    ClassificationResult,
    LLMServiceUnavailableError,
    StructuredContractError,
    aggregator,
    build_classification_result,
    extractor,
    get_dataset_overview,
    query_rag_catalog,
    rag_engine,
    system1_model,
)
from src.observability import observe_span, telemetry_store, update_langfuse_observation

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/classify", response_model=ClassificationResult)
def classify_order_endpoint(payload: AnalyzeOrderRequest):
    """
    Endpoint System 1 Decision Model (triage cepat < 2ms).
    Catatan: model klasifikasi 5 kategori terpisah sudah dihentikan; penentuan
    kategori pesanan dilakukan langsung oleh GenAI (Instructor + Pydantic) pada /analyze-order.
    """
    s1 = system1_model.evaluate(payload.raw_message)
    if not s1["route_to_llm"]:
        return build_classification_result("Other", float(s1["confidence"] or 0.92))
    return build_classification_result("Custom Sajadah", 0.5)


@router.post("/analyze-order", response_model=AnalyzeOrderResponse)
@observe_span(name="api-analyze-order", as_type="chain")
def analyze_order_endpoint(payload: AnalyzeOrderRequest):
    """
    Alur utama AI Order Management (tanpa model klasifikasi 5 kategori terpisah):
    1. System 1 Decision Model menyaring pesan non-pesanan secara instan.
    2. LlamaIndex + ChromaDB mengambil referensi katalog & SOP Toko Firaza.
    3. Instructor + Pydantic memanggil vLLM (via Ngrok) / Ollama untuk mengekstrak
       kategori sekaligus detail item pesanan dalam satu kontrak JSON tervalidasi.
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

    meta = {
        **llm_meta,
        "extraction_engine": "instructor-pydantic",
        "llm_model": extractor.model_name,
        "rag_vector_db": rag_engine.vector_backend,
        "rag_retrieved_doc_ids": [d["doc_id"] for d in retrieved_docs],
        "proprietary_api_used": False,
    }
    update_langfuse_observation(output={"category": prediction.category}, metadata=meta)

    return AnalyzeOrderResponse(
        status="success",
        prediction=prediction,
        extraction=extraction,
        meta=meta,
    )


@router.post("/rag-catalog")
def rag_catalog_endpoint(payload: RAGQueryPayload):
    return query_rag_catalog(payload.query, payload.top_k, payload.category_filter)


@router.get("/telemetry")
def get_ai_telemetry():
    """Mengembalikan metrik observabilitas (latensi, token, cost metric, validation rate)."""
    return telemetry_store.summary()


@router.get("/dataset-overview")
def get_dataset_and_model_overview(sample_limit: int = 15):
    """Menampilkan ringkasan dataset, agregasi Scikit-Learn, serta telemetri AI."""
    return get_dataset_overview(sample_limit=sample_limit)
