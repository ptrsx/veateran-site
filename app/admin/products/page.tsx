import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";
import type { QuoteProduct } from "@/lib/crm/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { ProductCatalogTable } from "./ProductCatalogTable";

type ProductsPageProps = {
  searchParams: Promise<{
    created?: string;
    saved?: string;
    error?: string;
  }>;
};

function normalizeProduct(product: Record<string, unknown>): QuoteProduct {
  return {
    id: String(product.id),
    created_at: String(product.created_at),
    updated_at: String(product.updated_at),
    name: String(product.name),
    category: String(product.category) as QuoteProduct["category"],
    unit: String(product.unit) as QuoteProduct["unit"],
    price_net: Number(product.price_net) || 0,
    vat_rate: Number(product.vat_rate) || 0,
    is_active: product.is_active === true,
    sort_order: Number(product.sort_order) || 0,
    notes: typeof product.notes === "string" ? product.notes : null,
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  await requireAdminSession();

  const messages = await searchParams;
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quote_products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("category", { ascending: true })
    .order("name", { ascending: true });
  const products = (data ?? []).map((product) => normalizeProduct(product as Record<string, unknown>));

  return (
    <AdminShell>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-[#0A5458]">Προϊόντα & τιμές</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f594f]">
          Ορισμός προϊόντων και τιμών προ ΦΠΑ για τη δημιουργία προσφορών.
        </p>
      </div>

      {messages.created === "1" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Το προϊόν δημιουργήθηκε.
        </p>
      ) : null}
      {messages.saved === "1" ? (
        <p className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-800">
          Οι αλλαγές αποθηκεύτηκαν.
        </p>
      ) : null}
      {messages.error === "1" || error ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Δεν ήταν δυνατή η αποθήκευση ή φόρτωση των προϊόντων.
        </p>
      ) : null}

      <ProductCatalogTable products={products} />
    </AdminShell>
  );
}
