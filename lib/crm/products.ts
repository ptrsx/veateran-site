export type QuoteProductCategory = "food" | "drinks" | "service" | "other";

export type QuoteProductUnit = "per_person" | "per_item" | "fixed";

export type QuoteProductAudience = "adult" | "child" | "both" | "service";

export type QuoteProduct = {
  id: string;
  created_at: string;
  updated_at: string;
  name: string;
  category: QuoteProductCategory;
  product_key: string | null;
  audience: QuoteProductAudience;
  unit: QuoteProductUnit;
  price_net: number;
  vat_rate: number;
  is_active: boolean;
  sort_order: number;
  notes: string | null;
};

export type QuoteProductInsert = {
  name: string;
  category: QuoteProductCategory;
  audience: QuoteProductAudience;
  unit: QuoteProductUnit;
  price_net: number;
  vat_rate: number;
  is_active: boolean;
  sort_order: number;
  notes?: string | null;
};

export type QuoteProductUpdate = QuoteProductInsert;

export const quoteProductCategories: QuoteProductCategory[] = ["food", "drinks", "service", "other"];

export const quoteProductCategoryLabels: Record<QuoteProductCategory, string> = {
  food: "Φαγητό",
  drinks: "Ποτά & αναψυκτικά",
  service: "Υπηρεσίες",
  other: "Άλλο",
};

export const quoteProductUnits: QuoteProductUnit[] = ["per_person", "per_item", "fixed"];

export const quoteProductUnitLabels: Record<QuoteProductUnit, string> = {
  per_person: "Ανά άτομο",
  per_item: "Ανά τεμάχιο",
  fixed: "Σταθερή χρέωση",
};

export const quoteProductAudiences: QuoteProductAudience[] = ["adult", "child", "both", "service"];

export const quoteProductAudienceLabels: Record<QuoteProductAudience, string> = {
  adult: "Ενήλικες",
  child: "Παιδιά",
  both: "Ενήλικες & παιδιά",
  service: "Υπηρεσία",
};

export function isQuoteProductCategory(value: string): value is QuoteProductCategory {
  return quoteProductCategories.includes(value as QuoteProductCategory);
}

export function isQuoteProductUnit(value: string): value is QuoteProductUnit {
  return quoteProductUnits.includes(value as QuoteProductUnit);
}

export function isQuoteProductAudience(value: string): value is QuoteProductAudience {
  return quoteProductAudiences.includes(value as QuoteProductAudience);
}

export function getQuoteProductCategoryLabel(value: string | null | undefined) {
  return isQuoteProductCategory(value ?? "")
    ? quoteProductCategoryLabels[value as QuoteProductCategory]
    : quoteProductCategoryLabels.other;
}

export function getQuoteProductUnitLabel(value: string | null | undefined) {
  return isQuoteProductUnit(value ?? "")
    ? quoteProductUnitLabels[value as QuoteProductUnit]
    : quoteProductUnitLabels.per_person;
}

export function getQuoteProductAudienceLabel(value: string | null | undefined) {
  return isQuoteProductAudience(value ?? "")
    ? quoteProductAudienceLabels[value as QuoteProductAudience]
    : quoteProductAudienceLabels.adult;
}
