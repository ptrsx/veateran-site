import type { QuoteRequestStatus } from "@/lib/crm/types";

export const quoteRequestStatuses: QuoteRequestStatus[] = [
  "NEW",
  "CONTACTED",
  "NEEDS_QUOTE",
  "QUOTE_SENT",
  "WAITING_REPLY",
  "WON",
  "LOST",
  "CANCELLED",
];

export const statusLabels: Record<QuoteRequestStatus, string> = {
  NEW: "Νέο αίτημα",
  CONTACTED: "Σε επικοινωνία",
  NEEDS_QUOTE: "Περιμένει προσφορά",
  QUOTE_SENT: "Προσφορά στάλθηκε",
  WAITING_REPLY: "Περιμένει απάντηση",
  WON: "Κλεισμένο",
  LOST: "Χαμένο",
  CANCELLED: "Ακυρωμένο",
};

export const statusToneClasses: Record<QuoteRequestStatus, string> = {
  NEW: "border-[#d9b76f]/50 bg-[#fff5dc] text-[#6e4f05]",
  CONTACTED: "border-[#0A5458]/20 bg-[#e8f4f4] text-[#0A5458]",
  NEEDS_QUOTE: "border-amber-200 bg-amber-50 text-amber-800",
  QUOTE_SENT: "border-blue-200 bg-blue-50 text-blue-800",
  WAITING_REPLY: "border-violet-200 bg-violet-50 text-violet-800",
  WON: "border-emerald-200 bg-emerald-50 text-emerald-800",
  LOST: "border-rose-200 bg-rose-50 text-rose-800",
  CANCELLED: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function isQuoteRequestStatus(value: string): value is QuoteRequestStatus {
  return quoteRequestStatuses.includes(value as QuoteRequestStatus);
}
