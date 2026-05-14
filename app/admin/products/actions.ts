"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import {
  isQuoteProductAudience,
  isQuoteProductCategory,
  isQuoteProductUnit,
  type QuoteProductInsert,
  type QuoteProductUpdate,
} from "@/lib/crm/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNonNegativeNumber(formData: FormData, key: string, defaultValue = 0) {
  const value = getString(formData, key);

  if (!value) {
    return defaultValue;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid non-negative number.");
  }

  return parsed;
}

function getInteger(formData: FormData, key: string, defaultValue = 0) {
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

function getProductFields(formData: FormData): QuoteProductInsert {
  const name = getString(formData, "name");
  const category = getString(formData, "category");
  const audience = getString(formData, "audience");
  const unit = getString(formData, "unit");

  if (
    !name ||
    !isQuoteProductCategory(category) ||
    !isQuoteProductAudience(audience) ||
    !isQuoteProductUnit(unit)
  ) {
    throw new Error("Invalid product fields.");
  }

  return {
    name,
    category,
    audience,
    unit,
    price_net: getNonNegativeNumber(formData, "price_net"),
    vat_rate: getNonNegativeNumber(formData, "vat_rate", 24),
    is_active: formData.get("is_active") === "1",
    sort_order: getInteger(formData, "sort_order"),
    notes: getNullableString(formData, "notes"),
  };
}

export async function createQuoteProduct(formData: FormData) {
  await requireAdminSession();

  let product: QuoteProductInsert;

  try {
    product = getProductFields(formData);
  } catch {
    redirect("/admin/products?error=1");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("quote_products").insert(product);

  if (error) {
    console.error("Failed to create quote product.", error);
    redirect("/admin/products?error=1");
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?created=1");
}

export async function updateQuoteProduct(formData: FormData) {
  await requireAdminSession();

  const id = getString(formData, "id");
  let product: QuoteProductUpdate;

  try {
    if (!id) {
      throw new Error("Missing product id.");
    }

    product = getProductFields(formData);
  } catch {
    redirect("/admin/products?error=1");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("quote_products").update(product).eq("id", id);

  if (error) {
    console.error("Failed to update quote product.", error);
    redirect("/admin/products?error=1");
  }

  revalidatePath("/admin/products");
  redirect("/admin/products?saved=1");
}
