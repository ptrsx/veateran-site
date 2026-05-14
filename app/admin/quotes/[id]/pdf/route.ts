import { readFile } from "node:fs/promises";
import path from "node:path";

import * as pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatDate } from "@/lib/crm/formatters";
import { quoteItemGroupLabels, quoteStatusLabels, type Quote, type QuoteItem } from "@/lib/crm/quotes";
import { quoteProductCategoryLabels, quoteProductUnitLabels } from "@/lib/crm/products";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const brand = {
  teal: "#0A5458",
  ivory: "#fffaf0",
  softGold: "#d9b76f",
  paleGold: "#eadbb8",
  darkText: "#2f2b25",
  mutedText: "#6d6558",
  termsText: "#5f594f",
};

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
      { text: `${label}: `, bold: true, color: brand.teal },
      String(value),
    ],
    margin: [0, 0, 0, 4],
  } satisfies Content;
}

function compactContent(items: Array<Content | null>) {
  return items.filter((item): item is Content => item !== null);
}

function getPageBackground() {
  return {
    table: {
      widths: [595],
      heights: [842],
      body: [[""]],
    },
    layout: {
      hLineWidth: () => 0,
      vLineWidth: () => 0,
      paddingTop: () => 0,
      paddingBottom: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
      fillColor: () => brand.ivory,
    },
  } satisfies Content;
}

function getGoldDivider() {
  return {
    table: {
      widths: ["*"],
      heights: [1],
      body: [[""]],
    },
    layout: {
      hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => brand.softGold,
      paddingTop: () => 0,
      paddingBottom: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    margin: [0, 22, 0, 18],
  } satisfies Content;
}

function assertCanvasValuesAreArrays(value: unknown, pathName = "documentDefinition") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertCanvasValuesAreArrays(item, `${pathName}[${index}]`));
    return;
  }

  if (!value || typeof value !== "object") {
    return;
  }

  const record = value as Record<string, unknown>;

  if ("canvas" in record && !Array.isArray(record.canvas)) {
    throw new Error(`Invalid pdfmake canvas at ${pathName}.canvas. Expected an array.`);
  }

  for (const [key, child] of Object.entries(record)) {
    if (typeof child !== "function") {
      assertCanvasValuesAreArrays(child, `${pathName}.${key}`);
    }
  }
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

function getQuoteGuestBreakdown(quote: Quote) {
  const adultGuestCount = quote.adult_guest_count ?? quote.guest_count;
  const childGuestCount = quote.child_guest_count ?? 0;
  const totalGuestCount =
    quote.guest_count ??
    ((adultGuestCount ?? 0) + (childGuestCount ?? 0) || null);

  return {
    adultGuestCount,
    childGuestCount,
    totalGuestCount,
  };
}

function getItemGroup(item: QuoteItem) {
  if (item.audience === "adult" || item.audience === "child" || item.audience === "service") {
    return item.audience;
  }

  return item.category === "service" ? "service" : "other";
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
          item.notes ? { text: item.notes, color: brand.mutedText, fontSize: 8, margin: [0, 2, 0, 0] } : null,
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
      fillColor: (rowIndex: number) => (rowIndex === 0 ? brand.teal : rowIndex % 2 === 0 ? brand.ivory : null),
      hLineColor: () => brand.paleGold,
      vLineColor: () => brand.paleGold,
      paddingTop: () => 7,
      paddingBottom: () => 7,
      paddingLeft: () => 7,
      paddingRight: () => 7,
    },
  } satisfies Content;
}

function getItemsContent(quote: Quote, items: QuoteItem[]) {
  const guestBreakdown = getQuoteGuestBreakdown(quote);
  const groups = (["adult", "child", "service", "other"] as const)
    .map((group) => {
      const groupItems = items.filter((item) => getItemGroup(item) === group);
      const enabled =
        (group === "adult" && (guestBreakdown.adultGuestCount ?? 0) > 0) ||
        (group === "child" && (guestBreakdown.childGuestCount ?? 0) > 0) ||
        group === "service" ||
        group === "other";

      return {
        group,
        items: enabled ? groupItems : [],
      };
    })
    .filter((group) => group.items.length > 0);

  if (groups.length === 0) {
    return [
      {
        text: "Δεν υπάρχουν γραμμές στην προσφορά.",
        color: brand.mutedText,
        margin: [0, 0, 0, 12],
      },
    ] satisfies Content[];
  }

  return groups.flatMap((group) => [
    {
      text: quoteItemGroupLabels[group.group],
      style: "sectionTitle",
      margin: [0, group.group === groups[0].group ? 0 : 18, 0, 8],
    } satisfies Content,
    getItemsTable(group.items),
  ]);
}

function getDocumentDefinition(quote: Quote, items: QuoteItem[], logoDataUrl: string | null): TDocumentDefinitions {
  const guestBreakdown = getQuoteGuestBreakdown(quote);

  return {
    pageSize: "A4",
    pageMargins: [42, 42, 42, 54],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9,
      color: brand.darkText,
      lineHeight: 1.25,
    },
    styles: {
      title: {
        fontSize: 30,
        bold: true,
        color: brand.teal,
      },
      sectionTitle: {
        fontSize: 13,
        bold: true,
        color: brand.teal,
        margin: [0, 0, 0, 8],
      },
      tableHeader: {
        bold: true,
        color: "#ffffff",
        fontSize: 8,
      },
    },
    background: getPageBackground(),
    footer: {
      margin: [42, 0, 42, 20],
      columns: [
        { text: "sales@veateran.gr", color: brand.teal, bold: true },
        { text: "+30 6947 005 008", alignment: "center", color: brand.teal, bold: true },
        { text: "@theveateran", alignment: "right", color: brand.teal, bold: true },
      ],
    },
    content: [
      {
        columns: [
          logoDataUrl
            ? { image: logoDataUrl, width: 62, margin: [0, 0, 18, 0] }
            : { text: "The VeatERAN Van", bold: true, color: brand.teal },
          {
            stack: [
              { text: "Προσφορά", style: "title" },
              { text: "The VeatERAN Van", color: brand.softGold, bold: true, characterSpacing: 1 },
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
      getGoldDivider(),
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
              detailLine("Ενήλικες", guestBreakdown.adultGuestCount),
              detailLine("Παιδιά", guestBreakdown.childGuestCount),
              detailLine("Σύνολο", guestBreakdown.totalGuestCount),
            ]),
          },
        ],
        columnGap: 28,
      },
      { text: "Προϊόντα & υπηρεσίες", style: "sectionTitle", margin: [0, 24, 0, 10] },
      ...getItemsContent(quote, items),
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
                  { text: "Σύνολο με ΦΠΑ", bold: true, color: brand.teal },
                  { text: formatCurrency(quote.total_gross), alignment: "right", bold: true, color: brand.teal },
                ],
              ],
            },
            layout: {
              hLineColor: () => brand.paleGold,
              vLineColor: () => brand.paleGold,
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
            { text: quote.terms, color: brand.termsText },
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
    console.error("Failed to load quote items for quote PDF.", itemError);
    return new Response("Could not load quote items", { status: 500 });
  }

  const items = (itemData ?? []).map((item) => normalizeQuoteItem(item as Record<string, unknown>));
  const shouldDownload = new URL(request.url).searchParams.get("download") === "1";
  const filename = `veateran-offer-${quote.quote_number}.pdf`;

  try {
    configureFonts();

    const logoDataUrl = await getLogoDataUrl();
    const documentDefinition = getDocumentDefinition(quote, items, logoDataUrl);
    assertCanvasValuesAreArrays(documentDefinition);

    const pdf = pdfMake.createPdf(documentDefinition);
    const buffer = await pdf.getBuffer();
    const { error: pdfTimestampError } = await supabase
      .from("quotes")
      .update({ generated_pdf_at: new Date().toISOString() })
      .eq("id", quote.id);

    if (pdfTimestampError) {
      console.error("Failed to update quote PDF timestamp.", pdfTimestampError);
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${shouldDownload ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Failed to generate quote PDF.", error);
    return new Response("Could not generate quote PDF", {
      status: 500,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }
}
