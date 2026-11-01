# AI-Assisted Custom Order Management System — Toko Firaza (DB15-G009)
**Modul Generative AI, Predictive AI, & Local RAG (Tanpa API Key Proprietary)**

Repositori ini merupakan implementasi mandiri tim **Generative AI (DB15-G009)** untuk proyek **Toko Firaza** yang mematuhi seluruh ketentuan *Main Quest*, *Larangan*, dan *Side Quest (RAG On-Premise)* pada Capstone Project Dicoding Bootcamp:

1. **Fitur Pertama (Predictive AI Mandiri + Preprocessing):** Model klasifikasi NLP yang dilatih dari nol menggunakan `Scikit-Learn` (gabungan *Word & Character N-Gram TF-IDF* + *Calibrated LinearSVC*) dengan tahapan *text preprocessing* dan normalisasi singkatan belanja online Indonesia. **Tidak menggunakan AutoML, TensorFlow Hub, maupun API proprietary.**
2. **Side Quest — Sistem RAG 100% Open-Source & Lokal (On-Premise):**
   - Menggugurkan kewajiban penggunaan API model proprietary pada *Main Quest* sekaligus memenuhi kriteria **Nilai Tambah** (*Local SLM/LLM Generation*).
   - Terdiri dari: **Knowledge Base Katalog & SOP Toko Firaza** (`data/firaza_knowledge_base.json`), **Local Embedding Pipeline**, **Local Vector Database** (`FAISS` / `Scikit-Cosine Vector Store`), dan **Local Open-Source SLM/LLM Generation** via **Ollama** (`Llama 3.2 3B` / `Gemma 2 2B` format GGUF 4-bit).
3. **Generative AI Order Extractor & Greeting Card Generator:** Mengekstrak chat pelanggan tidak terstruktur menjadi `StructuredOrderSummary` berformat JSON tervalidasi **Pydantic** serta membuat draf kartu ucapan otomatis.
4. **REST API Serving (FastAPI):** Menyediakan endpoint siap pakai untuk diintegrasikan dengan aplikasi web oleh tim Full-Stack / React JS.

---

## Struktur Proyek
- `docs/API_CONTRACT.md` — **Prioritas 1**: Dokumentasi kontrak API & format JSON antara tim Gen AI dan Full-Stack.
- `src/schemas.py` — **Prioritas 1**: Skema validasi data menggunakan **Pydantic**.
- `src/generate_dataset.py` — **Prioritas 2**: Pembuat *synthetic dataset* (1.000 data chat pelanggan) serta *extraction test set* (30 kasus uji).
- `src/train_classifier.py` — **Prioritas 3**: *Preprocessing* teks & pelatihan model **Predictive AI** (5 kategori: `Ready Stock`, `Custom Sajadah`, `Custom Handuk`, `Hampers`, `Other`).
- `src/rag_engine.py` — **Side Quest (RAG Lokal)**: Engine *Retrieval-Augmented Generation* 100% lokal menggunakan Vector Store (`models/firaza_vector_store.joblib`) + Open-Source LLM lokal.
- `src/llm_extractor.py` — **Prioritas 4**: Ekstraktor JSON & generator kartu ucapan dengan *Strict Few-Shot Prompting*, konteks RAG, dan *Fallback Handler*.
- `src/inference_api.py` — **REST API Serving**: Server **FastAPI** (`/api/v1/ai/analyze-order`, `/api/v1/ai/classify`, `/api/v1/ai/rag-catalog`).
- `src/evaluate_pipeline.py` — Pengujian akurasi *end-to-end* (klasifikasi + ekstraksi JSON + RAG).

---

## Cara Menjalankan

### 1. Install Dependencies
```powershell
python -m pip install -r requirements.txt
```

### 2. Generate Synthetic Dataset & Latih Model
```powershell
python -m src.generate_dataset
python -m src.train_classifier
python -m src.evaluate_pipeline
```

### 3. Jalankan FastAPI Inference Server
```powershell
python -m uvicorn src.inference_api:app --reload --port 8000
```
Buka dokumentasi Swagger interaktif di: `http://localhost:8000/docs`

---

## Sitasi & Lisensi (Dataset, Library, dan Model)
Sesuai ketentuan wajib Capstone Project, berikut adalah daftar sitasi dan lisensi seluruh dataset, pustaka (*library*), dan model yang digunakan dalam proyek ini:

| Komponen | Nama Item | Lisensi | Sitasi / Referensi Resmi |
| :--- | :--- | :--- | :--- |
| **Dataset** | *Toko Firaza Synthetic Order & Catalog Dataset (DB15-G009)* | MIT License (Internal Team Dataset) | Dibuat secara mandiri oleh Tim Gen AI DB15-G009 (`src/generate_dataset.py` & `data/firaza_knowledge_base.json`, 2026) untuk simulasi percakapan pelanggan UMKM Toko Firaza. |
| **Library ML & Embedding** | **Scikit-learn** (`scikit-learn`) | BSD 3-Clause License | Pedregosa, F., et al. (2011). *Scikit-learn: Machine Learning in Python*. Journal of Machine Learning Research, 12, 2825–2830. https://scikit-learn.org |
| **Library Komputasi Vektor** | **NumPy** & **SciPy** | BSD 3-Clause License | Harris, C. R., et al. (2020). *Array programming with NumPy*. Nature, 585, 357–362. https://numpy.org |
| **Vector Database (Opsional/RAG)** | **FAISS** (`faiss-cpu`) / Scikit Cosine Vector Store | MIT License | Johnson, J., Douze, M., & Jégou, H. (2019). *Billion-scale similarity search with GPUs*. IEEE Transactions on Big Data, 7(3), 535–547. https://github.com/facebookresearch/faiss |
| **REST API Framework** | **FastAPI** & **Uvicorn** | MIT License / BSD 3-Clause | Ramírez, S. (2018). *FastAPI framework, high performance, easy to learn, fast to code, ready for production*. https://fastapi.tiangolo.com |
| **Validasi Skema Data** | **Pydantic** (`pydantic v2`) | MIT License | Colvin, S., et al. (2023). *Pydantic: Data validation using Python type hints*. https://docs.pydantic.dev |
| **Model SLM/LLM Lokal** | **Meta Llama 3.2 3B Instruct** / **Google Gemma 2 2B** (via Ollama GGUF) | Llama 3.2 Community License / Gemma Terms of Use | Dubey, A., et al. (2024). *The Llama 3 Herd of Models*. arXiv:2407.21783. dijalankan secara lokal (on-premise) melalui Ollama (https://ollama.com). |
