"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import {
  calculateQuoteItemLineTotal,
  calculateQuoteTotals,
  defaultQuotePublicNotes,
  defaultQuoteTerms,
  type QuoteItemInput,
} from "@/lib/crm/quotes";
import type { QuoteProduct, QuoteProductCategory, QuoteProductUnit } from "@/lib/crm/products";
import type { QuoteRequest } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type SelectedRequestMenuItem = {
  id: string;
  label: string;
  category: "food" | "drinks";
};

function isSelectedRequestMenuItem(value: unknown): value is SelectedRequestMenuItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const item = value as Record<string, unknown>;

  return (
    typeof item.id === "string" &&
    typeof item.label === "string" &&
    (item.category === "food" || item.category === "drinks")
  );
}

function normalizeSelectedRequestMenuItems(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();
  const items: SelectedRequestMenuItem[] = [];

  for (const item of value) {
    if (!isSelectedRequestMenuItem(item) || seenIds.has(item.id)) {
      continue;
    }

    seenIds.add(item.id);
    items.push({
      id: item.id,
      label: item.label,
      category: item.category,
    });
  }

  return items;
}

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("el-GR");
}

function findMatchingProduct(item: SelectedRequestMenuItem, products: QuoteProduct[]) {
  const byKey = products.find((product) => product.product_key === item.id);

  if (byKey) {
    return byKey;
  }

  const itemLabel = normalizeText(item.label);

  return (
    products.find(
      (product) =>
        product.category === item.category &&
        normalizeText(product.name) === itemLabel,
    ) ?? null
  );
}

function getQuantity(unit: QuoteProductUnit, guestCount: number | null) {
  if (unit === "fixed") {
    return 1;
  }

  return guestCount ?? 0;
}

function getQuoteItemsFromRequest(request: QuoteRequest, products: QuoteProduct[]) {
  const selectedMenuItems = normalizeSelectedRequestMenuItems(request.selected_menu_items);

  return selectedMenuItems.map<QuoteItemInput>((item, index) => {
    const product = findMatchingProduct(item, products);
    const unit = product?.unit ?? "per_person";
    const quantity = getQuantity(unit, request.guest_count);
    const unitPriceNet = product?.price_net ?? 0;
    const vatRate = product?.vat_rate ?? 24;
    const notes =
      !product || unitPriceNet === 0
        ? "Χρειάζεται έλεγχος τιμής πριν την αποστολή."
        : null;

    return {
      product_id: product?.id ?? null,
      product_name: product?.name ?? item.label,
      category: (product?.category ?? item.category) as QuoteProductCategory,
      unit,
      quantity,
      unit_price_net: unitPriceNet,
      vat_rate: vatRate,
      sort_order: index + 1,
      notes,
    };
  });
}

async function generateQuoteNumber(year: number) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("quote_number")
    .like("quote_number", `VEA-${year}-%`)
    .order("quote_number", { ascending: false })
    .limit(1);

  if (error) {
    throw error;
  }

  const lastNumber = String(data?.[0]?.quote_number ?? "");
  const lastSequence = Number.parseInt(lastNumber.split("-").at(-1) ?? "0", 10);
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `VEA-${year}-${String(nextSequence).padStart(4, "0")}`;
}

export async function generateQuoteForRequest(requestId: string) {
  await requireAdminSession();

  const supabase = createSupabaseAdminClient();
  const { data: existingDraft, error: existingDraftError } = await supabase
    .from("quotes")
    .select("id")
    .eq("request_id", requestId)
    .eq("status", "DRAFT")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDraftError) {
    console.error("Failed to find existing draft quote.", existingDraftError);
    redirect(`/admin/requests/${requestId}?quoteError=1`);
  }

  if (existingDraft?.id) {
    redirect(`/admin/quotes/${existingDraft.id}`);
  }

  const { data: requestData, error: requestError } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (requestError || !requestData) {
    console.error("Failed to load request for quote generation.", requestError);
    redirect(`/admin/requests/${requestId}?quoteError=1`);
  }

  const request = requestData as QuoteRequest;
  const { data: productData, error: productError } = await supabase
    .from("quote_products")
    .select("*")
    .eq("is_active", true);

  if (productError) {
    console.error("Failed to load products for quote generation.", productError);
    redirect(`/admin/requests/${requestId}?quoteError=1`);
  }

  const products = (productData ?? []).map((product) => ({
    ...product,
    price_net: Number(product.price_net) || 0,
    vat_rate: Number(product.vat_rate) || 0,
    sort_order: Number(product.sort_order) || 0,
  })) as QuoteProduct[];
  const quoteItems = getQuoteItemsFromRequest(request, products);
  const quoteTotals = calculateQuoteTotals(quoteItems);
  const year = new Date().getFullYear();

  let quoteId = "";

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const quoteNumber = await generateQuoteNumber(year);
    const { data: quoteData, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        request_id: request.id,
        quote_number: quoteNumber,
        status: "DRAFT",
        currency: "EUR",
        customer_type: request.customer_type,
        customer_name:
          request.customer_type === "business"
            ? request.business_name || request.name
            : request.name,
        customer_email: request.customer_type === "business" ? request.contact_email : request.email,
        customer_phone: request.customer_type === "business" ? request.contact_phone : request.phone,
        business_name: request.customer_type === "business" ? request.business_name : null,
        business_vat: request.customer_type === "business" ? request.business_vat : null,
        business_tax_office: request.customer_type === "business" ? request.business_tax_office : null,
        business_address: request.customer_type === "business" ? request.business_address : null,
        contact_name: request.customer_type === "business" ? request.contact_name : null,
        contact_email: request.customer_type === "business" ? request.contact_email : null,
        contact_phone: request.customer_type === "business" ? request.contact_phone : null,
        event_type: request.event_type,
        event_date: request.event_date,
        event_location: request.location,
        guest_count: request.guest_count,
        subtotal_net: quoteTotals.subtotal_net,
        vat_amount: quoteTotals.vat_amount,
        total_gross: quoteTotals.total_gross,
        public_notes: defaultQuotePublicNotes,
        terms: defaultQuoteTerms,
      })
      .select("id")
      .single();

    if (!quoteError && quoteData?.id) {
      quoteId = quoteData.id;
      break;
    }

    if (quoteError?.code !== "23505") {
      console.error("Failed to create draft quote.", quoteError);
      redirect(`/admin/requests/${requestId}?quoteError=1`);
    }
  }

  if (!quoteId) {
    redirect(`/admin/requests/${requestId}?quoteError=1`);
  }

  if (quoteItems.length > 0) {
    const { error: itemError } = await supabase.from("quote_items").insert(
      quoteItems.map((item) => ({
        quote_id: quoteId,
        product_id: item.product_id,
        product_name: item.product_name,
        category: item.category,
        unit: item.unit,
        quantity: item.quantity,
        unit_price_net: item.unit_price_net,
        vat_rate: item.vat_rate,
        line_total_net: calculateQuoteItemLineTotal(item),
        sort_order: item.sort_order,
        notes: item.notes ?? null,
      })),
    );

    if (itemError) {
      console.error("Failed to create draft quote items.", itemError);
      redirect(`/admin/requests/${requestId}?quoteError=1`);
    }
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}`);
}
