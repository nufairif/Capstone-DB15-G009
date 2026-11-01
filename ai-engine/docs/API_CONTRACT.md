# API Contract & Data Schema — AI-Assisted Custom Order Management (DB15-G009)

Dokumen ini merupakan kesepakatan (**API Contract**) antara tim **Generative AI** dan **Full-Stack Developer** untuk proyek **Toko Firaza** sesuai dengan *Project Plan DB15-G009*.

---

## 1. Kategori Pesanan (Predictive AI)
Model klasifikasi membagi pesan pelanggan ke dalam **5 kategori baku**:
1. `Ready Stock` — Pembelian produk jadi tanpa kustomisasi nama/bordir.
2. `Custom Sajadah` — Pesanan sajadah dengan kustomisasi (nama, warna, font, layout).
3. `Custom Handuk` — Pesanan handuk personalisasi (bordir nama, ukuran, warna).
4. `Hampers` — Paket kado/hampers/souvenir (biasanya mencakup paket sajadah/handuk + box + kartu ucapan).
5. `Other` — Pertanyaan umum di luar pemesanan langsung (tanya ongkir, komplain, tanya alamat toko, dll.).

---

## 2. Endpoint Inference API

### `POST /api/v1/ai/analyze-order`
Menggabungkan **Predictive AI** (klasifikasi kategori cepat dengan Scikit-Learn) dan **Generative AI** (ekstraksi detail pesanan + pembuatan draf kartu ucapan dengan Open-Source LLM lokal).

#### Request Body (`application/json`)
```json
{
  "raw_message": "Assalamualaikum kak, mau pesen hampers lebaran 3 paket ya. Isinya handuk custom warna navy bordir nama 'Keluarga Budi' font sambung. Sama sekalian kartu ucapannya buat acara tasyakuran pernikahan ya kak, pengirim dari Rina.",
  "generate_greeting_card": true
}
```

#### Response Body (`200 OK` - `application/json`)
```json
{
  "status": "success",
  "prediction": {
    "category": "Hampers",
    "confidence": 0.96,
    "all_probabilities": {
      "Ready Stock": 0.01,
      "Custom Sajadah": 0.01,
      "Custom Handuk": 0.01,
      "Hampers": 0.96,
      "Other": 0.01
    }
  },
  "extraction": {
    "customer_name": "Rina",
    "customer_phone": null,
    "order_status": "New",
    "items": [
      {
        "product_type": "Hampers Handuk Custom",
        "quantity": 3,
        "color": "Navy",
        "size": null,
        "custom_text": "Keluarga Budi",
        "font_style": "Sambung (Script)",
        "layout_notes": "Bordir nama pada handuk dalam paket hampers"
      }
    ],
    "greeting_card": {
      "is_requested": true,
      "occasion": "Tasyakuran Pernikahan",
      "sender_name": "Rina",
      "recipient_name": "Keluarga Budi",
      "draft_message": "Selamat atas tasyakuran pernikahannya, Keluarga Budi. Semoga menjadi keluarga yang sakinah, mawaddah, warahmah, serta selalu dilimpahi kebahagiaan dan keberkahan. Hangat salam dari Rina."
    },
    "additional_notes": "Paket hampers lebaran 3 paket"
  },
  "meta": {
    "classifier_model": "tfidf-svm-calibrated-v1",
    "llm_model": "llama3.2:3b-instruct-q4_K_M",
    "used_fallback": false
  }
}
```

---

### `POST /api/v1/ai/classify`
Endpoint ringan khusus **Predictive AI** (tanpa memanggil LLM) jika Backend hanya membutuhkan deteksi kategori cepat (< 20ms).

#### Request Body
```json
{
  "raw_message": "Kak sajadah travel ready stock warna hijau emerald masih ada 5 pcs?"
}
```

#### Response Body
```json
{
  "status": "success",
  "category": "Ready Stock",
  "confidence": 0.98
}
```

---

### `POST /api/v1/ai/rag-catalog`
Endpoint **Side Quest RAG (Retrieval-Augmented Generation)** untuk fitur *Tanya Katalog & SOP Toko Firaza* di Web Dashboard (100% lokal tanpa API proprietary).

#### Request Body
```json
{
  "query": "Ukuran handuk custom dewasa berapa cm dan pilihan warnanya apa aja?",
  "top_k": 2
}
```

#### Response Body
```json
{
  "query": "Ukuran handuk custom dewasa berapa cm dan pilihan warnanya apa aja?",
  "answer": "Berdasarkan Katalog Utama Handuk Personalisasi (Custom Bordir) Toko Firaza: Handuk Custom Toko Firaza menggunakan bahan 100% katun bambu dan microfiber premium daya serap tinggi. Ukuran tersedia: Handuk Mandi Dewasa (70x140 cm)...",
  "retrieved_documents": [
    {
      "doc_id": "CAT-002",
      "title": "Katalog Utama Handuk Personalisasi (Custom Bordir) Toko Firaza",
      "category": "Custom Handuk",
      "content": "...",
      "similarity_score": 0.8912
    }
  ],
  "meta": {
    "vector_db_backend": "scikit-cosine-vector-store",
    "generation_model": "llama3.2:3b",
    "used_on_premise_llm": false,
    "proprietary_api_used": false
  }
}
```

---

## 3. Status Siklus Produksi (Web Dashboard)
Sesuai ruang lingkup proyek, status pesanan yang dilacak pada database:
- `New` (Pesanan baru hasil ekstraksi AI / input admin)
- `Design/Preparation` (Tahap desain preview font/layout & persiapan bahan)
- `Production` (Tahap pembordiran/pencetakan & pengemasan)
- `Completed` (Pesanan selesai & siap dikirim)

---

## 4. Contoh Kode Integrasi untuk Tim Full-Stack (React.js / Next.js / Node.js)

### A. Memanggil Ekstraksi Order & Kartu Ucapan (`analyze-order`)
```javascript
async function extractCustomerOrder(rawChatText) {
  const response = await fetch("http://localhost:8000/api/v1/ai/analyze-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_message: rawChatText,
      generate_greeting_card: true,
    }),
  });

  if (!response.ok) {
    throw new Error("Gagal memproses ekstraksi AI");
  }

  const data = await response.json();
  // data.prediction.category -> "Hampers" | "Custom Sajadah" | "Custom Handuk" | "Ready Stock" | "Other"
  // data.extraction.customer_name -> Nama pemesan
  // data.extraction.items -> Array detail item (product_type, quantity, color, size, custom_text, font_style, layout_notes)
  // data.extraction.greeting_card.draft_message -> Teks kartu ucapan otomatis
  return data;
}
```

### B. Memanggil Asisten Katalog RAG (`rag-catalog`)
```javascript
async function askFirazaCatalog(questionText) {
  const response = await fetch("http://localhost:8000/api/v1/ai/rag-catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: questionText,
      top_k: 2,
    }),
  });

  return await response.json();
}
```
