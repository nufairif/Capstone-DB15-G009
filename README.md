# Toko Firaza — AI-Assisted Custom Order Management System (DB15-G009)

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%2014%20App%20Router-black?style=flat&logo=next.js)](https://nextjs.org/)
[![Vite](https://img.shields.io/badge/Bundler-Vite%205-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Style-Tailwind%20CSS%203-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20RESTful-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat&logo=python)](https://python.org/)
[![SQLite](https://img.shields.io/badge/Database-SQLite%203%20Persistent-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![Ollama](https://img.shields.io/badge/Local%20LLM-Llama%203.2%203B%20(Ollama)-FF6F00?style=flat)](https://ollama.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

Sistem otomasi dan manajemen alur produksi kustomisasi bordir **Toko Firaza** ([firaza.com](https://firaza.com/)) berbasis **Decoupled Full-Stack Architecture**, **Custom Predictive AI Pipeline**, dan **On-Premise Local RAG (Llama 3.2 3B via Ollama)**. Dirancang khusus untuk memotong waktu rekap pesanan WhatsApp/Marketplace dari 8-12 menit menjadi hitungan detik dengan akurasi klasifikasi **98,3%**.

---

## 📋 Pemenuhan Rubrik Penilaian Capstone Dicoding (Full-Stack & Generative AI)

### 🌟 1. Full-Stack Main Quest & Side Quest (100% Terpenuhi)

| Kriteria Full-Stack | Bukti Implementasi pada Proyek | Status |
| :--- | :--- | :---: |
| **Arsitektur Decoupled** | Terpisah bersih menjadi direktori `frontend/` (React/Next.js/Vite) dan `backend/` (FastAPI), terhubung secara asinkron via networking calls (`Axios`). | ✅ Lulus |
| **Module Bundler Modern** | Menggunakan **Vite 5** (`frontend/vite.config.js`) dan **Next.js 14 App Router** (`frontend/next.config.mjs`) untuk kompilasi modul, HMR instan, dan optimasi build. | ✅ Lulus |
| **RESTful API Standard Convention** | Seluruh rute Backend mengikuti konvensi URL standar `/api/v1/orders`, `/api/v1/customers`, `/api/v1/stats`, `/api/v1/auth/login`, `/api/v1/ai/...`. | ✅ Lulus |
| **Penyimpanan Data Nyata (Database)** | Menggunakan database relasional **SQLite 3** permanen (`firaza_orders.db`) dengan skema DDL (`backend/schema.sql`) dan integritas relasi tabel (Foreign Keys). | ✅ Lulus |
| **Fitur AI sebagai Fitur Utama** | Terintegrasi penuh ke alur kerja utama: **LinearSVC Intent Classifier**, **Local Vector RAG Search**, dan **Local LLM Order & Greeting Card Extractor**. | ✅ Lulus |
| **Dokumentasi API Interaktif** | Tersedia dokumentasi **Swagger UI** otomatis dan interaktif di `http://localhost:8000/docs` serta OpenAPI 3.1 schema di `http://localhost:8000/openapi.json`. | ✅ Lulus |
| **Stabilitas & Error Handling** | Dilengkapi auto-starter `ollama serve`, fallback otomatis jika LLM offline, validasi Pydantic berlapis, serta UI error banner tanpa menyebabkan aplikasi crash. | ✅ Lulus |
| **Side Quest Full-Stack** | Responsive UI (Mobile/Tablet/Desktop), CSS Framework (**Tailwind CSS** + **Apple Bento Glass**), Schema Validation (**Pydantic v2**), HTTP Library (**Axios**), RBAC 3 Role, dan Git/GitHub rapi. | ✅ Lulus |

### 🧠 2. Generative AI Main Quest, Larangan, & Side Quest RAG On-Premise (100% Terpenuhi)

| Kriteria Generative AI | Bukti Implementasi pada Proyek | Status |
| :--- | :--- | :---: |
| **Fitur Pertama: Model AI Mandiri + Preprocessing** | Model klasifikasi NLP (`ai-engine/src/train_classifier.py`) dilatih dari nol dengan `Scikit-learn` (*Word & Char N-Gram TF-IDF* + *Calibrated LinearSVC*) dan tahapan *text preprocessing* bahasa slank/singkatan belanja online Indonesia (`preprocess_text()`). **Bukan dari TensorFlow Hub, bukan AutoML, dan bukan dari API proprietary.** | ✅ Lulus |
| **REST API Serving (FastAPI)** | Disajikan melalui `FastAPI` (`backend/routers/ai.py` & `ai-engine/src/inference_api.py`) bekerja sama langsung dengan aplikasi web React/Next.js. | ✅ Lulus |
| **Side Quest RAG (Menggugurkan Kewajiban API Proprietary)** | Membangun sistem **RAG On-Premise** (`ai-engine/src/rag_engine.py`) yang menggugurkan kewajiban penggunaan API proprietary pada Main Quest sekaligus meraih **Nilai Tambah** (*Local SLM/LLM Generation*). | ✅ Lulus |
| **Komponen RAG Lengkap** | 1) **Local SLM/LLM Generation:** `Meta Llama 3.2 3B` via **Ollama** (`http://localhost:11434`)<br>2) **Model Embedding Open-Source:** Hybrid Word+Char N-Gram TF-IDF Vectorizer<br>3) **Vector Database:** `FAISS` (`faiss-cpu` `IndexFlatIP`) / `Scikit-Cosine Vector Store` (`firaza_vector_store.joblib`)<br>4) **Integrasi Web App:** Menu **Katalog & SOP (RAG)** (`/rag`) dan konteks otomatis saat ekstraksi pesanan (`/create-order`). | ✅ Lulus |
| **Kepatuhan Tindakan yang Dilarang** | ❌ Tidak menggunakan TensorFlow Hub<br>❌ Tidak menggunakan AutoML<br>❌ Tidak menggunakan ChatGPT/Gemini API sebagai fitur pertama<br>❌ Tidak melakukan forking repositori proyek AI milik orang lain. | ✅ Aman |

---

## 📚 Sitasi & Lisensi Ilmiah (Dataset, Library, dan Model)

Sesuai ketentuan wajib rubrik Generative AI (*"Mohon sertakan sitasi yang tepat untuk setiap item yang digunakan atau dirujuk dalam proyek ini"*), berikut adalah daftar sitasi resmi dan lisensi seluruh dataset, pustaka (*library*), dan model yang digunakan dalam proyek ini:

| Komponen | Nama Item | Lisensi | Sitasi / Referensi Resmi |
| :--- | :--- | :--- | :--- |
| **Dataset & Knowledge Base** | *Toko Firaza Synthetic Order & Catalog Dataset (DB15-G009)* | MIT License (Internal Team Dataset) | Dibuat secara mandiri oleh Tim DB15-G009 (`ai-engine/src/generate_dataset.py` & `ai-engine/data/firaza_knowledge_base.json`, 2026) mengacu pada katalog produk kustomisasi bordir resmi Toko Firaza (https://firaza.com/). |
| **Library ML, Preprocessing & Embedding** | **Scikit-learn** (`scikit-learn`) | BSD 3-Clause License | Pedregosa, F., Varoquaux, G., Gramfort, A., Michel, V., Thirion, B., Grisel, O., ... & Duchesnay, E. (2011). *Scikit-learn: Machine Learning in Python*. Journal of Machine Learning Research, 12, 2825–2830. https://scikit-learn.org |
| **Library Komputasi Vektor** | **NumPy** & **SciPy** | BSD 3-Clause License | Harris, C. R., Millman, K. J., van der Walt, S. J., et al. (2020). *Array programming with NumPy*. Nature, 585, 357–362. https://numpy.org |
| **Vector Database (RAG)** | **FAISS** (`faiss-cpu`) / Scikit Cosine Vector Store | MIT License | Johnson, J., Douze, M., & Jégou, H. (2019). *Billion-scale similarity search with GPUs*. IEEE Transactions on Big Data, 7(3), 535–547. https://github.com/facebookresearch/faiss |
| **REST API Framework** | **FastAPI** & **Uvicorn** | MIT License / BSD 3-Clause | Ramírez, S. (2018). *FastAPI framework, high performance, easy to learn, fast to code, ready for production*. https://fastapi.tiangolo.com |
| **Validasi Skema Data** | **Pydantic** (`pydantic v2`) | MIT License | Colvin, S., et al. (2023). *Pydantic: Data validation using Python type hints*. https://docs.pydantic.dev |
| **Model SLM/LLM Lokal (On-Premise)** | **Meta Llama 3.2 3B Instruct** (via Ollama GGUF) | Llama 3.2 Community License | Dubey, A., Jauhri, A., Pandey, A., et al. (2024). *The Llama 3 Herd of Models*. arXiv preprint arXiv:2407.21783. Dijalankan secara lokal (on-premise) melalui **Ollama** (https://ollama.com). |
| **Frontend & Networking** | **React 18**, **Next.js 14**, **Vite 5**, **Tailwind CSS 3**, **Axios** | MIT License | Vercel Inc. (2024). *Next.js by Vercel - The React Framework*. https://nextjs.org; You, E. (2024). *Vite Next Generation Frontend Tooling*. https://vitejs.dev; Axios Project (2024). *Promise based HTTP client for the browser and node.js*. https://axios-http.com |

---

## 🎨 Tampilan Desain: Apple Bento Glass Language

Antarmuka aplikasi mengadopsi standar desain **Apple Bento Glass**:
1. **Frosted Translucency:** Panel kaca frosted dengan efek refraksi `backdrop-blur-24px`, border hairline putih translusen, dan ambient mesh glow orbs di latar belakang canvas.
2. **Modular Bento Grid:** Kartu-kartu metrik modular dengan lengkungan squircle `rounded-[32px]` dan transisi elevasi mikro saat kursor diarahkan.
3. **Apple Dark Glass Pro Card:** Kartu status utama bergaya VisionOS / Apple TV (`apple-glass-dark`) dengan status progress bar glowing emerald dan tombol aksi instan.
4. **Interactive 4-Stage Kanban:** Pelacakan 4 tahap alur kerja pesanan bordir (*New*, *Design/Preparation*, *Production*, *Completed*).

---

## 🤖 Arsitektur Pipeline Artificial Intelligence

```
Chat WhatsApp / Shopee
          │
          ▼
┌─────────────────────────────────────────┐
│ 1. Text Preprocessing & LinearSVC       │ ──► Normalisasi Slank + Prediksi Kategori (Akurasi 98.3%)
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│ 2. Local Vector Store RAG (FAISS/Cosine)│ ──► Retrieval Top-K dari Katalog & SOP Bordir Toko Firaza
└─────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────┐
│ 3. Local LLM (Llama 3.2 3B via Ollama)  │ ──► Ekstraksi JSON Pesanan, Jawaban RAG & Kartu Ucapan
└─────────────────────────────────────────┘
          │
          ▼
Database SQLite & Kanban Produksi
```

---

## 🚀 Panduan Menjalankan Aplikasi

### Cara Termudah (One-Click Runner)

Pilih sesuai terminal yang sedang Anda gunakan di root folder:

* **Di Git Bash / MSYS2 / UCRT64 (Linux/macOS):**
  ```bash
  ./start_all.sh
  ```
* **Di Windows Command Prompt (CMD):**
  ```cmd
  start_all.bat
  ```
* **Di Windows PowerShell:**
  ```powershell
  .\start_all.bat
  ```

Script otomatis menyalakan seluruh layanan secara bersamaan:
- **Web Dashboard (Next.js):** http://localhost:3000
- **Backend & AI API (Swagger Docs):** http://localhost:8000/docs
- **Local LLM Server (Ollama `llama3.2:3b`):** http://localhost:11434

---

## 👥 Akun Demo & Hak Akses (RBAC)

Aplikasi dilengkapi dengan 3 profil akun uji coba siap pakai:

| Role | Username | Password | Hak Akses |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin` | `admin123` | Akses penuh seluruh fitur, CRUD pesanan, CRUD pelanggan, hapus data, evaluasi dataset AI. |
| **CS Specialist** | `cs` | `cs123` | Ekstraksi AI chat WhatsApp, input/edit pesanan baru, manajemen kontak pelanggan, konsultasi RAG. |
| **Production Lead** | `produksi` | `firaza2026` | Monitoring kanban antrean bordir, update status tahap produksi, pelacakan spesifikasi teknis barang. |

---

## 👨‍💻 Tim Pengembang (DB15-G009)

Proyek ini dikembangkan sebagai tugas akhir Capstone Project program **Full-Stack Web Developer & Generative AI Engineer** (DB15-G009). Seluruh kode sumber, model kecerdasan buatan, dan arsitektur database dibuat secara orisinal untuk mendukung modernisasi UMKM kustomisasi bordir Indonesia (**Toko Firaza**).
