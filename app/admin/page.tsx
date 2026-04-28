import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/adminAuth";

export default async function AdminPage() {
  if (await hasAdminSession()) {
    redirect("/admin/requests");
  }

  redirect("/admin/login");
}
