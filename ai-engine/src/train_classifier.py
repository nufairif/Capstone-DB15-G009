"""
DEPRECATED: Sesuai arahan Advisor, model klasifikasi 5 kategori terpisah
(`Ready Stock`, `Custom Sajadah`, `Custom Handuk`, `Hampers`, `Other`)
TIDAK dikembangkan atau digunakan lagi di runtime.

Penentuan kategori pesanan kini disatukan langsung ke dalam skema Pydantic
`StructuredOrderSummary` (via GenAI + Instructor) serta disaring cepat oleh
`System1DecisionModel` dan fungsi agregasi Scikit-Learn di `src/system1_decision.py`.
"""

from src.system1_decision import SLANG_MAP, preprocess_text

__all__ = ["SLANG_MAP", "preprocess_text"]
