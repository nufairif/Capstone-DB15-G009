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
      <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 space-y-5 relative overflow-hidden">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Asisten Katalog, Harga & SOP Bordir (Local RAG)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Pencarian vektor lokal (FAISS + Neural Embedding all-MiniLM-L6-v2 + Llama 3.2 3B On-Premise) ke 75 dokumen Knowledge Base Toko Firaza
          </p>
        </div>

        <form onSubmit={handleAskRAG} className="flex gap-3">
          <input
            type="text"
            value={ragQuery}
            onChange={(e) => setRagQuery(e.target.value)}
            placeholder="Tanyakan ukuran handuk, harga hampers, warna benang bordir, atau SOP..."
            className={`${inputSoftClass} rounded-2xl`}
          />
          <button
            type="submit"
            disabled={ragLoading}
            className="px-7 py-3 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shrink-0 shadow-lg shadow-black/10 active:scale-[0.99] transition-all disabled:opacity-60"
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
                className="text-xs px-4 py-2.5 rounded-2xl apple-glass-pill hover:bg-white text-slate-700 font-medium transition-all text-left border border-white/80 shadow-xs hover:shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {ragResult && (
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 space-y-6 relative overflow-hidden">
          <div className="apple-glass-dark text-white rounded-[28px] p-6 space-y-3 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                  Jawaban Sintesis Asisten RAG
                </span>
              </div>
              {ragResult.meta && (
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-200 font-mono">
                    Vector DB: {ragResult.meta.vector_db_backend || "faiss-cpu-IndexFlatIP"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-slate-200 font-mono">
                    Embedding: {ragResult.meta.embedding_model || "all-minilm (all-MiniLM-L6-v2)"}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-mono">
                    LLM: {ragResult.meta.generation_model || "llama3.2:3b"}{" "}
                    {ragResult.meta.used_on_premise_llm ? "(Ollama On-Premise)" : "(Offline Fallback)"}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm leading-relaxed text-slate-100">{ragResult.answer}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-900 tracking-tight">
              Dokumen Referensi Terambil (FAISS Vector Similarity):
            </p>
            <div className="space-y-2.5">
              {(ragResult.retrieved_documents || []).map((doc) => (
                <div
                  key={doc.doc_id}
                  className="p-4 rounded-2xl apple-glass-pill text-xs space-y-1.5 border border-white/80"
                >
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span className="text-slate-800">
                      [{doc.doc_id}] {doc.title}
                    </span>
                    <span className="text-emerald-700 bg-emerald-500/15 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
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
