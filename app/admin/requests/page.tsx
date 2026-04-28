import Link from "next/link";

import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/crm/formatters";
import { isQuoteRequestStatus, statusLabels, statusToneClasses } from "@/lib/crm/status";
import type { QuoteRequest, QuoteRequestStatus } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RequestsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const eventTypes = [
  "Γάμος",
  "Βάπτιση",
  "Γενέθλια",
  "Ιδιωτικό party",
  "Εταιρικό event",
  "Ενοικίαση van",
  "Άλλο",
];

const quickTabs: Array<{ label: string; status?: QuoteRequestStatus }> = [
  { label: "Όλα" },
  { label: "Νέα", status: "NEW" },
  { label: "Σε επικοινωνία", status: "CONTACTED" },
  { label: "Περιμένουν προσφορά", status: "NEEDS_QUOTE" },
  { label: "Προσφορά στάλθηκε", status: "QUOTE_SENT" },
  { label: "Κλεισμένα", status: "WON" },
  { label: "Χαμένα", status: "LOST" },
];

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function getPositiveInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function getTabHref(status?: QuoteRequestStatus) {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  const query = params.toString();
  return query ? `/admin/requests?${query}` : "/admin/requests";
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  await requireAdminSession();

  const params = await searchParams;
  const search = getParam(params, "search");
  const status = getParam(params, "status");
  const eventType = getParam(params, "eventType");
  const minGuests = getParam(params, "minGuests");
  const maxGuests = getParam(params, "maxGuests");
  const createdFrom = getParam(params, "createdFrom");
  const createdTo = getParam(params, "createdTo");
  const eventFrom = getParam(params, "eventFrom");
  const eventTo = getParam(params, "eventTo");

  const supabase = createSupabaseAdminClient();
  let query = supabase.from("quote_requests").select("*").order("created_at", { ascending: false });

  if (search) {
    const escapedSearch = search.replaceAll("%", "\\%").replaceAll(",", "\\,");
    query = query.or(`name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`);
  }

  if (isQuoteRequestStatus(status)) {
    query = query.eq("status", status);
  }

  if (eventType) {
    query = query.eq("event_type", eventType);
  }

  const minGuestCount = getPositiveInteger(minGuests);
  const maxGuestCount = getPositiveInteger(maxGuests);

  if (minGuestCount !== null) {
    query = query.gte("guest_count", minGuestCount);
  }

  if (maxGuestCount !== null) {
    query = query.lte("guest_count", maxGuestCount);
  }

  if (createdFrom) {
    query = query.gte("created_at", `${createdFrom}T00:00:00`);
  }

  if (createdTo) {
    query = query.lte("created_at", `${createdTo}T23:59:59`);
  }

  if (eventFrom) {
    query = query.gte("event_date", eventFrom);
  }

  if (eventTo) {
    query = query.lte("event_date", eventTo);
  }

  const { data, error } = await query;
  const requests = (data ?? []) as QuoteRequest[];

  return (
    <AdminShell>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#0A5458]">Αιτήματα προσφοράς</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f594f]">
            Διαχείριση ενδιαφέροντος, προσφορών και κλεισμένων εκδηλώσεων.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {quickTabs.map((tab) => {
          const active = tab.status ? status === tab.status : !status;

          return (
            <Link
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active
                  ? "border-[#0A5458] bg-[#0A5458] text-white"
                  : "border-[#d9b76f]/35 bg-white/75 text-[#0A5458] hover:bg-[#0A5458]/10"
              }`}
              href={getTabHref(tab.status)}
              key={tab.label}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <form className="mt-6 rounded-2xl border border-[#d9b76f]/25 bg-white/80 p-5 shadow-lg shadow-[#0A5458]/5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="text-sm font-semibold text-[#0A5458]">
            Αναζήτηση
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={search}
              name="search"
              placeholder="Όνομα, email ή τηλέφωνο"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Κατάσταση
            <select
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={isQuoteRequestStatus(status) ? status : ""}
              name="status"
            >
              <option value="">Όλες</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Είδος εκδήλωσης
            <select
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={eventType}
              name="eventType"
            >
              <option value="">Όλα</option>
              {eventTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Ελάχιστα άτομα
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={minGuests}
              min="0"
              name="minGuests"
              type="number"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Μέγιστα άτομα
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={maxGuests}
              min="0"
              name="maxGuests"
              type="number"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Από ημερομηνία αιτήματος
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={createdFrom}
              name="createdFrom"
              type="date"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Έως ημερομηνία αιτήματος
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={createdTo}
              name="createdTo"
              type="date"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Από ημερομηνία εκδήλωσης
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={eventFrom}
              name="eventFrom"
              type="date"
            />
          </label>
          <label className="text-sm font-semibold text-[#0A5458]">
            Έως ημερομηνία εκδήλωσης
            <input
              className="mt-2 w-full rounded-xl border border-[#d9b76f]/30 px-3 py-2 text-sm outline-none focus:border-[#0A5458]"
              defaultValue={eventTo}
              name="eventTo"
              type="date"
            />
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="rounded-full bg-[#0A5458] px-5 py-2.5 text-sm font-bold text-white" type="submit">
            Εφαρμογή φίλτρων
          </button>
          <Link className="rounded-full border border-[#d9b76f]/40 px-5 py-2.5 text-sm font-bold text-[#0A5458]" href="/admin/requests">
            Καθαρισμός
          </Link>
        </div>
      </form>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Δεν ήταν δυνατή η φόρτωση των αιτημάτων.
        </p>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#d9b76f]/25 bg-white/85 shadow-xl shadow-[#0A5458]/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#d9b76f]/20 text-left text-sm">
            <thead className="bg-[#f8f2e5] text-xs font-bold uppercase tracking-wide text-[#0A5458]">
              <tr>
                <th className="px-4 py-3">Ημερομηνία αιτήματος</th>
                <th className="px-4 py-3">Κατάσταση</th>
                <th className="px-4 py-3">Όνομα</th>
                <th className="px-4 py-3">Τηλέφωνο</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Είδος εκδήλωσης</th>
                <th className="px-4 py-3">Ημερομηνία εκδήλωσης</th>
                <th className="px-4 py-3">Περιοχή</th>
                <th className="px-4 py-3">Άτομα</th>
                <th className="px-4 py-3">Προσφορά</th>
                <th className="px-4 py-3">Τελικό ποσό</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d9b76f]/15">
              {requests.map((request) => (
                <tr className="transition hover:bg-[#fff7e6]" key={request.id}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link className="font-semibold text-[#0A5458]" href={`/admin/requests/${request.id}`}>
                      {formatDateTime(request.created_at)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${statusToneClasses[request.status]}`}>
                      {statusLabels[request.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{request.name}</td>
                  <td className="whitespace-nowrap px-4 py-3">{request.phone}</td>
                  <td className="whitespace-nowrap px-4 py-3">{request.email}</td>
                  <td className="whitespace-nowrap px-4 py-3">{request.event_type}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatDate(request.event_date)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{request.location || "-"}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatNumber(request.guest_count)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(request.quoted_total)}</td>
                  <td className="whitespace-nowrap px-4 py-3">{formatCurrency(request.final_total)}</td>
                </tr>
              ))}
              {requests.length === 0 ? (
                <tr>
                  <td className="px-4 py-10 text-center text-sm text-[#5f594f]" colSpan={11}>
                    Δεν βρέθηκαν αιτήματα με αυτά τα φίλτρα.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
