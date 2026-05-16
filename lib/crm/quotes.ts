import type { QuoteProductCategory, QuoteProductUnit } from "@/lib/crm/products";
import type { QuoteRequestCustomerType } from "@/lib/crm/types";

export type QuoteStatus =
  | "DRAFT"
  | "READY"
  | "SENT"
  | "ACCEPTED"
  | "DECLINED"
  | "CANCELLED";

export type Quote = {
  id: string;
  created_at: string;
  updated_at: string;
  request_id: string;
  quote_number: string;
  status: QuoteStatus;
  currency: "EUR";
  valid_until: string | null;
  customer_type: QuoteRequestCustomerType;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string | null;
  business_name: string | null;
  business_vat: string | null;
  business_tax_office: string | null;
  business_address: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  event_type: string | null;
  event_date: string | null;
  event_location: string | null;
  adult_guest_count: number | null;
  child_guest_count: number | null;
  guest_count: number | null;
  food_drinks_cost_net: number;
  van_rental_cost_net: number;
  transport_cost_net: number;
  staff_cost_net: number;
  consumables_cost_net: number;
  extra_costs_net: number;
  total_cost_net: number;
  margin_percent: number;
  offer_net: number;
  profit_net: number;
  offer_vat_rate: number;
  offer_vat_amount: number;
  offer_gross: number;
  subtotal_net: number;
  vat_amount: number;
  total_gross: number;
  public_notes: string | null;
  terms: string | null;
  internal_notes: string | null;
  generated_pdf_at: string | null;
  sent_at: string | null;
};

export type QuoteItemAudience = "adult" | "child" | "service";
export type QuoteItemLineType = "menu" | "service" | "extra";

export type QuoteItem = {
  id: string;
  created_at: string;
  quote_id: string;
  product_id: string | null;
  product_name: string;
  category: QuoteProductCategory;
  audience: QuoteItemAudience | null;
  unit: QuoteProductUnit;
  quantity: number;
  unit_price_net: number;
  vat_rate: number;
  line_total_net: number;
  line_type: QuoteItemLineType;
  is_extra_expense: boolean;
  sort_order: number;
  notes: string | null;
};

export type QuoteTotals = {
  food_drinks_cost_net: number;
  van_rental_cost_net: number;
  transport_cost_net: number;
  staff_cost_net: number;
  consumables_cost_net: number;
  extra_costs_net: number;
  total_cost_net: number;
  margin_percent: number;
  offer_net: number;
  profit_net: number;
  offer_vat_rate: number;
  offer_vat_amount: number;
  offer_gross: number;
  subtotal_net: number;
  vat_amount: number;
  total_gross: number;
};

export type QuoteItemInput = {
  id?: string | null;
  product_id?: string | null;
  product_name: string;
  category: QuoteProductCategory;
  audience?: QuoteItemAudience | null;
  unit: QuoteProductUnit;
  quantity: number;
  unit_price_net: number;
  vat_rate: number;
  line_type?: QuoteItemLineType;
  is_extra_expense?: boolean;
  sort_order: number;
  notes?: string | null;
};

export type QuoteItemUpsert = QuoteItemInput & {
  quote_id: string;
  line_total_net: number;
};

export const quoteStatuses: QuoteStatus[] = [
  "DRAFT",
  "READY",
  "SENT",
  "ACCEPTED",
  "DECLINED",
  "CANCELLED",
];

export const quoteStatusLabels: Record<QuoteStatus, string> = {
  DRAFT: "Πρόχειρη",
  READY: "Έτοιμη για αποστολή",
  SENT: "Στάλθηκε",
  ACCEPTED: "Αποδεκτή",
  DECLINED: "Απορρίφθηκε",
  CANCELLED: "Ακυρωμένη",
};

export const quoteStatusToneClasses: Record<QuoteStatus, string> = {
  DRAFT: "border-zinc-200 bg-zinc-50 text-zinc-700",
  READY: "border-sky-200 bg-sky-50 text-sky-800",
  SENT: "border-amber-200 bg-amber-50 text-amber-800",
  ACCEPTED: "border-emerald-200 bg-emerald-50 text-emerald-800",
  DECLINED: "border-red-200 bg-red-50 text-red-800",
  CANCELLED: "border-zinc-200 bg-zinc-50 text-zinc-500",
};

export const quoteItemAudienceLabels: Record<QuoteItemAudience, string> = {
  adult: "Μενού ενηλίκων",
  child: "Μενού παιδιών",
  service: "Πρόσθετα κόστη",
};

export const quoteItemLineTypes: QuoteItemLineType[] = ["menu", "service", "extra"];

export const quoteItemLineTypeLabels: Record<QuoteItemLineType, string> = {
  menu: "Μενού",
  service: "Πρόσθετα κόστη",
  extra: "Έκτακτο έξοδο",
};

export const quoteItemGroupLabels = {
  adult: "Μενού ενηλίκων",
  child: "Μενού παιδιών",
  service: "Πρόσθετα κόστη",
  extra: "Έκτακτα έξοδα",
  other: "Άλλο",
} satisfies Record<QuoteItemAudience | "extra" | "other", string>;

export function isQuoteItemAudience(value: string): value is QuoteItemAudience {
  return value === "adult" || value === "child" || value === "service";
}

export function isQuoteItemLineType(value: string): value is QuoteItemLineType {
  return quoteItemLineTypes.includes(value as QuoteItemLineType);
}

export const defaultQuotePublicNotes =
  "Η προσφορά βασίζεται στα στοιχεία που μας αποστείλατε και μπορεί να προσαρμοστεί ανάλογα με τις ανάγκες της εκδήλωσης.";

export const defaultQuoteTerms =
  "Οι τιμές περιλαμβάνουν ΦΠΑ, εκτός αν αναφέρεται διαφορετικά. Η τελική επιβεβαίωση γίνεται κατόπιν διαθεσιμότητας και συμφωνίας των λεπτομερειών της εκδήλωσης.";

export function isQuoteStatus(value: string): value is QuoteStatus {
  return quoteStatuses.includes(value as QuoteStatus);
}

export function getQuoteStatusLabel(value: string | null | undefined) {
  return isQuoteStatus(value ?? "") ? quoteStatusLabels[value as QuoteStatus] : quoteStatusLabels.DRAFT;
}

export function calculateQuoteItemLineTotal(item: Pick<QuoteItemInput, "quantity" | "unit_price_net">) {
  return roundMoney(item.quantity * item.unit_price_net);
}

type QuoteCalculationItem = Pick<QuoteItemInput, "quantity" | "unit_price_net"> &
  Partial<Pick<QuoteItemInput, "product_name" | "category" | "audience" | "line_type" | "is_extra_expense">> & {
    line_total_net?: number | null;
    product_key?: string | null;
  };

type QuoteCalculationOptions = {
  margin_percent?: number;
  offer_vat_rate?: number;
};

export function validateMarginPercent(marginPercent: number) {
  return Number.isFinite(marginPercent) && marginPercent >= 0 && marginPercent < 100;
}

export function calculateQuoteTotals(items: QuoteCalculationItem[], options: QuoteCalculationOptions = {}) {
  const marginPercent = options.margin_percent ?? 30;
  const offerVatRate = options.offer_vat_rate ?? 24;

  if (!validateMarginPercent(marginPercent)) {
    throw new Error("Invalid margin percentage.");
  }

  if (!Number.isFinite(offerVatRate) || offerVatRate < 0) {
    throw new Error("Invalid offer VAT rate.");
  }

  const costTotals = items.reduce(
    (totals, item) => {
      const lineTotal = getQuoteCalculationLineTotal(item);
      const costGroup = getQuoteItemCostGroup(item);

      if (costGroup === "food_drinks") {
        totals.food_drinks_cost_net = roundMoney(totals.food_drinks_cost_net + lineTotal);
      } else if (costGroup === "van_rental") {
        totals.van_rental_cost_net = roundMoney(totals.van_rental_cost_net + lineTotal);
      } else if (costGroup === "transport") {
        totals.transport_cost_net = roundMoney(totals.transport_cost_net + lineTotal);
      } else if (costGroup === "staff") {
        totals.staff_cost_net = roundMoney(totals.staff_cost_net + lineTotal);
      } else if (costGroup === "consumables") {
        totals.consumables_cost_net = roundMoney(totals.consumables_cost_net + lineTotal);
      } else if (costGroup === "extra") {
        totals.extra_costs_net = roundMoney(totals.extra_costs_net + lineTotal);
      }

      totals.total_cost_net = roundMoney(totals.total_cost_net + lineTotal);

      return totals;
    },
    {
      food_drinks_cost_net: 0,
      van_rental_cost_net: 0,
      transport_cost_net: 0,
      staff_cost_net: 0,
      consumables_cost_net: 0,
      extra_costs_net: 0,
      total_cost_net: 0,
    },
  );

  const offerNet =
    marginPercent === 0
      ? costTotals.total_cost_net
      : roundMoney(costTotals.total_cost_net / (1 - marginPercent / 100));
  const profitNet = roundMoney(offerNet - costTotals.total_cost_net);
  const offerVatAmount = roundMoney((offerNet * offerVatRate) / 100);
  const offerGross = roundMoney(offerNet + offerVatAmount);

  return {
    ...costTotals,
    margin_percent: marginPercent,
    offer_net: offerNet,
    profit_net: profitNet,
    offer_vat_rate: offerVatRate,
    offer_vat_amount: offerVatAmount,
    offer_gross: offerGross,
    subtotal_net: offerNet,
    vat_amount: offerVatAmount,
    total_gross: offerGross,
  } satisfies QuoteTotals;
}

export function getQuoteItemLineType(
  item: Partial<Pick<QuoteItemInput, "line_type" | "audience" | "category" | "is_extra_expense">>,
) {
  if (item.is_extra_expense || item.line_type === "extra") {
    return "extra";
  }

  if (item.line_type === "menu" || item.line_type === "service") {
    return item.line_type;
  }

  if (item.audience === "adult" || item.audience === "child") {
    return "menu";
  }

  if (item.audience === "service" || item.category === "service") {
    return "service";
  }

  return "menu";
}

export function getQuoteItemCostGroup(item: QuoteCalculationItem) {
  const lineType = getQuoteItemLineType(item);

  if (lineType === "extra") {
    return "extra";
  }

  if (lineType === "menu") {
    return "food_drinks";
  }

  if (isVanRentalCost(item)) {
    return "van_rental";
  }

  if (isTransportCost(item)) {
    return "transport";
  }

  if (isStaffCost(item)) {
    return "staff";
  }

  if (isConsumablesCost(item)) {
    return "consumables";
  }

  return "service";
}

export function isVanRentalCost(item: Pick<QuoteCalculationItem, "product_name" | "product_key">) {
  const searchableValue = getSearchableProductValue(item);
  return searchableValue.includes("van-rental-cost") || (searchableValue.includes("van") && searchableValue.includes("ενοικ"));
}

export function isTransportCost(item: Pick<QuoteCalculationItem, "product_name" | "product_key">) {
  const searchableValue = getSearchableProductValue(item);
  return searchableValue.includes("transport-cost") || searchableValue.includes("μεταφορ") || searchableValue.includes("transport");
}

export function isStaffCost(item: Pick<QuoteCalculationItem, "product_name" | "product_key">) {
  const searchableValue = getSearchableProductValue(item);
  return searchableValue.includes("staff-cost") || searchableValue.includes("προσωπ") || searchableValue.includes("staff");
}

export function isConsumablesCost(item: Pick<QuoteCalculationItem, "product_name" | "product_key">) {
  const searchableValue = getSearchableProductValue(item);
  return searchableValue.includes("consumables-cost") || searchableValue.includes("αναλωσιμ") || searchableValue.includes("αναλώσιμ");
}

function getQuoteCalculationLineTotal(item: QuoteCalculationItem) {
  if (typeof item.line_total_net === "number" && Number.isFinite(item.line_total_net)) {
    return roundMoney(item.line_total_net);
  }

  return calculateQuoteItemLineTotal(item);
}

function getSearchableProductValue(item: Pick<QuoteCalculationItem, "product_name" | "product_key">) {
  return `${item.product_key ?? ""} ${item.product_name ?? ""}`.trim().toLocaleLowerCase("el-GR");
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
