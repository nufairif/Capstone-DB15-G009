import json
import os
import re
import urllib.error
import urllib.request
from typing import Optional, Tuple

from pydantic import ValidationError

from src.schemas import (
    GreetingCardSchema,
    OrderCategory,
    OrderItemSchema,
    StructuredOrderSummary,
)

# Default menggunakan model terkuantisasi 4-bit (GGUF via Ollama) sesuai Project Plan
DEFAULT_OLLAMA_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_LLM_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:3b")

SYSTEM_PROMPT = """Anda adalah AI Order Extractor resmi Toko Firaza.
Tugas Anda mengekstrak chat pelanggan (termasuk singkatan wrn, uk, pcs, bdr, sjdh, hndk) menjadi JSON valid sesuai skema ini:
{
  "customer_name": "string atau null",
  "customer_phone": "string atau null",
  "order_status": "New",
  "items": [
    {
      "product_type": "string",
      "quantity": 1,
      "color": "string atau null",
      "size": "string atau null",
      "custom_text": "string atau null",
      "font_style": "string atau null",
      "layout_notes": "string atau null"
    }
  ],
  "greeting_card": {
    "is_requested": true/false,
    "occasion": "string atau null",
    "sender_name": "string atau null",
    "recipient_name": "string atau null",
    "draft_message": "string atau null"
  },
  "additional_notes": "string atau null"
}
Hanya balas dengan JSON valid tanpa penjelasan atau markdown."""

FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Halo, saya Rina mau pesen hampers pernikahan 2 paket wrn navy uk dewasa bdr nama 'Nabila' font sambung. Sekalian kartu ucapan selamat menikah ya.",
    },
    {
        "role": "assistant",
        "content": json.dumps(
            {
                "customer_name": "Rina",
                "customer_phone": None,
                "order_status": "New",
                "items": [
                    {
                        "product_type": "Hampers Handuk Custom",
                        "quantity": 2,
                        "color": "Navy",
                        "size": "Dewasa",
                        "custom_text": "Nabila",
                        "font_style": "Sambung",
                        "layout_notes": "Tengah",
                    }
                ],
                "greeting_card": {
                    "is_requested": True,
                    "occasion": "Pernikahan",
                    "sender_name": "Rina",
                    "recipient_name": "Nabila",
                    "draft_message": "Selamat menempuh hidup baru untuk Nabila. Semoga menjadi keluarga sakinah mawaddah warahmah.",
                },
                "additional_notes": "Hampers pernikahan 2 paket",
            },
            ensure_ascii=False,
        ),
    },
]


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


def regex_fallback_extractor(
    raw_message: str,
    predicted_category: OrderCategory,
    generate_card: bool = True,
) -> StructuredOrderSummary:
    """
    Deterministic rule-based extractor sebagai fallback yang andal
    jika model LLM lokal sedang sibuk atau timeout.
    """
    msg_lower = raw_message.lower()

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
    detected_color = None
    for c in known_colors:
        if c in msg_lower:
            detected_color = c.title()
            break

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
    detected_font = None
    for f_name in known_fonts:
        if f_name in msg_lower:
            detected_font = f_name.title()
            break

    known_layouts = [
        "pojok kanan bawah", "pojok kiri bawah", "tengah atas", "bawah tengah",
        "tengah bawah", "kubah sajadah", "list bawah handuk", "tengah",
    ]
    detected_layout = None
    for l_name in known_layouts:
        if l_name in msg_lower:
            detected_layout = l_name.capitalize()
            break

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

    if predicted_category == "Hampers":
        product_type = "Hampers Custom Firaza"
    elif predicted_category == "Custom Sajadah":
        product_type = "Sajadah Custom"
    elif predicted_category == "Custom Handuk":
        product_type = "Handuk Bordir Custom"
    elif predicted_category == "Ready Stock":
        product_type = "Produk Ready Stock"
    else:
        product_type = "Item Custom"

    card_keywords = ["kartu ucapan", "greeting card", "ucapan", "kartu", "selamat"]
    card_requested = any(kw in msg_lower for kw in card_keywords) or (predicted_category == "Hampers")

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

    return StructuredOrderSummary(
        customer_name=customer_name,
        customer_phone=None,
        order_status="New",
        items=[
            OrderItemSchema(
                product_type=product_type,
                quantity=max(1, qty),
                color=detected_color,
                size=detected_size,
                custom_text=custom_text if predicted_category != "Ready Stock" else None,
                font_style=detected_font if predicted_category != "Ready Stock" else None,
                layout_notes=detected_layout,
            )
        ],
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
    Ekstraktor Generative AI yang memanggil Open-Source LLM lokal (Ollama GGUF 4-bit)
    dengan Strict Few-Shot Prompting, validasi Pydantic, dan Retry/Fallback otomatis.
    """

    def __init__(
        self,
        ollama_url: str = DEFAULT_OLLAMA_URL,
        model_name: str = DEFAULT_LLM_MODEL,
        max_retries: int = 1,
        timeout_seconds: int = 45,
    ):
        self.ollama_url = ollama_url.rstrip("/")
        self.model_name = model_name
        self.max_retries = max_retries
        self.timeout_seconds = timeout_seconds

    def _call_ollama_chat(self, raw_message: str, rag_context: Optional[str] = None) -> str:
        """Memanggil endpoint /api/chat milik Ollama lokal dengan mode format JSON ringkas & cepat."""
        sys_prompt = SYSTEM_PROMPT
        if rag_context:
            sys_prompt += f"\n\nReferensi Standar Produk Toko Firaza:\n{rag_context}"

        messages = [{"role": "system", "content": sys_prompt}]
        messages.extend(FEW_SHOT_EXAMPLES)
        messages.append({"role": "user", "content": raw_message})

        payload = {
            "model": self.model_name,
            "messages": messages,
            "format": "json",
            "stream": False,
            "options": {
                "temperature": 0.0,
                "num_predict": 220,
                "num_ctx": 1024,
            },
        }

        req = urllib.request.Request(
            url=f"{self.ollama_url}/api/chat",
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout_seconds) as resp:
            body = json.loads(resp.read().decode("utf-8"))
            return body["message"]["content"]

    def extract(
        self,
        raw_message: str,
        predicted_category: OrderCategory,
        generate_greeting_card: bool = True,
        rag_context: Optional[str] = None,
    ) -> Tuple[StructuredOrderSummary, bool]:
        """
        Mengekstrak pesan pelanggan menjadi `StructuredOrderSummary`.
        Mengembalikan tuple: `(StructuredOrderSummary, used_fallback: bool)`.
        """
        if predicted_category == "Other":
            return (
                StructuredOrderSummary(
                    customer_name=None,
                    order_status="New",
                    items=[],
                    greeting_card=GreetingCardSchema(is_requested=False),
                    additional_notes="Pesan dikategorikan sebagai pertanyaan umum (Other).",
                ),
                False,
            )

        for attempt in range(1, self.max_retries + 1):
            try:
                raw_json_str = self._call_ollama_chat(raw_message, rag_context=rag_context)
                parsed_dict = json.loads(raw_json_str)
                validated = StructuredOrderSummary.model_validate(parsed_dict)

                # Koreksi case-insensitive nama pemesan jika terlewat
                if not validated.customer_name:
                    cname_match = re.search(
                        r"(?:atas nama|saya|aku|dari|pemesan\s*[:=-]?)\s+([a-zA-Z][a-zA-Z\s]{1,20}?)(?=\s+(?:mau|pesen|pesan|order|beli|butuh|minta|buat|untuk)|[\.,\n]|$)",
                        raw_message,
                        re.IGNORECASE,
                    )
                    if cname_match:
                        validated.customer_name = cname_match.group(1).strip().title()

                # Lengkapi draft kartu ucapan jika diminta tapi kosong
                if (
                    generate_greeting_card
                    and validated.greeting_card.is_requested
                    and not validated.greeting_card.draft_message
                ):
                    validated.greeting_card.draft_message = generate_greeting_card_template(
                        occasion=validated.greeting_card.occasion,
                        recipient=validated.greeting_card.recipient_name,
                        sender=validated.greeting_card.sender_name,
                    )
                return validated, False
            except (urllib.error.URLError, TimeoutError, ConnectionError):
                break
            except (json.JSONDecodeError, ValidationError, KeyError):
                if attempt == self.max_retries:
                    break

        # Fallback deterministik jika timeout / error
        fallback_result = regex_fallback_extractor(
            raw_message=raw_message,
            predicted_category=predicted_category,
            generate_card=generate_greeting_card,
        )
        return fallback_result, True
