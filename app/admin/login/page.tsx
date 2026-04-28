import { redirect } from "next/navigation";

import { hasAdminSession } from "@/lib/adminAuth";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  if (await hasAdminSession()) {
    redirect("/admin/requests");
  }

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fffaf0] px-4 py-12 text-[#171717]">
      <section className="w-full max-w-md rounded-2xl border border-[#d9b76f]/30 bg-white/85 p-6 shadow-xl shadow-[#0A5458]/10 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b08934]">
          The VeatERAN Van
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0A5458]">
          Σύνδεση στο CRM
        </h1>
        <form action="/api/admin/login" className="mt-8 space-y-5" method="post">
          <label className="block text-sm font-semibold text-[#0A5458]" htmlFor="password">
            Κωδικός πρόσβασης
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-[#d9b76f]/35 bg-white px-4 py-3 text-base outline-none transition focus:border-[#0A5458] focus:ring-4 focus:ring-[#0A5458]/10"
            id="password"
            name="password"
            required
            type="password"
          />
          {params.error === "1" ? (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              Λάθος κωδικός πρόσβασης.
            </p>
          ) : null}
          <button
            className="w-full rounded-full bg-[#0A5458] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#0A5458]/15 transition hover:bg-[#07383b]"
            type="submit"
          >
            Σύνδεση
          </button>
        </form>
      </section>
    </main>
  );
}
