import os
import re
import time
from typing import Any, Dict, Optional, Tuple

import instructor
from instructor.core import InstructorRetryException
from openai import APIConnectionError, APIStatusError, APITimeoutError, OpenAI
from pydantic import ValidationError

from src.observability import (
    estimate_llm_cost,
    observe_span,
    telemetry_store,
    update_langfuse_observation,
)
from src.schemas import (
    GreetingCardSchema,
    OrderCategory,
    OrderItemSchema,
    StructuredOrderSummary,
)
from src.system1_decision import System1DecisionModel

DEFAULT_LLM_BASE_URL = os.getenv("LLM_BASE_URL", os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/") + "/v1")
if not DEFAULT_LLM_BASE_URL.rstrip("/").endswith("/v1"):
    DEFAULT_LLM_BASE_URL = DEFAULT_LLM_BASE_URL.rstrip("/") + "/v1"

DEFAULT_LLM_API_KEY = os.getenv("LLM_API_KEY", "ollama")
DEFAULT_LLM_MODEL = os.getenv("LLM_MODEL", os.getenv("OLLAMA_MODEL", "llama3.2:3b"))

SYSTEM_PROMPT = """Anda adalah AI Order Extractor resmi Toko Firaza (custom bordir sajadah, handuk, dan hampers).
Tugas Anda mengekstrak chat pelanggan Indonesia (termasuk singkatan wrn=warna, uk=ukuran, bdr=bordir, sjdh=sajadah, hndk=handuk) dan menentukan kategori pesanan ke dalam JSON valid sesuai kontrak skema Pydantic.

Aturan ketat:
1. Tentukan `order_category` yang paling akurat: 'Hampers', 'Custom Sajadah', 'Custom Handuk', 'Ready Stock', atau 'Other'.
2. Jika `order_category` adalah 'Hampers', set `greeting_card.is_requested = true` dan buatkan `draft_message` kartu ucapan yang hangat dalam bahasa Indonesia.
3. Jangan mengarang data pelanggan (nama/telepon) jika tidak tertulis di chat; isi null.
4. Pastikan `quantity` berupa integer >= 1. Jika tidak disebutkan, gunakan 1.
5. Kembalikan hanya JSON sesuai skema tanpa teks tambahan."""


class StructuredContractError(RuntimeError):
    """Dilemparkan ketika output LLM gagal memenuhi kontrak Pydantic setelah batas retry Instructor."""


class LLMServiceUnavailableError(RuntimeError):
    """Dilemparkan ketika server LLM (vLLM via Ngrok / Ollama lokal) tidak dapat dijangkau."""


_TRANSPORT_ERROR_TYPES = (
    APIConnectionError,
    APITimeoutError,
    APIStatusError,
    TimeoutError,
    ConnectionError,
)


def _is_transport_error(exc: BaseException) -> bool:
    """Memeriksa apakah exception (atau penyebab di dalam InstructorRetryException) merupakan gangguan jaringan/timeout."""
    candidates = [exc, exc.__cause__, exc.__context__]
    for attempt in getattr(exc, "failed_attempts", None) or []:
        attempt_exc = getattr(attempt, "exception", None)
        if attempt_exc is not None:
            candidates.append(attempt_exc)

    for candidate in candidates:
        if candidate is None:
            continue
        if isinstance(candidate, _TRANSPORT_ERROR_TYPES):
            return True
        msg = str(candidate).lower()
        if "timed out" in msg or "connection error" in msg:
            return True
    return False


def generate_greeting_card_template(
    occasion: Optional[str],
    recipient: Optional[str],
    sender: Optional[str],
) -> str:
    """Generator template kartu ucapan bahasa Indonesia yang hangat & rapi."""
    rec_str = recipient or "Sahabat/Keluarga Terkasih"
    snd_str = f"Salam hangat dari {sender}." if sender else "Salam hangat dari kami."
    occ = (occasion or "spesial").lower()

    if "nikah" in occ or "wedding" in occ:
        return (
            f"Selamat menempuh hidup baru untuk {rec_str}. "
            f"Semoga cinta dan kasih sayang selalu menyertai langkah kalian menuju keluarga yang sakinah, mawaddah, warahmah. {snd_str}"
        )
    if "lebaran" in occ or "idul fitri" in occ:
        return (
            f"Selamat Hari Raya Idul Fitri untuk {rec_str}. "
            f"Taqabbalallahu minna wa minkum, mohon maaf lahir dan batin. Semoga keberkahan dan kebahagiaan senantiasa menyertai. {snd_str}"
        )
    if "ulang tahun" in occ or "ultah" in occ:
        return (
            f"Selamat Ulang Tahun untuk {rec_str}! "
            f"Semoga panjang umur, sehat selalu, dan segala impian terbaik segera tercapai. {snd_str}"
        )
    if "haji" in occ or "umroh" in occ:
        return (
            f"Selamat atas kepulangan ibadah Haji/Umroh untuk {rec_str}. "
            f"Semoga menjadi ibadah yang mabrur dan membawa keberkahan bagi seluruh keluarga. {snd_str}"
        )
    return (
        f"Bingkisan spesial untuk {rec_str} di momen {occasion or 'istimewa'} ini. "
        f"Semoga bermanfaat dan selalu membawa kebahagiaan serta keberkahan. {snd_str}"
    )


def _infer_category_heuristic(msg_lower: str) -> OrderCategory:
    """Heuristik kategori cepat khusus untuk mode offline saat server LLM tidak aktif."""
    if any(k in msg_lower for k in ["hamper", "hampers", "hmpers", "kado", "souvenir", "gift", "seserahan"]):
        return "Hampers"
    if any(k in msg_lower for k in ["polos", "ready", "rdy", "tanpa bordir", "ga usah bordir", "tidak usah bordir"]):
        return "Ready Stock"
    if any(k in msg_lower for k in ["handuk", "hndk", "handk", "anduk"]):
        return "Custom Handuk"
    if any(k in msg_lower for k in ["sajadah", "sjdh", "sajdah", "sejadah"]):
        return "Custom Sajadah"
    return "Other"


def regex_fallback_extractor(
    raw_message: str,
    generate_card: bool = True,
) -> StructuredOrderSummary:
    """
    Fallback deterministik HANYA ketika server LLM tidak dapat dihubungi (offline/timeout),
    bukan untuk menerima output LLM yang melanggar kontrak Pydantic.
    """
    msg_lower = raw_message.lower()
    inferred_category = _infer_category_heuristic(msg_lower)

    qty_match = re.search(
        r"(\d+)\s*(?:pcs|biji|buah|paket|box|set|lembar)\b|(?:jumlah|qty|sebanyak)\s*[:=-]?\s*(\d+)",
        msg_lower,
    )
    qty = int(qty_match.group(1) or qty_match.group(2)) if qty_match else 1

    known_colors = [
        "hijau emerald", "putih tulang", "coklat susu", "dusty pink", "sage green",
        "biru muda", "ungu lilac", "terracotta", "burgundy", "olive", "mocca",
        "navy", "maroon", "hitam", "cream", "abu-abu", "gold", "tosca", "biru", "merah", "hijau", "putih",
    ]
    detected_color = next((c.title() for c in known_colors if c in msg_lower), None)

    known_sizes = ["70x140", "50x100", "30x70", "70x110", "dewasa", "travel", "anak", "bayi", "jumbo", "reguler"]
    detected_size = None
    for s in known_sizes:
        if s in msg_lower:
            detected_size = s.title() if not any(ch.isdigit() for ch in s) else s
            break

    custom_text = None
    quote_match = re.search(r"['\"]([^'\"]{2,40})['\"]", raw_message)
    if quote_match:
        custom_text = quote_match.group(1).strip()
    else:
        name_match = re.search(r"(?:nama|tulisan)\s*[:=-]?\s*([A-Z][A-Za-z0-9\s.&]{1,25})", raw_message)
        if name_match:
            custom_text = name_match.group(1).strip()

    known_fonts = [
        "kaligrafi arab", "huruf balok", "serif klasik", "latin tegak",
        "sambung", "script", "kapital", "monoline", "elegan", "arab",
    ]
    detected_font = next((f_name.title() for f_name in known_fonts if f_name in msg_lower), None)

    known_layouts = [
        "pojok kanan bawah", "pojok kiri bawah", "tengah atas", "bawah tengah",
        "tengah bawah", "kubah sajadah", "list bawah handuk", "tengah",
    ]
    detected_layout = next((l_name.capitalize() for l_name in known_layouts if l_name in msg_lower), None)

    customer_name = None
    cust_match = re.search(
        r"(?:atas nama|saya|aku|dari|pemesan\s*[:=-]?)\s+([a-zA-Z][a-zA-Z\s]{1,25}?)(?=\s+(?:mau|pesen|pesan|order|beli|butuh|minta|buat|untuk)|[\.,\n]|$)",
        raw_message,
        re.IGNORECASE,
    )
    if cust_match:
        customer_name = cust_match.group(1).strip().title()
    elif custom_text and "&" not in custom_text:
        customer_name = custom_text

    product_type_map = {
        "Hampers": "Hampers Custom Firaza",
        "Custom Sajadah": "Sajadah Custom",
        "Custom Handuk": "Handuk Bordir Custom",
        "Ready Stock": "Produk Ready Stock",
        "Other": "Item Custom",
    }
    product_type = product_type_map[inferred_category]

    card_keywords = ["kartu ucapan", "greeting card", "ucapan", "kartu", "selamat"]
    card_requested = any(kw in msg_lower for kw in card_keywords) or (inferred_category == "Hampers")

    occasion = None
    if "nikah" in msg_lower or "wedding" in msg_lower:
        occasion = "Pernikahan"
    elif "lebaran" in msg_lower or "idul fitri" in msg_lower:
        occasion = "Idul Fitri"
    elif "ulang tahun" in msg_lower or "ultah" in msg_lower or "birthday" in msg_lower:
        occasion = "Ulang Tahun"
    elif "haji" in msg_lower or "umroh" in msg_lower:
        occasion = "Ibadah Haji/Umroh"
    elif card_requested:
        occasion = "Spesial"

    draft_msg = None
    if card_requested and generate_card:
        draft_msg = generate_greeting_card_template(
            occasion=occasion,
            recipient=custom_text,
            sender=customer_name,
        )

    items = []
    if inferred_category != "Other":
        items.append(
            OrderItemSchema(
                product_type=product_type,
                quantity=max(1, qty),
                color=detected_color,
                size=detected_size,
                custom_text=custom_text if inferred_category != "Ready Stock" else None,
                font_style=detected_font if inferred_category != "Ready Stock" else None,
                layout_notes=detected_layout,
            )
        )

    return StructuredOrderSummary(
        order_category=inferred_category,
        category_confidence=0.82,
        customer_name=customer_name,
        customer_phone=None,
        order_status="New",
        items=items,
        greeting_card=GreetingCardSchema(
            is_requested=card_requested,
            occasion=occasion,
            sender_name=customer_name if card_requested else None,
            recipient_name=custom_text if card_requested else None,
            draft_message=draft_msg,
        ),
        additional_notes=None,
    )


class LocalLLMOrderExtractor:
    """
    Ekstraktor Generative AI berbasis `Instructor` + `Pydantic` yang terhubung langsung
    ke endpoint OpenAI-compatible (vLLM di Google Colab via Ngrok tanpa 9router,
    atau Ollama lokal sebagai cadangan).
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        max_retries: Optional[int] = None,
        timeout_seconds: int = 45,
        client: Optional[Any] = None,
    ):
        raw_url = (base_url or os.getenv("LLM_BASE_URL") or DEFAULT_LLM_BASE_URL).rstrip("/")
        if not raw_url.endswith("/v1"):
            raw_url = f"{raw_url}/v1"
        self.base_url = raw_url
        self.ollama_url = self.base_url[:-3] if self.base_url.endswith("/v1") else self.base_url
        self.api_key = api_key or os.getenv("LLM_API_KEY", DEFAULT_LLM_API_KEY)
        self.model_name = model_name or os.getenv("LLM_MODEL", DEFAULT_LLM_MODEL)
        self.max_retries = max_retries if max_retries is not None else int(os.getenv("INSTRUCTOR_MAX_RETRIES", "2"))
        self.timeout_seconds = timeout_seconds
        self.system1 = System1DecisionModel()

        if client is not None:
            self.instructor_client = client
        else:
            openai_client = OpenAI(
                base_url=self.base_url,
                api_key=self.api_key,
                timeout=float(os.getenv("LLM_TIMEOUT_SECONDS", str(self.timeout_seconds))),
                max_retries=0,
                default_headers={"ngrok-skip-browser-warning": "true"},
            )
            mode_name = os.getenv("INSTRUCTOR_MODE", "json").lower()
            mode = instructor.Mode.TOOLS if mode_name == "tools" else instructor.Mode.JSON
            self.instructor_client = instructor.from_openai(openai_client, mode=mode)

    @observe_span(name="extract-order-instructor", as_type="generation")
    def extract(
        self,
        raw_message: str,
        generate_greeting_card: bool = True,
        rag_context: Optional[str] = None,
        allow_offline_fallback: Optional[bool] = None,
    ) -> Tuple[StructuredOrderSummary, Dict[str, Any]]:
        """
        Mengekstrak pesan pelanggan menjadi `StructuredOrderSummary` (termasuk `order_category`).
        Mengembalikan tuple `(StructuredOrderSummary, telemetry_meta)`.
        """
        t_start = time.perf_counter()
        if allow_offline_fallback is None:
            allow_offline_fallback = os.getenv("ALLOW_OFFLINE_FALLBACK", "true").lower() == "true"

        # Tahap 1: System 1 Decision Model (< 2ms fast triage)
        s1_decision = self.system1.evaluate(raw_message)
        if not s1_decision["route_to_llm"]:
            elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
            summary = StructuredOrderSummary(
                order_category="Other",
                category_confidence=float(s1_decision["confidence"]),
                customer_name=None,
                order_status="New",
                items=[],
                greeting_card=GreetingCardSchema(is_requested=False),
                additional_notes=s1_decision["reason"],
            )
            cost_info = estimate_llm_cost(0, 0)
            meta = {
                **cost_info,
                "latency_ms": elapsed_ms,
                "used_fallback": False,
                "system1_short_circuit": True,
                "instructor_validated": True,
                "llm_endpoint": self.base_url,
            }
            telemetry_store.record({**meta, "validation_passed": True})
            update_langfuse_observation(output=summary.model_dump(), metadata=meta)
            return summary, meta

        # Tahap 2: System 2 (GenAI via Instructor + Pydantic Contract)
        sys_prompt = SYSTEM_PROMPT
        if rag_context:
            sys_prompt += f"\n\nReferensi Katalog & SOP Toko Firaza:\n{rag_context}"

        messages = [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": raw_message},
        ]

        try:
            if hasattr(self.instructor_client.chat.completions, "create_with_completion"):
                validated, completion = self.instructor_client.chat.completions.create_with_completion(
                    model=self.model_name,
                    messages=messages,
                    response_model=StructuredOrderSummary,
                    max_retries=self.max_retries,
                    temperature=0.0,
                )
            else:
                validated = self.instructor_client.chat.completions.create(
                    model=self.model_name,
                    messages=messages,
                    response_model=StructuredOrderSummary,
                    max_retries=self.max_retries,
                    temperature=0.0,
                )
                completion = None

            if not validated.customer_name:
                cname_match = re.search(
                    r"(?:atas nama|saya|aku|dari|pemesan\s*[:=-]?)\s+([a-zA-Z][a-zA-Z\s]{1,20}?)(?=\s+(?:mau|pesen|pesan|order|beli|butuh|minta|buat|untuk)|[\.,\n]|$)",
                    raw_message,
                    re.IGNORECASE,
                )
                if cname_match:
                    validated.customer_name = cname_match.group(1).strip().title()

            if (
                generate_greeting_card
                and validated.greeting_card.is_requested
                and not validated.greeting_card.draft_message
            ):
                validated.greeting_card.draft_message = generate_greeting_card_template(
                    occasion=validated.greeting_card.occasion,
                    recipient=validated.greeting_card.recipient_name,
                    sender=validated.greeting_card.sender_name or validated.customer_name,
                )

            usage = getattr(completion, "usage", None)
            prompt_tokens = int(getattr(usage, "prompt_tokens", 0) or 0)
            completion_tokens = int(getattr(usage, "completion_tokens", 0) or 0)
            elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
            cost_info = estimate_llm_cost(prompt_tokens, completion_tokens)
            meta = {
                **cost_info,
                "latency_ms": elapsed_ms,
                "used_fallback": False,
                "system1_short_circuit": False,
                "instructor_validated": True,
                "llm_endpoint": self.base_url,
            }
            telemetry_store.record({**meta, "validation_passed": True})
            update_langfuse_observation(
                output=validated.model_dump(),
                model=self.model_name,
                prompt_tokens=prompt_tokens,
                completion_tokens=completion_tokens,
                metadata=meta,
            )
            return validated, meta

        except (
            InstructorRetryException,
            ValidationError,
            APIConnectionError,
            APITimeoutError,
            APIStatusError,
        ) as exc:
            elapsed_ms = round((time.perf_counter() - t_start) * 1000.0, 2)
            if not _is_transport_error(exc):
                telemetry_store.record({
                    "latency_ms": elapsed_ms,
                    "total_tokens": 0,
                    "estimated_cost_idr": 0.0,
                    "validation_passed": False,
                    "system1_short_circuit": False,
                })
                update_langfuse_observation(
                    level="ERROR",
                    status_message=f"Pydantic contract validation failed: {exc}",
                    model=self.model_name,
                )
                raise StructuredContractError(
                    f"Output LLM tidak memenuhi kontrak Pydantic StructuredOrderSummary setelah {self.max_retries}x retry: {exc}"
                ) from exc

            if not allow_offline_fallback:
                update_langfuse_observation(
                    level="ERROR",
                    status_message=f"LLM server unreachable: {exc}",
                    model=self.model_name,
                )
                raise LLMServiceUnavailableError(
                    f"Server LLM di {self.base_url} tidak dapat dijangkau: {exc}"
                ) from exc

            fallback_result = regex_fallback_extractor(
                raw_message=raw_message,
                generate_card=generate_greeting_card,
            )
            cost_info = estimate_llm_cost(0, 0)
            meta = {
                **cost_info,
                "latency_ms": elapsed_ms,
                "used_fallback": True,
                "fallback_reason": "llm_unreachable",
                "system1_short_circuit": False,
                "instructor_validated": True,
                "llm_endpoint": self.base_url,
            }
            telemetry_store.record({**meta, "validation_passed": True})
            update_langfuse_observation(
                output=fallback_result.model_dump(),
                metadata=meta,
                level="WARNING",
                status_message="LLM unreachable, used offline deterministic fallback",
            )
            return fallback_result, meta
