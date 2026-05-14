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
  sort_order: number;
  notes: string | null;
};

export type QuoteTotals = {
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

export const quoteItemGroupLabels = {
  adult: "Μενού ενηλίκων",
  child: "Μενού παιδιών",
  service: "Πρόσθετα κόστη",
  other: "Άλλο",
} satisfies Record<QuoteItemAudience | "other", string>;

export function isQuoteItemAudience(value: string): value is QuoteItemAudience {
  return value === "adult" || value === "child" || value === "service";
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

export function calculateQuoteTotals(items: Array<Pick<QuoteItemInput, "quantity" | "unit_price_net" | "vat_rate">>) {
  return items.reduce<QuoteTotals>(
    (totals, item) => {
      const lineTotal = calculateQuoteItemLineTotal(item);

      totals.subtotal_net = roundMoney(totals.subtotal_net + lineTotal);
      totals.vat_amount = roundMoney(totals.vat_amount + (lineTotal * item.vat_rate) / 100);
      totals.total_gross = roundMoney(totals.subtotal_net + totals.vat_amount);

      return totals;
    },
    {
      subtotal_net: 0,
      vat_amount: 0,
      total_gross: 0,
    },
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
