export function Footer() {
  return (
    <footer className="bg-[#111] px-5 py-12 text-white sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em]">The VeatERAN Van</p>
          <p className="mt-3 text-sm text-white/55">Βάση στην Αθήνα. Εκδηλώσεις σε όλη την Ελλάδα.</p>
        </div>
        <div className="flex flex-wrap gap-5 text-sm text-white/68">
          <a href="#services" className="hover:text-[#f3d58f]">Υπηρεσίες</a>
          <a href="#menu" className="hover:text-[#f3d58f]">Μενού</a>
          <a href="#events" className="hover:text-[#f3d58f]">Εκδηλώσεις</a>
          <a href="tel:+306947005008" className="hover:text-[#f3d58f]">+30 6947 005 008</a>
          <a href="mailto:sales@veateran.gr" className="hover:text-[#f3d58f]">sales@veateran.gr</a>
        </div>
      </div>
    </footer>
  );
}
