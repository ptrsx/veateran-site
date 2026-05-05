import nodemailer from "nodemailer";

import { customerTypeLabels, isQuoteRequestCustomerType } from "@/lib/crm/customerType";
import {
  groupQuoteMenuItems,
  normalizeSelectedMenuItems,
  quoteMenuCategoryLabels,
  type QuoteMenuItem,
  type QuoteMenuItemCategory,
} from "@/lib/crm/menuItems";
import type { QuoteRequestCustomerType, QuoteRequestInsert } from "@/lib/crm/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type QuotePayload = Record<string, unknown>;

const successMessage = "Το αίτημά σου στάλθηκε με επιτυχία. Θα επικοινωνήσουμε σύντομα μαζί σου.";

type NormalizedQuotePayload = {
  customerType: QuoteRequestCustomerType;
  name: string;
  phone: string;
  email: string;
  businessName: string;
  businessVat: string;
  businessTaxOffice: string;
  businessAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  invoiceRequired: boolean;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  guestCount: string;
  interestedIn: string;
  message: string;
  selectedMenuItems: QuoteMenuItem[];
};

const menuCategories: QuoteMenuItemCategory[] = ["food", "drinks"];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getFirstString(payload: QuotePayload, keys: string[]) {
  for (const key of keys) {
    const value = getString(payload[key]);

    if (value) {
      return value;
    }
  }

  return "";
}

function getBoolean(value: unknown) {
  return value === true || value === "true" || value === "1" || value === 1;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getNullableString(value: string) {
  return value || null;
}

function getNullablePositiveInteger(value: string) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function getCustomerType(value: unknown): QuoteRequestCustomerType {
  const candidate = getString(value);
  return isQuoteRequestCustomerType(candidate) ? candidate : "individual";
}

function getSelectedMenuItems(payload: QuotePayload) {
  return normalizeSelectedMenuItems(payload.selectedMenuItems ?? payload.selected_menu_items);
}

function getMenuText(items: QuoteMenuItem[]) {
  if (items.length === 0) {
    return "";
  }

  const grouped = groupQuoteMenuItems(items);
  const sections = menuCategories
    .filter((category) => grouped[category].length > 0)
    .map((category) => {
      const itemLines = grouped[category].map((item) => `- ${item.label}`).join("\n");
      return `${quoteMenuCategoryLabels[category]}:\n${itemLines}`;
    });

  return `Επιλογές μενού:\n${sections.join("\n\n")}`;
}

function getMenuHtml(items: QuoteMenuItem[]) {
  if (items.length === 0) {
    return "";
  }

  const grouped = groupQuoteMenuItems(items);
  const sections = menuCategories
    .filter((category) => grouped[category].length > 0)
    .map(
      (category) => `
        <div style="margin-top:14px;">
          <h3 style="margin:0 0 8px;color:#0A5458;font-size:15px;">${escapeHtml(quoteMenuCategoryLabels[category])}</h3>
          <ul style="margin:0;padding-left:18px;color:#171717;">
            ${grouped[category].map((item) => `<li>${escapeHtml(item.label)}</li>`).join("")}
          </ul>
        </div>
      `,
    )
    .join("");

  return `
    <div style="margin-top:18px;padding:16px;background:#ffffff;border:1px solid #eadbb8;">
      <h2 style="margin:0;color:#0A5458;font-size:18px;">Επιλογές μενού</h2>
      ${sections}
    </div>
  `;
}

function normalizePayload(payload: QuotePayload): NormalizedQuotePayload {
  const customerType = getCustomerType(payload.customerType ?? payload.customer_type);
  const invoiceRequired = getBoolean(payload.invoiceRequired ?? payload.invoice_required);
  const eventDate = getFirstString(payload, ["eventDate", "date", "event_date"]);
  const eventLocation = getFirstString(payload, ["eventLocation", "location"]);
  const eventType = getFirstString(payload, ["eventType", "event_type"]);
  const guestCount = getFirstString(payload, ["guestCount", "guest_count"]);
  const interestedIn = getFirstString(payload, ["interestedIn", "interested_in"]);
  const message = getFirstString(payload, ["message", "notes"]);
  const selectedMenuItems = getSelectedMenuItems(payload);

  if (customerType === "business") {
    const businessName = getFirstString(payload, ["businessName", "business_name"]);
    const businessVat = getFirstString(payload, ["businessVat", "business_vat"]);
    const businessTaxOffice = getFirstString(payload, ["businessTaxOffice", "business_tax_office"]);
    const businessAddress = getFirstString(payload, ["businessAddress", "business_address"]);
    const contactName = getFirstString(payload, ["contactName", "contact_name"]);
    const contactPhone = getFirstString(payload, ["contactPhone", "contact_phone", "phone"]);
    const contactEmail = getFirstString(payload, ["contactEmail", "contact_email", "email"]);

    return {
      customerType,
      name: contactName,
      phone: contactPhone,
      email: contactEmail,
      businessName,
      businessVat,
      businessTaxOffice,
      businessAddress,
      contactName,
      contactPhone,
      contactEmail,
      invoiceRequired,
      eventDate,
      eventLocation,
      eventType,
      guestCount,
      interestedIn,
      message,
      selectedMenuItems,
    };
  }

  const name = getFirstString(payload, ["name"]);
  const phone = getFirstString(payload, ["phone"]);
  const email = getFirstString(payload, ["email"]);

  return {
    customerType,
    name,
    phone,
    email,
    businessName: "",
    businessVat: "",
    businessTaxOffice: "",
    businessAddress: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    invoiceRequired: false,
    eventDate,
    eventLocation,
    eventType,
    guestCount,
    interestedIn,
    message,
    selectedMenuItems,
  };
}

function isValidPayload(values: NormalizedQuotePayload) {
  if (!values.eventType) {
    return false;
  }

  if (values.customerType === "business") {
    const hasContactMethod = Boolean(values.contactPhone || values.contactEmail);
    const hasInvoiceDetails =
      !values.invoiceRequired ||
      Boolean(values.businessVat && values.businessTaxOffice && values.businessAddress);
    const hasValidContactEmail = !values.contactEmail || isValidEmail(values.contactEmail);

    return Boolean(
      values.businessName &&
        values.contactName &&
        hasContactMethod &&
        hasInvoiceDetails &&
        hasValidContactEmail,
    );
  }

  return Boolean(values.name && values.phone && values.email && isValidEmail(values.email));
}

function getEmailRows(values: NormalizedQuotePayload) {
  const customerRows: Array<[string, string]> =
    values.customerType === "business"
      ? [
          ["Τύπος πελάτη", customerTypeLabels.business],
          ["Επωνυμία", values.businessName],
          ["ΑΦΜ", values.businessVat || "-"],
          ["ΔΟΥ", values.businessTaxOffice || "-"],
          ["Διεύθυνση", values.businessAddress || "-"],
          ["Έκδοση τιμολογίου", values.invoiceRequired ? "Ναι" : "Όχι"],
          ["Όνομα επαφής", values.contactName],
          ["Τηλέφωνο επαφής", values.contactPhone || "-"],
          ["Email επαφής", values.contactEmail || "-"],
        ]
      : [
          ["Τύπος πελάτη", customerTypeLabels.individual],
          ["Ονοματεπώνυμο", values.name],
          ["Τηλέφωνο", values.phone],
          ["Email", values.email],
        ];

  return [
    ...customerRows,
    ["Ημερομηνία εκδήλωσης", values.eventDate || "-"],
    ["Τοποθεσία εκδήλωσης", values.eventLocation || "-"],
    ["Τύπος εκδήλωσης", values.eventType],
    ["Αριθμός καλεσμένων", values.guestCount || "-"],
    ["Ενδιαφέρομαι για", values.interestedIn || "-"],
    ["Σημειώσεις", values.message || "Δεν συμπληρώθηκαν"],
  ];
}

export async function POST(request: Request) {
  let payload: QuotePayload;

  try {
    payload = (await request.json()) as QuotePayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values = normalizePayload(payload);

  if (!isValidPayload(values)) {
    return Response.json({ error: "Missing or invalid required fields." }, { status: 400 });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT);
  const smtpSecure = process.env.SMTP_SECURE === "true";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const quoteTo = process.env.QUOTE_TO;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass || !quoteTo) {
    return Response.json({ error: "Email service is not configured." }, { status: 500 });
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  const rows = getEmailRows(values);
  const menuText = getMenuText(values.selectedMenuItems);
  const text = [rows.map(([label, value]) => `${label}: ${value}`).join("\n"), menuText]
    .filter(Boolean)
    .join("\n\n");
  const htmlRows = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #eadbb8;font-weight:700;color:#0A5458;">${escapeHtml(label)}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #eadbb8;color:#171717;">${escapeHtml(value)}</td>
        </tr>
      `,
    )
    .join("");

  try {
    const subjectName = values.customerType === "business" ? values.businessName : values.name;

    await transporter.sendMail({
      from: smtpUser,
      to: quoteTo,
      replyTo: values.email || undefined,
      subject: `Νέο αίτημα προσφοράς - ${values.eventType} - ${subjectName}`,
      text,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#fffaf0;padding:24px;">
          <h1 style="margin:0 0 16px;color:#0A5458;font-size:24px;">Νέο αίτημα προσφοράς</h1>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #eadbb8;">
            ${htmlRows}
          </table>
          ${getMenuHtml(values.selectedMenuItems)}
        </div>
      `,
    });
  } catch {
    return Response.json({ error: "Failed to send email." }, { status: 500 });
  }

  const quoteRequest: QuoteRequestInsert = {
    status: "NEW",
    customer_type: values.customerType,
    name: values.name,
    phone: getNullableString(values.phone),
    email: getNullableString(values.email),
    business_name: values.customerType === "business" ? values.businessName : null,
    business_vat: values.customerType === "business" ? getNullableString(values.businessVat) : null,
    business_tax_office:
      values.customerType === "business" ? getNullableString(values.businessTaxOffice) : null,
    business_address: values.customerType === "business" ? getNullableString(values.businessAddress) : null,
    contact_name: values.customerType === "business" ? values.contactName : null,
    contact_phone: values.customerType === "business" ? getNullableString(values.contactPhone) : null,
    contact_email: values.customerType === "business" ? getNullableString(values.contactEmail) : null,
    invoice_required: values.invoiceRequired,
    selected_menu_items: values.selectedMenuItems,
    event_type: values.eventType,
    event_date: getNullableString(values.eventDate),
    location: getNullableString(values.eventLocation),
    guest_count: getNullablePositiveInteger(values.guestCount),
    interested_in: getNullableString(values.interestedIn),
    notes: getNullableString(values.message),
    source: "website",
  };

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("quote_requests").insert(quoteRequest);

    if (error) {
      console.error("Failed to save quote request to Supabase.", error);
    }
  } catch (error) {
    console.error("Failed to save quote request to Supabase.", error);
  }

  return Response.json({ ok: true, message: successMessage });
}
