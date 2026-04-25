import nodemailer from "nodemailer";

export const runtime = "nodejs";

type QuotePayload = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  eventDate?: unknown;
  location?: unknown;
  eventType?: unknown;
  guestCount?: unknown;
  interest?: unknown;
  message?: unknown;
};

const requiredFields: Array<keyof QuotePayload> = [
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

export async function POST(request: Request) {
  let payload: QuotePayload;

  try {
    payload = (await request.json()) as QuotePayload;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const values = {
    name: getString(payload.name),
    phone: getString(payload.phone),
    email: getString(payload.email),
    eventDate: getString(payload.eventDate),
    location: getString(payload.location),
    eventType: getString(payload.eventType),
    guestCount: getString(payload.guestCount),
    interest: getString(payload.interest),
    message: getString(payload.message),
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
    ["Τοποθεσία εκδήλωσης", values.location || "-"],
    ["Τύπος εκδήλωσης", values.eventType],
    ["Αριθμός καλεσμένων", values.guestCount || "-"],
    ["Ενδιαφέρομαι για", values.interest || "-"],
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

  return Response.json({ ok: true });
}
