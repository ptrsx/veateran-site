import { readFile } from "node:fs/promises";
import path from "node:path";

import * as pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatDate } from "@/lib/crm/formatters";
import { quoteStatusLabels, type Quote, type QuoteItem } from "@/lib/crm/quotes";
import { quoteProductCategoryLabels, quoteProductUnitLabels } from "@/lib/crm/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

let fontsConfigured = false;

function configureFonts() {
  if (fontsConfigured) {
    return;
  }

  pdfMake.addVirtualFileSystem(vfsFonts);
  fontsConfigured = true;
}

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
    unit: String(value.unit) as QuoteItem["unit"],
    quantity: Number(value.quantity) || 0,
    unit_price_net: Number(value.unit_price_net) || 0,
    vat_rate: Number(value.vat_rate) || 0,
    line_total_net: Number(value.line_total_net) || 0,
    sort_order: Number(value.sort_order) || 0,
    notes: typeof value.notes === "string" ? value.notes : null,
  };
}

async function getLogoDataUrl() {
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "brand", "veateran-logo-circle-512.png");
    const logo = await readFile(logoPath);
    return `data:image/png;base64,${logo.toString("base64")}`;
  } catch {
    return null;
  }
}

function detailLine(label: string, value?: string | number | null) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return {
    text: [
      { text: `${label}: `, bold: true, color: "#0A5458" },
      String(value),
    ],
    margin: [0, 0, 0, 4],
  } satisfies Content;
}

function compactContent(items: Array<Content | null>) {
  return items.filter((item): item is Content => item !== null);
}

function getCustomerContent(quote: Quote) {
  const businessDetails =
    quote.customer_type === "business"
      ? compactContent([
          detailLine("Επωνυμία", quote.business_name),
          detailLine("ΑΦΜ", quote.business_vat),
          detailLine("ΔΟΥ", quote.business_tax_office),
          detailLine("Διεύθυνση", quote.business_address),
          detailLine("Όνομα επαφής", quote.contact_name),
          detailLine("Email επαφής", quote.contact_email),
          detailLine("Τηλέφωνο επαφής", quote.contact_phone),
        ])
      : [];

  return compactContent([
    detailLine("Πελάτης", quote.customer_name),
    detailLine("Email", quote.customer_email),
    detailLine("Τηλέφωνο", quote.customer_phone),
    ...businessDetails,
  ]);
}

function getItemsTable(items: QuoteItem[]) {
  const body: TableCell[][] = [
    [
      { text: "Προϊόν", style: "tableHeader" },
      { text: "Κατηγορία", style: "tableHeader" },
      { text: "Μονάδα", style: "tableHeader" },
      { text: "Ποσότητα", style: "tableHeader", alignment: "right" },
      { text: "Τιμή προ ΦΠΑ", style: "tableHeader", alignment: "right" },
      { text: "ΦΠΑ %", style: "tableHeader", alignment: "right" },
      { text: "Σύνολο προ ΦΠΑ", style: "tableHeader", alignment: "right" },
    ],
  ];

  for (const item of items) {
    body.push([
      {
        stack: compactContent([
          { text: item.product_name, bold: true },
          item.notes ? { text: item.notes, color: "#6d6558", fontSize: 8, margin: [0, 2, 0, 0] } : null,
        ]),
      },
      quoteProductCategoryLabels[item.category],
      quoteProductUnitLabels[item.unit],
      { text: String(item.quantity), alignment: "right" },
      { text: formatCurrency(item.unit_price_net), alignment: "right" },
      { text: `${item.vat_rate}%`, alignment: "right" },
      { text: formatCurrency(item.line_total_net), alignment: "right", bold: true },
    ]);
  }

  return {
    table: {
      headerRows: 1,
      widths: ["*", 72, 70, 48, 70, 42, 78],
      body,
    },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex === 0 ? "#0A5458" : rowIndex % 2 === 0 ? "#fffaf0" : null),
      hLineColor: () => "#eadbb8",
      vLineColor: () => "#eadbb8",
      paddingTop: () => 7,
      paddingBottom: () => 7,
      paddingLeft: () => 7,
      paddingRight: () => 7,
    },
  } satisfies Content;
}

function getDocumentDefinition(quote: Quote, items: QuoteItem[], logoDataUrl: string | null): TDocumentDefinitions {
  return {
    pageSize: "A4",
    pageMargins: [42, 42, 42, 54],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: "#2f2b25",
      lineHeight: 1.25,
    },
    styles: {
      title: {
        fontSize: 30,
        bold: true,
        color: "#0A5458",
      },
      sectionTitle: {
        fontSize: 13,
        bold: true,
        color: "#0A5458",
        margin: [0, 0, 0, 8],
      },
      tableHeader: {
        bold: true,
        color: "#ffffff",
        fontSize: 8,
      },
    },
    background: [
      {
        canvas: [
          {
            type: "rect",
            x: 0,
            y: 0,
            w: 595,
            h: 842,
            color: "#fffaf0",
          },
        ],
      },
    ],
    footer: {
      margin: [42, 0, 42, 20],
      columns: [
        { text: "sales@veateran.gr", color: "#0A5458", bold: true },
        { text: "+30 6947 005 008", alignment: "center", color: "#0A5458", bold: true },
        { text: "@theveateran", alignment: "right", color: "#0A5458", bold: true },
      ],
    },
    content: [
      {
        columns: [
          logoDataUrl
            ? { image: logoDataUrl, width: 62, margin: [0, 0, 18, 0] }
            : { text: "The VeatERAN Van", bold: true, color: "#0A5458" },
          {
            stack: [
              { text: "Προσφορά", style: "title" },
              { text: "The VeatERAN Van", color: "#b08934", bold: true, characterSpacing: 1 },
            ],
          },
          {
            stack: compactContent([
              detailLine("Αριθμός προσφοράς", quote.quote_number),
              detailLine("Ημερομηνία", formatDate(quote.created_at)),
              detailLine("Ισχύει έως", formatDate(quote.valid_until)),
              detailLine("Κατάσταση", quoteStatusLabels[quote.status]),
            ]),
            width: 180,
            margin: [0, 2, 0, 0],
          },
        ],
        columnGap: 12,
      },
      {
        canvas: [
          {
            type: "line",
            x1: 0,
            y1: 0,
            x2: 511,
            y2: 0,
            lineColor: "#d9b76f",
            lineWidth: 1,
          },
        ],
        margin: [0, 22, 0, 18],
      },
      {
        columns: [
          {
            stack: [{ text: "Πελάτης", style: "sectionTitle" }, ...getCustomerContent(quote)],
            fillColor: "#ffffff",
            margin: [0, 0, 10, 0],
          },
          {
            stack: compactContent([
              { text: "Εκδήλωση", style: "sectionTitle" },
              detailLine("Τύπος", quote.event_type),
              detailLine("Ημερομηνία", formatDate(quote.event_date)),
              detailLine("Τοποθεσία", quote.event_location),
              detailLine("Άτομα", quote.guest_count),
            ]),
          },
        ],
        columnGap: 28,
      },
      { text: "Προϊόντα & υπηρεσίες", style: "sectionTitle", margin: [0, 24, 0, 10] },
      items.length > 0
        ? getItemsTable(items)
        : {
            text: "Δεν υπάρχουν γραμμές στην προσφορά.",
            color: "#6d6558",
            margin: [0, 0, 0, 12],
          },
      {
        columns: [
          { text: "" },
          {
            width: 210,
            table: {
              widths: ["*", "auto"],
              body: [
                ["Σύνολο προ ΦΠΑ", { text: formatCurrency(quote.subtotal_net), alignment: "right" }],
                ["ΦΠΑ", { text: formatCurrency(quote.vat_amount), alignment: "right" }],
                [
                  { text: "Σύνολο με ΦΠΑ", bold: true, color: "#0A5458" },
                  { text: formatCurrency(quote.total_gross), alignment: "right", bold: true, color: "#0A5458" },
                ],
              ],
            },
            layout: {
              hLineColor: () => "#eadbb8",
              vLineColor: () => "#eadbb8",
              paddingTop: () => 7,
              paddingBottom: () => 7,
              paddingLeft: () => 7,
              paddingRight: () => 7,
            },
            margin: [0, 14, 0, 0],
          },
        ],
      },
      quote.public_notes
        ? [
            { text: "Δημόσιες σημειώσεις", style: "sectionTitle", margin: [0, 22, 0, 8] },
            { text: quote.public_notes },
          ]
        : [],
      quote.terms
        ? [
            { text: "Όροι προσφοράς", style: "sectionTitle", margin: [0, 18, 0, 8] },
            { text: quote.terms, color: "#5f594f" },
          ]
        : [],
    ],
  };
}

export async function GET(request: Request, context: RouteContext<"/admin/quotes/[id]/pdf">) {
  await requireAdminSession();

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const { data: quoteData, error: quoteError } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .single();

  if (quoteError || !quoteData) {
    return new Response("Not found", { status: 404 });
  }

  const quote = normalizeQuote(quoteData as Record<string, unknown>);
  const { data: itemData, error: itemError } = await supabase
    .from("quote_items")
    .select("*")
    .eq("quote_id", quote.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (itemError) {
    return new Response("Could not load quote items", { status: 500 });
  }

  configureFonts();

  const items = (itemData ?? []).map((item) => normalizeQuoteItem(item as Record<string, unknown>));
  const logoDataUrl = await getLogoDataUrl();
  const pdf = pdfMake.createPdf(getDocumentDefinition(quote, items, logoDataUrl));
  const buffer = await pdf.getBuffer();
  const shouldDownload = new URL(request.url).searchParams.get("download") === "1";
  const filename = `veateran-offer-${quote.quote_number}.pdf`;

  await supabase.from("quotes").update({ generated_pdf_at: new Date().toISOString() }).eq("id", quote.id);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
