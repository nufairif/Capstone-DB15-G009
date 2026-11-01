from typing import Dict, List, Literal, Optional
from pydantic import BaseModel, Field, field_validator


# 5 Kategori Baku sesuai Project Plan DB15-G009
OrderCategory = Literal[
    "Ready Stock",
    "Custom Sajadah",
    "Custom Handuk",
    "Hampers",
    "Other",
]

# Siklus status produksi di Web Dashboard
OrderStatus = Literal[
    "New",
    "Design/Preparation",
    "Production",
    "Completed",
]


class OrderItemSchema(BaseModel):
    """Detail per item produk dalam satu pesanan pelanggan."""

    product_type: str = Field(
        ...,
        description="Jenis produk (misal: Sajadah Dewasa, Handuk Mandi, Hampers Sajadah, dll.)",
    )
    quantity: int = Field(
        default=1,
        ge=1,
        description="Jumlah item yang dipesan (minimal 1)",
    )
    color: Optional[str] = Field(
        default=None,
        description="Warna produk yang diminta pelanggan (misal: Navy, Maroon, Emerald)",
    )
    size: Optional[str] = Field(
        default=None,
        description="Ukuran produk jika disebutkan (misal: 70x140 cm, Travel, Besar, Anak)",
    )
    custom_text: Optional[str] = Field(
        default=None,
        description="Teks/nama custom yang akan dibordir atau dicetak pada produk",
    )
    font_style: Optional[str] = Field(
        default=None,
        description="Jenis font yang diminta (misal: Sambung/Script, Kapital/Blok, Arab, Kaligrafi)",
    )
    layout_notes: Optional[str] = Field(
        default=None,
        description="Catatan posisi/layout bordir atau desain (misal: pojok kanan bawah, tengah atas)",
    )

    @field_validator("quantity", mode="before")
    @classmethod
    def coerce_quantity(cls, v):
        """Pastikan quantity selalu berupa integer >= 1 meskipun LLM mengembalikan string/null."""
        if v is None or v == "":
            return 1
        try:
            val = int(v)
            return max(1, val)
        except (ValueError, TypeError):
            return 1


class GreetingCardSchema(BaseModel):
    """Detail dan draf kartu ucapan otomatis (Generative AI)."""

    is_requested: bool = Field(
        default=False,
        description="True jika pelanggan meminta kartu ucapan atau memesan Hampers/kado",
    )
    occasion: Optional[str] = Field(
        default=None,
        description="Momen/acara kartu ucapan (misal: Pernikahan, Ulang Tahun, Lebaran, Umroh)",
    )
    sender_name: Optional[str] = Field(
        default=None,
        description="Nama pengirim kado/hampers",
    )
    recipient_name: Optional[str] = Field(
        default=None,
        description="Nama penerima kado/hampers",
    )
    draft_message: Optional[str] = Field(
        default=None,
        description="Draf teks kartu ucapan yang sopan, hangat, dan siap cetak",
    )


class StructuredOrderSummary(BaseModel):
    """Output terstruktur hasil ekstraksi LLM dari chat pelanggan."""

    customer_name: Optional[str] = Field(
        default=None,
        description="Nama pemesan jika disebutkan dalam chat",
    )
    customer_phone: Optional[str] = Field(
        default=None,
        description="Nomor telepon/WA pemesan jika dicantumkan",
    )
    order_status: OrderStatus = Field(
        default="New",
        description="Status awal pesanan (default: New)",
    )
    items: List[OrderItemSchema] = Field(
        default_factory=list,
        description="Daftar produk yang dipesan",
    )
    greeting_card: GreetingCardSchema = Field(
        default_factory=GreetingCardSchema,
        description="Informasi dan draf kartu ucapan",
    )
    additional_notes: Optional[str] = Field(
        default=None,
        description="Catatan tambahan seperti deadline pengiriman, request bungkus, dll.",
    )


class ClassificationResult(BaseModel):
    """Output dari model Predictive AI (Scikit-Learn)."""

    category: OrderCategory
    confidence: float = Field(..., ge=0.0, le=1.0)
    all_probabilities: Dict[str, float]


class AnalyzeOrderRequest(BaseModel):
    """Request payload dari Backend/Frontend ke Inference API."""

    raw_message: str = Field(
        ...,
        min_length=3,
        description="Pesan/chat mentah dari pelanggan (WhatsApp/Shopee/IG)",
    )
    generate_greeting_card: bool = Field(
        default=True,
        description="Apakah perlu men-generate draf kartu ucapan otomatis",
    )


class AnalyzeOrderResponse(BaseModel):
    """Response lengkap Inference API sesuai API Contract."""

    status: str = "success"
    prediction: ClassificationResult
    extraction: StructuredOrderSummary
    meta: Dict[str, object]
