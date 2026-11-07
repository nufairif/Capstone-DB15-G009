'use client';

import React, { useState, useEffect } from "react";
import {
  LayoutGrid,
  Wand2,
  BarChart3,
  Users,
  HelpCircle,
  Settings,
} from "lucide-react";
import {
  API_BASE,
  CATEGORIES,
  PRESET_CHATS,
  DEMO_ACCOUNTS,
} from "./constants";
import apiClient from "./api/client";
import Toast from "./components/layout/Toast";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";
import LoginView from "./components/auth/LoginView";
import DashboardView from "./components/views/DashboardView";
import CreateOrderView from "./components/views/CreateOrderView";
import OrdersView from "./components/views/OrdersView";
import CustomersView from "./components/views/CustomersView";
import RagCatalogView from "./components/views/RagCatalogView";
import DatasetsView from "./components/views/DatasetsView";

export default function App() {
  const [mounted, setMounted] = useState(false);
  const [authUser, setAuthUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("firaza_auth_user");
      if (saved) {
        const parsed = JSON.parse(saved);
        const matched = DEMO_ACCOUNTS.find((a) => a.username === parsed.username);
        if (matched) {
          const updated = {
            ...parsed,
            full_name: matched.full_name,
            role: matched.role,
          };
          localStorage.setItem("firaza_auth_user", JSON.stringify(updated));
          setAuthUser(updated);
        } else {
          setAuthUser(parsed);
        }
      }
      const savedSidebar = localStorage.getItem("firaza_sidebar_open");
      if (savedSidebar !== null) {
        setSidebarOpen(savedSidebar === "true");
      } else if (window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    } catch {}
    setMounted(true);
  }, []);

  const [loginForm, setLoginForm] = useState({
    username: "admin",
    password: "admin123",
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    if (window.innerWidth < 768) return false;
    const saved = localStorage.getItem("firaza_sidebar_open");
    return saved !== null ? saved === "true" : true;
  });

  const toggleSidebar = () => {
    setSidebarOpen((prev) => {
      const next = !prev;
      localStorage.setItem("firaza_sidebar_open", String(next));
      return next;
    });
  };

  // Clean URL Path Routing (HTML5 History API: /datasets, /create-order, /orders, etc.)
  const getTabFromPath = () => {
    if (typeof window === "undefined") return "dashboard";
    const path = window.location.pathname.replace(/^\/+|\/+$/g, "").trim();
    const validTabs = [
      "create-order",
      "orders",
      "customers",
      "rag",
      "datasets",
      "login",
    ];
    if (validTabs.includes(path)) return path;
    if (path === "dashboard" || path === "") return "dashboard";

    // Auto-migrate legacy hash if user previously opened /#/datasets or /#/login
    const hash = window.location.hash.replace(/^#\/?/, "").trim();
    if (validTabs.includes(hash)) return hash;

    return "dashboard";
  };

  const [activeTab, setActiveTabState] = useState(() => getTabFromPath());

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId);
    if (typeof window !== "undefined") {
      const targetPath = tabId === "dashboard" ? "/" : `/${tabId}`;
      if (window.location.pathname !== targetPath || window.location.hash) {
        window.history.pushState({ tab: tabId }, "", targetPath);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // If user is not logged in, enforce clean /login URL
  useEffect(() => {
    if (!mounted) return;
    if (!authUser) {
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        const prev = window.location.pathname;
        if (prev && prev !== "/" && prev !== "/login") {
          try {
            sessionStorage.setItem("firaza_login_redirect", prev);
          } catch {}
        }
        window.history.replaceState({ tab: "login" }, "", "/login");
      }
      setActiveTabState("login");
    } else if (
      typeof window !== "undefined" &&
      window.location.pathname === "/login"
    ) {
      let target = "/";
      try {
        const saved = sessionStorage.getItem("firaza_login_redirect");
        if (saved && saved !== "/login") {
          target = saved;
          sessionStorage.removeItem("firaza_login_redirect");
        }
      } catch {}
      const targetTab = target.replace(/^\/+/, "") || "dashboard";
      window.history.replaceState({ tab: targetTab }, "", target);
      setActiveTabState(targetTab);
    }
  }, [authUser]);

  useEffect(() => {
    // Clean up any legacy hash on load and normalize to clean path
    if (typeof window !== "undefined" && window.location.hash) {
      const hashTab = window.location.hash.replace(/^#\/?/, "").trim();
      const validTabs = [
        "create-order",
        "orders",
        "customers",
        "rag",
        "datasets",
        "login",
      ];
      if (validTabs.includes(hashTab) || hashTab === "dashboard") {
        const cleanPath = hashTab === "dashboard" ? "/" : `/${hashTab}`;
        window.history.replaceState({ tab: hashTab }, "", cleanPath);
        setActiveTabState(hashTab === "dashboard" ? "dashboard" : hashTab);
      }
    }

    const handlePopState = () => {
      setActiveTabState(getTabFromPath());
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const [stats, setStats] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("tf_dashboard_stats");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Chart interactive state on Dashboard
  const [chartMode, setChartMode] = useState("monthly"); // "monthly" | "category"
  const [selectedBarIdx, setSelectedBarIdx] = useState(4);

  // Filter state for Orders
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // AI Smart Order Extractor & Form Order
  const [rawChat, setRawChat] = useState(PRESET_CHATS[0].text);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiResultMeta, setAiResultMeta] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);

  const [orderForm, setOrderForm] = useState({
    customer_name: "",
    customer_phone: "",
    category: "Custom Sajadah",
    ai_confidence: 0.95,
    status: "New",
    greeting_card_requested: false,
    greeting_occasion: "",
    greeting_sender: "",
    greeting_recipient: "",
    greeting_draft: "",
    additional_notes: "",
    items: [
      {
        product_type: "Sajadah Custom",
        quantity: 1,
        color: "",
        size: "",
        custom_text: "",
        font_style: "",
        layout_notes: "",
      },
    ],
  });

  // Customer CRUD
  const [customerForm, setCustomerForm] = useState({
    id: null,
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // RAG Assistant
  const [ragQuery, setRagQuery] = useState(
    "Ukuran handuk custom dewasa berapa cm dan pilihan warnanya apa aja?"
  );
  const [ragResult, setRagResult] = useState(null);
  const [ragLoading, setRagLoading] = useState(false);
  const [datasetInfo, setDatasetInfo] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const cached = localStorage.getItem("tf_dataset_info");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [copiedId, setCopiedId] = useState(null);

  // RBAC Helpers
  const isSuperAdmin =
    authUser?.username === "admin" || authUser?.role === "Super Admin";
  const isCS =
    authUser?.username === "cs" || authUser?.role?.includes("CS");
  const isProduksi =
    authUser?.username === "produksi" ||
    authUser?.role?.includes("Production");

  const canDelete = isSuperAdmin;
  const canCreateOrEditOrder = isSuperAdmin || isCS;

  const getGreetingName = () => {
    if (!authUser) return "Admin";
    if (authUser.username === "cs" || authUser.full_name?.includes("Rina"))
      return "Rina";
    if (
      authUser.username === "produksi" ||
      authUser.full_name?.includes("Farhan")
    )
      return "Farhan";
    if (authUser.username === "admin") return "Admin";
    const clean = (authUser.full_name || "")
      .replace(/\s*\(.*?\)/, "")
      .trim();
    return clean.split(" ")[0] || authUser.username || "Admin";
  };
  const greetingName = getGreetingName();

  const PAGE_TITLES = {
    dashboard: {
      title: `Good Morning, ${greetingName}!`,
      subtitle: `${authUser?.role || "Pengguna"} • Toko Firaza (DB15-G009)`,
    },
    "create-order": {
      title: editingOrderId ? "Edit Pesanan Custom" : "Ekstrak Order AI",
      subtitle:
        "Ekstraksi chat otomatis (WA/Shopee) & formulir spesifikasi pesanan",
    },
    orders: {
      title: "Kanban & Pelacakan Pesanan",
      subtitle:
        "Monitoring 4 tahap alur produksi bordir & kartu ucapan pelanggan",
    },
    customers: {
      title: "Data & Direktori Pelanggan",
      subtitle:
        "Manajemen kontak pemesan, preferensi & riwayat transaksi Toko Firaza",
    },
    rag: {
      title: "Asisten Katalog & SOP Bordir (RAG)",
      subtitle:
        "Pencarian knowledge base semantik ke 75 dokumen katalog & panduan produksi",
    },
    datasets: {
      title: "Dataset & Evaluasi Model AI",
      subtitle:
        "Transparansi 3.675 dataset latih/uji klasifikasi & model SVM terkalibrasi",
    },
  };
  const currentPageInfo = PAGE_TITLES[activeTab] || PAGE_TITLES.dashboard;

  const showToast = (msg, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3200);
  };

  const fetchDatasetOverview = async () => {
    try {
      const res = await apiClient.get("/api/v1/ai/dataset-overview");
      setDatasetInfo(res.data);
      try {
        localStorage.setItem("tf_dataset_info", JSON.stringify(res.data));
      } catch {}
    } catch (err) {
      console.error("Gagal memuat dataset overview:", err);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, custRes] = await Promise.all([
        apiClient.get("/api/v1/stats"),
        apiClient.get("/api/v1/orders", {
          params: {
            status: filterStatus,
            category: filterCategory,
            search: searchQuery,
          },
        }),
        apiClient.get("/api/v1/customers", {
          params: { search: searchQuery },
        }),
      ]);
      setStats(statsRes.data);
      try {
        localStorage.setItem("tf_dashboard_stats", JSON.stringify(statsRes.data));
      } catch {}
      setOrders(ordersRes.data);
      setCustomers(custRes.data);
    } catch (err) {
      console.error("Gagal memuat data dari backend:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasetOverview();
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [filterStatus, filterCategory, searchQuery]);

  // AI Smart Extraction
  const handleRunAIExtraction = async () => {
    if (!rawChat.trim()) return;
    setAiAnalyzing(true);
    try {
      const res = await apiClient.post("/api/v1/ai/analyze-order", {
        raw_message: rawChat,
        generate_greeting_card: true,
      });
      const data = res.data;
      setAiResultMeta({
        prediction: data.prediction,
        meta: data.meta,
      });

      const ext = data.extraction;
      const gCard = ext.greeting_card || {};
      setOrderForm({
        customer_name: ext.customer_name || "Pelanggan Firaza",
        customer_phone: ext.customer_phone || "",
        category: data.prediction.category,
        ai_confidence: data.prediction.confidence,
        status: ext.order_status || "New",
        greeting_card_requested: Boolean(gCard.is_requested),
        greeting_occasion: gCard.occasion || "",
        greeting_sender: gCard.sender_name || ext.customer_name || "",
        greeting_recipient: gCard.recipient_name || "",
        greeting_draft: gCard.draft_message || "",
        additional_notes: ext.additional_notes || "",
        items:
          ext.items && ext.items.length > 0
            ? ext.items.map((it) => ({
                product_type: it.product_type || data.prediction.category,
                quantity: it.quantity || 1,
                color: it.color || "",
                size: it.size || "",
                custom_text: it.custom_text || "",
                font_style: it.font_style || "",
                layout_notes: it.layout_notes || "",
              }))
            : [
                {
                  product_type: data.prediction.category,
                  quantity: 1,
                  color: "",
                  size: "",
                  custom_text: "",
                  font_style: "",
                  layout_notes: "",
                },
              ],
      });
      showToast("Berhasil mengekstrak detail pesanan & kartu ucapan dengan AI");
    } catch {
      showToast("Gagal menghubungi server AI di port 8000", "error");
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleSaveOrder = async (e) => {
    e.preventDefault();
    if (!canCreateOrEditOrder) {
      showToast(
        "Role Production Lead hanya dapat mengubah status produksi",
        "error"
      );
      return;
    }
    const path = editingOrderId
      ? `/api/v1/orders/${editingOrderId}`
      : `/api/v1/orders`;
    const payload = {
      ...orderForm,
      raw_message: rawChat,
    };

    try {
      if (editingOrderId) {
        await apiClient.put(path, payload);
      } else {
        await apiClient.post(path, payload);
      }
      showToast(
        editingOrderId
          ? "Pesanan berhasil diperbarui"
          : "Pesanan baru berhasil disimpan"
      );
      setEditingOrderId(null);
      await fetchAllData();
      setActiveTab("dashboard");
    } catch {
      showToast("Gagal menyimpan pesanan", "error");
    }
  };

  const handleAdvanceStatus = async (orderId, nextStatus) => {
    try {
      await apiClient.patch(`/api/v1/orders/${orderId}/status`, {
        status: nextStatus,
      });
      showToast(`Status pesanan diubah ke ${nextStatus}`);
      fetchAllData();
    } catch {
      showToast("Gagal mengubah status", "error");
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!canDelete) {
      showToast(
        "Akses ditolak: Hanya Business Manager / Super Admin yang dapat menghapus pesanan",
        "error"
      );
      return;
    }
    try {
      await apiClient.delete(`/api/v1/orders/${orderId}`);
      showToast("Pesanan dihapus");
      fetchAllData();
    } catch {
      showToast("Gagal menghapus pesanan", "error");
    }
  };

  const handleStartEditOrder = (order) => {
    setEditingOrderId(order.id);
    setRawChat(order.raw_message || "");
    setOrderForm({
      customer_name: order.customer_name || "",
      customer_phone: order.customer_phone || "",
      category: order.category || "Custom Sajadah",
      ai_confidence: order.ai_confidence || 0.95,
      status: order.status || "New",
      greeting_card_requested: Boolean(order.greeting_card_requested),
      greeting_occasion: order.greeting_occasion || "",
      greeting_sender: order.greeting_sender || "",
      greeting_recipient: order.greeting_recipient || "",
      greeting_draft: order.greeting_draft || "",
      additional_notes: order.additional_notes || "",
      items:
        order.items && order.items.length > 0
          ? order.items
          : [
              {
                product_type: order.category,
                quantity: 1,
                color: "",
                size: "",
                custom_text: "",
                font_style: "",
                layout_notes: "",
              },
            ],
    });
    setActiveTab("create-order");
  };

  const handleAddItemRow = () => {
    setOrderForm({
      ...orderForm,
      items: [
        ...orderForm.items,
        {
          product_type: orderForm.category,
          quantity: 1,
          color: "",
          size: "",
          custom_text: "",
          font_style: "",
          layout_notes: "",
        },
      ],
    });
  };

  const handleRemoveItemRow = (idx) => {
    if (orderForm.items.length <= 1) return;
    setOrderForm({
      ...orderForm,
      items: orderForm.items.filter((_, i) => i !== idx),
    });
  };

  // Customer CRUD
  const handleSaveCustomer = async (e) => {
    e.preventDefault();
    const isEdit = Boolean(customerForm.id);
    const path = isEdit
      ? `/api/v1/customers/${customerForm.id}`
      : `/api/v1/customers`;

    try {
      if (isEdit) {
        await apiClient.put(path, customerForm);
      } else {
        await apiClient.post(path, customerForm);
      }
      showToast(
        isEdit ? "Data pelanggan diperbarui" : "Pelanggan ditambahkan"
      );
      setCustomerForm({
        id: null,
        name: "",
        phone: "",
        email: "",
        address: "",
      });
      fetchAllData();
    } catch {
      showToast("Gagal menyimpan pelanggan", "error");
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!canDelete) {
      showToast(
        "Akses ditolak: Hanya Business Manager yang dapat menghapus pelanggan",
        "error"
      );
      return;
    }
    try {
      await apiClient.delete(`/api/v1/customers/${id}`);
      showToast("Pelanggan dihapus");
      fetchAllData();
    } catch {
      showToast("Gagal menghapus pelanggan", "error");
    }
  };

  // RAG Query
  const handleAskRAG = async (e, customQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const qToUse = customQuery !== null ? customQuery : ragQuery;
    if (!qToUse.trim()) return;
    setRagLoading(true);
    try {
      const res = await apiClient.post("/api/v1/ai/rag-catalog", {
        query: qToUse,
        top_k: 3,
      });
      setRagResult(res.data);
    } catch {
      showToast("Gagal memanggil RAG Engine", "error");
    } finally {
      setRagLoading(false);
    }
  };

  const handleCopyText = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const finishLogin = (userObj) => {
    setAuthUser(userObj);
    localStorage.setItem("firaza_auth_user", JSON.stringify(userObj));
    let target = "/";
    try {
      const saved = sessionStorage.getItem("firaza_login_redirect");
      if (saved && saved !== "/login") {
        target = saved;
        sessionStorage.removeItem("firaza_login_redirect");
      }
    } catch {}
    const targetTab = target.replace(/^\/+/, "") || "dashboard";
    if (typeof window !== "undefined") {
      window.history.pushState({ tab: targetTab }, "", target);
    }
    setActiveTabState(targetTab);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setAuthLoading(true);
    try {
      const res = await apiClient.post("/api/v1/auth/login", {
        username: loginForm.username.trim(),
        password: loginForm.password,
      });
      const data = res.data;
      const matched = DEMO_ACCOUNTS.find(
        (a) => a.username === data.user.username
      );
      const userObj = matched
        ? {
            ...data.user,
            full_name: matched.full_name,
            role: matched.role,
          }
        : data.user;
      finishLogin(userObj);
      return;
    } catch (err) {
      if (err?.response?.status === 401) {
        setAuthError("Username atau password tidak sesuai.");
        return;
      }
      const ident = loginForm.username.trim().toLowerCase();
      const matched = DEMO_ACCOUNTS.find(
        (acc) =>
          (acc.username === ident || acc.email === ident) &&
          acc.password === loginForm.password
      );
      if (matched) {
        const userObj = {
          id: 1,
          username: matched.username,
          email: matched.email,
          full_name: matched.full_name,
          role: matched.role,
        };
        finishLogin(userObj);
      } else {
        setAuthError("Username atau password tidak sesuai.");
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiClient.post("/api/v1/auth/logout");
    } catch {
      // ignore
    }
    localStorage.removeItem("firaza_auth_user");
    setAuthUser(null);
    setProfileMenuOpen(false);
    setNotification(null);
    if (typeof window !== "undefined") {
      window.history.pushState({ tab: "login" }, "", "/login");
    }
    setActiveTabState("login");
  };

  // Sidebar Icon Navigation matching the reference design and RBAC
  const allNavItems = [
    { id: "dashboard", label: "Dashboard Utama", icon: LayoutGrid },
    {
      id: "create-order",
      label: "Ekstrak Order AI",
      icon: Wand2,
      showFor: ["admin", "cs"],
    },
    {
      id: "orders",
      label: "Kanban & Pesanan",
      icon: BarChart3,
      showFor: ["admin", "cs", "produksi"],
    },
    {
      id: "customers",
      label: "Data Pelanggan",
      icon: Users,
      showFor: ["admin", "cs"],
    },
    {
      id: "rag",
      label: "Asisten Katalog RAG",
      icon: HelpCircle,
      showFor: ["admin", "cs", "produksi"],
    },
    { id: "datasets", label: "Dataset & Model AI", icon: Settings },
  ];

  const currentRoleKey = isSuperAdmin ? "admin" : isCS ? "cs" : "produksi";
  const navItems = allNavItems.filter(
    (item) => !item.showFor || item.showFor.includes(currentRoleKey)
  );

  // Computed metrics for the dashboard cards & chart
  const totalOrdersCount = stats?.total_orders ?? orders.length;
  const totalCustomersCount = stats?.total_customers ?? customers.length;
  const totalPcsCount =
    stats?.total_pcs ??
    orders.reduce(
      (acc, o) =>
        acc +
        (o.items || []).reduce(
          (sum, it) => sum + (Number(it.quantity) || 1),
          0
        ),
      0
    );
  const inProgressCount =
    (stats?.by_status?.["Design/Preparation"] || 0) +
    (stats?.by_status?.["Production"] || 0);
  const completedCount = stats?.by_status?.["Completed"] || 0;
  const progressPercent =
    totalOrdersCount > 0
      ? Math.min(
          100,
          Math.max(
            25,
            Math.round(
              ((completedCount + inProgressCount * 0.6) / totalOrdersCount) *
                100
            )
          )
        )
      : 72;

  // Bar Chart Data (12 Bars)
  const monthlyChartData = [
    { label: "Jan", value: 42, detail: "42 Pcs Custom" },
    { label: "Feb", value: 78, detail: "78 Pcs Custom" },
    { label: "Mar", value: 65, detail: "65 Pcs Custom" },
    { label: "Apr", value: 88, detail: "88 Pcs Custom" },
    {
      label: "Mei",
      value: 112,
      detail: `${totalPcsCount} Pcs Aktif`,
      delta: "+98% AI",
    },
    { label: "Jun", value: 74, detail: "74 Pcs Custom" },
    { label: "Jul", value: 94, detail: "94 Pcs Custom" },
    { label: "Agu", value: 76, detail: "76 Pcs Custom" },
    { label: "Sep", value: 52, detail: "52 Pcs Custom" },
    { label: "Okt", value: 90, detail: "90 Pcs Custom" },
    { label: "Nov", value: 72, detail: "72 Pcs Custom" },
    { label: "Des", value: 98, detail: "98 Pcs Hampers" },
  ];

  const categoryChartData = CATEGORIES.map((cat) => {
    const cnt = stats?.by_category?.[cat] || 0;
    return {
      label: cat.replace("Custom ", ""),
      value: Math.min(120, Math.max(24, cnt * 28)),
      detail: `${cnt} Pesanan (${cat})`,
      delta: "AI 98%",
    };
  });

  const activeBars =
    chartMode === "monthly" ? monthlyChartData : categoryChartData;

  // Prevent SSR hydration mismatch
  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F1F4F9] select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Memuat Toko Firaza...</p>
        </div>
      </div>
    );
  }

  // Unauthenticated view
  if (!authUser) {
    return (
      <LoginView
        loginForm={loginForm}
        setLoginForm={setLoginForm}
        handleLogin={handleLogin}
        authLoading={authLoading}
        authError={authError}
        setAuthError={setAuthError}
      />
    );
  }

  // Authenticated workspace shell
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F0F3F8] text-slate-900 select-none relative">
      {/* Ambient Apple Spatial Mesh Orbs for Frosted Glass Depth */}
      <div className="fixed pointer-events-none -top-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl z-0" />
      <div className="fixed pointer-events-none top-1/4 -right-24 w-[500px] h-[500px] bg-indigo-200/35 rounded-full blur-3xl z-0" />
      <div className="fixed pointer-events-none -bottom-36 left-1/3 w-[600px] h-[600px] bg-emerald-200/25 rounded-full blur-3xl z-0" />

      {/* Glass Sidebar Navigation */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        toggleSidebar={toggleSidebar}
        navItems={navItems}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setEditingOrderId={setEditingOrderId}
        handleAskRAG={handleAskRAG}
        fetchDatasetOverview={fetchDatasetOverview}
        ragResult={ragResult}
        handleLogout={handleLogout}
      />

      {/* Main Content Scroll Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto select-auto relative z-10">
        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-8 xl:px-10 py-6 sm:py-8 flex-1 flex flex-col">
          {/* Top Header */}
          <Header
            sidebarOpen={sidebarOpen}
            toggleSidebar={toggleSidebar}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            currentPageInfo={currentPageInfo}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isProduksi={isProduksi}
            setEditingOrderId={setEditingOrderId}
            fetchAllData={fetchAllData}
            loading={loading}
            profileMenuOpen={profileMenuOpen}
            setProfileMenuOpen={setProfileMenuOpen}
            greetingName={greetingName}
            authUser={authUser}
            handleLogout={handleLogout}
            orders={orders}
            customers={customers}
            handleStartEditOrder={handleStartEditOrder}
            setCustomerForm={setCustomerForm}
          />

          {/* Global Toast Notification */}
          <Toast notification={notification} />

          {/* Tab 1: Dashboard Utama */}
        {activeTab === "dashboard" && (
          <DashboardView
            totalPcsCount={totalPcsCount}
            totalOrdersCount={totalOrdersCount}
            datasetInfo={datasetInfo}
            setActiveTab={setActiveTab}
            fetchDatasetOverview={fetchDatasetOverview}
            chartMode={chartMode}
            setChartMode={setChartMode}
            selectedBarIdx={selectedBarIdx}
            setSelectedBarIdx={setSelectedBarIdx}
            activeBars={activeBars}
            orders={orders}
            handleStartEditOrder={handleStartEditOrder}
            inProgressCount={inProgressCount}
            progressPercent={progressPercent}
            isProduksi={isProduksi}
            setEditingOrderId={setEditingOrderId}
            handleAdvanceStatus={handleAdvanceStatus}
            handleCopyText={handleCopyText}
            copiedId={copiedId}
            ragResult={ragResult}
            handleAskRAG={handleAskRAG}
          />
        )}

        {/* Tab 2: Ekstrak Order AI */}
        {activeTab === "create-order" && (
          <CreateOrderView
            rawChat={rawChat}
            setRawChat={setRawChat}
            aiAnalyzing={aiAnalyzing}
            handleRunAIExtraction={handleRunAIExtraction}
            aiResultMeta={aiResultMeta}
            handleSaveOrder={handleSaveOrder}
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            handleAddItemRow={handleAddItemRow}
            handleRemoveItemRow={handleRemoveItemRow}
            editingOrderId={editingOrderId}
          />
        )}

        {/* Tab 3: Kanban & Daftar Pesanan */}
        {activeTab === "orders" && (
          <OrdersView
            orders={orders}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            handleStartEditOrder={handleStartEditOrder}
            handleDeleteOrder={handleDeleteOrder}
            handleAdvanceStatus={handleAdvanceStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* Tab 4: Manajemen Pelanggan */}
        {activeTab === "customers" && (
          <CustomersView
            handleSaveCustomer={handleSaveCustomer}
            customerForm={customerForm}
            setCustomerForm={setCustomerForm}
            customers={customers}
            handleDeleteCustomer={handleDeleteCustomer}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        )}

        {/* Tab 5: Asisten Katalog RAG */}
        {activeTab === "rag" && (
          <RagCatalogView
            handleAskRAG={handleAskRAG}
            ragQuery={ragQuery}
            setRagQuery={setRagQuery}
            ragLoading={ragLoading}
            ragResult={ragResult}
          />
        )}

        {/* Tab 6: Dataset & Model AI */}
        {activeTab === "datasets" && (
          <DatasetsView
            datasetInfo={datasetInfo}
            fetchDatasetOverview={fetchDatasetOverview}
          />
        )}
        </div>
      </div>
    </div>
  );
}
