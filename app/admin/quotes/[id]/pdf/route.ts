import { readFile } from "node:fs/promises";
import path from "node:path";

import * as pdfMake from "pdfmake/build/pdfmake";
import vfsFonts from "pdfmake/build/vfs_fonts";
import type { Content, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";

import { requireAdminSession } from "@/lib/adminAuth";
import { formatCurrency, formatDate } from "@/lib/crm/formatters";
import {
  getQuoteItemLineType,
  isConsumablesCost,
  isStaffCost,
  isTransportCost,
  isVanRentalCost,
  type Quote,
  type QuoteItem,
} from "@/lib/crm/quotes";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const brand = {
  teal: "#0A5458",
  gold: "#C59A4B",
  cream: "#F8F4ED",
  paper: "#FCFAF6",
  line: "#D9C7A7",
  darkText: "#2f2b25",
  mutedText: "#6d6558",
};

const greekToLatin: Record<string, string> = {
  α: "a",
  β: "v",
  γ: "g",
  δ: "d",
  ε: "e",
  ζ: "z",
  η: "i",
  θ: "th",
  ι: "i",
  κ: "k",
  λ: "l",
  μ: "m",
  ν: "n",
  ξ: "x",
  ο: "o",
  π: "p",
  ρ: "r",
  σ: "s",
  ς: "s",
  τ: "t",
  υ: "y",
  φ: "f",
  χ: "ch",
  ψ: "ps",
  ω: "o",
};

type QuoteRequestPdfContext = {
  interested_in: string | null;
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
    food_drinks_cost_net: Number(value.food_drinks_cost_net) || 0,
    van_rental_cost_net: Number(value.van_rental_cost_net) || 0,
    transport_cost_net: Number(value.transport_cost_net) || 0,
    staff_cost_net: Number(value.staff_cost_net) || 0,
    consumables_cost_net: Number(value.consumables_cost_net) || 0,
    extra_costs_net: Number(value.extra_costs_net) || 0,
    total_cost_net: Number(value.total_cost_net) || 0,
    margin_percent:
      value.margin_percent === null || value.margin_percent === undefined ? 30 : Number(value.margin_percent),
    offer_net: Number(value.offer_net) || Number(value.subtotal_net) || 0,
    profit_net: Number(value.profit_net) || 0,
    offer_vat_rate:
      value.offer_vat_rate === null || value.offer_vat_rate === undefined ? 24 : Number(value.offer_vat_rate),
    offer_vat_amount: Number(value.offer_vat_amount) || Number(value.vat_amount) || 0,
    offer_gross: Number(value.offer_gross) || Number(value.total_gross) || 0,
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
    line_type:
      value.line_type === "menu" || value.line_type === "service" || value.line_type === "extra"
        ? value.line_type
        : value.audience === "service" || value.category === "service"
          ? "service"
          : "menu",
    is_extra_expense: value.is_extra_expense === true,
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

function compactContent(items: Array<Content | null>) {
  return items.filter((item): item is Content => item !== null);
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

function getGuestDisplay(quote: Quote) {
  const { adultGuestCount, childGuestCount, totalGuestCount } = getQuoteGuestBreakdown(quote);

  if ((adultGuestCount ?? 0) > 0 || (childGuestCount ?? 0) > 0) {
    return `${adultGuestCount ?? 0} ενήλικες + ${childGuestCount ?? 0} παιδιά`;
  }

  return totalGuestCount === null || totalGuestCount === undefined ? null : String(totalGuestCount);
}

function getOfferService(context: QuoteRequestPdfContext | null) {
  return context?.interested_in || "Food & Bar";
}

function getOfferSubtitle(quote: Quote) {
  return quote.event_type ? `Food & Bar για ${quote.event_type}` : "Food & Bar για την εκδήλωσή σας";
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
      fillColor: () => brand.cream,
    },
  } satisfies Content;
}

function getDivider(margin: [number, number, number, number] = [0, 18, 0, 18]) {
  return {
    table: {
      widths: ["*"],
      heights: [1],
      body: [[""]],
    },
    layout: {
      hLineWidth: (rowIndex: number) => (rowIndex === 0 ? 1 : 0),
      vLineWidth: () => 0,
      hLineColor: () => brand.line,
      paddingTop: () => 0,
      paddingBottom: () => 0,
      paddingLeft: () => 0,
      paddingRight: () => 0,
    },
    margin,
  } satisfies Content;
}

function getDetailRows(rows: Array<[string, string | number | null | undefined]>) {
  return rows
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map<TableCell[]>(([label, value]) => [
      { text: label, bold: true, color: brand.teal },
      { text: String(value), color: brand.darkText },
    ]);
}

function getDetailsGrid(quote: Quote, context: QuoteRequestPdfContext | null) {
  const rows = getDetailRows([
    ["Ονοματεπώνυμο / Πελάτης", quote.customer_name],
    ["Τηλέφωνο", quote.customer_phone],
    ["Email", quote.customer_email],
    ["Ημερομηνία εκδήλωσης", formatDate(quote.event_date)],
    ["Τοποθεσία εκδήλωσης", quote.event_location],
    ["Τύπος εκδήλωσης", quote.event_type],
    ["Αριθμός καλεσμένων", getGuestDisplay(quote)],
    ["Υπηρεσία", getOfferService(context)],
  ]);

  const body: TableCell[][] = [];

  for (let index = 0; index < rows.length; index += 2) {
    const first = rows[index];
    const second = rows[index + 1] ?? [{ text: "" }, { text: "" }];
    body.push([first[0], first[1], second[0], second[1]]);
  }

  return {
    table: {
      widths: [95, "*", 95, "*"],
      body,
    },
    layout: {
      hLineColor: () => brand.line,
      vLineColor: () => brand.line,
      paddingTop: () => 7,
      paddingBottom: () => 7,
      paddingLeft: () => 8,
      paddingRight: () => 8,
      fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? brand.paper : "#ffffff"),
    },
  } satisfies Content;
}

function getMenuItemsByCategory(items: QuoteItem[], category: "food" | "drinks") {
  return items.filter((item) => getQuoteItemLineType(item) === "menu" && item.category === category);
}

function getMenuBullets(items: QuoteItem[]) {
  const adultItems = items.filter((item) => item.audience === "adult");
  const childItems = items.filter((item) => item.audience === "child");
  const otherItems = items.filter((item) => item.audience !== "adult" && item.audience !== "child");
  const sections: Content[] = [];

  for (const [title, groupItems] of [
    ["Μενού ενηλίκων", adultItems],
    ["Μενού παιδιών", childItems],
    ["", otherItems],
  ] as const) {
    if (groupItems.length === 0) {
      continue;
    }

    if (title) {
      sections.push({ text: title, bold: true, color: brand.teal, margin: [0, sections.length === 0 ? 0 : 8, 0, 4] });
    }

    sections.push({
      ul: groupItems.map((item) => ({ text: item.product_name, margin: [0, 0, 0, 2] })),
      margin: [0, 0, 0, 2],
    });
  }

  return sections;
}

function getOfferIncludesContent(items: QuoteItem[]) {
  const foodItems = getMenuItemsByCategory(items, "food");
  const drinkItems = getMenuItemsByCategory(items, "drinks");

  return compactContent([
    { text: "Η Προσφορά Περιλαμβάνει", style: "sectionTitle", margin: [0, 22, 0, 10] },
    foodItems.length > 0
      ? {
          stack: [{ text: "Φαγητό", style: "subsectionTitle" }, ...getMenuBullets(foodItems)],
          margin: [0, 0, 0, 12],
        }
      : null,
    drinkItems.length > 0
      ? {
          stack: [{ text: "Ποτά & Αναψυκτικά", style: "subsectionTitle" }, ...getMenuBullets(drinkItems)],
          margin: [0, 0, 0, 12],
        }
      : null,
    foodItems.length === 0 && drinkItems.length === 0
      ? {
          text: "Το μενού θα οριστικοποιηθεί σύμφωνα με τις τελικές επιλογές της εκδήλωσης.",
          color: brand.mutedText,
          margin: [0, 0, 0, 12],
        }
      : null,
  ]);
}

function isCustomerFacingService(item: QuoteItem) {
  const notes = (item.notes ?? "").toLocaleLowerCase("el-GR");
  return !notes.includes("εσωτερ") && !notes.includes("internal");
}

function getIncludedServices(items: QuoteItem[]) {
  const serviceItems = items.filter((item) => getQuoteItemLineType(item) === "service");
  const menuItems = items.filter((item) => getQuoteItemLineType(item) === "menu");
  const labels = new Set<string>();

  if (menuItems.some((item) => item.category === "food")) {
    labels.add("Φαγητό / Μενού");
  }

  if (menuItems.some((item) => item.category === "drinks")) {
    labels.add("Ποτά & αναψυκτικά");
  }

  for (const item of serviceItems) {
    if (isVanRentalCost(item)) {
      labels.add("Ενοικίαση van");
    } else if (isTransportCost(item)) {
      labels.add("Έξοδα μεταφοράς");
    } else if (isStaffCost(item)) {
      labels.add("Προσωπικό");
    } else if (isConsumablesCost(item)) {
      labels.add("Αναλώσιμα");
    } else if (isCustomerFacingService(item)) {
      labels.add(item.product_name);
    }
  }

  return Array.from(labels);
}

function getIncludedServicesContent(items: QuoteItem[]) {
  const services = getIncludedServices(items);

  if (services.length === 0) {
    return [];
  }

  return [
    { text: "Στην προσφορά περιλαμβάνονται", style: "sectionTitle", margin: [0, 18, 0, 8] },
    {
      ul: services.map((service) => ({ text: service, margin: [0, 0, 0, 3] })),
      color: brand.darkText,
    },
  ] satisfies Content[];
}

function getDescriptionContent(quote: Quote) {
  const defaultDescription =
    "Στην εκδήλωση θα στηθεί το The VeatERAN Van ως ένα ολοκληρωμένο food & bar σημείο εξυπηρέτησης, με προσεγμένη παρουσία, φαγητό, ποτά και φιλική εξυπηρέτηση. Η τελική διαμόρφωση μπορεί να προσαρμοστεί ανάλογα με τον χώρο, τον αριθμό καλεσμένων και τις ανάγκες της εκδήλωσης.";

  return compactContent([
    { text: "Περιγραφή Υπηρεσίας", style: "sectionTitle", margin: [0, 16, 0, 8] },
    { text: defaultDescription },
    quote.public_notes ? { text: quote.public_notes, margin: [0, 8, 0, 0] } : null,
  ]);
}

function getFinalOfferNet(quote: Quote) {
  return quote.offer_net || quote.subtotal_net || quote.total_gross || 0;
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

function getDocumentDefinition(
  quote: Quote,
  items: QuoteItem[],
  context: QuoteRequestPdfContext | null,
  logoDataUrl: string | null,
): TDocumentDefinitions {
  const finalAmount = getFinalOfferNet(quote);

  return {
    pageSize: "A4",
    pageMargins: [42, 38, 42, 56],
    defaultStyle: {
      font: "Roboto",
      fontSize: 9.5,
      color: brand.darkText,
      lineHeight: 1.25,
    },
    styles: {
      brandName: {
        fontSize: 18,
        bold: true,
        color: brand.teal,
      },
      title: {
        fontSize: 28,
        bold: true,
        color: brand.teal,
      },
      subtitle: {
        fontSize: 12,
        color: brand.gold,
        bold: true,
      },
      sectionTitle: {
        fontSize: 13,
        bold: true,
        color: brand.teal,
      },
      subsectionTitle: {
        fontSize: 11,
        bold: true,
        color: brand.gold,
        margin: [0, 0, 0, 5],
      },
      offerAmount: {
        fontSize: 24,
        bold: true,
        color: brand.teal,
      },
    },
    background: getPageBackground(),
    footer: {
      margin: [42, 0, 42, 20],
      columns: [
        { text: "sales@veateran.gr", color: brand.teal, bold: true },
        { text: "+30 6947 005 008", alignment: "center", color: brand.teal, bold: true },
        { text: "www.veateran.gr | @theveateran", alignment: "right", color: brand.teal, bold: true },
      ],
    },
    content: [
      {
        columns: [
          logoDataUrl
            ? { image: logoDataUrl, width: 62, margin: [0, 0, 18, 0] }
            : { text: "The VeatERAN Van", style: "brandName" },
          {
            stack: [
              { text: "The VeatERAN Van", style: "brandName" },
              { text: "Προσφορά Εκδήλωσης", style: "title", margin: [0, 4, 0, 0] },
              { text: getOfferSubtitle(quote), style: "subtitle", margin: [0, 4, 0, 0] },
            ],
          },
          {
            stack: [
              { text: `Αριθμός: ${quote.quote_number}`, alignment: "right", color: brand.teal, bold: true },
              { text: `Ημερομηνία: ${formatDate(quote.created_at)}`, alignment: "right", margin: [0, 5, 0, 0] },
              quote.valid_until
                ? { text: `Ισχύει έως: ${formatDate(quote.valid_until)}`, alignment: "right", margin: [0, 3, 0, 0] }
                : { text: "" },
            ],
            width: 165,
          },
        ],
        columnGap: 12,
      },
      getDivider([0, 20, 0, 16]),
      {
        text:
          "Σας ευχαριστούμε που επικοινωνήσατε με το The VeatERAN Van για την εκδήλωσή σας. Παρακάτω θα βρείτε την πρότασή μας, διαμορφωμένη σύμφωνα με τα στοιχεία και τις επιλογές που μας αποστείλατε.",
        color: brand.darkText,
        margin: [0, 0, 0, 18],
      },
      {
        text: "Στοιχεία Εκδήλωσης",
        style: "sectionTitle",
        margin: [0, 0, 0, 8],
      },
      getDetailsGrid(quote, context),
      ...getOfferIncludesContent(items),
      ...getDescriptionContent(quote),
      ...getIncludedServicesContent(items),
      {
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { text: "Συνολική προσφορά:", color: brand.gold, bold: true, alignment: "center" },
                  {
                    text: `${formatCurrency(finalAmount)} + ΦΠΑ`,
                    style: "offerAmount",
                    alignment: "center",
                    margin: [0, 7, 0, 0],
                  },
                ],
                margin: [0, 14, 0, 14],
              },
            ],
          ],
        },
        layout: {
          hLineColor: () => brand.gold,
          vLineColor: () => brand.gold,
          paddingTop: () => 0,
          paddingBottom: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          fillColor: () => brand.paper,
        },
        margin: [42, 24, 42, 0],
      },
      quote.terms
        ? [
            { text: "Όροι", style: "sectionTitle", margin: [0, 18, 0, 8] },
            { text: quote.terms, color: brand.mutedText },
          ]
        : [],
      getDivider([0, 20, 0, 14]),
      {
        text:
          "Θα χαρούμε πολύ να συνεργαστούμε και να συμβάλουμε στην επιτυχία της εκδήλωσής σας. Για οποιαδήποτε διευκρίνιση ή προσαρμογή, είμαστε στη διάθεσή σας.",
        alignment: "center",
        color: brand.teal,
        bold: true,
      },
    ],
  };
}

function transliterateGreek(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split("")
    .map((character) => {
      const lower = character.toLocaleLowerCase("el-GR");
      const transliterated = greekToLatin[lower] ?? character;
      return character === lower ? transliterated : capitalize(transliterated);
    })
    .join("");
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}

function toFilenameSlug(value: string) {
  const transliterated = transliterateGreek(value)
    .replace(/[^A-Za-z0-9]+/g, " ")
    .trim();

  if (!transliterated) {
    return "Offer";
  }

  return transliterated
    .split(/\s+/)
    .map((part) => capitalize(part.toLowerCase()))
    .join("");
}

function getDateStamp(value?: string | null) {
  const date = value ? new Date(value) : new Date();

  if (Number.isNaN(date.getTime())) {
    return getDateStamp(null);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}${month}${day}`;
}

function getPdfFilename(quote: Quote) {
  const source = quote.event_location || quote.business_name || quote.customer_name || quote.quote_number;
  return `Veateran_Offer_${toFilenameSlug(source)}_${getDateStamp(quote.event_date)}.pdf`;
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

  const { data: requestData } = await supabase
    .from("quote_requests")
    .select("interested_in")
    .eq("id", quote.request_id)
    .maybeSingle();

  const contextData: QuoteRequestPdfContext | null = requestData
    ? { interested_in: typeof requestData.interested_in === "string" ? requestData.interested_in : null }
    : null;
  const items = (itemData ?? []).map((item) => normalizeQuoteItem(item as Record<string, unknown>));
  const shouldDownload = new URL(request.url).searchParams.get("download") === "1";
  const filename = getPdfFilename(quote);

  try {
    configureFonts();

    const logoDataUrl = await getLogoDataUrl();
    const documentDefinition = getDocumentDefinition(quote, items, contextData, logoDataUrl);
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
