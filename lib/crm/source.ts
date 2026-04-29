import type { QuoteRequestSource } from "@/lib/crm/types";

export const quoteRequestSources: QuoteRequestSource[] = [
  "website",
  "phone",
  "email",
  "instagram",
  "facebook",
  "referral",
  "other",
];

export const sourceLabels: Record<QuoteRequestSource, string> = {
  website: "Φόρμα website",
  phone: "Τηλέφωνο",
  email: "Email",
  instagram: "Instagram",
  facebook: "Facebook",
  referral: "Σύσταση",
  other: "Άλλο",
};

export function isQuoteRequestSource(value: string): value is QuoteRequestSource {
  return quoteRequestSources.includes(value as QuoteRequestSource);
}

export function getSourceLabel(value?: string | null) {
  return isQuoteRequestSource(value ?? "") ? sourceLabels[value as QuoteRequestSource] : "Άλλο";
}
