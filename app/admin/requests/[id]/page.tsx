import Link from "next/link";
import { notFound } from "next/navigation";

import { updateQuoteRequest } from "@/app/admin/requests/[id]/actions";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatDate, formatDateTime, formatNumber, toDateTimeLocalValue } from "@/lib/crm/formatters";
import { getSourceLabel } from "@/lib/crm/source";
import { quoteRequestStatuses, statusLabels, statusToneClasses } from "@/lib/crm/status";
import type { QuoteRequest } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RequestDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
    created?: string;
    error?: string;
  }>;
};

function ReadOnlyField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#d9b76f]/20 bg-[#fffaf0]/70 p-4">
      <dt className="text-xs font-bold uppercase tracking-wide text-[#0A5458]">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-[#2f2b25]">{value || "-"}</dd>
    </div>
  );
}

function TextInput({
  label,
  name,
  type = "text",
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="text-sm font-semibold text-[#0A5458]">
      {label}
      <input
        className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
        defaultValue={defaultValue ?? ""}
        min={type === "number" ? "0" : undefined}
        name={name}
        step={type === "number" ? "0.01" : undefined}
        type={type}
      />
    </label>
  );
}

export default async function RequestDetailPage({ params, searchParams }: RequestDetailPageProps) {
  await requireAdminSession();

  const { id } = await params;
  const messages = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id).single();

  if (error || !data) {
    notFound();
  }

  const request = data as QuoteRequest;
  const saveAction = updateQuoteRequest.bind(null, request.id);

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[#0A5458] hover:underline" href="/admin/requests">
            Πίσω στα αιτήματα
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0A5458]">Αίτημα προσφοράς</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusToneClasses[request.status]}`}>
              {statusLabels[request.status]}
            </span>
            <span className="text-sm text-[#5f594f]">{formatDateTime(request.created_at)}</span>
          </div>
        </div>
      </div>

      {messages.saved === "1" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Οι αλλαγές αποθηκεύτηκαν.
        </p>
      ) : null}
      {messages.created === "1" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Η εγγραφή δημιουργήθηκε.
        </p>
      ) : null}
      {messages.error === "1" ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Δεν ήταν δυνατή η αποθήκευση των αλλαγών.
        </p>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
            <h2 className="text-xl font-semibold text-[#0A5458]">Στοιχεία πελάτη</h2>
            <dl className="mt-4 grid gap-3">
              <ReadOnlyField label="Όνομα" value={request.name} />
              <ReadOnlyField label="Τηλέφωνο" value={request.phone} />
              <ReadOnlyField label="Email" value={request.email} />
              <ReadOnlyField label="Πηγή" value={getSourceLabel(request.source)} />
            </dl>
          </section>

          <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
            <h2 className="text-xl font-semibold text-[#0A5458]">Στοιχεία εκδήλωσης</h2>
            <dl className="mt-4 grid gap-3">
              <ReadOnlyField label="Είδος εκδήλωσης" value={request.event_type} />
              <ReadOnlyField label="Ημερομηνία εκδήλωσης" value={formatDate(request.event_date)} />
              <ReadOnlyField label="Περιοχή" value={request.location} />
              <ReadOnlyField label="Αριθμός ατόμων" value={formatNumber(request.guest_count)} />
              <ReadOnlyField label="Ενδιαφέρεται για" value={request.interested_in} />
              <ReadOnlyField label="Σημειώσεις πελάτη" value={request.notes || "Δεν συμπληρώθηκαν"} />
              <ReadOnlyField label="Ημερομηνία αιτήματος" value={formatDateTime(request.created_at)} />
            </dl>
          </section>
        </div>

        <section className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Διαχείριση CRM</h2>
          <form action={saveAction} className="mt-5 space-y-5">
            <label className="block text-sm font-semibold text-[#0A5458]">
              Κατάσταση
              <select
                className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
                defaultValue={request.status}
                name="status"
              >
                {quoteRequestStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm font-semibold text-[#0A5458]">
              Εσωτερικές σημειώσεις
              <textarea
                className="mt-2 min-h-32 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
                defaultValue={request.internal_notes ?? ""}
                name="internal_notes"
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <TextInput defaultValue={request.price_per_person} label="Τιμή ανά άτομο" name="price_per_person" type="number" />
              <TextInput defaultValue={request.quoted_total} label="Ποσό προσφοράς" name="quoted_total" type="number" />
              <TextInput defaultValue={request.final_guest_count} label="Τελικός αριθμός ατόμων" name="final_guest_count" type="number" />
              <TextInput defaultValue={request.final_total} label="Τελικό ποσό" name="final_total" type="number" />
              <TextInput defaultValue={request.deposit_amount} label="Προκαταβολή" name="deposit_amount" type="number" />
              <TextInput defaultValue={toDateTimeLocalValue(request.quote_sent_at)} label="Ημερομηνία αποστολής προσφοράς" name="quote_sent_at" type="datetime-local" />
              <TextInput defaultValue={toDateTimeLocalValue(request.last_contacted_at)} label="Τελευταία επικοινωνία" name="last_contacted_at" type="datetime-local" />
              <TextInput defaultValue={toDateTimeLocalValue(request.next_follow_up_at)} label="Επόμενο follow-up" name="next_follow_up_at" type="datetime-local" />
              <TextInput defaultValue={toDateTimeLocalValue(request.closed_at)} label="Ημερομηνία κλεισίματος" name="closed_at" type="datetime-local" />
            </div>

            <label className="block text-sm font-semibold text-[#0A5458]">
              Λόγος απώλειας
              <textarea
                className="mt-2 min-h-24 w-full rounded-xl border border-[#d9b76f]/30 bg-white px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
                defaultValue={request.lost_reason ?? ""}
                name="lost_reason"
              />
            </label>

            <div className="rounded-2xl border border-[#d9b76f]/25 bg-[#fffaf0]/70 p-4 text-sm leading-6 text-[#5f594f]">
              <p>Τρέχουσα προσφορά: {formatCurrency(request.quoted_total)}</p>
              <p>Τρέχον τελικό ποσό: {formatCurrency(request.final_total)}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white" type="submit">
                Αποθήκευση αλλαγών
              </button>
              <Link className="rounded-full border border-[#d9b76f]/40 px-5 py-3 text-sm font-bold text-[#0A5458]" href="/admin/requests">
                Πίσω στα αιτήματα
              </Link>
            </div>
          </form>
        </section>
      </div>
    </AdminShell>
  );
}
