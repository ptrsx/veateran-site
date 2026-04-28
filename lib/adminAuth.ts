import "server-only";

import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const cookieName = "veateran_admin_session";
const sessionMaxAgeSeconds = 60 * 60 * 8;

type AdminSession = {
  role: "admin";
  iat: number;
  exp: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!secret) {
    throw new Error("Missing ADMIN_SESSION_SECRET server environment variable.");
  }

  return secret;
}

function toBase64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function fromBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function verifyAdminPassword(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    throw new Error("Missing ADMIN_PASSWORD server environment variable.");
  }

  const passwordBuffer = Buffer.from(password);
  const adminPasswordBuffer = Buffer.from(adminPassword);

  return (
    passwordBuffer.length === adminPasswordBuffer.length &&
    timingSafeEqual(passwordBuffer, adminPasswordBuffer)
  );
}

export function createAdminSessionCookie() {
  const now = Math.floor(Date.now() / 1000);
  const payload: AdminSession = {
    role: "admin",
    iat: now,
    exp: now + sessionMaxAgeSeconds,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyAdminSessionCookie(value?: string) {
  if (!value) {
    return false;
  }

  const [encodedPayload, signature] = value.split(".");

  if (!encodedPayload || !signature || !signaturesMatch(sign(encodedPayload), signature)) {
    return false;
  }

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as AdminSession;
    const now = Math.floor(Date.now() / 1000);

    return payload.role === "admin" && payload.exp > now;
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionCookie(cookieStore.get(cookieName)?.value);
}

export async function requireAdminSession() {
  if (!(await hasAdminSession())) {
    redirect("/admin/login");
  }
}

export const adminSessionCookie = {
  name: cookieName,
  maxAge: sessionMaxAgeSeconds,
};
