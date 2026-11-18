# Toko Firaza — Sistem Manajemen Pesanan Kustom Berbasis AI (DB15-G009)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20RESTful-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%2B-3776AB?style=flat&logo=python)](https://python.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![vLLM](https://img.shields.io/badge/Serving-vLLM%20%2B%20Ngrok-FF6F00?style=flat)](https://docs.vllm.ai/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Aplikasi pengelolaan pesanan bordir kustom untuk **Toko Firaza** ([firaza.com](https://firaza.com/)) yang memisahkan frontend (Next.js) dan backend (FastAPI), didukung oleh ekstraksi pesanan terstruktur (**Instructor + Pydantic**), pencarian katalog (**LlamaIndex + ChromaDB**), serta pemantauan performa (**Langfuse**). Sistem ini membantu tim layanan pelanggan memangkas waktu rekap chat WhatsApp/Marketplace dari 8-12 menit menjadi hitungan detik.

---

## Arsitektur AI & Perbaikan Utama

Sesuai hasil evaluasi teknis bersama Advisor, alur AI pada proyek ini menggunakan komponen berikut:

```
Chat Pelanggan (WhatsApp / Shopee)
          │
          ▼
┌───────────────────────────────────────────┐
│ 1. System 1 Decision Model (< 2 ms)       │ ──► Saring sapaan & pertanyaan umum ('Other')
└───────────────────────────────────────────┘     tanpa membuang waktu & kuota GPU
          │ (jika terdeteksi niat pesan)
          ▼
┌───────────────────────────────────────────┐
│ 2. LlamaIndex + ChromaDB Vector Database  │ ──► Ambil konteks katalog & SOP Toko Firaza
└───────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────┐
│ 3. Instructor + Pydantic Contract         │ ──► Hubungi vLLM (Google Colab via Ngrok) / Ollama
│    (Validasi ketat + retry otomatis)      │     Output tidak valid ditolak (HTTP 422)
└───────────────────────────────────────────┘
          │
          ▼
┌───────────────────────────────────────────┐
│ 4. Langfuse Observability & Scikit-Learn  │ ──► Lacak latensi, token, biaya & agregasi data
└───────────────────────────────────────────┘
```

Ringkasan keputusan arsitektur:
1. **Tanpa Model Klasifikasi 5 Kategori Terpisah:** Penentuan kategori (`Ready Stock`, `Custom Sajadah`, `Custom Handuk`, `Hampers`, `Other`) disatukan langsung ke dalam skema `StructuredOrderSummary` pada Generative AI. `Scikit-learn` digunakan untuk fungsi agregasi kata kunci dan statistik data.
2. **Serving Model Langsung dengan vLLM + Ngrok (Tanpa 9router):** Model LLM dijalankan di **Google Colab** menggunakan **vLLM** dan dihubungkan langsung ke Backend lewat **Ngrok** (`LLM_BASE_URL` pada `.env`), dengan cadangan Ollama lokal.
3. **Kontrak Ketat Backend dengan Pydantic + Instructor:** Menggantikan *few-shot prompting* manual agar output AI terikat kontrak skema Pydantic. Jika output gagal validasi setelah batas *retry*, backend menolaknya (`422`) dan tidak meneruskan data rusak ke database.
4. **RAG dengan LlamaIndex + ChromaDB:** Menggantikan FAISS murni sehingga penyimpanan dokumen, metadata kategori, dan pencarian kemiripan terkelola secara permanen.
5. **Observability dengan Langfuse:** Mencatat jejak (*trace*) eksekusi prompt, waktu tunggu (*latency*), pemakaian token, dan estimasi biaya tiap request.

---

## Skema Database Custom Order (`backend/schema.sql`)

Database relasional **SQLite 3** (`backend/firaza_orders.db`, DDL pada [`backend/schema.sql`](backend/schema.sql), kompatibel juga dengan PostgreSQL dan MySQL) terdiri dari 4 tabel utama:

| Tabel | Kolom Kunci & Relasi | Fungsi |
| :--- | :--- | :--- |
| **`users`** | `id` (PK), `username` (UNIQUE), `email` (UNIQUE), `password_hash`, `full_name`, `role` | Menyimpan akun pengguna dan peran akses (RBAC). |
| **`customers`** | `id` (PK), `name`, `phone`, `email`, `address`, `created_at` | Menyimpan profil pelanggan untuk transaksi berulang. |
| **`orders`** | `id` (PK), `order_code` (UNIQUE), `customer_id` (FK -> `customers.id`), `raw_message`, `category`, `ai_confidence`, `status`, `greeting_card_requested`, `greeting_occasion`, `greeting_sender`, `greeting_recipient`, `greeting_draft`, `additional_notes` | Menyimpan pesanan utama, chat mentah, kategori, draf kartu ucapan, dan status produksi (`New` -> `Design/Preparation` -> `Production` -> `Completed`). |
| **`order_items`** | `id` (PK), `order_id` (FK -> `orders.id`), `product_type`, `quantity`, `color`, `size`, `custom_text`, `font_style`, `layout_notes` | Menyimpan rincian item bordir per pesanan (mendukung banyak item dalam satu order). |

---

## Dokumentasi Preprocessing Teks & Model AI

### 1. Text Preprocessing (`ai-engine/src/system1_decision.py`)
Fungsi `preprocess_text(text)` membersihkan teks chat pelanggan sebelum diproses oleh **System 1 Decision Model**, **OrderAggregationService**, maupun fallback embedding RAG:
1. Mengubah huruf ke huruf kecil (*case folding*) dan menghapus spasi berlebih (`text.lower().strip()`).
2. Menghapus tanda baca dan karakter non-alfanumerik dengan regex (`re.sub(r"[^\w\s]", " ", text)`).
3. Menormalisasi singkatan belanja online Indonesia menggunakan kamus `SLANG_MAP`:
   `wrn`/`wrna` -> `warna`, `uk`/`ukrn` -> `ukuran`, `bdr`/`bordr` -> `bordir`, `sjdh`/`sajdah`/`sejadah` -> `sajadah`, `hndk`/`handk`/`anduk` -> `handuk`, `hmpers`/`hamper` -> `hampers`, `rdy` -> `ready`, `brp`/`brpa` -> `berapa`, `utk` -> `untuk`, `bt` -> `buat`, `dgn` -> `dengan`, `psnan` -> `pesanan`, `krtu` -> `kartu`, `ucpan` -> `ucapan`.

### 2. Model & Komponen AI yang Aktif
* **System 1 Decision Model (`System1DecisionModel`):** Lapisan triage cepat (`< 2 ms`) menggunakan `ORDER_INTENT_KEYWORDS` dan `NON_ORDER_INQUIRY_KEYWORDS` untuk menyaring sapaan atau pertanyaan non-pesanan (`Other`) sebelum memanggil LLM.
* **Fungsi Agregasi Scikit-Learn (`OrderAggregationService`):** Menggunakan `CountVectorizer(ngram_range=(1, 2), max_features=200)` dari `scikit-learn` untuk mengagregasi kata kunci populer dan distribusi kategori pesanan pada `/api/v1/ai/dataset-overview`.
* **GenAI Structured Extractor (`LocalLLMOrderExtractor`):** Menggunakan client OpenAI-compatible (`vLLM` via Ngrok atau `Ollama` lokal) yang dibungkus **`Instructor`** (`instructor.from_openai`) dengan kontrak Pydantic `StructuredOrderSummary` (menentukan `order_category`, detail `items`, dan `greeting_card` sekaligus). Kegagalan validasi skema setelah batas retry mengembalikan `StructuredContractError` (HTTP `422`).
* **RAG Katalog & SOP (`LocalOpenSourceRAGEngine`):** Menggunakan **LlamaIndex** (`VectorStoreIndex`, `VectorIndexRetriever`, `MetadataFilters`) dengan **ChromaDB** (`chromadb.PersistentClient`) atas 75 dokumen pada [`firaza_knowledge_base.json`](ai-engine/data/firaza_knowledge_base.json) dan model embedding `sentence-transformers/all-MiniLM-L6-v2` (dengan fallback `LocalHashingFallbackEmbedding` 384-dim saat offline).

---

## Prompt yang Digunakan (Structured Summary, Kartu Ucapan, & RAG)

### 1. System Prompt Ekstraksi Pesanan & Kartu Ucapan (`ai-engine/src/llm_extractor.py`)
```text
Anda adalah AI Order Extractor resmi Toko Firaza (custom bordir sajadah, handuk, dan hampers).
Tugas Anda mengekstrak chat pelanggan Indonesia (termasuk singkatan wrn=warna, uk=ukuran, bdr=bordir, sjdh=sajadah, hndk=handuk) dan menentukan kategori pesanan ke dalam JSON valid sesuai kontrak skema Pydantic.

Aturan ketat:
1. Tentukan `order_category` yang paling akurat: 'Hampers', 'Custom Sajadah', 'Custom Handuk', 'Ready Stock', atau 'Other'.
2. Jika `order_category` adalah 'Hampers', set `greeting_card.is_requested = true` dan buatkan `draft_message` kartu ucapan yang hangat dalam bahasa Indonesia.
3. Jangan mengarang data pelanggan (nama/telepon) jika tidak tertulis di chat; isi null.
4. Pastikan `quantity` berupa integer >= 1. Jika tidak disebutkan, gunakan 1.
5. Kembalikan hanya JSON sesuai skema tanpa teks tambahan.
```
*Catatan: Bila `rag_context` ditemukan dari ChromaDB, konteks katalog Toko Firaza ditambahkan pada bagian `Referensi Katalog & SOP Toko Firaza`. Jika pelanggan meminta kartu ucapan tetapi `draft_message` kosong, fungsi `generate_greeting_card_template()` menyusun template sesuai momen (`Pernikahan`, `Idul Fitri`, `Ulang Tahun`, `Ibadah Haji/Umroh`, atau `Spesial`).*

### 2. System Prompt Asisten Katalog RAG (`ai-engine/src/rag_engine.py`)
```text
Anda adalah asisten layanan pelanggan resmi Toko Firaza.
Dokumen di bawah ini adalah kutipan resmi dari Katalog & SOP Toko Firaza yang relevan dengan pertanyaan pengguna.
Tugas Anda adalah menjawab pertanyaan pengguna secara langsung, jelas, dan ramah HANYA menggunakan fakta yang tertulis pada dokumen di bawah ini.
Jangan mengarang angka, ukuran, atau kebijakan di luar dokumen berikut.

=== DOKUMEN RESMI TOKO FIRAZA ===
{context_block}
```

---

## Evaluasi Model dengan Test Set (`ai-engine/src/evaluate_pipeline.py`)

Pengujian end-to-end menggunakan dataset uji [`ai-engine/data/extraction_test_set.json`](ai-engine/data/extraction_test_set.json) mengukur lima metrik utama sekaligus skema JSON Pydantic dan respons RAG:
1. Validitas Kontrak Pydantic (`Instructor`)
2. Akurasi Kategori Pesanan (`GenAI` / `System 1`)
3. Akurasi Ekstraksi Jumlah (`quantity`)
4. Akurasi Ekstraksi Warna (`color`)
5. Akurasi Ekstraksi Nama Custom (`custom_text`)

Untuk menjalankan evaluasi setelah server vLLM (Colab + Ngrok) atau Ollama lokal aktif:
```bash
cd ai-engine
py -3.12 -m src.evaluate_pipeline
```
Output ringkasan contoh API tersimpan otomatis ke [`ai-engine/models/sample_api_outputs.json`](ai-engine/models/sample_api_outputs.json).

---

## Evaluasi Cost Metric & Dampak ke Kecepatan

Pengukuran biaya dan kecepatan menjadi bagian utama evaluasi sistem agar operasional tetap efisien saat volume chat meningkat:

| Skenario Eksekusi | Estimasi Biaya Komputasi | Waktu Respons (*Latency*) | Dampak Operasional |
| :--- | :--- | :--- | :--- |
| **System 1 Short-Circuit** (chat sapaan/tanya umum) | **Rp 0** (0 token LLM) | **< 2 milidetik** | Menghemat penggunaan GPU hingga 20-30% untuk chat non-pesanan. |
| **vLLM di Google Colab GPU (via Ngrok)** | Gratis (Colab T4) atau ~Rp 1 - Rp 2 / pesanan (GPU berbayar) | **0,8 - 1,8 detik** | Tim CS dapat langsung meninjau form pesanan tanpa menunggu lama. |
| **Ollama Lokal di CPU (Cadangan Offline)** | Rp 0 (listrik lokal) | **12 - 25 detik** | Berguna sebagai cadangan saat koneksi internet mati, namun terlalu lambat saat jam sibuk. |
| **Validasi Ulang (`Instructor` Retry)** | Tambahan ~500-700 token per retry | **+0,8 - 1,5 detik** | Menjamin tidak ada data pesanan rusak masuk ke antrean produksi, meski sedikit menambah waktu saat terjadi retry. |
| **Logging & Tracing (`Langfuse`)** | Gratis (kuota *hobby*) / *self-hosted* | **< 5 milidetik** | Berjalan asinkron di latar belakang sehingga tidak memperlambat tampilan ke pengguna. |

---

## Analisis Kompetitor & Dampak Bisnis

| Aspek Pembanding | Rekap Manual Admin CS (Cara Lama) | Chatbot SaaS Umum (Qiscus / Respond.io / Mekari) | Sistem AI Toko Firaza (DB15-G009) |
| :--- | :--- | :--- | :--- |
| **Membaca Detail Bordir Kustom** | Akurat jika tidak lelah, namun butuh 8-12 menit per pesanan. | Bergantung pada tombol menu kaku; tidak bisa mengekstrak chat bebas berisi nama, font, warna, dan posisi bordir sekaligus. | Langsung memetakan singkatan chat (`wrn`, `uk`, `bdr`, `sjdh`) ke form pesanan terstruktur. |
| **Pembuatan Kartu Ucapan Hampers** | Admin mengetik manual setiap kali ada pesanan kado. | Tidak menyediakan generator teks ucapan kontekstual yang terhubung ke detail item. | Otomatis menyusun draf kartu ucapan sesuai acara (pernikahan, lebaran, haji, ulang tahun). |
| **Alur ke Tim Produksi** | Salin-tempel manual ke spreadsheet atau grup chat. | Berhenti di inbox CS; tidak terhubung ke papan kerja produksi. | Terhubung langsung ke papan **Kanban 4 Tahap** beserta kalkulasi total unit (*Pcs*). |
| **Biaya Rutin Bulanan** | Biaya lembur admin saat musim ramai. | Rp 1.500.000 - Rp 5.000.000+ per bulan (tergantung kuota kontak). | Bebas biaya langganan lisensi per kursi; hanya biaya infrastruktur server/GPU. |

**Dampak Bisnis Terukur:**
* **Percepatan Layanan CS:** Waktu catat satu pesanan kustom turun dari 8-12 menit menjadi di bawah 10 detik (termasuk peninjauan admin).
* **Penurunan Kesalahan Produksi:** Rujukan katalog dari ChromaDB + validasi Pydantic mengurangi risiko salah catat ukuran, warna kain, dan ejaan nama bordir.
* **Kesiapan Musim Ramai (*Peak Season*):** Saat lonjakan pesanan Ramadhan/Idul Fitri, admin yang ada tetap sanggup melayani volume chat berlipat ganda.

---

## Panduan Menjalankan Aplikasi

1. Salin `.env.example` menjadi `.env`, lalu isi `LLM_BASE_URL` dengan URL Ngrok dari notebook [`GenAI_Firaza_Colab.ipynb`](ai-engine/notebooks/GenAI_Firaza_Colab.ipynb) (atau biarkan `http://localhost:11434/v1` untuk Ollama lokal). Isi juga `LANGFUSE_PUBLIC_KEY` dan `LANGFUSE_SECRET_KEY` jika ingin mengirim *trace* ke Langfuse.
2. Jalankan aplikasi dari root folder:
   * **Windows:** `start_all.bat`
   * **Linux/macOS/Git Bash:** `./start_all.sh`
3. Akses layanan:
   * **Web Dashboard (Next.js):** http://localhost:3000
   * **Backend & AI API (Swagger Docs):** http://localhost:8000/docs

### Akun Demo (RBAC)

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Akses penuh seluruh fitur, CRUD pesanan & pelanggan, pantau telemetri AI. |
| **CS Specialist** | `cs` | `cs123` | Ekstraksi AI chat pelanggan, input pesanan baru, konsultasi katalog RAG. |
| **Production Lead** | `produksi` | `firaza2026` | Pemantauan papan Kanban produksi dan pembaruan status pengerjaan. |

---

## Glosarium Istilah Teknis

* **ChromaDB:** Basis data vektor (*vector database*) permanen untuk menyimpan dokumen katalog beserta metadata agar dapat dicari berdasarkan kemiripan makna.
* **Instructor:** Pustaka Python yang menghubungkan model bahasa (LLM) dengan skema `Pydantic` untuk memaksa output AI selalu sesuai format JSON yang disepakati, lengkap dengan mekanisme pengulangan otomatis (*retry*) jika format meleset.
* **Langfuse:** Alat pemantau (*observability*) untuk mencatat riwayat pemanggilan AI, waktu respons, pemakaian token, dan mendeteksi kegagalan validasi.
* **LlamaIndex:** Kerangka kerja (*framework*) yang mengatur alur RAG mulai dari penyimpanan dokumen ke ChromaDB, pemfilteran metadata, hingga penyusunan jawaban.
* **Ngrok:** Layanan penghubung jaringan (*tunneling*) yang memberikan alamat URL publik aman ke server model yang berjalan di Google Colab tanpa perlu konfigurasi router rumit.
* **Pydantic:** Pustaka Python untuk memeriksa tipe dan aturan data agar data yang masuk ke backend dan database selalu valid.
* **RAG (Retrieval-Augmented Generation):** Metode yang membuat AI membaca dokumen katalog resmi terlebih dahulu sebelum menjawab agar tidak mengarang informasi harga atau ukuran.
* **SGLang (Structured Generation Language):** Mesin server LLM alternatif yang dioptimalkan untuk mempercepat pembuatan output terstruktur (seperti JSON) dan penyimpanan cache instruksi berulang.
* **System 1 Decision Model:** Lapisan penyaringan sangat cepat di awal alur untuk memisahkan pesan sederhana/pertanyaan umum sebelum memanggil model AI utama.
* **TGI (Text Generation Inference):** Mesin server LLM buatan Hugging Face untuk menyajikan model bahasa skala produksi.
* **vLLM:** Mesin server LLM berkecepatan tinggi dengan manajemen memori GPU efisien (*PagedAttention*) yang menyediakan API standar OpenAI.
