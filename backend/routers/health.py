from fastapi import APIRouter
from services.ai_service import classifier, rag_engine, extractor, check_ollama_running

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    ollama_alive = check_ollama_running()
    return {
        "status": "ok",
        "team_id": "DB15-G009",
        "predictive_ai_local": classifier.pipeline is not None,
        "rag_vector_db_local": rag_engine.vector_backend,
        "ollama_llm_running": ollama_alive,
        "llm_model": extractor.model_name,
        "proprietary_api_used": False,
    }

