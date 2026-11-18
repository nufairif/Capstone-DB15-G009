import os
import sys
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import MagicMock

import httpx
import pytest
from fastapi.testclient import TestClient
from instructor.core import InstructorRetryException
from openai import APIConnectionError, APITimeoutError

ROOT_DIR = Path(__file__).resolve().parents[2]
AI_ENGINE_DIR = ROOT_DIR / "ai-engine"
BACKEND_DIR = ROOT_DIR / "backend"

for p in (str(AI_ENGINE_DIR), str(BACKEND_DIR)):
    if p not in sys.path:
        sys.path.insert(0, p)

from src.llm_extractor import (  # noqa: E402
    LLMServiceUnavailableError,
    LocalLLMOrderExtractor,
    StructuredContractError,
)
from src.rag_engine import LocalOpenSourceRAGEngine  # noqa: E402
from src.schemas import GreetingCardSchema, OrderItemSchema, StructuredOrderSummary  # noqa: E402
from src.system1_decision import OrderAggregationService, System1DecisionModel  # noqa: E402


def test_system1_decision_triage():
    s1 = System1DecisionModel()

    non_order = s1.evaluate("Alamat toko dimana ya kak dan cara cuci sajadah gimana?")
    assert non_order["route_to_llm"] is False
    assert non_order["category"] == "Other"

    real_order = s1.evaluate("Halo kak mau pesen hampers lebaran 2 paket wrn navy bdr nama 'Keluarga Budi'")
    assert real_order["route_to_llm"] is True
    assert "warna" in real_order["normalized_text"]
    assert "bordir" in real_order["normalized_text"]


def test_sklearn_aggregation_service():
    agg = OrderAggregationService()
    records = [
        {"text": "pesen sjdh custom wrn navy 2 pcs", "category": "Custom Sajadah"},
        {"text": "pesen hndk custom wrn maroon 3 pcs", "category": "Custom Handuk"},
        {"text": "pesen hampers lebaran wrn navy", "category": "Hampers"},
    ]
    summary = agg.aggregate_records(records)
    assert summary["total_records"] == 3
    assert summary["category_distribution"]["Custom Sajadah"] == 1
    assert summary["vocabulary_size"] > 0
    assert any(item["term"] == "navy" for item in summary["top_keywords"])


def test_instructor_extractor_valid_contract():
    expected = StructuredOrderSummary(
        order_category="Hampers",
        category_confidence=0.97,
        customer_name="Rina",
        order_status="New",
        items=[
            OrderItemSchema(
                product_type="Hampers Handuk Custom",
                quantity=2,
                color="Navy",
                size="Dewasa",
                custom_text="Nabila",
                font_style="Sambung",
                layout_notes="Tengah",
            )
        ],
        greeting_card=GreetingCardSchema(
            is_requested=True,
            occasion="Pernikahan",
            sender_name="Rina",
            recipient_name="Nabila",
            draft_message=None,
        ),
    )
    fake_completion = SimpleNamespace(
        usage=SimpleNamespace(prompt_tokens=420, completion_tokens=110)
    )
    mock_client = MagicMock()
    mock_client.chat.completions.create_with_completion.return_value = (expected, fake_completion)

    extractor = LocalLLMOrderExtractor(client=mock_client, model_name="Qwen/Qwen2.5-3B-Instruct")
    result, meta = extractor.extract(
        "Halo saya Rina mau pesen hampers pernikahan 2 paket wrn navy uk dewasa bdr nama 'Nabila'",
        generate_greeting_card=True,
    )

    assert result.order_category == "Hampers"
    assert result.items[0].quantity == 2
    assert result.greeting_card.draft_message is not None
    assert meta["instructor_validated"] is True
    assert meta["total_tokens"] == 530
    assert meta["used_fallback"] is False


def test_instructor_extractor_rejects_invalid_contract():
    mock_client = MagicMock()
    mock_client.chat.completions.create_with_completion.side_effect = InstructorRetryException(
        "Invalid JSON schema",
        last_completion=None,
        n_attempts=2,
        total_usage=0,
        messages=[],
    )

    extractor = LocalLLMOrderExtractor(client=mock_client, max_retries=2)
    with pytest.raises(StructuredContractError):
        extractor.extract(
            "Pesen sajadah custom 2 pcs warna navy",
            allow_offline_fallback=True,
        )


def test_instructor_extractor_unreachable_strict_mode():
    mock_client = MagicMock()
    req = httpx.Request("POST", "https://example.ngrok-free.app/v1/chat/completions")
    mock_client.chat.completions.create_with_completion.side_effect = APIConnectionError(request=req)

    extractor = LocalLLMOrderExtractor(client=mock_client)
    with pytest.raises(LLMServiceUnavailableError):
        extractor.extract(
            "Pesen handuk custom 3 pcs warna maroon",
            allow_offline_fallback=False,
        )


def test_instructor_wrapped_timeout_routes_to_unreachable_or_fallback():
    req = httpx.Request("POST", "https://example.ngrok-free.app/v1/chat/completions")
    timeout_err = APITimeoutError(request=req)
    wrapped = InstructorRetryException(
        "Request timed out.",
        last_completion=None,
        n_attempts=1,
        total_usage=0,
        messages=[],
    )
    wrapped.__cause__ = timeout_err

    mock_client = MagicMock()
    mock_client.chat.completions.create_with_completion.side_effect = wrapped

    extractor = LocalLLMOrderExtractor(client=mock_client)
    with pytest.raises(LLMServiceUnavailableError):
        extractor.extract(
            "Pesen handuk custom 3 pcs warna maroon",
            allow_offline_fallback=False,
        )

    summary, meta = extractor.extract(
        "Pesen handuk custom 3 pcs warna maroon",
        allow_offline_fallback=True,
    )
    assert summary.order_category == "Custom Handuk"
    assert meta["used_fallback"] is True
    assert meta["fallback_reason"] == "llm_unreachable"


def test_rag_llamaindex_chromadb(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_USE_HASHING_EMBEDDING", "true")
    rag = LocalOpenSourceRAGEngine(chroma_dir=tmp_path / "chroma_test")
    rag.build_or_load_index(force_rebuild=True)

    assert len(rag.documents) == 75
    assert rag.vector_backend == "llamaindex-chromadb"

    docs = rag.retrieve("ukuran handuk custom dewasa", top_k=3, category_filter="Custom Handuk")
    assert len(docs) >= 1
    assert all(d["category"] == "Custom Handuk" for d in docs)

    blocked = rag.generate_rag_answer("resep nasi goreng kampung pedas enak")
    assert blocked["meta"]["vector_db_backend"] == "llamaindex-chromadb"
    assert blocked["meta"]["guardrail_blocked"] is True
    assert isinstance(blocked["answer"], str)


def test_backend_fastapi_integration(tmp_path, monkeypatch):
    monkeypatch.setenv("RAG_USE_HASHING_EMBEDDING", "true")
    monkeypatch.setenv("CHROMA_PERSIST_DIR", str(tmp_path / "chroma_api"))

    import app as backend_app
    from services import ai_service

    ai_service.rag_engine = LocalOpenSourceRAGEngine(chroma_dir=tmp_path / "chroma_api")
    ai_service.rag_engine.build_or_load_index(force_rebuild=True)

    with TestClient(backend_app.app) as client:
        health = client.get("/health")
        assert health.status_code == 200
        h_data = health.json()
        assert h_data["separate_5class_classifier"] is False
        assert h_data["rag_vector_db"] == "llamaindex-chromadb"
        assert h_data["structured_output_engine"] == "instructor-pydantic"

        # Uji kontrak invalid -> harus mengembalikan HTTP 422
        bad_mock = MagicMock()
        bad_mock.chat.completions.create_with_completion.side_effect = InstructorRetryException(
            "Schema mismatch",
            last_completion=None,
            n_attempts=2,
            total_usage=0,
            messages=[],
        )
        orig_client = ai_service.extractor.instructor_client
        ai_service.extractor.instructor_client = bad_mock
        try:
            r_err = client.post(
                "/api/v1/ai/analyze-order",
                json={"raw_message": "Pesen sajadah custom 2 pcs warna navy", "generate_greeting_card": True},
            )
            assert r_err.status_code == 422
        finally:
            ai_service.extractor.instructor_client = orig_client

        # Uji dataset overview & telemetry
        ov = client.get("/api/v1/ai/dataset-overview")
        assert ov.status_code == 200
        ov_data = ov.json()
        assert ov_data["architecture_info"]["separate_5class_classifier"] is False
        assert "sklearn_aggregation" in ov_data

        tel = client.get("/api/v1/ai/telemetry")
        assert tel.status_code == 200
