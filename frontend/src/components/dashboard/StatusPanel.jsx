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
      {/* Prominent Solid Dark Status Card */}
      <div className="bg-[#0B0F19] text-white rounded-[28px] p-6 sm:p-7 shadow-lg border border-slate-800 text-center space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-400 text-[11px] font-semibold tracking-wide uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Pipeline
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white pt-1">
            Status Produksi Bordir
          </h3>
          <p className="text-xs font-medium text-slate-300">
            {inProgressCount} Pesanan Sedang Berjalan
          </p>
        </div>

        {/* Thick Modern Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-white/15 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 via-teal-300 to-white rounded-full transition-all duration-500 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 font-medium px-1">
            <span>Progres Antrean</span>
            <span className="font-bold text-white">{progressPercent}%</span>
          </div>
        </div>

        <div className="pt-1 pb-1 border-t border-white/10">
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
          className="w-full py-3 px-5 rounded-2xl bg-white hover:bg-slate-100 text-[#0B0F19] font-bold text-xs tracking-tight transition-all shadow-md active:scale-[0.99]"
        >
          {isProduksi ? "Buka Kanban Produksi →" : "+ Ekstrak Chat Order Baru"}
        </button>
      </div>

      {/* Middle Card: Antrean Produksi Aktif */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Antrean Produksi Aktif
            </h3>
            <p className="text-[11px] text-slate-400">
              Klik kartu untuk memajukan tahap
            </p>
          </div>
          <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
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
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/40 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {ord.customer_name}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {firstItem.product_type || ord.category} •{" "}
                        <span className="text-indigo-600 font-medium">
                          {ord.status} → {nextStage}
                        </span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-700 shrink-0 bg-slate-100 px-2 py-1 rounded-lg">
                    {firstItem.quantity || 1} Pcs
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Bottom Card: Kartu Ucapan & Katalog AI */}
      <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
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
                className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      Kartu: {ord.greeting_occasion || "Spesial"}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {copiedId === ord.id
                        ? "✓ Berhasil disalin!"
                        : `Untuk: ${ord.greeting_recipient || ord.customer_name}`}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-lg shrink-0">
                  Salin
                </span>
              </div>
            ))}

          <div
            onClick={() => {
              setActiveTab("rag");
              if (!ragResult) handleAskRAG();
            }}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/40 cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800">
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

