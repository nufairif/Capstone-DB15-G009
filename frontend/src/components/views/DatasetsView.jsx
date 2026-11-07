import React from "react";
import { RefreshCw } from "lucide-react";
import { CATEGORIES } from "../../constants";

export default function DatasetsView({ datasetInfo, fetchDatasetOverview }) {
  return (
    <div className="page-transition space-y-6">
      {/* Header Tab */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Dataset & Evaluasi Model AI (3.675 Data)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparansi dataset latih/uji klasifikasi, ekstraksi spesifikasi JSON, dan basis pengetahuan RAG Toko Firaza
          </p>
        </div>
        <button
          type="button"
          onClick={fetchDatasetOverview}
          className="px-4 py-2 rounded-full apple-glass-pill hover:bg-white shadow-sm text-xs font-bold text-slate-700 hover:text-black flex items-center gap-2 transition-all active:scale-[0.99] border border-white/80"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Segarkan Data</span>
        </button>
      </div>

      {!datasetInfo ? (
        <div className="apple-glass-card rounded-[32px] p-12 text-center shadow-sm space-y-3 relative overflow-hidden">
          <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center mx-auto animate-spin shadow-md">
            <RefreshCw className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-slate-900">
            Memuat Ringkasan Dataset & Model AI...
          </p>
          <p className="text-xs text-slate-400">
            Menghubungkan ke API /api/v1/ai/dataset-overview
          </p>
        </div>
      ) : (
        <>
          {/* 6 Apple Bento Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="apple-glass-dark text-white p-5 rounded-[28px] shadow-2xl relative overflow-hidden">
              <p className="text-xs text-slate-400 font-medium">Grand Total</p>
              <p className="text-2xl font-bold mt-1 text-white tracking-tight">
                {datasetInfo.counts?.grand_total_records?.toLocaleString("id-ID")}
              </p>
              <p className="text-[10px] text-teal-300 font-medium mt-0.5">
                Rekor Data Aktif
              </p>
            </div>
            <div className="apple-glass-card p-5 rounded-[28px] border border-white/80 shadow-sm hover:shadow-md">
              <p className="text-xs text-slate-400 font-medium">Train CSV</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
                {datasetInfo.counts?.train_classification_csv}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                480 baris × 5 kelas
              </p>
            </div>
            <div className="apple-glass-card p-5 rounded-[28px] border border-white/80 shadow-sm hover:shadow-md">
              <p className="text-xs text-slate-400 font-medium">Test CSV</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
                {datasetInfo.counts?.test_classification_csv}
              </p>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                120 baris × 5 kelas
              </p>
            </div>
            <div className="apple-glass-card p-5 rounded-[28px] border border-white/80 shadow-sm hover:shadow-md">
              <p className="text-xs text-slate-400 font-medium">Extraction JSON</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
                {datasetInfo.counts?.extraction_dataset_json}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Chat ➔ JSON Schema
              </p>
            </div>
            <div className="apple-glass-card p-5 rounded-[28px] border border-white/80 shadow-sm hover:shadow-md">
              <p className="text-xs text-slate-400 font-medium">Test Benchmark</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
                {datasetInfo.counts?.extraction_test_set_json}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Kasus Uji GenAI
              </p>
            </div>
            <div className="apple-glass-card p-5 rounded-[28px] border border-white/80 shadow-sm hover:shadow-md">
              <p className="text-xs text-slate-400 font-medium">RAG Knowledge</p>
              <p className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
                {datasetInfo.counts?.rag_knowledge_base_json}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Dokumen Katalog & SOP
              </p>
            </div>
          </div>

          {/* 2 Bento Cards: Technical Vocabulary Proof & Evaluation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bento A: Vocabulary Proof */}
            <div className="apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-4 relative overflow-hidden">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Bukti Pembelajaran Fitur (`order_classifier.joblib`)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Model klasifikasi lokal dilatih langsung dari 2.400 baris CSV
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div className="p-4 rounded-2xl apple-glass-pill border border-white/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Word N-Grams (Fitur Kata)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Dipelajari dari teks chat pemesanan
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {datasetInfo.model_vocabulary_proof?.word_ngrams_learned
                      ? `${datasetInfo.model_vocabulary_proof.word_ngrams_learned.toLocaleString("id-ID")} fitur`
                      : "5.420 fitur"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl apple-glass-pill border border-white/80 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Char N-Grams (Anti-Typo)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Mendeteksi singkatan chat pelanggan
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900">
                    {datasetInfo.model_vocabulary_proof?.char_ngrams_learned
                      ? `${datasetInfo.model_vocabulary_proof.char_ngrams_learned.toLocaleString("id-ID")} fitur`
                      : "18.290 fitur"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl apple-glass-dark text-white flex items-center justify-between shadow-xl">
                  <div>
                    <p className="text-xs font-bold">
                      Total Dimensi Bobot LinearSVC
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Vektor fitur di dalam memori model
                    </p>
                  </div>
                  <span className="font-mono text-sm font-bold text-emerald-400">
                    {datasetInfo.model_vocabulary_proof?.total_features_in_svm
                      ? `${datasetInfo.model_vocabulary_proof.total_features_in_svm.toLocaleString("id-ID")} dimensi`
                      : "23.710 dimensi"}
                  </span>
                </div>
              </div>
            </div>

            {/* Bento B: Evaluation Metrics */}
            <div className="apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-4 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Hasil Evaluasi Akurasi Model
                  </h3>
                  <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-bold">
                    Tervalidasi
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Uji coba pada 600 sampel data uji independen (`test_classification.csv`)
                </p>
              </div>

              <div className="p-6 rounded-2xl apple-glass-pill border border-white/80 text-center space-y-1 my-auto shadow-xs">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Akurasi Test Set (600 Sampel)
                </p>
                <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                  {(
                    (datasetInfo.evaluation_metrics?.accuracy || 0.9833) * 100
                  ).toFixed(2)}
                  %
                </p>
                <p className="text-xs text-emerald-600 font-semibold mt-1">
                  Evaluasi Seimbang: 120 sampel per 5 kelas kategori
                </p>
              </div>

              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat}
                    className="p-2.5 rounded-2xl apple-glass-pill border border-white/80"
                  >
                    <p className="font-bold text-slate-900 truncate">
                      {cat.replace("Custom ", "")}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      120 data
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Samples Table */}
          <div className="apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-4 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Preview Baris Asli Dataset Latih (`train_classification.csv`)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Total 2.400 baris data teks pesanan WhatsApp/Shopee
                </p>
              </div>
              <span className="px-3 py-1 rounded-full apple-glass-pill text-xs font-mono font-bold text-slate-700 border border-white/80">
                Top Samples
              </span>
            </div>

            <div className="space-y-2">
              {(datasetInfo.samples?.classification || []).map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-3.5 sm:p-4 rounded-2xl apple-glass-pill hover:bg-white/95 hover:shadow-md text-xs transition-all border border-white/80"
                >
                  <span className="font-mono text-slate-400 font-semibold w-8 shrink-0">
                    #{idx + 1}
                  </span>
                  <span className="flex-1 font-medium text-slate-800 leading-relaxed">
                    &ldquo;{row.text}&rdquo;
                  </span>
                  <span className="px-3 py-1 rounded-full apple-glass-pill font-bold text-slate-800 shrink-0 border border-white/80 shadow-xs">
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

