import type { QuoteRequestCustomerType } from "@/lib/crm/types";

export const quoteRequestCustomerTypes: QuoteRequestCustomerType[] = ["individual", "business"];

export const customerTypeLabels: Record<QuoteRequestCustomerType, string> = {
  individual: "Ιδιώτης",
  business: "Επιχείρηση",
};

export function isQuoteRequestCustomerType(value: string): value is QuoteRequestCustomerType {
  return quoteRequestCustomerTypes.includes(value as QuoteRequestCustomerType);
}

export function getCustomerTypeLabel(value: string | null | undefined) {
  return isQuoteRequestCustomerType(value ?? "") ? customerTypeLabels[value as QuoteRequestCustomerType] : customerTypeLabels.individual;
}
