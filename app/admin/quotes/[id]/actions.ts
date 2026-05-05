"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import {
  calculateQuoteItemLineTotal,
  calculateQuoteTotals,
  isQuoteStatus,
  type QuoteItemInput,
} from "@/lib/crm/quotes";
import { isQuoteProductCategory, isQuoteProductUnit } from "@/lib/crm/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNonNegativeNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return 0;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid non-negative number.");
  }

  return parsed;
}

function getInteger(formData: FormData, key: string, defaultValue: number) {
  const value = getString(formData, key);

  if (!value) {
    return defaultValue;
  }

  if (!/^-?\d+$/.test(value)) {
    throw new Error("Invalid integer.");
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed)) {
    throw new Error("Invalid integer.");
  }

  return parsed;
}

function getQuoteItemsFromForm(formData: FormData) {
  const rowKeys = formData.getAll("row_key").map((value) => String(value));

  return rowKeys.map<QuoteItemInput>((rowKey, index) => {
    const productName = getString(formData, `product_name_${rowKey}`);
    const category = getString(formData, `category_${rowKey}`);
    const unit = getString(formData, `unit_${rowKey}`);

    if (!productName || !isQuoteProductCategory(category) || !isQuoteProductUnit(unit)) {
      throw new Error("Invalid quote item.");
    }

    return {
      id: getNullableString(formData, `item_id_${rowKey}`),
      product_id: getNullableString(formData, `product_id_${rowKey}`),
      product_name: productName,
      category,
      unit,
      quantity: getNonNegativeNumber(formData, `quantity_${rowKey}`),
      unit_price_net: getNonNegativeNumber(formData, `unit_price_net_${rowKey}`),
      vat_rate: getNonNegativeNumber(formData, `vat_rate_${rowKey}`),
      sort_order: getInteger(formData, `sort_order_${rowKey}`, index + 1),
      notes: getNullableString(formData, `notes_${rowKey}`),
    };
  });
}

export async function updateQuote(formData: FormData) {
  await requireAdminSession();

  const quoteId = getString(formData, "quote_id");
  const requestId = getString(formData, "request_id");
  const status = getString(formData, "status");

  if (!quoteId || !requestId || !isQuoteStatus(status)) {
    redirect(quoteId ? `/admin/quotes/${quoteId}?error=1` : "/admin/requests");
  }

  let quoteItems: QuoteItemInput[];

  try {
    quoteItems = getQuoteItemsFromForm(formData);
  } catch {
    redirect(`/admin/quotes/${quoteId}?error=1`);
  }

  const quoteTotals = calculateQuoteTotals(quoteItems);
  const supabase = createSupabaseAdminClient();
  const { data: existingItems, error: existingItemsError } = await supabase
    .from("quote_items")
    .select("id")
    .eq("quote_id", quoteId);

  if (existingItemsError) {
    console.error("Failed to load existing quote items.", existingItemsError);
    redirect(`/admin/quotes/${quoteId}?error=1`);
  }

  const savedItemIds = new Set(quoteItems.map((item) => item.id).filter(Boolean));
  const itemIdsToDelete = (existingItems ?? [])
    .map((item) => String(item.id))
    .filter((itemId) => !savedItemIds.has(itemId));

  if (itemIdsToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("quote_items")
      .delete()
      .eq("quote_id", quoteId)
      .in("id", itemIdsToDelete);

    if (deleteError) {
      console.error("Failed to remove quote items.", deleteError);
      redirect(`/admin/quotes/${quoteId}?error=1`);
    }
  }

  for (const item of quoteItems) {
    const itemPayload = {
      quote_id: quoteId,
      product_id: item.product_id || null,
      product_name: item.product_name,
      category: item.category,
      unit: item.unit,
      quantity: item.quantity,
      unit_price_net: item.unit_price_net,
      vat_rate: item.vat_rate,
      line_total_net: calculateQuoteItemLineTotal(item),
      sort_order: item.sort_order,
      notes: item.notes ?? null,
    };

    if (item.id) {
      const { error: updateError } = await supabase
        .from("quote_items")
        .update(itemPayload)
        .eq("quote_id", quoteId)
        .eq("id", item.id);

      if (updateError) {
        console.error("Failed to update quote item.", updateError);
        redirect(`/admin/quotes/${quoteId}?error=1`);
      }
    } else {
      const { error: insertError } = await supabase.from("quote_items").insert(itemPayload);

      if (insertError) {
        console.error("Failed to insert quote item.", insertError);
        redirect(`/admin/quotes/${quoteId}?error=1`);
      }
    }
  }

  const { error: quoteError } = await supabase
    .from("quotes")
    .update({
      status,
      valid_until: getNullableString(formData, "valid_until"),
      public_notes: getNullableString(formData, "public_notes"),
      terms: getNullableString(formData, "terms"),
      internal_notes: getNullableString(formData, "internal_notes"),
      subtotal_net: quoteTotals.subtotal_net,
      vat_amount: quoteTotals.vat_amount,
      total_gross: quoteTotals.total_gross,
    })
    .eq("id", quoteId);

  if (quoteError) {
    console.error("Failed to update quote.", quoteError);
    redirect(`/admin/quotes/${quoteId}?error=1`);
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath(`/admin/quotes/${quoteId}`);
  redirect(`/admin/quotes/${quoteId}?saved=1`);
}
