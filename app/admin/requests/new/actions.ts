"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/adminAuth";
import { isQuoteRequestCustomerType } from "@/lib/crm/customerType";
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

function getNullableNonNegativeInteger(formData: FormData, key: string) {
  const value = getString(formData, key);

  if (!value) {
    return null;
  }

  if (!/^\d+$/.test(value)) {
    throw new Error("Invalid non-negative integer.");
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Invalid non-negative integer.");
  }

  return parsed;
}

export async function createManualQuoteRequest(formData: FormData) {
  await requireAdminSession();

  const customerType = getString(formData, "customer_type") || "individual";
  const eventType = getString(formData, "event_type");
  const source = getString(formData, "source");
  const status = getString(formData, "status");

  if (
    !isQuoteRequestCustomerType(customerType) ||
    !eventType ||
    !isQuoteRequestSource(source) ||
    !isQuoteRequestStatus(status)
  ) {
    redirect("/admin/requests/new?error=1");
  }

  let quoteRequest: QuoteRequestInsert;

  try {
    const adultGuestCount = getNullableNonNegativeInteger(formData, "adult_guest_count");
    const childGuestCount = getNullableNonNegativeInteger(formData, "child_guest_count");
    const guestCount =
      adultGuestCount === null && childGuestCount === null
        ? null
        : (adultGuestCount ?? 0) + (childGuestCount ?? 0);

    if (guestCount !== null && guestCount <= 0) {
      throw new Error("Invalid guest breakdown.");
    }

    const commonFields = {
      status,
      event_type: eventType,
      event_date: getNullableString(formData, "event_date"),
      location: getNullableString(formData, "location"),
      adult_guest_count: adultGuestCount,
      child_guest_count: childGuestCount,
      guest_count: guestCount,
      interested_in: getNullableString(formData, "interested_in"),
      notes: getNullableString(formData, "notes"),
      internal_notes: getNullableString(formData, "internal_notes"),
      price_per_person: getNullablePositiveNumber(formData, "price_per_person"),
      quoted_total: getNullablePositiveNumber(formData, "quoted_total"),
      final_guest_count: getNullableNonNegativeInteger(formData, "final_guest_count"),
      final_total: getNullablePositiveNumber(formData, "final_total"),
      deposit_amount: getNullablePositiveNumber(formData, "deposit_amount"),
      source,
      next_follow_up_at: getNullableString(formData, "next_follow_up_at"),
    };

    if (customerType === "individual") {
      const name = getString(formData, "name");
      const phone = getNullableString(formData, "phone");
      const email = getNullableString(formData, "email");

      if (!name || (!phone && !email)) {
        throw new Error("Invalid individual customer fields.");
      }

      quoteRequest = {
        ...commonFields,
        customer_type: "individual",
        name,
        phone,
        email,
        business_name: null,
        business_vat: null,
        business_tax_office: null,
        business_address: null,
        contact_name: null,
        contact_phone: null,
        contact_email: null,
        invoice_required: false,
      };
    } else {
      const businessName = getString(formData, "business_name");
      const businessVat = getNullableString(formData, "business_vat");
      const businessTaxOffice = getNullableString(formData, "business_tax_office");
      const businessAddress = getNullableString(formData, "business_address");
      const contactName = getString(formData, "contact_name");
      const contactPhone = getNullableString(formData, "contact_phone");
      const contactEmail = getNullableString(formData, "contact_email");
      const invoiceRequired = formData.get("invoice_required") === "1";

      if (
        !businessName ||
        !contactName ||
        (!contactPhone && !contactEmail) ||
        (invoiceRequired && (!businessVat || !businessTaxOffice || !businessAddress))
      ) {
        throw new Error("Invalid business customer fields.");
      }

      quoteRequest = {
        ...commonFields,
        customer_type: "business",
        name: contactName,
        phone: contactPhone,
        email: contactEmail,
        business_name: businessName,
        business_vat: businessVat,
        business_tax_office: businessTaxOffice,
        business_address: businessAddress,
        contact_name: contactName,
        contact_phone: contactPhone,
        contact_email: contactEmail,
        invoice_required: invoiceRequired,
      };
    }
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
