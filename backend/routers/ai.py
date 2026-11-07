from fastapi import APIRouter
from models.schemas import RAGQueryPayload
from services.ai_service import (
    classifier,
    extractor,
    rag_engine,
    query_rag_catalog,
    get_dataset_overview,
    AnalyzeOrderRequest,
    AnalyzeOrderResponse,
    ClassificationResult,
)

router = APIRouter(prefix="/api/v1/ai", tags=["ai"])


@router.post("/classify", response_model=ClassificationResult)
def classify_order_endpoint(payload: AnalyzeOrderRequest):
    return classifier.predict(payload.raw_message)


@router.post("/analyze-order", response_model=AnalyzeOrderResponse)
def analyze_order_endpoint(payload: AnalyzeOrderRequest):
    prediction = classifier.predict(payload.raw_message)
    # Gunakan fast retrieval agar tidak men-trigger model swap di Ollama saat ekstraksi pesanan
    retrieved_docs = rag_engine.retrieve(payload.raw_message, top_k=2, use_neural=False)
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


@router.post("/rag-catalog")
def rag_catalog_endpoint(payload: RAGQueryPayload):
    return query_rag_catalog(payload.query, payload.top_k)


@router.get("/dataset-overview")
def get_dataset_and_model_overview(sample_limit: int = 15):
    """
    Menampilkan ringkasan dan sampel seluruh dataset (3.675 baris/dokumen)
    beserta metrik evaluasi model (Precision, Recall, F1-Score) dan dimensi SVM.
    """
    return get_dataset_overview(sample_limit=sample_limit)

