import React from "react";
import { ChevronsUpDown } from "lucide-react";
import { STATUS_PILL } from "../../constants";

export default function OrderHistoryTable({
  orders,
  setActiveTab,
  handleStartEditOrder,
}) {
  return (
    <div className="apple-glass-card rounded-[32px] p-6 sm:p-7 relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Riwayat & Pelacakan Pesanan
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Daftar pesanan aktif dan selesai dari seluruh kanal WhatsApp & Tokopedia
          </p>
        </div>
        <button
          onClick={() => setActiveTab("orders")}
          className="text-xs font-bold text-slate-800 hover:text-black apple-glass-pill hover:bg-white px-3.5 py-1.5 rounded-full transition-all shadow-sm"
        >
          Lihat Kanban Lengkap →
        </button>
      </div>

      {/* Table Header & Rows with Horizontal Scroll Safeguard */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[620px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-slate-200/40 backdrop-blur-md rounded-2xl text-xs font-semibold text-slate-500 mb-2 border border-white/60">
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

                return (
                  <div
                    key={ord.id}
                    onClick={() => handleStartEditOrder(ord)}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 rounded-2xl text-xs cursor-pointer transition-all apple-glass-pill hover:bg-white/95 hover:shadow-md hover:scale-[1.005] group"
                  >
                    <div className="col-span-3 font-mono font-semibold text-slate-700 group-hover:text-black">
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
                        className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
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

