import React from "react";
import { ChevronsUpDown } from "lucide-react";
import { STATUS_PILL } from "../../constants";

export default function OrderHistoryTable({
  orders,
  setActiveTab,
  handleStartEditOrder,
}) {
  return (
    <div className="bg-white/60 rounded-[28px] p-7">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-extrabold text-[#111111]">
          Riwayat & Pelacakan Pesanan
        </h2>
        <button
          onClick={() => setActiveTab("orders")}
          className="text-xs font-bold text-neutral-500 hover:text-[#111111]"
        >
          Lihat Kanban Lengkap →
        </button>
      </div>

      {/* Table Header & Rows with Horizontal Scroll Safeguard */}
      <div className="overflow-x-auto pb-2 -mx-2 px-2">
        <div className="min-w-[580px]">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-2.5 text-xs font-bold text-neutral-500">
            <div className="col-span-3 flex items-center gap-1">
              <span>Kode Order</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="col-span-3 flex items-center gap-1">
              <span>Pelanggan</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>Kategori AI</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="col-span-2 flex items-center gap-1">
              <span>Status</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
            <div className="col-span-2 text-right flex items-center justify-end gap-1">
              <span>Volume</span>
              <ChevronsUpDown className="w-3.5 h-3.5 text-neutral-400" />
            </div>
          </div>

          {/* Table Rows */}
          <div className="space-y-2.5 mt-1">
            {orders.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                Tidak ada riwayat pesanan yang sesuai dengan filter atau pencarian.
              </div>
            ) : (
              orders.slice(0, 5).map((ord) => {
                const totalQty = (ord.items || []).reduce(
                  (s, i) => s + (Number(i.quantity) || 1),
                  0
                );
                return (
                  <div
                    key={ord.id}
                    onClick={() => handleStartEditOrder(ord)}
                    className="grid grid-cols-12 gap-3 items-center px-4 py-3.5 rounded-2xl text-xs cursor-pointer transition-all hover:bg-white hover:shadow-row"
                  >
                    <div className="col-span-3 font-mono text-neutral-600">
                      {ord.order_code}
                    </div>
                    <div className="col-span-3 font-bold text-[#111111] truncate">
                      {ord.customer_name}
                    </div>
                    <div className="col-span-2 text-neutral-500 truncate">
                      {ord.category}
                    </div>
                    <div className="col-span-2">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-[11px] font-bold ${
                          STATUS_PILL[ord.status] || STATUS_PILL.New
                        }`}
                      >
                        {ord.status === "Design/Preparation"
                          ? "Design"
                          : ord.status}
                      </span>
                    </div>
                    <div className="col-span-2 text-right font-extrabold text-[#111111]">
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

