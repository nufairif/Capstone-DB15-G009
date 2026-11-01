import React from "react";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";

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
      {/* Mobile Backdrop Overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Expandable Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen z-50 md:z-20 bg-[#F8F9FC] border-r border-neutral-200/70 flex flex-col justify-between py-6 select-none transition-all duration-300 ease-in-out shrink-0 ${
          sidebarOpen
            ? "translate-x-0 w-[240px] px-4 shadow-2xl md:shadow-none"
            : "-translate-x-full md:translate-x-0 md:w-[84px] px-2.5"
        }`}
      >
        <div className="w-full flex flex-col gap-6">
          {/* Top Logo & Sidebar Toggle Button */}
          {sidebarOpen ? (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("dashboard");
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    setSidebarOpen(false);
                  }
                }}
                className="flex items-center gap-3 overflow-hidden text-left group"
                title="Toko Firaza (DB15-G009)"
              >
                <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-md shrink-0 group-hover:scale-105 transition-transform">
                  tf
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-sm text-[#111111] leading-tight truncate">
                    Toko Firaza
                  </p>
                  <p className="text-[11px] text-neutral-400 font-medium truncate">
                    AI Order System
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-white shadow-none hover:shadow-soft transition-all shrink-0"
                title="Tutup Sidebar"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3.5 w-full">
              <button
                type="button"
                onClick={() => setActiveTab("dashboard")}
                className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white flex items-center justify-center font-extrabold text-sm tracking-tighter shadow-md shrink-0 hover:scale-105 transition-transform mx-auto"
                title="Toko Firaza (DB15-G009)"
              >
                tf
              </button>

              <button
                type="button"
                onClick={toggleSidebar}
                className="p-2 rounded-xl text-neutral-400 hover:text-black hover:bg-white shadow-none hover:shadow-soft transition-all shrink-0 mx-auto"
                title="Buka Sidebar"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Navigation Icons & Labels */}
          <nav className="w-full flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === "create-order") setEditingOrderId(null);
                    setActiveTab(item.id);
                    if (item.id === "rag" && !ragResult) handleAskRAG();
                    if (item.id === "datasets") fetchDatasetOverview();
                    if (typeof window !== "undefined" && window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  title={item.label}
                  className={`relative w-full h-11 flex items-center rounded-2xl transition-all ${
                    sidebarOpen
                      ? "px-3.5 justify-start gap-3.5"
                      : "justify-center"
                  } ${
                    isActive
                      ? "text-[#0A0A0A] font-bold bg-white shadow-soft"
                      : "text-neutral-400 hover:text-[#0A0A0A] hover:bg-white/60 font-medium"
                  }`}
                >
                  {/* Vertical Left Indicator Bar */}
                  {isActive && (
                    <span
                      className={`absolute left-0 w-[3.5px] h-6 bg-[#0A0A0A] rounded-r-full ${
                        sidebarOpen ? "-left-4" : "left-0"
                      }`}
                    />
                  )}
                  <Icon
                    className="w-[20px] h-[20px] shrink-0"
                    strokeWidth={isActive ? 2.2 : 1.75}
                  />
                  {sidebarOpen && (
                    <span className="text-xs truncate tracking-tight font-semibold">
                      {item.label}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Logout */}
        <div className="w-full pt-4 border-t border-neutral-200/60">
          <button
            type="button"
            onClick={() => {
              handleLogout();
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                setSidebarOpen(false);
              }
            }}
            title="Keluar (Logout)"
            className={`w-full h-11 flex items-center rounded-2xl text-neutral-500 hover:text-red-600 hover:bg-white transition-all ${
              sidebarOpen
                ? "px-3.5 justify-start gap-3.5"
                : "justify-center"
            }`}
          >
            <LogOut className="w-[19px] h-[19px] shrink-0" strokeWidth={1.8} />
            {sidebarOpen && (
              <span className="text-xs font-bold truncate">Keluar</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

