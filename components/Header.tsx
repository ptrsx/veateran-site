import { homepageNav } from "@/lib/homepage-data";

export function Header() {
  const mobileNav = [...homepageNav, { label: "Ζήτησε Προσφορά", href: "#quote" }];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#062f32]/88 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 sm:px-8">
        <a href="#" className="group flex items-center gap-3" aria-label="The VeatERAN Van">
          <span className="grid size-9 place-items-center rounded-full border border-[#d9b76f]/60 bg-[#f7f0df] text-sm font-semibold text-[#0A5458] shadow-[0_0_24px_rgba(217,183,111,0.2)]">
            V
          </span>
          <span className="leading-none">
            <span className="block text-xs font-semibold uppercase tracking-[0.22em] text-white">
              The VeatERAN
            </span>
            <span className="mt-1 block text-[11px] uppercase tracking-[0.34em] text-[#d9b76f]">
              Van
            </span>
          </span>
        </a>
        <nav className="hidden items-center gap-8 text-sm text-white/78 md:flex">
          {homepageNav.map((item) => (
            <a key={item.href} href={item.href} className="transition hover:text-[#f3d58f]">
              {item.label}
            </a>
          ))}
        </nav>
        <a
          href="#quote"
          className="hidden rounded-full border border-[#d9b76f]/50 bg-[#d9b76f] px-5 py-2.5 text-sm font-semibold text-[#082f31] shadow-lg shadow-black/10 transition hover:bg-[#f1d993] md:inline-flex"
        >
          Ζήτησε Προσφορά
        </a>
        <details className="group relative md:hidden">
          <summary className="cursor-pointer list-none rounded-full border border-[#d9b76f]/45 px-4 py-2 text-sm font-semibold text-white transition hover:border-[#d9b76f] hover:text-[#f3d58f] [&::-webkit-details-marker]:hidden">
            Menu
          </summary>
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-[#d9b76f]/25 bg-[#062f32] p-2 shadow-2xl shadow-black/25">
            {mobileNav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm text-white/78 transition hover:bg-white/[0.06] hover:text-[#f3d58f]"
              >
                {item.label}
              </a>
            ))}
          </div>
        </details>
      </div>
    </header>
  );
}
