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
  return (
    <div className="page-transition space-y-7">
      {/* Active Search Filter Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white shadow-soft text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Menampilkan hasil pencarian untuk:{" "}
              <strong className="text-black">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#F4F5F9] font-mono text-[10px] text-neutral-500 font-bold">
              {orders.length} pesanan
            </span>
          </div>
          {setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
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
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              filterStatus === "ALL"
                ? "bg-[#0A0A0A] text-white shadow-sm"
                : "bg-white text-neutral-500 hover:text-black shadow-soft"
            }`}
          >
            Semua Tahap
          </button>
          {STATUS_FLOW.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
                filterStatus === s
                  ? "bg-[#0A0A0A] text-white shadow-sm"
                  : "bg-white text-neutral-500 hover:text-black shadow-soft"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 rounded-full bg-white text-xs font-bold text-neutral-700 shadow-soft focus:outline-none"
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
              className="bg-white/60 rounded-[28px] p-4 flex flex-col min-h-[460px] space-y-3.5"
            >
              <div className="flex items-center justify-between px-2 pt-1">
                <span className="text-xs font-extrabold text-[#111111]">
                  {stage}
                </span>
                <span className="w-6 h-6 rounded-full bg-white shadow-soft text-[11px] font-bold flex items-center justify-center">
                  {stageOrders.length}
                </span>
              </div>

              <div className="space-y-3 flex-1">
                {stageOrders.length === 0 ? (
                  <div className="h-28 rounded-2xl border-2 border-dashed border-neutral-200/60 flex items-center justify-center text-[11px] font-bold text-neutral-400">
                    Kosong
                  </div>
                ) : (
                  stageOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="bg-white rounded-[22px] p-4 shadow-soft space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-neutral-400">
                          {ord.order_code}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStartEditOrder(ord)}
                            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-black"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(ord.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-600"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="font-extrabold text-sm text-[#111111]">
                          {ord.customer_name}
                        </p>
                        <span className="inline-block mt-1 px-2.5 py-0.5 rounded-lg bg-[#F4F5F9] text-[10px] font-bold text-neutral-600">
                          {ord.category}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {(ord.items || []).map((it, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl bg-[#F8F9FC] text-xs space-y-0.5"
                          >
                            <p className="font-bold text-[#111111]">
                              {it.quantity}× {it.product_type} ({it.color || "-"})
                            </p>
                            {it.custom_text && (
                              <p className="text-[11px] text-neutral-500">
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
                          className="w-full py-2.5 px-3 rounded-xl bg-[#0A0A0A] hover:bg-neutral-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                        >
                          <span>Ke {nextStage}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="w-full py-2 px-3 rounded-xl bg-[#E7F8EE] text-[#16A34A] text-xs font-bold flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Selesai</span>
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
