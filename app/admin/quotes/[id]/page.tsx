import Link from "next/link";
import { notFound } from "next/navigation";

import { QuoteEditor } from "@/app/admin/quotes/[id]/QuoteEditor";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";
import { quoteStatusLabels, quoteStatusToneClasses, type Quote, type QuoteItem } from "@/lib/crm/quotes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type QuotePageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
    error?: string;
  }>;
};

function normalizeQuote(value: Record<string, unknown>): Quote {
  return {
    id: String(value.id),
    created_at: String(value.created_at),
    updated_at: String(value.updated_at),
    request_id: String(value.request_id),
    quote_number: String(value.quote_number),
    status: String(value.status) as Quote["status"],
    currency: "EUR",
    valid_until: typeof value.valid_until === "string" ? value.valid_until : null,
    customer_type: String(value.customer_type) as Quote["customer_type"],
    customer_name: String(value.customer_name),
    customer_email: typeof value.customer_email === "string" ? value.customer_email : null,
    customer_phone: typeof value.customer_phone === "string" ? value.customer_phone : null,
    business_name: typeof value.business_name === "string" ? value.business_name : null,
    business_vat: typeof value.business_vat === "string" ? value.business_vat : null,
    business_tax_office: typeof value.business_tax_office === "string" ? value.business_tax_office : null,
    business_address: typeof value.business_address === "string" ? value.business_address : null,
    contact_name: typeof value.contact_name === "string" ? value.contact_name : null,
    contact_email: typeof value.contact_email === "string" ? value.contact_email : null,
    contact_phone: typeof value.contact_phone === "string" ? value.contact_phone : null,
    event_type: typeof value.event_type === "string" ? value.event_type : null,
    event_date: typeof value.event_date === "string" ? value.event_date : null,
    event_location: typeof value.event_location === "string" ? value.event_location : null,
    adult_guest_count:
      value.adult_guest_count === null || value.adult_guest_count === undefined
        ? null
        : Number(value.adult_guest_count),
    child_guest_count:
      value.child_guest_count === null || value.child_guest_count === undefined
        ? null
        : Number(value.child_guest_count),
    guest_count: value.guest_count === null || value.guest_count === undefined ? null : Number(value.guest_count),
    subtotal_net: Number(value.subtotal_net) || 0,
    vat_amount: Number(value.vat_amount) || 0,
    total_gross: Number(value.total_gross) || 0,
    public_notes: typeof value.public_notes === "string" ? value.public_notes : null,
    terms: typeof value.terms === "string" ? value.terms : null,
    internal_notes: typeof value.internal_notes === "string" ? value.internal_notes : null,
    generated_pdf_at: typeof value.generated_pdf_at === "string" ? value.generated_pdf_at : null,
    sent_at: typeof value.sent_at === "string" ? value.sent_at : null,
  };
}

function normalizeQuoteItem(value: Record<string, unknown>): QuoteItem {
  return {
    id: String(value.id),
    created_at: String(value.created_at),
    quote_id: String(value.quote_id),
    product_id: typeof value.product_id === "string" ? value.product_id : null,
    product_name: String(value.product_name),
    category: String(value.category) as QuoteItem["category"],
    audience:
      value.audience === "adult" || value.audience === "child" || value.audience === "service"
        ? value.audience
        : null,
    unit: String(value.unit) as QuoteItem["unit"],
    quantity: Number(value.quantity) || 0,
    unit_price_net: Number(value.unit_price_net) || 0,
    vat_rate: Number(value.vat_rate) || 0,
    line_total_net: Number(value.line_total_net) || 0,
    sort_order: Number(value.sort_order) || 0,
    notes: typeof value.notes === "string" ? value.notes : null,
  };
}

export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  await requireAdminSession();

  const { id } = await params;
  const messages = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (quoteError || !quoteData) {
    notFound();
  }

  const quote = normalizeQuote(quoteData as Record<string, unknown>);
  const { data: itemData, error: itemError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const items = (itemData ?? []).map((item) => normalizeQuoteItem(item as Record<string, unknown>));

  return (
    <AdminShell>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link className="text-sm font-semibold text-[#0A5458] hover:underline" href={`/admin/requests/${quote.request_id}`}>
            Πίσω στο αίτημα
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0A5458]">Προσφορά</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-[#2f2b25]">{quote.quote_number}</span>
            <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${quoteStatusToneClasses[quote.status]}`}>
              {quoteStatusLabels[quote.status]}
            </span>
          </div>
        </div>
      </div>

      {messages.saved === "1" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Οι αλλαγές αποθηκεύτηκαν.
        </p>
      ) : null}
      {messages.error === "1" || itemError ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Δεν ήταν δυνατή η αποθήκευση ή φόρτωση της προσφοράς.
        </p>
      ) : null}

      <QuoteEditor items={items} quote={quote} />
    </AdminShell>
  );
}
