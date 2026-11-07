import React from "react";
import { Edit3, Trash2, Search, X } from "lucide-react";
import { inputSoftClass } from "../../constants";

export default function CustomersView({
  handleSaveCustomer,
  customerForm,
  setCustomerForm,
  customers = [],
  handleDeleteCustomer,
  searchQuery = "",
  setSearchQuery,
}) {
  const q = (searchQuery || "").trim().toLowerCase();
  const filteredCustomers = q
    ? customers.filter((c) => {
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
    : customers;

  return (
    <div className="page-transition space-y-6">
      {/* Active Search Filter Banner */}
      {searchQuery && (
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl apple-glass-card border border-white/80 shadow-sm text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Menampilkan pelanggan untuk pencarian:{" "}
              <strong className="text-slate-900">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full apple-glass-pill font-mono text-[10px] text-slate-700 font-bold border border-white/80">
              {filteredCustomers.length} pelanggan
            </span>
          </div>
          {setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Pencarian</span>
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        <form
          onSubmit={handleSaveCustomer}
          className="lg:col-span-4 apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-4 relative overflow-hidden"
        >
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {customerForm.id ? "Edit Data Pelanggan" : "Tambah Pelanggan Baru"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola nomor WhatsApp, email, dan alamat pengiriman
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nama Lengkap *
            </label>
            <input
              type="text"
              required
              value={customerForm.name}
              onChange={(e) =>
                setCustomerForm({ ...customerForm, name: e.target.value })
              }
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={customerForm.phone}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  phone: e.target.value,
                })
              }
              placeholder="0812..."
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Email
            </label>
            <input
              type="email"
              value={customerForm.email}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  email: e.target.value,
                })
              }
              placeholder="nama@email.com"
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Alamat Pengiriman
            </label>
            <textarea
              rows={3}
              value={customerForm.address}
              onChange={(e) =>
                setCustomerForm({
                  ...customerForm,
                  address: e.target.value,
                })
              }
              placeholder="Alamat lengkap tujuan kirim..."
              className={`${inputSoftClass} resize-none`}
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-md shadow-black/10 active:scale-[0.99] transition-all"
            >
              {customerForm.id ? "Perbarui Data" : "Simpan Pelanggan"}
            </button>
            {customerForm.id && (
              <button
                type="button"
                onClick={() =>
                  setCustomerForm({
                    id: null,
                    name: "",
                    phone: "",
                    email: "",
                    address: "",
                  })
                }
                className="px-4 py-3 rounded-2xl apple-glass-pill hover:bg-white text-xs font-bold text-slate-600 transition-all border border-white/80"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-8 apple-glass-card rounded-[32px] p-6 sm:p-7 relative overflow-hidden">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Database Pelanggan Toko Firaza
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftar kontak terverifikasi untuk pengiriman bordir & hampers
              </p>
            </div>
            <span className="text-xs font-bold text-slate-800 apple-glass-pill px-3 py-1 rounded-full border border-white/80 shadow-xs">
              {filteredCustomers.length} Pelanggan
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400 space-y-1">
                <p className="font-bold text-slate-700">
                  Tidak ada pelanggan yang cocok
                </p>
                <p>
                  {searchQuery
                    ? `Tidak ada data dengan kata kunci "${searchQuery}".`
                    : "Belum ada pelanggan terdaftar."}
                </p>
              </div>
            ) : (
              filteredCustomers.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl apple-glass-pill hover:bg-white/95 hover:shadow-md hover:scale-[1.005] transition-all group border border-white/80"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-slate-950 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
                      {(c.name || "P").charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {c.phone || "Tanpa telepon"} • {c.address || "Tanpa alamat"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-800 border border-emerald-500/30 text-xs font-bold">
                      {c.total_orders || 0} Order
                    </span>
                    <button
                      onClick={() =>
                        setCustomerForm({
                          id: c.id,
                          name: c.name,
                          phone: c.phone || "",
                          email: c.email || "",
                          address: c.address || "",
                        })
                      }
                      className="p-2 rounded-xl apple-glass-pill hover:bg-white text-slate-600 hover:text-black transition-all border border-white/80"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id)}
                      className="p-2 rounded-xl apple-glass-pill hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-all border border-white/80"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
