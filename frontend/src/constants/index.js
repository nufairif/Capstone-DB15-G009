export const API_BASE = "http://localhost:8000";

export const STATUS_FLOW = ["New", "Design/Preparation", "Production", "Completed"];

export const STATUS_PILL = {
  New: "bg-sky-50 text-sky-700 border border-sky-200/60",
  "Design/Preparation": "bg-amber-50 text-amber-700 border border-amber-200/60",
  Production: "bg-indigo-50 text-indigo-700 border border-indigo-200/60",
  Completed: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
};

export const CATEGORIES = [
  "Hampers",
  "Custom Sajadah",
  "Custom Handuk",
  "Ready Stock",
  "Other",
];

export const PRESET_CHATS = [
  {
    label: "Hampers Pernikahan + Kartu Ucapan",
    tag: "Hampers",
    text: "Assalamualaikum kak, saya Rina mau pesen hampers pernikahan 2 paket wrn navy. Isinya handuk custom uk 70x140 bdr nama 'Nabila & Dimas' pake font sambung di tengah bawah. Sekalian bikinin kartu ucapan selamat menikah dari Rina ya kak.",
  },
  {
    label: "Custom Sajadah Kaligrafi Arab",
    tag: "Custom Sajadah",
    text: "Halo min, mau order sjdh custom dewasa 3 pcs wrn hijau emerald. Bdr nama 'H. Ahmad Dahlan' pake font kaligrafi arab di pojok kanan bawah ya. Atas nama Farhan.",
  },
  {
    label: "Custom Handuk Mandi Bordir",
    tag: "Custom Handuk",
    text: "Pagi kak, pesen handuk mandi custom uk 70x140 wrn maroon 4 pcs. Bordir tulisan 'Budi Santoso' font kapital semua di bagian list bawah handuk. Atas nama Budi.",
  },
  {
    label: "Sajadah Travel Ready Stock Polos",
    tag: "Ready Stock",
    text: "Kak mau beli sajadah travel ready stock warna dusty pink 5 pcs polos aja ga usah bordir nama. Atas nama Siti.",
  },
];

export const DEMO_ACCOUNTS = [
  {
    username: "admin",
    email: "admin@firaza.id",
    password: "admin123",
    full_name: "Admin Firaza",
    greeting: "Admin",
    role: "Super Admin",
  },
  {
    username: "cs",
    email: "cs@firaza.id",
    password: "cs123",
    full_name: "Rina (Customer Service)",
    greeting: "Rina",
    role: "CS & Order Specialist",
  },
  {
    username: "produksi",
    email: "produksi@firaza.id",
    password: "firaza2026",
    full_name: "Farhan (Produksi)",
    greeting: "Farhan",
    role: "Production Lead",
  },
];

export const inputSoftClass =
  "w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 px-4 py-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10 focus:outline-none transition-all shadow-sm";

