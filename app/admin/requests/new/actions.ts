"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import { isQuoteRequestSource } from "@/lib/crm/source";
import { isQuoteRequestStatus } from "@/lib/crm/status";
import type { QuoteRequestInsert } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNullablePositiveNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value.replace(",", "."));

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid positive number.");
  }

  return parsed;
}

function getNullablePositiveInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid positive integer.");
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid positive integer.");
  }

  return parsed;
}

export async function createManualQuoteRequest(formData: FormData) {
  await requireAdminSession();

  const name = getString(formData, "name");
  const phone = getNullableString(formData, "phone");
  const email = getNullableString(formData, "email");
  const eventType = getString(formData, "event_type");
  const source = getString(formData, "source");
  const status = getString(formData, "status");

  if (!name || !eventType || (!phone && !email) || !isQuoteRequestSource(source) || !isQuoteRequestStatus(status)) {
    redirect("/admin/requests/new?error=1");
  }

  let quoteRequest: QuoteRequestInsert;

  try {
    quoteRequest = {
      status,
      name,
      phone,
      email,
      event_type: eventType,
      event_date: getNullableString(formData, "event_date"),
      location: getNullableString(formData, "location"),
      guest_count: getNullablePositiveInteger(formData, "guest_count"),
      interested_in: getNullableString(formData, "interested_in"),
      notes: getNullableString(formData, "notes"),
      internal_notes: getNullableString(formData, "internal_notes"),
      price_per_person: getNullablePositiveNumber(formData, "price_per_person"),
      quoted_total: getNullablePositiveNumber(formData, "quoted_total"),
      final_guest_count: getNullablePositiveInteger(formData, "final_guest_count"),
      final_total: getNullablePositiveNumber(formData, "final_total"),
      deposit_amount: getNullablePositiveNumber(formData, "deposit_amount"),
      source,
      next_follow_up_at: getNullableString(formData, "next_follow_up_at"),
    };
  } catch {
    redirect("/admin/requests/new?error=1");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("quote_requests").insert(quoteRequest).select("id").single();

  if (error || !data?.id) {
    console.error("Failed to create manual quote request.", error);
    redirect("/admin/requests/new?error=1");
  }

  revalidatePath("/admin/requests");
  revalidatePath("/admin/stats");
  redirect(`/admin/requests/${data.id}?created=1`);
}
