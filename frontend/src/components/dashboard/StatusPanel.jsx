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
    <div className="col-span-12 xl:col-span-4 space-y-7">
      {/* Prominent Solid Black Status Card */}
      <div className="bg-[#0A0A0A] text-white rounded-[30px] p-7 shadow-xl text-center space-y-5">
        <div className="space-y-1">
          <h3 className="text-lg font-extrabold tracking-tight">
            Status Produksi Bordir
          </h3>
          <p className="text-xs font-medium text-neutral-300">
            {inProgressCount} Pesanan Sedang Diproses
          </p>
        </div>

        {/* Thick White Progress Bar Inside Dark Track */}
        <div className="w-full h-3.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="space-y-0.5">
          <p className="text-xs font-bold text-white">
            Estimasi Penyelesaian Bordir
          </p>
          <p className="text-[11px] text-neutral-400">
            1–2 hari kerja • Pipeline AI Aktif
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
          className="w-full py-3.5 px-5 rounded-2xl bg-white hover:bg-neutral-100 text-[#0A0A0A] font-extrabold text-xs tracking-tight transition-all shadow-sm"
        >
          {isProduksi ? "Lihat Kanban Produksi →" : "+ Ekstrak Chat Order AI"}
        </button>
      </div>

      {/* Middle Section: "Antrean Produksi Aktif" */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#111111]">
            Antrean Produksi Aktif
          </h3>
          <span className="text-[11px] font-bold text-neutral-400">
            Klik untuk majukan
          </span>
        </div>

        <div className="space-y-3.5">
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
                  className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-soft cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center text-[#111111] shrink-0 group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-[#111111] truncate">
                        {ord.customer_name} •{" "}
                        {firstItem.product_type || ord.category}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {firstItem.custom_text
                          ? `Bordir: "${firstItem.custom_text}"`
                          : `Tahap: ${ord.status}`}{" "}
                        → {nextStage}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-[#111111] shrink-0">
                    {firstItem.quantity || 1} Pcs
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      <div className="border-t border-neutral-200/70" />

      {/* Bottom Section: "Kartu Ucapan & Katalog AI" */}
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-[#111111]">
            Kartu Ucapan & Katalog AI
          </h3>
          <p className="text-[11px] font-medium text-neutral-400 mt-0.5">
            Draf siap cetak & referensi RAG lokal
          </p>
        </div>

        <div className="space-y-3.5">
          {orders
            .filter((o) => o.greeting_card_requested)
            .slice(0, 2)
            .map((ord) => (
              <div
                key={ord.id}
                onClick={() =>
                  handleCopyText(ord.greeting_draft || "", ord.id)
                }
                className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-soft cursor-pointer transition-all"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center text-[#111111] shrink-0">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-[#111111] truncate">
                      Kartu: {ord.greeting_occasion || "Spesial"}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {copiedId === ord.id
                        ? "✓ Teks ucapan berhasil disalin!"
                        : `Untuk: ${ord.greeting_recipient || ord.customer_name}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-extrabold text-[#111111] shrink-0">
                  Salin
                </span>
              </div>
            ))}

          <div
            onClick={() => {
              setActiveTab("rag");
              if (!ragResult) handleAskRAG();
            }}
            className="flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-white hover:shadow-soft cursor-pointer transition-all"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-white shadow-soft flex items-center justify-center text-[#111111] shrink-0">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#111111]">
                  Tanya Katalog & SOP (RAG)
                </p>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  75 Dokumen SKU, Harga & Benang
                </p>
              </div>
            </div>
            <span className="text-xs font-extrabold text-[#111111]">
              Buka →
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

