from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field


# 5 Kategori Baku Pesanan Toko Firaza (Ditentukan langsung di Structured Output GenAI / System 1)
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
        min_length=2,
        description="Jenis produk (misal: Sajadah Turki Custom, Handuk Mandi Custom, Hampers Sajadah)",
    )
    quantity: int = Field(
        default=1,
        ge=1,
        description="Jumlah item yang dipesan (bilangan bulat minimal 1)",
    )
    color: Optional[str] = Field(
        default=None,
        description="Warna produk yang diminta pelanggan (misal: Navy, Maroon, Hijau Emerald)",
    )
    size: Optional[str] = Field(
        default=None,
        description="Ukuran produk jika disebutkan (misal: 70x140 cm, Travel, Dewasa, Anak)",
    )
    custom_text: Optional[str] = Field(
        default=None,
        description="Teks/nama custom yang akan dibordir pada produk, atau null jika Ready Stock polos",
    )
    font_style: Optional[str] = Field(
        default=None,
        description="Jenis font yang diminta (misal: Sambung/Script, Kapital, Arab, Kaligrafi)",
    )
    layout_notes: Optional[str] = Field(
        default=None,
        description="Catatan posisi/layout bordir atau desain (misal: pojok kanan bawah, tengah atas)",
    )


class GreetingCardSchema(BaseModel):
    """Detail dan draf kartu ucapan otomatis (Generative AI)."""

    is_requested: bool = Field(
        default=False,
        description="True jika pelanggan meminta kartu ucapan atau memesan paket Hampers/kado",
    )
    occasion: Optional[str] = Field(
        default=None,
        description="Momen/acara kartu ucapan (misal: Pernikahan, Ulang Tahun, Lebaran, Haji/Umroh)",
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
        description="Draf teks kartu ucapan bahasa Indonesia yang sopan, hangat, dan siap cetak",
    )


class StructuredOrderSummary(BaseModel):
    """
    Kontrak data utama (Pydantic) hasil ekstraksi & kategorisasi oleh GenAI melalui Instructor.
    Jika output LLM tidak valid terhadap skema ini setelah batas retry, hasil akan ditolak.
    """

    order_category: OrderCategory = Field(
        ...,
        description=(
            "Kategori pesanan berdasarkan maksud pelanggan: "
            "'Hampers' (paket kado/giftbox/souvenir), "
            "'Custom Sajadah' (sajadah dengan bordir/custom), "
            "'Custom Handuk' (handuk dengan bordir/custom), "
            "'Ready Stock' (produk polos tanpa custom), atau "
            "'Other' (pertanyaan umum/non-pesanan)."
        ),
    )
    category_confidence: float = Field(
        default=0.95,
        ge=0.0,
        le=1.0,
        description="Estimasi keyakinan kategori pesanan antara 0.0 hingga 1.0",
    )
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
        description="Status awal pesanan (selalu 'New' untuk pesanan baru)",
    )
    items: List[OrderItemSchema] = Field(
        default_factory=list,
        description="Daftar produk yang dipesan (kosong jika kategori 'Other')",
    )
    greeting_card: GreetingCardSchema = Field(
        default_factory=GreetingCardSchema,
        description="Informasi dan draf kartu ucapan",
    )
    additional_notes: Optional[str] = Field(
        default=None,
        description="Catatan tambahan seperti deadline pengiriman, warna benang, atau request bungkus",
    )


class ClassificationResult(BaseModel):
    """Ringkasan kategori & routing pesanan (dihasilkan dari System 1 / GenAI Structured Output)."""

    category: OrderCategory
    confidence: float = Field(..., ge=0.0, le=1.0)
    all_probabilities: Dict[str, float] = Field(default_factory=dict)


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
    meta: Dict[str, Any]
