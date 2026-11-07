import React from "react";
import { Edit3, Trash2, ArrowRight, CheckCircle2, Search, X, ChevronDown } from "lucide-react";
import { STATUS_FLOW, CATEGORIES } from "../../constants";

export default function OrdersView({
  orders,
  filterStatus,
  setFilterStatus,
  filterCategory,
  setFilterCategory,
  handleStartEditOrder,
  handleDeleteOrder,
  handleAdvanceStatus,
  searchQuery = "",
  setSearchQuery,
}) {
  const STAGE_DOT_COLORS = {
    New: "bg-sky-500",
    "Design/Preparation": "bg-amber-500",
    Production: "bg-indigo-500",
    Completed: "bg-emerald-500",
  };

  const STAGE_LABELS = {
    New: "Pesanan Baru",
    "Design/Preparation": "Setting Desain",
    Production: "Proses Bordir",
    Completed: "Siap Kirim",
  };

  const STAGE_ACTION_LABELS = {
    "Design/Preparation": "Mulai Desain",
    Production: "Kirim ke Bordir",
    Completed: "Tandai Selesai",
  };

  return (
    <div className="page-transition space-y-6">
      {/* Active Search Filter Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl apple-glass-card border border-white/80 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">
              Menampilkan hasil pencarian untuk:{" "}
              <strong className="text-slate-900">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full apple-glass-pill font-mono text-[10px] text-slate-700 font-bold border border-white/80">
              {orders.length} pesanan
            </span>
          </div>
          {setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Pencarian</span>
            </button>
          )}
        </div>
      )}

      {/* Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("ALL")}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
              filterStatus === "ALL"
                ? "bg-slate-950 text-white border-slate-950 shadow-md"
                : "apple-glass-pill hover:bg-white text-slate-700 border-white/80 shadow-sm"
            }`}
          >
            Semua
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                filterStatus === s
                  ? "bg-slate-950 text-white border-slate-950 shadow-md"
                  : "apple-glass-pill hover:bg-white text-slate-700 border-white/80 shadow-sm"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT_COLORS[s] || "bg-slate-400"}`} />
              <span>{STAGE_LABELS[s] || s}</span>
            </button>
          ))}
        </div>

        <div className="relative inline-flex items-center">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2 rounded-full apple-glass-pill text-xs font-bold text-slate-700 hover:text-slate-950 hover:bg-white border border-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 cursor-pointer transition-all"
          >
            <option value="ALL">Semua Kategori</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* 4-Column Apple Bento Glass Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUS_FLOW.map((stage, stageIdx) => {
          const stageOrders = orders.filter((o) => o.status === stage);
          const stageTotalPcs = stageOrders.reduce(
            (acc, o) => acc + (o.items || []).reduce((s, it) => s + (Number(it.quantity) || 1), 0),
            0
          );
          const nextStage = STATUS_FLOW[stageIdx + 1];

          return (
            <div
              key={stage}
              className="apple-glass rounded-[32px] p-3.5 sm:p-4 flex flex-col min-h-[520px] space-y-3.5 border border-white/70 shadow-sm"
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STAGE_DOT_COLORS[stage] || "bg-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-900 tracking-tight">
                    {STAGE_LABELS[stage] || stage}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full apple-glass-pill text-[10px] font-bold text-slate-700 border border-white/80 shadow-xs">
                  {stageOrders.length} Order • {stageTotalPcs} Pcs
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {stageOrders.length === 0 ? (
                  <div className="h-32 rounded-2xl border-2 border-dashed border-slate-300/60 flex items-center justify-center text-[11px] font-semibold text-slate-400">
                    Belum ada pesanan
                  </div>
                ) : (
                  stageOrders.map((ord) => {
                    const ordPcs = (ord.items || []).reduce(
                      (s, it) => s + (Number(it.quantity) || 1),
                      0
                    );
                    return (
                    <div
                      key={ord.id}
                      className="apple-glass-card rounded-[24px] p-4 space-y-3 relative group transition-all duration-200 border border-white/80"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-400">
                            {ord.order_code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/5 text-slate-700 font-bold text-[10px] border border-slate-200/50">
                            {ordPcs} Pcs
                          </span>
                        </div>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEditOrder(ord)}
                            className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-slate-900 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="font-bold text-sm text-slate-900">
                          {ord.customer_name}
                        </p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full apple-glass-pill text-[10px] font-semibold text-slate-600 border border-white/70">
                          {ord.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {(ord.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl apple-glass-pill text-xs space-y-0.5 border border-white/60"
                          >
                            <p className="font-semibold text-slate-800">
                              {it.quantity}× {it.product_type} ({it.color || "-"})
                            </p>
                            {it.custom_text && (
                              <p className="text-[11px] text-slate-500">
                                Bordir: &ldquo;{it.custom_text}&rdquo; •{" "}
                                {it.font_style || "Std"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {nextStage ? (
                        <button
                          onClick={() => handleAdvanceStatus(ord.id, nextStage)}
                          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-black/10 active:scale-[0.98] transition-all"
                        >
                          <span>{STAGE_ACTION_LABELS[nextStage] || `Lanjut ke ${STAGE_LABELS[nextStage] || nextStage}`}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Siap Dikirim</span>
                        </div>
                      )}
                    </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
