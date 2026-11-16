from fastapi import APIRouter
from services.ai_service import (
    check_llm_running,
    extractor,
    is_langfuse_configured,
    rag_engine,
)

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check():
    llm_alive = check_llm_running()
    return {
        "status": "ok",
        "team_id": "DB15-G009",
        "separate_5class_classifier": False,
        "system1_decision_active": True,
        "structured_output_engine": "instructor-pydantic",
        "rag_vector_db": rag_engine.vector_backend,
        "langfuse_enabled": is_langfuse_configured(),
        "llm_endpoint": extractor.base_url,
        "llm_running": llm_alive,
        "llm_model": extractor.model_name,
        "proprietary_api_used": False,
    }
