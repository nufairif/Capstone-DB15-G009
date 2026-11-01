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
      <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-5">
        <div>
          <h2 className="text-base font-extrabold text-[#111111]">
            Asisten Katalog, Harga & SOP Bordir (Local RAG)
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
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
            className="px-6 py-3 rounded-2xl bg-[#0A0A0A] text-white font-bold text-xs shrink-0"
          >
            {ragLoading ? "Mencari..." : "Tanya RAG"}
          </button>
        </form>

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
              className="text-xs px-3.5 py-2 rounded-xl bg-[#F8F9FC] hover:bg-[#0A0A0A] hover:text-white text-neutral-600 font-medium transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {ragResult && (
        <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-5">
          <div className="p-5 rounded-3xl bg-[#0A0A0A] text-white space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#22C55E]">
              Jawaban Sistem RAG
            </span>
            <p className="text-sm leading-relaxed">{ragResult.answer}</p>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-extrabold text-[#111111]">
              Dokumen Referensi Terambil (Vector Similarity):
            </p>
            {(ragResult.retrieved_documents || []).map((doc) => (
              <div
                key={doc.doc_id}
                className="p-4 rounded-2xl bg-[#F8F9FC] text-xs space-y-1"
              >
                <div className="flex justify-between font-bold text-[#111111]">
                  <span>
                    [{doc.doc_id}] {doc.title}
                  </span>
                  <span className="text-[#16A34A]">
                    Score: {doc.similarity_score}
                  </span>
                </div>
                <p className="text-neutral-500">{doc.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

