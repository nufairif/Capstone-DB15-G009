import React from "react";
import { Wand2, Plus, Gift, ChevronDown, Loader2 } from "lucide-react";
import { PRESET_CHATS, CATEGORIES, inputSoftClass } from "../../constants";

export default function CreateOrderView({
  rawChat,
  setRawChat,
  aiAnalyzing,
  handleRunAIExtraction,
  aiResultMeta,
  handleSaveOrder,
  orderForm,
  setOrderForm,
  handleAddItemRow,
  handleRemoveItemRow,
  editingOrderId,
}) {
  return (
    <div className="page-transition grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
      {/* Left Column: Raw Chat & Apple Dark Glass AI Card */}
      <div className="lg:col-span-5 space-y-6">
        <div className="apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Input Chat Pelanggan (WA / Shopee)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Predictive AI + Local RAG + Generative AI Extractor
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Contoh Chat Cepat:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CHATS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawChat(p.text)}
                  className={`text-left px-3.5 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all border ${
                    rawChat === p.text
                      ? "bg-slate-900 text-white border-slate-900 shadow-md scale-[1.01]"
                      : "apple-glass-pill hover:bg-white text-slate-700 border-white/80"
                  }`}
                >
                  <span className="truncate pr-2">{p.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-bold ${
                      rawChat === p.text
                        ? "bg-white/20 text-white"
                        : "bg-slate-200/60 text-slate-700"
                    }`}
                  >
                    {p.tag}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            rows={5}
            value={rawChat}
            onChange={(e) => setRawChat(e.target.value)}
            placeholder="Tempel chat WhatsApp pelanggan di sini..."
            className={`${inputSoftClass} resize-none leading-relaxed rounded-2xl`}
          />

          <button
            type="button"
            onClick={handleRunAIExtraction}
            disabled={aiAnalyzing}
            className="w-full py-3.5 px-6 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/10 active:scale-[0.99] transition-all disabled:opacity-75"
          >
            {aiAnalyzing ? (
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>
              {aiAnalyzing
                ? "Mengekstrak dengan Llama 3.2 3B..."
                : "Ekstrak Otomatis ke Form (AI)"}
            </span>
          </button>

          {aiAnalyzing && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 text-[11px] font-medium flex items-center gap-2.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span>Memproses chat dengan model LLM lokal di CPU (estimasi 15-25 detik)...</span>
            </div>
          )}
        </div>

        {aiResultMeta && (
          <div className="apple-glass-dark text-white rounded-[32px] p-6 space-y-3.5 text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Diagnostik Pipeline AI
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                {(aiResultMeta.prediction.confidence * 100).toFixed(1)}% Akurat
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Kategori Prediksi SVM</span>
              <span className="font-bold text-white bg-white/10 px-2.5 py-1 rounded-xl">
                {aiResultMeta.prediction.category}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Referensi RAG Lokal</span>
              <span className="font-mono text-[11px] text-teal-300 bg-teal-500/10 px-2 py-0.5 rounded-lg border border-teal-500/20">
                {(aiResultMeta.meta.rag_retrieved_doc_ids || []).join(", ") || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Engine Ekstraksi</span>
              <span className="font-mono text-[11px] text-slate-300">
                {aiResultMeta.meta.used_fallback
                  ? "Rule-based Fallback"
                  : aiResultMeta.meta.llm_model}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Structured Order Summary Form */}
      <form
        onSubmit={handleSaveOrder}
        className="lg:col-span-7 apple-glass-card rounded-[32px] p-6 sm:p-7 space-y-6 relative overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Formulir Spesifikasi Pesanan Custom
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Terisi otomatis oleh AI — silakan tinjau sebelum disimpan
            </p>
          </div>
          <span className="px-3 py-1 rounded-full apple-glass-pill text-xs font-bold text-slate-800 border border-white/80">
            {orderForm.category}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nama Pelanggan *
            </label>
            <input
              type="text"
              required
              value={orderForm.customer_name}
              onChange={(e) =>
                setOrderForm({
                  ...orderForm,
                  customer_name: e.target.value,
                })
              }
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nomor WhatsApp
            </label>
            <input
              type="text"
              value={orderForm.customer_phone}
              onChange={(e) =>
                setOrderForm({
                  ...orderForm,
                  customer_phone: e.target.value,
                })
              }
              placeholder="0812..."
              className={inputSoftClass}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Kategori Produk
            </label>
            <div className="relative">
              <select
                value={orderForm.category}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    category: e.target.value,
                  })
                }
                className={`${inputSoftClass} appearance-none pr-10 cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {/* Dynamic Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Item Produk & Spesifikasi Bordir ({orderForm.items.length})
            </span>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs font-bold text-slate-800 hover:text-black apple-glass-pill hover:bg-white px-3.5 py-1.5 rounded-full flex items-center gap-1 transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Item
            </button>
          </div>

          {orderForm.items.map((item, idx) => (
            <div
              key={idx}
              className="p-4 sm:p-5 rounded-2xl apple-glass-pill border border-white/80 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Item #{idx + 1}
                </span>
                {orderForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="text-xs font-bold text-rose-500 hover:text-rose-700 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Jenis Produk
                  </label>
                  <input
                    type="text"
                    value={item.product_type}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].product_type = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Jumlah (Qty)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].quantity = parseInt(
                        e.target.value || "1",
                        10
                      );
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Warna
                  </label>
                  <input
                    type="text"
                    value={item.color || ""}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].color = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Ukuran
                  </label>
                  <input
                    type="text"
                    value={item.size || ""}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].size = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Teks Bordir Custom
                  </label>
                  <input
                    type="text"
                    value={item.custom_text || ""}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].custom_text = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    placeholder="Kosongkan jika polos"
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Gaya Font
                  </label>
                  <input
                    type="text"
                    value={item.font_style || ""}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].font_style = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Posisi Layout Bordir
                  </label>
                  <input
                    type="text"
                    value={item.layout_notes || ""}
                    onChange={(e) => {
                      const updated = [...orderForm.items];
                      updated[idx].layout_notes = e.target.value;
                      setOrderForm({ ...orderForm, items: updated });
                    }}
                    className={`${inputSoftClass} !py-2`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Greeting Card Section */}
        <div className="p-4 sm:p-5 rounded-2xl apple-glass-pill border border-white/80 space-y-3.5">
          <label className="flex items-center gap-2.5 text-xs font-bold text-slate-900 cursor-pointer">
            <input
              type="checkbox"
              checked={orderForm.greeting_card_requested}
              onChange={(e) =>
                setOrderForm({
                  ...orderForm,
                  greeting_card_requested: e.target.checked,
                })
              }
              className="w-4 h-4 rounded accent-slate-900"
            />
            <Gift className="w-4 h-4 text-amber-500" />
            <span>Sertakan Kartu Ucapan (Generated by AI)</span>
          </label>

          {orderForm.greeting_card_requested && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Momen / Acara"
                  value={orderForm.greeting_occasion}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      greeting_occasion: e.target.value,
                    })
                  }
                  className={`${inputSoftClass} !py-2`}
                />
                <input
                  type="text"
                  placeholder="Pengirim"
                  value={orderForm.greeting_sender}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      greeting_sender: e.target.value,
                    })
                  }
                  className={`${inputSoftClass} !py-2`}
                />
                <input
                  type="text"
                  placeholder="Penerima"
                  value={orderForm.greeting_recipient}
                  onChange={(e) =>
                    setOrderForm({
                      ...orderForm,
                      greeting_recipient: e.target.value,
                    })
                  }
                  className={`${inputSoftClass} !py-2`}
                />
              </div>
              <textarea
                rows={3}
                value={orderForm.greeting_draft}
                onChange={(e) =>
                  setOrderForm({
                    ...orderForm,
                    greeting_draft: e.target.value,
                  })
                }
                className={`${inputSoftClass} italic resize-none`}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="py-3.5 px-8 rounded-2xl bg-slate-950 hover:bg-black text-white font-bold text-xs shadow-lg shadow-black/10 active:scale-[0.99] transition-all"
          >
            {editingOrderId
              ? "Simpan Perubahan Pesanan"
              : "Simpan Pesanan ke Database"}
          </button>
        </div>
      </form>
    </div>
  );
}

