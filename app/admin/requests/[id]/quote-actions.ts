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
import { normalizeSelectedMenuItems, type QuoteMenuAudience, type QuoteMenuItem } from "@/lib/crm/menuItems";
import type { QuoteProduct, QuoteProductCategory, QuoteProductUnit } from "@/lib/crm/products";
import type { QuoteRequest } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const defaultMarginPercent = 30;
const defaultOfferVatRate = 24;
const serviceProductKeys = ["van-rental-cost", "transport-cost", "staff-cost", "consumables-cost"];

function normalizeText(value: string) {
  return value.trim().toLocaleLowerCase("el-GR");
}

function isProductAudienceAllowed(product: QuoteProduct, audience: QuoteMenuAudience) {
  return audience === "adult"
    ? product.audience === "adult" || product.audience === "both"
    : product.audience === "child" || product.audience === "both";
}

function findMatchingProduct(item: QuoteMenuItem, products: QuoteProduct[], audience: QuoteMenuAudience) {
  const byKey = products.find(
    (product) => product.product_key === item.id && isProductAudienceAllowed(product, audience),
  );

  if (byKey) {
    return byKey;
  }

  const itemLabel = normalizeText(item.label);

  return (
    products.find(
      (product) =>
        product.category === item.category &&
        isProductAudienceAllowed(product, audience) &&
        normalizeText(product.name) === itemLabel,
    ) ?? null
  );
}

function getGuestBreakdown(request: QuoteRequest) {
  const adultGuestCount = request.adult_guest_count ?? request.guest_count ?? 0;
  const childGuestCount = request.child_guest_count ?? 0;
  const totalGuestCount = request.guest_count ?? adultGuestCount + childGuestCount;

  return {
    adultGuestCount,
    childGuestCount,
    totalGuestCount,
  };
}

function getSelectedMenuItems(request: QuoteRequest, audience: QuoteMenuAudience) {
  if (audience === "adult") {
    const explicitAdultMenuItems = normalizeSelectedMenuItems(request.selected_adult_menu_items, "adult");

    return explicitAdultMenuItems.length > 0
      ? explicitAdultMenuItems
      : normalizeSelectedMenuItems(request.selected_menu_items, "adult");
  }

  return normalizeSelectedMenuItems(request.selected_child_menu_items, "child");
}

function getMenuQuoteItems(
  selectedMenuItems: QuoteMenuItem[],
  products: QuoteProduct[],
  audience: QuoteMenuAudience,
  guestCount: number,
  sortOrderOffset: number,
) {
  if (guestCount <= 0) {
    return [];
  }

  return selectedMenuItems.map<QuoteItemInput>((item, index) => {
    const product = findMatchingProduct(item, products, audience);
    const unit = product?.unit ?? "per_person";
    const unitPriceNet = product?.price_net ?? 0;
    const vatRate = product?.vat_rate ?? 24;
    const notes =
      !product || unitPriceNet === 0
        ? "Χρειάζεται έλεγχος κόστους πριν την αποστολή."
        : null;

    return {
      product_id: product?.id ?? null,
      product_name: product?.name ?? item.label,
      category: (product?.category ?? item.category) as QuoteProductCategory,
      audience,
      unit,
      quantity: guestCount,
      unit_price_net: unitPriceNet,
      vat_rate: vatRate,
      line_type: "menu",
      is_extra_expense: false,
      sort_order: sortOrderOffset + index + 1,
      notes,
    };
  });
}

function getServiceQuoteItems(products: QuoteProduct[]) {
  return serviceProductKeys
    .map<QuoteItemInput | null>((productKey, index) => {
      const product = products.find(
        (candidate) => candidate.product_key === productKey && candidate.audience === "service",
      );

      if (!product) {
        return null;
      }

      return {
        product_id: product.id,
        product_name: product.name,
        category: product.category as QuoteProductCategory,
        audience: "service",
        unit: "fixed" as QuoteProductUnit,
        quantity: 1,
        unit_price_net: product.price_net,
        vat_rate: product.vat_rate,
        line_type: "service",
        is_extra_expense: false,
        sort_order: 300 + index + 1,
        notes:
          product.price_net === 0
            ? "Χρειάζεται έλεγχος κόστους πριν την αποστολή."
            : null,
      } satisfies QuoteItemInput;
    })
    .filter((item): item is QuoteItemInput => item !== null);
}

function getQuoteItemsFromRequest(request: QuoteRequest, products: QuoteProduct[]) {
  const { adultGuestCount, childGuestCount } = getGuestBreakdown(request);
  const adultQuoteItems = getMenuQuoteItems(
    getSelectedMenuItems(request, "adult"),
    products,
    "adult",
    adultGuestCount,
    100,
  );
  const childQuoteItems = getMenuQuoteItems(
    getSelectedMenuItems(request, "child"),
    products,
    "child",
    childGuestCount,
    200,
  );

  return [...adultQuoteItems, ...childQuoteItems, ...getServiceQuoteItems(products)];
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
    audience:
      product.audience === "adult" ||
      product.audience === "child" ||
      product.audience === "both" ||
      product.audience === "service"
        ? product.audience
        : product.category === "service"
          ? "service"
          : "both",
    price_net: Number(product.price_net) || 0,
    vat_rate: Number(product.vat_rate) || 0,
    sort_order: Number(product.sort_order) || 0,
  })) as QuoteProduct[];
  const quoteItems = getQuoteItemsFromRequest(request, products);
  const quoteTotals = calculateQuoteTotals(quoteItems, {
    margin_percent: defaultMarginPercent,
    offer_vat_rate: defaultOfferVatRate,
  });
  const guestBreakdown = getGuestBreakdown(request);
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
        adult_guest_count: guestBreakdown.adultGuestCount,
        child_guest_count: guestBreakdown.childGuestCount,
        guest_count: guestBreakdown.totalGuestCount,
        food_drinks_cost_net: quoteTotals.food_drinks_cost_net,
        van_rental_cost_net: quoteTotals.van_rental_cost_net,
        transport_cost_net: quoteTotals.transport_cost_net,
        staff_cost_net: quoteTotals.staff_cost_net,
        consumables_cost_net: quoteTotals.consumables_cost_net,
        extra_costs_net: quoteTotals.extra_costs_net,
        total_cost_net: quoteTotals.total_cost_net,
        margin_percent: quoteTotals.margin_percent,
        offer_net: quoteTotals.offer_net,
        profit_net: quoteTotals.profit_net,
        offer_vat_rate: quoteTotals.offer_vat_rate,
        offer_vat_amount: quoteTotals.offer_vat_amount,
        offer_gross: quoteTotals.offer_gross,
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
        audience: item.audience ?? null,
        unit: item.unit,
        quantity: item.quantity,
        unit_price_net: item.unit_price_net,
        vat_rate: item.vat_rate,
        line_total_net: calculateQuoteItemLineTotal(item),
        line_type: item.line_type ?? "menu",
        is_extra_expense: item.is_extra_expense ?? false,
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
