import React from "react";
import { Wand2, Plus, Gift } from "lucide-react";
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
      {/* Left Column: Raw Chat & Black AI Action Card */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-[28px] p-7 shadow-soft space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-[#111111]">
                Input Chat Pelanggan (WA / Shopee)
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Predictive AI + Local RAG + Generative AI Extractor
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-[11px] font-bold text-neutral-400 uppercase">
              Contoh Chat Cepat:
            </p>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_CHATS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRawChat(p.text)}
                  className={`text-left px-4 py-2.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all ${
                    rawChat === p.text
                      ? "bg-[#0A0A0A] text-white"
                      : "bg-[#F8F9FC] hover:bg-neutral-100 text-neutral-700"
                  }`}
                >
                  <span className="truncate">{p.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-lg ${
                      rawChat === p.text
                        ? "bg-white/20 text-white"
                        : "bg-white text-neutral-500"
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
            className={`${inputSoftClass} resize-none leading-relaxed`}
          />

          <button
            type="button"
            onClick={handleRunAIExtraction}
            disabled={aiAnalyzing}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
          >
            <Wand2 className="w-4 h-4" />
            <span>
              {aiAnalyzing
                ? "Mengekstrak dengan AI..."
                : "Ekstrak Otomatis ke Form (AI)"}
            </span>
          </button>
        </div>

        {aiResultMeta && (
          <div className="bg-[#0A0A0A] text-white rounded-[28px] p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
              <span className="font-bold">Hasil Diagnostik AI</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#E7F8EE] text-[#16A34A] font-bold text-[10px]">
                {(aiResultMeta.prediction.confidence * 100).toFixed(1)}% Akurat
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Kategori Prediksi</span>
              <span className="font-bold">
                {aiResultMeta.prediction.category}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Referensi RAG</span>
              <span className="font-mono">
                {(aiResultMeta.meta.rag_retrieved_doc_ids || []).join(", ")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Engine Ekstraksi</span>
              <span className="font-mono">
                {aiResultMeta.meta.used_fallback
                  ? "Local Rule Fallback"
                  : aiResultMeta.meta.llm_model}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Structured Order Summary Form */}
      <form
        onSubmit={handleSaveOrder}
        className="lg:col-span-7 bg-white rounded-[28px] p-7 shadow-soft space-y-6"
      >
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#111111]">
              Formulir Spesifikasi Pesanan Custom
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Terisi otomatis oleh AI — silakan tinjau sebelum disimpan
            </p>
          </div>
          <span className="px-3.5 py-1.5 rounded-xl bg-[#F4F5F9] text-xs font-bold text-[#111111]">
            {orderForm.category}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-neutral-600 mb-1.5">
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
            <label className="block text-xs font-bold text-neutral-600 mb-1.5">
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
            <label className="block text-xs font-bold text-neutral-600 mb-1.5">
              Kategori AI
            </label>
            <select
              value={orderForm.category}
              onChange={(e) =>
                setOrderForm({
                  ...orderForm,
                  category: e.target.value,
                })
              }
              className={inputSoftClass}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Items */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-[#111111]">
              Item Produk & Spesifikasi Bordir ({orderForm.items.length})
            </span>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs font-bold text-[#111111] hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Tambah Item
            </button>
          </div>

          {orderForm.items.map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-3xl bg-[#F8F9FC] space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-neutral-500">
                  Item #{idx + 1}
                </span>
                {orderForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItemRow(idx)}
                    className="text-xs font-bold text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-bold border border-neutral-300"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-neutral-500 mb-1">
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
                    className="w-full rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Greeting Card Section */}
        <div className="p-5 rounded-3xl bg-[#F8F9FC] space-y-3.5">
          <label className="flex items-center gap-2.5 text-xs font-extrabold text-[#111111] cursor-pointer">
            <input
              type="checkbox"
              checked={orderForm.greeting_card_requested}
              onChange={(e) =>
                setOrderForm({
                  ...orderForm,
                  greeting_card_requested: e.target.checked,
                })
              }
              className="w-4 h-4 rounded accent-[#0A0A0A]"
            />
            <Gift className="w-4 h-4" />
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
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
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
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
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
                  className="rounded-xl bg-white px-3 py-2 text-xs font-semibold border border-neutral-200/70"
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
                className="w-full rounded-xl bg-white p-3 text-xs border border-neutral-200/70 italic"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="py-3.5 px-7 rounded-2xl bg-[#0A0A0A] hover:bg-neutral-800 text-white font-bold text-xs shadow-lg transition-all"
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

