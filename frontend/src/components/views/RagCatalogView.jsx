import React from "react";
import { inputSoftClass } from "../../constants";

export default function RagCatalogView({
  handleAskRAG,
  ragQuery,
  setRagQuery,
  ragLoading,
  ragResult,
}) {
  return (
    <div className="page-transition max-w-4xl mx-auto w-full space-y-6">
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Asisten Katalog, Harga & SOP Bordir (Local RAG)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pencarian vektor lokal ke 75 dokumen Knowledge Base Toko Firaza
          </p>
        </div>

        <form onSubmit={handleAskRAG} className="flex gap-3">
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="Tanyakan ukuran handuk, harga hampers, warna benang bordir, atau SOP..."
            className={inputSoftClass}
          />
          <button
            type="submit"
            disabled={ragLoading}
            className="px-6 py-3 rounded-2xl bg-[#0B0F19] hover:bg-slate-800 text-white font-bold text-xs shrink-0 shadow-md active:scale-[0.99] transition-all disabled:opacity-60"
          >
            {ragLoading ? "Mencari Vektor..." : "Tanya RAG"}
          </button>
        </form>

        <div className="space-y-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pertanyaan Rekomendasi:
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Ukuran handuk custom dewasa berapa cm dan pilihan warnanya apa aja?",
              "Berapa harga Paket Hampers Wedding Couple Handuk?",
              "Rekomendasi benang bordir untuk produk warna Navy apa?",
              "Bagaimana garansi jika terjadi kesalahan ejaan bordir?",
            ].map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setRagQuery(q);
                  handleAskRAG(null, q);
                }}
                className="text-xs px-3.5 py-2 rounded-xl bg-slate-50/80 hover:bg-[#0B0F19] hover:text-white text-slate-700 border border-slate-200/70 font-medium transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ragResult && (
        <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="p-5 sm:p-6 rounded-[24px] bg-[#0B0F19] text-white border border-slate-800 shadow-md space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Jawaban Sintesis Asisten RAG
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-100">{ragResult.answer}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-900">
              Dokumen Referensi Terambil (Vector Similarity):
            </p>
            <div className="space-y-2.5">
              {(ragResult.retrieved_documents || []).map((doc) => (
                <div
                  key={doc.doc_id}
                  className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-xs space-y-1.5"
                >
                  <div className="flex justify-between font-bold text-slate-900">
                    <span className="text-slate-800">
                      [{doc.doc_id}] {doc.title}
                    </span>
                    <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono text-[11px]">
                      Similarity: {doc.similarity_score}
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">{doc.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

