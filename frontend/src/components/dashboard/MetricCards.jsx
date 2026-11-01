import React from "react";
import { PackageCheck, Sparkles, BarChart3 } from "lucide-react";

export default function MetricCards({
  totalPcsCount,
  totalOrdersCount,
  datasetInfo,
  setActiveTab,
  fetchDatasetOverview,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Card 1: Total Pcs */}
      <div
        onClick={() => setActiveTab("orders")}
        className="bg-white rounded-[26px] p-6 shadow-soft cursor-pointer hover:-translate-y-0.5 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#F8F9FC] flex items-center justify-center text-[#111111]">
            <PackageCheck className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <span className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center text-[10px] text-neutral-400">
            %
          </span>
        </div>
        <p className="text-[28px] font-extrabold tracking-tight text-[#111111] mt-4">
          {totalPcsCount} Pcs
        </p>
        <p className="text-xs font-medium text-neutral-400 mt-1">
          Total unit produk custom dipesan
        </p>
      </div>

      {/* Card 2: Jumlah Transaksi Aktif */}
      <div
        onClick={() => setActiveTab("orders")}
        className="bg-white rounded-[26px] p-6 shadow-soft cursor-pointer hover:-translate-y-0.5 transition-all"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#F8F9FC] flex items-center justify-center text-[#111111]">
            <Sparkles className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <span className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center text-[10px] text-neutral-400">
            %
          </span>
        </div>
        <p className="text-[28px] font-extrabold tracking-tight text-[#111111] mt-4">
          {totalOrdersCount}
        </p>
        <p className="text-xs font-medium text-neutral-400 mt-1">
          Jumlah transaksi pesanan aktif
        </p>
      </div>

      {/* Card 3: Total Dataset AI */}
      <div
        onClick={() => {
          setActiveTab("datasets");
          fetchDatasetOverview();
        }}
        className="bg-white rounded-[26px] p-6 shadow-soft cursor-pointer hover:-translate-y-0.5 transition-all group"
      >
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl bg-[#F8F9FC] flex items-center justify-center text-[#111111] group-hover:bg-[#0A0A0A] group-hover:text-white transition-colors">
            <BarChart3 className="w-5 h-5" strokeWidth={1.8} />
          </div>
          <span className="w-6 h-6 rounded-full border border-neutral-200 flex items-center justify-center text-[10px] text-neutral-400 group-hover:border-black group-hover:text-black">
            %
          </span>
        </div>
        <p className="text-[28px] font-extrabold tracking-tight text-[#111111] mt-4">
          {datasetInfo?.counts?.grand_total_records
            ? datasetInfo.counts.grand_total_records.toLocaleString("id-ID")
            : "3.675"}
        </p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs font-medium text-neutral-400">
            Total dataset AI & dokumen RAG
          </p>
          <span className="text-[11px] font-bold text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity">
            Buka Halaman →
          </span>
        </div>
      </div>
    </div>
  );
}

