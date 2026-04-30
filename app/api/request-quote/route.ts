import nodemailer from "nodemailer";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { QuoteRequestInsert } from "@/lib/crm/types";

export const runtime = "nodejs";

type QuotePayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  date?: unknown;
  eventDate?: unknown;
  location?: unknown;
  eventLocation?: unknown;
  eventType?: unknown;
  guestCount?: unknown;
  interestedIn?: unknown;
  notes?: unknown;
  message?: unknown;
};

const successMessage = "Το αίτημά σου στάλθηκε με επιτυχία. Θα επικοινωνήσουμε σύντομα μαζί σου.";

type NormalizedQuotePayload = {
  name: string;
  phone: string;
  email: string;
  eventDate: string;
  eventLocation: string;
  eventType: string;
  guestCount: string;
  interestedIn: string;
  message: string;
};

const requiredFields: Array<keyof NormalizedQuotePayload> = [
  "name",
  "phone",
  "email",
  "eventType",
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function POST(request: Request) {
  let payload: QuotePayload;

  try {
    payload = (await request.json()) as QuotePayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values: NormalizedQuotePayload = {
    name: getString(payload.name),
    phone: getString(payload.phone),
    email: getString(payload.email),
    eventDate: getString(payload.eventDate) || getString(payload.date),
    eventLocation: getString(payload.eventLocation) || getString(payload.location),
    eventType: getString(payload.eventType),
    guestCount: getString(payload.guestCount),
    interestedIn: getString(payload.interestedIn),
    message: getString(payload.message) || getString(payload.notes),
  };

  const missingFields = requiredFields.filter((field) => !values[field]);

  if (missingFields.length > 0 || !isValidEmail(values.email)) {
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

  const rows = [
    ["Ονοματεπώνυμο", values.name],
    ["Τηλέφωνο", values.phone],
    ["Email", values.email],
    ["Ημερομηνία εκδήλωσης", values.eventDate || "-"],
    ["Τοποθεσία εκδήλωσης", values.eventLocation || "-"],
    ["Τύπος εκδήλωσης", values.eventType],
    ["Αριθμός καλεσμένων", values.guestCount || "-"],
    ["Ενδιαφέρομαι για", values.interestedIn || "-"],
    ["Σημειώσεις", values.message || "Δεν συμπληρώθηκαν"],
  ];

  const text = rows.map(([label, value]) => `${label}: ${value}`).join("\n");
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
    await transporter.sendMail({
      from: smtpUser,
      to: quoteTo,
      replyTo: values.email,
      subject: `Νέο αίτημα προσφοράς - ${values.eventType} - ${values.name}`,
      text,
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;background:#fffaf0;padding:24px;">
          <h1 style="margin:0 0 16px;color:#0A5458;font-size:24px;">Νέο αίτημα προσφοράς</h1>
          <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #eadbb8;">
            ${htmlRows}
          </table>
        </div>
      `,
    });
  } catch {
    return Response.json({ error: "Failed to send email." }, { status: 500 });
  }

  const quoteRequest: QuoteRequestInsert = {
    status: "NEW",
    customer_type: "individual",
    name: values.name,
    phone: values.phone,
    email: values.email,
    invoice_required: false,
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
