"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";

import { createManualQuoteRequest } from "@/app/admin/requests/new/actions";
import { customerTypeLabels, quoteRequestCustomerTypes } from "@/lib/crm/customerType";
import { quoteRequestSources, sourceLabels } from "@/lib/crm/source";
import { quoteRequestStatuses, statusLabels } from "@/lib/crm/status";
import type { QuoteRequestCustomerType } from "@/lib/crm/types";

const eventTypes = [
  "Γάμος",
  "Βάπτιση",
  "Γενέθλια",
  "Ιδιωτικό party",
  "Εταιρικό event",
  "Ενοικίαση van",
  "Άλλο",
];

const interests = [
  "Food",
  "Bar",
  "Food & Bar",
  "Ενοικίαση van",
  "Δεν είμαι σίγουρος ακόμα",
];

const inputClass =
  "mt-2 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]";
const labelClass = "text-sm font-semibold text-[#0A5458]";

function TextInput({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        className={inputClass}
        min={type === "number" ? "0" : undefined}
        name={name}
        required={required}
        step={type === "number" ? "0.01" : undefined}
        type={type}
      />
    </label>
  );
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
      <h2 className="text-xl font-semibold text-[#0A5458]">{title}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function NewRequestForm() {
  const [customerType, setCustomerType] = useState<QuoteRequestCustomerType>("individual");
  const [invoiceRequired, setInvoiceRequired] = useState(false);

  return (
    <form action={createManualQuoteRequest} className="mt-6 space-y-6">
      <input name="customer_type" type="hidden" value={customerType} />

      <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#0A5458]">Τύπος πελάτη</h2>
            <p className="mt-2 text-sm leading-6 text-[#5f594f]">
              Επίλεξε αν το αίτημα αφορά ιδιώτη ή επιχείρηση.
            </p>
          </div>
          <div className="grid overflow-hidden rounded-full border border-[#d9b76f]/35 bg-[#fffaf0] p-1 sm:grid-cols-2">
            {quoteRequestCustomerTypes.map((type) => {
              const selected = customerType === type;

              return (
                <button
                  aria-pressed={selected}
                  className={`rounded-full px-5 py-2.5 text-sm font-bold transition ${
                    selected
                      ? "bg-[#0A5458] text-white shadow-sm"
                      : "text-[#0A5458] hover:bg-[#0A5458]/10"
                  }`}
                  key={type}
                  onClick={() => setCustomerType(type)}
                  type="button"
                >
                  {customerTypeLabels[type]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {customerType === "individual" ? (
        <Section title="Στοιχεία πελάτη">
          <TextInput label="Όνομα" name="name" required />
          <TextInput label="Τηλέφωνο" name="phone" type="tel" />
          <TextInput label="Email" name="email" type="email" />
        </Section>
      ) : (
        <>
          <Section title="Στοιχεία επιχείρησης">
            <TextInput label="Επωνυμία" name="business_name" required />
            <TextInput label="ΑΦΜ" name="business_vat" required={invoiceRequired} />
            <TextInput label="ΔΟΥ" name="business_tax_office" required={invoiceRequired} />
            <TextInput label="Διεύθυνση" name="business_address" required={invoiceRequired} />
            <label className="flex items-center gap-3 rounded-xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 px-3 py-3 text-sm font-semibold text-[#0A5458] md:col-span-2">
              <input
                checked={invoiceRequired}
                className="h-4 w-4 accent-[#0A5458]"
                name="invoice_required"
                onChange={(event) => setInvoiceRequired(event.target.checked)}
                type="checkbox"
                value="1"
              />
              Έκδοση τιμολογίου
            </label>
          </Section>

          <Section title="Στοιχεία επαφής">
            <TextInput label="Όνομα επαφής" name="contact_name" required />
            <TextInput label="Τηλέφωνο" name="contact_phone" type="tel" />
            <TextInput label="Email" name="contact_email" type="email" />
          </Section>
        </>
      )}

      <Section title="Στοιχεία εκδήλωσης">
        <label className={labelClass}>
          Είδος εκδήλωσης
          <select className={inputClass} defaultValue="" name="event_type" required>
            <option disabled value="">
              Επίλεξε είδος
            </option>
            {eventTypes.map((eventType) => (
              <option key={eventType} value={eventType}>
                {eventType}
              </option>
            ))}
          </select>
        </label>
        <TextInput label="Ημερομηνία εκδήλωσης" name="event_date" type="date" />
        <TextInput label="Περιοχή" name="location" />
        <TextInput label="Αριθμός καλεσμένων ενηλίκων" name="adult_guest_count" type="number" />
        <TextInput label="Αριθμός καλεσμένων παιδιών" name="child_guest_count" type="number" />
        <label className={labelClass}>
          Ενδιαφέρεται για
          <select className={inputClass} defaultValue="" name="interested_in">
            <option value="">Δεν έχει οριστεί</option>
            {interests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Σημειώσεις πελάτη
          <textarea className={`${inputClass} min-h-32`} name="notes" />
        </label>
      </Section>

      <Section title="Διαχείριση CRM">
        <label className={labelClass}>
          Πηγή
          <select className={inputClass} defaultValue="phone" name="source" required>
            {quoteRequestSources.map((source) => (
              <option key={source} value={source}>
                {sourceLabels[source]}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Κατάσταση
          <select className={inputClass} defaultValue="NEW" name="status" required>
            {quoteRequestStatuses.map((status) => (
              <option key={status} value={status}>
                {statusLabels[status]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Εσωτερικές σημειώσεις
          <textarea className={`${inputClass} min-h-32`} name="internal_notes" />
        </label>
        <TextInput label="Τιμή ανά άτομο" name="price_per_person" type="number" />
        <TextInput label="Ποσό προσφοράς" name="quoted_total" type="number" />
        <TextInput label="Τελικός αριθμός ατόμων" name="final_guest_count" type="number" />
        <TextInput label="Τελικό ποσό" name="final_total" type="number" />
        <TextInput label="Προκαταβολή" name="deposit_amount" type="number" />
        <TextInput label="Επόμενο follow-up" name="next_follow_up_at" type="datetime-local" />
      </Section>

      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white" type="submit">
          Δημιουργία εγγραφής
        </button>
        <Link className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458]" href="/admin/requests">
          Πίσω στα αιτήματα
        </Link>
      </div>
    </form>
  );
}
