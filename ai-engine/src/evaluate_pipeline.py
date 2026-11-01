import json
from pathlib import Path

from src.llm_extractor import LocalLLMOrderExtractor
from src.rag_engine import LocalOpenSourceRAGEngine
from src.schemas import AnalyzeOrderResponse
from src.train_classifier import OrderClassifier


def evaluate_end_to_end():
    base_dir = Path(__file__).resolve().parent.parent
    test_set_path = base_dir / "data" / "extraction_test_set.json"

    if not test_set_path.exists():
        from src.generate_dataset import main as gen_main
        gen_main()

    clf = OrderClassifier().load()
    ext = LocalLLMOrderExtractor()
    rag = LocalOpenSourceRAGEngine().build_or_load_index(force_rebuild=True)

    with open(test_set_path, "r", encoding="utf-8") as f:
        test_cases = json.load(f)

    correct_category = 0
    valid_json_schema = 0
    matched_qty = 0
    matched_color = 0
    matched_custom_text = 0

    sample_outputs = []

    for idx, case in enumerate(test_cases):
        raw_msg = case["raw_message"]
        exp_cat = case["expected_category"]
        exp_ext = case["expected_extraction"]

        pred = clf.predict(raw_msg)
        if pred.category == exp_cat:
            correct_category += 1

        extracted, used_fallback = ext.extract(
            raw_message=raw_msg,
            predicted_category=pred.category,
            generate_greeting_card=True,
        )

        # Validasi bahwa keseluruhan response memenuhi API Contract
        full_response = AnalyzeOrderResponse(
            status="success",
            prediction=pred,
            extraction=extracted,
            meta={
                "classifier_model": "tfidf-svm-calibrated-v1",
                "llm_model": ext.model_name,
                "used_fallback": used_fallback,
            },
        )
        valid_json_schema += 1

        exp_items = exp_ext.get("items", [])
        got_items = extracted.items

        if not exp_items and not got_items:
            matched_qty += 1
            matched_color += 1
            matched_custom_text += 1
        elif exp_items and got_items:
            e_item = exp_items[0]
            g_item = got_items[0]
            if g_item.quantity == e_item.get("quantity"):
                matched_qty += 1
            if (g_item.color or "").lower() == (e_item.get("color") or "").lower():
                matched_color += 1
            if (g_item.custom_text or "").lower() == (e_item.get("custom_text") or "").lower():
                matched_custom_text += 1

        if idx < 3:
            sample_outputs.append({
                "id": case["id"],
                "raw_message": raw_msg,
                "response": json.loads(full_response.model_dump_json()),
            })

    total = len(test_cases)
    print(f"\n=== HASIL EVALUASI END-TO-END PIPELINE ({total} KASUS UJI) ===")
    print(f"1. Validitas Skema JSON (Pydantic) : {valid_json_schema}/{total} ({valid_json_schema / total * 100:.1f}%)")
    print(f"2. Akurasi Kategori Pesanan        : {correct_category}/{total} ({correct_category / total * 100:.1f}%)")
    print(f"3. Akurasi Ekstraksi Jumlah (Qty)  : {matched_qty}/{total} ({matched_qty / total * 100:.1f}%)")
    print(f"4. Akurasi Ekstraksi Warna         : {matched_color}/{total} ({matched_color / total * 100:.1f}%)")
    print(f"5. Akurasi Ekstraksi Nama Custom   : {matched_custom_text}/{total} ({matched_custom_text / total * 100:.1f}%)")

    sample_out_path = base_dir / "models" / "sample_api_outputs.json"
    with open(sample_out_path, "w", encoding="utf-8") as f:
        json.dump(sample_outputs, f, indent=2, ensure_ascii=False)
    print(f"\n[OK] Contoh output JSON untuk Mock Data Frontend disimpan di: {sample_out_path}")

    rag_test = rag.generate_rag_answer("Ukuran handuk custom dewasa berapa cm dan pilihan warnanya apa aja?")
    print("\n=== HASIL UJI SISTEM RAG LOKAL (TANPA API PROPRIETARY) ===")
    print(f"Vector DB Backend : {rag_test['meta']['vector_db_backend']}")
    print(f"Dokumen Terambil  : {[d['doc_id'] for d in rag_test['retrieved_documents']]}")
    print(f"Jawaban RAG       : {rag_test['answer']}")


if __name__ == "__main__":
    evaluate_end_to_end()
