import { NextResponse } from "next/server";

import {
  adminSessionCookie,
  createAdminSessionCookie,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") ?? "");

  if (!verifyAdminPassword(password)) {
    return NextResponse.redirect(new URL("/admin/login?error=1", request.url), 303);
  }

  const response = NextResponse.redirect(new URL("/admin/requests", request.url), 303);
  response.cookies.set(adminSessionCookie.name, createAdminSessionCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: adminSessionCookie.maxAge,
  });

  return response;
}
