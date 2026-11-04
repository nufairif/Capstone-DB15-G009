import React from "react";
import { Edit3, Trash2, ArrowRight, CheckCircle2, Search, X } from "lucide-react";
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

  return (
    <div className="page-transition space-y-6">
      {/* Active Search Filter Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-600">
              Menampilkan hasil pencarian untuk:{" "}
              <strong className="text-slate-900">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 font-mono text-[10px] text-slate-600 font-bold">
              {orders.length} pesanan
            </span>
          </div>
          {setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
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
                ? "bg-[#0B0F19] text-white border-[#0B0F19] shadow-sm"
                : "bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 shadow-sm"
            }`}
          >
            Semua Tahap
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border flex items-center gap-1.5 ${
                filterStatus === s
                  ? "bg-[#0B0F19] text-white border-[#0B0F19] shadow-sm"
                  : "bg-white text-slate-600 border-slate-200/80 hover:border-slate-300 shadow-sm"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${STAGE_DOT_COLORS[s] || "bg-slate-400"}`} />
              <span>{s === "Design/Preparation" ? "Design" : s}</span>
            </button>
          ))}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-full bg-white border border-slate-200/80 text-xs font-bold text-slate-700 shadow-sm focus:outline-none focus:border-slate-900"
        >
          <option value="ALL">Semua Kategori AI</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* 4-Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {STATUS_FLOW.map((stage, stageIdx) => {
          const stageOrders = orders.filter((o) => o.status === stage);
          const nextStage = STATUS_FLOW[stageIdx + 1];

          return (
            <div
              key={stage}
              className="bg-slate-100/70 border border-slate-200/70 rounded-[28px] p-3.5 sm:p-4 flex flex-col min-h-[500px] space-y-3.5"
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${STAGE_DOT_COLORS[stage] || "bg-slate-400"}`} />
                  <span className="text-xs font-bold text-slate-900">
                    {stage === "Design/Preparation" ? "Desain / Persiapan" : stage}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200/70 shadow-sm text-[11px] font-bold text-slate-700">
                  {stageOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {stageOrders.length === 0 ? (
                  <div className="h-28 rounded-2xl border-2 border-dashed border-slate-200/80 flex items-center justify-center text-[11px] font-semibold text-slate-400">
                    Belum ada pesanan
                  </div>
                ) : (
                  stageOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-[22px] border border-slate-200/80 p-4 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-3 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-slate-400">
                          {ord.order_code}
                        </span>
                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleStartEditOrder(ord)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-900 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
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
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-[10px] font-semibold text-slate-600">
                          {ord.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {(ord.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs space-y-0.5"
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
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0B0F19] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.99] transition-all"
                        >
                          <span>Ke {nextStage === "Design/Preparation" ? "Design" : nextStage}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai Diproduksi</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
