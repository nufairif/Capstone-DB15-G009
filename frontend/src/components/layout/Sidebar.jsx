import React from "react";
import { LogOut } from "lucide-react";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  toggleSidebar,
  navItems,
  activeTab,
  setActiveTab,
  setEditingOrderId,
  handleAskRAG,
  fetchDatasetOverview,
  ragResult,
  handleLogout,
}) {
  return (
    <>
      {/* Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Modern Icon-Only Minimalist Sidebar (76px) */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-20 bg-white border-r border-slate-200/80 flex flex-col justify-between items-center py-6 px-2.5 select-none transition-transform duration-300 ease-in-out shrink-0 w-[76px] ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="w-full flex flex-col items-center gap-7">
          {/* Brand Logo tf */}
          <button
            type="button"
            onClick={() => {
              setActiveTab("dashboard");
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            className="w-11 h-11 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-md hover:scale-105 active:scale-95 transition-all"
            title="Toko Firaza — AI Custom Order System"
          >
            tf
          </button>

          {/* Navigation Icons Stack */}
          <nav className="w-full flex flex-col items-center gap-2.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <div key={item.id} className="relative group flex items-center justify-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (item.id === "create-order") setEditingOrderId(null);
                      setActiveTab(item.id);
                      if (item.id === "rag" && !ragResult) handleAskRAG();
                      if (item.id === "datasets") fetchDatasetOverview();
                      if (typeof window !== "undefined" && window.innerWidth < 768) {
                        setSidebarOpen(false);
                      }
                    }}
                    aria-label={item.label}
                    className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                      isActive
                        ? "text-[#0F172A] font-bold bg-slate-100 shadow-sm ring-1 ring-slate-200/70"
                        : "text-slate-400 hover:text-[#0F172A] hover:bg-slate-50 font-medium"
                    }`}
                  >
                    {/* Clean Left Vertical Indicator */}
                    {isActive && (
                      <span className="absolute -left-2.5 top-2.5 bottom-2.5 w-[3.5px] bg-[#0F172A] rounded-r-full" />
                    )}

                    <Icon
                      className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105"
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                  </button>

                  {/* Floating Tooltip On Hover */}
                  <div className="absolute left-[66px] px-3 py-1.5 bg-[#0F172A] text-white text-[11px] font-semibold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
                    <span>{item.label}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout Button */}
        <div className="w-full pt-4 border-t border-slate-100 flex flex-col items-center">
          <div className="relative group flex items-center justify-center w-full">
            <button
              type="button"
              onClick={() => {
                handleLogout();
                if (typeof window !== "undefined" && window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              aria-label="Keluar (Logout)"
              className="w-12 h-12 rounded-2xl text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all"
            >
              <LogOut className="w-5 h-5 shrink-0" strokeWidth={1.8} />
            </button>

            {/* Logout Tooltip */}
            <div className="absolute left-[66px] px-3 py-1.5 bg-[#0F172A] text-white text-[11px] font-semibold rounded-xl whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-150 z-50 flex items-center gap-1.5">
              <span>Keluar (Logout)</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
