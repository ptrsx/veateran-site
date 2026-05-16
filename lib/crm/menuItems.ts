export type QuoteMenuItemCategory = "food" | "drinks";
export type QuoteMenuAudience = "adult" | "child";

export type QuoteMenuItem = {
  id: string;
  label: string;
  category: QuoteMenuItemCategory;
  audience: QuoteMenuAudience;
};

export const quoteMenuCategoryLabels: Record<QuoteMenuItemCategory, string> = {
  food: "Φαγητό",
  drinks: "Ποτά & αναψυκτικά",
};

const foodMenuItems = [
  { id: "mini-burger", label: "Mini burger", category: "food" },
  { id: "chicken-caesar-wrap-roll", label: "Chicken caesar wrap roll", category: "food" },
  { id: "hot-dog", label: "Hot dog", category: "food" },
  { id: "folia", label: "Φωλιά", category: "food" },
  { id: "the-veateran-stick", label: "The VeatERAN stick", category: "food" },
  { id: "flogeres", label: "Φλογέρες", category: "food" },
  { id: "tyrokroketes", label: "Τυροκροκέτες", category: "food" },
  { id: "makaronosalata", label: "Μακαρονοσαλάτα", category: "food" },
  { id: "spring-rolls", label: "Spring rolls", category: "food" },
  { id: "kalamakia", label: "Καλαμάκια", category: "food" },
  { id: "keftedakia", label: "Κεφτεδάκια", category: "food" },
  { id: "kotompoukies", label: "Κοτομπουκιές", category: "food" },
  { id: "pita-club-kotopoulo", label: "Πίτα club κοτόπουλο", category: "food" },
  { id: "mpompa", label: "Μπόμπα", category: "food" },
  { id: "bao-bun", label: "Bao bun", category: "food" },
] satisfies Array<Omit<QuoteMenuItem, "audience">>;

const adultDrinkMenuItems = [
  { id: "nera", label: "Νερά", category: "drinks" },
  { id: "anapsyktika", label: "Αναψυκτικά", category: "drinks" },
  { id: "chymoi", label: "Χυμοί", category: "drinks" },
  { id: "mpyres", label: "Μπύρες", category: "drinks" },
  { id: "pota", label: "Ποτά", category: "drinks" },
  { id: "cocktails", label: "Cocktails", category: "drinks" },
] satisfies Array<Omit<QuoteMenuItem, "audience">>;

const childDrinkMenuItems = [
  { id: "nera", label: "Νερά", category: "drinks" },
  { id: "anapsyktika", label: "Αναψυκτικά", category: "drinks" },
  { id: "chymoi", label: "Χυμοί", category: "drinks" },
  { id: "mocktails", label: "Mocktails", category: "drinks" },
] satisfies Array<Omit<QuoteMenuItem, "audience">>;

function withAudience(items: Array<Omit<QuoteMenuItem, "audience">>, audience: QuoteMenuAudience) {
  return items.map((item) => ({ ...item, audience }));
}

export const adultQuoteMenuItems: QuoteMenuItem[] = [
  ...withAudience(foodMenuItems, "adult"),
  ...withAudience(adultDrinkMenuItems, "adult"),
];

export const childQuoteMenuItems: QuoteMenuItem[] = [
  ...withAudience(foodMenuItems, "child"),
  ...withAudience(childDrinkMenuItems, "child"),
];

export const quoteMenuItems = adultQuoteMenuItems;

const quoteMenuItemsByAudience = {
  adult: adultQuoteMenuItems,
  child: childQuoteMenuItems,
} satisfies Record<QuoteMenuAudience, QuoteMenuItem[]>;

const quoteMenuItemByAudienceAndId = {
  adult: new Map(adultQuoteMenuItems.map((item) => [item.id, item])),
  child: new Map(childQuoteMenuItems.map((item) => [item.id, item])),
} satisfies Record<QuoteMenuAudience, Map<string, QuoteMenuItem>>;

export function getQuoteMenuItemById(id: string, audience: QuoteMenuAudience = "adult") {
  return quoteMenuItemByAudienceAndId[audience].get(id) ?? null;
}

export function getQuoteMenuItemsByCategory(
  category: QuoteMenuItemCategory,
  audience: QuoteMenuAudience = "adult",
) {
  return quoteMenuItemsByAudience[audience].filter((item) => item.category === category);
}

export function normalizeSelectedMenuItems(
  value: unknown,
  audience: QuoteMenuAudience = "adult",
): QuoteMenuItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const selected: QuoteMenuItem[] = [];
  const seenIds = new Set<string>();

  for (const item of value) {
    if (!item || typeof item !== "object" || !("id" in item) || typeof item.id !== "string") {
      continue;
    }

    const menuItem = getQuoteMenuItemById(item.id, audience);

    if (!menuItem || seenIds.has(menuItem.id)) {
      continue;
    }

    seenIds.add(menuItem.id);
    selected.push(menuItem);
  }

  return selected;
}

export function groupQuoteMenuItems(items: QuoteMenuItem[]) {
  return {
    food: items.filter((item) => item.category === "food"),
    drinks: items.filter((item) => item.category === "drinks"),
  } satisfies Record<QuoteMenuItemCategory, QuoteMenuItem[]>;
}
