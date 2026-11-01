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
        <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-white shadow-soft text-xs">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              Menampilkan pelanggan untuk pencarian:{" "}
              <strong className="text-black">&ldquo;{searchQuery}&rdquo;</strong>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#F4F5F9] font-mono text-[10px] text-neutral-500 font-bold">
              {filteredCustomers.length} pelanggan
            </span>
          </div>
          {setSearchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-neutral-500 hover:text-black flex items-center gap-1"
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
          className="lg:col-span-4 bg-white rounded-[28px] p-7 shadow-soft space-y-4"
        >
          <h2 className="text-base font-extrabold text-[#111111]">
            {customerForm.id ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
          </h2>
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
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
            <label className="block text-xs font-bold text-neutral-600 mb-1">
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
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
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
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1">
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
              className={inputSoftClass}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-[#0A0A0A] text-white font-bold text-xs"
            >
              {customerForm.id ? "Perbarui" : "Simpan Pelanggan"}
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
                className="px-4 py-3 rounded-2xl bg-[#F4F5F9] text-xs font-bold"
              >
                Batal
              </button>
            )}
          </div>
        </form>

        <div className="lg:col-span-8 bg-white rounded-[28px] p-7 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-[#111111]">
              Database Pelanggan Toko Firaza
            </h2>
            <span className="text-xs font-bold text-neutral-400">
              {filteredCustomers.length} Pelanggan
            </span>
          </div>

          <div className="space-y-2.5">
            {filteredCustomers.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 space-y-1">
                <p className="font-bold text-neutral-700">
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
                  className="flex items-center justify-between p-4 rounded-2xl bg-[#F8F9FC] hover:bg-white hover:shadow-row transition-all"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#0A0A0A] text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(c.name || "P").charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#111111] truncate">
                        {c.name}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {c.phone || "-"} • {c.address || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-3 py-1 rounded-lg bg-[#E7F8EE] text-[#16A34A] text-xs font-bold">
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
                      className="p-2 rounded-xl bg-white shadow-soft text-neutral-600 hover:text-black"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(c.id)}
                      className="p-2 rounded-xl bg-white shadow-soft text-neutral-600 hover:text-red-600"
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
