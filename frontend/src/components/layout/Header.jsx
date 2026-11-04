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
          className="p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-sm text-slate-600 hover:text-slate-900 transition-all shrink-0 md:hidden"
          title="Buka Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div>
          {activeTab !== "dashboard" && (
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-400 hover:text-slate-900 mb-0.5 transition-colors"
            >
              <span>← Dashboard Utama</span>
            </button>
          )}
          <div className="flex items-center gap-2.5">
            <h1 className="text-[22px] sm:text-[24px] font-extrabold tracking-tight text-slate-900 leading-snug">
              {currentPageInfo.title}
            </h1>
            {activeTab !== "dashboard" && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-slate-900 text-white tracking-wide uppercase">
                Halaman
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            {currentPageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Center Pill Search Bar with Interactive Dropdown */}
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
            className="w-full h-11 rounded-full bg-white border border-slate-200/80 pl-5 pr-12 text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all"
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

        {/* Live Search Results Dropdown */}
        {isSearchOpen && q.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-[26px] shadow-2xl border border-neutral-100 p-4 z-50 space-y-4 max-h-[460px] overflow-y-auto">
            {/* Header info */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                Hasil Pencarian
              </span>
              <span className="text-[10px] font-bold text-neutral-600 bg-[#F4F5F9] px-2.5 py-0.5 rounded-full">
                {totalMatches} ditemukan
              </span>
            </div>

            {totalMatches === 0 ? (
              <div className="py-7 text-center space-y-1">
                <p className="text-xs font-bold text-neutral-700">
                  Tidak ada hasil yang sesuai
                </p>
                <p className="text-[11px] text-neutral-400">
                  Tidak ditemukan pesanan atau pelanggan untuk &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Orders Group */}
                {matchingOrders.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-neutral-500 px-1">
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
                            className="p-2.5 rounded-2xl hover:bg-[#F8F9FC] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[11px] font-bold text-neutral-500">
                                  {ord.order_code}
                                </span>
                                <span className="text-xs font-extrabold text-[#111111] truncate">
                                  {ord.customer_name}
                                </span>
                              </div>
                              <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                                {ord.category} • {totalQty} Pcs
                                {ord.items?.[0]?.custom_text &&
                                  ` • Bordir: "${ord.items[0].custom_text}"`}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-lg ${
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
                    <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-neutral-500 px-1">
                      <User className="w-3.5 h-3.5" />
                      <span>Pelanggan ({matchingCustomers.length})</span>
                    </div>

                    <div className="space-y-1">
                      {matchingCustomers.slice(0, 3).map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 rounded-2xl hover:bg-[#F8F9FC] cursor-pointer transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-[#0A0A0A] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                              {(c.name || "P").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-[#111111] truncate">
                                {c.name}
                              </p>
                              <p className="text-[11px] text-neutral-400 truncate">
                                {c.phone || c.email || c.address || "Tanpa kontak"}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#E7F8EE] text-[#16A34A]">
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
            <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  setActiveTab("orders");
                }}
                className="font-bold text-[#111111] hover:underline flex items-center gap-1"
              >
                <span>Lihat semua di Kanban Pesanan</span>
                <ArrowRight className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-neutral-400 font-mono">
                [Esc] Tutup
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Quick Icons + User Profile Dropdown */}
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
          className="w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-neutral-700 hover:text-black hover:scale-105 transition-all"
        >
          <FileText className="w-4 h-4" />
        </button>

        <button
          onClick={fetchAllData}
          title="Segarkan Data & Notifikasi"
          className="relative w-10 h-10 rounded-full bg-white shadow-soft flex items-center justify-center text-neutral-700 hover:text-black transition-all"
        >
          <Bell className={`w-4 h-4 ${loading ? "animate-bounce" : ""}`} />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        <div className="h-6 w-[1px] bg-neutral-200 mx-1" />

        {/* Avatar + Role Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center gap-2.5 py-1 pl-1 pr-2 rounded-full hover:bg-white/80 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-white">
              {greetingName.slice(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-4 h-4 text-neutral-500" />
          </button>

          {profileMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-tooltip border border-neutral-100 p-2.5 z-50 space-y-2">
              <div className="px-2.5 py-1.5 border-b border-neutral-100">
                <p className="text-xs font-bold text-[#111111]">
                  {authUser.full_name}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {authUser.role}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
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
