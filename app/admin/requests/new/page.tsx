import Link from "next/link";

import { NewRequestForm } from "@/app/admin/requests/new/NewRequestForm";
import { AdminShell } from "@/components/AdminShell";
import { requireAdminSession } from "@/lib/adminAuth";

type NewRequestPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function NewRequestPage({ searchParams }: NewRequestPageProps) {
  await requireAdminSession();

  const messages = await searchParams;

  return (
    <AdminShell>
      <div>
        <Link className="text-sm font-semibold text-[#0A5458] hover:underline" href="/admin/requests">
          Πίσω στα αιτήματα
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#0A5458]">Νέα εγγραφή</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f594f]">
          Καταχώρησε χειροκίνητα ένα νέο αίτημα που ήρθε από τηλέφωνο, email, social ή άλλη πηγή.
        </p>
      </div>

      {messages.error === "1" ? (
        <p className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Δεν ήταν δυνατή η δημιουργία της εγγραφής.
        </p>
      ) : null}

      <NewRequestForm />
    </AdminShell>
  );
}
