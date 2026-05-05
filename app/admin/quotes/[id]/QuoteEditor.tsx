"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { updateQuote } from "@/app/admin/quotes/[id]/actions";
import { formatCurrency, formatDate, formatNumber } from "@/lib/crm/formatters";
import {
  calculateQuoteItemLineTotal,
  calculateQuoteTotals,
  quoteStatuses,
  quoteStatusLabels,
  type Quote,
  type QuoteItem,
} from "@/lib/crm/quotes";
import {
  quoteProductCategories,
  quoteProductCategoryLabels,
  quoteProductUnits,
  quoteProductUnitLabels,
} from "@/lib/crm/products";

type EditableQuoteItem = {
  key: string;
  id: string | null;
  product_id: string | null;
  product_name: string;
  category: QuoteItem["category"];
  unit: QuoteItem["unit"];
  quantity: string;
  unit_price_net: string;
  vat_rate: string;
  sort_order: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]";
const labelClass = "text-sm font-semibold text-[#0A5458]";

function getRowFromItem(item: QuoteItem): EditableQuoteItem {
  return {
    key: item.id,
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    category: item.category,
    unit: item.unit,
    quantity: String(item.quantity),
    unit_price_net: String(item.unit_price_net),
    vat_rate: String(item.vat_rate),
    sort_order: String(item.sort_order),
    notes: item.notes ?? "",
  };
}

function getNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getNewRow(sortOrder: number): EditableQuoteItem {
  return {
    key: `new-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    product_id: null,
    product_name: "",
    category: "other",
    unit: "fixed",
    quantity: "1",
    unit_price_net: "0",
    vat_rate: "24",
    sort_order: String(sortOrder),
    notes: "",
  };
}

export function QuoteEditor({ quote, items }: { quote: Quote; items: QuoteItem[] }) {
  const [rows, setRows] = useState<EditableQuoteItem[]>(items.map(getRowFromItem));
  const [recalculated, setRecalculated] = useState(false);

  const totals = useMemo(
    () =>
      calculateQuoteTotals(
        rows.map((row) => ({
          quantity: getNumber(row.quantity),
          unit_price_net: getNumber(row.unit_price_net),
          vat_rate: getNumber(row.vat_rate),
        })),
      ),
    [rows],
  );

  function updateRow(rowKey: string, updates: Partial<EditableQuoteItem>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === rowKey ? { ...row, ...updates } : row)),
    );
    setRecalculated(false);
  }

  function addRow() {
    const nextSortOrder =
      rows.reduce((max, row) => Math.max(max, Number.parseInt(row.sort_order, 10) || 0), 0) + 10;
    setRows((currentRows) => [...currentRows, getNewRow(nextSortOrder)]);
    setRecalculated(false);
  }

  function removeRow(rowKey: string) {
    setRows((currentRows) => currentRows.filter((row) => row.key !== rowKey));
    setRecalculated(false);
  }

  return (
    <form action={updateQuote} className="mt-6 space-y-6">
      <input name="quote_id" type="hidden" value={quote.id} />
      <input name="request_id" type="hidden" value={quote.request_id} />

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">Αριθμός προσφοράς</p>
            <p className="mt-2 text-sm font-semibold text-[#2f2b25]">{quote.quote_number}</p>
          </div>
          <label className={labelClass}>
            Κατάσταση
            <select className={`${inputClass} mt-2`} defaultValue={quote.status} name="status">
              {quoteStatuses.map((status) => (
                <option key={status} value={status}>
                  {quoteStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Ισχύει έως
            <input className={`${inputClass} mt-2`} defaultValue={quote.valid_until ?? ""} name="valid_until" type="date" />
          </label>
          <div className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">Ημερομηνία</p>
            <p className="mt-2 text-sm font-semibold text-[#2f2b25]">{formatDate(quote.created_at)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-semibold text-[#0A5458]">Πελάτης</h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#2f2b25]">
              <p className="font-semibold">{quote.customer_name}</p>
              {quote.customer_phone ? <p>Τηλέφωνο: {quote.customer_phone}</p> : null}
              {quote.customer_email ? <p>Email: {quote.customer_email}</p> : null}
              {quote.business_name ? <p>Επωνυμία: {quote.business_name}</p> : null}
              {quote.business_vat ? <p>ΑΦΜ: {quote.business_vat}</p> : null}
              {quote.business_tax_office ? <p>ΔΟΥ: {quote.business_tax_office}</p> : null}
              {quote.business_address ? <p>Διεύθυνση: {quote.business_address}</p> : null}
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-[#0A5458]">Εκδήλωση</h2>
            <div className="mt-4 space-y-2 text-sm leading-6 text-[#2f2b25]">
              <p>Τύπος: {quote.event_type || "-"}</p>
              <p>Ημερομηνία: {formatDate(quote.event_date)}</p>
              <p>Περιοχή: {quote.event_location || "-"}</p>
              <p>Άτομα: {formatNumber(quote.guest_count)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[#0A5458]">Γραμμές προσφοράς</h2>
          <button
            className="w-fit rounded-full border border-[#d9b76f]/40 px-5 py-2.5 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
            onClick={addRow}
            type="button"
          >
            Προσθήκη γραμμής
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {rows.map((row) => {
            const lineTotal = calculateQuoteItemLineTotal({
              quantity: getNumber(row.quantity),
              unit_price_net: getNumber(row.unit_price_net),
            });
            const needsReview = getNumber(row.unit_price_net) === 0 || row.notes.includes("Χρειάζεται");

            return (
              <div className="rounded-2xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 p-4" key={row.key}>
                <input name="row_key" type="hidden" value={row.key} />
                <input name={`item_id_${row.key}`} type="hidden" value={row.id ?? ""} />
                <input name={`product_id_${row.key}`} type="hidden" value={row.product_id ?? ""} />

                <div className="grid gap-4 lg:grid-cols-[1.4fr_0.85fr_0.85fr_0.7fr_0.85fr_0.65fr_0.85fr]">
                  <label className={labelClass}>
                    Προϊόν
                    <input
                      className={`${inputClass} mt-2`}
                      name={`product_name_${row.key}`}
                      onChange={(event) => updateRow(row.key, { product_name: event.target.value })}
                      required
                      type="text"
                      value={row.product_name}
                    />
                  </label>
                  <label className={labelClass}>
                    Κατηγορία
                    <select
                      className={`${inputClass} mt-2`}
                      name={`category_${row.key}`}
                      onChange={(event) => updateRow(row.key, { category: event.target.value as QuoteItem["category"] })}
                      required
                      value={row.category}
                    >
                      {quoteProductCategories.map((category) => (
                        <option key={category} value={category}>
                          {quoteProductCategoryLabels[category]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Μονάδα
                    <select
                      className={`${inputClass} mt-2`}
                      name={`unit_${row.key}`}
                      onChange={(event) => updateRow(row.key, { unit: event.target.value as QuoteItem["unit"] })}
                      required
                      value={row.unit}
                    >
                      {quoteProductUnits.map((unit) => (
                        <option key={unit} value={unit}>
                          {quoteProductUnitLabels[unit]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className={labelClass}>
                    Ποσότητα
                    <input
                      className={`${inputClass} mt-2`}
                      min="0"
                      name={`quantity_${row.key}`}
                      onChange={(event) => updateRow(row.key, { quantity: event.target.value })}
                      step="0.01"
                      type="number"
                      value={row.quantity}
                    />
                  </label>
                  <label className={labelClass}>
                    Τιμή προ ΦΠΑ
                    <input
                      className={`${inputClass} mt-2`}
                      min="0"
                      name={`unit_price_net_${row.key}`}
                      onChange={(event) => updateRow(row.key, { unit_price_net: event.target.value })}
                      step="0.01"
                      type="number"
                      value={row.unit_price_net}
                    />
                  </label>
                  <label className={labelClass}>
                    ΦΠΑ %
                    <input
                      className={`${inputClass} mt-2`}
                      min="0"
                      name={`vat_rate_${row.key}`}
                      onChange={(event) => updateRow(row.key, { vat_rate: event.target.value })}
                      step="0.01"
                      type="number"
                      value={row.vat_rate}
                    />
                  </label>
                  <label className={labelClass}>
                    Σειρά
                    <input
                      className={`${inputClass} mt-2`}
                      name={`sort_order_${row.key}`}
                      onChange={(event) => updateRow(row.key, { sort_order: event.target.value })}
                      step="1"
                      type="number"
                      value={row.sort_order}
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto_auto] md:items-end">
                  <label className={labelClass}>
                    Σημειώσεις γραμμής
                    <textarea
                      className={`${inputClass} mt-2 min-h-20`}
                      name={`notes_${row.key}`}
                      onChange={(event) => updateRow(row.key, { notes: event.target.value })}
                      value={row.notes}
                    />
                  </label>
                  <div className="rounded-xl border border-[#d9b76f]/20 bg-white/75 p-3 text-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">Σύνολο προ ΦΠΑ</p>
                    <p className="mt-1 font-semibold text-[#2f2b25]">{formatCurrency(lineTotal)}</p>
                  </div>
                  <button
                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
                    onClick={() => removeRow(row.key)}
                    type="button"
                  >
                    Αφαίρεση
                  </button>
                </div>

                {needsReview ? (
                  <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    Χρειάζεται έλεγχος τιμής πριν την αποστολή.
                  </p>
                ) : null}
              </div>
            );
          })}

          {rows.length === 0 ? (
            <p className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4 text-sm leading-6 text-[#5f594f]">
              Δεν υπάρχουν γραμμές στην προσφορά.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            className="rounded-full border border-[#d9b76f]/40 px-5 py-2.5 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
            onClick={() => setRecalculated(true)}
            type="button"
          >
            Επανυπολογισμός
          </button>
          {recalculated ? (
            <span className="self-center text-sm font-semibold text-emerald-700">
              Τα σύνολα ενημερώθηκαν στην προεπισκόπηση.
            </span>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.45fr]">
        <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Σημειώσεις & όροι</h2>
          <div className="mt-5 grid gap-4">
            <label className={labelClass}>
              Δημόσιες σημειώσεις
              <textarea className={`${inputClass} mt-2 min-h-28`} defaultValue={quote.public_notes ?? ""} name="public_notes" />
            </label>
            <label className={labelClass}>
              Όροι προσφοράς
              <textarea className={`${inputClass} mt-2 min-h-28`} defaultValue={quote.terms ?? ""} name="terms" />
            </label>
            <label className={labelClass}>
              Εσωτερικές σημειώσεις
              <textarea className={`${inputClass} mt-2 min-h-24`} defaultValue={quote.internal_notes ?? ""} name="internal_notes" />
            </label>
          </div>
        </div>

        <aside className="rounded-2xl border border-[#d9b76f]/25 bg-[#0A5458] p-5 text-white shadow-lg shadow-[#0A5458]/10">
          <h2 className="text-xl font-semibold">Σύνολα</h2>
          <div className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span>Υποσύνολο</span>
              <span className="font-semibold">{formatCurrency(totals.subtotal_net)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>ΦΠΑ</span>
              <span className="font-semibold">{formatCurrency(totals.vat_amount)}</span>
            </div>
            <div className="border-t border-white/20 pt-3">
              <div className="flex items-center justify-between gap-4 text-lg font-bold">
                <span>Σύνολο με ΦΠΑ</span>
                <span>{formatCurrency(totals.total_gross)}</span>
              </div>
            </div>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#07383b]" type="submit">
          Αποθήκευση αλλαγών
        </button>
        <Link
          className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
          href={`/admin/quotes/${quote.id}/pdf`}
          target="_blank"
        >
          Προεπισκόπηση PDF
        </Link>
        <Link
          className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
          href={`/admin/quotes/${quote.id}/pdf?download=1`}
        >
          Λήψη PDF
        </Link>
        <Link
          className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
          href={`/admin/requests/${quote.request_id}`}
        >
          Πίσω στο αίτημα
        </Link>
      </div>
    </form>
  );
}
