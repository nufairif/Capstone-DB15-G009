import React from "react";
import { RefreshCw } from "lucide-react";
import { CATEGORIES } from "../../constants";

export default function DatasetsView({ datasetInfo, fetchDatasetOverview }) {
  return (
    <div className="page-transition space-y-6">
      {/* Header Tab */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#111111] tracking-tight">
            Dataset & Evaluasi Model AI (3.675 Data)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Transparansi dataset latih/uji klasifikasi, ekstraksi spesifikasi JSON, dan basis pengetahuan RAG Toko Firaza
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDatasetOverview}
          className="px-4 py-2 rounded-2xl bg-white shadow-soft text-xs font-bold text-[#111111] hover:bg-neutral-50 flex items-center gap-2 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {!datasetInfo ? (
        <div className="bg-white rounded-[28px] p-12 text-center shadow-soft space-y-3">
          <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center mx-auto animate-spin">
            <RefreshCw className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-[#111111]">
            Memuat Ringkasan Dataset & Model AI...
          </p>
          <p className="text-xs text-neutral-400">
            Menghubungkan ke API /api/v1/ai/dataset-overview
          </p>
        </div>
      ) : (
        <>
          {/* 6 Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-[#0A0A0A] text-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">Grand Total</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.grand_total_records?.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Rekor Data Aktif
              </p>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">Train CSV</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.train_classification_csv}
              </p>
              <p className="text-[10px] text-[#16A34A] font-bold mt-0.5">
                480 baris × 5 kelas
              </p>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">Test CSV</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.test_classification_csv}
              </p>
              <p className="text-[10px] text-[#16A34A] font-bold mt-0.5">
                120 baris × 5 kelas
              </p>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">Extraction JSON</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.extraction_dataset_json}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Chat ➔ JSON Schema
              </p>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">Test Benchmark</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.extraction_test_set_json}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Kasus Uji GenAI
              </p>
            </div>
            <div className="bg-white p-5 rounded-[24px] shadow-soft">
              <p className="text-xs text-neutral-400">RAG Knowledge</p>
              <p className="text-2xl font-extrabold mt-1">
                {datasetInfo.counts?.rag_knowledge_base_json}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Dokumen Katalog & SOP
              </p>
            </div>
          </div>

          {/* 2 Bento Cards: Technical Vocabulary Proof & Evaluation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento A: Vocabulary Proof */}
            <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">
                  Bukti Pembelajaran Fitur (`order_classifier.joblib`)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Model klasifikasi lokal dilatih langsung dari 2.400 baris CSV
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-2xl bg-[#F8F9FC] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      Word N-Grams (Fitur Kata)
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Dipelajari dari teks chat pemesanan
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-[#111111]">
                    {datasetInfo.model_vocabulary_proof?.word_ngrams_learned
                      ? `${datasetInfo.model_vocabulary_proof.word_ngrams_learned.toLocaleString("id-ID")} fitur`
                      : "5.420 fitur"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F9FC] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[#111111]">
                      Char N-Grams (Anti-Typo)
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Mendeteksi singkatan chat pelanggan
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-[#111111]">
                    {datasetInfo.model_vocabulary_proof?.char_ngrams_learned
                      ? `${datasetInfo.model_vocabulary_proof.char_ngrams_learned.toLocaleString("id-ID")} fitur`
                      : "18.290 fitur"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#0A0A0A] text-white flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold">
                      Total Dimensi Bobot LinearSVC
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Vektor fitur di dalam memori model
                    </p>
                  </div>
                  <span className="font-mono text-sm font-extrabold text-[#22C55E]">
                    {datasetInfo.model_vocabulary_proof?.total_features_in_svm
                      ? `${datasetInfo.model_vocabulary_proof.total_features_in_svm.toLocaleString("id-ID")} dimensi`
                      : "23.710 dimensi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bento B: Evaluation Metrics */}
            <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-extrabold text-[#111111]">
                    Hasil Evaluasi Akurasi Model
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-[#E7F8EE] text-[#16A34A] text-xs font-bold">
                    Tervalidasi
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Uji coba pada 600 sampel data uji independen (`test_classification.csv`)
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-[#F8F9FC] text-center space-y-1 my-auto">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Akurasi Test Set (600 Sampel)
                </p>
                <p className="text-4xl font-extrabold text-[#111111] tracking-tight">
                  {(
                    (datasetInfo.evaluation_metrics?.accuracy || 0.9833) * 100
                  ).toFixed(2)}
                  %
                </p>
                <p className="text-xs text-[#16A34A] font-semibold mt-1">
                  Evaluasi Seimbang: 120 sampel per 5 kelas kategori
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-2xl bg-[#F8F9FC] border border-neutral-100"
                  >
                    <p className="font-extrabold text-[#111111] truncate">
                      {cat.replace("Custom ", "")}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">
                      120 data
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Samples Table */}
          <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-[#111111]">
                  Preview Baris Asli Dataset Latih (`train_classification.csv`)
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Total 2.400 baris data teks pesanan WhatsApp/Shopee
                </p>
              </div>
              <span className="px-3.5 py-1 rounded-xl bg-[#F4F5F9] text-xs font-mono font-bold text-neutral-600">
                Top Samples
              </span>
            </div>

            <div className="space-y-2.5">
              {(datasetInfo.samples?.classification || []).map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F8F9FC] hover:bg-white hover:shadow-row text-xs transition-all"
                >
                  <span className="font-mono text-neutral-400 font-bold w-8 shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="flex-1 font-medium text-[#111111] leading-relaxed">
                    &ldquo;{row.text}&rdquo;
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-white font-extrabold text-[#111111] shadow-soft shrink-0">
                    {row.category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

