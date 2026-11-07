import React from "react";
import { Clock, Gift, HelpCircle } from "lucide-react";
import { STATUS_FLOW } from "../../constants";

export default function StatusPanel({
  inProgressCount,
  progressPercent,
  isProduksi,
  setActiveTab,
  setEditingOrderId,
  orders,
  handleAdvanceStatus,
  handleCopyText,
  copiedId,
  ragResult,
  handleAskRAG,
}) {
  return (
    <div className="col-span-12 xl:col-span-4 space-y-6">
      {/* Bento Apple Dark Glass Status Card */}
      <div className="apple-glass-dark rounded-[32px] p-6 sm:p-7 text-center space-y-5 relative overflow-hidden">
        {/* Subtle emerald radial glow in background */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="space-y-1.5 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold tracking-wide uppercase backdrop-blur-md shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Pipeline
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white pt-1">
            Status Produksi Bordir
          </h3>
          <p className="text-xs font-medium text-slate-300">
            {inProgressCount} Pesanan Sedang Diproses
          </p>
        </div>

        {/* Thick Apple Style Glowing Progress Bar */}
        <div className="space-y-2 relative z-10">
          <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/10 backdrop-blur-sm">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-white rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(52,211,153,0.4)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium px-1">
            <span>Kapasitas Antrean</span>
            <span className="font-bold text-white font-mono">{progressPercent}%</span>
          </div>
        </div>

        <div className="pt-2 pb-1 border-t border-white/10 relative z-10">
          <p className="text-xs font-semibold text-white">
            Estimasi Selesai: 1–2 Hari Kerja
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Otomatisasi Ekstraksi AI & Klasifikasi SVM
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (isProduksi) {
              setActiveTab("orders");
            } else {
              setEditingOrderId(null);
              setActiveTab("create-order");
            }
          }}
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-slate-100 text-zinc-950 font-bold text-xs tracking-tight transition-all shadow-[0_4px_20px_rgba(255,255,255,0.25)] active:scale-[0.98] relative z-10"
        >
          {isProduksi ? "Buka Kanban Produksi →" : "+ Ekstrak Chat Order Baru"}
        </button>
      </div>

      {/* Middle Bento Card: Antrean Produksi Aktif */}
      <div className="apple-glass-card rounded-[32px] p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              Antrean Produksi Aktif
            </h3>
            <p className="text-[11px] text-slate-400">
              Klik kartu untuk memajukan tahap
            </p>
          </div>
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
            {orders.filter((o) => o.status !== "Completed").length} Aktif
          </span>
        </div>

        <div className="space-y-2.5">
          {orders
            .filter((o) => o.status !== "Completed")
            .slice(0, 3)
            .map((ord) => {
              const stageIdx = STATUS_FLOW.indexOf(ord.status);
              const nextStage = STATUS_FLOW[stageIdx + 1] || "Completed";
              const firstItem = (ord.items && ord.items[0]) || {};

              return (
                <div
                  key={ord.id}
                  onClick={() => handleAdvanceStatus(ord.id, nextStage)}
                  title={`Klik untuk memindahkan ke tahap ${nextStage}`}
                  className="apple-glass-pill p-3 rounded-2xl hover:bg-white/95 border border-white/80 cursor-pointer transition-all group flex items-center justify-between gap-3 shadow-sm"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-105 transition-transform">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 truncate">
                        {ord.customer_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {firstItem.product_type || ord.category} •{" "}
                        <span className="text-indigo-600 font-semibold">
                          {ord.status} → {nextStage}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0 bg-slate-100/80 px-2.5 py-1 rounded-lg">
                    {firstItem.quantity || 1} Pcs
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Bento Card: Kartu Ucapan & Asisten RAG */}
      <div className="apple-glass-card rounded-[32px] p-6 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">
            Kartu Ucapan & Asisten RAG
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Draf ucapan AI & pencarian katalog bordir
          </p>
        </div>

        <div className="space-y-2.5">
          {orders
            .filter((o) => o.greeting_card_requested)
            .slice(0, 2)
            .map((ord) => (
              <div
                key={ord.id}
                onClick={() =>
                  handleCopyText(ord.greeting_draft || "", ord.id)
                }
                className="apple-glass-pill p-3 rounded-2xl hover:bg-white/95 border border-white/80 cursor-pointer transition-all group flex items-center justify-between gap-3 shadow-sm"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shrink-0 group-hover:scale-105 transition-transform">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">
                      Kartu: {ord.greeting_occasion || "Spesial"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {copiedId === ord.id
                        ? "✓ Berhasil disalin!"
                        : `Untuk: ${ord.greeting_recipient || ord.customer_name}`}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg shrink-0">
                  Salin
                </span>
              </div>
            ))}

          <div
            onClick={() => {
              setActiveTab("rag");
              if (!ragResult) handleAskRAG();
            }}
            className="apple-glass-pill p-3 rounded-2xl hover:bg-white/95 border border-white/80 cursor-pointer transition-all group flex items-center justify-between gap-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-900">
                  Tanya Katalog Bordir (RAG)
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  75 SKU, Benang, & SOP Jahit
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform">
              Buka →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

