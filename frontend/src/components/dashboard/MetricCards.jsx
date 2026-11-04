import React from "react";
import { PackageCheck, Sparkles, BarChart3 } from "lucide-react";

export default function MetricCards({
  totalPcsCount,
  totalOrdersCount,
  datasetInfo,
  setActiveTab,
  fetchDatasetOverview,
}) {
  const datasetTotal =
    datasetInfo?.counts?.grand_total_records?.toLocaleString("id-ID") || "3.675";

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-6">
      {/* Card 1: Total Pcs */}
      <div
        onClick={() => setActiveTab("orders")}
        className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100/80 group-hover:scale-105 transition-transform">
            <PackageCheck className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
            %
          </span>
        </div>
        <p className="text-[30px] font-extrabold tracking-tight text-slate-900 mt-4 group-hover:text-amber-700 transition-colors">
          {totalPcsCount} Pcs
        </p>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Total unit produk custom dipesan
        </p>
      </div>

      {/* Card 2: Jumlah Transaksi Aktif */}
      <div
        onClick={() => setActiveTab("orders")}
        className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100/80 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
            %
          </span>
        </div>
        <p className="text-[30px] font-extrabold tracking-tight text-slate-900 mt-4 group-hover:text-emerald-700 transition-colors">
          {totalOrdersCount}
        </p>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Jumlah transaksi pesanan aktif
        </p>
      </div>

      {/* Card 3: Total Dataset AI */}
      <div
        onClick={() => {
          setActiveTab("datasets");
          fetchDatasetOverview();
        }}
        className="bg-white rounded-[28px] p-6 sm:p-7 border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
      >
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100/80 group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" strokeWidth={1.9} />
          </div>
          <span className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold">
            %
          </span>
        </div>
        <p className="text-[30px] font-extrabold tracking-tight text-slate-900 mt-4 group-hover:text-indigo-700 transition-colors">
          {datasetTotal}
        </p>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Total dataset AI & dokumen RAG
        </p>
      </div>
    </div>
  );
}
