"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import { isQuoteRequestStatus } from "@/lib/crm/status";
import type { QuoteRequestUpdate } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getNullableString(formData: FormData, key: string) {
  const value = getString(formData, key);
  return value || null;
}

function getNullableNumber(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const normalized = value.replace(",", ".");
  const parsed = Number.parseFloat(normalized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid numeric value.");
  }

  return parsed;
}

function getNullableInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid integer value.");
  }

  return parsed;
}

export async function updateQuoteRequest(id: string, formData: FormData) {
  await requireAdminSession();

  const status = getString(formData, "status");

  if (!isQuoteRequestStatus(status)) {
    redirect(`/admin/requests/${id}?error=1`);
  }

  let update: QuoteRequestUpdate;

  try {
    update = {
      status,
      internal_notes: getNullableString(formData, "internal_notes"),
      price_per_person: getNullableNumber(formData, "price_per_person"),
      quoted_total: getNullableNumber(formData, "quoted_total"),
      final_guest_count: getNullableInteger(formData, "final_guest_count"),
      final_total: getNullableNumber(formData, "final_total"),
      deposit_amount: getNullableNumber(formData, "deposit_amount"),
      quote_sent_at: getNullableString(formData, "quote_sent_at"),
      last_contacted_at: getNullableString(formData, "last_contacted_at"),
      next_follow_up_at: getNullableString(formData, "next_follow_up_at"),
      closed_at: getNullableString(formData, "closed_at"),
      lost_reason: getNullableString(formData, "lost_reason"),
    };
  } catch {
    redirect(`/admin/requests/${id}?error=1`);
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("quote_requests").update(update).eq("id", id);

  if (error) {
    console.error("Failed to update quote request.", error);
    redirect(`/admin/requests/${id}?error=1`);
  }

  revalidatePath("/admin/requests");
  revalidatePath(`/admin/requests/${id}`);
  revalidatePath("/admin/stats");
  redirect(`/admin/requests/${id}?saved=1`);
}
