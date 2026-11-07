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
    <div className="apple-glass-card rounded-[32px] p-6 sm:p-8 overflow-visible relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 tracking-tight flex items-center gap-2">
            <span>Statistik Volume Pesanan & Prediksi AI</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            Pelacakan tren volume pengerjaan bulanan dan distribusi 5 kategori produk
          </p>
        </div>

        {/* Apple Style Segmented Control */}
        <div className="inline-flex p-1 rounded-full bg-slate-200/60 backdrop-blur-md border border-white/60 shadow-inner self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => {
              setChartMode("monthly");
              setSelectedBarIdx(4);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              chartMode === "monthly"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-slate-500 hover:text-zinc-900"
            }`}
          >
            Bulanan (2026)
          </button>
          <button
            type="button"
            onClick={() => {
              setChartMode("category");
              setSelectedBarIdx(0);
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
              chartMode === "category"
                ? "bg-white text-zinc-950 shadow-sm"
                : "text-slate-500 hover:text-zinc-900"
            }`}
          >
            5 Kategori AI
          </button>
        </div>
      </div>

      {/* Chart Container with Headroom for Floating Tooltip */}
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
                  {/* Floating Apple Glass Callout Tooltip on Selected Bar */}
                  {isSelected && (
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-30 bg-zinc-950/90 backdrop-blur-xl text-white border border-white/15 rounded-2xl px-4 py-2 shadow-2xl whitespace-nowrap pointer-events-none flex flex-col items-center animate-fade-in">
                      <p className="text-[10px] font-medium text-slate-400">
                        Volume Order
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-xs font-extrabold text-white">
                          {bar.detail}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                          {bar.delta || "+96%"}
                        </span>
                      </div>
                      {/* Arrow Down */}
                      <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-zinc-950/90 rotate-45 border-r border-b border-white/15" />
                    </div>
                  )}

                  {/* Gray Full-Height Track with Squircle Border */}
                  <div className="w-full max-w-[20px] sm:max-w-[28px] md:max-w-[32px] h-40 sm:h-44 bg-slate-200/50 rounded-2xl flex items-end justify-center relative overflow-visible group-hover:bg-slate-200/70 transition-colors">
                    {/* Solid Charcoal / Gradient Bar */}
                    <div
                      className="w-full bg-gradient-to-t from-zinc-950 via-zinc-900 to-zinc-800 rounded-2xl transition-all duration-500 relative flex justify-center shadow-sm"
                      style={{ height: `${heightPct}%` }}
                    >
                      {isSelected && (
                        <>
                          {/* Target Circle Indicator */}
                          <span className="w-3.5 h-3.5 rounded-full bg-zinc-950 border-2 border-white ring-2 ring-zinc-900 -mt-2 z-10 shadow-md" />
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
                        ? "text-zinc-950 font-bold"
                        : "text-slate-400 font-medium group-hover:text-zinc-700"
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
