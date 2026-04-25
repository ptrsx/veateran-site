export function FinalCta() {
  return (
    <section id="quote" className="bg-[#0A5458] px-5 py-20 text-white sm:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#f3d58f]">Κλείσε το van</p>
        <h2 className="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">
          Θέλεις το The VeatERAN Van στο επόμενο event σου;
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-white/76">
          Στείλε μας λίγες λεπτομέρειες και θα ετοιμάσουμε πρόταση με menu,
          κόστος και διαθέσιμη ημερομηνία. Βάση στην Αθήνα, με παρουσία σε
          εκδηλώσεις σε όλη την Ελλάδα.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href="/request-quote" className="rounded-full bg-[#d9b76f] px-7 py-3.5 text-sm font-bold text-[#082f31] transition hover:bg-[#f1d993]">
            Ζήτησε Προσφορά
          </a>
          <a href="tel:+306947005008" className="rounded-full border border-white/25 px-7 py-3.5 text-sm font-bold text-white transition hover:border-[#d9b76f] hover:text-[#f3d58f]">
            +30 6947 005 008
          </a>
        </div>
      </div>
    </section>
  );
}
