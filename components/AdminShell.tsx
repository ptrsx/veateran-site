import Link from "next/link";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#fffaf0] text-[#171717]">
      <div className="border-b border-[#d9b76f]/25 bg-white/85">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#b08934]">
              The VeatERAN Van
            </p>
            <p className="mt-1 text-xl font-semibold text-[#0A5458]">CRM</p>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold text-[#0A5458]">
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#0A5458]/10" href="/admin/requests">
              Αιτήματα
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#0A5458]/10" href="/admin/stats">
              Στατιστικά
            </Link>
            <Link className="rounded-full px-4 py-2 transition hover:bg-[#0A5458]/10" href="/">
              Πίσω στο site
            </Link>
            <form action="/api/admin/logout" method="post">
              <button
                className="rounded-full bg-[#0A5458] px-4 py-2 text-white transition hover:bg-[#07383b]"
                type="submit"
              >
                Αποσύνδεση
              </button>
            </form>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </main>
  );
}
