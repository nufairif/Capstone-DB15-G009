import React, { useState, useRef, useEffect } from "react";
import {
  Menu,
  Search,
  X,
  FileText,
  Bell,
  ChevronDown,
  LogOut,
  Package,
  User,
  ArrowRight,
} from "lucide-react";
import { STATUS_PILL } from "../../constants";

export default function Header({
  sidebarOpen,
  toggleSidebar,
  activeTab,
  setActiveTab,
  currentPageInfo,
  searchQuery,
  setSearchQuery,
  isProduksi,
  setEditingOrderId,
  fetchAllData,
  loading,
  profileMenuOpen,
  setProfileMenuOpen,
  greetingName,
  authUser,
  handleLogout,
  orders = [],
  customers = [],
  handleStartEditOrder,
  setCustomerForm,
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Compute live search matches for the dropdown
  const q = (searchQuery || "").trim().toLowerCase();
  const matchingOrders = q
    ? (orders || []).filter((o) => {
        const code = (o.order_code || "").toLowerCase();
        const cust = (o.customer_name || "").toLowerCase();
        const cat = (o.category || "").toLowerCase();
        const raw = (o.raw_message || "").toLowerCase();
        const itemTexts = (o.items || [])
          .map((it) => `${it.product_type || ""} ${it.custom_text || ""}`)
          .join(" ")
          .toLowerCase();
        return (
          code.includes(q) ||
          cust.includes(q) ||
          cat.includes(q) ||
          raw.includes(q) ||
          itemTexts.includes(q)
        );
      })
    : [];

  const matchingCustomers = q
    ? (customers || []).filter((c) => {
        const name = (c.name || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const address = (c.address || "").toLowerCase();
        return (
          name.includes(q) ||
          phone.includes(q) ||
          email.includes(q) ||
          address.includes(q)
        );
      })
    : [];

  const totalMatches = matchingOrders.length + matchingCustomers.length;

  const handleSubmitSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearchOpen(false);
    // If not already on orders or customers, default to orders view
    if (activeTab !== "orders" && activeTab !== "customers") {
      setActiveTab("orders");
    }
  };

  const handleSelectOrder = (ord) => {
    setIsSearchOpen(false);
    if (handleStartEditOrder) {
      handleStartEditOrder(ord);
    } else {
      setActiveTab("orders");
    }
  };

  const handleSelectCustomer = (c) => {
    setIsSearchOpen(false);
    if (setCustomerForm) {
      setCustomerForm({
        id: c.id,
        name: c.name,
        phone: c.phone || "",
        email: c.email || "",
        address: c.address || "",
      });
    }
    setActiveTab("customers");
  };

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 relative z-30">
      {/* Left Greeting & Page Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2.5 rounded-2xl bg-white/75 backdrop-blur-md border border-white/80 shadow-sm text-slate-600 hover:text-slate-900 transition-all shrink-0 md:hidden"
          title="Buka Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          {activeTab !== "dashboard" && (
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 hover:text-slate-900 mb-0.5 transition-colors"
            >
              <span>← Dashboard Utama</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-bold tracking-tight text-zinc-900 leading-snug">
              {currentPageInfo.title}
            </h1>
            {activeTab !== "dashboard" && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-zinc-950/90 text-white tracking-wide uppercase shadow-sm">
                Bento View
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {currentPageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center Apple Glass Pill Search Bar with Interactive Dropdown */}
      <div ref={searchRef} className="relative w-full sm:w-[340px] md:w-[390px]">
        <form onSubmit={handleSubmitSearch} className="relative w-full">
          <input
            type="text"
            value={searchQuery}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true);
            }}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search order, pelanggan, atau kode..."
            className="w-full h-11 rounded-full bg-white/70 backdrop-blur-xl border border-white/80 pl-5 pr-12 text-xs font-medium text-zinc-900 placeholder:text-slate-400 shadow-[0_2px_12px_rgba(15,23,42,0.03)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-300 transition-all"
          />

          <div className="absolute right-3 top-2.5 flex items-center gap-1">
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
              title="Cari"
            >
              <Search className="w-4 h-4 text-slate-500" />
            </button>
          </div>
        </form>

        {/* Live Search Results Dropdown with Frosted Glass */}
        {isSearchOpen && q.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white/85 backdrop-blur-2xl rounded-[28px] shadow-2xl border border-white/80 p-4 z-50 space-y-4 max-h-[460px] overflow-y-auto">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hasil Pencarian
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100/80 px-2.5 py-0.5 rounded-full">
                {totalMatches} ditemukan
              </span>
            </div>

            {totalMatches === 0 ? (
              <div className="py-7 text-center space-y-1">
                <p className="text-xs font-bold text-slate-700">
                  Tidak ada hasil yang sesuai
                </p>
                <p className="text-[11px] text-slate-400">
                  Tidak ditemukan pesanan atau pelanggan untuk &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orders Group */}
                {matchingOrders.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 px-1">
                      <Package className="w-3.5 h-3.5" />
                      <span>Pesanan ({matchingOrders.length})</span>
                    </div>

                    <div className="space-y-1">
                      {matchingOrders.slice(0, 4).map((ord) => {
                        const totalQty = (ord.items || []).reduce(
                          (sum, it) => sum + (Number(it.quantity) || 1),
                          0
                        );
                        return (
                          <div
                            key={ord.id}
                            onClick={() => handleSelectOrder(ord)}
                            className="p-2.5 rounded-2xl hover:bg-white/90 border border-transparent hover:border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold text-slate-500">
                                  {ord.order_code}
                                </span>
                                <span className="text-xs font-bold text-zinc-900 truncate">
                                  {ord.customer_name}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                {ord.category} • {totalQty} Pcs
                                {ord.items?.[0]?.custom_text &&
                                  ` • Bordir: "${ord.items[0].custom_text}"`}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                STATUS_PILL[ord.status] || STATUS_PILL.New
                              }`}
                            >
                              {ord.status === "Design/Preparation"
                                ? "Design"
                                : ord.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customers Group */}
                {matchingCustomers.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 px-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Pelanggan ({matchingCustomers.length})</span>
                    </div>

                    <div className="space-y-1">
                      {matchingCustomers.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 rounded-2xl hover:bg-white/90 border border-transparent hover:border-slate-200/80 cursor-pointer transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-zinc-950 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-sm">
                              {(c.name || "P").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-zinc-900 truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {c.phone || c.email || c.address || "Tanpa kontak"}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                            {c.total_orders || 0} Order
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer action */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveTab("orders");
                }}
                className="font-bold text-zinc-900 hover:underline flex items-center gap-1"
              >
                <span>Lihat semua di Kanban Pesanan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-400 font-mono">
                [Esc] Tutup
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Apple Frosted Glass Quick Action Icons + User Avatar */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            if (isProduksi) {
              setActiveTab("orders");
            } else {
              setEditingOrderId(null);
              setActiveTab("create-order");
            }
          }}
          title={isProduksi ? "Buka Kanban Produksi" : "Ekstrak Chat Pesanan AI Baru"}
          className="w-10 h-10 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center justify-center text-slate-700 hover:text-zinc-950 hover:bg-white hover:scale-105 active:scale-95 transition-all"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={fetchAllData}
          title="Segarkan Data & Notifikasi"
          className="relative w-10 h-10 rounded-full bg-white/75 backdrop-blur-xl border border-white/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)] flex items-center justify-center text-slate-700 hover:text-zinc-950 hover:bg-white hover:scale-105 active:scale-95 transition-all"
        >
          <Bell className={`w-4 h-4 ${loading ? "animate-bounce" : ""}`} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-[1px] bg-slate-300/60 mx-1" />

        {/* Apple Avatar + Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2.5 rounded-full bg-white/60 backdrop-blur-md border border-white/80 hover:bg-white/90 shadow-sm transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-zinc-950 to-zinc-800 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-1 ring-white/30">
              {greetingName.slice(0, 2).toUpperCase()}
            </div>
            <span className="hidden sm:inline text-xs font-semibold text-zinc-900 pr-1">
              {greetingName}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white/85 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/80 p-2.5 z-50 space-y-2">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-zinc-900">
                  {authUser.full_name}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {authUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl bg-rose-50/80 hover:bg-rose-100 text-rose-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
