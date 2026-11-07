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
      {/* Bento Card 1: Total Pcs */}
      <div
        onClick={() => setActiveTab("orders")}
        className="apple-glass-card rounded-[32px] p-6 sm:p-7 relative overflow-hidden group cursor-pointer"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 backdrop-blur-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <PackageCheck className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 shadow-sm">
            +18% MoM
          </span>
        </div>
        <div className="relative z-10 mt-5">
          <p className="text-[32px] sm:text-[34px] font-extrabold tracking-tight text-zinc-900 leading-none">
            {totalPcsCount} <span className="text-xl font-bold text-slate-500">Pcs</span>
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Total volume unit bordir aktif
          </p>
        </div>
      </div>

      {/* Bento Card 2: Jumlah Transaksi Aktif */}
      <div
        onClick={() => setActiveTab("orders")}
        className="apple-glass-card rounded-[32px] p-6 sm:p-7 relative overflow-hidden group cursor-pointer"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 backdrop-blur-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Aktif
          </span>
        </div>
        <div className="relative z-10 mt-5">
          <p className="text-[32px] sm:text-[34px] font-extrabold tracking-tight text-zinc-900 leading-none">
            {totalOrdersCount} <span className="text-xl font-bold text-slate-500">Pesanan</span>
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Transaksi berjalan di seluruh saluran
          </p>
        </div>
      </div>

      {/* Bento Card 3: Total Dataset AI */}
      <div
        onClick={() => {
          setActiveTab("datasets");
          fetchDatasetOverview();
        }}
        className="apple-glass-card rounded-[32px] p-6 sm:p-7 relative overflow-hidden group cursor-pointer"
      >
        <div className="flex items-center justify-between relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 backdrop-blur-md flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <BarChart3 className="w-5 h-5" strokeWidth={2} />
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-700 border border-indigo-500/20 shadow-sm">
            AI 98.3%
          </span>
        </div>
        <div className="relative z-10 mt-5">
          <p className="text-[32px] sm:text-[34px] font-extrabold tracking-tight text-zinc-900 leading-none">
            {datasetTotal} <span className="text-xl font-bold text-slate-500">Data</span>
          </p>
          <p className="text-xs font-medium text-slate-500 mt-2">
            Dataset pelatihan AI & korpus RAG
          </p>
        </div>
      </div>
    </div>
  );
}
