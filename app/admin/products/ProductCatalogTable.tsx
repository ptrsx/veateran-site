"use client";

import { useState } from "react";

import { createQuoteProduct, updateQuoteProduct } from "@/app/admin/products/actions";
import { formatCurrency, formatNumber } from "@/lib/crm/formatters";
import {
  getQuoteProductAudienceLabel,
  getQuoteProductCategoryLabel,
  getQuoteProductUnitLabel,
  quoteProductAudiences,
  quoteProductAudienceLabels,
  quoteProductCategories,
  quoteProductCategoryLabels,
  quoteProductUnits,
  quoteProductUnitLabels,
  type QuoteProduct,
} from "@/lib/crm/products";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]";
const labelClass = "text-sm font-semibold text-[#0A5458]";
const actionButtonClass = "rounded-full px-4 py-2 text-sm font-bold transition";

function ProductFields({ product }: { product?: QuoteProduct }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}

      <label className={`${labelClass} xl:col-span-2`}>
        Προϊόν
        <input className={inputClass} defaultValue={product?.name ?? ""} name="name" required type="text" />
      </label>

      <label className={labelClass}>
        Κατηγορία
        <select className={inputClass} defaultValue={product?.category ?? "food"} name="category" required>
          {quoteProductCategories.map((category) => (
            <option key={category} value={category}>
              {quoteProductCategoryLabels[category]}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Κοινό
        <select className={inputClass} defaultValue={product?.audience ?? "adult"} name="audience" required>
          {quoteProductAudiences.map((audience) => (
            <option key={audience} value={audience}>
              {quoteProductAudienceLabels[audience]}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Μονάδα χρέωσης
        <select className={inputClass} defaultValue={product?.unit ?? "per_person"} name="unit" required>
          {quoteProductUnits.map((unit) => (
            <option key={unit} value={unit}>
              {quoteProductUnitLabels[unit]}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClass}>
        Τιμή προ ΦΠΑ
        <input
          className={inputClass}
          defaultValue={product?.price_net ?? 0}
          min="0"
          name="price_net"
          step="0.01"
          type="number"
        />
      </label>

      <label className={labelClass}>
        ΦΠΑ %
        <input
          className={inputClass}
          defaultValue={product?.vat_rate ?? 24}
          min="0"
          name="vat_rate"
          step="0.01"
          type="number"
        />
      </label>

      <label className={labelClass}>
        Σειρά
        <input
          className={inputClass}
          defaultValue={product?.sort_order ?? 0}
          name="sort_order"
          step="1"
          type="number"
        />
      </label>

      <label className="flex items-center gap-3 rounded-xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 px-3 py-3 text-sm font-semibold text-[#0A5458] md:mt-7">
        <input
          className="h-4 w-4 accent-[#0A5458]"
          defaultChecked={product?.is_active ?? true}
          name="is_active"
          type="checkbox"
          value="1"
        />
        Ενεργό
      </label>

      <label className={`${labelClass} md:col-span-2 xl:col-span-4`}>
        Σημειώσεις
        <textarea className={`${inputClass} min-h-24`} defaultValue={product?.notes ?? ""} name="notes" />
      </label>
    </div>
  );
}

export function ProductCatalogTable({ products }: { products: QuoteProduct[] }) {
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm leading-6 text-[#5f594f]">
          {formatNumber(products.length)} προϊόντα στον κατάλογο.
        </p>
        <button
          className="rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#07383b]"
          onClick={() => {
            setEditingProductId(null);
            setIsCreating(true);
          }}
          type="button"
        >
          Νέο προϊόν
        </button>
      </div>

      {isCreating ? (
        <form
          action={createQuoteProduct}
          className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5"
        >
          <h2 className="text-xl font-semibold text-[#0A5458]">Νέο προϊόν</h2>
          <div className="mt-5">
            <ProductFields />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <button className={`${actionButtonClass} bg-[#0A5458] text-white hover:bg-[#07383b]`} type="submit">
              Αποθήκευση
            </button>
            <button
              className={`${actionButtonClass} border border-[#d9b76f]/40 text-[#0A5458] hover:bg-[#0A5458]/10`}
              onClick={() => setIsCreating(false)}
              type="button"
            >
              Ακύρωση
            </button>
          </div>
        </form>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-white/85 shadow-xl shadow-[#0A5458]/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#d9b76f]/20 text-left text-sm">
            <thead className="bg-[#f8f2e5] text-xs font-bold uppercase tracking-wide text-[#0A5458]">
              <tr>
                <th className="px-4 py-3">Προϊόν</th>
                <th className="px-4 py-3">Κατηγορία</th>
                <th className="px-4 py-3">Κοινό</th>
                <th className="px-4 py-3">Μονάδα χρέωσης</th>
                <th className="px-4 py-3">Τιμή προ ΦΠΑ</th>
                <th className="px-4 py-3">ΦΠΑ %</th>
                <th className="px-4 py-3">Ενεργό</th>
                <th className="px-4 py-3">Σειρά</th>
                <th className="px-4 py-3">Ενέργειες</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9b76f]/15">
              {products.map((product) => {
                const isEditing = editingProductId === product.id;

                if (isEditing) {
                  return (
                    <tr key={product.id}>
                      <td className="bg-[#fffaf0]/80 px-4 py-5" colSpan={9}>
                        <form action={updateQuoteProduct}>
                          <ProductFields product={product} />
                          <div className="mt-5 flex flex-wrap gap-3">
                            <button className={`${actionButtonClass} bg-[#0A5458] text-white hover:bg-[#07383b]`} type="submit">
                              Αποθήκευση
                            </button>
                            <button
                              className={`${actionButtonClass} border border-[#d9b76f]/40 text-[#0A5458] hover:bg-[#0A5458]/10`}
                              onClick={() => setEditingProductId(null)}
                              type="button"
                            >
                              Ακύρωση
                            </button>
                          </div>
                        </form>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr className={`transition hover:bg-[#fff7e6] ${product.is_active ? "" : "opacity-65"}`} key={product.id}>
                    <td className="min-w-56 px-4 py-3">
                      <span className="font-semibold text-[#0A5458]">{product.name}</span>
                      {product.notes ? (
                        <span className="mt-1 block max-w-md text-xs leading-5 text-[#5f594f]">{product.notes}</span>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{getQuoteProductCategoryLabel(product.category)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{getQuoteProductAudienceLabel(product.audience)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{getQuoteProductUnitLabel(product.unit)}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatCurrency(product.price_net)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatNumber(product.vat_rate, 2)}%</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${
                          product.is_active
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-zinc-200 bg-zinc-50 text-zinc-600"
                        }`}
                      >
                        {product.is_active ? "Ναι" : "Όχι"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{product.sort_order}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <button
                        className={`${actionButtonClass} border border-[#d9b76f]/40 text-[#0A5458] hover:bg-[#0A5458]/10`}
                        onClick={() => {
                          setIsCreating(false);
                          setEditingProductId(product.id);
                        }}
                        type="button"
                      >
                        Επεξεργασία
                      </button>
                    </td>
                  </tr>
                );
              })}

              {products.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-[#5f594f]" colSpan={9}>
                    Δεν υπάρχουν προϊόντα ακόμη.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
