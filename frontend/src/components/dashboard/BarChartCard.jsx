import React from "react";
import { ChevronDown } from "lucide-react";

export default function BarChartCard({
  chartMode,
  setChartMode,
  selectedBarIdx,
  setSelectedBarIdx,
  activeBars,
}) {
  return (
    <div className="bg-white rounded-[28px] border border-slate-200/80 p-6 sm:p-8 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.03)] overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
            Statistik Volume Pesanan & Klasifikasi AI
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Pelacakan tren pemesanan bulanan dan distribusi 5 kategori produk
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setChartMode(chartMode === "monthly" ? "category" : "monthly");
            setSelectedBarIdx(0);
          }}
          className="self-start sm:self-auto px-4 py-2 rounded-full border border-slate-200/90 text-xs font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900 flex items-center gap-1.5 transition-all shadow-sm shrink-0"
        >
          <span>
            {chartMode === "monthly" ? "Tampilan Bulanan (2026)" : "Distribusi 5 Kategori AI"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Chart Container with Full Headroom for Floating Tooltip */}
      <div className="w-full pt-16 pb-2 select-none">
        <div className="flex gap-2 sm:gap-4 items-end">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between h-40 sm:h-44 text-[10px] sm:text-[11px] font-semibold text-slate-400 pb-5 pr-1 select-none shrink-0">
            <span>120</span>
            <span>110</span>
            <span>90</span>
            <span>70</span>
            <span>40</span>
            <span>0</span>
          </div>

          {/* Bars Grid */}
          <div className="flex-1 flex items-end justify-between gap-1.5 sm:gap-2.5 md:gap-3 min-w-0">
            {activeBars.map((bar, idx) => {
              const heightPct = Math.min(
                100,
                Math.max(16, Math.round((bar.value / 120) * 100))
              );
              const isSelected = idx === selectedBarIdx;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedBarIdx(idx)}
                  className="flex-1 flex flex-col items-center gap-2.5 cursor-pointer group relative min-w-0"
                >
                  {/* Floating Callout Tooltip on Selected Bar */}
                  {isSelected && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-[#0F172A] text-white rounded-2xl px-3.5 py-2 shadow-2xl whitespace-nowrap pointer-events-none flex flex-col items-center animate-fade-in">
                      <p className="text-[10px] font-medium text-slate-400">
                        Volume Order
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-extrabold text-white">
                          {bar.detail}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          {bar.delta || "+96%"}
                        </span>
                      </div>
                      {/* Arrow Down */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#0F172A] rotate-45" />
                    </div>
                  )}

                  {/* Gray Full-Height Track */}
                  <div className="w-full max-w-[20px] sm:max-w-[28px] md:max-w-[32px] h-40 sm:h-44 bg-[#EEF1F6] rounded-t-lg flex items-end justify-center relative overflow-visible group-hover:bg-[#E5E9F0] transition-colors">
                    {/* Solid Charcoal Bar */}
                    <div
                      className="w-full bg-[#0F172A] rounded-t-md transition-all duration-500 relative flex justify-center"
                      style={{ height: `${heightPct}%` }}
                    >
                      {isSelected && (
                        <>
                          {/* Target Circle Indicator */}
                          <span className="w-3.5 h-3.5 rounded-full bg-[#0F172A] border-2 border-white ring-2 ring-[#0F172A] -mt-2 z-10 shadow-sm" />
                          {/* Dashed Line Inside Selected Bar */}
                          <div className="absolute top-2 bottom-0 border-l border-dashed border-white/40" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* X-Axis Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] truncate transition-colors ${
                      isSelected
                        ? "text-slate-900 font-extrabold"
                        : "text-slate-400 font-medium group-hover:text-slate-700"
                    }`}
                  >
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
