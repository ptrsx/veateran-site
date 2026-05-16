"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { updateQuote } from "@/app/admin/quotes/[id]/actions";
import { formatCurrency, formatDate, formatNumber } from "@/lib/crm/formatters";
import {
  calculateQuoteItemLineTotal,
  calculateQuoteTotals,
  getQuoteItemLineType,
  isConsumablesCost,
  isStaffCost,
  isTransportCost,
  isVanRentalCost,
  quoteItemGroupLabels,
  quoteStatuses,
  quoteStatusLabels,
  validateMarginPercent,
  type Quote,
  type QuoteItem,
  type QuoteItemAudience,
  type QuoteItemLineType,
  type QuoteTotals,
} from "@/lib/crm/quotes";
import {
  quoteProductCategories,
  quoteProductCategoryLabels,
  quoteProductUnits,
  quoteProductUnitLabels,
  type QuoteProduct,
} from "@/lib/crm/products";

type EditableQuoteItem = {
  key: string;
  id: string | null;
  product_id: string | null;
  product_name: string;
  category: QuoteItem["category"];
  audience: QuoteItem["audience"];
  unit: QuoteItem["unit"];
  quantity: string;
  unit_price_net: string;
  vat_rate: string;
  line_type: QuoteItemLineType;
  is_extra_expense: boolean;
  sort_order: string;
  notes: string;
};

const inputClass =
  "w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]";
const labelClass = "text-sm font-semibold text-[#0A5458]";
const buttonOutlineClass =
  "rounded-full border border-[#d9b76f]/40 px-5 py-2.5 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10";

function getRowFromItem(item: QuoteItem): EditableQuoteItem {
  return {
    key: item.id,
    id: item.id,
    product_id: item.product_id,
    product_name: item.product_name,
    category: item.category,
    audience: item.audience,
    unit: item.unit,
    quantity: String(item.quantity),
    unit_price_net: String(item.unit_price_net),
    vat_rate: String(item.vat_rate),
    line_type: getQuoteItemLineType(item),
    is_extra_expense: item.is_extra_expense || item.line_type === "extra",
    sort_order: String(item.sort_order),
    notes: item.notes ?? "",
  };
}

function parseNumber(value: string) {
  return Number.parseFloat(value.replace(",", "."));
}

function getNumber(value: string) {
  const parsed = parseNumber(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function getNewExtraExpenseRow(sortOrder: number): EditableQuoteItem {
  return {
    key: `new-extra-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    product_id: null,
    product_name: "",
    category: "other",
    audience: "service",
    unit: "fixed",
    quantity: "1",
    unit_price_net: "0",
    vat_rate: "24",
    line_type: "extra",
    is_extra_expense: true,
    sort_order: String(sortOrder),
    notes: "",
  };
}

function getAudienceFromProduct(product: QuoteProduct): QuoteItemAudience | null {
  if (product.audience === "adult" || product.audience === "child" || product.audience === "service") {
    return product.audience;
  }

  return product.category === "service" ? "service" : "adult";
}

function getLineTypeFromProduct(product: QuoteProduct): QuoteItemLineType {
  return product.category === "service" || product.audience === "service" ? "service" : "menu";
}

function getNewProductRow(product: QuoteProduct, sortOrder: number): EditableQuoteItem {
  const lineType = getLineTypeFromProduct(product);

  return {
    key: `new-product-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    product_id: product.id,
    product_name: product.name,
    category: product.category,
    audience: getAudienceFromProduct(product),
    unit: product.unit,
    quantity: "1",
    unit_price_net: String(product.price_net),
    vat_rate: String(product.vat_rate),
    line_type: lineType,
    is_extra_expense: lineType === "extra",
    sort_order: String(sortOrder),
    notes: product.notes ?? "",
  };
}

function getNewCustomRow(sortOrder: number): EditableQuoteItem {
  return {
    key: `new-custom-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    id: null,
    product_id: null,
    product_name: "",
    category: "food",
    audience: "adult",
    unit: "per_person",
    quantity: "1",
    unit_price_net: "0",
    vat_rate: "24",
    line_type: "menu",
    is_extra_expense: false,
    sort_order: String(sortOrder),
    notes: "",
  };
}

function getQuoteGuestBreakdown(quote: Quote) {
  const adultGuestCount = quote.adult_guest_count ?? quote.guest_count;
  const childGuestCount = quote.child_guest_count ?? 0;
  const totalGuestCount =
    quote.guest_count ??
    ((adultGuestCount ?? 0) + (childGuestCount ?? 0) || null);

  return {
    adultGuestCount,
    childGuestCount,
    totalGuestCount,
  };
}

function getServiceDisplayName(row: EditableQuoteItem) {
  if (isVanRentalCost(row)) {
    return "Ενοικίαση van";
  }

  if (isTransportCost(row)) {
    return "Έξοδα μεταφοράς";
  }

  if (isStaffCost(row)) {
    return "Προσωπικό";
  }

  if (isConsumablesCost(row)) {
    return "Αναλώσιμα";
  }

  return row.product_name || "Πρόσθετο κόστος";
}

function getLineTotal(row: EditableQuoteItem) {
  return calculateQuoteItemLineTotal({
    quantity: getNumber(row.quantity),
    unit_price_net: getNumber(row.unit_price_net),
  });
}

function getCalculationRows(rows: EditableQuoteItem[]) {
  return rows.map((row) => ({
    product_name: row.product_name,
    category: row.category,
    audience: row.audience,
    quantity: getNumber(row.quantity),
    unit_price_net: getNumber(row.unit_price_net),
    line_type: row.line_type,
    is_extra_expense: row.is_extra_expense,
  }));
}

function getFallbackTotals(quote: Quote): QuoteTotals {
  return {
    food_drinks_cost_net: quote.food_drinks_cost_net,
    van_rental_cost_net: quote.van_rental_cost_net,
    transport_cost_net: quote.transport_cost_net,
    staff_cost_net: quote.staff_cost_net,
    consumables_cost_net: quote.consumables_cost_net,
    extra_costs_net: quote.extra_costs_net,
    total_cost_net: quote.total_cost_net,
    margin_percent: quote.margin_percent,
    offer_net: quote.offer_net || quote.subtotal_net,
    profit_net: quote.profit_net,
    offer_vat_rate: quote.offer_vat_rate,
    offer_vat_amount: quote.offer_vat_amount || quote.vat_amount,
    offer_gross: quote.offer_gross || quote.total_gross,
    subtotal_net: quote.subtotal_net,
    vat_amount: quote.vat_amount,
    total_gross: quote.total_gross,
  };
}

const quoteItemAudienceOptions: Array<{ label: string; value: QuoteItemAudience | "" }> = [
  { label: quoteItemGroupLabels.adult, value: "adult" },
  { label: quoteItemGroupLabels.child, value: "child" },
  { label: quoteItemGroupLabels.service, value: "service" },
  { label: quoteItemGroupLabels.other, value: "" },
];

function SummaryLine({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "text-base font-bold" : ""}`}>
      <span>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function HiddenRowFields({ row }: { row: EditableQuoteItem }) {
  return (
    <>
      <input name="row_key" type="hidden" value={row.key} />
      <input name={`item_id_${row.key}`} type="hidden" value={row.id ?? ""} />
      <input name={`product_id_${row.key}`} type="hidden" value={row.product_id ?? ""} />
      <input name={`is_extra_expense_${row.key}`} type="hidden" value={row.is_extra_expense ? "1" : "0"} />
    </>
  );
}

function QuoteLineCard({
  row,
  title,
  compact = false,
  updateRow,
  removeRow,
}: {
  row: EditableQuoteItem;
  title?: string;
  compact?: boolean;
  updateRow: (rowKey: string, updates: Partial<EditableQuoteItem>) => void;
  removeRow: (rowKey: string) => void;
}) {
  const lineTotal = getLineTotal(row);
  const needsReview = getNumber(row.unit_price_net) === 0 || row.notes.includes("Χρειάζεται");

  if (row.line_type === "extra") {
    return (
      <div className="rounded-2xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 p-4">
        <HiddenRowFields row={row} />
        <input name={`line_type_${row.key}`} type="hidden" value="extra" />
        <input name={`category_${row.key}`} type="hidden" value={row.category} />
        <input name={`audience_${row.key}`} type="hidden" value="service" />
        <input name={`unit_${row.key}`} type="hidden" value="fixed" />
        <input name={`quantity_${row.key}`} type="hidden" value="1" />
        <input name={`sort_order_${row.key}`} type="hidden" value={row.sort_order} />

        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.45fr_0.36fr_auto] lg:items-end">
          <label className={labelClass}>
            Περιγραφή
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
            Κόστος προ ΦΠΑ
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
          <button
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
            onClick={() => removeRow(row.key)}
            type="button"
          >
            Αφαίρεση
          </button>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className={labelClass}>
            Σημειώσεις
            <textarea
              className={`${inputClass} mt-2 min-h-20`}
              name={`notes_${row.key}`}
              onChange={(event) => updateRow(row.key, { notes: event.target.value })}
              value={row.notes}
            />
          </label>
          <div className="rounded-xl border border-[#d9b76f]/20 bg-white/75 p-3 text-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">Σύνολο εξόδου</p>
            <p className="mt-1 font-semibold text-[#2f2b25]">{formatCurrency(lineTotal)}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 p-4">
      <HiddenRowFields row={row} />

      {title ? <h4 className="mb-4 text-sm font-bold text-[#0A5458]">{title}</h4> : null}
      {compact ? <input name={`line_type_${row.key}`} type="hidden" value={row.line_type} /> : null}
      <div
        className={
          compact
            ? "grid gap-4 lg:grid-cols-[1.1fr_0.45fr_0.32fr_0.32fr_auto] lg:items-end"
            : "grid gap-4 lg:grid-cols-[1.25fr_0.68fr_0.7fr_0.7fr_0.62fr_0.48fr_0.6fr_0.38fr_0.4fr]"
        }
      >
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

        {compact ? (
          <input name={`audience_${row.key}`} type="hidden" value={row.audience ?? "service"} />
        ) : (
          <label className={labelClass}>
            Ομάδα
            <select
              className={`${inputClass} mt-2`}
              name={`audience_${row.key}`}
              onChange={(event) =>
                updateRow(row.key, {
                  audience:
                    event.target.value === ""
                      ? null
                      : (event.target.value as QuoteItemAudience),
                })
              }
              value={row.audience ?? ""}
            >
              {quoteItemAudienceOptions.map((option) => (
                <option key={option.value || "other"} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}

        {compact ? (
          <input name={`category_${row.key}`} type="hidden" value={row.category} />
        ) : (
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
        )}

        {compact ? (
          <input name={`unit_${row.key}`} type="hidden" value={row.unit} />
        ) : (
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
        )}

        {!compact ? (
          <label className={labelClass}>
            Τύπος γραμμής
            <select
              className={`${inputClass} mt-2`}
              name={`line_type_${row.key}`}
              onChange={(event) => {
                const lineType = event.target.value as QuoteItemLineType;
                updateRow(row.key, {
                  line_type: lineType,
                  is_extra_expense: lineType === "extra",
                  category: lineType === "extra" ? "other" : row.category,
                  audience: lineType === "extra" || lineType === "service" ? "service" : row.audience,
                  unit: lineType === "extra" ? "fixed" : row.unit,
                });
              }}
              value={row.line_type}
            >
              <option value="menu">Μενού</option>
              <option value="service">Πρόσθετο κόστος</option>
              <option value="extra">Έκτακτο έξοδο</option>
            </select>
          </label>
        ) : null}

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
          Κόστος προ ΦΠΑ
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

        {compact ? (
          <input name={`sort_order_${row.key}`} type="hidden" value={row.sort_order} />
        ) : (
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
        )}

        {compact ? (
          <button
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
            onClick={() => removeRow(row.key)}
            type="button"
          >
            Αφαίρεση
          </button>
        ) : null}
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
          <p className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">Σύνολο κόστους</p>
          <p className="mt-1 font-semibold text-[#2f2b25]">{formatCurrency(lineTotal)}</p>
        </div>
        {!compact ? (
          <button
            className="rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
            onClick={() => removeRow(row.key)}
            type="button"
          >
            Αφαίρεση
          </button>
        ) : null}
      </div>

      {needsReview ? (
        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
          Χρειάζεται έλεγχος κόστους πριν την αποστολή.
        </p>
      ) : null}
    </div>
  );
}

export function QuoteEditor({ quote, items, products }: { quote: Quote; items: QuoteItem[]; products: QuoteProduct[] }) {
  const [rows, setRows] = useState<EditableQuoteItem[]>(items.map(getRowFromItem));
  const [marginPercent, setMarginPercent] = useState(String(quote.margin_percent ?? 30));
  const [offerVatRate, setOfferVatRate] = useState(String(quote.offer_vat_rate ?? 24));
  const [selectedProductId, setSelectedProductId] = useState("");
  const [recalculated, setRecalculated] = useState(false);
  const guestBreakdown = getQuoteGuestBreakdown(quote);
  const marginPercentNumber = getNumber(marginPercent);
  const offerVatRateNumber = getNumber(offerVatRate);
  const hasMarginError = !validateMarginPercent(marginPercentNumber);

  const calculatedTotals = useMemo(() => {
    if (hasMarginError) {
      return null;
    }

    return calculateQuoteTotals(getCalculationRows(rows), {
      margin_percent: marginPercentNumber,
      offer_vat_rate: offerVatRateNumber,
    });
  }, [hasMarginError, marginPercentNumber, offerVatRateNumber, rows]);
  const totals = calculatedTotals ?? getFallbackTotals(quote);
  const adultMenuRows = rows.filter((row) => row.line_type === "menu" && row.audience === "adult");
  const childMenuRows = rows.filter((row) => row.line_type === "menu" && row.audience === "child");
  const otherMenuRows = rows.filter((row) => row.line_type === "menu" && row.audience !== "adult" && row.audience !== "child");
  const serviceRows = rows.filter((row) => row.line_type === "service");
  const extraRows = rows.filter((row) => row.line_type === "extra" || row.is_extra_expense);

  function updateRow(rowKey: string, updates: Partial<EditableQuoteItem>) {
    setRows((currentRows) =>
      currentRows.map((row) => (row.key === rowKey ? { ...row, ...updates } : row)),
    );
    setRecalculated(false);
  }

  function addExtraExpense() {
    const nextSortOrder =
      rows.reduce((max, row) => Math.max(max, Number.parseInt(row.sort_order, 10) || 0), 0) + 10;
    setRows((currentRows) => [...currentRows, getNewExtraExpenseRow(nextSortOrder)]);
    setRecalculated(false);
  }

  function getNextSortOrder() {
    return rows.reduce((max, row) => Math.max(max, Number.parseInt(row.sort_order, 10) || 0), 0) + 10;
  }

  function addSelectedProduct() {
    const product = products.find((candidate) => candidate.id === selectedProductId);

    if (!product) {
      return;
    }

    setRows((currentRows) => [...currentRows, getNewProductRow(product, getNextSortOrder())]);
    setSelectedProductId("");
    setRecalculated(false);
  }

  function addCustomItem() {
    setRows((currentRows) => [...currentRows, getNewCustomRow(getNextSortOrder())]);
    setRecalculated(false);
  }

  function removeRow(rowKey: string) {
    setRows((currentRows) => currentRows.filter((row) => row.key !== rowKey));
    setRecalculated(false);
  }

  function renderMenuGroup(title: string, groupRows: EditableQuoteItem[]) {
    return (
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-[#0A5458]">{title}</h3>
        {groupRows.length === 0 ? (
          <p className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4 text-sm leading-6 text-[#5f594f]">
            Δεν υπάρχουν γραμμές σε αυτή την ομάδα.
          </p>
        ) : (
          groupRows.map((row) => (
            <QuoteLineCard key={row.key} removeRow={removeRow} row={row} updateRow={updateRow} />
          ))
        )}
      </div>
    );
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
              <p>Ενήλικες: {formatNumber(guestBreakdown.adultGuestCount)}</p>
              <p>Παιδιά: {formatNumber(guestBreakdown.childGuestCount)}</p>
              <p>Σύνολο: {formatNumber(guestBreakdown.totalGuestCount)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0A5458]">Προσθήκη είδους</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f594f]">
              Προσθέστε είδος από τον κατάλογο ή δημιουργήστε προσαρμοσμένη γραμμή κόστους.
            </p>
          </div>
          <div className="grid flex-1 gap-3 md:grid-cols-[1fr_auto_auto] md:items-end">
            <label className={labelClass}>
              Είδος καταλόγου
              <select
                className={`${inputClass} mt-2`}
                onChange={(event) => setSelectedProductId(event.target.value)}
                value={selectedProductId}
              >
                <option value="">Επιλέξτε προϊόν</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <button className={buttonOutlineClass} disabled={!selectedProductId} onClick={addSelectedProduct} type="button">
              Προσθήκη είδους
            </button>
            <button className={buttonOutlineClass} onClick={addCustomItem} type="button">
              Προσαρμοσμένο είδος
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <h2 className="text-xl font-semibold text-[#0A5458]">Κόστος μενού</h2>
        <div className="mt-5 space-y-5">
          {renderMenuGroup("Μενού ενηλίκων", adultMenuRows)}
          {renderMenuGroup("Μενού παιδιών", childMenuRows)}
          {otherMenuRows.length > 0 ? renderMenuGroup("Άλλες γραμμές μενού", otherMenuRows) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <h2 className="text-xl font-semibold text-[#0A5458]">Πρόσθετα κόστη</h2>
        <div className="mt-5 space-y-4">
          {serviceRows.length === 0 ? (
            <p className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4 text-sm leading-6 text-[#5f594f]">
              Δεν υπάρχουν πρόσθετα κόστη από τον κατάλογο. Μπορείτε να προσθέσετε έκτακτα έξοδα χειροκίνητα.
            </p>
          ) : (
            serviceRows.map((row) => (
              <QuoteLineCard
                compact={row.product_id !== null}
                key={row.key}
                removeRow={removeRow}
                row={row}
                title={getServiceDisplayName(row)}
                updateRow={updateRow}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-[#0A5458]">Έκτακτα έξοδα</h2>
          <button className={buttonOutlineClass} onClick={addExtraExpense} type="button">
            Προσθήκη εξόδου
          </button>
        </div>
        <div className="mt-5 space-y-4">
          {extraRows.length === 0 ? (
            <p className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4 text-sm leading-6 text-[#5f594f]">
              Δεν υπάρχουν έκτακτα έξοδα.
            </p>
          ) : (
            extraRows.map((row) => (
              <QuoteLineCard key={row.key} removeRow={removeRow} row={row} updateRow={updateRow} />
            ))
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.5fr]">
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
          <h2 className="text-xl font-semibold">Υπολογισμός προσφοράς</h2>
          <div className="mt-5 space-y-3 text-sm">
            <SummaryLine label="Κόστος φαγητού & ποτών" value={formatCurrency(totals.food_drinks_cost_net)} />
            <SummaryLine label="Ενοικίαση van" value={formatCurrency(totals.van_rental_cost_net)} />
            <SummaryLine label="Έξοδα μεταφοράς" value={formatCurrency(totals.transport_cost_net)} />
            <SummaryLine label="Προσωπικό" value={formatCurrency(totals.staff_cost_net)} />
            <SummaryLine label="Αναλώσιμα" value={formatCurrency(totals.consumables_cost_net)} />
            <SummaryLine label="Έκτακτα έξοδα" value={formatCurrency(totals.extra_costs_net)} />
            <div className="border-t border-white/20 pt-3">
              <SummaryLine strong label="Τελικό κόστος" value={formatCurrency(totals.total_cost_net)} />
            </div>
            <label className="block pt-2 text-sm font-semibold">
              Margin %
              <input
                className="mt-2 w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-[#2f2b25] outline-none focus:border-[#d9b76f]"
                max="99.99"
                min="0"
                name="margin_percent"
                onChange={(event) => {
                  setMarginPercent(event.target.value);
                  setRecalculated(false);
                }}
                step="0.01"
                type="number"
                value={marginPercent}
              />
            </label>
            {hasMarginError ? (
              <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">
                Το Margin πρέπει να είναι από 0 έως και μικρότερο από 100.
              </p>
            ) : null}
            <label className="block text-sm font-semibold">
              ΦΠΑ προσφοράς %
              <input
                className="mt-2 w-full rounded-xl border border-white/20 bg-white px-3 py-2 text-sm text-[#2f2b25] outline-none focus:border-[#d9b76f]"
                min="0"
                name="offer_vat_rate"
                onChange={(event) => {
                  setOfferVatRate(event.target.value);
                  setRecalculated(false);
                }}
                step="0.01"
                type="number"
                value={offerVatRate}
              />
            </label>
            <div className="space-y-3 border-t border-white/20 pt-3">
              <SummaryLine label="Προσφορά προ ΦΠΑ" value={formatCurrency(totals.offer_net)} />
              <SummaryLine label="ΦΠΑ" value={formatCurrency(totals.offer_vat_amount)} />
              <SummaryLine strong label="Προσφορά με ΦΠΑ" value={formatCurrency(totals.offer_gross)} />
              <SummaryLine label="Κέρδος" value={formatCurrency(totals.profit_net)} />
            </div>
          </div>
        </aside>
      </section>

      <div className="flex flex-wrap gap-3">
        <button className={buttonOutlineClass} onClick={() => setRecalculated(true)} type="button">
          Επανυπολογισμός
        </button>
        {recalculated && !hasMarginError ? (
          <span className="self-center text-sm font-semibold text-emerald-700">
            Τα σύνολα ενημερώθηκαν στην προεπισκόπηση.
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#07383b] disabled:cursor-not-allowed disabled:opacity-50"
          disabled={hasMarginError}
          type="submit"
        >
          Αποθήκευση αλλαγών
        </button>
        <Link
          className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458] transition hover:bg-[#0A5458]/10"
          href={`/admin/quotes/${quote.id}/pdf`}
          target="_blank"
        >
          Προεπισκόπηση προσφοράς
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
