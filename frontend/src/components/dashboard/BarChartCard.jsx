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
    <div className="bg-white rounded-[26px] sm:rounded-[28px] p-5 sm:p-7 shadow-soft overflow-visible">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2 sm:mb-4">
        <h2 className="text-sm sm:text-base font-extrabold text-[#111111]">
          Statistik Volume Pesanan & Klasifikasi AI
        </h2>
        <button
          type="button"
          onClick={() => {
            setChartMode(chartMode === "monthly" ? "category" : "monthly");
            setSelectedBarIdx(0);
          }}
          className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:border-black flex items-center gap-1.5 transition-colors shrink-0"
        >
          <span>
            {chartMode === "monthly" ? "Bulanan (2026)" : "5 Kategori AI"}
          </span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chart Container with Full Headroom for Tooltip & Smooth Responsive Bars */}
      <div className="w-full pt-14 pb-1 select-none">
        <div className="flex gap-2 sm:gap-4 items-end">
          {/* Y-Axis Labels */}
          <div className="flex flex-col justify-between h-40 sm:h-44 text-[10px] sm:text-[11px] font-medium text-neutral-400 pb-5 pr-1 select-none shrink-0">
            <span>120</span>
            <span>110</span>
            <span>90</span>
            <span>70</span>
            <span>40</span>
            <span>0</span>
          </div>

          {/* Bars Grid */}
          <div className="flex-1 flex items-end justify-between gap-1 sm:gap-2.5 md:gap-3 min-w-0">
            {activeBars.map((bar, idx) => {
              const heightPct = Math.min(
                100,
                Math.max(15, Math.round((bar.value / 120) * 100))
              );
              const isSelected = idx === selectedBarIdx;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedBarIdx(idx)}
                  className="flex-1 flex flex-col items-center gap-2 cursor-pointer group relative min-w-0"
                >
                  {/* Floating Callout Tooltip on Selected Bar */}
                  {isSelected && (
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 bg-white rounded-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 shadow-tooltip border border-neutral-100 whitespace-nowrap pointer-events-none">
                      <p className="text-[10px] font-medium text-neutral-400">
                        Volume Order
                      </p>
                      <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5">
                        <span className="text-[11px] sm:text-xs font-extrabold text-[#111111]">
                          {bar.detail}
                        </span>
                        <span className="text-[10px] font-bold text-[#16A34A]">
                          {bar.delta || "+96%"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Gray Full-Height Track */}
                  <div className="w-full max-w-[18px] sm:max-w-[26px] md:max-w-[30px] h-40 sm:h-44 bg-[#ECEEF3] rounded-t-md flex items-end justify-center relative overflow-visible">
                    {/* Solid Black Bar */}
                    <div
                      className="w-full bg-[#0A0A0A] rounded-t-sm transition-all duration-500 relative flex justify-center"
                      style={{ height: `${heightPct}%` }}
                    >
                      {isSelected && (
                        <>
                          {/* Target Circle Indicator */}
                          <span className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#0A0A0A] border-2 border-white ring-2 ring-[#0A0A0A] -mt-1.5 sm:-mt-2 z-10" />
                          {/* Dashed Line Inside Selected Bar */}
                          <div className="absolute top-2 bottom-0 border-l border-dashed border-white/50" />
                        </>
                      )}
                    </div>
                  </div>

                  {/* X-Axis Label */}
                  <span
                    className={`text-[10px] sm:text-[11px] font-medium truncate ${
                      isSelected
                        ? "text-[#111111] font-bold"
                        : "text-neutral-400"
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

