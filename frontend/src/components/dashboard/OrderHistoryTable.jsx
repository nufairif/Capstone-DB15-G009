import React from "react";
import { ChevronsUpDown } from "lucide-react";
import { STATUS_PILL } from "../../constants";

export default function OrderHistoryTable({
  orders,
  setActiveTab,
  handleStartEditOrder,
}) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-7 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            Riwayat & Pelacakan Pesanan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar pesanan aktif dan selesai dari seluruh kanal WhatsApp
          </p>
        </div>
        <button
          onClick={() => setActiveTab("orders")}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100/70 px-3.5 py-1.5 rounded-xl transition-colors"
        >
          Lihat Kanban Lengkap →
        </button>
      </div>

      {/* Table Header & Rows with Horizontal Scroll Safeguard */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[620px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-50/80 rounded-xl text-xs font-semibold text-slate-500 mb-2">
            <div className="col-span-3 flex items-center gap-1">
              <span>Kode Order</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="col-span-3 flex items-center gap-1">
              <span>Pelanggan</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>Kategori AI</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>Status</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <span>Volume</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Tidak ada riwayat pesanan yang sesuai dengan filter atau pencarian.
              </div>
            ) : (
              orders.slice(0, 5).map((ord, idx) => {
                const totalQty = (ord.items || []).reduce(
                  (s, i) => s + (Number(i.quantity) || 1),
                  0
                );
                const isFirst = idx === 0;

                return (
                  <div
                    key={ord.id}
                    onClick={() => handleStartEditOrder(ord)}
                    className={`grid grid-cols-12 gap-3 items-center px-4 py-3.5 rounded-2xl text-xs cursor-pointer transition-all border ${
                      isFirst
                        ? "bg-slate-50/50 border-slate-200/90 hover:bg-slate-100/70"
                        : "bg-white border-transparent hover:border-slate-200 hover:bg-slate-50/60"
                    }`}
                  >
                    <div className="col-span-3 font-mono font-medium text-slate-600">
                      {ord.order_code}
                    </div>
                    <div className="col-span-3 font-semibold text-slate-900 truncate">
                      {ord.customer_name}
                    </div>
                    <div className="col-span-2 text-slate-500 truncate">
                      {ord.category}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                          STATUS_PILL[ord.status] || STATUS_PILL.New
                        }`}
                      >
                        {ord.status === "Design/Preparation"
                          ? "Design"
                          : ord.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-bold text-slate-900">
                      {totalQty} Pcs
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

