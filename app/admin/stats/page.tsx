import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/crm/formatters";
import { statusLabels, statusToneClasses } from "@/lib/crm/status";
import type { QuoteRequest, QuoteRequestStatus } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function sum(values: Array<number | null>) {
  return values.reduce<number>((total, value) => total + (value ?? 0), 0);
}

function average(values: Array<number | null>) {
  const filtered = values.filter((value): value is number => value !== null && Number.isFinite(value));

  if (filtered.length === 0) {
    return null;
  }

  return sum(filtered) / filtered.length;
}

function getMonthKey(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split("-");
  return new Intl.DateTimeFormat("el-GR", {
    month: "short",
    year: "numeric",
  }).format(new Date(Number(year), Number(month) - 1, 1));
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
      <p className="text-sm font-semibold text-[#5f594f]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[#0A5458]">{value}</p>
    </div>
  );
}

function BarRow({ label, value, max, suffix = "" }: { label: string; value: number; max: number; suffix?: string }) {
  const width = max > 0 ? Math.max((value / max) * 100, 4) : 0;

  return (
    <div className="grid gap-2 sm:grid-cols-[170px_1fr_90px] sm:items-center">
      <p className="text-sm font-semibold text-[#0A5458]">{label}</p>
      <div className="h-3 overflow-hidden rounded-full bg-[#f1e5ca]">
        <div className="h-full rounded-full bg-[#0A5458]" style={{ width: `${width}%` }} />
      </div>
      <p className="text-sm font-semibold text-[#2f2b25]">
        {formatNumber(value, 0)}
        {suffix}
      </p>
    </div>
  );
}

export default async function StatsPage() {
  await requireAdminSession();

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("quote_requests").select("*");
  const requests = (data ?? []) as QuoteRequest[];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const totalRequests = requests.length;
  const newRequests = requests.filter((request) => request.status === "NEW").length;
  const requestsThisMonth = requests.filter((request) => new Date(request.created_at) >= monthStart).length;
  const wonRequests = requests.filter((request) => request.status === "WON");
  const lostRequests = requests.filter((request) => request.status === "LOST");
  const relevantRequests = requests.filter((request) => request.status !== "CANCELLED").length;
  const conversionRate = relevantRequests > 0 ? wonRequests.length / relevantRequests : 0;
  const totalQuotedRevenue = sum(requests.map((request) => request.quoted_total));
  const finalClosedRevenue = sum(wonRequests.map((request) => request.final_total));
  const averagePricePerPerson = average(requests.map((request) => request.price_per_person));
  const averageEventValue = average(
    wonRequests.map((request) => request.final_total ?? request.quoted_total),
  );
  const averageGuestCount = average(requests.map((request) => request.guest_count));

  const statusCounts = requests.reduce(
    (counts, request) => {
      counts[request.status] = (counts[request.status] ?? 0) + 1;
      return counts;
    },
    {} as Record<QuoteRequestStatus, number>,
  );
  const maxStatusCount = Math.max(...Object.values(statusCounts), 0);

  const eventTypeCounts = requests.reduce(
    (counts, request) => {
      counts[request.event_type] = (counts[request.event_type] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const eventTypeRows = Object.entries(eventTypeCounts).sort((a, b) => b[1] - a[1]);
  const maxEventTypeCount = Math.max(...eventTypeRows.map(([, count]) => count), 0);

  const monthlyCounts = requests.reduce(
    (counts, request) => {
      const key = getMonthKey(request.created_at);
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    },
    {} as Record<string, number>,
  );
  const monthlyRows = Object.entries(monthlyCounts).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxMonthlyCount = Math.max(...monthlyRows.map(([, count]) => count), 0);

  const monthlyRevenue = wonRequests.reduce(
    (counts, request) => {
      const key = getMonthKey(request.closed_at ?? request.updated_at ?? request.created_at);
      counts[key] = (counts[key] ?? 0) + (request.final_total ?? 0);
      return counts;
    },
    {} as Record<string, number>,
  );
  const monthlyRevenueRows = Object.entries(monthlyRevenue).sort((a, b) => a[0].localeCompare(b[0])).slice(-12);
  const maxMonthlyRevenue = Math.max(...monthlyRevenueRows.map(([, revenue]) => revenue), 0);

  return (
    <AdminShell>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0A5458]">Στατιστικά</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f594f]">
          Σύνοψη αιτημάτων, προσφορών και εσόδων.
        </p>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Δεν ήταν δυνατή η φόρτωση των στατιστικών.
        </p>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Σύνολο αιτημάτων" value={formatNumber(totalRequests)} />
        <StatCard label="Νέα αιτήματα" value={formatNumber(newRequests)} />
        <StatCard label="Αιτήματα αυτόν τον μήνα" value={formatNumber(requestsThisMonth)} />
        <StatCard label="Κλεισμένες εκδηλώσεις" value={formatNumber(wonRequests.length)} />
        <StatCard label="Χαμένα αιτήματα" value={formatNumber(lostRequests.length)} />
        <StatCard label="Ποσοστό μετατροπής" value={formatPercent(conversionRate)} />
        <StatCard label="Σύνολο προσφορών" value={formatCurrency(totalQuotedRevenue)} />
        <StatCard label="Κλεισμένα έσοδα" value={formatCurrency(finalClosedRevenue)} />
        <StatCard label="Μέση τιμή ανά άτομο" value={formatCurrency(averagePricePerPerson)} />
        <StatCard label="Μέση αξία εκδήλωσης" value={formatCurrency(averageEventValue)} />
        <StatCard label="Μέσος αριθμός ατόμων" value={formatNumber(averageGuestCount, 1)} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Αιτήματα ανά μήνα</h2>
          <div className="mt-5 space-y-4">
            {monthlyRows.map(([month, count]) => (
              <BarRow key={month} label={getMonthLabel(month)} max={maxMonthlyCount} value={count} />
            ))}
            {monthlyRows.length === 0 ? <p className="text-sm text-[#5f594f]">Δεν υπάρχουν δεδομένα ακόμη.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Έσοδα ανά μήνα</h2>
          <div className="mt-5 space-y-4">
            {monthlyRevenueRows.map(([month, revenue]) => (
              <BarRow key={month} label={getMonthLabel(month)} max={maxMonthlyRevenue} suffix=" €" value={revenue} />
            ))}
            {monthlyRevenueRows.length === 0 ? <p className="text-sm text-[#5f594f]">Δεν υπάρχουν κλεισμένα έσοδα ακόμη.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Αιτήματα ανά είδος εκδήλωσης</h2>
          <div className="mt-5 space-y-4">
            {eventTypeRows.map(([eventType, count]) => (
              <BarRow key={eventType} label={eventType} max={maxEventTypeCount} value={count} />
            ))}
            {eventTypeRows.length === 0 ? <p className="text-sm text-[#5f594f]">Δεν υπάρχουν δεδομένα ακόμη.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-[#d9b76f]/25 bg-white/85 p-5 shadow-lg shadow-[#0A5458]/5">
          <h2 className="text-xl font-semibold text-[#0A5458]">Κατανομή καταστάσεων</h2>
          <div className="mt-5 space-y-4">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div className="grid gap-2 sm:grid-cols-[190px_1fr_70px] sm:items-center" key={status}>
                <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusToneClasses[status as QuoteRequestStatus]}`}>
                  {statusLabels[status as QuoteRequestStatus]}
                </span>
                <div className="h-3 overflow-hidden rounded-full bg-[#f1e5ca]">
                  <div
                    className="h-full rounded-full bg-[#0A5458]"
                    style={{ width: `${maxStatusCount > 0 ? Math.max((count / maxStatusCount) * 100, 4) : 0}%` }}
                  />
                </div>
                <p className="text-sm font-semibold text-[#2f2b25]">{formatNumber(count)}</p>
              </div>
            ))}
            {Object.keys(statusCounts).length === 0 ? <p className="text-sm text-[#5f594f]">Δεν υπάρχουν δεδομένα ακόμη.</p> : null}
          </div>
        </div>
      </section>
    </AdminShell>
  );
}
